/**
 * LLM Proxy Example
 *
 * Demonstrates using OmniRun's LLM proxy to access language models
 * through a single API key. The proxy routes requests to supported
 * providers with per-user spend tracking and rate limiting.
 */

const API_URL = process.env.OMNIRUN_API_URL || "https://api.omnirun.io";
const API_KEY = process.env.OMNIRUN_API_KEY;

if (!API_KEY) {
  console.error("Missing OMNIRUN_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

// ---------------------------------------------------------------------------
// 1. List available models
// ---------------------------------------------------------------------------
async function listModels(): Promise<void> {
  console.log("=== Available Models ===");
  const res = await fetch(`${API_URL}/llm/v1/models`, { headers });
  if (!res.ok) throw new Error(`listModels failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  for (const model of data.models ?? data.data ?? []) {
    const id = model.id ?? model.model ?? model;
    console.log(`  - ${id}`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// 2. Chat completion (non-streaming)
// ---------------------------------------------------------------------------
async function chatCompletion(): Promise<void> {
  console.log("=== Chat Completion (non-streaming) ===");
  const res = await fetch(`${API_URL}/llm/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant. Keep answers concise." },
        { role: "user", content: "Explain what a Firecracker microVM is in two sentences." },
      ],
    }),
  });

  if (!res.ok) throw new Error(`chatCompletion failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? "(no content)";
  console.log(`Model: ${data.model}`);
  console.log(`Reply: ${reply}`);
  console.log(`Tokens: ${data.usage?.prompt_tokens ?? "?"} prompt, ${data.usage?.completion_tokens ?? "?"} completion`);
  console.log();
}

// ---------------------------------------------------------------------------
// 3. Streaming chat completion
// ---------------------------------------------------------------------------
async function streamChatCompletion(): Promise<void> {
  console.log("=== Chat Completion (streaming) ===");
  const res = await fetch(`${API_URL}/llm/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "user", content: "Write a haiku about sandboxed code execution." },
      ],
      stream: true,
    }),
  });

  if (!res.ok) throw new Error(`streamChat failed: ${res.status} ${await res.text()}`);

  process.stdout.write("Streaming: ");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;

      try {
        const chunk = JSON.parse(payload);
        const token = chunk.choices?.[0]?.delta?.content;
        if (token) process.stdout.write(token);
      } catch {
        // skip malformed chunks
      }
    }
  }
  console.log("\n");
}

// ---------------------------------------------------------------------------
// 4. Check usage / spend
// ---------------------------------------------------------------------------
async function getUsage(): Promise<void> {
  console.log("=== Usage & Spend ===");
  const res = await fetch(`${API_URL}/llm/v1/usage`, { headers });
  if (!res.ok) throw new Error(`getUsage failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  console.log(`  Spent:     $${(data.spend_used_cents / 100).toFixed(4)}`);
  console.log(`  Cap:       $${(data.spend_cap_cents / 100).toFixed(2)}`);
  console.log(`  Remaining: $${((data.spend_cap_cents - data.spend_used_cents) / 100).toFixed(4)}`);
  console.log();
}

// ---------------------------------------------------------------------------
// Run all demos
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  try {
    await listModels();
    await chatCompletion();
    await streamChatCompletion();
    await getUsage();
    console.log("Done.");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
