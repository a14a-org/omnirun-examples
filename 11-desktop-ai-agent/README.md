# Desktop AI Agent (Computer Use)

An autonomous AI agent that controls a Linux desktop using screenshots and an LLM vision model. The agent perceives the screen, reasons about what action to take, executes it, and repeats — completing multi-step tasks without any hardcoded UI automation.

![AI Agent Demo](../docs/11-ai-agent.gif)

This is the "computer use" paradigm: instead of scripting exact clicks and keystrokes, you describe a goal in natural language, and the AI figures out how to accomplish it by looking at what's on screen.

## What This Demonstrates

- **Screenshot-based perception** -- The agent sees the desktop exactly as a human would, via PNG screenshots captured from the sandbox.
- **LLM reasoning with vision** -- A multimodal LLM (Claude Sonnet) analyzes each screenshot and decides the next action to take.
- **Structured action execution** -- The LLM outputs JSON actions (`click`, `type`, `press`, `done`) that map directly to sandbox desktop control methods.
- **Autonomous multi-step tasks** -- The agent loops through observe-think-act cycles until the task is complete, handling up to 15 steps without human intervention.

## Architecture

```
                         Perception-Action Loop
                         ~~~~~~~~~~~~~~~~~~~~~~

  +-------------+      +-----------------+      +----------------+
  |   Desktop   | ---> |   LLM (Vision)  | ---> |  JSON Action   |
  |  Screenshot |      |  Claude Sonnet  |      |  {action, ...} |
  +-------------+      +-----------------+      +----------------+
        ^                                              |
        |                                              v
        |                                     +----------------+
        +-------------------------------------|    Desktop     |
                                              |    Control     |
                                              | click/type/key |
                                              +----------------+

  Screenshot -> LLM (vision) -> JSON Action -> Desktop Control -> Screenshot -> ...
```

The loop continues until the LLM returns a `done` action or the maximum number of steps is reached.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your OmniRun API key:

   ```
   OMNIRUN_API_KEY=your-api-key-here
   OMNIRUN_API_URL=https://api.omnirun.io
   ```

3. **Run the agent:**

   ```bash
   npm start
   ```

## How It Works

The agent follows a straightforward loop:

1. **Create sandbox** -- A desktop sandbox is created with internet access enabled. This gives the agent a full Linux desktop environment (display, window manager, terminal, file manager, etc.).

2. **Take screenshot** -- The agent captures a PNG screenshot of the current desktop state.

3. **Ask the LLM** -- The screenshot is sent (as a base64-encoded image) to OmniRun's LLM proxy along with a system prompt and the task description. The LLM analyzes the image and responds with a single JSON action.

4. **Parse the action** -- The agent parses the LLM's response as JSON. It handles edge cases where the model wraps JSON in markdown code fences or adds extra text.

5. **Execute the action** -- Based on the action type:
   - `click` -- Clicks at the specified (x, y) coordinates
   - `type` -- Types the specified text string
   - `press` -- Presses a keyboard key (e.g., `Return`, `Tab`, `ctrl+s`)
   - `done` -- Signals task completion with a summary

6. **Repeat** -- The agent takes a new screenshot and goes back to step 3. This continues until the LLM returns `done` or the step limit (15) is reached.

Every screenshot is saved to `screenshots/step-{n}.png` so you can review exactly what the agent saw at each step.

## Customization

### Change the task

Edit the `TASK` constant in `src/ai-agent.mjs`:

```javascript
const TASK = "Open Firefox, go to example.com, and take a screenshot of the page.";
```

Some ideas for tasks to try:

- "Open the text editor, write a haiku about programming, and save it as haiku.txt"
- "Open the file manager, create a new folder called 'project', and open it"
- "Open the terminal and check the current disk usage with df -h"
- "Open Firefox, navigate to wikipedia.org, and search for 'Alan Turing'"

### Adjust the step limit

Increase `MAX_STEPS` for more complex tasks that require more interactions:

```javascript
const MAX_STEPS = 25;
```

### Change the model

Swap the model in the `askLLM` function. Any vision-capable model available through OmniRun's LLM proxy will work:

```javascript
model: "claude-sonnet-4-20250514",
```

### Modify the system prompt

The `SYSTEM_PROMPT` controls how the AI reasons about the screen and chooses actions. You can add domain-specific instructions, restrict certain actions, or change the output format.

## Expected Output

```
============================================================
Desktop AI Agent (Computer Use)
============================================================
Task: Open the terminal, create a Python file that prints the first 10
      Fibonacci numbers, run it, and tell me the output.
Max steps: 15

Creating desktop sandbox...
Sandbox ready: sbx_abc123

--- Step 1/15 ---
Screenshot saved: screenshots/step-1.png
Thinking...
Action: {"action":"click","x":48,"y":738,"reason":"clicking the terminal icon in the taskbar"}

--- Step 2/15 ---
Screenshot saved: screenshots/step-2.png
Thinking...
Action: {"action":"type","text":"cat > fib.py << 'EOF'\na, b = 0, 1\nfor _ in range(10):\n    print(a)\n    a, b = b, a + b\nEOF","reason":"creating the Python file with a heredoc"}

--- Step 3/15 ---
Screenshot saved: screenshots/step-3.png
Thinking...
Action: {"action":"press","key":"Return","reason":"pressing enter to execute the command"}

--- Step 4/15 ---
Screenshot saved: screenshots/step-4.png
Thinking...
Action: {"action":"type","text":"python3 fib.py","reason":"running the Python script"}

--- Step 5/15 ---
Screenshot saved: screenshots/step-5.png
Thinking...
Action: {"action":"press","key":"Return","reason":"pressing enter to run the script"}

--- Step 6/15 ---
Screenshot saved: screenshots/step-6.png
Thinking...
Action: {"action":"done","summary":"The first 10 Fibonacci numbers are: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34"}

============================================================
Task Complete!
============================================================
Summary: The first 10 Fibonacci numbers are: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34
Total steps: 6

Destroying sandbox...
Done.
```

The actual number of steps and exact actions will vary between runs since the AI reasons about each screenshot independently.
