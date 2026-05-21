// Floating Action Button injected into Gmail. Click → opens a slide-out panel
// with quick actions (new event, new task, new signature, pending approvals).
(function() {
  if (window.__bhtFabInjected) return;
  window.__bhtFabInjected = true;

  const APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
  const TOKEN = 'BHT_AGENT_2026';
  const SITE = 'https://beit-hatalmud.github.io/cheder-bht/';

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k,v]) => {
      if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    });
    children.forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }

  // Floating button
  const fab = el('div', {
    id: 'bht-fab',
    title: 'מעקב התנהגות - בית התלמוד',
    onclick: togglePanel,
  }, '🎓');
  document.body.appendChild(fab);

  // Slide-out panel
  const panel = el('div', { id: 'bht-panel' });
  panel.innerHTML = `
    <div class="bht-header">
      <strong>🎓 מעקב התנהגות</strong>
      <button class="bht-close" onclick="document.getElementById('bht-panel').classList.remove('open')">×</button>
    </div>
    <div class="bht-body">
      <div class="bht-stats" id="bht-stats">טוען...</div>
      <div class="bht-actions">
        <button class="bht-btn" data-action="new-event">+ אירוע חדש</button>
        <button class="bht-btn" data-action="new-task">+ משימה</button>
        <button class="bht-btn" data-action="new-sig">+ חתימת הורים</button>
        <button class="bht-btn" data-action="pending">ממתינים לאישור</button>
        <button class="bht-btn bht-link" data-action="open-site">פתח את האתר המלא</button>
      </div>
      <div class="bht-section" id="bht-pending-section"></div>
    </div>
  `;
  document.body.appendChild(panel);

  panel.querySelectorAll('.bht-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action));
  });

  function togglePanel() {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) refreshStats();
  }

  async function refreshStats() {
    document.getElementById('bht-stats').textContent = 'טוען נתונים...';
    try {
      const url = `${APPS_SCRIPT}?action=ping&token=${TOKEN}`;
      const r = await fetch(url);
      const d = await r.json();
      document.getElementById('bht-stats').innerHTML = `<div>✓ מחובר ל-${d.agent}</div><div class="bht-mini">${new Date(d.time).toLocaleString('he-IL')}</div>`;
    } catch (e) {
      document.getElementById('bht-stats').innerHTML = `<div class="bht-err">✗ שגיאת חיבור: ${e.message}</div>`;
    }
  }

  function handleAction(action) {
    if (action === 'new-event') window.open(SITE + '#behavior', '_blank');
    else if (action === 'new-task') window.open(SITE + '#behavior', '_blank');
    else if (action === 'new-sig') window.open(SITE + '#behavior', '_blank');
    else if (action === 'pending') window.open(SITE + '#behavior', '_blank');
    else if (action === 'open-site') window.open(SITE, '_blank');
  }
})();
