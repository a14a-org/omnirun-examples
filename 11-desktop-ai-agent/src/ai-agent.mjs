/**
 * Desktop AI Agent (Computer Use)
 *
 * An autonomous AI agent that controls a Linux desktop sandbox using
 * screenshots and an LLM vision model. The agent perceives the screen,
 * reasons about what to do next, and executes actions — all in a loop
 * until the task is complete.
 */

import { OmniRun } from "@omnirun/sdk";
import { writeFile, mkdir } from "node:fs/promises";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_URL = process.env.OMNIRUN_API_URL || "https://api.omnirun.io";
const API_KEY = process.env.OMNIRUN_API_KEY;

if (!API_KEY) {
  console.error("Error: OMNIRUN_API_KEY is required. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const MAX_STEPS = 15;

const TASK =
  "Open the terminal, create a Python file that prints the first 10 Fibonacci numbers, run it, and tell me the output.";

const SYSTEM_PROMPT = `You are an AI agent controlling a Linux desktop. You can see a screenshot of the current screen state.

Your goal is to accomplish the user's task by issuing one action at a time.

Respond with ONLY a JSON object (no markdown, no explanation). Choose one of these actions:

{"action": "click", "x": 100, "y": 200, "reason": "clicking the terminal icon"}
{"action": "type", "text": "hello", "reason": "typing the command"}
{"action": "press", "key": "Return", "reason": "pressing enter to run"}
{"action": "done", "summary": "The task is complete. Output was: ..."}

Rules:
- Respond with a single JSON object only — no surrounding text.
- The "reason" field should briefly explain why you chose this action.
- Use "click" to interact with UI elements (buttons, icons, menus, text fields).
- Use "type" to enter text. Only type when a text input is focused.
- Use "press" for keyboard keys like Return, Tab, Escape, ctrl+s, etc.
- Use "done" when the task is fully complete and you can see the result.
- Be precise with click coordinates — aim for the center of the target element.
- If nothing seems to be happening, try a different approach.`;

// ---------------------------------------------------------------------------
// LLM call via OmniRun proxy
// ---------------------------------------------------------------------------

async function askLLM(screenshotBase64, step) {
  const response = await fetch(`${API_URL}/llm/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${screenshotBase64}` },
            },
            {
              type: "text",
              text: `Task: ${TASK}\nStep ${step} of ${MAX_STEPS}. What action should I take?`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseAction(text);
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

  // Extract the first {...} block from the response
  const match = text.match(/\{[\s\S]*?\}/);
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
      await sandbox.desktop.click(action.x, action.y);
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
      console.warn(`Unknown action: ${action.action}`);
  }
}

// ---------------------------------------------------------------------------
// Main agent loop
// ---------------------------------------------------------------------------

async function main() {
  const omnirun = new OmniRun();

  console.log("=".repeat(60));
  console.log("Desktop AI Agent (Computer Use)");
  console.log("=".repeat(60));
  console.log(`Task: ${TASK}`);
  console.log(`Max steps: ${MAX_STEPS}`);
  console.log();

  // Ensure screenshots directory exists
  await mkdir("screenshots", { recursive: true });

  // 1. Create a desktop sandbox with internet access
  console.log("Creating desktop sandbox...");
  const sandbox = await omnirun.sandbox.create({
    type: "desktop",
    internet: true,
  });
  console.log(`Sandbox ready: ${sandbox.id}\n`);

  try {
    // 2. Wait a moment for the desktop to fully load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Perception-action loop
    for (let step = 1; step <= MAX_STEPS; step++) {
      console.log(`--- Step ${step}/${MAX_STEPS} ---`);

      // Take a screenshot
      const screenshot = await sandbox.desktop.screenshot();
      const screenshotBase64 = screenshot.toString("base64");

      // Save screenshot to disk
      const screenshotPath = `screenshots/step-${step}.png`;
      await writeFile(screenshotPath, screenshot);
      console.log(`Screenshot saved: ${screenshotPath}`);

      // Ask the LLM what to do
      console.log("Thinking...");
      const action = await askLLM(screenshotBase64, step);
      console.log(`Action: ${JSON.stringify(action)}`);

      // Check for completion
      if (action.action === "done") {
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
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (step === MAX_STEPS) {
        console.log();
        console.log("Reached maximum steps without completion.");
      }
    }
  } finally {
    // 4. Clean up
    console.log("\nDestroying sandbox...");
    await sandbox.destroy();
    console.log("Done.");
  }
}

main().catch((err) => {
  console.error("Agent error:", err);
  process.exit(1);
});
