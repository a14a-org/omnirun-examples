# LLM Proxy

Access language models through OmniRun's LLM proxy. One API key gives you access to multiple providers with built-in spend tracking and rate limiting.

## What This Demonstrates

- Listing available models via `GET /llm/v1/models`
- Non-streaming chat completion via `POST /llm/v1/chat/completions`
- Streaming chat completion with SSE parsing
- Checking usage and spend via `GET /llm/v1/usage`
- Error handling for rate limits and spend caps

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
   npm run dev
   ```

## Expected Output

The example runs four demos in sequence:

1. **List models** — shows available models on the free tier.
2. **Chat completion** — sends a prompt and prints the full response.
3. **Streaming completion** — streams a haiku token-by-token to the console.
4. **Usage** — shows current spend, cap, and remaining balance.

## Notes

- Free-tier accounts have a $5 spend cap. The proxy returns HTTP 402 when the cap is reached.
- The LLM proxy supports the OpenAI-compatible chat completions format.
- Streaming responses use Server-Sent Events (SSE).
