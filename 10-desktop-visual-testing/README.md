# Visual Regression Testing with Desktop Screenshots

Demonstrates how to use OmniRun's desktop sandbox for visual regression testing of a web application. No browser automation framework (Playwright, Selenium, Puppeteer) is needed -- the sandbox provides a full desktop environment with a real browser, mouse, and keyboard.

## What This Demonstrates

- Creating a desktop sandbox with a full GUI environment
- Running a web server and opening a real browser inside the sandbox
- Interacting with web UI elements via `sandbox.desktop.leftClick()` and `sandbox.desktop.type()`
- Capturing screenshots at different states with `sandbox.desktop.screenshot()`
- Simple file-size-based change detection between screenshots
- Saving screenshots locally with timestamps for review

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

1. A desktop sandbox is created with a virtual display (Xvfb on `:99`).
2. A simple login form (HTML/CSS/JS) is written into the sandbox filesystem.
3. Python's built-in HTTP server serves the page on port 8000.
4. Firefox opens the page inside the sandbox's virtual display.
5. The script takes a **baseline** screenshot of the untouched form.
6. It fills in the username and password fields using mouse clicks and keyboard input, then takes an **interaction** screenshot.
7. It clicks Submit and takes a **submitted** screenshot showing the success state.
8. All three screenshots are compared by file size as a simple change detection heuristic.
9. Screenshots are saved locally in a `screenshots/` directory with timestamps.

## Why Desktop Screenshots Instead of Browser Automation?

- **No framework lock-in.** Works with any browser, any web technology. No Playwright, Selenium, or Puppeteer to install or maintain.
- **Real rendering.** Screenshots come from a real browser in a real desktop environment -- the same pixels a user would see.
- **Isolated and reproducible.** Each test run gets a clean sandbox. No flaky state from previous runs.
- **Simple to set up.** The only dependency is `@omnirun/sdk`. The sandbox provides the browser, display server, and everything else.

## Extending This

- Replace file-size comparison with pixel-level diffing (e.g., using `pixelmatch` or `sharp`).
- Store baseline screenshots in git and compare against them in CI.
- Test multiple browsers or screen resolutions by creating different sandbox configurations.
- Add viewport resizing to test responsive layouts.
- Integrate with an LLM to analyze screenshots and describe visual differences in natural language.
