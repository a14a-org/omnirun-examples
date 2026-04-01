import { Sandbox } from "@omnirun/sdk";
import { promises as fs } from "node:fs";

/**
 * Desktop App Automation: Automate the terminal to write and run code.
 *
 * This demonstrates using OmniRun's desktop sandbox to:
 * 1. Launch a GUI application (xfce4-terminal)
 * 2. Type commands using keyboard automation
 * 3. Create and run a Python script through the terminal
 * 4. Capture screenshots at each step
 */

async function saveScreenshot(sandbox, name) {
  await fs.mkdir("screenshots", { recursive: true });
  const png = await sandbox.desktop.screenshot();
  const path = `screenshots/${name}.png`;
  await fs.writeFile(path, png);
  console.log(`  Screenshot saved: ${path}`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function automateTerminal() {
  console.log("Creating desktop sandbox...");
  const sandbox = await Sandbox.create("desktop", { timeout: 120 });
  console.log(`Sandbox: ${sandbox.sandboxId}\n`);

  try {
    // Step 1: Launch the terminal
    console.log("=== Step 1: Launching terminal ===");
    await sandbox.commands.run("DISPLAY=:99 xfce4-terminal --maximize &", {
      background: true,
    });
    await sleep(3000);
    await saveScreenshot(sandbox, "01-terminal-open");
    console.log("");

    // Step 2: Create a Python file using the terminal
    console.log("=== Step 2: Writing fizzbuzz.py via terminal ===");
    await sandbox.desktop.type("cat > /workspace/fizzbuzz.py << 'PYEOF'");
    await sandbox.desktop.press("Return");
    await sleep(300);

    // Type the Python code line by line
    const lines = [
      "def fizzbuzz(n):",
      "    for i in range(1, n + 1):",
      "        if i % 15 == 0:",
      '            print("FizzBuzz")',
      "        elif i % 3 == 0:",
      '            print("Fizz")',
      "        elif i % 5 == 0:",
      '            print("Buzz")',
      "        else:",
      "            print(i)",
      "",
      'if __name__ == "__main__":',
      "    fizzbuzz(20)",
    ];

    for (const line of lines) {
      await sandbox.desktop.type(line);
      await sandbox.desktop.press("Return");
      await sleep(100);
    }

    // Close the heredoc
    await sandbox.desktop.type("PYEOF");
    await sandbox.desktop.press("Return");
    await sleep(500);
    console.log("  Code written to /workspace/fizzbuzz.py\n");

    // Step 3: Screenshot showing the typed code
    console.log("=== Step 3: Capturing terminal with code ===");
    await saveScreenshot(sandbox, "02-code-written");
    console.log("");

    // Step 4: Run the script in the terminal
    console.log("=== Step 4: Running fizzbuzz.py ===");
    await sandbox.desktop.type("python3 /workspace/fizzbuzz.py");
    await sandbox.desktop.press("Return");
    await sleep(2000);
    await saveScreenshot(sandbox, "03-output");
    console.log("");

    // Step 5: Verify via the SDK (not just visually)
    console.log("=== Step 5: Verifying output via SDK ===");
    const result = await sandbox.commands.run(
      "python3 /workspace/fizzbuzz.py",
    );
    console.log("  Output from fizzbuzz.py:");
    console.log("  ---");
    for (const line of result.stdout.trim().split("\n")) {
      console.log(`  ${line}`);
    }
    console.log("  ---\n");

    // Step 6: Demonstrate mouse interaction — open the file manager
    console.log("=== Step 6: Opening file manager via desktop click ===");
    // Double-click on the "File System" icon on the desktop (typically top-left area)
    await sandbox.desktop.doubleClick(52, 70);
    await sleep(3000);
    await saveScreenshot(sandbox, "04-file-manager");
    console.log("");

    console.log("=== Desktop automation complete ===");
    console.log("Screenshots saved to ./screenshots/");
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

automateTerminal().catch(console.error);
