# Automate a Desktop Application in a Cloud Sandbox

Open a terminal, type a program, run it, and interact with the file manager -- all through automated keyboard and mouse control inside an OmniRun desktop sandbox.

![Desktop App Automation Demo](../docs/09-app-automation.gif)

## What This Demonstrates

- Creating a desktop sandbox with a full GUI environment (XFCE)
- Launching a GUI application (`xfce4-terminal`) inside the sandbox
- Typing commands and code using `sandbox.desktop.type()`
- Using keyboard shortcuts with `sandbox.desktop.press()`
- Mouse interactions with `sandbox.desktop.doubleClick()`
- Capturing screenshots at each step with `sandbox.desktop.screenshot()`
- Running the saved file to verify the automation worked
- File persistence within the sandbox filesystem

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

1. A desktop sandbox is created with a 2-minute timeout.
2. The `xfce4-terminal` is launched maximized on the virtual display.
3. A fizzbuzz Python script is written to a file using a heredoc in the terminal.
4. The script is executed in the terminal via keyboard automation.
5. The output is verified programmatically using `sandbox.commands.run()`.
6. The file manager is opened via a double-click on the desktop icon.
7. Screenshots are captured at each stage and saved to `./screenshots/`.

## Expected Output

```
Creating desktop sandbox...
Sandbox: sbx_abc123

=== Step 1: Launching terminal ===
  Screenshot saved: screenshots/01-terminal-open.png

=== Step 2: Writing fizzbuzz.py via terminal ===
  Code written to /workspace/fizzbuzz.py

=== Step 3: Capturing terminal with code ===
  Screenshot saved: screenshots/02-code-written.png

=== Step 4: Running fizzbuzz.py ===
  Screenshot saved: screenshots/03-output.png

=== Step 5: Verifying output via SDK ===
  Output from fizzbuzz.py:
  ---
  1
  2
  Fizz
  4
  Buzz
  ...
  FizzBuzz
  ...
  Buzz
  ---

=== Step 6: Opening file manager via desktop click ===
  Screenshot saved: screenshots/04-file-manager.png

=== Desktop automation complete ===
Screenshots saved to ./screenshots/
```
