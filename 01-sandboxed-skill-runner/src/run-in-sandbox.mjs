import { Sandbox } from "@omnirun/sdk";

/**
 * Sandboxed Skill Runner
 *
 * Demonstrates running untrusted code in an isolated Firecracker microVM.
 * The code cannot access the host filesystem, network, or processes.
 */

console.log("Creating isolated sandbox...");
const sandbox = await Sandbox.create("python-3.11", {
  timeout: 60,
  internet: false,
});
console.log(`Sandbox: ${sandbox.sandboxId}\n`);

try {
  // Demo 1: Run safe code
  console.log("=== Running safe code ===");
  const safe = await sandbox.runCode(
    `import platform
print(f"Python {platform.python_version()}")
print(f"OS: {platform.system()}")
print("Hello from inside a Firecracker VM!")`,
    "python",
  );
  console.log(safe.stdout);

  // Demo 2: Code that explores the VM filesystem (not YOUR filesystem)
  console.log("=== Exploring the sandbox filesystem ===");
  const explore = await sandbox.runCode(
    `import os
files = os.listdir("/etc")
print(f"Found {len(files)} files in /etc — but this is the VM's /etc, not yours!")
print(f"Hostname: {os.uname().nodename}")
print(f"User: {os.getenv('USER', 'root')}")`,
    "python",
  );
  console.log(explore.stdout);

  // Demo 3: Network access blocked
  console.log("=== Attempting network access (blocked) ===");
  const network = await sandbox.runCode(
    `import socket
try:
    socket.create_connection(("1.1.1.1", 80), timeout=2)
    print("ERROR: Network access should be blocked!")
except (OSError, socket.timeout) as e:
    print(f"Network blocked: {type(e).__name__} — sandbox has no internet access")
    print("Untrusted code cannot exfiltrate data.")`,
    "python",
  );
  console.log(network.stdout);

  console.log("=== Host machine is completely untouched ===");
} finally {
  await sandbox.kill().catch(() => {});
}
