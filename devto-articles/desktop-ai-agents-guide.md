---
title: "How to Build AI Agents That Control Desktop Applications"
published: false
description: "A practical guide to building AI agents that interact with desktop GUIs using the computer use paradigm. Screenshots, clicks, and keystrokes in sandboxed desktop environments."
tags: ai, tutorial, typescript, programming
canonical_url: https://omnirun.io/blog/desktop-ai-agents-guide
cover_image: 
---

*I'm building [OmniRun](https://omnirun.io), a cloud sandbox platform for AI agents. This guide covers how to build agents that see, click, and type in sandboxed desktop environments.*

The next frontier for AI agents is not just generating text or code -- it is interacting with graphical applications the same way a human does. Here is how to build agents that see, click, and type in sandboxed desktop environments.

## What Is Computer Use?

Computer use is a paradigm where an AI agent interacts with a graphical desktop environment through the same interface a human would: screenshots, mouse clicks, and keyboard input. Instead of calling APIs or parsing HTML, the agent literally looks at the screen, decides what to do, and performs actions.

The loop is simple: take a screenshot, send it to a vision-capable LLM (like GPT-4o), receive an action (click at coordinates, type text, press a key), execute that action, take another screenshot, and repeat. This perception-action loop is surprisingly effective. It works with any application -- web browsers, spreadsheets, email clients, IDEs, custom enterprise software -- without needing application-specific integrations.

## Why You Need a Sandbox

You absolutely cannot let an AI agent click around your real desktop. One wrong click and the agent could delete files, send emails, make purchases, or access sensitive data. The agent is operating with the full permissions of a desktop user, which means the blast radius of a mistake is enormous.

A sandboxed desktop environment solves this. The agent gets its own isolated desktop -- a full Linux environment with a window manager, browser, and any applications you need. It can click, type, and navigate freely. If it does something destructive, the damage is contained to the sandbox. When the task is complete, you tear down the sandbox and everything disappears.

## OmniRun Desktop API

OmniRun provides desktop sandboxes with a full XFCE environment running inside a Firecracker microVM. The desktop API exposes four core operations that map directly to how a human interacts with a computer:

- **screenshot()** -- Capture the current screen as a PNG image
- **leftClick(x, y)** -- Click at specific screen coordinates
- **type(text)** -- Type a string of text via keyboard input
- **press(key)** -- Press a specific key (Enter, Tab, Escape, etc.)

These four operations are all you need. Every desktop interaction -- filling forms, navigating menus, clicking buttons, scrolling pages -- can be composed from screenshots, clicks, typing, and key presses.

## The Perception-Action Loop

Every desktop AI agent follows the same core architecture. Here is the loop in TypeScript:

```typescript
import { Sandbox } from "@omnirun/sdk";
import OpenAI from "openai";

// The SDK reads OMNIRUN_API_KEY from the environment.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function desktopAgent(task: string) {
  // Create a desktop sandbox
  const sandbox = await Sandbox.create("desktop");

  try {
    let done = false;

    while (!done) {
      // 1. Perceive: take a screenshot
      const screenshot = await sandbox.desktop.screenshot();

      // 2. Reason: send screenshot + task to the LLM
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You control a desktop. Given the screenshot and task, " +
              "respond with a JSON action: " +
              '{ "type": "click", "x": N, "y": N } or ' +
              '{ "type": "type", "text": "..." } or ' +
              '{ "type": "press", "key": "Enter" } or ' +
              '{ "type": "done", "result": "..." }',
          },
          {
            role: "user",
            content: [
              { type: "text", text: task },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${Buffer.from(screenshot).toString("base64")}`,
                },
              },
            ],
          },
        ],
      });

      const action = JSON.parse(
        response.choices[0].message.content ?? "{}"
      );

      // 3. Act: execute the action
      switch (action.type) {
        case "click":
          await sandbox.desktop.leftClick(action.x, action.y);
          break;
        case "type":
          await sandbox.desktop.type(action.text);
          break;
        case "press":
          await sandbox.desktop.press(action.key);
          break;
        case "done":
          done = true;
          console.log("Task complete:", action.result);
          break;
      }
    }
  } finally {
    await sandbox.kill();
  }
}
```

The pattern is always the same: perceive, reason, act, repeat. The LLM is the brain -- it sees the screen and decides what to do next. The sandbox is the body -- it executes the physical actions. Your code is just the loop that connects them.

## Example: AI Agent Filling Out a Web Form

Consider a common automation task: filling out a multi-step web form. A traditional approach would use Puppeteer or Playwright to find form elements by CSS selectors and fill them programmatically. This breaks whenever the form layout changes.

A computer use agent approaches this differently. It opens the browser, sees the form, clicks the first input field, types the value, tabs to the next field, and so on. It handles dropdowns by clicking them and selecting options visually. It clicks submit buttons by recognizing them on screen. If the form layout changes, the agent adapts because it is reading the screen, not relying on hardcoded selectors. This visual approach is more resilient to UI changes and requires zero knowledge of the application's internal structure.

## Example: AI Agent Browsing the Web

Web browsing is where desktop agents really shine. The agent can navigate to any website, read content, click links, fill search boxes, and interact with web applications -- all through the same screenshot-and-click interface. No browser automation framework needed.

A typical workflow: the agent opens Firefox in the sandbox, navigates to a URL, reads the page content by examining screenshots, extracts information, follows links, and compiles results. Because it is running inside a sandboxed desktop, the agent can handle JavaScript-heavy single-page apps, CAPTCHAs, cookie banners, and other obstacles that break traditional web scraping tools. The sandbox also provides internet access, so the agent can reach any publicly accessible website.

## Performance Considerations

Desktop agents are inherently slower than API-based automation. Each iteration of the perception-action loop involves taking a screenshot (50-100ms), sending it to an LLM for analysis (1-3 seconds), and executing an action (50-200ms). A single loop iteration takes 2-4 seconds, which means filling a 10-field form takes 20-40 seconds.

There are several ways to improve this. Use lower-resolution screenshots to reduce LLM processing time. Batch multiple actions when the LLM is confident about a sequence. Add delays after actions that trigger page loads or animations -- the agent needs to wait for the screen to settle before taking the next screenshot.

The key tradeoff is speed versus generality. API-based automation is faster but requires custom integrations for each application. Desktop agents are slower but work with anything that has a GUI. For tasks where no API exists, or where building an integration is not worth the effort, desktop agents are the right tool.

## Why Firecracker for Desktop Sandboxes

Desktop sandboxes amplify the security requirements compared to code execution sandboxes. A desktop environment has a browser, file manager, terminal, and network access. An AI agent operating in this environment has all the capabilities of a human user at a computer. If that sandbox is not properly isolated, a misbehaving agent could reach other tenants, the host system, or internal networks.

OmniRun desktop sandboxes run on Firecracker microVMs, which means each desktop gets hardware-level isolation via KVM. The desktop environment, the browser, the window manager -- all of it runs inside its own virtual machine with its own kernel. There is no shared kernel surface between sandboxes. This is the same isolation technology AWS uses for Lambda and Fargate.

## Getting Started

The [OmniRun examples repository](https://github.com/a14a-org/omnirun-examples) includes a complete desktop AI agent that demonstrates the full perception-action loop with error recovery, action history, and multi-step task completion. Start with the documentation, get your API key, and have a desktop agent running in minutes.

---

Ready to build desktop AI agents? [Get started free](https://omnirun.io/claim) -- 25 sandbox-hours per month, no credit card required. Spin up an isolated desktop environment and start building computer use agents.
