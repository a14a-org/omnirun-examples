import { Sandbox } from "@omnirun/sdk";

/**
 * Daily Briefing Generator
 *
 * Collects data from multiple sources inside a single isolated sandbox,
 * then formats a concise morning briefing.
 *
 * Perfect for OpenClaw's #1 use case — morning briefings — but safe.
 * All network requests happen inside a Firecracker VM, not on your host.
 */

const TASKS = [
  {
    name: "Date & Time",
    code: `from datetime import datetime, timezone
now = datetime.now(timezone.utc)
print(f"Date: {now.strftime('%A, %B %d, %Y')}")
print(f"Time: {now.strftime('%H:%M UTC')}")
print(f"Week: {now.strftime('%U')} of 52")`,
  },
  {
    name: "System Info",
    code: `import platform, os
print(f"Python: {platform.python_version()}")
print(f"OS: {platform.system()} {platform.release()}")
print(f"CPU: {os.cpu_count()} cores")
try:
    with open("/proc/meminfo") as f:
        for line in f:
            if "MemTotal" in line:
                print(f"Memory: {int(line.split()[1]) // 1024}MB")
                break
except: pass`,
  },
  {
    name: "Weather",
    code: `import urllib.request, json
try:
    data = json.loads(urllib.request.urlopen("https://wttr.in/?format=j1", timeout=5).read())
    c = data["current_condition"][0]
    print(f"Temperature: {c['temp_C']}C")
    print(f"Condition: {c['weatherDesc'][0]['value']}")
    print(f"Humidity: {c['humidity']}%")
except Exception as e:
    print(f"Unavailable: {e}")`,
  },
  {
    name: "Hacker News",
    code: `import urllib.request, json
try:
    ids = json.loads(urllib.request.urlopen(
        "https://hacker-news.firebaseio.com/v0/topstories.json", timeout=5
    ).read())[:5]
    for sid in ids:
        s = json.loads(urllib.request.urlopen(
            f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=5
        ).read())
        print(f"- {s.get('title','?')} ({s.get('score',0)} pts)")
except Exception as e:
    print(f"Unavailable: {e}")`,
  },
  {
    name: "Inspiration",
    code: `import urllib.request, json
try:
    d = json.loads(urllib.request.urlopen("https://api.quotable.io/random", timeout=5).read())
    print(f'"{d["content"]}"')
    print(f"  -- {d['author']}")
except:
    print('"Stay hungry, stay foolish." -- Steve Jobs')`,
  },
];

async function generateBriefing() {
  console.log("Creating sandbox for data collection...");

  const sandbox = await Sandbox.create("python-3.11", {
    timeout: 120,
    internet: true,
    requestTimeout: 120_000,
    metadata: { source: "daily-briefing" },
  });

  console.log(`Sandbox: ${sandbox.sandboxId}`);
  console.log("Collecting data from 5 sources...\n");

  const results = [];

  for (const task of TASKS) {
    const start = Date.now();
    try {
      const r = await sandbox.runCode(task.code, "python");
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      results.push({
        name: task.name,
        data: r.stdout.trim(),
        error: r.exitCode !== 0 ? r.stderr.split("\n").pop() : null,
        elapsed: `${elapsed}s`,
      });
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      results.push({ name: task.name, data: "", error: err.message, elapsed: `${elapsed}s` });
    }
  }

  await sandbox.kill().catch(() => {});

  // Format briefing
  console.log("========================================");
  console.log("        DAILY BRIEFING");
  console.log("========================================\n");

  for (const r of results) {
    const icon = r.error ? "x" : "-";
    console.log(`[${icon}] ${r.name} (${r.elapsed})`);
    if (r.error) {
      console.log(`    Error: ${r.error.split("\n")[0]}`);
    } else {
      for (const line of r.data.split("\n")) {
        console.log(`    ${line}`);
      }
    }
    console.log("");
  }

  console.log("========================================");
  console.log(`${results.length} sources collected in one sandbox.`);
  console.log("All data fetched inside an isolated Firecracker VM.");
  console.log("Your host machine made zero network requests.");
  console.log("========================================\n");
}

generateBriefing().catch(console.error);
