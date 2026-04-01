import { Sandbox } from "@omnirun/sdk";
import { promises as fs } from "node:fs";

/**
 * Desktop Web Browsing: Launch a desktop sandbox, install Firefox,
 * navigate to websites, and take screenshots.
 *
 * This demonstrates:
 * 1. Creating a desktop sandbox with internet access
 * 2. Installing packages (Firefox ESR) inside the sandbox
 * 3. Using desktop keyboard controls to navigate between sites
 * 4. Taking screenshots and saving them locally
 * 5. Exposing the desktop via noVNC for live viewing
 */

const API_KEY = process.env.OMNIRUN_API_KEY;
const API_URL = process.env.OMNIRUN_API_URL || "https://api.omnirun.io";

if (!API_KEY) {
  console.error("Missing OMNIRUN_API_KEY. Copy .env.example to .env and set your key.");
  process.exit(1);
}

async function browseWeb() {
  await fs.mkdir("screenshots", { recursive: true });

  // 1. Create a desktop sandbox with internet enabled
  console.log("Creating desktop sandbox...");
  const sandbox = await Sandbox.create("desktop", {
    apiKey: API_KEY,
    apiUrl: API_URL,
    timeout: 600,
    internet: true,
    envVars: { RESOLUTION: "1024x768" },
  });
  console.log(`Sandbox: ${sandbox.sandboxId}`);

  try {
    // Wait for desktop services to be ready
    console.log("Waiting for desktop to start...");
    for (let i = 0; i < 30; i++) {
      try {
        await sandbox.desktop.getScreen();
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // 2. Install Firefox (download binary from Mozilla — Ubuntu 22.04 only has snap stubs)
    console.log("Installing Firefox (this may take a minute)...");
    await sandbox.commands.run(
      "apt-get update -qq && apt-get install -y -qq bzip2 xz-utils libdbus-glib-1-2 libgtk-3-0 libasound2",
      { timeout: 60 },
    );
    await sandbox.commands.run(
      "curl -fsSL -L -o /tmp/firefox.tar.xz 'https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US' && tar -xJf /tmp/firefox.tar.xz -C /opt/ && ln -sf /opt/firefox/firefox /usr/local/bin/firefox",
      { timeout: 60 },
    );
    console.log("Firefox installed.");

    // 3. Open Firefox to Hacker News
    console.log("Opening Firefox to https://news.ycombinator.com ...");
    await sandbox.commands.run(
      "DISPLAY=:99 firefox --no-remote https://news.ycombinator.com &",
      { background: true },
    );

    // 4. Wait for page to load
    console.log("Waiting 5s for page to load...");
    await new Promise((r) => setTimeout(r, 5000));

    // 5. Take a screenshot and save locally
    console.log("Taking screenshot of Hacker News...");
    const hnScreenshot = await sandbox.desktop.screenshot();
    await fs.writeFile("screenshots/hackernews.png", Buffer.from(hnScreenshot));
    console.log("Saved screenshots/hackernews.png");

    // 6. Navigate to GitHub Trending: Ctrl+L to focus address bar, type URL, press Enter
    console.log("Navigating to https://github.com/trending ...");
    await sandbox.desktop.keyboard({ action: "press", key: "ctrl+l" });
    await new Promise((r) => setTimeout(r, 500));
    await sandbox.desktop.keyboard({
      action: "type",
      text: "https://github.com/trending",
    });
    await new Promise((r) => setTimeout(r, 300));
    await sandbox.desktop.keyboard({ action: "press", key: "Return" });

    // 7. Wait for page to load, take another screenshot
    console.log("Waiting 5s for page to load...");
    await new Promise((r) => setTimeout(r, 5000));

    console.log("Taking screenshot of GitHub Trending...");
    const ghScreenshot = await sandbox.desktop.screenshot();
    await fs.writeFile(
      "screenshots/github-trending.png",
      Buffer.from(ghScreenshot),
    );
    console.log("Saved screenshots/github-trending.png");

    // 8. Create a noVNC preview URL so the user can watch the desktop live
    console.log("Creating desktop preview URL...");
    const exposure = await sandbox.expose(6080, {
      ttlSeconds: 3600,
      visibility: "public",
    });

    // Wait for exposure to be ready
    for (let i = 0; i < 15; i++) {
      const info = await sandbox.exposures.get(exposure.id);
      if (info.status === "ready") break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 9. Print results
    console.log("");
    console.log("========================================");
    console.log(`  Desktop URL: ${exposure.url}`);
    console.log("========================================");
    console.log("");
    console.log("Screenshots saved:");
    console.log("  - screenshots/hackernews.png");
    console.log("  - screenshots/github-trending.png");
    console.log("");
    console.log("Open the Desktop URL in your browser to watch the sandbox live.");
    console.log("Press Ctrl+C to tear down the sandbox.");

    // 10. Wait for Ctrl+C
    process.on("SIGINT", async () => {
      console.log("\nCleaning up...");
      await sandbox.kill();
      process.exit(0);
    });

    await new Promise(() => {});
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

browseWeb().catch(console.error);
