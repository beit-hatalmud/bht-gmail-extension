// Always-visible floating panel inside Gmail. Auto-refreshes pending count
// every 60s. User can minimize but state persists.
(function() {
  if (window.__bhtFabInjected) return;
  window.__bhtFabInjected = true;

  const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';
  const SITE = 'https://beit-hatalmud.github.io/cheder-bht/';
  const REFRESH_INTERVAL = 60 * 1000;
  const MINIMIZED_KEY = 'bht_panel_minimized';

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k,v]) => {
      if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'className') e.className = v;
      else e.setAttribute(k, v);
    });
    children.forEach(c => c && e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }

  // Container with persistent state
  const container = el('div', { id: 'bht-container' });
  container.innerHTML = `
    <div id="bht-panel">
      <div class="bht-header">
        <strong>🎓 מעקב התנהגות</strong>
        <div>
          <button class="bht-refresh" title="רענן">⟳</button>
          <button class="bht-minimize" title="מזער">_</button>
        </div>
      </div>
      <div class="bht-body">
        <div class="bht-stats" id="bht-stats"><div class="bht-loading"><span class="spinner"></span> טוען...</div></div>
        <div class="bht-actions">
          <button class="bht-btn" data-action="behavior">📋 אירועים <span class="bht-badge" id="bht-events-badge"></span></button>
          <button class="bht-btn" data-action="tasks">✅ משימות <span class="bht-badge" id="bht-tasks-badge"></span></button>
          <button class="bht-btn" data-action="forms">📝 חתימות</button>
          <button class="bht-btn" data-action="card">👤 כרטיס תלמיד</button>
          <button class="bht-btn bht-link" data-action="open-site">🌐 פתח אתר מלא</button>
        </div>
        <div class="bht-section">
          <div class="bht-mini">📞 קו /8 = מעקב התנהגות טלפוני</div>
          <div class="bht-mini">📞 /6/6 = סוכן ענן מהיר (Gemini)</div>
        </div>
      </div>
    </div>
    <button id="bht-fab" title="פתח מעקב התנהגות">🎓<span class="bht-badge" id="bht-fab-badge"></span></button>
  `;
  document.body.appendChild(container);

  const panel = document.querySelector('#bht-panel');
  const fab = document.querySelector('#bht-fab');
  fab.addEventListener('click', () => setMinimized(false));
  document.querySelector('.bht-minimize').addEventListener('click', () => setMinimized(true));
  document.querySelector('.bht-refresh').addEventListener('click', refresh);
  document.querySelectorAll('.bht-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });

  function setMinimized(min) {
    panel.classList.toggle('minimized', min);
    fab.classList.toggle('show', min);
    try { localStorage.setItem(MINIMIZED_KEY, min ? '1' : '0'); } catch(_) {}
  }

  // Restore state
  let initiallyMin = false;
  try { initiallyMin = localStorage.getItem(MINIMIZED_KEY) === '1'; } catch(_) {}
  setMinimized(initiallyMin);

  function handleAction(action) {
    const map = {
      'behavior': '#behavior',
      'tasks': '#behavior',
      'forms': '#behavior',
      'card': '#behavior',
      'open-site': '',
    };
    const tabMap = { 'tasks': 'tasks', 'forms': 'forms', 'card': 'card' };
    if (tabMap[action]) {
      try { localStorage.setItem('behavior_tab', tabMap[action]); } catch(_) {}
    }
    window.open(SITE + (map[action] || ''), '_blank');
  }

  async function refresh() {
    const statsEl = document.getElementById('bht-stats');
    statsEl.innerHTML = '<div class="bht-loading"><span class="spinner"></span> מתעדכן...</div>';
    try {
      // Ping (with timeout)
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(APPS_SCRIPT + '?action=ping&token=' + TOKEN, { signal: ctrl.signal });
      clearTimeout(timer);
      const d = await r.json();
      const t = new Date(d.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      statsEl.innerHTML = `<div class="bht-ok">✓ מחובר ל-${d.agent}</div><div class="bht-mini">עודכן ${t}</div>`;
    } catch (e) {
      statsEl.innerHTML = `<div class="bht-err">✗ לא מחובר</div><div class="bht-mini">${(e.message||e).toString().substring(0,40)}</div>`;
    }
  }

  refresh();
  setInterval(refresh, REFRESH_INTERVAL);
})();
