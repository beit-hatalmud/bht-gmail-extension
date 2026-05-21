// popup script — extracted from inline to comply with Manifest v3 CSP
const SITE = 'https://beit-hatalmud.github.io/cheder-bht/';
const APPS = 'https://script.google.com/macros/s/AKfycbzhRqTLE4fjjDqrH1we-JlGZ15R-ws8b_gfWF1xF1ewailaiyiS_YXqUhRtb3cQghVt/exec';
const TOKEN = 'BHT_AGENT_2026';

function openWithTab(tab) {
  if (tab) {
    try { localStorage.setItem('behavior_tab', tab); } catch (_) {}
  }
  chrome.tabs.create({ url: SITE + (tab ? '#behavior' : '') });
}

document.getElementById('open-site').addEventListener('click', () => chrome.tabs.create({ url: SITE }));
document.getElementById('behavior').addEventListener('click', () => openWithTab('events'));
document.getElementById('forms').addEventListener('click', () => openWithTab('forms'));
document.getElementById('tasks').addEventListener('click', () => openWithTab('tasks'));
document.getElementById('card').addEventListener('click', () => openWithTab('card'));
document.getElementById('phone-info').addEventListener('click', () => alert(
  'קו /8 - מעקב התנהגות:\n' +
  '1 = הקלטת אירוע (זיהוי לפי טלפון + Gemini)\n' +
  '2 = השמעת 5 אירועים אחרונים\n' +
  '3 = משימות פתוחות\n' +
  '4 = חתימות בהמתנה'
));

(async function() {
  const statusEl = document.getElementById('status');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(APPS + '?action=ping&token=' + TOKEN, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await r.json();
    const t = new Date(d.time).toLocaleString('he-IL');
    statusEl.innerHTML = '✓ מחובר<br><span class="mini">' + (d.user || '') + ' · ' + t + '</span>';
  } catch (e) {
    statusEl.innerHTML = '<span class="err">✗ שגיאת חיבור</span><br><span class="mini">' + (e.message || e).toString().substring(0, 40) + '</span>';
  }
})();
