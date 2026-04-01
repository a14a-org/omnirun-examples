/**
 * Desktop AI Agent (Computer Use)
 *
 * An autonomous AI agent that controls a Linux desktop sandbox using
 * screenshots and an LLM vision model. The agent perceives the screen,
 * reasons about what to do next, and executes actions — all in a loop
 * until the task is complete.
 */

import { Sandbox } from "@omnirun/sdk";
import { writeFile, mkdir } from "node:fs/promises";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_URL = process.env.OMNIRUN_API_URL || "https://api.omnirun.io";
const API_KEY = process.env.OMNIRUN_API_KEY;

if (!API_KEY) {
  console.error(
    "Error: OMNIRUN_API_KEY is required. Copy .env.example to .env and add your key.",
  );
  process.exit(1);
}

const MAX_STEPS = 15;
const MODEL = "anthropic/claude-sonnet-4.6"; // Vision-capable model via the LLM proxy

const TASK =
  "A terminal is open. Write a Python one-liner that prints the first 10 Fibonacci numbers, run it, and tell me the output.";

const SYSTEM_PROMPT = `You are an AI agent controlling a Linux desktop (XFCE). You can see a screenshot of the current screen state.

Your goal is to accomplish the user's task by issuing one action at a time.

Respond with ONLY a JSON object (no markdown, no explanation). Choose one of these actions:

{"action": "click", "x": 100, "y": 200, "reason": "clicking the terminal icon"}
{"action": "doubleclick", "x": 100, "y": 200, "reason": "double-clicking to open"}
{"action": "type", "text": "hello", "reason": "typing the command"}
{"action": "press", "key": "Return", "reason": "pressing enter to run"}
{"action": "done", "summary": "The task is complete. Output was: ..."}

Rules:
- Respond with a single JSON object only — no surrounding text.
- The "reason" field should briefly explain why you chose this action.
- Use "click" to interact with UI elements (buttons, icons, menus, text fields).
- Use "doubleclick" to open applications or files on the desktop.
- Use "type" to enter text. Only type when a text input is focused.
- Use "press" for keyboard keys like Return, Tab, Escape, ctrl+s, etc.
- Use "done" when the task is fully complete and you can see the result on screen.
- Be precise with click coordinates — aim for the center of the target element.
- A terminal window is already open and ready for input.
- If nothing seems to be happening, try a different approach.`;

// ---------------------------------------------------------------------------
// LLM call via OmniRun proxy
// ---------------------------------------------------------------------------

// Keep conversation history so the model remembers previous actions
const conversationHistory = [];

async function askLLM(screenshotBase64, step) {
  // Add the current screenshot as a new user message
  conversationHistory.push({
    role: "user",
    content: [
      {
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${screenshotBase64}`,
        },
      },
      {
        type: "text",
        text: `Task: ${TASK}\nStep ${step} of ${MAX_STEPS}. What action should I take next?`,
      },
    ],
  });

  const response = await fetch(`${API_URL}/llm/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        // Only send the last 6 messages to keep context manageable
        ...conversationHistory.slice(-6),
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const action = parseAction(text);

  // Add the assistant's response to conversation history
  conversationHistory.push({
    role: "assistant",
    content: JSON.stringify(action),
  });

  return action;
}

// ---------------------------------------------------------------------------
// JSON action parser (tolerant of markdown wrappers)
// ---------------------------------------------------------------------------

function parseAction(text) {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {
    // Fall through
  }

  // Extract the first {...} block (handles markdown code fences)
  const match = text.match(/\{[^{}]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // Fall through
    }
  }

  throw new Error(`Could not parse action from LLM response:\n${text}`);
}

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

async function executeAction(sandbox, action) {
  switch (action.action) {
    case "click":
      await sandbox.desktop.leftClick(action.x, action.y);
      break;

    case "doubleclick":
      await sandbox.desktop.doubleClick(action.x, action.y);
      break;

    case "type":
      await sandbox.desktop.type(action.text);
      break;

    case "press":
      await sandbox.desktop.press(action.key);
      break;

    case "done":
      // Nothing to execute — the loop will terminate
      break;

    default:
      console.warn(`  Unknown action: ${action.action}`);
  }
}

// ---------------------------------------------------------------------------
// Main agent loop
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("Desktop AI Agent (Computer Use)");
  console.log("=".repeat(60));
  console.log(`Task: ${TASK}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Max steps: ${MAX_STEPS}`);
  console.log();

  await mkdir("screenshots", { recursive: true });

  // 1. Create a desktop sandbox
  console.log("Creating desktop sandbox...");
  const sandbox = await Sandbox.create("desktop", { timeout: 300 });
  console.log(`Sandbox ready: ${sandbox.sandboxId}\n`);

  try {
    // 2. Wait for the desktop and open a terminal to help the agent get started
    for (let i = 0; i < 15; i++) {
      try {
        await sandbox.desktop.getScreen();
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    console.log("Opening terminal for the agent...");
    await sandbox.commands.run("DISPLAY=:99 xfce4-terminal --maximize &", {
      background: true,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // 3. Perception-action loop
    for (let step = 1; step <= MAX_STEPS; step++) {
      console.log(`--- Step ${step}/${MAX_STEPS} ---`);

      // Take a screenshot
      const screenshot = await sandbox.desktop.screenshot();
      const screenshotBase64 = Buffer.from(screenshot).toString("base64");

      // Save screenshot to disk
      const screenshotPath = `screenshots/step-${String(step).padStart(2, "0")}.png`;
      await writeFile(screenshotPath, screenshot);
      console.log(`  Screenshot: ${screenshotPath}`);

      // Ask the LLM what to do
      console.log("  Thinking...");
      let action;
      try {
        action = await askLLM(screenshotBase64, step);
      } catch (err) {
        console.error(`  LLM error: ${err.message}`);
        continue;
      }
      console.log(
        `  Action: ${action.action}${action.reason ? ` — ${action.reason}` : ""}`,
      );

      // Check for completion
      if (action.action === "done") {
        // Take one final screenshot
        const finalShot = await sandbox.desktop.screenshot();
        await writeFile("screenshots/final.png", finalShot);

        console.log();
        console.log("=".repeat(60));
        console.log("Task Complete!");
        console.log("=".repeat(60));
        console.log(`Summary: ${action.summary}`);
        console.log(`Total steps: ${step}`);
        break;
      }

      // Execute the action
      await executeAction(sandbox, action);

      // Brief pause to let the desktop update
      await new Promise((r) => setTimeout(r, 1500));

      if (step === MAX_STEPS) {
        console.log();
        console.log("Reached maximum steps without completion.");
      }
    }
  } finally {
    console.log("\nCleaning up sandbox...");
    await sandbox.kill().catch(() => {});
    console.log("Done.");
  }
}

main().catch((err) => {
  console.error("Agent error:", err);
  process.exit(1);
});
