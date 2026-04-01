import { Sandbox } from "@omnirun/sdk";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Desktop Visual Testing: Take screenshots of a web app at different states
 * to detect visual regressions — no browser automation framework required.
 *
 * This uses OmniRun's desktop sandbox to:
 * 1. Serve a web app inside a real browser (Firefox)
 * 2. Interact with the UI via mouse clicks and keyboard input
 * 3. Capture screenshots at each step for comparison
 */

const LOGIN_PAGE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f1f5f9; font-family: system-ui, sans-serif;
    }
    .card {
      background: white; padding: 40px; border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1); width: 380px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 24px; color: #0f172a; text-align: center; }
    label { display: block; font-size: 0.875rem; color: #475569; margin-bottom: 6px; }
    input {
      width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1;
      border-radius: 8px; font-size: 1rem; margin-bottom: 16px;
      outline: none; transition: border-color 0.2s;
    }
    input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    button {
      width: 100%; padding: 12px; background: #3b82f6; color: white;
      border: none; border-radius: 8px; font-size: 1rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
    .success {
      display: none; text-align: center; padding: 20px;
      color: #16a34a; font-size: 1.25rem; font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Sign In</h1>
    <form id="loginForm">
      <label for="username">Username</label>
      <input type="text" id="username" name="username" placeholder="Enter username">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="Enter password">
      <button type="submit">Submit</button>
    </form>
    <div class="success" id="successMsg">Login successful!</div>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      this.style.display = 'none';
      document.getElementById('successMsg').style.display = 'block';
    });
  </script>
</body>
</html>`;

// Coordinates for form elements (approximate center positions for 1024x768)
// These target the middle of each input/button in the login form layout.
const COORDS = {
  username: { x: 512, y: 420 },
  password: { x: 512, y: 500 },
  submit:   { x: 512, y: 558 },
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveScreenshot(pngData, name) {
  const dir = join(process.cwd(), "screenshots");
  await mkdir(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${name}_${timestamp}.png`;
  const filepath = join(dir, filename);
  await writeFile(filepath, pngData);
  console.log(`  Saved: ${filepath} (${pngData.byteLength} bytes)`);
  return { filepath, size: pngData.byteLength };
}

async function visualTest() {
  console.log("Creating desktop sandbox...");
  const sandbox = await Sandbox.create("desktop", { timeout: 300, internet: true });
  console.log(`Sandbox: ${sandbox.sandboxId}\n`);

  try {
    // Step 1: Write the HTML page into the sandbox
    console.log("[1/8] Writing login page to sandbox...");
    const b64 = Buffer.from(LOGIN_PAGE).toString("base64");
    await sandbox.commands.run(
      `echo '${b64}' | base64 -d > /workspace/app.html`
    );

    // Step 2: Start the HTTP server
    console.log("[2/8] Starting HTTP server...");
    await sandbox.commands.run(
      "python3 -m http.server 8000 --directory /workspace &",
      { background: true }
    );
    await sleep(2000);

    // Step 3: Install and open Firefox
    console.log("[3/8] Installing and launching Firefox...");
    await sandbox.commands.run(
      "apt-get update -qq && apt-get install -y -qq bzip2 xz-utils libdbus-glib-1-2 libgtk-3-0 libasound2",
      { timeout: 60 }
    );
    await sandbox.commands.run(
      "curl -fsSL -L -o /tmp/firefox.tar.xz 'https://download.mozilla.org/?product=firefox-latest-ssl&os=linux64&lang=en-US' && tar -xJf /tmp/firefox.tar.xz -C /opt/ && ln -sf /opt/firefox/firefox /usr/local/bin/firefox",
      { timeout: 60 }
    );
    await sandbox.commands.run(
      "DISPLAY=:99 firefox --no-remote http://localhost:8000/app.html &",
      { background: true }
    );

    // Wait for Firefox to render the page
    console.log("  Waiting for page to load...");
    await sleep(8000);

    // Step 4: Baseline screenshot
    console.log("[4/8] Taking baseline screenshot...");
    const baseline = await sandbox.desktop.screenshot();
    const baselineInfo = await saveScreenshot(baseline, "01-baseline");

    // Step 5: Click username field and type
    console.log("[5/8] Filling in username...");
    await sandbox.desktop.leftClick(COORDS.username.x, COORDS.username.y);
    await sleep(500);
    await sandbox.desktop.type("admin");
    await sleep(500);

    // Step 6: Click password field and type
    console.log("[6/8] Filling in password...");
    await sandbox.desktop.leftClick(COORDS.password.x, COORDS.password.y);
    await sleep(500);
    await sandbox.desktop.type("secret123");
    await sleep(500);

    // Take interaction screenshot (form filled)
    console.log("  Taking interaction screenshot...");
    const interaction = await sandbox.desktop.screenshot();
    const interactionInfo = await saveScreenshot(interaction, "02-interaction");

    // Step 7: Click Submit
    console.log("[7/8] Clicking Submit...");
    await sandbox.desktop.leftClick(COORDS.submit.x, COORDS.submit.y);
    await sleep(2000);

    // Take submitted screenshot
    console.log("  Taking submitted screenshot...");
    const submitted = await sandbox.desktop.screenshot();
    const submittedInfo = await saveScreenshot(submitted, "03-submitted");

    // Step 8: Compare screenshots
    console.log("\n[8/8] Comparing screenshots (file size change detection):\n");

    const comparisons = [
      { name: "Baseline vs Interaction", a: baselineInfo, b: interactionInfo },
      { name: "Interaction vs Submitted", a: interactionInfo, b: submittedInfo },
      { name: "Baseline vs Submitted", a: baselineInfo, b: submittedInfo },
    ];

    for (const { name, a, b } of comparisons) {
      const diff = Math.abs(a.size - b.size);
      const pct = ((diff / a.size) * 100).toFixed(1);
      const changed = diff > 0 ? "CHANGED" : "IDENTICAL";
      console.log(
        `  ${name}: ${changed} (${a.size} -> ${b.size} bytes, delta ${diff} bytes / ${pct}%)`
      );
    }

    console.log("\nVisual test complete. Screenshots saved to ./screenshots/");
  } finally {
    console.log("\nCleaning up sandbox...");
    await sandbox.kill();
  }
}

visualTest().catch((err) => {
  console.error("Visual test failed:", err);
  process.exit(1);
});
