# AI Code Review Bot — Clone, Test, Lint in Isolated VMs

Demonstrates an automated code review workflow that clones a repository, installs dependencies, runs tests, and performs a security audit — all inside an isolated Firecracker microVM. Malicious `postinstall` scripts, fork bombs, or any other hostile code in the repo cannot escape the sandbox.

## What This Demonstrates

- Creating a sandbox with internet access for cloning and installing dependencies
- Running shell commands with `sandbox.commands.run()`
- Detecting project type (Node.js, Python, Rust) and running appropriate checks
- Running `npm test`, `npm audit`, and file analysis inside the sandbox
- Producing a structured review report

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

   Or review a specific repo and branch:

   ```bash
   node src/review-pr.mjs https://github.com/expressjs/express main
   ```

## How It Works

1. A Firecracker sandbox is created with internet access enabled.
2. The target repository is shallow-cloned into the sandbox.
3. The project type is detected by looking for `package.json`, `requirements.txt`, or `Cargo.toml`.
4. For Node.js projects: dependencies are installed (with `--ignore-scripts` for safety), tests are run, and `npm audit` checks for known vulnerabilities.
5. A structured review report is printed with pass/fail status for each check.
6. The sandbox is destroyed — nothing from the repo ever touched your host.

## Why Sandboxing Matters for Code Review

- `npm install` can execute arbitrary code via `postinstall` scripts.
- Test suites can contain malicious code that runs during `npm test`.
- Even `package.json` parsing has had vulnerabilities in the past.
- Running all of this in a throwaway Firecracker VM eliminates the risk entirely.
