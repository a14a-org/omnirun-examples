# OmniRun Examples

Practical workflows showing how to use [OmniRun](https://omnirun.io) for secure AI agent execution, code sandboxing, and preview URLs.

Each example is a standalone project — clone it, add your API key, and run.

## Quick Setup

```bash
npm install -g @omnirun/cli
omni auth init    # authenticate with magic link
```

## Examples

| # | Example | What it does |
|---|---------|-------------|
| 01 | [Sandboxed Skill Runner](./01-sandboxed-skill-runner/) | Run untrusted code (OpenClaw skills, user scripts) in isolated Firecracker VMs |
| 02 | [Build & Preview](./02-build-and-preview/) | AI generates a web app, OmniRun serves it, you get a shareable preview URL |
| 03 | [AI Code Review](./03-ai-code-review/) | Clone a repo, install deps, run tests — all in an isolated VM |
| 04 | [Daily Briefing](./04-daily-briefing/) | Parallel data collection from 5 sources, each in its own sandbox |
| 05 | [Code Execution API](./05-code-execution-api/) | Build an HTTP API that runs user code in sandboxes (like a mini Replit) |

## Why OmniRun?

These examples are designed for the [OpenClaw](https://docs.openclaw.ai/) / [NanoClaw](https://nanoclaw.dev/) ecosystem, where AI agents need to execute code safely.

**The problem:** OpenClaw runs commands on your host machine. Community skills can access your filesystem, network, and credentials. [Security researchers have found data exfiltration in community skills](https://blog.virustotal.com/2026/02/from-automation-to-infection-how.html).

**The solution:** OmniRun gives each execution its own Firecracker microVM — a real virtual machine with its own kernel, filesystem, and network namespace. Not a container, not a sandbox — a VM that boots in under a second and costs fractions of a cent.

| | Host execution | Docker | OmniRun |
|---|---|---|---|
| Kernel isolation | No | No (shared kernel) | Yes (Firecracker) |
| Filesystem isolation | No | Partial (namespace) | Full (own rootfs) |
| Network isolation | No | Partial (bridge) | Full (own netns) |
| Boot time | 0ms | ~500ms | ~840ms |
| Escape CVEs (2024-2026) | N/A | 12+ | 0 |

## Running an Example

```bash
cd 01-sandboxed-skill-runner
cp .env.example .env
# Add your OMNIRUN_API_KEY to .env
npm install
npm start
```

## Prerequisites

- Node.js 18+
- An OmniRun API key ([get one free](https://omnirun.io/docs))
- `@omnirun/sdk` (installed per-example via npm)

## Learn More

- [OmniRun Docs](https://omnirun.io/docs)
- [OmniRun Tutorials](https://omnirun.io/tutorials)
- [SDK Reference](https://www.npmjs.com/package/@omnirun/sdk)
- [CLI Reference](https://www.npmjs.com/package/@omnirun/cli)

## License

MIT
