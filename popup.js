// popup script — large iframe of cheder-bht so editing happens in-place
const SITE = 'https://beit-hatalmud.github.io/cheder-bht/';
const APPS = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
const TOKEN = 'BHT_AGENT_2026';

const frame = document.getElementById('frame');
const statusEl = document.getElementById('status');

function loadTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  try { localStorage.setItem('behavior_tab', tab === 'events' ? 'events' : tab); } catch(_) {}
  // Pass tab via hash so behavior.js can pick it up. Set storage in iframe too.
  frame.src = SITE + '#behavior';
  // Try to set sessionStorage inside iframe after load
  frame.onload = () => {
    try {
      frame.contentWindow.sessionStorage.setItem('behavior_tab', tab);
      // Force re-render
      if (frame.contentWindow.switchBehaviorTab) frame.contentWindow.switchBehaviorTab(tab);
    } catch(_) {}
  };
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => loadTab(btn.dataset.tab));
});
document.getElementById('refresh').addEventListener('click', () => {
  frame.src = frame.src;
  checkConnection();
});
document.getElementById('open-tab').addEventListener('click', () => {
  chrome.tabs.create({ url: SITE + '#behavior' });
});

async function checkConnection() {
  statusEl.textContent = 'בודק חיבור...';
  statusEl.classList.remove('err');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(APPS + '?action=ping&token=' + TOKEN, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await r.json();
    const t = new Date(d.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    statusEl.textContent = '✓ מחובר ל-' + d.agent + ' · ' + (d.user || '') + ' · ' + t;
  } catch (e) {
    statusEl.classList.add('err');
    statusEl.textContent = '✗ שגיאת חיבור: ' + (e.message || e).toString().substring(0, 50);
  }
}

// Initial load
loadTab(localStorage.getItem('behavior_tab') || 'events');
checkConnection();
