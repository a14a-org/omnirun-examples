# Submission: awesome-sandbox

## PR
https://github.com/restyler/awesome-sandbox/pull/14

## Repo
https://github.com/restyler/awesome-sandbox

## Where to add

### 1. Feature Matrix (Section 3)
Add a row to the comparison table after the e2b entry:

```markdown
| [**OmniRun** ↓](#4x-omnirun-firecracker-microvms-for-ai-agents) | Firecracker (MicroVM) | 2025 | N/A | Proprietary | No | Yes | Persistent | Full | Short & Long-Running |
```

### 2. Platform Profile (Section 4, new subsection)

Add as a new subsection in Section 4 (after the existing platforms):

```markdown
### **4.x. OmniRun: Firecracker MicroVMs for AI Agents**

* **Overview:** OmniRun is a cloud sandbox platform designed for AI agents and automation workflows. It runs isolated Firecracker microVMs with sub-second boot times and provides desktop GUI control (mouse, keyboard, and screenshot capture) alongside standard command execution. All sandbox communication supports end-to-end encryption.
* **Website:** [omnirun.io](https://omnirun.io)
* **Launch Date:** 2025
* **License:** Proprietary (SDKs are open source)
* **Hosting:**
  * **SaaS:** Yes. Managed cloud service with API key authentication.
  * **Self-Hosted:** No.
* **Capabilities:**
  * **Filesystem Access:** Full filesystem I/O via SDK and CLI. Sandboxes provide persistent storage during sessions.
  * **Network Access:** Full internet access. Services running inside sandboxes can be exposed via temporary preview URLs.
  * **Desktop GUI:** Built-in desktop environment with programmatic mouse, keyboard, and screenshot APIs for browser automation and visual testing.
  * **Workload Suitability:** Suited for both short-lived code execution tasks and long-running agent sessions requiring desktop interaction.
* **SDKs:** [TypeScript SDK](https://www.npmjs.com/package/@omnirun/sdk) (Python SDK coming soon)
* **Underlying Technology:** Firecracker microVMs with end-to-end encryption for sandbox communication.
```

## PR Title
Add OmniRun - Firecracker microVM sandboxes for AI agents

## PR Body

Adds OmniRun to the feature matrix and platform profiles section.

OmniRun is a cloud sandbox platform for AI agents built on Firecracker microVMs with:

- Sub-second cold boot
- Desktop GUI control (mouse, keyboard, screenshot)
- End-to-end encryption
- TypeScript SDK (Python SDK coming soon)
- Temporary preview URLs for exposing sandbox services

Added to:
- Feature matrix table (Section 3)
- New platform profile (Section 4)
