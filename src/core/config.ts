// 配置常量

// 默认阈值
export const DEFAULT_SPEED_TIMEOUT_MS = 5000; // 配置 URL 超时（fetch 耗时筛选）
export const DEFAULT_SITE_TIMEOUT_MS = 3000;  // 站点 API 超时
export const DEFAULT_FETCH_TIMEOUT_MS = 5000; // fetch 配置 JSON 超时

// KV keys
export const KV_MERGED_CONFIG = 'merged_config';
export const KV_MERGED_CONFIG_FULL = 'merged_config_full'; // 黑名单过滤前的完整配置（供配置编辑器使用）
export const KV_SOURCE_URLS = 'source_urls';
export const KV_LAST_UPDATE = 'last_update';
export const KV_MANUAL_SOURCES = 'manual_sources';
export const KV_MACCMS_SOURCES = 'maccms_sources';
export const KV_LIVE_SOURCES = 'live_sources';
export const KV_LIVE_SCRAPED = 'live_scraped';

// 直播源代理缓存 TTL（秒）
export const LIVE_PROXY_TTL = 7200; // 2 小时

// 黑名单
export const KV_BLACKLIST = 'blacklist';
