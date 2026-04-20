// 聚合流程编排

import type { Storage } from './storage/interface';
import type { AppConfig, SourceEntry, SourcedConfig, MacCMSSourceEntry, LiveSourceEntry, TVBoxLive } from './core/types';
import { fetchConfigs } from './core/fetcher';
import { mergeConfigs, cleanLocalRefs, cleanEmptyEntries } from './core/merger';
import { batchSiteSpeedTest, appendSpeedToName } from './core/speedtest';
import { macCMSToTVBoxSites, processMacCMSForLocal } from './core/maccms';
import { rewriteJarUrls } from './core/jar-proxy';
import { batchTestLiveSources, liveSourcesToTVBoxLives } from './core/live-source';
import { KV_MERGED_CONFIG, KV_MERGED_CONFIG_FULL, KV_SOURCE_URLS, KV_LAST_UPDATE, KV_MANUAL_SOURCES, KV_MACCMS_SOURCES, KV_LIVE_SOURCES, KV_BLACKLIST } from './core/config';
import { loadBlacklist, applyBlacklist, pruneBlacklist, saveBlacklist } from './core/blacklist';

export async function runAggregation(storage: Storage, config: AppConfig): Promise<void> {
  const startTime = Date.now();
  console.log('[aggregation] Starting...');

  try {
    await _runAggregation(storage, config, startTime);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error(`[aggregation] FATAL ERROR: ${msg}`);
    console.error(`[aggregation] Stack: ${stack}`);
    // 写入错误信息方便调试
    await storage.put(KV_LAST_UPDATE, `ERROR @ ${new Date().toISOString()}: ${msg}`);
  }
}

async function _runAggregation(storage: Storage, config: AppConfig, startTime: number): Promise<void> {

  // Step 1: 读取手动配置的源
  console.log('[aggregation] Step 1: Loading sources...');
  const raw = await storage.get(KV_MANUAL_SOURCES);
  const sources: SourceEntry[] = raw ? JSON.parse(raw) : [];

  // 检查是否有 MacCMS 源（即使没有 config 源也可以继续）
  const macCMSRaw = await storage.get(KV_MACCMS_SOURCES);
  const hasMacCMS = macCMSRaw ? JSON.parse(macCMSRaw).length > 0 : false;

  if (sources.length === 0 && !hasMacCMS) {
    console.warn('[aggregation] No sources configured, nothing to do');
    return;
  }

  console.log(`[aggregation] ${sources.length} config sources configured`);
  await storage.put(KV_SOURCE_URLS, JSON.stringify(sources));

  // Step 1.5: 处理 MacCMS 源
  console.log('[aggregation] Step 1.5: Processing MacCMS sources...');
  const macCMSConfigs = await processMacCMSSources(storage, config);

  // Step 1.6: 处理直播源（admin 手动源 + 连通性测试 + 改写）
  console.log('[aggregation] Step 1.6: Processing live sources...');
  const extraLives = await processLiveSources(storage, config);

  // Step 2: 批量 fetch 配置 JSON
  console.log('[aggregation] Step 2: Fetching configs...');
  const sourcedConfigs = await fetchConfigs(sources, config.fetchTimeoutMs);

  if (sourcedConfigs.length === 0 && macCMSConfigs.length === 0) {
    console.warn('[aggregation] No valid configs fetched and no MacCMS sources, keeping previous cache');
    return;
  }

  // Step 3: 用 fetch 耗时筛选配置源
  let filteredConfigs: SourcedConfig[] = sourcedConfigs;

  const configsWithSpeed = sourcedConfigs.filter((c) => c.speedMs != null);
  if (configsWithSpeed.length > 0) {
    console.log('[aggregation] Step 3: Filtering configs by fetch speed...');
    filteredConfigs = sourcedConfigs.filter((c) => {
      if (c.speedMs == null) return true; // 没有测速数据的保留
      if (c.speedMs <= config.speedTimeoutMs) return true;
      console.log(`[aggregation] Filtered out ${c.sourceUrl}: ${c.speedMs}ms > ${config.speedTimeoutMs}ms`);
      return false;
    });

    if (filteredConfigs.length === 0) {
      console.warn('[aggregation] All configs failed speed filter, using all fetched configs');
      filteredConfigs = sourcedConfigs;
    } else {
      console.log(`[aggregation] ${filteredConfigs.length}/${sourcedConfigs.length} configs passed speed filter`);
    }
  } else {
    console.log('[aggregation] Step 3: No speed data available, skipping filter');
  }

  // Step 4: 合并（包含 MacCMS 源）
  console.log('[aggregation] Step 4: Merging configs...');
  const allConfigs = [...filteredConfigs, ...macCMSConfigs];
  let merged = mergeConfigs(allConfigs);

  // 将额外直播源注入到 merged.lives
  if (extraLives.length > 0) {
    merged.lives = [...(merged.lives || []), ...extraLives];
    console.log(`[aggregation] Injected ${extraLives.length} extra live sources`);
  }

  // Step 4.5: 黑名单过滤
  console.log('[aggregation] Step 4.5: Applying blacklist...');
  const blacklist = await loadBlacklist(storage);
  const hasBlacklist = blacklist.sites.length > 0 || blacklist.parses.length > 0 || blacklist.lives.length > 0;

  // 保存过滤前的完整配置（供配置编辑器显示已屏蔽项）
  await storage.put(KV_MERGED_CONFIG_FULL, JSON.stringify(merged));

  if (hasBlacklist) {
    // 自动清理黑名单中已不存在的条目（必须在过滤前比对，否则被屏蔽的条目会被误判为"过时"而清掉）
    const pruned = await pruneBlacklist(blacklist, merged);
    if (JSON.stringify(pruned) !== JSON.stringify(blacklist)) {
      await saveBlacklist(storage, pruned);
    }

    const { config: filtered, removedSites, removedParses, removedLives } = await applyBlacklist(merged, pruned);
    merged = filtered;
    console.log(`[aggregation] Blacklist removed: ${removedSites} sites, ${removedParses} parses, ${removedLives} lives`);
  } else {
    console.log('[aggregation] Step 4.5: No blacklist entries, skipping');
  }

  // Step 5: 清洗无效数据（空条目 + 本地引用）
  console.log('[aggregation] Step 5: Cleaning invalid entries...');
  merged = cleanEmptyEntries(merged);
  merged = cleanLocalRefs(merged);

  // Step 6: 本地模式站点测速 + name 标记（CF 模式跳过）
  if (!config.workerBaseUrl && merged.sites) {
    console.log('[aggregation] Step 6: Local site speed test...');
    const speedMap = await batchSiteSpeedTest(merged.sites, config.siteTimeoutMs);
    if (speedMap.size > 0) {
      merged.sites = appendSpeedToName(merged.sites, speedMap);
    }
  } else {
    console.log('[aggregation] Step 6: Skipping site speed test (CF mode)');
  }

  // Step 7: CF 模式 JAR URL 改写
  if (config.workerBaseUrl) {
    console.log('[aggregation] Step 7: Rewriting JAR URLs for CF proxy...');
    merged = await rewriteJarUrls(merged, config.workerBaseUrl, storage);
  } else {
    console.log('[aggregation] Step 7: Skipping JAR rewrite (local mode)');
  }

  // Step 8: 存入存储
  const mergedJson = JSON.stringify(merged);
  await storage.put(KV_MERGED_CONFIG, mergedJson);
  await storage.put(KV_LAST_UPDATE, new Date().toISOString());

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[aggregation] Done in ${elapsed}s. ` +
      `${merged.sites?.length} sites, ${merged.parses?.length} parses, ${merged.lives?.length} lives`,
  );
}

/**
 * 处理 MacCMS 源：
 * - CF 版（有 workerBaseUrl）：直接转换，API 指向代理路由
 * - 本地版（无 workerBaseUrl）：并发验证 + 过滤不可达站点 + 收集延迟
 */
async function processMacCMSSources(
  storage: Storage,
  config: AppConfig,
): Promise<SourcedConfig[]> {
  const raw = await storage.get(KV_MACCMS_SOURCES);
  const entries: MacCMSSourceEntry[] = raw ? JSON.parse(raw) : [];

  if (entries.length === 0) {
    console.log('[aggregation] No MacCMS sources configured');
    return [];
  }

  console.log(`[aggregation] ${entries.length} MacCMS sources found`);

  let validEntries: MacCMSSourceEntry[];
  let speedMap: Map<string, number> | undefined;

  if (config.workerBaseUrl) {
    // CF 版：跳过验证，代理本身就是可用性保证
    console.log('[aggregation] CF mode: skipping MacCMS validation, using proxy URLs');
    validEntries = entries;
  } else {
    // 本地版：并发验证，过滤不可达站点，收集延迟
    console.log('[aggregation] Local mode: validating MacCMS sources...');
    const result = await processMacCMSForLocal(entries, config.siteTimeoutMs);
    validEntries = result.passed;
    speedMap = result.speedMap;
  }

  if (validEntries.length === 0) {
    console.warn('[aggregation] No valid MacCMS sources after processing');
    return [];
  }

  const sites = macCMSToTVBoxSites(validEntries, config.workerBaseUrl, speedMap);
  console.log(`[aggregation] Converted ${sites.length} MacCMS sources to TVBoxSites`);

  return [{
    sourceUrl: 'maccms://builtin',
    sourceName: 'MacCMS Sources',
    config: { sites },
  }];
}

/**
 * 处理直播源（对外版：仅 admin 手动源，无自动抓取）：
 * 1. 读取 admin 手动直播源
 * 2. 去重 → 连通性测试 → URL 改写 / name 追加延迟
 */
async function processLiveSources(
  storage: Storage,
  config: AppConfig,
): Promise<TVBoxLive[]> {
  // 读取 admin 手动直播源
  const raw = await storage.get(KV_LIVE_SOURCES);
  const allEntries: LiveSourceEntry[] = raw ? JSON.parse(raw) : [];

  if (allEntries.length === 0) {
    console.log('[aggregation] No extra live sources to process');
    return [];
  }

  console.log(`[aggregation] ${allEntries.length} manual live sources found`);

  // 去重（按 URL）
  const seen = new Set<string>();
  const uniqueEntries = allEntries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });

  console.log(`[aggregation] ${uniqueEntries.length} unique live sources after dedup`);

  // 连通性测试
  const { passed, speedMap } = await batchTestLiveSources(uniqueEntries, config.siteTimeoutMs);

  if (passed.length === 0) {
    console.warn('[aggregation] No live sources passed connectivity test');
    return [];
  }

  // 转为 TVBoxLive[]（CF: URL 改写 + KV 映射，本地: name 追加延迟）
  const lives = await liveSourcesToTVBoxLives(
    passed,
    config.workerBaseUrl,
    storage,
    speedMap,
  );

  console.log(`[aggregation] Produced ${lives.length} TVBoxLive entries`);
  return lives;
}
