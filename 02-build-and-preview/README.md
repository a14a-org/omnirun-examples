# AI Generates Code, OmniRun Runs It, You Get a Preview URL

Demonstrates the "vibe coding" workflow: generate a web app in a sandbox, serve it on a port, and get a shareable preview URL — all without touching your host machine.

## What This Demonstrates

- Writing files into a sandbox with `sandbox.runCode()`
- Running a background web server inside the sandbox
- Exposing a sandbox port with `sandbox.expose()` to get a public preview URL
- Polling for exposure readiness
- Graceful cleanup on Ctrl+C

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

1. A Firecracker sandbox is created with a 10-minute timeout.
2. A generated HTML landing page is written into the sandbox filesystem.
3. A Python HTTP server starts inside the sandbox on port 8000.
4. `sandbox.expose(8000)` creates a publicly accessible preview URL.
5. The URL is printed to the console — share it with anyone.
6. The sandbox auto-expires after 1 hour, or press Ctrl+C to tear it down early.

## Extending This

- Replace the hardcoded HTML with AI-generated code (e.g., from an LLM API call).
- Add a feedback loop: collect user feedback, regenerate, and update the sandbox.
- Use `sandbox.commands.run()` to install frameworks like Next.js or Vite inside the sandbox.
