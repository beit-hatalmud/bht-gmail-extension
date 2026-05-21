// Always-visible floating panel in Gmail with login form + iframe.
(function() {
  if (window.__bhtFabInjected) return;
  window.__bhtFabInjected = true;

  const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';
  const SITE = 'https://beit-hatalmud.github.io/cheder-bht/';

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

        <div class="bht-login-card" id="bht-login-card">
          <div class="bht-mini">🔑 חיבור אוטומטי לאתר</div>
          <input type="text" id="bht-username" placeholder="שם משתמש" autocomplete="username">
          <div class="bht-pw-row">
            <input type="password" id="bht-password" placeholder="סיסמה" autocomplete="current-password">
            <button class="bht-eye" id="bht-toggle-pw" title="הצג/הסתר">👁</button>
          </div>
          <div class="bht-sel-actions">
            <button class="bht-btn-small" id="bht-save-creds">שמור</button>
            <button class="bht-btn-small" id="bht-clear-creds">נקה</button>
          </div>
          <div class="bht-mini" id="bht-creds-status">לא נשמרו פרטים</div>
        </div>

        <div class="bht-actions">
          <button class="bht-btn" data-action="full">🎯 פתח את האתר כאן</button>
          <button class="bht-btn" data-action="events">📋 אירועים</button>
          <button class="bht-btn" data-action="tasks">✅ משימות</button>
          <button class="bht-btn" data-action="projects">📊 פרויקטים</button>
          <button class="bht-btn" data-action="forms">📝 חתימות הורים</button>
          <button class="bht-btn" data-action="card">👤 כרטיס תלמיד</button>
          <button class="bht-btn bht-link" data-action="open-tab">🌐 פתח בלשונית חדשה</button>
        </div>
      </div>
      <div class="bht-body bht-full-body" style="display:none">
        <iframe id="bht-iframe" src="about:blank"></iframe>
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
  const userIn = container.querySelector('#bht-username');
  const passIn = container.querySelector('#bht-password');

  fab.addEventListener('click', () => setMin(false));
  container.querySelector('.bht-minimize').addEventListener('click', () => setMin(true));
  container.querySelector('.bht-refresh').addEventListener('click', () => { refresh(); reloadIframe(); });
  container.querySelector('.bht-mode').addEventListener('click', () => setMode(panel.classList.contains('full') ? 'mini' : 'full'));
  container.querySelector('#bht-toggle-pw').addEventListener('click', () => {
    passIn.type = passIn.type === 'password' ? 'text' : 'password';
  });
  container.querySelector('#bht-save-creds').addEventListener('click', saveCreds);
  container.querySelector('#bht-clear-creds').addEventListener('click', clearCreds);
  container.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });

  function setMin(min) {
    panel.classList.toggle('minimized', min);
    fab.classList.toggle('show', min);
    chrome.storage.local.set({ bht_min: min });
  }
  function setMode(mode) {
    panel.classList.toggle('full', mode === 'full');
    if (mode === 'full' && iframe.src === 'about:blank') reloadIframe();
    chrome.storage.local.set({ bht_mode: mode });
  }
  function reloadIframe() {
    iframe.src = buildIframeUrl();
  }
  function buildIframeUrl() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['bht_user', 'bht_pass', 'bht_tab'], data => {
        const tab = data.bht_tab || 'events';
        let url = SITE + '#behavior';
        if (data.bht_user && data.bht_pass) {
          url += '?u=' + encodeURIComponent(data.bht_user) + '&p=' + encodeURIComponent(btoa(data.bht_pass));
        }
        resolve(url);
      });
    });
  }
  // Synchronous version returns URL based on cached values
  let _cachedUser = '', _cachedPass = '', _cachedTab = 'events';

  function rebuildIframeUrl() {
    let url = SITE + '#behavior';
    if (_cachedUser && _cachedPass) {
      url = SITE + '?u=' + encodeURIComponent(_cachedUser) + '&p=' + encodeURIComponent(btoa(_cachedPass)) + '#behavior';
    }
    return url;
  }

  function reloadIframe() {
    iframe.src = rebuildIframeUrl();
  }

  function loadStored() {
    chrome.storage.local.get(['bht_user', 'bht_pass', 'bht_min', 'bht_mode', 'bht_tab'], data => {
      if (data.bht_user) { userIn.value = data.bht_user; _cachedUser = data.bht_user; }
      if (data.bht_pass) { passIn.value = data.bht_pass; _cachedPass = data.bht_pass; }
      _cachedTab = data.bht_tab || 'events';
      updateCredsStatus();
      setMin(!!data.bht_min);
      setMode(data.bht_mode || 'mini');
    });
  }

  function saveCreds() {
    _cachedUser = userIn.value.trim();
    _cachedPass = passIn.value;
    chrome.storage.local.set({ bht_user: _cachedUser, bht_pass: _cachedPass }, updateCredsStatus);
    flash('✓ נשמר');
  }
  function clearCreds() {
    _cachedUser = ''; _cachedPass = '';
    userIn.value = ''; passIn.value = '';
    chrome.storage.local.remove(['bht_user', 'bht_pass'], updateCredsStatus);
  }
  function updateCredsStatus() {
    const el = container.querySelector('#bht-creds-status');
    if (_cachedUser && _cachedPass) {
      el.textContent = `✓ נשמר: ${_cachedUser}`;
      el.style.color = '#16a34a';
    } else {
      el.textContent = 'לא נשמרו פרטים';
      el.style.color = '#6b7280';
    }
  }

  // Auto-save on change (debounced)
  let saveTimer = null;
  [userIn, passIn].forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveCreds, 600);
    });
  });

  let lastSelection = '';
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection ? window.getSelection().toString().trim() : '';
    if (sel && sel.length > 5 && sel.length < 500) lastSelection = sel;
  });

  function handleAction(action) {
    if (action === 'open-tab') { window.open(SITE, '_blank'); return; }
    if (action === 'full') { setMode('full'); reloadIframe(); return; }
    const tabMap = { 'events':'events', 'tasks':'tasks', 'forms':'forms', 'card':'card', 'projects':'projects' };
    if (tabMap[action]) {
      _cachedTab = tabMap[action];
      chrome.storage.local.set({ bht_tab: _cachedTab });
    }
    setMode('full');
    reloadIframe();
    // After iframe loads, try to set tab via postMessage
    setTimeout(() => {
      try { iframe.contentWindow.postMessage({ bht: true, tab: tabMap[action] }, '*'); } catch(_) {}
    }, 1500);
  }

  function flash(msg) {
    const stats = container.querySelector('#bht-stats');
    const orig = stats.innerHTML;
    stats.innerHTML = `<div class="bht-ok">${msg}</div>`;
    setTimeout(() => { stats.innerHTML = orig; }, 1200);
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

  loadStored();
  refresh();
  setInterval(refresh, 60000);
})();
