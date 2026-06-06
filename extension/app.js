// esuTABs — newtab UI
(() => {
  const $ = (id) => document.getElementById(id);
  const DEV = false;
  const logErr = (where, e) => { if (DEV) console.warn('[esuTABs]', where, e); };

  const storage = {
    async get(keys) {
      try {
        if (chrome?.storage?.local) return await new Promise((r) => chrome.storage.local.get(keys, r));
      } catch (e) { logErr('storage.get', e); }
      return {};
    },
    async set(obj) {
      try {
        if (chrome?.storage?.local) return await new Promise((r) => chrome.storage.local.set(obj, r));
      } catch (e) { logErr('storage.set', e); }
    }
  };

  // ---------- Pure date helpers ----------
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MILESTONES = ['2026-02-01','2026-05-01','2026-08-01','2026-11-01'];

  function pad2(n) { return String(n).padStart(2,'0'); }
  function fmtClock(d) {
    return `${DAYS[d.getDay()]}, ${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }
  function ymd(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  }
  function parseYmd(s) {
    const [y,m,d] = String(s).split('-').map(Number);
    return new Date(y, m-1, d);
  }
  function startOfToday() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function milestoneLabel(dateStr) {
    const d = parseYmd(dateStr);
    return `1 ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  function nextMilestone(now) {
    const today = ymd(now);
    for (const m of MILESTONES) {
      if (m === today) return { date: m, sameDay: true };
      if (parseYmd(m) > startOfToday()) return { date: m, sameDay: false };
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
    const ms = parseYmd(date) - startOfToday();
    const days = Math.ceil(ms / 86400000);
    return `${days} day${days===1?'':'s'} until ${label}`;
  }

  // ---------- Cached DOM ----------
  const dom = {
    clock: $('clock'),
    countdown: $('countdown'),
    factTitle: $('factTitle'),
    factDesc: $('factDesc'),
    factCategory: $('factCategory'),
    factSource: $('factSource'),
  };

  // ---------- State ----------
  const state = {
    facts: [],
    currentFact: null,
    categories: new Set(),
  };

  // ---------- Clock + countdown ----------
  function tickClock() { dom.clock.textContent = fmtClock(new Date()); }
  function tickCountdown() { dom.countdown.textContent = fmtCountdown(new Date()); }
  tickClock(); tickCountdown();
  setInterval(tickClock, 1000);
  setInterval(tickCountdown, 60000);

  // ---------- Theme ----------
  function applyTheme(pref) {
    const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const mode = pref === 'system' ? sys : pref;
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.themePref = pref;
    try { localStorage.setItem('esutabs.theme', pref); } catch (e) { logErr('localStorage', e); }
    storage.set({ theme: pref });
    document.querySelectorAll('.theme-toggle button').forEach(b => {
      const active = b.dataset.theme === pref;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  let initialPref = 'system';
  try { initialPref = localStorage.getItem('esutabs.theme') || 'system'; } catch (e) { logErr('localStorage', e); }
  applyTheme(initialPref);
  document.querySelectorAll('.theme-toggle button').forEach(b => {
    b.addEventListener('click', () => applyTheme(b.dataset.theme));
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    let pref = 'system';
    try { pref = localStorage.getItem('esutabs.theme') || 'system'; } catch (e) { logErr('localStorage', e); }
    if (pref === 'system') applyTheme('system');
  });

  // ---------- Data loading & validation ----------
  async function loadJsonFallback(path) {
    try { const r = await fetch(path); if (r.ok) return await r.json(); }
    catch (e) { logErr('fetch ' + path, e); }
    return null;
  }
  function validFact(f) {
    return f && typeof f === 'object'
      && typeof f.title === 'string' && f.title.length
      && typeof f.description === 'string';
  }
  function validHistoryItem(h) {
    return h && typeof h === 'object'
      && typeof h.date === 'string' && (/^\d{4}-\d{2}-\d{2}$/.test(h.date) || /^\d{2}-\d{2}$/.test(h.date))
      && typeof h.title === 'string' && typeof h.description === 'string';
  }
  function sanitizeFacts(arr) {
    return Array.isArray(arr) ? arr.filter(validFact) : [];
  }
  function sanitizeHistory(arr) {
    return Array.isArray(arr) ? arr.filter(validHistoryItem) : [];
  }
  async function getFacts() {
    const cached = await storage.get(['gh_facts']);
    const c = sanitizeFacts(cached.gh_facts);
    if (c.length) return c;
    return sanitizeFacts(await loadJsonFallback('data/facts.json'));
  }
  async function getHistory() {
    const cached = await storage.get(['gh_history']);
    const c = sanitizeHistory(cached.gh_history);
    if (c.length) return c;
    return sanitizeHistory(await loadJsonFallback('data/history.json'));
  }

  // ---------- Knowledge card ----------
  function factKey(f) { return `${f.category}::${f.title}`; }

  function renderFact(fact) {
    if (!fact) return;
    const { factTitle: t, factDesc: d, factCategory: c, factSource: s } = dom;
    [t,d].forEach(el => el.classList.add('fading'));
    setTimeout(() => {
      t.textContent = fact.title;
      d.textContent = fact.description;
      c.textContent = fact.category || 'Knowledge';
      const safeSrc = typeof fact.source_url === 'string' && /^https:\/\//i.test(fact.source_url);
      if (safeSrc) { s.href = fact.source_url; s.hidden = false; } else { s.hidden = true; s.removeAttribute('href'); }
      state.currentFact = fact;
      [t,d].forEach(el => el.classList.remove('fading'));
    }, 200);
  }

  function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]; }
  function todayKey() { return ymd(new Date()); }
  function todayMmDd() { const d = new Date(); return `${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
  function todayHistoryFact(history) {
    const full = todayKey();
    const md = todayMmDd();
    const m = history.find(h => h.date === full || h.date === md);
    if (!m) return null;
    return { title: m.title, description: m.description, category: 'This Day in Open Source History' };
  }

  $('nextFactBtn').addEventListener('click', () => {
    if (!state.facts.length) return;
    let next = pickRandom(state.facts);
    if (state.currentFact && next.title === state.currentFact.title && state.facts.length > 1) next = pickRandom(state.facts);
    renderFact(next);
  });

  // ---------- Search ----------
  function renderSearch(q, cat) {
    const ql = (q||'').toLowerCase().trim();
    const results = state.facts.filter(f =>
      (!cat || f.category === cat) &&
      (!ql || f.title.toLowerCase().includes(ql) || (f.description||'').toLowerCase().includes(ql))
    ).slice(0, 30);
    const root = $('searchResults');
    root.textContent = '';
    if (!results.length) {
      const div = document.createElement('div');
      div.className = 'item';
      const small = document.createElement('small');
      small.textContent = 'No matches';
      div.appendChild(small);
      root.appendChild(div);
      return;
    }
    for (const f of results) {
      const el = document.createElement('div');
      el.className = 'item';
      const title = document.createElement('div');
      title.textContent = f.title;
      const meta = document.createElement('small');
      meta.textContent = f.category || '';
      el.appendChild(title); el.appendChild(meta);
      el.addEventListener('click', () => { renderFact(f); searchPanel.hidden = true; });
      root.appendChild(el);
    }
  }
  function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }
  const debouncedSearch = debounce(() => renderSearch($('searchInput').value, $('categoryFilter').value), 200);
  $('searchInput').addEventListener('input', debouncedSearch);
  $('categoryFilter').addEventListener('change', e => renderSearch($('searchInput').value, e.target.value));

  // ---------- RSS render ----------
  function safeUrl(u) {
    return typeof u === 'string' && /^https:\/\//i.test(u);
  }
  function renderRss(listId, items) {
    const ul = document.getElementById(listId);
    ul.textContent = '';
    const safeItems = Array.isArray(items)
      ? items.filter(it => it && typeof it.title === 'string' && safeUrl(it.link))
      : [];
    if (!safeItems.length) {
      const li = document.createElement('li');
      li.className = 'skeleton';
      li.textContent = 'No items cached yet.';
      ul.appendChild(li);
      return;
    }
    for (const it of safeItems.slice(0, 5)) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = it.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
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
    let osItems = Array.isArray(data.rss_open_source) ? data.rss_open_source : [];
    let suseItems = Array.isArray(data.rss_suse) ? data.rss_suse : [];
    if (!osItems.length) osItems = (await loadJsonFallback('data/rss_open_source.json')) || [];
    if (!suseItems.length) suseItems = (await loadJsonFallback('data/rss_suse.json')) || [];
    renderRss('rssOpenSource', osItems);
    renderRss('rssSuse', suseItems);
    try {
      chrome.runtime.sendMessage({ type: 'esutabs:refresh-rss' }, () => {
        chrome.storage.local.get(['rss_open_source','rss_suse'], (d) => {
          const fresh1 = Array.isArray(d.rss_open_source) && d.rss_open_source.length ? d.rss_open_source : osItems;
          const fresh2 = Array.isArray(d.rss_suse) && d.rss_suse.length ? d.rss_suse : suseItems;
          renderRss('rssOpenSource', fresh1);
          renderRss('rssSuse', fresh2);
        });
      });
    } catch (e) { logErr('refresh-rss', e); }
  }

  // ---------- Init ----------
  (async () => {
    const stored = await storage.get(['favorites']);
    state.favorites = new Set(Array.isArray(stored.favorites) ? stored.favorites : []);

    const [facts, history] = await Promise.all([getFacts(), getHistory()]);
    state.facts = facts;
    state.categories = new Set(facts.map(f => f.category).filter(Boolean));
    const sel = $('categoryFilter');
    [...state.categories].sort().forEach(c => {
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
