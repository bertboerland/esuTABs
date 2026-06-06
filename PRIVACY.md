# Privacy Policy for esuTABs

_Last updated: 6 June 2026_

This Privacy Policy describes how the **esuTABs** browser extension
("esuTABs", "the Extension", "we", "us", or "our") handles information when
you install and use it in Google Chrome or any other Chromium‑based browser.

By installing or using esuTABs you acknowledge that you have read and
understood this Privacy Policy.

## 1. Summary (plain English)

- We do **not** collect any personal data.
- We do **not** store, transmit, share, rent, trade, or sell any user data.
- We do **not** use analytics, tracking pixels, advertising identifiers, or
  fingerprinting of any kind.
- We do **not** operate any backend server that receives data from the
  Extension. There is no account, no login, and no telemetry.
- Everything the Extension does happens **locally in your browser**.

If we do not collect it, we cannot lose it, leak it, or sell it.

## 2. Information we do not collect

esuTABs does not collect, process, or transmit any of the following:

- Personally identifiable information (name, email address, phone number,
  postal address, government identifiers, etc.);
- Authentication information (passwords, credentials, security questions,
  OAuth tokens, etc.);
- Financial or payment information;
- Health information;
- Personal communications (email, SMS, chat messages);
- Location data (IP‑derived, GPS, Wi‑Fi, or otherwise);
- Web history, browsing activity, click‑stream data, or referrer data;
- User activity such as mouse movements, keystrokes, scroll events, network
  monitoring, or any other behavioural signal;
- Website content from pages you visit;
- Any unique device identifier, advertising identifier, or persistent
  fingerprint.

## 3. Information stored locally on your device

To make the Extension work as a New Tab page, esuTABs may store a small
amount of non‑identifying preference data locally on your device using the
browser's `chrome.storage.local` API. This may include:

- Your selected theme preference (light, dark, or system);
- The identifier of the most recently shown fact, so the same fact is not
  shown twice in a row;
- A short cache of RSS feed entries already fetched from the public sources
  listed in the Extension's manifest, so the New Tab loads quickly and works
  offline.

This data:

- Never leaves your device;
- Is not transmitted to us or to any third party;
- Can be deleted at any time by removing the Extension or by clearing the
  Extension's storage in your browser settings.

## 4. Network requests made by the Extension

The Extension fetches publicly available RSS feeds and JSON data files from
a small, fixed list of open‑source‑related hosts declared in the
Extension's `manifest.json` (for example `raw.githubusercontent.com`,
`www.suse.com`, `www.linuxfoundation.org`, `www.cncf.io`, `www.openssf.org`,
`fedoramagazine.org`, `www.debian.org`, `kde.org`, `planet.gnome.org`).

These requests:

- Are sent **directly from your browser to the publisher of the feed**;
- Are functionally identical to opening those URLs yourself in a browser
  tab;
- Carry only the standard HTTP request information your browser sends to any
  website (such as your IP address and User‑Agent), governed by the privacy
  policy of the receiving site;
- Are **not** routed through any server operated by us. We do not see,
  intercept, log, or store these requests.

We have no business relationship with, and receive no data from, any of
these third‑party feed publishers.

## 5. Permissions used by the Extension

esuTABs requests only the minimum permissions required for its single
purpose (replacing the New Tab page with a curated open‑source knowledge
experience):

- `storage` — to save your theme preference and a small local cache so the
  New Tab works instantly and offline.
- `alarms` — to schedule a periodic background refresh of the local RSS
  cache so headlines are reasonably current when you open a new tab.
- Host permissions for the specific RSS/JSON hosts listed in
  `manifest.json` — required by Chrome to allow the Extension to fetch
  those public feeds from the browser.

The Extension does not request `tabs`, `history`, `cookies`, `webRequest`,
`<all_urls>`, or any other broad permission, and it does not read or modify
the content of any page you visit.

## 6. Cookies and similar technologies

esuTABs does not set, read, or share any cookies. It does not use
localStorage for tracking purposes, web beacons, pixel tags, session
recording, device fingerprinting, or any similar tracking technology.

## 7. Children's privacy

esuTABs is a general‑audience productivity tool. Because the Extension does
not collect any personal data from any user, it does not knowingly collect
any personal data from children under the age of 13 (or the equivalent
minimum age in the user's jurisdiction).

## 8. International users

Because esuTABs does not collect or transmit personal data, there is no
cross‑border transfer of personal data resulting from your use of the
Extension. Use of the Extension is therefore not affected by data
protection regimes such as the EU GDPR, the UK GDPR, the California
Consumer Privacy Act (CCPA/CPRA), or comparable laws, beyond the fact that
the Extension processes no personal data within their scope.

## 9. Data sale and sharing

We do not, and will never:

- Sell, rent, license, or trade any data of any user of the Extension;
- Share any user data with advertisers, data brokers, analytics providers,
  or any other third party;
- Use any user data for advertising, retargeting, profiling, or any purpose
  unrelated to the Extension's single, declared purpose.

## 10. Security

Because esuTABs does not collect, transmit, or store personal data on any
server, there is no central data set that could be exfiltrated. The
Extension is open source; its full source code is available for inspection
at the repository linked below.

## 11. Changes to this Privacy Policy

If this Privacy Policy is updated, the revised version will be published at
the same URL with an updated "Last updated" date. Material changes will be
reflected in the Chrome Web Store listing as part of the next Extension
update.

## 12. Contact

esuTABs is an independent, community open‑source project and is **not**
affiliated with, endorsed by, or sponsored by SUSE.

- Maintainer: Bert Boerland
- Source code: https://github.com/bertboerland/esutabs
- Contact: https://www.linkedin.com/in/bertboerland/

For privacy‑related questions, please open an issue on the GitHub
repository above.
