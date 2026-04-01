import { Sandbox } from "@omnirun/sdk";
import { promises as fs } from "node:fs";

/**
 * Desktop App Automation: Automate a text editor via GUI control.
 *
 * This demonstrates using OmniRun's desktop sandbox to:
 * 1. Launch a GUI application (mousepad text editor)
 * 2. Type content using keyboard automation
 * 3. Save a file using keyboard shortcuts
 * 4. Verify the result by running the saved file
 * 5. Capture screenshots at each step
 */

const FIZZBUZZ_CODE = `def fizzbuzz(n):
    for i in range(1, n + 1):
        if i % 15 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

if __name__ == "__main__":
    fizzbuzz(20)
`;

async function saveScreenshot(sandbox, filename) {
  const png = await sandbox.desktop.screenshot();
  await fs.writeFile(filename, png);
  console.log(`  Screenshot saved: ${filename}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function automateEditor() {
  console.log("Creating desktop sandbox...");
  const sandbox = await Sandbox.create("desktop", { timeout: 120 });
  console.log(`Sandbox: ${sandbox.sandboxId}\n`);

  try {
    // Step 1: Launch mousepad text editor
    console.log("=== Step 1: Launching mousepad editor ===");
    await sandbox.commands.run("DISPLAY=:99 mousepad &", { background: true });
    await sleep(3000);
    console.log("  Mousepad launched.\n");

    // Step 2: Screenshot the empty editor
    console.log("=== Step 2: Capturing empty editor ===");
    await saveScreenshot(sandbox, "screenshot-01-empty-editor.png");
    console.log("");

    // Step 3: Type a fizzbuzz Python script
    console.log("=== Step 3: Typing fizzbuzz program ===");
    await sandbox.desktop.type(FIZZBUZZ_CODE);
    await sleep(1000);
    console.log("  Code typed into editor.\n");

    // Step 4: Screenshot after typing
    console.log("=== Step 4: Capturing editor with code ===");
    await saveScreenshot(sandbox, "screenshot-02-after-typing.png");
    console.log("");

    // Step 5: Save the file with Ctrl+Shift+S (Save As)
    console.log("=== Step 5: Saving file via Save As ===");
    await sandbox.desktop.press("ctrl+shift+s");
    await sleep(2000);

    // Type the file path and press Enter
    await sandbox.desktop.type("/workspace/fizzbuzz.py");
    await sleep(500);
    await sandbox.desktop.press("Return");
    await sleep(1000);
    console.log("  File saved as /workspace/fizzbuzz.py\n");

    // Step 6: Screenshot after save
    console.log("=== Step 6: Capturing editor after save ===");
    await saveScreenshot(sandbox, "screenshot-03-after-save.png");
    console.log("");

    // Step 7: Close the editor
    console.log("=== Step 7: Closing editor ===");
    await sandbox.desktop.press("alt+F4");
    await sleep(1000);
    console.log("  Editor closed.\n");

    // Step 8: Run the saved Python file inside the sandbox
    console.log("=== Step 8: Running saved file ===");
    const result = await sandbox.commands.run("python3 /workspace/fizzbuzz.py");
    console.log("  Output from fizzbuzz.py:");
    console.log("  ---");
    for (const line of result.stdout.trim().split("\n")) {
      console.log(`  ${line}`);
    }
    console.log("  ---\n");

    console.log("=== Desktop automation complete ===");
    console.log("All screenshots saved to the current directory.");
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

automateEditor().catch(console.error);
