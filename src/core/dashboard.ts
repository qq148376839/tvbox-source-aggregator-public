export const dashboardHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TVBox Source Aggregator</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Outfit:wght@300;400;600;700&display=swap');

*{margin:0;padding:0;box-sizing:border-box}

:root{
  --bg:#0a0e14;
  --surface:#111720;
  --surface-2:#161d2a;
  --border:#1e2a3a;
  --border-glow:#2a3f5f;
  --green:#00e5a0;
  --green-dim:#00e5a033;
  --green-glow:#00e5a066;
  --amber:#f0a030;
  --amber-dim:#f0a03033;
  --red:#ff4060;
  --red-dim:#ff406033;
  --text:#c8d6e5;
  --text-dim:#5a6d82;
  --mono:'JetBrains Mono',monospace;
  --sans:'Outfit',sans-serif;
}

html{font-size:16px}
body{
  background:var(--bg);
  color:var(--text);
  font-family:var(--sans);
  min-height:100vh;
  overflow-x:hidden;
  position:relative;
}

/* Scan-line overlay */
body::after{
  content:'';
  position:fixed;
  inset:0;
  background:repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
  pointer-events:none;
  z-index:1000;
}

/* Grid background */
body::before{
  content:'';
  position:fixed;
  inset:0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, #00e5a008 0%, transparent 70%),
    linear-gradient(rgba(30,42,58,0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,42,58,0.3) 1px, transparent 1px);
  background-size:100% 100%, 60px 60px, 60px 60px;
  pointer-events:none;
  z-index:0;
}

.container{
  max-width:860px;
  margin:0 auto;
  padding:40px 24px 80px;
  position:relative;
  z-index:1;
}

/* Header */
.header{
  margin-bottom:48px;
  animation:fadeSlideDown 0.6s ease-out;
}

.header-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.2em;
  text-transform:uppercase;
  color:var(--green);
  opacity:0.7;
  margin-bottom:8px;
  display:flex;
  align-items:center;
  gap:8px;
}

.header-label::before{
  content:'';
  display:inline-block;
  width:8px;height:8px;
  background:var(--green);
  border-radius:50%;
  animation:pulse 2s ease-in-out infinite;
}

.header-title{
  font-family:var(--sans);
  font-size:2rem;
  font-weight:700;
  letter-spacing:-0.02em;
  color:#fff;
  line-height:1.2;
}

.header-title span{
  color:var(--green);
}

/* Status bar */
.status-bar{
  display:flex;
  align-items:center;
  gap:12px;
  margin-top:16px;
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--text-dim);
}

.status-indicator{
  display:flex;align-items:center;gap:6px;
  padding:4px 10px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:4px;
}

.status-dot{
  width:6px;height:6px;
  border-radius:50%;
  background:var(--green);
  box-shadow:0 0 6px var(--green-glow);
  animation:pulse 2s ease-in-out infinite;
}

.status-dot.offline{
  background:var(--red);
  box-shadow:0 0 6px var(--red-dim);
  animation:none;
}

/* Stats grid */
.stats-grid{
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:16px;
  margin-bottom:32px;
}

@media(max-width:560px){
  .stats-grid{grid-template-columns:1fr}
}

.stat-card{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:24px;
  position:relative;
  overflow:hidden;
  transition:border-color 0.3s, transform 0.2s;
  animation:fadeSlideUp 0.5s ease-out both;
}

.stat-card:nth-child(1){animation-delay:0.1s}
.stat-card:nth-child(2){animation-delay:0.15s}
.stat-card:nth-child(3){animation-delay:0.2s}
.stat-card:nth-child(4){animation-delay:0.25s}

.stat-card:hover{
  border-color:var(--border-glow);
  transform:translateY(-2px);
}

.stat-card::before{
  content:'';
  position:absolute;
  top:0;left:0;right:0;
  height:1px;
  background:linear-gradient(90deg, transparent, var(--green-dim), transparent);
}

.stat-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:var(--text-dim);
  margin-bottom:12px;
  display:flex;
  align-items:center;
  gap:6px;
}

.stat-icon{
  width:14px;height:14px;
  opacity:0.5;
}

.stat-value{
  font-family:var(--mono);
  font-size:2.2rem;
  font-weight:700;
  color:#fff;
  line-height:1;
  letter-spacing:-0.02em;
}

.stat-value .unit{
  font-size:0.8rem;
  font-weight:400;
  color:var(--text-dim);
  margin-left:4px;
}

.stat-card.highlight .stat-value{
  color:var(--green);
  text-shadow:0 0 20px var(--green-dim);
}

/* Update time section */
.update-section{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:20px 24px;
  margin-bottom:32px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  animation:fadeSlideUp 0.5s ease-out 0.3s both;
}

@media(max-width:560px){
  .update-section{flex-direction:column;align-items:flex-start}
}

.update-info{
  display:flex;flex-direction:column;gap:4px;
}

.update-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:var(--text-dim);
}

.update-time{
  font-family:var(--mono);
  font-size:0.95rem;
  color:#fff;
  font-weight:500;
}

.update-time.stale{color:var(--amber)}
.update-time.never{color:var(--red)}

/* Refresh button */
.refresh-btn{
  font-family:var(--mono);
  font-size:0.75rem;
  font-weight:600;
  letter-spacing:0.1em;
  text-transform:uppercase;
  padding:10px 24px;
  background:transparent;
  border:1px solid var(--green);
  color:var(--green);
  border-radius:4px;
  cursor:pointer;
  position:relative;
  overflow:hidden;
  transition:all 0.3s;
  white-space:nowrap;
}

.refresh-btn:hover{
  background:var(--green-dim);
  box-shadow:0 0 20px var(--green-dim);
}

.refresh-btn:active{
  transform:scale(0.97);
}

.refresh-btn.loading{
  color:var(--amber);
  border-color:var(--amber);
  pointer-events:none;
}

.refresh-btn.loading::after{
  content:'';
  position:absolute;
  bottom:0;left:0;
  height:2px;
  background:var(--amber);
  animation:loading 2s linear infinite;
}

.refresh-btn.success{
  color:var(--green);
  border-color:var(--green);
  background:var(--green-dim);
}

.refresh-btn.error{
  color:var(--red);
  border-color:var(--red);
  background:var(--red-dim);
}

/* Config URL section */
.config-section{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:20px 24px;
  animation:fadeSlideUp 0.5s ease-out 0.35s both;
}

.config-label{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.15em;
  text-transform:uppercase;
  color:var(--text-dim);
  margin-bottom:10px;
}

.config-url-row{
  display:flex;
  align-items:center;
  gap:10px;
}

.config-url{
  flex:1;
  font-family:var(--mono);
  font-size:0.8rem;
  color:var(--green);
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:4px;
  padding:10px 14px;
  overflow-x:auto;
  white-space:nowrap;
  user-select:all;
}

.copy-btn{
  font-family:var(--mono);
  font-size:0.7rem;
  font-weight:500;
  letter-spacing:0.08em;
  text-transform:uppercase;
  padding:10px 16px;
  background:var(--surface-2);
  border:1px solid var(--border);
  color:var(--text-dim);
  border-radius:4px;
  cursor:pointer;
  transition:all 0.2s;
  white-space:nowrap;
}

.copy-btn:hover{
  border-color:var(--text-dim);
  color:var(--text);
}

.copy-btn.copied{
  color:var(--green);
  border-color:var(--green);
}

/* Header top row */
.header-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
}

/* Header nav */
.header-nav{
  display:flex;
  gap:12px;
  margin-top:16px;
}

.header-nav a{
  font-family:var(--mono);
  font-size:0.7rem;
  letter-spacing:0.1em;
  text-transform:uppercase;
  color:var(--text-dim);
  text-decoration:none;
  padding:4px 10px;
  border:1px solid var(--border);
  border-radius:4px;
  transition:all 0.2s;
}

.header-nav a:hover{
  border-color:var(--text-dim);
  color:var(--text);
}

/* Language toggle */
.lang-toggle{
  font-family:var(--mono);
  font-size:0.65rem;
  font-weight:500;
  padding:4px 10px;
  border:1px solid var(--border);
  border-radius:4px;
  background:transparent;
  color:var(--text-dim);
  cursor:pointer;
  transition:all 0.2s;
  letter-spacing:0.05em;
}

.lang-toggle:hover{
  border-color:var(--text-dim);
  color:var(--text);
}

/* Footer */
.footer{
  margin-top:48px;
  padding-top:24px;
  border-top:1px solid var(--border);
  font-family:var(--mono);
  font-size:0.65rem;
  color:var(--text-dim);
  text-align:center;
  letter-spacing:0.05em;
  animation:fadeSlideUp 0.5s ease-out 0.4s both;
}

/* Loading skeleton */
.skeleton{
  background:linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
  background-size:200% 100%;
  animation:shimmer 1.5s infinite;
  border-radius:4px;
  color:transparent !important;
}

/* Animations */
@keyframes fadeSlideDown{
  from{opacity:0;transform:translateY(-12px)}
  to{opacity:1;transform:translateY(0)}
}

@keyframes fadeSlideUp{
  from{opacity:0;transform:translateY(12px)}
  to{opacity:1;transform:translateY(0)}
}

@keyframes pulse{
  0%,100%{opacity:1}
  50%{opacity:0.4}
}

@keyframes loading{
  0%{width:0;left:0}
  50%{width:100%;left:0}
  100%{width:0;left:100%}
}

@keyframes shimmer{
  0%{background-position:200% 0}
  100%{background-position:-200% 0}
}
</style>
</head>
<body style="opacity:0">

<div class="container">
  <header class="header">
    <div class="header-top">
      <div class="header-label" data-i18n="headerLabel">System Monitor</div>
      <button class="lang-toggle" id="langToggle" onclick="toggleLang()">中文</button>
    </div>
    <h1 class="header-title">TVBox <span>Aggregator</span></h1>
    <div class="status-bar">
      <div class="status-indicator">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText" data-i18n="connecting">Connecting...</span>
      </div>
    </div>
    <nav class="header-nav">
      <a href="/admin" data-i18n="navAdmin">Admin</a>
      <a href="/admin/config-editor" data-i18n="navConfigEditor">Config Editor</a>
    </nav>
  </header>

  <div class="stats-grid">
    <div class="stat-card highlight">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        <span data-i18n="sites">Sites</span>
      </div>
      <div class="stat-value" id="statSites"><span class="skeleton">&nbsp;000&nbsp;</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        <span data-i18n="lives">Lives</span>
      </div>
      <div class="stat-value" id="statLives"><span class="skeleton">&nbsp;00&nbsp;</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span data-i18n="parses">Parses</span>
      </div>
      <div class="stat-value" id="statParses"><span class="skeleton">&nbsp;00&nbsp;</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-label">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>
        <span data-i18n="sources">Sources</span>
      </div>
      <div class="stat-value" id="statSources"><span class="skeleton">&nbsp;00&nbsp;</span></div>
    </div>
  </div>

  <div class="update-section">
    <div class="update-info">
      <div class="update-label" data-i18n="lastAggregation">Last Aggregation</div>
      <div class="update-time" id="updateTime"><span class="skeleton">&nbsp;Loading...&nbsp;</span></div>
    </div>
    <button class="refresh-btn" id="refreshBtn" onclick="triggerRefresh()" data-i18n="refresh">
      Refresh
    </button>
  </div>

  <div class="config-section">
    <div class="config-label" data-i18n="configUrlLabel">TVBox Config URL</div>
    <div class="config-url-row">
      <div class="config-url" id="configUrl"></div>
      <button class="copy-btn" id="copyBtn" onclick="copyUrl('configUrl')" data-i18n="copy">Copy</button>
    </div>
    <div style="margin-top:12px">
      <div class="config-label" data-i18n="liveConfigUrlLabel">Live-Only Config URL</div>
      <div class="config-url-row">
        <div class="config-url" id="liveConfigUrl"></div>
        <button class="copy-btn" id="copyLiveBtn" onclick="copyUrl('liveConfigUrl')" data-i18n="copy">Copy</button>
      </div>
    </div>
  </div>

  <div class="footer">
    <span data-i18n="footer">TVBox Source Aggregator &middot; Cron 05:00 UTC Daily</span>
  </div>
</div>

<script>
const $ = id => document.getElementById(id);

// --- i18n ---
const translations = {
  en: {
    headerLabel:'System Monitor', connecting:'Connecting...', sites:'Sites', lives:'Lives',
    parses:'Parses', sources:'Sources', lastAggregation:'Last Aggregation', refresh:'Refresh',
    refreshing:'Refreshing...', done:'Done', failed:'Failed', error:'Error',
    configUrlLabel:'TVBox Config URL', liveConfigUrlLabel:'Live-Only Config URL',
    copy:'Copy', copied:'Copied!', neverRefresh:'Never — trigger a refresh',
    fetchError:'Failed to fetch status', noData:'No data',
    footer:'TVBox Source Aggregator &middot; Cron 05:00 UTC Daily',
    navAdmin:'Admin', navConfigEditor:'Config Editor',
  },
  zh: {
    headerLabel:'系统监控', connecting:'连接中...', sites:'站点', lives:'直播',
    parses:'解析', sources:'源', lastAggregation:'上次聚合', refresh:'刷新',
    refreshing:'刷新中...', done:'完成', failed:'失败', error:'错误',
    configUrlLabel:'TVBox 配置地址', liveConfigUrlLabel:'直播配置地址',
    copy:'复制', copied:'已复制!', neverRefresh:'从未更新 — 点击刷新',
    fetchError:'获取状态失败', noData:'无数据',
    footer:'TVBox 源聚合器 &middot; 每日 UTC 05:00 定时任务',
    navAdmin:'管理', navConfigEditor:'配置编辑',
  }
};

function getLang() {
  const s = localStorage.getItem('lang');
  if (s === 'en' || s === 'zh') return s;
  return navigator.language?.startsWith('zh') ? 'zh' : 'en';
}

function t(key) { const l = getLang(); return translations[l]?.[key] || translations.en[key] || key; }

function applyLang(lang) {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    const v = translations[lang]?.[k];
    if (v) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.dataset.i18nPlaceholder;
    const v = translations[lang]?.[k];
    if (v) el.placeholder = v;
  });
  const toggle = $('langToggle');
  if (toggle) toggle.textContent = lang === 'zh' ? 'EN' : '中文';
  document.body.style.opacity = '1';
}

function toggleLang() {
  const next = getLang() === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', next);
  applyLang(next);
  loadStatus(); // re-render dynamic text
}

const configUrl = location.origin + '/';
$('configUrl').textContent = configUrl;
$('liveConfigUrl').textContent = location.origin + '/live-config';

async function loadStatus() {
  try {
    const res = await fetch('/status-data');
    const d = await res.json();

    $('statSites').textContent = d.sites ?? '—';
    $('statLives').textContent = d.lives ?? '—';
    $('statParses').textContent = d.parses ?? '—';
    $('statSources').textContent = d.sourceCount ?? '—';

    const dot = $('statusDot');
    const txt = $('statusText');
    const time = $('updateTime');

    if (d.lastUpdate && d.lastUpdate !== 'never') {
      const date = new Date(d.lastUpdate);
      const now = new Date();
      const diffH = (now - date) / 3.6e6;
      const fmt = date.toLocaleString('zh-CN', {
        year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
        hour12: false
      });

      time.textContent = fmt;
      time.className = 'update-time' + (diffH > 26 ? ' stale' : '');

      dot.className = 'status-dot';
      txt.textContent = 'Online · ' + d.sites + ' ' + t('sites').toLowerCase();
    } else {
      time.textContent = t('neverRefresh');
      time.className = 'update-time never';
      dot.className = 'status-dot offline';
      txt.textContent = t('noData');
    }
  } catch (e) {
    $('statusDot').className = 'status-dot offline';
    $('statusText').textContent = t('error');
    $('updateTime').textContent = t('fetchError');
    $('updateTime').className = 'update-time never';
  }
}

async function triggerRefresh() {
  const btn = $('refreshBtn');
  btn.textContent = t('refreshing');
  btn.className = 'refresh-btn loading';

  try {
    const res = await fetch('/refresh', { method: 'POST' });
    const d = await res.json();
    if (d.success) {
      btn.textContent = t('done');
      btn.className = 'refresh-btn success';
      setTimeout(() => loadStatus(), 500);
    } else {
      btn.textContent = t('failed');
      btn.className = 'refresh-btn error';
    }
  } catch {
    btn.textContent = t('error');
    btn.className = 'refresh-btn error';
  }

  setTimeout(() => {
    btn.textContent = t('refresh');
    btn.className = 'refresh-btn';
  }, 3000);
}

function copyUrl(elementId) {
  const text = $(elementId).textContent;
  const btn = $(elementId).parentElement.querySelector('.copy-btn');
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = t('copied');
    btn.className = 'copy-btn copied';
    setTimeout(() => {
      btn.textContent = t('copy');
      btn.className = 'copy-btn';
    }, 2000);
  });
}

applyLang(getLang());
loadStatus();
setInterval(loadStatus, 60000);
</script>
</body>
</html>`;
