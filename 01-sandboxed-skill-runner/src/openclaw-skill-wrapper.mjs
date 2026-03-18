import { Sandbox } from "@omnirun/sdk";

/**
 * OpenClaw Skill Wrapper
 *
 * Wraps any shell command execution in an OmniRun sandbox.
 * Use this as a template for building OpenClaw skills that
 * execute untrusted code safely.
 *
 * Usage with OpenClaw:
 *   "Run this Python script in a sandbox: print('hello')"
 */
export async function executeInSandbox({ code, language = "python", timeout = 15 }) {
  const sandbox = await Sandbox.create("python-3.11", {
    timeout: 30,
    internet: false,
    metadata: { source: "openclaw-skill" },
  });

  try {
    const result = await sandbox.runCode(code, language);
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      error: result.stderr || null,
    };
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

// Self-test
const result = await executeInSandbox({ code: 'print("OpenClaw + OmniRun = Safe Execution")' });
console.log(result);
