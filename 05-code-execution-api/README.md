# Build a Code Execution API with Express + OmniRun

A simple HTTP server that accepts code and a language, then executes it in an isolated OmniRun sandbox. Each request gets its own Firecracker microVM — complete kernel isolation, like a mini Replit.

## What This Demonstrates

- **Per-request isolation** — every code execution runs in its own Firecracker VM
- **Internet disabled** — sandboxes cannot reach the network (safe for untrusted code)
- **Rate limiting** — simple in-memory rate limiter to prevent abuse
- **CORS enabled** — ready to be called from a frontend

## API

### `GET /`

Returns service info and supported languages.

### `POST /run`

Execute code in a sandbox.

**Request:**
```json
{
  "code": "print('hello')",
  "language": "python"
}
```

**Response:**
```json
{
  "stdout": "hello\n",
  "stderr": "",
  "exitCode": 0,
  "executionTimeMs": 1240
}
```

## Run It

```bash
cp .env.example .env
# Add your OMNIRUN_API_KEY to .env
npm install
npm start
```

## Try It

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"code": "print(42)", "language": "python"}'
```

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"code": "console.log(Array.from({length: 10}, (_, i) => i * i))", "language": "javascript"}'
```
