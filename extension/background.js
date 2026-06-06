// esuTABs background service worker
// Throttled refresh of RSS feeds and GitHub content via chrome.alarms.

const RSS_ALARM = 'esutabs-rss-refresh';
const GH_ALARM = 'esutabs-github-sync';

// Default feed sources — used only as offline fallback if neither the
// remote feeds.json (GitHub) nor the bundled extension/data/feeds.json is reachable.
const DEFAULT_RSS_SOURCES = {
  rss_open_source: [
    'https://www.linuxfoundation.org/feed/',
    'https://www.cncf.io/feed/',
    'https://www.openssf.org/feed/',
    'https://fedoramagazine.org/feed/',
    'https://kde.org/announcements/rss.xml',
    'https://planet.gnome.org/rss20.xml'
  ],
  rss_suse: [
    'https://www.suse.com/c/feed/',
    'https://www.suse.com/news/feed/'
  ]
};

// Remote-configurable content on GitHub (raw). Edit these files in the repo
// to change facts, "on this day" entries, OR which RSS feed URLs are pulled
// for the two fixed categories (open source + SUSE).
const GITHUB_RAW = {
  facts: 'https://raw.githubusercontent.com/bertboerland/esuTABs/main/extension/data/facts.json',
  history: 'https://raw.githubusercontent.com/bertboerland/esuTABs/main/extension/data/history.json',
  feeds: 'https://raw.githubusercontent.com/bertboerland/esuTABs/main/extension/data/feeds.json'
};

function validFeedsConfig(o) {
  return o && typeof o === 'object'
    && Array.isArray(o.rss_open_source) && o.rss_open_source.every(u => typeof u === 'string' && /^https:\/\//i.test(u))
    && Array.isArray(o.rss_suse) && o.rss_suse.every(u => typeof u === 'string' && /^https:\/\//i.test(u));
}

async function getFeedSources() {
  // 1. Remote override cached from GitHub
  try {
    const { gh_feeds } = await chrome.storage.local.get('gh_feeds');
    if (validFeedsConfig(gh_feeds)) return gh_feeds;
  } catch (_) {}
  // 2. Bundled file shipped with the extension
  try {
    const res = await fetch(chrome.runtime.getURL('data/feeds.json'));
    if (res.ok) {
      const json = await res.json();
      if (validFeedsConfig(json)) return json;
    }
  } catch (_) {}
  // 3. Hardcoded fallback
  return DEFAULT_RSS_SOURCES;
}




chrome.runtime.onInstalled.addListener(async () => {
  chrome.alarms.create(RSS_ALARM, { delayInMinutes: 1, periodInMinutes: 60 });
  // Sync facts + history from GitHub once a day so content can be updated remotely
  chrome.alarms.create(GH_ALARM, { delayInMinutes: 2, periodInMinutes: 1440 });
  await refreshRss().catch(() => {});
  await syncGithub().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(RSS_ALARM, { delayInMinutes: 1, periodInMinutes: 60 });
  chrome.alarms.create(GH_ALARM, { delayInMinutes: 2, periodInMinutes: 1440 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === RSS_ALARM) await refreshRss().catch(() => {});
  if (alarm.name === GH_ALARM) await syncGithub().catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'esutabs:refresh-rss') {
    refreshRss().then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
});

async function refreshRss() {
  const sources = await getFeedSources();
  const out = {};
  for (const [key, urls] of Object.entries(sources)) {
    const items = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) continue;
        const xml = await res.text();
        items.push(...parseFeed(xml, url));
      } catch (_) { /* offline / blocked — skip */ }
    }
    items.sort((a, b) => (b.date || 0) - (a.date || 0));
    out[key] = items.slice(0, 20);
  }
  await chrome.storage.local.set({
    rss_open_source: out.rss_open_source || [],
    rss_suse: out.rss_suse || [],
    rss_last_updated: Date.now()
  });
}

function parseFeed(xml, sourceUrl) {
  const items = [];
  // Strip CDATA and naive parse — service worker has no DOMParser
  const blocks = xml.split(/<item[\s>]|<entry[\s>]/i).slice(1);
  for (const raw of blocks) {
    const title = pick(raw, 'title');
    const link = pickLink(raw);
    const pub = pick(raw, 'pubDate') || pick(raw, 'updated') || pick(raw, 'published');
    const date = pub ? Date.parse(pub) : 0;
    if (title && link) items.push({ title: cleanText(title), link, date, source: hostname(sourceUrl) });
  }
  return items;
}

function pick(s, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = s.match(re);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}
function pickLink(s) {
  let m = s.match(/<link[^>]*href=["']([^"']+)["']/i);
  if (m) return m[1];
  m = s.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (m) return m[1].trim();
  return '';
}
function cleanText(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}
function hostname(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }

async function syncGithub() {
  const update = {};
  for (const [key, url] of Object.entries(GITHUB_RAW)) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) continue;
      const json = await res.json();
      update[`gh_${key}`] = json;
    } catch (_) { /* offline — keep cache */ }
  }
  if (Object.keys(update).length) {
    update.gh_last_sync = Date.now();
    await chrome.storage.local.set(update);
  }
}
