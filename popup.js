// popup.js — Professional popup with all 20 pages
const SITE = 'https://beit-hatalmud.github.io/cheder-bht/';
const APPS = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
const TOKEN = 'BHT_AGENT_2026';

const frame = document.getElementById('frame');
const statusText = document.getElementById('status-text');
const userInfo = document.getElementById('user-info');
const statusBar = document.getElementById('status');
const loader = document.getElementById('loader');

let currentPage = 'home';
let history = [];

function setActiveTab(page) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.page === page);
  });
  // Scroll active tab into view
  const active = document.querySelector('.tab.active');
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

function navigate(page) {
  if (page === currentPage) return;
  if (currentPage) history.push(currentPage);
  if (history.length > 50) history.shift();
  currentPage = page;
  setActiveTab(page);
  loader.classList.remove('hidden');
  try { localStorage.setItem('bht_popup_page', page); } catch (_) {}
  // Set URL with hash
  const targetUrl = SITE + '#' + page;
  if (frame.src.split('#')[0] !== SITE) {
    // First load - need full URL
    frame.src = targetUrl;
  } else {
    // Use postMessage to navigate inside iframe
    try {
      frame.contentWindow.location.hash = page;
    } catch (_) {
      frame.src = targetUrl;
    }
  }
}

// Setup tabs
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.page));
});

// Quick action buttons
document.getElementById('refresh').addEventListener('click', () => {
  loader.classList.remove('hidden');
  frame.src = frame.src;
  checkConnection();
});

document.getElementById('back').addEventListener('click', () => {
  if (history.length > 0) {
    const prev = history.pop();
    currentPage = '';
    navigate(prev);
  }
});

document.getElementById('open-tab').addEventListener('click', () => {
  chrome.tabs.create({ url: SITE + '#' + currentPage });
});

document.getElementById('maximize').addEventListener('click', () => {
  // Open in popup window (larger)
  chrome.windows.create({
    url: SITE + '#' + currentPage,
    type: 'popup',
    width: 1400,
    height: 900,
  });
});

// Frame load handlers
frame.addEventListener('load', () => {
  loader.classList.add('hidden');
  // Try to inject auto-login or read user info
  try {
    const win = frame.contentWindow;
    setTimeout(() => {
      try {
        const userStr = win.sessionStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          userInfo.textContent = `${u.username || ''} ${u.role ? '(' + u.role + ')' : ''}`;
        } else {
          userInfo.textContent = '(לא מחובר)';
        }
      } catch (_) {}
    }, 1500);
  } catch (_) {}
});

frame.addEventListener('error', () => {
  loader.classList.add('hidden');
  statusBar.classList.add('err');
  statusText.textContent = '✗ שגיאה בטעינת האתר';
});

async function checkConnection() {
  statusText.textContent = 'בודק חיבור...';
  statusBar.classList.remove('err', 'warn');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(APPS + '?action=ping&token=' + TOKEN, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await r.json();
    const t = new Date(d.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    statusText.textContent = `✓ מחובר · ${t}`;
  } catch (e) {
    statusBar.classList.add('err');
    statusText.textContent = '✗ ' + (e.message || e).toString().substring(0, 60);
  }
}

// Keyboard shortcuts within popup
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'Backspace' && history.length > 0) {
    e.preventDefault();
    document.getElementById('back').click();
  }
  // Number keys jump to first 9 tabs
  if (e.key >= '1' && e.key <= '9' && !e.ctrlKey) {
    const idx = parseInt(e.key) - 1;
    const tabs = document.querySelectorAll('.tab');
    if (tabs[idx]) tabs[idx].click();
  }
});

// Initial load
const startPage = localStorage.getItem('bht_popup_page') || 'home';
navigate(startPage);
checkConnection();
