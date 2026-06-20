export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (path === '/manifest.json') {
      return new Response(MANIFEST, {
        headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public,max-age=86400', ...cors }
      });
    }

    if (path === '/sw.js') {
      return new Response(SW, {
        headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache', ...cors }
      });
    }

    // Serve app for all paths
    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'no-cache', ...cors }
    });
  }
};

const MANIFEST = JSON.stringify({
  "name": "Family Calendar",
  "short_name": "FamilyCal",
  "description": "Quilici Family shared calendar",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#1e293b",
  "orientation": "any",
  "icons": [
    { "src": "data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E📅%3C/text%3E%3C/svg%3E", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }
  ]
});

const SW = `
const CACHE = 'family-calendar-v4';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.url.includes('api.github.com')) return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached =>
        cached || fetch(e.request).then(resp => { cache.put(e.request, resp.clone()); return resp; })
      )
    ).catch(() => caches.match(e.request))
  );
});
`;

const HTML = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Family Calendar</title>
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Family Cal">
<meta name="theme-color" content="#1e293b">
<style>
:root {
  --bg: #f0f2f5;
  --surface: #ffffff;
  --surface2: #f4f6f9;
  --border: #e2e8f0;
  --text: #1a202c;
  --text-muted: #718096;
  --accent: #4f46e5;
  --accent-hover: #4338ca;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.07);
  --shadow: 0 2px 10px rgba(0,0,0,0.09);
  --shadow-lg: 0 12px 36px rgba(0,0,0,0.16);
  --radius: 14px;
  --card-radius: 10px;
  --today-bg: rgba(79,70,229,0.08);
  --today-border: #4f46e5;
}
[data-theme="dark"] {
  --bg: #0f172a;
  --surface: #1e293b;
  --surface2: #273548;
  --border: #334155;
  --text: #f1f5f9;
  --text-muted: #94a3b8;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.25);
  --shadow: 0 2px 10px rgba(0,0,0,0.35);
  --shadow-lg: 0 12px 36px rgba(0,0,0,0.5);
  --today-bg: rgba(79,70,229,0.15);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s, color 0.2s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

/* ── HEADER ─────────────────────────────────────────────────── */
header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}
.logo { font-size: 17px; font-weight: 800; letter-spacing: -0.5px; white-space: nowrap; }
.logo span { color: var(--accent); }
.header-nav { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; }
.nav-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
  font-size: 13px; font-weight: 600; cursor: pointer;
  background: var(--surface2); color: var(--text);
  transition: all 0.15s; font-family: inherit;
}
.nav-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.nav-btn:hover:not(.active) { background: var(--border); }
.header-actions { display: flex; align-items: center; gap: 6px; }
.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 13px; border-radius: 8px; border: none;
  font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; font-family: inherit; white-space: nowrap;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--border); }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.btn-icon { padding: 7px 9px; }
.hidden { display: none !important; }

/* ── PERSON TABS ──────────────────────────────────────────── */
.person-tabs-wrap {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.person-tabs-wrap::-webkit-scrollbar { display: none; }
.person-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border: none; background: transparent;
  font-size: 13px; font-weight: 500; cursor: pointer;
  color: var(--text-muted); border-bottom: 2px solid transparent;
  transition: all 0.15s; font-family: inherit; white-space: nowrap;
}
.person-tab.active { color: var(--tab-color, var(--accent)); border-bottom-color: var(--tab-color, var(--accent)); }
.person-tab:hover:not(.active) { color: var(--text); }
.tab-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.tab-edit {
  background: transparent; border: none; cursor: pointer;
  font-size: 12px; color: var(--text-muted); padding: 2px 4px;
  border-radius: 4px; margin-left: 2px;
}
.tab-edit:hover { background: var(--border); color: var(--text); }
.tab-add-btn {
  background: transparent; border: 1px dashed var(--border);
  border-radius: 6px; padding: 4px 10px;
  font-size: 12px; cursor: pointer; color: var(--text-muted);
  margin-left: 4px; transition: all 0.15s; font-family: inherit; white-space: nowrap;
}
.tab-add-btn:hover { background: var(--surface2); color: var(--text); }

/* ── VIEW TOOLBAR ─────────────────────────────────────────── */
.view-toolbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.month-title {
  font-size: 17px; font-weight: 700; flex: 1; text-align: center;
}
.week-title {
  font-size: 15px; font-weight: 700; flex: 1; text-align: center;
}
.arr-btn {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 8px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 16px; color: var(--text);
  transition: background 0.15s;
}
.arr-btn:hover { background: var(--border); }
.today-btn {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 8px; padding: 6px 12px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  color: var(--text); font-family: inherit;
  transition: background 0.15s;
}
.today-btn:hover { background: var(--border); }

/* ── MAIN SCROLL AREA ─────────────────────────────────────── */
.main-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
@media (min-width: 769px) {
  .main-scroll {
    overflow-x: hidden;
  }
}

/* ── MONTH VIEW ───────────────────────────────────────────── */
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-left: 1px solid var(--border);
  border-top: 1px solid var(--border);
  min-width: 100%;
}
@media (max-width: 768px) {
  .month-grid {
    min-width: max-content;
    grid-template-columns: repeat(7, 70px);
  }
}
@media (max-width: 480px) {
  .month-grid {
    grid-template-columns: repeat(7, 60px);
  }
}
.month-dow {
  background: var(--surface);
  padding: 6px 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.month-day {
  background: var(--surface);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  min-height: 80px;
  padding: 4px;
  cursor: pointer;
  transition: background 0.1s;
  position: relative;
}
.month-day:hover { background: var(--surface2); }
.month-day.other-month { background: var(--bg); }
.month-day.other-month .day-num { color: var(--text-muted); }
.month-day.today { background: var(--today-bg); }
.month-day.today .day-num {
  background: var(--accent);
  color: #fff;
  border-radius: 50%;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
}
.day-num {
  font-size: 12px; font-weight: 600;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 2px;
}
.day-events { display: flex; flex-direction: column; gap: 1px; }
.day-event-pill {
  font-size: 10px; font-weight: 500;
  padding: 1px 4px; border-radius: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: #fff; cursor: pointer;
  max-width: 100%;
}
.day-more {
  font-size: 10px; color: var(--text-muted); font-weight: 500;
  padding: 1px 4px; cursor: pointer;
}

/* ── WEEK VIEW ────────────────────────────────────────────── */
.week-container {
  display: flex;
  flex-direction: column;
}
.week-header-row {
  display: grid;
  grid-template-columns: 52px repeat(7, 1fr);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.week-time-gutter { border-right: 1px solid var(--border); }
.week-day-head {
  padding: 6px 4px;
  text-align: center;
  border-right: 1px solid var(--border);
  cursor: pointer;
}
.week-day-head:hover { background: var(--surface2); }
.week-dow { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
.week-day-num {
  font-size: 16px; font-weight: 700;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto; border-radius: 50%;
}
.week-day-num.today { background: var(--accent); color: #fff; }
.week-allday-row {
  display: grid;
  grid-template-columns: 52px repeat(7, 1fr);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  min-height: 28px;
}
.week-allday-label {
  border-right: 1px solid var(--border);
  font-size: 9px; font-weight: 600; color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.week-allday-cell {
  border-right: 1px solid var(--border);
  padding: 2px 2px;
  display: flex; flex-direction: column; gap: 1px;
}
.week-body {
  display: grid;
  grid-template-columns: 52px repeat(7, 1fr);
}
.week-hour-label {
  text-align: right;
  padding: 0 6px;
  font-size: 10px;
  color: var(--text-muted);
  border-right: 1px solid var(--border);
  position: relative;
  top: -6px;
  user-select: none;
}
.week-hour-row {
  display: contents;
}
.week-cell {
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  height: 48px;
  position: relative;
  cursor: pointer;
}
.week-cell:hover { background: var(--surface2); }
.week-cell.today-col { background: var(--today-bg); }
.week-event {
  position: absolute;
  left: 1px; right: 1px;
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 10px; font-weight: 600;
  color: #fff;
  overflow: hidden;
  cursor: pointer;
  z-index: 2;
  line-height: 1.3;
}

/* ── DAY VIEW ─────────────────────────────────────────────── */
.day-container { display: flex; flex-direction: column; }
.day-header-allday {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 8px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.day-allday-label { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
.day-body {
  display: grid;
  grid-template-columns: 52px 1fr;
}
.day-hour-label {
  text-align: right;
  padding: 0 8px;
  font-size: 10px;
  color: var(--text-muted);
  border-right: 1px solid var(--border);
  position: relative;
  top: -6px;
  user-select: none;
}
.day-cell {
  border-bottom: 1px solid var(--border);
  height: 56px;
  position: relative;
  cursor: pointer;
}
.day-cell:hover { background: var(--surface2); }
.day-event {
  position: absolute;
  left: 2px; right: 2px;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 12px; font-weight: 600;
  color: #fff;
  overflow: hidden;
  cursor: pointer;
  z-index: 2;
  line-height: 1.4;
}
.current-time-line {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: #ef4444;
  z-index: 5;
}
.current-time-dot {
  position: absolute;
  left: -4px;
  top: -4px;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #ef4444;
}

/* ── SYNC STATUS ─────────────────────────────────────────── */
.sync-status { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); white-space: nowrap; }
.sync-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; }
.sync-dot.saved { background: #10b981; }
.sync-dot.unsaved { background: #f59e0b; }
.sync-dot.error { background: #ef4444; }
.sync-dot.syncing { background: #4f46e5; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* ── MODAL ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end; justify-content: center;
  backdrop-filter: blur(2px);
}
@media (min-width: 600px) {
  .modal-overlay { align-items: center; }
  .modal-sheet { border-radius: var(--radius) !important; max-width: 460px; width: 100%; }
}
.modal-sheet {
  background: var(--surface);
  border-radius: var(--radius) var(--radius) 0 0;
  padding: 20px;
  width: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.modal-title {
  font-size: 17px; font-weight: 700;
  margin-bottom: 16px;
  display: flex; align-items: center; justify-content: space-between;
}
.modal-close {
  background: var(--surface2); border: none; border-radius: 50%;
  width: 28px; height: 28px; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
}
.modal-close:hover { background: var(--border); color: var(--text); }
.form-group { margin-bottom: 14px; }
.form-label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;
}
.form-input, .form-select, .form-textarea {
  width: 100%; padding: 10px 12px;
  border: 1px solid var(--border); border-radius: 8px;
  background: var(--surface2); color: var(--text);
  font-size: 14px; font-family: inherit;
  transition: border-color 0.15s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none; border-color: var(--accent);
}
.form-textarea { resize: vertical; min-height: 70px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-actions { display: flex; gap: 8px; margin-top: 18px; }
.form-actions .btn { flex: 1; justify-content: center; padding: 10px; font-size: 14px; }

/* ── ASSIGNEE PICKER ─────────────────────────────────────── */
.assignee-picker { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.assignee-toggle {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 20px;
  border: 1.5px solid var(--border);
  background: var(--surface2); color: var(--text);
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.15s; font-family: inherit;
}
.assignee-toggle.selected {
  background: var(--at-bg, rgba(79,70,229,0.1));
  border-color: var(--at-color, var(--accent));
  color: var(--at-color, var(--accent));
}
.at-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── COLOR SWATCHES ─────────────────────────────────────── */
.color-swatches { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.color-swatch {
  width: 26px; height: 26px; border-radius: 50%; cursor: pointer;
  border: 3px solid transparent; transition: transform 0.1s;
}
.color-swatch:hover { transform: scale(1.15); }
.color-swatch.selected { border-color: var(--text); }

/* ── GITHUB MODAL ────────────────────────────────────────── */
.gh-status-row { display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--surface2); border-radius: 8px; margin-bottom: 14px; font-size: 13px; }

/* ── TOAST ───────────────────────────────────────────────── */
#toastWrap { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 9000; display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none; }
.toast {
  background: #1e293b; color: #f1f5f9;
  padding: 10px 18px; border-radius: 20px;
  font-size: 13px; font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  animation: toastIn 0.25s ease, toastOut 0.3s 2.3s ease forwards;
  pointer-events: none;
}
.toast.success { background: #065f46; }
.toast.error { background: #7f1d1d; }
@keyframes toastIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes toastOut { from{opacity:1} to{opacity:0} }

/* ── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 500px) {
  .month-day { min-height: 56px; }
  .week-event { font-size: 9px; }
  .month-dow { font-size: 10px; padding: 4px 2px; }
  .day-event-pill { font-size: 9px; }
}

/* ── SPINNING SYNC ───────────────────────────────────────── */
.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
</style>
</head>
<body>

<!-- HEADER -->
<header>
  <div class="logo">📅 Family<span>Cal</span></div>
  <div class="header-nav">
    <button class="nav-btn active" id="viewMonth" onclick="setView('month')">Month</button>
    <button class="nav-btn" id="viewWeek" onclick="setView('week')">Week</button>
    <button class="nav-btn" id="viewDay" onclick="setView('day')">Day</button>
  </div>
  <div class="header-actions">
    <button class="btn btn-ghost btn-icon" id="themeBtn" onclick="toggleTheme()" title="Toggle theme">☀️</button>
    <button class="btn btn-ghost btn-icon" id="syncBtn" onclick="githubPush()" title="Sync to GitHub">⟳</button>
    <button class="btn btn-ghost btn-icon" onclick="openGithubModal()" title="GitHub settings">⚙</button>
    <button class="btn btn-primary" onclick="openEventModal()">+ Event</button>
  </div>
</header>

<!-- PERSON TABS -->
<div class="person-tabs-wrap" id="personTabsWrap"></div>

<!-- SYNC STATUS BAR -->
<div style="background:var(--surface);border-bottom:1px solid var(--border);padding:4px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
  <div class="sync-status">
    <div class="sync-dot" id="syncDot"></div>
    <span id="syncLabel">Not connected</span>
  </div>
  <div style="font-size:11px;color:var(--text-muted)" id="eventCount"></div>
</div>

<!-- VIEW TOOLBAR -->
<div class="view-toolbar">
  <button class="arr-btn" onclick="navPrev()">‹</button>
  <div class="month-title" id="viewTitle"></div>
  <button class="today-btn" onclick="goToday()">Today</button>
  <button class="arr-btn" onclick="navNext()">›</button>
</div>

<!-- MAIN SCROLL -->
<div class="main-scroll" id="mainScroll">
  <div id="calendarView"></div>
</div>

<!-- TOAST -->
<div id="toastWrap"></div>

<!-- ══════════════════════════ EVENT MODAL ══════════════════════════ -->
<div class="modal-overlay hidden" id="eventModalOverlay">
  <div class="modal-sheet">
    <div class="modal-title">
      <span id="eventModalTitle">Add Event</span>
      <button class="modal-close" onclick="closeEventModal()">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input class="form-input" id="eTitle" placeholder="What's happening?" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea class="form-textarea" id="eDesc" placeholder="Details, location, notes…"></textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date *</label>
        <input class="form-input" id="eDate" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">End Date</label>
        <input class="form-input" id="eEndDate" type="date">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="eAllDay" onchange="toggleTimeFields()" style="width:16px;height:16px;cursor:pointer"> All day
      </label>
    </div>
    <div id="timeFields" class="form-row">
      <div class="form-group">
        <label class="form-label">Start Time</label>
        <input class="form-input" id="eStart" type="time" value="09:00">
      </div>
      <div class="form-group">
        <label class="form-label">End Time</label>
        <input class="form-input" id="eEnd" type="time" value="10:00">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Repeat</label>
      <select class="form-select" id="eRepeat">
        <option value="">Does not repeat</option>
        <option value="daily">Daily</option>
        <option value="weekdays">Weekdays only</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Who</label>
      <div class="assignee-picker" id="assigneePicker"></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-danger hidden" id="eDelete" onclick="deleteEvent()">Delete</button>
      <button class="btn btn-ghost" onclick="closeEventModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEvent()">Save</button>
    </div>
  </div>
</div>

<!-- ══════════════════════════ PERSON MODAL ══════════════════════════ -->
<div class="modal-overlay hidden" id="personModalOverlay">
  <div class="modal-sheet">
    <div class="modal-title">
      <span id="personModalTitle">Add Person</span>
      <button class="modal-close" onclick="closePersonModal()">✕</button>
    </div>
    <div class="form-group">
      <label class="form-label">Name *</label>
      <input class="form-input" id="pName" placeholder="e.g. Tony, Trisha, Michael…" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Color</label>
      <div class="color-swatches" id="colorSwatches"></div>
    </div>
    <div class="form-actions">
      <button class="btn btn-danger hidden" id="pDelete" onclick="deletePerson()">Remove</button>
      <button class="btn btn-ghost" onclick="closePersonModal()">Cancel</button>
      <button class="btn btn-primary" onclick="savePerson()">Save</button>
    </div>
  </div>
</div>

<!-- ══════════════════════════ GITHUB MODAL ══════════════════════════ -->
<div class="modal-overlay hidden" id="githubModalOverlay">
  <div class="modal-sheet">
    <div class="modal-title">
      <span>GitHub Sync</span>
      <button class="modal-close" onclick="closeGithubModal()">✕</button>
    </div>
    <div class="gh-status-row" id="ghStatusRow">
      <div class="sync-dot" id="ghModalDot"></div>
      <span id="ghModalStatus">Not connected</span>
    </div>
    <div class="form-group">
      <label class="form-label">GitHub Personal Access Token</label>
      <input class="form-input" id="ghToken" type="password" placeholder="ghp_…" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Repository (owner/repo)</label>
      <input class="form-input" id="ghRepo" placeholder="tquilici/family-calendar" autocomplete="off">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Branch</label>
        <input class="form-input" id="ghBranch" placeholder="main" value="main" autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label">File Path</label>
        <input class="form-input" id="ghPath" placeholder="calendar-data.json" value="calendar-data.json" autocomplete="off">
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-danger hidden" id="ghDisconnect" onclick="disconnectGithub()">Disconnect</button>
      <button class="btn btn-ghost" onclick="closeGithubModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveGithubSettings()">Connect & Sync</button>
    </div>
  </div>
</div>

<script>
// ── CONSTANTS ─────────────────────────────────────────────────────────────
const PERSON_COLORS = [
  '#4f46e5','#0891b2','#059669','#d97706','#dc2626',
  '#7c3aed','#db2777','#0284c7','#65a30d','#ea580c',
];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const HOURS = Array.from({length:24},(_,i)=>{
  if(i===0) return '12 AM';
  if(i<12) return i+' AM';
  if(i===12) return '12 PM';
  return (i-12)+' PM';
});

// ── STATE ──────────────────────────────────────────────────────────────────
let db = {
  version: 1,
  nextId: 1,
  nextPersonId: 1,
  people: [],
  events: [],
};
let currentView    = 'month';
let currentDate    = new Date();   // anchor date for views
let activePersonId = null;
let editingEventId = null;
let editingPersonId = null;
let selectedAssignees = new Set();
let selectedColor  = PERSON_COLORS[0];

// GitHub sync
let ghConfig   = null;
let ghSha      = null;
let isSyncing  = false;
let isDirty    = false;
let syncError  = false;
let lastSyncTime = null;
let syncTimer  = null;

// ── STORAGE ────────────────────────────────────────────────────────────────
function loadFromStorage() {
  try {
    const raw = localStorage.getItem('family_calendar_v1');
    if (raw) db = JSON.parse(raw);
    if (!db.people) db.people = [];
    if (!db.events) db.events = [];
    if (!db.nextPersonId) db.nextPersonId = 1;
  } catch(e) {}
}
function saveToStorageOnly() {
  try { localStorage.setItem('family_calendar_v1', JSON.stringify(db)); } catch(e) {}
}
function saveToStorage() {
  saveToStorageOnly();
  isDirty = true;
  syncStatusUpdate();
  if (ghConfig && ghConfig.token) autoSync();
}

// ── GITHUB SYNC ────────────────────────────────────────────────────────────
const GH_API = 'https://api.github.com';

function loadGithubConfig() {
  try {
    const raw = localStorage.getItem('cal_github_config');
    if (raw) ghConfig = JSON.parse(raw);
  } catch(e) {}
}
function persistGithubConfig() {
  if (ghConfig) localStorage.setItem('cal_github_config', JSON.stringify(ghConfig));
  else          localStorage.removeItem('cal_github_config');
}

async function githubPull() {
  if (!ghConfig || !ghConfig.token) return;
  isSyncing = true; syncError = false;
  syncStatusUpdate();
  try {
    const url = GH_API+'/repos/'+ghConfig.owner+'/'+ghConfig.repo+'/contents/'+ghConfig.path+'?ref='+ghConfig.branch+'&_='+Date.now();
    const res = await fetch(url, { headers: { 'Authorization': 'token '+ghConfig.token, 'Accept': 'application/vnd.github.v3+json' } });
    if (res.status === 404) { isSyncing = false; lastSyncTime = Date.now(); syncStatusUpdate(); return; }
    if (!res.ok) throw new Error('GitHub '+res.status);
    const data = await res.json();
    ghSha = data.sha;
    const parsed = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\\n/g,'')))));
    if (!Array.isArray(parsed.events)) throw new Error('Invalid data');
    db = parsed;
    if (!db.people) db.people = [];
    saveToStorageOnly();
    isDirty = false; lastSyncTime = Date.now(); isSyncing = false;
    syncStatusUpdate();
    renderAll();
    toast('Pulled from GitHub ✓', 'success');
  } catch(e) {
    isSyncing = false; syncError = true;
    syncStatusUpdate();
    toast('Pull failed: '+e.message, 'error');
  }
}

async function githubPush() {
  if (!ghConfig || !ghConfig.token) { openGithubModal(); return; }
  if (isSyncing) return;
  isSyncing = true; syncError = false;
  const btn = document.getElementById('syncBtn');
  if (btn) btn.classList.add('spinning');
  syncStatusUpdate();
  try {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));
    const body = { message: 'Update family calendar', content, branch: ghConfig.branch };
    if (ghSha) body.sha = ghSha;
    const res = await fetch(GH_API+'/repos/'+ghConfig.owner+'/'+ghConfig.repo+'/contents/'+ghConfig.path, {
      method: 'PUT',
      headers: { 'Authorization': 'token '+ghConfig.token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message||'GitHub '+res.status); }
    const data = await res.json();
    ghSha = data.content.sha;
    isDirty = false; lastSyncTime = Date.now(); isSyncing = false;
    if (btn) btn.classList.remove('spinning');
    syncStatusUpdate();
    toast('Synced to GitHub ✓', 'success');
  } catch(e) {
    isSyncing = false; syncError = true;
    if (btn) btn.classList.remove('spinning');
    syncStatusUpdate();
    toast('Sync failed: '+e.message, 'error');
  }
}

function autoSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(githubPush, 2500);
}

function syncStatusUpdate() {
  const dot = document.getElementById('syncDot');
  const lbl = document.getElementById('syncLabel');
  if (!dot||!lbl) return;
  if (isSyncing) { dot.className='sync-dot syncing'; lbl.textContent='Syncing…'; return; }
  if (!ghConfig||!ghConfig.token) { dot.className='sync-dot'; lbl.textContent='Not connected'; return; }
  if (syncError) { dot.className='sync-dot error'; lbl.textContent='Sync error'; return; }
  if (isDirty) { dot.className='sync-dot unsaved'; lbl.textContent='Unsaved'; }
  else { dot.className='sync-dot saved'; lbl.textContent = lastSyncTime ? 'Synced '+timeAgo(lastSyncTime) : 'Synced'; }
}

function openGithubModal() {
  document.getElementById('ghToken').value  = ghConfig ? (ghConfig.token||'') : '';
  document.getElementById('ghRepo').value   = ghConfig ? ((ghConfig.owner||'')+'/'+  (ghConfig.repo||'')) : 'tquilici/family-calendar';
  document.getElementById('ghBranch').value = ghConfig ? (ghConfig.branch||'main') : 'main';
  document.getElementById('ghPath').value   = ghConfig ? (ghConfig.path||'calendar-data.json') : 'calendar-data.json';
  document.getElementById('ghDisconnect').classList.toggle('hidden', !ghConfig);
  const d = document.getElementById('ghModalDot');
  const s = document.getElementById('ghModalStatus');
  if (ghConfig && ghConfig.token) { d.className='sync-dot saved'; s.textContent='Connected to '+ghConfig.owner+'/'+ghConfig.repo; }
  else { d.className='sync-dot'; s.textContent='Not connected'; }
  document.getElementById('githubModalOverlay').classList.remove('hidden');
  setTimeout(()=>document.getElementById('ghToken').focus(),60);
}
function closeGithubModal() { document.getElementById('githubModalOverlay').classList.add('hidden'); }
function saveGithubSettings() {
  const token = document.getElementById('ghToken').value.trim();
  const repoRaw = document.getElementById('ghRepo').value.trim();
  const branch = document.getElementById('ghBranch').value.trim() || 'main';
  const path   = document.getElementById('ghPath').value.trim() || 'calendar-data.json';
  if (!token||!repoRaw) { toast('Token and repository are required','error'); return; }
  const parts = repoRaw.split('/');
  if (parts.length!==2||!parts[0]||!parts[1]) { toast('Repository must be owner/repo format','error'); return; }
  ghConfig = { token, owner: parts[0], repo: parts[1], branch, path };
  ghSha = null;
  persistGithubConfig();
  closeGithubModal();
  syncStatusUpdate();
  toast('GitHub connected','success');
  githubPull();
}
function disconnectGithub() {
  ghConfig = null; ghSha = null;
  persistGithubConfig();
  closeGithubModal();
  isDirty = true; syncStatusUpdate();
  toast('GitHub disconnected');
}

// ── VIEW SWITCHING ──────────────────────────────────────────────────────────
function setView(v) {
  currentView = v;
  ['month','week','day'].forEach(n => {
    document.getElementById('view'+cap(n)).classList.toggle('active', n === v);
  });
  renderCalendar();
}

function navPrev() {
  if (currentView==='month') { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1); }
  else if (currentView==='week') { currentDate = new Date(currentDate.getTime()-7*86400000); }
  else { currentDate = new Date(currentDate.getTime()-86400000); }
  renderCalendar();
}
function navNext() {
  if (currentView==='month') { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1); }
  else if (currentView==='week') { currentDate = new Date(currentDate.getTime()+7*86400000); }
  else { currentDate = new Date(currentDate.getTime()+86400000); }
  renderCalendar();
}
function goToday() {
  currentDate = new Date();
  renderCalendar();
}

// ── PERSON TABS ─────────────────────────────────────────────────────────────
function renderTabs() {
  const wrap = document.getElementById('personTabsWrap');
  wrap.innerHTML = '';
  const allTab = makeTab(null,'All','#718096',false);
  wrap.appendChild(allTab);
  db.people.forEach(p => wrap.appendChild(makeTab(p.id,p.name,p.color,true)));
  const addBtn = document.createElement('button');
  addBtn.className='tab-add-btn';
  addBtn.innerHTML='+ Person';
  addBtn.onclick = ()=>openPersonModal();
  wrap.appendChild(addBtn);
}
function makeTab(personId,name,color,showEdit) {
  const btn = document.createElement('button');
  btn.className='person-tab'+(activePersonId===personId?' active':'');
  btn.style.setProperty('--tab-color',color);
  const av = document.createElement('span');
  av.className='tab-avatar'; av.style.background=color; av.textContent=initials(name);
  btn.appendChild(av);
  btn.appendChild(document.createTextNode(' '+name));
  if (showEdit) {
    const eb = document.createElement('button');
    eb.className='tab-edit'; eb.title='Edit '+name; eb.textContent='✎';
    eb.onclick = e=>{ e.stopPropagation(); openPersonModal(personId); };
    btn.appendChild(eb);
  }
  btn.onclick = e=>{ if(e.target.classList.contains('tab-edit')) return; activePersonId=personId; renderTabs(); renderCalendar(); };
  return btn;
}

// ── EVENTS HELPERS ─────────────────────────────────────────────────────────
function eventsForDay(dateStr) {
  const results = [];
  for (const ev of db.events) {
    if (matchesDate(ev, dateStr)) results.push(ev);
  }
  return results.filter(ev => !activePersonId || (ev.assignees||[]).includes(activePersonId));
}

function matchesDate(ev, dateStr) {
  const d = dateStr;
  const end = ev.endDate || ev.date;

  if (ev.repeat === 'daily') return ev.date <= d && d <= end;
  if (ev.repeat === 'weekdays') {
    if (ev.date > d || d > end) return false;
    const dow = new Date(d+'T12:00:00').getDay();
    return dow >= 1 && dow <= 5;
  }
  if (ev.repeat === 'weekly') {
    if (ev.date > d || d > end) return false;
    const evDow = new Date(ev.date+'T12:00:00').getDay();
    const tDow  = new Date(d+'T12:00:00').getDay();
    return evDow === tDow;
  }
  if (ev.repeat === 'monthly') {
    if (ev.date > d || d > end) return false;
    return ev.date.slice(8) === d.slice(8);
  }
  if (ev.repeat === 'yearly') {
    if (ev.date > d || d > end) return false;
    return ev.date.slice(5) === d.slice(5);
  }
  // Multi-day or single-day (no repeat)
  return ev.date <= d && d <= end;
}

function getEventColor(ev) {
  if (!ev.assignees || !ev.assignees.length) return '#4f46e5';
  const p = db.people.find(p=>p.id===ev.assignees[0]);
  return p ? p.color : '#4f46e5';
}

function isHistoricalEvent(ev) {
  const today = toDateStr(new Date());
  const endDate = ev.endDate || ev.date;
  return endDate < today;
}

function getEventColor(ev) {
  const color = getEventColor(ev);
  if (isHistoricalEvent(ev)) {
    return color + '4d';
  }
  return color;
}

// ── CALENDAR RENDER ─────────────────────────────────────────────────────────
function renderAll() { renderTabs(); renderCalendar(); updateEventCount(); }

function renderCalendar() {
  const view = document.getElementById('calendarView');
  updateEventCount();
  if (currentView==='month') renderMonth(view);
  else if (currentView==='week') renderWeek(view);
  else renderDay(view);
}

function updateEventCount() {
  const cnt = document.getElementById('eventCount');
  if (cnt) cnt.textContent = db.events.length + ' event' + (db.events.length===1?'':'s');
}

// ── MONTH VIEW ──────────────────────────────────────────────────────────────
function renderMonth(container) {
  const y = currentDate.getFullYear(), m = currentDate.getMonth();
  document.getElementById('viewTitle').textContent = MONTHS[m]+' '+y;

  const first = new Date(y,m,1).getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const todayStr = toDateStr(new Date());

  let html = '<div class="month-grid">';
  DAYS_SHORT.forEach(d=>{ html += \`<div class="month-dow">\${d}</div>\`; });

  // Leading blank days from prev month
  const daysInPrev = new Date(y,m,0).getDate();
  for (let i=0; i<first; i++) {
    const d = daysInPrev - first + 1 + i;
    const ds = toDateStr(new Date(y,m-1,d));
    html += \`<div class="month-day other-month" onclick="clickDay('\${ds}')"><div class="day-num">\${d}</div><div class="day-events">\${monthDayEvents(ds)}</div></div>\`;
  }

  // Current month days
  for (let d=1; d<=daysInMonth; d++) {
    const ds = toDateStr(new Date(y,m,d));
    const isToday = ds===todayStr;
    html += \`<div class="month-day\${isToday?' today':''}" onclick="clickDay('\${ds}')"><div class="day-num">\${d}</div><div class="day-events">\${monthDayEvents(ds)}</div></div>\`;
  }

  // Trailing days
  const total = first + daysInMonth;
  const trailing = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d=1; d<=trailing; d++) {
    const ds = toDateStr(new Date(y,m+1,d));
    html += \`<div class="month-day other-month" onclick="clickDay('\${ds}')"><div class="day-num">\${d}</div><div class="day-events">\${monthDayEvents(ds)}</div></div>\`;
  }

  html += '</div>';
  container.innerHTML = html;
}

function monthDayEvents(ds) {
  const evs = eventsForDay(ds);
  const MAX = 3;
  let html = '';
  evs.slice(0,MAX).forEach(ev=>{
    const col = getEventColor(ev);
    const title = esc(ev.title);
    html += \`<div class="day-event-pill" style="background:\${col}" onclick="event.stopPropagation();openEventModal('\${ds}','\${ev.id}')" title="\${title}">\${title}</div>\`;
  });
  if (evs.length>MAX) html += \`<div class="day-more">+\${evs.length-MAX} more</div>\`;
  return html;
}

function clickDay(ds) {
  // In month view, clicking a day switches to day view on that date
  currentDate = new Date(ds+'T12:00:00');
  setView('day');
}

// ── WEEK VIEW ───────────────────────────────────────────────────────────────
function renderWeek(container) {
  // Find Sunday of current week
  const dow = currentDate.getDay();
  const weekStart = new Date(currentDate.getTime() - dow*86400000);
  const days = Array.from({length:7},(_,i)=>new Date(weekStart.getTime()+i*86400000));
  const todayStr = toDateStr(new Date());

  // Title
  const s = days[0], e = days[6];
  document.getElementById('viewTitle').textContent =
    MONTHS[s.getMonth()].slice(0,3)+' '+s.getDate()+' – '+
    (s.getMonth()!==e.getMonth()?MONTHS[e.getMonth()].slice(0,3)+' ':'')+e.getDate()+', '+e.getFullYear();

  let html = '<div class="week-container">';

  // Day headers
  html += '<div class="week-header-row"><div class="week-time-gutter"></div>';
  days.forEach(d=>{
    const ds = toDateStr(d);
    const isT = ds===todayStr;
    html += \`<div class="week-day-head" onclick="clickWeekDay('\${ds}')">
      <div class="week-dow">\${DAYS_SHORT[d.getDay()]}</div>
      <div class="week-day-num\${isT?' today':''}">\` + d.getDate() + \`</div>
    </div>\`;
  });
  html += '</div>';

  // All-day row
  html += '<div class="week-allday-row"><div class="week-allday-label">all‑day</div>';
  days.forEach(d=>{
    const ds = toDateStr(d);
    const allevs = eventsForDay(ds).filter(ev=>ev.allDay);
    html += \`<div class="week-allday-cell">\`;
    allevs.forEach(ev=>{
      const col = getEventColor(ev);
      html += \`<div class="day-event-pill" style="background:\${col};font-size:10px" onclick="openEventModal('\${ds}','\${ev.id}')">\${esc(ev.title)}</div>\`;
    });
    html += '</div>';
  });
  html += '</div>';

  // Hour rows
  html += '<div class="week-body">';
  for (let hr=0; hr<24; hr++) {
    html += \`<div class="week-hour-label">\${HOURS[hr]}</div>\`;
    days.forEach(d=>{
      const ds = toDateStr(d);
      const isT = ds===todayStr;
      html += \`<div class="week-cell\${isT?' today-col':''}" onclick="openEventModal('\${ds}',null,'\${hr}:00')">\`;
      // Timed events for this hour
      eventsForDay(ds).filter(ev=>!ev.allDay && ev.startTime).forEach(ev=>{
        const [eh,em] = ev.startTime.split(':').map(Number);
        if (eh===hr) {
          const [endH,endM] = (ev.endTime||addHour(ev.startTime)).split(':').map(Number);
          const durMins = Math.max(30,(endH-eh)*60+(endM-em));
          const top = (em/60)*48;
          const height = (durMins/60)*48;
          const col = getEventColor(ev);
          html += \`<div class="week-event" style="background:\${col};top:\${top}px;height:\${height}px" onclick="event.stopPropagation();openEventModal('\${ds}','\${ev.id}')">\${esc(ev.title)}</div>\`;
        }
      });
      html += '</div>';
    });
  }
  html += '</div></div>';

  container.innerHTML = html;
  // scroll to 7am
  setTimeout(()=>{ const s = document.getElementById('mainScroll'); if(s) s.scrollTop = 7*48; },50);
}

function clickWeekDay(ds) {
  currentDate = new Date(ds+'T12:00:00');
  setView('day');
}

// ── DAY VIEW ─────────────────────────────────────────────────────────────────
function renderDay(container) {
  const ds = toDateStr(currentDate);
  const d = currentDate;
  const todayStr = toDateStr(new Date());
  const isToday = ds===todayStr;

  document.getElementById('viewTitle').textContent =
    DAYS_SHORT[d.getDay()]+', '+MONTHS[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();

  const dayEvs = eventsForDay(ds);
  const allDayEvs = dayEvs.filter(ev=>ev.allDay||!ev.startTime);
  const timedEvs  = dayEvs.filter(ev=>!ev.allDay && ev.startTime);

  let html = '<div class="day-container">';

  // All-day section
  if (allDayEvs.length) {
    html += '<div class="day-header-allday"><div class="day-allday-label">All day</div>';
    allDayEvs.forEach(ev=>{
      const col = getEventColor(ev);
      html += \`<div class="day-event-pill" style="background:\${col};font-size:12px;padding:4px 8px" onclick="openEventModal('\${ds}','\${ev.id}')">\${esc(ev.title)}</div>\`;
    });
    html += '</div>';
  }

  // Hour grid
  html += '<div class="day-body">';
  for (let hr=0; hr<24; hr++) {
    html += \`<div class="day-hour-label">\${HOURS[hr]}</div>\`;
    html += \`<div class="day-cell" onclick="openEventModal('\${ds}',null,'\${hr}:00')">\`;
    timedEvs.forEach(ev=>{
      const [eh,em] = ev.startTime.split(':').map(Number);
      if (eh===hr) {
        const [endH,endM] = (ev.endTime||addHour(ev.startTime)).split(':').map(Number);
        const durMins = Math.max(45,(endH-eh)*60+(endM-em));
        const top = (em/60)*56;
        const height = (durMins/60)*56;
        const col = getEventColor(ev);
        html += \`<div class="day-event" style="background:\${col};top:\${top}px;height:\${height}px" onclick="event.stopPropagation();openEventModal('\${ds}','\${ev.id}')">\${esc(ev.title)}<br><span style="font-size:10px;opacity:0.85">\${ev.startTime}\${ev.endTime?' – '+ev.endTime:''}</span></div>\`;
      }
    });
    // Current time line (today only)
    if (isToday) {
      const now = new Date();
      if (now.getHours()===hr) {
        const pct = now.getMinutes()/60;
        const top = pct*56;
        html += \`<div class="current-time-line" style="top:\${top}px"><div class="current-time-dot"></div></div>\`;
      }
    }
    html += '</div>';
  }
  html += '</div></div>';

  container.innerHTML = html;
  // scroll to current hour or 7am
  setTimeout(()=>{
    const s = document.getElementById('mainScroll');
    if (s) {
      const hr = isToday ? Math.max(0,new Date().getHours()-1) : 7;
      s.scrollTop = hr*56;
    }
  },50);
}

// ── EVENT MODAL ──────────────────────────────────────────────────────────────
function openEventModal(dateStr, id, defaultTime) {
  editingEventId = id || null;
  const ev = id ? db.events.find(e=>e.id==id) : null;
  const today = toDateStr(new Date());

  document.getElementById('eventModalTitle').textContent = ev ? 'Edit Event' : 'Add Event';
  document.getElementById('eTitle').value    = ev ? ev.title : '';
  document.getElementById('eDesc').value     = ev ? (ev.desc||'') : '';
  document.getElementById('eDate').value     = ev ? ev.date : (dateStr||today);
  document.getElementById('eEndDate').value  = ev ? (ev.endDate||'') : '';
  document.getElementById('eAllDay').checked = ev ? !!ev.allDay : !defaultTime;
  document.getElementById('eStart').value    = ev ? (ev.startTime||'09:00') : (defaultTime||'09:00');
  document.getElementById('eEnd').value      = ev ? (ev.endTime||'10:00') : addHour(defaultTime||'09:00');
  document.getElementById('eRepeat').value   = ev ? (ev.repeat||'') : '';
  document.getElementById('eDelete').classList.toggle('hidden', !ev);

  toggleTimeFields();
  // Initialize selectedAssignees: use existing assignees or empty set
  selectedAssignees = new Set(ev && ev.assignees ? ev.assignees : []);
  renderAssigneePicker();
  document.getElementById('eventModalOverlay').classList.remove('hidden');
  setTimeout(()=>document.getElementById('eTitle').focus(),60);
}
function closeEventModal() {
  document.getElementById('eventModalOverlay').classList.add('hidden');
  editingEventId = null;
}
function toggleTimeFields() {
  const allDay = document.getElementById('eAllDay').checked;
  document.getElementById('timeFields').style.display = allDay ? 'none' : '';
}
function renderAssigneePicker() {
  const wrap = document.getElementById('assigneePicker');
  console.log('renderAssigneePicker called, selectedAssignees:', Array.from(selectedAssignees));
  if (!db.people.length) { wrap.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">Add people to assign events.</span>'; return; }

  wrap.innerHTML = db.people.map(p=>{
    const sel = selectedAssignees.has(p.id);
    const checkId = 'assignee_'+p.id;
    return \`<label style="display:flex;align-items:center;gap:8px;padding:6px;cursor:pointer;">
      <input type="checkbox" class="assignee-checkbox" id="\${checkId}" value="\${p.id}" data-person-id="\${p.id}" \${sel?'checked':''}>
      <span class="at-dot" style="background:\${p.color};width:10px;height:10px;border-radius:50%;flex-shrink:0;"></span>
      <span>\${esc(p.name)}</span>
    </label>\`;
  }).join('');

  // Add event listeners to checkboxes
  document.querySelectorAll('.assignee-checkbox').forEach(cb => {
    cb.addEventListener('change', function() {
      const pid = parseInt(this.dataset.personId);
      console.log('Checkbox clicked for person:', pid, 'checked:', this.checked);
      toggleAssignee(pid);
    });
  });
}
function toggleAssignee(pid) {
  if (typeof pid === 'string') pid = isNaN(pid) ? pid : Number(pid);
  console.log('toggleAssignee called with:', pid, 'selectedAssignees before:', Array.from(selectedAssignees));
  if (selectedAssignees.has(pid)) {
    selectedAssignees.delete(pid);
  } else {
    selectedAssignees.add(pid);
  }
  console.log('selectedAssignees after:', Array.from(selectedAssignees));
}
function saveEvent() {
  const title = document.getElementById('eTitle').value.trim();
  if (!title) { toast('Please enter a title','error'); document.getElementById('eTitle').focus(); return; }
  const allDay = document.getElementById('eAllDay').checked;
  const data = {
    title,
    desc:      document.getElementById('eDesc').value.trim(),
    date:      document.getElementById('eDate').value,
    endDate:   document.getElementById('eEndDate').value || undefined,
    allDay,
    startTime: allDay ? undefined : document.getElementById('eStart').value,
    endTime:   allDay ? undefined : document.getElementById('eEnd').value,
    repeat:    document.getElementById('eRepeat').value || undefined,
    assignees: [...selectedAssignees],
    updated:   iso(),
  };
  if (!data.date) { toast('Please pick a date','error'); return; }
  if (editingEventId) {
    const ev = db.events.find(e=>e.id==editingEventId);
    if (ev) Object.assign(ev, data);
    toast('Event updated');
  } else {
    db.events.push(Object.assign({ id: db.nextId++, created: iso() }, data));
    toast('Event added','success');
  }
  saveToStorage();
  closeEventModal();
  renderCalendar();
}
function deleteEvent() {
  db.events = db.events.filter(e=>e.id!=editingEventId);
  saveToStorage();
  closeEventModal();
  renderCalendar();
  toast('Event deleted');
}

// ── PERSON MODAL ─────────────────────────────────────────────────────────────
function openPersonModal(id) {
  editingPersonId = id || null;
  const p = id ? db.people.find(p=>p.id===id) : null;
  document.getElementById('personModalTitle').textContent = p ? 'Edit Person' : 'Add Person';
  document.getElementById('pName').value = p ? p.name : '';
  selectedColor = p ? p.color : nextColor();
  document.getElementById('pDelete').classList.toggle('hidden',!p);
  renderColorSwatches();
  document.getElementById('personModalOverlay').classList.remove('hidden');
  setTimeout(()=>document.getElementById('pName').focus(),60);
}
function closePersonModal() { document.getElementById('personModalOverlay').classList.add('hidden'); editingPersonId=null; }
function renderColorSwatches() {
  document.getElementById('colorSwatches').innerHTML = PERSON_COLORS.map(c=>
    \`<div class="color-swatch\${c===selectedColor?' selected':''}" style="background:\${c}" onclick="pickColor('\${c}')"></div>\`
  ).join('');
}
function pickColor(c) { selectedColor=c; renderColorSwatches(); }
function savePerson() {
  const name = document.getElementById('pName').value.trim();
  if (!name) { toast('Please enter a name','error'); document.getElementById('pName').focus(); return; }
  if (editingPersonId) {
    const p = db.people.find(p=>p.id===editingPersonId);
    p.name=name; p.color=selectedColor;
    toast(name+' updated');
  } else {
    const pid = db.nextPersonId++;
    db.people.push({id:pid,name,color:selectedColor});
    toast(name+' added','success');
  }
  saveToStorage();
  closePersonModal();
  renderTabs();
  renderCalendar();
}
function deletePerson() {
  if (!editingPersonId) return;
  const p = db.people.find(p=>p.id===editingPersonId);
  db.events.forEach(ev=>{ ev.assignees=(ev.assignees||[]).filter(id=>id!==editingPersonId); });
  db.people=db.people.filter(p=>p.id!==editingPersonId);
  if (activePersonId===editingPersonId) activePersonId=null;
  saveToStorage();
  closePersonModal();
  renderTabs();
  renderCalendar();
  toast(((p&&p.name)?p.name:'Person')+' removed');
}
function nextColor() { return PERSON_COLORS[db.people.length%PERSON_COLORS.length]; }

// ── THEME ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const dark = document.documentElement.getAttribute('data-theme')==='dark';
  document.documentElement.setAttribute('data-theme',dark?'':'dark');
  document.getElementById('themeBtn').textContent=dark?'🌙':'☀️';
  localStorage.setItem('cal_theme',dark?'light':'dark');
}
function loadTheme() {
  const saved=localStorage.getItem('cal_theme');
  if (saved==='light') { document.documentElement.setAttribute('data-theme',''); document.getElementById('themeBtn').textContent='🌙'; }
  else { document.documentElement.setAttribute('data-theme','dark'); document.getElementById('themeBtn').textContent='☀️'; }
}

// ── TOAST ────────────────────────────────────────────────────────────────────
function toast(msg,type='') {
  const el=document.createElement('div');
  el.className='toast'+(type?' '+type:'');
  el.textContent=msg;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(()=>el.remove(),2600);
}

// ── UTILS ────────────────────────────────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function cap(s) { return s.charAt(0).toUpperCase()+s.slice(1); }
function iso() { return new Date().toISOString(); }
function toDateStr(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function addHour(t) { const [h,m]=t.split(':').map(Number); return String((h+1)%24).padStart(2,'0')+':'+String(m).padStart(2,'0'); }
function timeAgo(ts) {
  const s=Math.floor((Date.now()-ts)/1000);
  if(s<60) return 'just now';
  if(s<3600) return Math.floor(s/60)+'m ago';
  return Math.floor(s/3600)+'h ago';
}
function initials(name) { return name.trim().split(/\\s+/).slice(0,2).map(w=>w[0].toUpperCase()).join(''); }
function hexToRgba(hex,a) {
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}

// ── KEYBOARD ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){closeEventModal();closePersonModal();closeGithubModal();}
  if((e.metaKey||e.ctrlKey)&&e.key==='n'){e.preventDefault();openEventModal();}
  if((e.metaKey||e.ctrlKey)&&e.key==='s'){e.preventDefault();githubPush();}
  if((e.metaKey||e.ctrlKey)&&e.key==='ArrowLeft'){e.preventDefault();navPrev();}
  if((e.metaKey||e.ctrlKey)&&e.key==='ArrowRight'){e.preventDefault();navNext();}
});
document.addEventListener('click',function(e){
  ['eventModalOverlay','personModalOverlay','githubModalOverlay'].forEach(id=>{
    const el=document.getElementById(id);
    if(el&&e.target===el){el.classList.add('hidden');}
  });
});

// ── BOOT ──────────────────────────────────────────────────────────────────────
try {
  loadGithubConfig();
  loadFromStorage();
  loadTheme();
  syncStatusUpdate();
  renderAll();
  if (ghConfig && ghConfig.token) githubPull();
} catch(err) {
  console.error('Calendar error:',err);
}

// Service worker for offline/PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}
</script>
</body>
</html>
`;
