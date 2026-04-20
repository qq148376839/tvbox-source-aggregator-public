export const configEditorHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TVBox Aggregator - Config Editor</title>
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
  --blue:#4da6ff;
  --blue-dim:#4da6ff33;
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

body::after{
  content:'';
  position:fixed;
  inset:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);
  pointer-events:none;
  z-index:1000;
}

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
  max-width:960px;
  margin:0 auto;
  padding:40px 24px 80px;
  position:relative;
  z-index:1;
}

/* Login overlay */
.login-overlay{
  position:fixed;
  inset:0;
  background:var(--bg);
  z-index:900;
  display:flex;
  align-items:center;
  justify-content:center;
}

.login-box{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  padding:40px;
  width:360px;
  max-width:90vw;
  animation:fadeSlideUp 0.4s ease-out;
}

.login-box h2{
  font-family:var(--sans);
  font-size:1.4rem;
  font-weight:700;
  color:#fff;
  margin-bottom:8px;
}

.login-box p{
  font-family:var(--mono);
  font-size:0.7rem;
  color:var(--text-dim);
  letter-spacing:0.1em;
  text-transform:uppercase;
  margin-bottom:24px;
}

.login-box input{
  width:100%;
  font-family:var(--mono);
  font-size:0.85rem;
  padding:12px 16px;
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:4px;
  color:#fff;
  outline:none;
  margin-bottom:16px;
  transition:border-color 0.2s;
}

.login-box input:focus{border-color:var(--green)}

.login-box .error-msg{
  font-family:var(--mono);
  font-size:0.75rem;
  color:var(--red);
  margin-bottom:12px;
  display:none;
}

/* Header */
.header{
  margin-bottom:24px;
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

.header-title span{color:var(--green)}

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

/* Submit button */
.btn{
  font-family:var(--mono);
  font-size:0.75rem;
  font-weight:600;
  letter-spacing:0.1em;
  text-transform:uppercase;
  padding:10px 20px;
  background:transparent;
  border:1px solid var(--green);
  color:var(--green);
  border-radius:4px;
  cursor:pointer;
  transition:all 0.3s;
  white-space:nowrap;
}

.btn:hover{
  background:var(--green-dim);
  box-shadow:0 0 20px var(--green-dim);
}

.btn:active{transform:scale(0.97)}

.btn.danger{
  border-color:var(--red);
  color:var(--red);
}

.btn.danger:hover{
  background:var(--red-dim);
  box-shadow:0 0 20px var(--red-dim);
}

.btn.secondary{
  border-color:var(--amber);
  color:var(--amber);
}

.btn.secondary:hover{
  background:var(--amber-dim);
  box-shadow:0 0 20px var(--amber-dim);
}

.btn.sm{
  padding:5px 10px;
  font-size:0.65rem;
}

/* Tabs */
.tabs{
  display:flex;
  gap:0;
  margin-bottom:20px;
  border-bottom:1px solid var(--border);
}

.tab{
  font-family:var(--mono);
  font-size:0.75rem;
  font-weight:500;
  letter-spacing:0.1em;
  text-transform:uppercase;
  padding:12px 20px;
  color:var(--text-dim);
  cursor:pointer;
  border-bottom:2px solid transparent;
  transition:all 0.2s;
  user-select:none;
}

.tab:hover{color:var(--text)}

.tab.active{
  color:var(--green);
  border-bottom-color:var(--green);
}

.tab .badge{
  display:inline-block;
  font-size:0.6rem;
  padding:1px 6px;
  border-radius:8px;
  margin-left:6px;
  background:var(--surface-2);
  color:var(--text-dim);
}

.tab.active .badge{
  background:var(--green-dim);
  color:var(--green);
}

/* Search */
.search-bar{
  margin-bottom:16px;
  display:flex;
  gap:10px;
}

.search-bar input{
  flex:1;
  font-family:var(--mono);
  font-size:0.8rem;
  padding:10px 14px;
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:4px;
  color:#fff;
  outline:none;
  transition:border-color 0.2s;
}

.search-bar input:focus{border-color:var(--green)}

.search-bar input::placeholder{color:var(--text-dim)}

/* Tab panel */
.tab-panel{display:none}
.tab-panel.active{display:block}

/* Group */
.group{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  margin-bottom:12px;
  overflow:hidden;
}

.group-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:12px 16px;
  cursor:pointer;
  user-select:none;
  transition:background 0.2s;
}

.group-header:hover{background:var(--surface-2)}

.group-title{
  font-family:var(--mono);
  font-size:0.8rem;
  font-weight:600;
  color:#fff;
  display:flex;
  align-items:center;
  gap:8px;
}

.group-title .count{
  font-size:0.65rem;
  font-weight:400;
  color:var(--text-dim);
  padding:2px 8px;
  background:var(--surface-2);
  border-radius:10px;
}

.group-arrow{
  font-size:0.7rem;
  color:var(--text-dim);
  transition:transform 0.2s;
}

.group.open .group-arrow{transform:rotate(90deg)}

.group-body{
  display:none;
  border-top:1px solid var(--border);
}

.group.open .group-body{display:block}

/* Item row */
.item{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 16px;
  border-bottom:1px solid var(--border);
  transition:background 0.15s;
  font-family:var(--mono);
  font-size:0.75rem;
}

.item:last-child{border-bottom:none}
.item:hover{background:var(--surface-2)}

.item.blocked{opacity:0.4}

.item-name{
  flex:1;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:#fff;
  font-weight:500;
}

.item.blocked .item-name{
  text-decoration:line-through;
  color:var(--text-dim);
}

.item-type{
  position:relative;
  font-size:0.6rem;
  padding:2px 8px;
  border-radius:4px;
  font-weight:600;
  letter-spacing:0.05em;
  text-transform:uppercase;
  cursor:help;
  white-space:nowrap;
}

.item-type.t0{background:var(--blue-dim);color:var(--blue)}
.item-type.t1{background:var(--green-dim);color:var(--green)}
.item-type.t3{background:var(--amber-dim);color:var(--amber)}
.item-type.t4{background:var(--red-dim);color:var(--red)}

/* Tooltip */
.tooltip{
  position:absolute;
  bottom:calc(100% + 8px);
  left:50%;
  transform:translateX(-50%);
  background:var(--surface);
  border:1px solid var(--border-glow);
  border-radius:6px;
  padding:8px 12px;
  font-family:var(--sans);
  font-size:0.75rem;
  font-weight:400;
  color:var(--text);
  white-space:nowrap;
  pointer-events:none;
  opacity:0;
  transition:opacity 0.15s;
  z-index:100;
  text-transform:none;
  letter-spacing:0;
  box-shadow:0 4px 12px rgba(0,0,0,0.3);
}

.tooltip::after{
  content:'';
  position:absolute;
  top:100%;
  left:50%;
  transform:translateX(-50%);
  border:5px solid transparent;
  border-top-color:var(--border-glow);
}

.item-type:hover .tooltip{opacity:1}

.item-api{
  max-width:200px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  color:var(--text-dim);
  font-size:0.65rem;
}

.item-actions{
  display:flex;
  gap:6px;
  flex-shrink:0;
}

/* Flat list (for parses / lives) */
.flat-list{
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:8px;
  overflow:hidden;
}

/* Stats bar */
.stats{
  display:flex;
  gap:16px;
  margin-bottom:20px;
  font-family:var(--mono);
  font-size:0.7rem;
  color:var(--text-dim);
}

.stats .stat{
  display:flex;
  align-items:center;
  gap:4px;
}

.stats .num{
  color:var(--green);
  font-weight:600;
}

.stats .blocked-num{
  color:var(--red);
  font-weight:600;
}

/* Loading */
.loading-msg{
  text-align:center;
  padding:60px 20px;
  font-family:var(--mono);
  font-size:0.8rem;
  color:var(--text-dim);
}

/* Header top row */
.header-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
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
</style>
</head>
<body style="opacity:0">

<!-- Login -->
<div class="login-overlay" id="loginOverlay">
  <div class="login-box">
    <h2 data-i18n="loginTitle">Config Editor</h2>
    <p data-i18n="loginSubtitle">Enter admin token</p>
    <div class="error-msg" id="loginError" data-i18n="invalidToken">Invalid token</div>
    <input type="password" id="tokenInput" data-i18n-placeholder="tokenPh" placeholder="Admin Token" autofocus>
    <button class="btn" style="width:100%" data-i18n="login" onclick="doLogin()">Login</button>
  </div>
</div>

<!-- Main -->
<div class="container" id="mainContent" style="display:none">
  <header class="header">
    <div class="header-top">
      <div class="header-label" data-i18n="headerLabel">Config Editor</div>
      <button class="lang-toggle" id="langToggle" onclick="toggleLang()">EN</button>
    </div>
    <h1 class="header-title">TVBox <span>Config</span></h1>
    <div class="header-nav">
      <a href="/admin" data-i18n="navAdmin">Admin</a>
      <a href="/admin/config-editor" data-i18n="navConfigEditor">Config Editor</a>
      <a href="/status" data-i18n="navDashboard">Dashboard</a>
    </div>
  </header>

  <!-- Tabs -->
  <div class="tabs">
    <div class="tab active" data-tab="sites" onclick="switchTab('sites')">Sites <span class="badge" id="badgeSites">0</span></div>
    <div class="tab" data-tab="parses" onclick="switchTab('parses')">Parses <span class="badge" id="badgeParses">0</span></div>
    <div class="tab" data-tab="lives" onclick="switchTab('lives')">Lives <span class="badge" id="badgeLives">0</span></div>
  </div>

  <!-- Search -->
  <div class="search-bar">
    <input type="text" id="searchInput" data-i18n-placeholder="searchPh" placeholder="搜索名称、API、URL..." oninput="doSearch()">
  </div>

  <!-- Stats -->
  <div class="stats" id="statsBar"></div>

  <!-- Sites panel -->
  <div class="tab-panel active" id="panelSites">
    <div class="loading-msg" id="loadingSites" data-i18n="loading">加载中...</div>
  </div>

  <!-- Parses panel -->
  <div class="tab-panel" id="panelParses">
    <div class="loading-msg" id="loadingParses" data-i18n="loading">加载中...</div>
  </div>

  <!-- Lives panel -->
  <div class="tab-panel" id="panelLives">
    <div class="loading-msg" id="loadingLives" data-i18n="loading">加载中...</div>
  </div>

  <div class="footer">
    <span data-i18n="footer">TVBox Config Editor &middot; Blacklisted items are excluded from aggregated output</span>
  </div>
</div>

<script>
// --- i18n ---
const _translations = {
  en: {
    loginTitle:'Config Editor', loginSubtitle:'Enter admin token',
    invalidToken:'Invalid token', tokenPh:'Admin Token', login:'Login',
    networkError:'Network error',
    headerLabel:'Config Editor', navAdmin:'Admin', navConfigEditor:'Config Editor', navDashboard:'Dashboard',
    searchPh:'Search name, API, URL...', loading:'Loading...',
    available:'Available:', blocked:'Blocked:',
    sites:'sites', parses:'parses', lives:'lives',
    restore:'Restore', block:'Block',
    groupOther:'Other', groupRemotePrefix:'Remote: ', groupRemote:'Remote',
    siteType0:'XML site: fetches video data via XML API',
    siteType1:'JSON site (MacCMS): fetches video data via JSON API',
    siteType3:'JAR plugin: fetches data via Java spider plugin, requires spider package',
    siteType4:'Remote site: uses remotely configured site',
    parseType0:'Sniffer parse: extracts video URL by sniffing web pages',
    parseType1:'JSON parse: returns video URL in JSON format directly',
    parseType2:'JSON extended parse: JSON parse with extra parameters',
    parseType3:'Aggregated parse: combines results from multiple parsers',
    parseType4:'Super parse: advanced composite parse mode',
    liveType0:'Live source: M3U/TXT format channel list file',
    liveType3:'Live plugin: fetches channels via JAR/Python plugin',
    typePrefix:'Type ',
    footer:'TVBox Config Editor &middot; Blacklisted items are excluded from aggregated output',
  },
  zh: {
    loginTitle:'配置编辑器', loginSubtitle:'请输入管理令牌',
    invalidToken:'无效的令牌', tokenPh:'管理令牌', login:'登录',
    networkError:'网络错误',
    headerLabel:'配置编辑器', navAdmin:'管理', navConfigEditor:'配置编辑', navDashboard:'仪表盘',
    searchPh:'搜索名称、API、URL...', loading:'加载中...',
    available:'可用:', blocked:'已屏蔽:',
    sites:'站点', parses:'解析', lives:'直播',
    restore:'恢复', block:'屏蔽',
    groupOther:'其他', groupRemotePrefix:'远程: ', groupRemote:'远程源',
    siteType0:'XML 站点：通过 XML 接口获取影视数据',
    siteType1:'JSON 站点（MacCMS）：通过 JSON API 获取影视数据',
    siteType3:'JAR 插件：通过 Java 爬虫插件获取数据，需要 spider 包',
    siteType4:'远程站点：使用远程配置的站点',
    parseType0:'嗅探解析：通过网页嗅探提取视频地址',
    parseType1:'JSON 解析：直接返回 JSON 格式的视频地址',
    parseType2:'JSON 扩展解析：带扩展参数的 JSON 解析',
    parseType3:'聚合解析：合并多个解析接口的结果',
    parseType4:'超级解析：高级复合解析模式',
    liveType0:'直播源：M3U/TXT 格式的频道列表文件',
    liveType3:'直播插件：通过 JAR/Python 插件获取频道',
    typePrefix:'类型 ',
    footer:'TVBox 配置编辑器 &middot; 被屏蔽的项目不会出现在聚合输出中',
  }
};

function getLang() {
  const s = localStorage.getItem('lang');
  if (s === 'en' || s === 'zh') return s;
  return navigator.language?.startsWith('zh') ? 'zh' : 'en';
}

function _t(key) { const l = getLang(); return _translations[l]?.[key] || _translations.en[key] || key; }

function applyLang(lang) {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    const v = _translations[lang]?.[k];
    if (v) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const k = el.dataset.i18nPlaceholder;
    const v = _translations[lang]?.[k];
    if (v) el.placeholder = v;
  });
  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = lang === 'zh' ? 'EN' : '中文';
  document.body.style.opacity = '1';
}

function toggleLang() {
  const next = getLang() === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', next);
  applyLang(next);
  if (DATA) render();
}

const $ = id => document.getElementById(id);
let TOKEN = '';
let DATA = null;
let CURRENT_TAB = 'sites';

const SITE_TYPE_TIPS = {
  0: () => _t('siteType0'),
  1: () => _t('siteType1'),
  3: () => _t('siteType3'),
  4: () => _t('siteType4'),
};

const PARSE_TYPE_TIPS = {
  0: () => _t('parseType0'),
  1: () => _t('parseType1'),
  2: () => _t('parseType2'),
  3: () => _t('parseType3'),
  4: () => _t('parseType4'),
};

const LIVE_TYPE_TIPS = {
  0: () => _t('liveType0'),
  3: () => _t('liveType3'),
};

// Spider class grouping
function groupSites(sites) {
  const groups = new Map();
  for (const s of sites) {
    const api = s.api || '';
    let group = _t('groupOther');
    if (api.startsWith('csp_') || api.startsWith('py_') || api.startsWith('js_')) {
      group = api;
    } else if (api.startsWith('http')) {
      try { group = _t('groupRemotePrefix') + new URL(api).hostname; } catch { group = _t('groupRemote'); }
    }
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(s);
  }
  // Sort by group size desc
  return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
}

// Login
function doLogin() {
  TOKEN = $('tokenInput').value.trim();
  if (!TOKEN) return;
  loadData();
}

$('tokenInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

async function loadData() {
  try {
    const res = await fetch('/admin/config-data', {
      headers: { 'Authorization': 'Bearer ' + TOKEN }
    });
    if (res.status === 401) {
      $('loginError').style.display = 'block';
      return;
    }
    DATA = await res.json();
    $('loginOverlay').style.display = 'none';
    $('mainContent').style.display = 'block';
    render();
  } catch (e) {
    $('loginError').textContent = _t('networkError');
    $('loginError').style.display = 'block';
  }
}

function switchTab(tab) {
  CURRENT_TAB = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1)));
  $('searchInput').value = '';
  doSearch();
}

function render() {
  if (!DATA) return;
  $('badgeSites').textContent = DATA.sites.length;
  $('badgeParses').textContent = DATA.parses.length;
  $('badgeLives').textContent = DATA.lives.length;
  renderSites();
  renderParses();
  renderLives();
  updateStats();
}

function updateStats() {
  if (!DATA) return;
  const bs = DATA.sites.filter(s => s.blocked).length;
  const bp = DATA.parses.filter(p => p.blocked).length;
  const bl = DATA.lives.filter(l => l.blocked).length;
  $('statsBar').innerHTML =
    '<div class="stat">' + _t('available') + ' <span class="num">' + (DATA.sites.length - bs) + '</span> ' + _t('sites') + ', '
    + '<span class="num">' + (DATA.parses.length - bp) + '</span> ' + _t('parses') + ', '
    + '<span class="num">' + (DATA.lives.length - bl) + '</span> ' + _t('lives') + '</div>'
    + (bs + bp + bl > 0 ? '<div class="stat">' + _t('blocked') + ' <span class="blocked-num">' + (bs + bp + bl) + '</span></div>' : '');
}

function typeSpan(type, tips) {
  const t = type ?? 0;
  const tipFn = tips[t];
  const tip = tipFn ? tipFn() : _t('typePrefix') + t;
  return '<span class="item-type t' + t + '">T' + t + '<span class="tooltip">' + tip + '</span></span>';
}

function renderSites() {
  const container = $('panelSites');
  const groups = groupSites(DATA.sites);
  let html = '';
  for (const [groupName, sites] of groups) {
    const blockedCount = sites.filter(s => s.blocked).length;
    const label = groupName + (blockedCount > 0 ? ' (' + blockedCount + ' blocked)' : '');
    html += '<div class="group" data-group="' + groupName + '">'
      + '<div class="group-header" onclick="toggleGroup(this)">'
      + '<div class="group-title">' + esc(groupName) + ' <span class="count">' + sites.length + '</span></div>'
      + '<span class="group-arrow">&#9654;</span>'
      + '</div>'
      + '<div class="group-body">';
    for (const s of sites) {
      html += siteRow(s);
    }
    html += '</div></div>';
  }
  container.innerHTML = html;
}

function siteRow(s) {
  const cls = s.blocked ? 'item blocked' : 'item';
  const btn = s.blocked
    ? '<button class="btn sm secondary" onclick="unblock(\\'sites\\',\\'' + s.fingerprint + '\\')">' + _t('restore') + '</button>'
    : '<button class="btn sm danger" onclick="block(\\'sites\\',\\'' + s.fingerprint + '\\')">' + _t('block') + '</button>';
  return '<div class="' + cls + '" data-search="' + esc((s.name||'') + ' ' + s.key + ' ' + s.api) + '">'
    + '<span class="item-name" title="' + esc(s.key) + '">' + esc(s.name || s.key) + '</span>'
    + typeSpan(s.type, SITE_TYPE_TIPS)
    + '<span class="item-api" title="' + esc(s.api) + '">' + esc(s.api) + '</span>'
    + '<span class="item-actions">' + btn + '</span>'
    + '</div>';
}

function renderParses() {
  const container = $('panelParses');
  let html = '<div class="flat-list">';
  for (const p of DATA.parses) {
    html += parseRow(p);
  }
  html += '</div>';
  container.innerHTML = html;
}

function parseRow(p) {
  const cls = p.blocked ? 'item blocked' : 'item';
  const id = p.url;
  const btn = p.blocked
    ? '<button class="btn sm secondary" onclick="unblock(\\'parses\\',\\'' + esc(id) + '\\')">' + _t('restore') + '</button>'
    : '<button class="btn sm danger" onclick="block(\\'parses\\',\\'' + esc(id) + '\\')">' + _t('block') + '</button>';
  return '<div class="' + cls + '" data-search="' + esc((p.name||'') + ' ' + p.url) + '">'
    + '<span class="item-name">' + esc(p.name) + '</span>'
    + typeSpan(p.type, PARSE_TYPE_TIPS)
    + '<span class="item-api" title="' + esc(p.url) + '">' + esc(p.url) + '</span>'
    + '<span class="item-actions">' + btn + '</span>'
    + '</div>';
}

function renderLives() {
  const container = $('panelLives');
  let html = '<div class="flat-list">';
  for (const l of DATA.lives) {
    html += liveRow(l);
  }
  html += '</div>';
  container.innerHTML = html;
}

function liveRow(l) {
  const url = l.url || l.api || '';
  const cls = l.blocked ? 'item blocked' : 'item';
  const btn = url
    ? (l.blocked
      ? '<button class="btn sm secondary" onclick="unblock(\\'lives\\',\\'' + esc(url) + '\\')">' + _t('restore') + '</button>'
      : '<button class="btn sm danger" onclick="block(\\'lives\\',\\'' + esc(url) + '\\')">' + _t('block') + '</button>')
    : '';
  return '<div class="' + cls + '" data-search="' + esc((l.name||'') + ' ' + url) + '">'
    + '<span class="item-name">' + esc(l.name || '(unnamed)') + '</span>'
    + typeSpan(l.type, LIVE_TYPE_TIPS)
    + '<span class="item-api" title="' + esc(url) + '">' + esc(url) + '</span>'
    + '<span class="item-actions">' + btn + '</span>'
    + '</div>';
}

function esc(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function toggleGroup(el) {
  el.parentElement.classList.toggle('open');
}

function doSearch() {
  const q = $('searchInput').value.toLowerCase().trim();
  const panel = document.querySelector('.tab-panel.active');
  if (!panel) return;
  panel.querySelectorAll('.item').forEach(item => {
    const text = (item.dataset.search || '').toLowerCase();
    item.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
  // Also hide empty groups
  panel.querySelectorAll('.group').forEach(g => {
    const visible = g.querySelectorAll('.item:not([style*="display: none"])').length;
    g.style.display = visible > 0 ? '' : 'none';
  });
}

async function block(type, id) {
  try {
    const res = await fetch('/admin/blacklist', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id })
    });
    if (!res.ok) { alert('Failed: ' + (await res.json()).error); return; }
    // Update local state
    if (type === 'sites') {
      const s = DATA.sites.find(s => s.fingerprint === id);
      if (s) s.blocked = true;
      renderSites();
    } else if (type === 'parses') {
      const p = DATA.parses.find(p => p.url === id);
      if (p) p.blocked = true;
      renderParses();
    } else if (type === 'lives') {
      const l = DATA.lives.find(l => (l.url || l.api || '') === id);
      if (l) l.blocked = true;
      renderLives();
    }
    updateStats();
  } catch (e) { alert('Network error'); }
}

async function unblock(type, id) {
  try {
    const res = await fetch('/admin/blacklist', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id })
    });
    if (!res.ok) { alert('Failed: ' + (await res.json()).error); return; }
    if (type === 'sites') {
      const s = DATA.sites.find(s => s.fingerprint === id);
      if (s) s.blocked = false;
      renderSites();
    } else if (type === 'parses') {
      const p = DATA.parses.find(p => p.url === id);
      if (p) p.blocked = false;
      renderParses();
    } else if (type === 'lives') {
      const l = DATA.lives.find(l => (l.url || l.api || '') === id);
      if (l) l.blocked = false;
      renderLives();
    }
    updateStats();
  } catch (e) { alert('Network error'); }
}

applyLang(getLang());

// Check for saved token
const saved = sessionStorage.getItem('admin_token');
if (saved) {
  TOKEN = saved;
  loadData();
}

function doLogin() {
  TOKEN = $('tokenInput').value.trim();
  if (!TOKEN) return;
  sessionStorage.setItem('admin_token', TOKEN);
  loadData();
}
</script>
</body>
</html>`;
