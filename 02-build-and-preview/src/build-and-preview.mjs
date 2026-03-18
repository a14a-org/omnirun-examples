import { Sandbox } from "@omnirun/sdk";

/**
 * Build & Preview: Generate a web app in a sandbox and get a shareable URL.
 *
 * This demonstrates the "vibe coding" workflow:
 * 1. AI generates HTML/CSS/JS
 * 2. OmniRun sandbox serves it on a port
 * 3. Preview URL makes it accessible to anyone
 * 4. Iterate based on feedback
 */

const LANDING_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Startup</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0; font-family: system-ui, sans-serif;
    }
    h1 { font-size: 3rem; font-weight: 700; }
    h1 span { color: #38bdf8; }
    p { font-size: 1.2rem; color: #94a3b8; max-width: 500px; text-align: center; }
    .cta {
      padding: 14px 32px; background: #38bdf8; color: #0f172a;
      border: none; border-radius: 8px; font-size: 1rem; font-weight: 600;
      cursor: pointer; transition: transform 0.15s;
    }
    .cta:hover { transform: scale(1.05); }
    .badge {
      position: fixed; bottom: 16px; right: 16px; padding: 8px 16px;
      background: rgba(255,255,255,0.1); border-radius: 99px;
      font-size: 0.75rem; color: #64748b;
    }
  </style>
</head>
<body>
  <h1>Ship <span>faster.</span></h1>
  <p>The AI-powered platform that turns your ideas into production code in minutes, not months.</p>
  <button class="cta" onclick="alert('Coming soon!')">Get Early Access</button>
  <div class="badge">Built in an OmniRun sandbox</div>
</body>
</html>
`;

async function buildAndPreview() {
  console.log("Creating sandbox...");
  const sandbox = await Sandbox.create("python-3.11", { timeout: 600 });
  console.log(`Sandbox: ${sandbox.sandboxId}`);

  // Write the generated code to the sandbox
  console.log("Writing landing page...");
  const b64 = Buffer.from(LANDING_PAGE).toString("base64");
  await sandbox.runCode(
    `import base64; open("/tmp/index.html","w").write(base64.b64decode("${b64}").decode())`
  );

  // Start a web server
  console.log("Starting web server...");
  await sandbox.commands.run(
    'python3 -m http.server 8000 --directory /tmp &',
    { background: true }
  );
  await new Promise(r => setTimeout(r, 1500));

  // Create a preview URL
  console.log("Creating preview URL...");
  const exposure = await sandbox.expose(8000, {
    ttlSeconds: 3600,
    openPath: "/index.html",
  });

  // Wait for ready
  for (let i = 0; i < 15; i++) {
    const info = await sandbox.exposures.get(exposure.id);
    if (info.status === "ready") break;
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("");
  console.log("========================================");
  console.log(`  Preview URL: ${exposure.url}`);
  console.log("========================================");
  console.log("");
  console.log("Share this URL with anyone — they'll see your landing page.");
  console.log("The sandbox auto-expires in 1 hour.");
  console.log("");
  console.log("Press Ctrl+C to tear down early.");

  process.on("SIGINT", async () => {
    console.log("\nCleaning up...");
    await sandbox.kill();
    process.exit(0);
  });

  await new Promise(() => {});
}

buildAndPreview().catch(console.error);
