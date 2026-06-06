// esuTABs — newtab UI
(() => {
  const $ = (id) => document.getElementById(id);
  const storage = {
    async get(keys) {
      if (chrome?.storage?.local) return new Promise((r) => chrome.storage.local.get(keys, r));
      return {};
    },
    async set(obj) {
      if (chrome?.storage?.local) return new Promise((r) => chrome.storage.local.set(obj, r));
    }
  };

  // ---------- Clock + countdown ----------
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MILESTONES = ['2026-02-01','2026-05-01','2026-08-01','2026-11-01'];

  function fmtClock(d) {
    const pad = (n) => String(n).padStart(2,'0');
    return `${DAYS[d.getDay()]}, ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function ymd(d) {
    const pad = (n) => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function parseYmd(s) {
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m-1, d);
  }
  function milestoneLabel(dateStr) {
    const d = parseYmd(dateStr);
    return `1 ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function nextMilestone(now) {
    const today = ymd(now);
    for (const m of MILESTONES) {
      if (m === today) return { date: m, sameDay: true };
      if (parseYmd(m) > now) return { date: m, sameDay: false };
    }
    return { date: MILESTONES[MILESTONES.length-1], sameDay: false };
  }
  function fmtCountdown(now) {
    const { date, sameDay } = nextMilestone(now);
    const label = milestoneLabel(date);
    if (sameDay) {
      const month = parseYmd(date).getMonth();
      if (month === 10) return 'New year!';
      return 'New quarter!';
    }
    const ms = parseYmd(date) - now;
    const days = Math.ceil(ms / 86400000);
    return `${days} day${days===1?'':'s'} until ${label}`;
  }
  function tickClock() { $('clock').textContent = fmtClock(new Date()); }
  function tickCountdown() { $('countdown').textContent = fmtCountdown(new Date()); }
  tickClock(); tickCountdown();
  setInterval(tickClock, 1000);
  setInterval(tickCountdown, 60000);


  // ---------- Theme ----------
  function applyTheme(pref) {
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const mode = pref === 'system' ? sys : pref;
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.themePref = pref;
    localStorage.setItem('esutabs.theme', pref);
    storage.set({ theme: pref });
    document.querySelectorAll('.theme-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === pref);
    });
  }
  const initialPref = localStorage.getItem('esutabs.theme') || 'system';
  applyTheme(initialPref);
  document.querySelectorAll('.theme-toggle button').forEach(b => {
    b.addEventListener('click', () => applyTheme(b.dataset.theme));
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if ((localStorage.getItem('esutabs.theme') || 'system') === 'system') applyTheme('system');
  });

  // ---------- Data loading ----------
  async function loadJsonFallback(path) {
    try { const r = await fetch(path); if (r.ok) return await r.json(); } catch {}
    return null;
  }
  async function getFacts() {
    const cached = await storage.get(['gh_facts']);
    if (cached.gh_facts && Array.isArray(cached.gh_facts) && cached.gh_facts.length) return cached.gh_facts;
    return (await loadJsonFallback('data/facts.json')) || [];
  }
  async function getHistory() {
    const cached = await storage.get(['gh_history']);
    if (cached.gh_history && Array.isArray(cached.gh_history) && cached.gh_history.length) return cached.gh_history;
    return (await loadJsonFallback('data/history.json')) || [];
  }

  // ---------- Knowledge card ----------
  let allFacts = [];
  let categoriesSet = new Set();
  let currentFact = null;
  let favorites = new Set();

  function renderFact(fact) {
    if (!fact) return;
    const t = $('factTitle'), d = $('factDesc'), c = $('factCategory'), s = $('factSource'), f = $('favBtn');
    [t,d].forEach(el => el.classList.add('fading'));
    setTimeout(() => {
      t.textContent = fact.title;
      d.textContent = fact.description;
      c.textContent = fact.category || 'Knowledge';
      if (fact.source_url) { s.href = fact.source_url; s.hidden = false; } else { s.hidden = true; }
      const key = factKey(fact);
      f.classList.toggle('active', favorites.has(key));
      f.textContent = favorites.has(key) ? '♥' : '♡';
      currentFact = fact;
      [t,d].forEach(el => el.classList.remove('fading'));
    }, 200);
  }
  function factKey(f) { return `${f.category}::${f.title}`; }

  function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }
  function todayKey() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  function todayHistoryFact(history) {
    const key = todayKey();
    const m = history.find(h => h.date === key);
    if (!m) return null;
    return { title: m.title, description: m.description, category: 'This Day in Open Source History' };
  }


  $('nextFactBtn').addEventListener('click', () => {
    if (!allFacts.length) return;
    let next = pickRandom(allFacts);
    if (currentFact && next.title === currentFact.title && allFacts.length > 1) next = pickRandom(allFacts);
    renderFact(next);
  });
  $('favBtn').addEventListener('click', async () => {
    if (!currentFact) return;
    const k = factKey(currentFact);
    if (favorites.has(k)) favorites.delete(k); else favorites.add(k);
    await storage.set({ favorites: [...favorites] });
    renderFact(currentFact);
  });

  // ---------- Search ----------
  const searchPanel = $('searchPanel');
  $('searchBtn').addEventListener('click', () => {
    searchPanel.hidden = !searchPanel.hidden;
    if (!searchPanel.hidden) $('searchInput').focus();
  });
  function renderSearch(q, cat) {
    const ql = (q||'').toLowerCase().trim();
    const results = allFacts.filter(f =>
      (!cat || f.category === cat) &&
      (!ql || f.title.toLowerCase().includes(ql) || f.description.toLowerCase().includes(ql))
    ).slice(0, 30);
    const root = $('searchResults');
    root.innerHTML = '';
    for (const f of results) {
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `<div>${escapeHtml(f.title)}</div><small>${escapeHtml(f.category)}</small>`;
      el.addEventListener('click', () => { renderFact(f); searchPanel.hidden = true; });
      root.appendChild(el);
    }
    if (!results.length) root.innerHTML = '<div class="item"><small>No matches</small></div>';
  }
  $('searchInput').addEventListener('input', e => renderSearch(e.target.value, $('categoryFilter').value));
  $('categoryFilter').addEventListener('change', e => renderSearch($('searchInput').value, e.target.value));

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

  // ---------- RSS render ----------
  function renderRss(listId, items) {
    const ul = document.getElementById(listId);
    ul.innerHTML = '';
    if (!items || !items.length) {
      ul.innerHTML = '<li class="skeleton">No items cached yet.</li>';
      return;
    }
    for (const it of items.slice(0, 5)) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = it.link; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = it.title;
      const meta = document.createElement('span');
      meta.className = 'meta';
      const dateStr = it.date ? new Date(it.date).toLocaleDateString() : '';
      meta.textContent = [it.source, dateStr].filter(Boolean).join(' · ');
      li.appendChild(a); li.appendChild(meta);
      ul.appendChild(li);
    }
  }

  async function loadRss() {
    const data = await storage.get(['rss_open_source','rss_suse']);
    renderRss('rssOpenSource', data.rss_open_source || []);
    renderRss('rssSuse', data.rss_suse || []);
    // Ask background to refresh in case alarm hasn't run yet
    try { chrome.runtime.sendMessage({ type: 'esutabs:refresh-rss' }, () => {
      chrome.storage.local.get(['rss_open_source','rss_suse'], (d) => {
        renderRss('rssOpenSource', d.rss_open_source || []);
        renderRss('rssSuse', d.rss_suse || []);
      });
    }); } catch {}
  }

  // ---------- Init ----------
  (async () => {
    const stored = await storage.get(['favorites']);
    favorites = new Set(stored.favorites || []);

    const [facts, history] = await Promise.all([getFacts(), getHistory()]);
    allFacts = facts;
    categoriesSet = new Set(facts.map(f => f.category));
    const sel = $('categoryFilter');
    [...categoriesSet].sort().forEach(c => {
      const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o);
    });

    const todayFact = todayHistoryFact(history);
    renderFact(todayFact || pickRandom(facts) || {
      title: 'No knowledge loaded',
      description: 'Add facts to data/facts.json or configure a GitHub source.',
      category: 'esuTABs'
    });

    loadRss();
  })();
})();
