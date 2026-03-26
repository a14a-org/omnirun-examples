# Vault Injection

Store secrets in OmniRun's vault and inject them into sandboxes as environment variables. Credentials never leave OmniRun's infrastructure and are never returned via the API.

## What This Demonstrates

- Initializing a vault (air-gapped sandbox with no internet)
- Storing credentials via `POST /vault/credentials`
- Listing credential keys via `GET /vault/credentials` (values are never exposed)
- Creating a sandbox with vault injection enabled
- Reading injected environment variables inside the sandbox
- Automatic cleanup

## Prerequisites

- An OmniRun API key
- Your account's vault must be initialized (the example does this automatically)
- Note: the vault sandbox counts against your concurrent sandbox limit

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

The example runs four steps:

1. **Init vault** — creates an air-gapped storage sandbox (or confirms it exists).
2. **Store credentials** — writes example database, Stripe, and AWS credentials.
3. **List keys** — shows the stored key names (values are never returned).
4. **Run with injection** — creates a sandbox, injects vault credentials, and prints masked values from inside the VM.

## How It Works

The vault is an isolated Firecracker microVM with internet disabled and no timeout. When you create a sandbox with `vaultInject: true` in metadata, OmniRun writes your vault credentials to `/tmp/.omnirun-env` inside the new sandbox. The credentials exist only within the sandbox's isolated VM and are destroyed when the sandbox is killed.
