import { Sandbox } from "@omnirun/sdk";

/**
 * AI Code Review Bot
 *
 * Clones a repo, runs tests and linting, and produces a review.
 * Each review runs in its own Firecracker VM — no risk from
 * malicious package.json postinstall scripts or fork bombs.
 *
 * Usage: node src/review-pr.mjs <repo-url> [branch]
 */

const repoUrl = process.argv[2] || "https://github.com/expressjs/express";
const branch = process.argv[3] || "main";

async function reviewInSandbox(repoUrl, branch) {
  console.log(`Reviewing ${repoUrl} (${branch})...`);
  console.log("Creating isolated sandbox...");

  const sandbox = await Sandbox.create("playground", {
    timeout: 300,
    internet: true, // Need internet to clone + install deps
    metadata: { source: "code-review-bot", repo: repoUrl },
  });

  try {
    console.log(`Sandbox: ${sandbox.sandboxId}`);

    // Clone the repository
    console.log("Cloning repository...");
    const clone = await sandbox.commands.run(
      `git clone --depth 1 --branch ${branch} ${repoUrl} /tmp/repo 2>&1`,
      { timeout: 60 }
    );
    console.log(clone.stdout.split("\n").pop());

    // Detect project type and run checks
    console.log("Analyzing project...");
    const ls = await sandbox.commands.run("ls /tmp/repo", { timeout: 5 });
    const files = ls.stdout.trim().split("\n");

    const hasPackageJson = files.includes("package.json");
    const hasRequirements = files.includes("requirements.txt");
    const hasCargo = files.includes("Cargo.toml");

    const results = [];

    if (hasPackageJson) {
      // Node.js project
      console.log("Detected: Node.js project");

      // Install dependencies (sandboxed — postinstall scripts can't escape)
      console.log("Installing dependencies (sandboxed)...");
      const install = await sandbox.commands.run(
        "cd /tmp/repo && npm install --ignore-scripts 2>&1 | tail -3",
        { timeout: 120 }
      );
      results.push({ check: "npm install", output: install.stdout.trim() });

      // Run tests if available
      console.log("Running tests...");
      try {
        const test = await sandbox.commands.run(
          "cd /tmp/repo && npm test 2>&1 | tail -10",
          { timeout: 60 }
        );
        results.push({ check: "npm test", output: test.stdout.trim(), passed: test.exitCode === 0 });
      } catch (e) {
        results.push({ check: "npm test", output: e.stderr || "No test script", passed: false });
      }

      // Check for security issues
      console.log("Security audit...");
      try {
        const audit = await sandbox.commands.run(
          "cd /tmp/repo && npm audit --json 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); v=d.get('metadata',{}).get('vulnerabilities',{}); print(f'Critical: {v.get(\\\"critical\\\",0)}, High: {v.get(\\\"high\\\",0)}, Moderate: {v.get(\\\"moderate\\\",0)}')\"",
          { timeout: 30 }
        );
        results.push({ check: "security audit", output: audit.stdout.trim() });
      } catch {
        results.push({ check: "security audit", output: "Could not run audit" });
      }

      // File stats
      const stats = await sandbox.commands.run(
        "cd /tmp/repo && find . -name '*.js' -o -name '*.ts' -o -name '*.jsx' -o -name '*.tsx' | grep -v node_modules | wc -l",
        { timeout: 10 }
      );
      results.push({ check: "source files", output: `${stats.stdout.trim()} files` });

    } else if (hasRequirements) {
      console.log("Detected: Python project");
      results.push({ check: "type", output: "Python project detected" });
    } else if (hasCargo) {
      console.log("Detected: Rust project");
      results.push({ check: "type", output: "Rust project detected" });
    }

    // Print review report
    console.log("\n========================================");
    console.log("  CODE REVIEW REPORT");
    console.log("========================================\n");
    console.log(`Repository: ${repoUrl}`);
    console.log(`Branch: ${branch}`);
    console.log(`Sandbox: ${sandbox.sandboxId}`);
    console.log("");

    for (const r of results) {
      const icon = r.passed === false ? "FAIL" : r.passed === true ? "PASS" : "INFO";
      console.log(`[${icon}] ${r.check}: ${r.output}`);
    }

    console.log("\n========================================");
    console.log("All checks ran in an isolated Firecracker VM.");
    console.log("No code from the repo touched your host machine.");
    console.log("========================================\n");

    return results;
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

reviewInSandbox(repoUrl, branch).catch(console.error);
