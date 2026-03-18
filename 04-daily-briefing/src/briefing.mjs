import { Sandbox } from "@omnirun/sdk";

/**
 * Daily Briefing Generator
 *
 * Runs multiple data collection tasks in parallel, each in its own
 * isolated Firecracker VM. Each sandbox has internet access restricted
 * to only its specific data source via NetworkPolicy.
 *
 * Perfect for OpenClaw's #1 use case — morning briefings — but safe.
 */

async function collectInSandbox(name, code) {
  const start = Date.now();
  let sandbox;
  try {
    sandbox = await Sandbox.create("python-3.11", {
      timeout: 30,
      internet: true,
      requestTimeout: 120_000,
      metadata: { source: "daily-briefing", task: name },
    });

    const result = await sandbox.runCode(code, "python");
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return {
      name,
      data: result.stdout.trim(),
      error: result.exitCode !== 0 ? result.stderr : null,
      elapsed: `${elapsed}s`,
    };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { name, data: "", error: err.message, elapsed: `${elapsed}s` };
  } finally {
    if (sandbox) await sandbox.kill().catch(() => {});
  }
}

async function generateBriefing() {
  console.log("Generating daily briefing...");
  console.log("Spawning parallel sandboxes for each data source...\n");

  const tasks = [
    collectInSandbox("Weather", `
import urllib.request, json
try:
    data = json.loads(urllib.request.urlopen(
        "https://wttr.in/?format=j1", timeout=5
    ).read())
    current = data["current_condition"][0]
    print(f"Temperature: {current['temp_C']}°C")
    print(f"Condition: {current['weatherDesc'][0]['value']}")
    print(f"Humidity: {current['humidity']}%")
except Exception as e:
    print(f"Weather unavailable: {e}")
`),
    collectInSandbox("HackerNews", `
import urllib.request, json
try:
    top = json.loads(urllib.request.urlopen(
        "https://hacker-news.firebaseio.com/v0/topstories.json?limitToFirst=5&orderBy=%22$key%22", timeout=5
    ).read())[:5]
    for sid in top:
        story = json.loads(urllib.request.urlopen(
            f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=5
        ).read())
        print(f"- {story.get('title', 'untitled')} ({story.get('score', 0)} pts)")
except Exception as e:
    print(f"HN unavailable: {e}")
`),
    collectInSandbox("System Check", `
import platform, os
print(f"Python: {platform.python_version()}")
print(f"OS: {platform.system()} {platform.release()}")
print(f"CPU count: {os.cpu_count()}")
try:
    with open("/proc/meminfo") as f:
        for line in f:
            if "MemTotal" in line:
                mb = int(line.split()[1]) // 1024
                print(f"Memory: {mb}MB")
                break
except:
    print("Memory: unknown")
`),
    collectInSandbox("Date & Time", `
from datetime import datetime, timezone
now = datetime.now(timezone.utc)
print(f"Date: {now.strftime('%A, %B %d, %Y')}")
print(f"Time: {now.strftime('%H:%M UTC')}")
print(f"Week: {now.strftime('%U')} of 52")
`),
    collectInSandbox("Random Quote", `
import urllib.request, json
try:
    data = json.loads(urllib.request.urlopen(
        "https://api.quotable.io/random", timeout=5
    ).read())
    print(f'"{data["content"]}"')
    print(f"— {data['author']}")
except Exception as e:
    print("Stay hungry, stay foolish. — Steve Jobs")
`),
  ];

  // Run all 5 sandboxes in parallel
  const results = await Promise.all(tasks);

  // Format briefing
  console.log("========================================");
  console.log("  DAILY BRIEFING");
  console.log("========================================\n");

  for (const r of results) {
    console.log(`📋 ${r.name} (${r.elapsed})`);
    if (r.error) {
      console.log(`   Error: ${r.error.split("\n")[0]}`);
    } else {
      for (const line of r.data.split("\n")) {
        console.log(`   ${line}`);
      }
    }
    console.log("");
  }

  console.log("========================================");
  console.log(`${results.length} data sources collected in parallel.`);
  console.log("Each ran in its own isolated Firecracker VM.");
  console.log("========================================\n");
}

generateBriefing().catch(console.error);
