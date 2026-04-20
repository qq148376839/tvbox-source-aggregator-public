// Node.js 入口

import { serve } from '@hono/node-server';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as os from 'os';
import { createApp } from './routes';
import { runAggregation } from './aggregator';
import {
  DEFAULT_SPEED_TIMEOUT_MS,
  DEFAULT_SITE_TIMEOUT_MS,
  DEFAULT_FETCH_TIMEOUT_MS,
} from './core/config';
import type { Storage } from './storage/interface';
import type { AppConfig } from './core/types';

// 加载 .env
dotenv.config();

// ─── 存储初始化（SQLite → JSON 降级）───────────────────

function createStorage(): Storage {
  const dataDir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));

  // 尝试 SQLite
  try {
    const { SQLiteStorage } = require('./storage/sqlite');
    const dbPath = path.join(dataDir, 'tvbox.db');
    const storage = new SQLiteStorage(dbPath);
    console.log(`[storage] SQLite initialized: ${dbPath}`);
    return storage;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[storage] SQLite unavailable (${msg}), falling back to JSON file`);
  }

  // 降级到 JSON
  const { JsonFileStorage } = require('./storage/json-file');
  const jsonPath = path.join(dataDir, 'tvbox-data.json');
  console.log(`[storage] JSON file storage: ${jsonPath}`);
  return new JsonFileStorage(jsonPath);
}

// ─── 配置 ────────────────────────────────────────────────

function buildConfig(): AppConfig {
  return {
    adminToken: process.env.ADMIN_TOKEN,
    refreshToken: process.env.REFRESH_TOKEN,
    speedTimeoutMs: parseInt(process.env.SPEED_TIMEOUT_MS || '') || DEFAULT_SPEED_TIMEOUT_MS,
    siteTimeoutMs: parseInt(process.env.SITE_TIMEOUT_MS || '') || DEFAULT_SITE_TIMEOUT_MS,
    fetchTimeoutMs: parseInt(process.env.FETCH_TIMEOUT_MS || '') || DEFAULT_FETCH_TIMEOUT_MS,
    cronSchedule: process.env.CRON_SCHEDULE || '0 5 * * *',
  };
}

// ─── 启动 ────────────────────────────────────────────────

function main() {
  const storage = createStorage();
  const config = buildConfig();
  const port = parseInt(process.env.PORT || '') || 5678;

  let refreshRunning = false;
  const AGGREGATION_TIMEOUT_MS = 120_000; // 聚合整体超时 2 分钟

  const app = createApp({
    storage,
    config,
    triggerRefresh: async () => {
      if (refreshRunning) {
        console.log('[aggregation] Already running, skipping');
        return;
      }
      refreshRunning = true;
      try {
        await Promise.race([
          runAggregation(storage, config),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Aggregation timed out')), AGGREGATION_TIMEOUT_MS),
          ),
        ]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[aggregation] Error: ${msg}`);
      } finally {
        refreshRunning = false;
      }
    },
  });

  // 定时任务
  const schedule = config.cronSchedule || '0 5 * * *';
  cron.schedule(schedule, () => {
    console.log(`[cron] Triggered at ${new Date().toISOString()}`);
    if (refreshRunning) {
      console.log('[cron] Aggregation already running, skipping');
      return;
    }
    refreshRunning = true;
    Promise.race([
      runAggregation(storage, config),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Aggregation timed out')), AGGREGATION_TIMEOUT_MS),
      ),
    ])
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[cron] Aggregation error: ${msg}`);
      })
      .finally(() => { refreshRunning = false; });
  });

  const lanIp = getLocalIp();

  serve({ fetch: app.fetch, port }, (info) => {
    console.log('');
    console.log('  TVBox Source Aggregator');
    console.log(`  > Local:   http://localhost:${info.port}/`);
    if (lanIp) {
      console.log(`  > Network: http://${lanIp}:${info.port}/`);
    }
    console.log(`  > Admin:   http://${lanIp || 'localhost'}:${info.port}/admin`);
    console.log(`  > Status:  http://${lanIp || 'localhost'}:${info.port}/status`);
    console.log(`  > Cron:    ${schedule} (UTC)`);
    console.log('');
    console.log(`  TVBox 填入地址: http://${lanIp || 'localhost'}:${info.port}/`);
    console.log('');
  });
}

function getLocalIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

main();
