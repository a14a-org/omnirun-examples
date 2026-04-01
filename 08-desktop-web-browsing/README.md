# Desktop Web Browsing with OmniRun

Launch a desktop sandbox, install Firefox, browse websites, and capture screenshots -- all programmatically.

## What This Demonstrates

- Creating a desktop sandbox with internet access using the `"desktop"` template
- Installing packages (Firefox ESR) inside the sandbox via `sandbox.commands.run()`
- Controlling the desktop with `sandbox.desktop.keyboard()` for navigation
- Taking screenshots with `sandbox.desktop.screenshot()` and saving them locally
- Exposing the desktop via noVNC with `sandbox.expose()` for live viewing

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add your API key:

   ```bash
   cp .env.example .env
   # Edit .env and set OMNIRUN_API_KEY
   ```

3. Run the example:

   ```bash
   npm start
   ```

## How It Works

1. A desktop sandbox is created with the `"desktop"` template and internet enabled.
2. Firefox ESR is installed via `apt-get install`.
3. Firefox opens to https://news.ycombinator.com in the sandbox display.
4. After waiting for the page to load, a screenshot is taken and saved locally.
5. The script navigates to a second site (https://github.com/trending) using keyboard shortcuts (Ctrl+L, type URL, Enter).
6. A second screenshot is taken and saved locally.
7. A noVNC preview URL is created on port 6080 so you can watch the desktop live in your browser.
8. The sandbox stays running until you press Ctrl+C.

## Expected Output

```
Creating desktop sandbox...
Sandbox: sb_abc123
Waiting for desktop to start...
Installing Firefox ESR (this may take a minute)...
Firefox ESR installed.
Opening Firefox to https://news.ycombinator.com ...
Waiting 5s for page to load...
Taking screenshot of Hacker News...
Saved screenshots/hackernews.png
Navigating to https://github.com/trending ...
Waiting 5s for page to load...
Taking screenshot of GitHub Trending...
Saved screenshots/github-trending.png
Creating desktop preview URL...

========================================
  Desktop URL: https://preview.omnirun.io/sb_abc123
========================================

Screenshots saved:
  - screenshots/hackernews.png
  - screenshots/github-trending.png

Open the Desktop URL in your browser to watch the sandbox live.
Press Ctrl+C to tear down the sandbox.
```
