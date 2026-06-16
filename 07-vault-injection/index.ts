import { Sandbox } from "@omnirun/sdk";

/**
 * Vault Injection Example
 *
 * Demonstrates storing credentials in OmniRun's vault and injecting
 * them into sandboxes as environment variables. Credentials never
 * leave OmniRun's infrastructure — they are written to the sandbox
 * at creation time and are not accessible from outside.
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
// 1. Initialize the vault (creates an air-gapped sandbox for storage)
// ---------------------------------------------------------------------------
async function initVault(): Promise<void> {
  console.log("=== Initializing Vault ===");
  const res = await fetch(`${API_URL}/vault/init`, {
    method: "POST",
    headers,
  });

  if (!res.ok && res.status !== 409) {
    throw new Error(`vault init failed: ${res.status} ${await res.text()}`);
  }

  if (res.status === 409) {
    console.log("Vault already initialized.\n");
    return;
  }

  const data = await res.json();
  console.log(`Vault created (sandbox: ${data.vault_sandbox_id})`);
  console.log("The vault runs in an air-gapped VM with no internet access.\n");
}

// ---------------------------------------------------------------------------
// 2. Store credentials in the vault
// ---------------------------------------------------------------------------
async function storeCredentials(): Promise<void> {
  console.log("=== Storing Credentials ===");
  const credentials = {
    DATABASE_URL: "postgres://app:s3cret@db.internal:5432/myapp",
    STRIPE_SECRET_KEY: "sk_test_example_key_12345",
    AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE",
    AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  };

  const res = await fetch(`${API_URL}/vault/credentials`, {
    method: "POST",
    headers,
    body: JSON.stringify({ credentials }),
  });

  if (!res.ok) throw new Error(`store credentials failed: ${res.status} ${await res.text()}`);

  console.log(`Stored ${Object.keys(credentials).length} credentials:`);
  for (const key of Object.keys(credentials)) {
    console.log(`  - ${key}`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// 3. Verify stored credential keys (values are never returned)
// ---------------------------------------------------------------------------
async function listCredentialKeys(): Promise<void> {
  console.log("=== Listing Credential Keys ===");
  const res = await fetch(`${API_URL}/vault/credentials`, { headers });
  if (!res.ok) throw new Error(`list credentials failed: ${res.status} ${await res.text()}`);

  const data = await res.json();
  const keys: string[] = data.keys ?? data.credentials ?? [];
  console.log("Keys in vault (values are never exposed via API):");
  for (const key of keys) {
    console.log(`  - ${key}`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// 4. Create a sandbox with vault injection and read the credentials
// ---------------------------------------------------------------------------
async function runWithVaultInjection(): Promise<void> {
  console.log("=== Creating Sandbox with Vault Injection ===");
  const sandbox = await Sandbox.create("node-20", {
    timeout: 60,
    internet: false,
    metadata: { source: "vault-injection-example", vaultInject: "true" },
  });
  console.log(`Sandbox: ${sandbox.sandboxId}`);

  try {
    // Give vault injection a moment to write the env file
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Read the injected environment variables inside the sandbox
    console.log("Reading injected credentials inside the sandbox...\n");
    const result = await sandbox.commands.run(
      `sh -c 'if [ -f /tmp/.omnirun-env ]; then source /tmp/.omnirun-env; fi && node -e "
        const keys = [\"DATABASE_URL\", \"STRIPE_SECRET_KEY\", \"AWS_ACCESS_KEY_ID\", \"AWS_SECRET_ACCESS_KEY\"];
        for (const key of keys) {
          const val = process.env[key];
          if (val) {
            const masked = val.slice(0, 8) + \"...\" + val.slice(-4);
            console.log(key + \"=\" + masked);
          } else {
            console.log(key + \"=(not set)\");
          }
        }
      "'`,
    );

    console.log("--- Sandbox output ---");
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);

    console.log("Credentials were injected without passing them as SDK options.");
    console.log("They exist only inside the sandbox's isolated VM.\n");
  } finally {
    await sandbox.kill().catch(() => {});
    console.log("Sandbox destroyed.\n");
  }
}

// ---------------------------------------------------------------------------
// Run all demos
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  try {
    await initVault();
    await storeCredentials();
    await listCredentialKeys();
    await runWithVaultInjection();
    console.log("Done.");
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
