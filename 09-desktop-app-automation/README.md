# Automate a Desktop Text Editor in a Cloud Sandbox

Open a GUI text editor, type a program, save it, and run it -- all through automated keyboard and mouse control inside an OmniRun desktop sandbox.

## What This Demonstrates

- Creating a desktop sandbox with a full GUI environment (XFCE)
- Launching a GUI application (`mousepad`) inside the sandbox
- Typing text into the application with `sandbox.desktop.type()`
- Using keyboard shortcuts with `sandbox.desktop.press()` (Ctrl+Shift+S, Alt+F4)
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
2. The `mousepad` text editor (XFCE's default) is launched on the virtual display.
3. A fizzbuzz Python script is typed into the editor via keyboard automation.
4. The file is saved using Ctrl+Shift+S (Save As), typing the path `/workspace/fizzbuzz.py`, and pressing Enter.
5. The editor is closed with Alt+F4.
6. The saved Python file is executed inside the sandbox using `sandbox.commands.run()`.
7. Screenshots are captured at each stage and saved locally for inspection.

## Expected Output

```
Creating desktop sandbox...
Sandbox: sbx_abc123

=== Step 1: Launching mousepad editor ===
  Mousepad launched.

=== Step 2: Capturing empty editor ===
  Screenshot saved: screenshot-01-empty-editor.png

=== Step 3: Typing fizzbuzz program ===
  Code typed into editor.

=== Step 4: Capturing editor with code ===
  Screenshot saved: screenshot-02-after-typing.png

=== Step 5: Saving file via Save As ===
  File saved as /workspace/fizzbuzz.py

=== Step 6: Capturing editor after save ===
  Screenshot saved: screenshot-03-after-save.png

=== Step 7: Closing editor ===
  Editor closed.

=== Step 8: Running saved file ===
  Output from fizzbuzz.py:
  ---
  1
  2
  Fizz
  4
  Buzz
  Fizz
  7
  8
  Fizz
  Buzz
  11
  Fizz
  13
  14
  FizzBuzz
  16
  17
  Fizz
  19
  Buzz
  ---

=== Desktop automation complete ===
All screenshots saved to the current directory.
```
