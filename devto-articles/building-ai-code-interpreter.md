---
title: "Build an AI Code Interpreter in 50 Lines of TypeScript"
published: false
description: "A step-by-step tutorial for building a safe AI code interpreter using OmniRun sandboxes and OpenAI GPT-4. Run LLM-generated code securely in Firecracker microVMs."
tags: ai, typescript, tutorial, programming
canonical_url: https://omnirun.io/blog/building-ai-code-interpreter
cover_image: 
---

*I'm building [OmniRun](https://omnirun.io), a cloud sandbox platform for AI agents. This tutorial shows how to build a complete AI code interpreter that safely executes LLM-generated code.*

LLMs are excellent at generating code. They are terrible at running it. Here is how to build a complete AI code interpreter that safely executes LLM-generated code using OmniRun sandboxes and OpenAI.

## The Problem: LLMs Generate Code They Cannot Run

Ask GPT-4 to write a Python script that calculates Fibonacci numbers, and it will give you perfect code. Ask it to actually run that code and tell you the result, and you are out of luck. The model generates text -- it does not have a runtime.

This gap between code generation and code execution is one of the biggest limitations of LLM-powered tools. ChatGPT solves this with its built-in Code Interpreter. But if you are building your own AI product, you need your own execution backend. And that backend needs to be safe -- because the code your LLM generates is, by definition, untrusted.

## Why Not Just Use eval()?

The naive approach is to run the generated code directly on your server. Call `eval()` in Node.js, or `exec()` in Python, or spawn a child process. This works right up until the LLM generates code that reads your environment variables, deletes files, or opens a reverse shell.

Docker containers are better, but container escapes are well-documented. If you are running code from untrusted sources at scale, containers are not sufficient isolation.

The right answer is a sandbox with hardware-level isolation. Each execution gets its own kernel, its own memory space, and no way to reach the host. That is what Firecracker microVMs provide, and that is what OmniRun runs under the hood.

## The Solution: OmniRun + OpenAI

The architecture is straightforward. The user sends a natural language prompt. You pass it to GPT-4 with instructions to generate executable code. GPT-4 returns code. You send that code to an OmniRun sandbox for execution. The sandbox runs it in an isolated Firecracker microVM and returns the output. You send the output back to the user. The entire loop takes a few seconds.

## The Full Implementation

Here is the complete code interpreter in 50 lines of TypeScript. It takes a user prompt, asks GPT-4 to generate Python code, runs it in an OmniRun sandbox, and returns the result.

```typescript
import OmniRun from "@omnirun/sdk";
import OpenAI from "openai";

const omnirun = new OmniRun({ apiKey: process.env.OMNIRUN_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function interpret(userPrompt: string): Promise<string> {
  // Step 1: Ask GPT-4 to generate executable Python code
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a code generator. Given a user request, " +
          "write a Python script that accomplishes it. " +
          "Output ONLY the code, no markdown fences, no explanation.",
      },
      { role: "user", content: userPrompt },
    ],
  });

  const code = completion.choices[0].message.content ?? "";

  // Step 2: Create a sandbox
  const sandbox = await omnirun.sandboxes.create();

  try {
    // Step 3: Write the code to a file in the sandbox
    await sandbox.fs.writeFile("/tmp/script.py", code);

    // Step 4: Execute the code
    const result = await sandbox.commands.run("python3 /tmp/script.py");

    // Step 5: Return the output
    return result.stdout || result.stderr || "No output produced.";
  } finally {
    // Step 6: Clean up
    await sandbox.kill();
  }
}

// Usage
const answer = await interpret(
  "Calculate the first 20 Fibonacci numbers and print them"
);
console.log(answer);
// => 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...
```

## Walking Through the Code

The implementation breaks down into six clear steps.

**Step 1: Generate the code.** We send the user's natural language prompt to GPT-4 with a system message instructing it to output only executable Python. No markdown fences, no explanatory text -- just code that can be written to a file and run directly.

**Step 2: Create a sandbox.** A single API call spins up an isolated Firecracker microVM. This takes roughly 250ms thanks to snapshot restore. The sandbox has its own kernel, filesystem, and network stack. Nothing it does can affect your host or other sandboxes.

**Step 3: Write the code to the sandbox.** We use the filesystem API to write the generated script into the sandbox. You could also pipe it via stdin, but writing a file makes debugging easier -- you can inspect exactly what was generated.

**Step 4: Execute the code.** The `commands.run()` method executes a shell command inside the sandbox and waits for it to complete. The result includes stdout, stderr, and the exit code.

**Step 5: Return the output.** We grab stdout (or stderr if something went wrong) and return it. In a production system, you might pass this output back to GPT-4 for natural language summarization.

**Step 6: Clean up.** The `finally` block ensures we kill the sandbox even if execution fails. You pay per second of sandbox time, so prompt cleanup matters. Sandboxes also auto-terminate after a configurable timeout as a safety net.

## Why Firecracker Matters Here

The code your LLM generates is untrusted by definition. You do not control what GPT-4 will write. It might generate code that tries to read `/etc/passwd`, make network requests to internal services, or attempt to consume all available memory.

With a container-based sandbox, a kernel exploit could let malicious code escape to the host. With Firecracker, each sandbox runs its own Linux kernel inside a lightweight virtual machine. The CPU enforces the isolation boundary via hardware virtualization (KVM). Even if the generated code exploits a kernel vulnerability, it is contained within its own VM.

For an AI code interpreter that runs arbitrary user requests, this level of isolation is not optional -- it is the minimum responsible choice.

## Taking It Further

The 50-line version above is a starting point. A production code interpreter would add several capabilities: streaming output so users see results as they are produced, execution timeouts to prevent infinite loops, multi-turn conversations where the LLM can see previous outputs, support for multiple languages beyond Python, and file upload so users can provide data files for analysis.

All of these are straightforward additions with the OmniRun SDK. The sandbox supports streaming command output, file uploads via the filesystem API, and you can install any language runtime by running package manager commands inside the sandbox. Check out the [examples repository](https://github.com/omnirun-io/omnirun-examples) for a fully-featured version with streaming, timeouts, and multi-language support.

---

Ready to build your own code interpreter? [Claim your $5 free credit](https://omnirun.io/claim) -- no credit card required. Start executing LLM-generated code safely in minutes.
