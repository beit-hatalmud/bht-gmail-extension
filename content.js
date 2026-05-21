// Floating panel inside Gmail. Two modes:
//  - mini (default): 280px panel with status + quick links + selected-text capture
//  - full: 95vh iframe with the entire cheder-bht site
(function() {
  if (window.__bhtFabInjected) return;
  window.__bhtFabInjected = true;

  const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';
  const SITE = 'https://beit-hatalmud.github.io/cheder-bht/';
  const REFRESH_INTERVAL = 60 * 1000;
  const MIN_KEY = 'bht_panel_minimized';
  const MODE_KEY = 'bht_panel_mode';  // 'mini' or 'full'

  const container = document.createElement('div');
  container.id = 'bht-container';
  container.innerHTML = `
    <div id="bht-panel">
      <div class="bht-header">
        <strong>🎓 מעקב התנהגות</strong>
        <div class="bht-header-btns">
          <button class="bht-mode" title="הרחב/צמצם">⛶</button>
          <button class="bht-refresh" title="רענן">⟳</button>
          <button class="bht-minimize" title="מזער">_</button>
        </div>
      </div>
      <div class="bht-body bht-mini-body">
        <div class="bht-stats" id="bht-stats"><div class="bht-loading"><span class="spinner"></span> טוען...</div></div>
        <div class="bht-selected-block" id="bht-sel-block" style="display:none">
          <div class="bht-mini">📋 נבחר טקסט מהמייל:</div>
          <div class="bht-selected" id="bht-sel"></div>
          <div class="bht-sel-actions">
            <button class="bht-btn-small" data-action="new-event-with-text">+ אירוע מהטקסט</button>
            <button class="bht-btn-small" data-action="new-task-with-text">+ משימה מהטקסט</button>
            <button class="bht-btn-small" data-action="copy-text">העתק</button>
          </div>
        </div>
        <div class="bht-actions">
          <button class="bht-btn" data-action="full">🎯 הרחב לאתר המלא</button>
          <button class="bht-btn" data-action="behavior">📋 אירועים</button>
          <button class="bht-btn" data-action="tasks">✅ משימות</button>
          <button class="bht-btn" data-action="forms">📝 חתימות הורים</button>
          <button class="bht-btn" data-action="card">👤 כרטיס תלמיד</button>
          <button class="bht-btn bht-link" data-action="open-tab">🌐 פתח בלשונית חדשה</button>
        </div>
      </div>
      <div class="bht-body bht-full-body" style="display:none">
        <iframe id="bht-iframe" src="about:blank" style="width:100%;height:100%;border:0;border-radius:0 0 14px 14px"></iframe>
      </div>
    </div>
    <button id="bht-fab" title="פתח מעקב התנהגות">🎓</button>
  `;
  document.body.appendChild(container);

  const panel = container.querySelector('#bht-panel');
  const fab = container.querySelector('#bht-fab');
  const iframe = container.querySelector('#bht-iframe');
  const miniBody = container.querySelector('.bht-mini-body');
  const fullBody = container.querySelector('.bht-full-body');

  fab.addEventListener('click', () => setMin(false));
  container.querySelector('.bht-minimize').addEventListener('click', () => setMin(true));
  container.querySelector('.bht-refresh').addEventListener('click', refresh);
  container.querySelector('.bht-mode').addEventListener('click', toggleMode);
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });

  function setMin(min) {
    panel.classList.toggle('minimized', min);
    fab.classList.toggle('show', min);
    try { localStorage.setItem(MIN_KEY, min ? '1' : '0'); } catch(_) {}
  }

  function setMode(mode) {
    panel.classList.toggle('full', mode === 'full');
    miniBody.style.display = mode === 'full' ? 'none' : 'block';
    fullBody.style.display = mode === 'full' ? 'block' : 'none';
    if (mode === 'full' && iframe.src === 'about:blank') iframe.src = SITE + '#behavior';
    try { localStorage.setItem(MODE_KEY, mode); } catch(_) {}
  }

  function toggleMode() {
    const cur = panel.classList.contains('full') ? 'full' : 'mini';
    setMode(cur === 'full' ? 'mini' : 'full');
  }

  // Restore state
  let initMin = false, initMode = 'mini';
  try { initMin = localStorage.getItem(MIN_KEY) === '1'; } catch(_) {}
  try { initMode = localStorage.getItem(MODE_KEY) || 'mini'; } catch(_) {}
  setMin(initMin);
  setMode(initMode);

  let lastSelection = '';
  // Track selected text in Gmail
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection ? window.getSelection().toString().trim() : '';
    if (sel && sel !== lastSelection && sel.length < 500) {
      lastSelection = sel;
      const block = container.querySelector('#bht-sel-block');
      container.querySelector('#bht-sel').textContent = sel.length > 80 ? sel.substring(0, 80) + '…' : sel;
      block.style.display = 'block';
    }
  });

  function handleAction(action) {
    if (action === 'full') return setMode('full');
    if (action === 'open-tab') { window.open(SITE, '_blank'); return; }
    const hash = '#behavior';
    const tabMap = { 'tasks': 'tasks', 'forms': 'forms', 'card': 'card' };
    if (tabMap[action]) {
      try { localStorage.setItem('behavior_tab', tabMap[action]); } catch(_) {}
    }
    if (action === 'copy-text') {
      navigator.clipboard.writeText(lastSelection || '').then(() =>
        flashStatus('✓ הועתק ל-clipboard'));
      return;
    }
    if (action === 'new-event-with-text' || action === 'new-task-with-text') {
      // Open full site with selected text in localStorage for behavior.js to pick up
      try {
        localStorage.setItem('bht_inject_text', lastSelection);
        localStorage.setItem('bht_inject_target', action === 'new-event-with-text' ? 'event' : 'task');
      } catch(_) {}
      setMode('full');
      if (iframe.src === 'about:blank' || !iframe.src.includes('#behavior')) {
        iframe.src = SITE + hash;
      } else {
        // Already loaded — reload to trigger
        iframe.contentWindow.postMessage({ bht: true, type: 'inject', text: lastSelection, target: action }, '*');
      }
      return;
    }
    // Default: open in inline iframe
    setMode('full');
    if (iframe.src === 'about:blank' || !iframe.src.includes(hash)) iframe.src = SITE + hash;
  }

  function flashStatus(msg) {
    const stats = container.querySelector('#bht-stats');
    const orig = stats.innerHTML;
    stats.innerHTML = `<div class="bht-ok">${msg}</div>`;
    setTimeout(() => { stats.innerHTML = orig; }, 1500);
  }

  async function refresh() {
    const statsEl = container.querySelector('#bht-stats');
    statsEl.innerHTML = '<div class="bht-loading"><span class="spinner"></span> מתעדכן...</div>';
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(APPS_SCRIPT + '?action=ping&token=' + TOKEN, { signal: ctrl.signal });
      clearTimeout(timer);
      const d = await r.json();
      const t = new Date(d.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      statsEl.innerHTML = `<div class="bht-ok">✓ מחובר</div><div class="bht-mini">${d.user || ''} · ${t}</div>`;
    } catch (e) {
      statsEl.innerHTML = `<div class="bht-err">✗ לא מחובר</div><div class="bht-mini">${(e.message||e).toString().substring(0,40)}</div>`;
    }
  }

  refresh();
  setInterval(refresh, REFRESH_INTERVAL);
})();
