// Hono 统一路由层

import { Hono } from 'hono';
import type { Storage } from './storage/interface';
import type { AppConfig, SourceEntry, MacCMSSourceEntry, LiveSourceEntry } from './core/types';
import { KV_MERGED_CONFIG, KV_MERGED_CONFIG_FULL, KV_MANUAL_SOURCES, KV_LAST_UPDATE, KV_MACCMS_SOURCES, KV_LIVE_SOURCES, KV_BLACKLIST, LIVE_PROXY_TTL } from './core/config';
import { validateMacCMS } from './core/maccms';
import { lookupJarUrl, isMd5Key } from './core/jar-proxy';
import { lookupLiveUrl } from './core/live-source';
import { adminHtml } from './core/admin';
import { dashboardHtml } from './core/dashboard';
import { configEditorHtml } from './core/config-editor';
import { siteFingerprint, loadBlacklist, saveBlacklist } from './core/blacklist';
import type { TVBoxConfig } from './core/types';

export interface AppDeps {
  storage: Storage;
  config: AppConfig;
  triggerRefresh: () => Promise<void>;
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  const { storage, config } = deps;

  // ─── 主配置 ────────────────────────────────────────────
  app.get('/', async (c) => {
    const cached = await storage.get(KV_MERGED_CONFIG);

    if (!cached) {
      return c.json(
        { error: 'No config available yet. Add sources in /admin and trigger a refresh.' },
        503,
      );
    }

    return c.body(cached, 200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
      'Access-Control-Allow-Origin': '*',
    });
  });

  // ─── 纯直播配置 ────────────────────────────────────────
  app.get('/live-config', async (c) => {
    const cached = await storage.get(KV_MERGED_CONFIG);

    if (!cached) {
      return c.json({ error: 'No config available yet.' }, 503);
    }

    try {
      const full = JSON.parse(cached);
      const liveConfig = { lives: full.lives || [] };
      return c.body(JSON.stringify(liveConfig), 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': '*',
      });
    } catch {
      return c.json({ error: 'Config parse error' }, 500);
    }
  });

  // ─── 监控面板 ──────────────────────────────────────────
  app.get('/status', (c) => {
    return c.html(dashboardHtml);
  });

  app.get('/status-data', async (c) => {
    const lastUpdate = await storage.get(KV_LAST_UPDATE);
    const sources = await storage.get(KV_MANUAL_SOURCES);
    const macCMSSources = await storage.get(KV_MACCMS_SOURCES);
    const liveSources = await storage.get(KV_LIVE_SOURCES);
    const cached = await storage.get(KV_MERGED_CONFIG);

    let siteCount = 0;
    let parseCount = 0;
    let liveCount = 0;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        siteCount = parsed.sites?.length || 0;
        parseCount = parsed.parses?.length || 0;
        liveCount = parsed.lives?.length || 0;
      } catch {
        // ignore
      }
    }

    return c.json({
      lastUpdate: lastUpdate || 'never',
      sourceCount: sources ? JSON.parse(sources).length : 0,
      macCMSCount: macCMSSources ? JSON.parse(macCMSSources).length : 0,
      liveSourceCount: liveSources ? JSON.parse(liveSources).length : 0,
      sites: siteCount,
      parses: parseCount,
      lives: liveCount,
    });
  });

  // ─── Admin 页面 ────────────────────────────────────────
  app.get('/admin', (c) => {
    return c.html(adminHtml);
  });

  // ─── Admin API（需鉴权）────────────────────────────────
  app.get('/admin/sources', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const raw = await storage.get(KV_MANUAL_SOURCES);
    const sources: SourceEntry[] = raw ? JSON.parse(raw) : [];
    return c.json(sources);
  });

  app.post('/admin/sources', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { name?: string; url?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const url = body.url?.trim();
    if (!url) return c.json({ error: 'URL is required' }, 400);

    try {
      new URL(url);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    const name = body.name?.trim() || '';
    const raw = await storage.get(KV_MANUAL_SOURCES);
    const sources: SourceEntry[] = raw ? JSON.parse(raw) : [];

    if (sources.some((s) => s.url === url)) {
      return c.json({ error: 'Source already exists' }, 409);
    }

    sources.push({ name, url });
    await storage.put(KV_MANUAL_SOURCES, JSON.stringify(sources));

    return c.json({ success: true });
  });

  app.delete('/admin/sources', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { url?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const url = body.url?.trim();
    if (!url) return c.json({ error: 'URL is required' }, 400);

    const raw = await storage.get(KV_MANUAL_SOURCES);
    const sources: SourceEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = sources.filter((s) => s.url !== url);
    await storage.put(KV_MANUAL_SOURCES, JSON.stringify(filtered));

    return c.json({ success: true });
  });

  // ─── MacCMS 边缘代理（仅 CF 版）──────────────────────
  if (config.workerBaseUrl) {
    app.all('/api/:key', async (c) => {
      const key = c.req.param('key');
      const raw = await storage.get(KV_MACCMS_SOURCES);
      const sources: MacCMSSourceEntry[] = raw ? JSON.parse(raw) : [];
      const source = sources.find((s) => s.key === key);

      if (!source) {
        return c.json({ error: 'Unknown MacCMS source' }, 404);
      }

      try {
        const targetUrl = new URL(source.api);
        const reqUrl = new URL(c.req.url);
        reqUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));

        const resp = await fetch(targetUrl.toString());
        const data = await resp.json();

        return c.json(data, 200, {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return c.json({ error: msg }, 502);
      }
    });
  }

  // ─── JAR 代理（仅 CF 版）─────────────────────────────
  if (config.workerBaseUrl) {
    app.get('/jar/:key', async (c) => {
      const key = c.req.param('key');

      // 1. 查 CF Cache
      const cache = (caches as any).default as Cache;
      const cacheKey = new Request(c.req.url);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      // 2. 查 KV 拿原始 URL
      const originalUrl = await lookupJarUrl(key, storage);
      if (!originalUrl) {
        return c.json({ error: 'Unknown JAR key' }, 404);
      }

      // 3. 流式透传
      try {
        const resp = await fetch(originalUrl, {
          headers: { 'User-Agent': 'okhttp/3.12.0' },
        });

        if (!resp.ok) {
          return c.json({ error: `Origin returned ${resp.status}` }, 502);
        }

        // 4. 构建响应 + 异步写缓存
        const ttl = isMd5Key(key) ? 86400 : 21600; // MD5 key → 24h, URL hash → 6h
        const response = new Response(resp.body, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Cache-Control': `public, max-age=${ttl}`,
            'Access-Control-Allow-Origin': '*',
          },
        });

        c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return c.json({ error: msg }, 502);
      }
    });
  }

  // ─── 直播源代理（仅 CF 版）──────────────────────────────
  if (config.workerBaseUrl) {
    app.get('/live/:key', async (c) => {
      const key = c.req.param('key');

      // 1. 查 CF Cache
      const cache = (caches as any).default as Cache;
      const cacheKey = new Request(c.req.url);
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      // 2. 查 KV 拿原始 URL
      const originalUrl = await lookupLiveUrl(key, storage);
      if (!originalUrl) {
        return c.json({ error: 'Unknown live source key' }, 404);
      }

      // 3. 流式透传
      try {
        const resp = await fetch(originalUrl, {
          headers: { 'User-Agent': 'okhttp/3.12.0' },
        });

        if (!resp.ok) {
          return c.json({ error: `Origin returned ${resp.status}` }, 502);
        }

        // 4. 构建响应 + 异步写缓存
        const response = new Response(resp.body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': `public, max-age=${LIVE_PROXY_TTL}`,
            'Access-Control-Allow-Origin': '*',
          },
        });

        c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return c.json({ error: msg }, 502);
      }
    });
  }

  // ─── Live Sources Admin API ────────────────────────────
  app.get('/admin/lives', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const raw = await storage.get(KV_LIVE_SOURCES);
    const entries: LiveSourceEntry[] = raw ? JSON.parse(raw) : [];
    return c.json(entries);
  });

  app.post('/admin/lives', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { name?: string; url?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const url = body.url?.trim();
    if (!url) return c.json({ error: 'URL is required' }, 400);

    try {
      new URL(url);
    } catch {
      return c.json({ error: 'Invalid URL format' }, 400);
    }

    const name = body.name?.trim() || '';
    const raw = await storage.get(KV_LIVE_SOURCES);
    const entries: LiveSourceEntry[] = raw ? JSON.parse(raw) : [];

    if (entries.some((e) => e.url === url)) {
      return c.json({ error: 'Live source already exists' }, 409);
    }

    entries.push({ name, url });
    await storage.put(KV_LIVE_SOURCES, JSON.stringify(entries));

    return c.json({ success: true });
  });

  app.delete('/admin/lives', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { url?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const url = body.url?.trim();
    if (!url) return c.json({ error: 'URL is required' }, 400);

    const raw = await storage.get(KV_LIVE_SOURCES);
    const entries: LiveSourceEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = entries.filter((e) => e.url !== url);
    await storage.put(KV_LIVE_SOURCES, JSON.stringify(filtered));

    return c.json({ success: true });
  });

  // ─── MacCMS Admin API ─────────────────────────────────
  app.get('/admin/maccms', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const raw = await storage.get(KV_MACCMS_SOURCES);
    const sources: MacCMSSourceEntry[] = raw ? JSON.parse(raw) : [];
    return c.json(sources);
  });

  app.post('/admin/maccms', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: MacCMSSourceEntry | MacCMSSourceEntry[];
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const newEntries = Array.isArray(body) ? body : [body];

    // 验证字段
    for (const entry of newEntries) {
      if (!entry.key?.trim() || !entry.name?.trim() || !entry.api?.trim()) {
        return c.json({ error: 'Each entry requires key, name, and api' }, 400);
      }
      try {
        new URL(entry.api);
      } catch {
        return c.json({ error: `Invalid URL: ${entry.api}` }, 400);
      }
    }

    const raw = await storage.get(KV_MACCMS_SOURCES);
    const sources: MacCMSSourceEntry[] = raw ? JSON.parse(raw) : [];
    const existingKeys = new Set(sources.map((s) => s.key));

    let added = 0;
    for (const entry of newEntries) {
      if (!existingKeys.has(entry.key)) {
        sources.push({ key: entry.key.trim(), name: entry.name.trim(), api: entry.api.trim() });
        existingKeys.add(entry.key);
        added++;
      }
    }

    await storage.put(KV_MACCMS_SOURCES, JSON.stringify(sources));
    return c.json({ success: true, added, total: sources.length });
  });

  app.delete('/admin/maccms', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { key?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const key = body.key?.trim();
    if (!key) return c.json({ error: 'key is required' }, 400);

    const raw = await storage.get(KV_MACCMS_SOURCES);
    const sources: MacCMSSourceEntry[] = raw ? JSON.parse(raw) : [];
    const filtered = sources.filter((s) => s.key !== key);
    await storage.put(KV_MACCMS_SOURCES, JSON.stringify(filtered));

    return c.json({ success: true });
  });

  app.post('/admin/maccms/validate', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { api?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const api = body.api?.trim();
    if (!api) return c.json({ error: 'api is required' }, 400);

    const ok = await validateMacCMS(api, config.siteTimeoutMs);
    return c.json({ api, valid: ok });
  });

  // ─── Config Editor 页面 ─────────────────────────────────
  app.get('/admin/config-editor', (c) => {
    return c.html(configEditorHtml);
  });

  // ─── Config Editor API ─────────────────────────────────
  app.get('/admin/config-data', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // 读取过滤前的完整配置（含被屏蔽的项），降级到已过滤配置
    const full = await storage.get(KV_MERGED_CONFIG_FULL);
    const cached = full || await storage.get(KV_MERGED_CONFIG);
    if (!cached) {
      return c.json({ sites: [], parses: [], lives: [] });
    }

    let parsed: TVBoxConfig;
    try {
      parsed = JSON.parse(cached);
    } catch {
      return c.json({ error: 'Config parse error' }, 500);
    }

    const blacklist = await loadBlacklist(storage);
    const siteSet = new Set(blacklist.sites);
    const parseSet = new Set(blacklist.parses);
    const liveSet = new Set(blacklist.lives);

    // Build sites with fingerprint + blocked status + group
    const sites = [];
    for (const site of parsed.sites || []) {
      const fp = await siteFingerprint(site);
      const api = site.api || '';
      let group = '其他';
      if (api.startsWith('csp_') || api.startsWith('py_') || api.startsWith('js_')) {
        group = api;
      } else if (api.startsWith('http')) {
        try { group = '远程: ' + new URL(api).hostname; } catch { group = '远程源'; }
      }
      sites.push({ ...site, fingerprint: fp, blocked: siteSet.has(fp), group });
    }

    const parses = (parsed.parses || []).map(p => ({
      ...p,
      blocked: parseSet.has(p.url),
    }));

    const lives = (parsed.lives || []).map(l => ({
      ...l,
      blocked: liveSet.has(l.url || l.api || ''),
    }));

    return c.json({ sites, parses, lives });
  });

  app.post('/admin/blacklist', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { type?: string; id?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const { type, id } = body;
    if (!type || !id) return c.json({ error: 'type and id are required' }, 400);
    if (!['sites', 'parses', 'lives'].includes(type)) {
      return c.json({ error: 'type must be sites, parses, or lives' }, 400);
    }

    const blacklist = await loadBlacklist(storage);
    const list = blacklist[type as keyof typeof blacklist] as string[];
    if (!list.includes(id)) {
      list.push(id);
    }
    await saveBlacklist(storage, blacklist);

    return c.json({ success: true });
  });

  app.delete('/admin/blacklist', async (c) => {
    if (!verifyAdmin(c.req.raw, config)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    let body: { type?: string; id?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const { type, id } = body;
    if (!type || !id) return c.json({ error: 'type and id are required' }, 400);
    if (!['sites', 'parses', 'lives'].includes(type)) {
      return c.json({ error: 'type must be sites, parses, or lives' }, 400);
    }

    const blacklist = await loadBlacklist(storage);
    const key = type as keyof typeof blacklist;
    (blacklist[key] as string[]) = (blacklist[key] as string[]).filter((v: string) => v !== id);
    await saveBlacklist(storage, blacklist);

    return c.json({ success: true });
  });

  // ─── 刷新 ─────────────────────────────────────────────
  app.post('/refresh', async (c) => {
    if (config.refreshToken || config.adminToken) {
      const auth = c.req.raw.headers.get('Authorization');
      const validTokens = [config.refreshToken, config.adminToken].filter(Boolean);
      if (!validTokens.some((t) => auth === `Bearer ${t}`)) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
    }

    try {
      await deps.triggerRefresh();
      return c.json({ success: true, message: 'Refresh completed' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return c.json({ success: false, error: msg }, 500);
    }
  });

  return app;
}

function verifyAdmin(request: Request, config: AppConfig): boolean {
  const token = config.adminToken;
  if (!token) return false;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${token}`;
}
