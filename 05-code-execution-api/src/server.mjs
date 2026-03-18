import { createServer } from "node:http";
import { Sandbox } from "@omnirun/sdk";

/**
 * Code Execution API
 *
 * A simple HTTP server that accepts code + language and executes
 * it in an isolated OmniRun sandbox. Each request gets its own
 * Firecracker microVM — complete kernel isolation.
 *
 * POST /run
 * Body: { "code": "print('hello')", "language": "python" }
 * Response: { "stdout": "hello\n", "stderr": "", "exitCode": 0 }
 */

const PORT = process.env.PORT || 3000;
const MAX_CODE_SIZE = 50 * 1024; // 50KB
const EXECUTION_TIMEOUT = 15; // seconds

// Simple rate limiter
const requests = new Map();
const RATE_LIMIT = 20; // per minute
const RATE_WINDOW = 60_000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now - entry.time > RATE_WINDOW) {
    requests.set(ip, { count: 1, time: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

async function executeCode(code, language) {
  const sandbox = await Sandbox.create("python-3.11", {
    timeout: 30,
    internet: false,
    metadata: { source: "code-execution-api", language },
  });

  try {
    const result = await sandbox.runCode(code, language);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

const server = createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      service: "OmniRun Code Execution API",
      usage: "POST /run with { code, language }",
      languages: ["python", "javascript", "rust", "sql", "zig"],
    }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/run") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /run" }));
    return;
  }

  // Rate limit
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  if (isRateLimited(ip)) {
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Too many requests" }));
    return;
  }

  // Parse body
  let body = "";
  for await (const chunk of req) body += chunk;

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid JSON" }));
    return;
  }

  const { code, language = "python" } = parsed;

  if (!code || typeof code !== "string") {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "code is required" }));
    return;
  }

  if (code.length > MAX_CODE_SIZE) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Code exceeds 50KB limit" }));
    return;
  }

  // Execute
  try {
    const start = Date.now();
    const result = await executeCode(code, language);
    const elapsed = Date.now() - start;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...result, executionTimeMs: elapsed }));
  } catch (err) {
    const status = err.message?.includes("timeout") ? 408 : 500;
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message || "Execution failed" }));
  }
});

server.listen(PORT, () => {
  console.log(`Code Execution API running on http://localhost:${PORT}`);
  console.log("");
  console.log("Try it:");
  console.log(`  curl -X POST http://localhost:${PORT}/run \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"code": "print(42)", "language": "python"}'`);
  console.log("");
});
