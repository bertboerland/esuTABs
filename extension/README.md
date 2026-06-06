# esuTABs

Open Source Knowledge, One Tab at a Time.

## Install (unpacked)

1. Download and unzip `esutabs.zip`.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the unzipped folder.
5. Open a new tab.

## GitHub-as-source

The background worker periodically pulls `facts.json` and `history.json`
from a GitHub repo (configure in `background.js`, constant `GITHUB_RAW`).
If the repo is unreachable, the bundled local files are used.

Released under GPLv2 or later. Not affiliated with SUSE.
