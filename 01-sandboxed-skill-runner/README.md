# Run Untrusted Code Safely with OmniRun

Demonstrates running arbitrary scripts in isolated Firecracker microVMs instead of on the host machine. No matter what the code does — reads files, spawns processes, attempts network access — it all happens inside a throwaway VM that is destroyed afterwards.

## What This Demonstrates

- Creating an isolated Firecracker sandbox with `Sandbox.create()`
- Running untrusted Python code with `sandbox.runCode()`
- Blocking internet access with `internet: false`
- Automatic cleanup with `sandbox.kill()`
- Wrapping sandbox execution for use as an OpenClaw skill

## Files

| File | Description |
|------|-------------|
| `src/run-in-sandbox.mjs` | Core example — runs safe and malicious code in sandboxes |
| `src/openclaw-skill-wrapper.mjs` | Template for building OpenClaw skills backed by OmniRun |

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

   Or run the OpenClaw skill wrapper:

   ```bash
   node src/openclaw-skill-wrapper.mjs
   ```

## Expected Output

The example runs two scripts inside sandboxes:

1. **Safe code** — prints Python version and OS info from inside the VM.
2. **Malicious code** — attempts to list host files and make network requests. Both fail safely because the code runs in an isolated VM with internet disabled.

Your host machine is never touched.
