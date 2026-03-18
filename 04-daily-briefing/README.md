# AI Daily Briefing — Data Collection in an Isolated Sandbox

Collects data from multiple sources inside a single Firecracker VM, then formats a concise morning briefing. All network requests happen inside the sandbox — your host machine makes zero external requests.

## What This Demonstrates

- **Single sandbox, multiple tasks** — one VM collects all data sequentially
- **Internet-enabled sandbox** — the VM can reach external APIs
- **Host isolation** — your machine never contacts the data sources directly
- **Graceful error handling** — individual task failures don't crash the briefing

## How It Works

1. Creates one Firecracker microVM with `internet: true`
2. Runs 5 Python scripts sequentially inside it (date, system info, weather, news, quote)
3. Collects results and formats a morning briefing
4. Destroys the VM

## Data Sources

| Source | URL | What it provides |
|--------|-----|-----------------|
| Date & Time | (local) | Current date, time, week number |
| System Info | (local) | Python version, OS, CPU, memory |
| Weather | wttr.in | Temperature, conditions, humidity |
| Hacker News | Firebase API | Top 5 stories with scores |
| Inspiration | quotable.io | Random motivational quote |

> **Note:** Internet-enabled sandboxes require the OmniRun server to have NAT routing configured for sandbox network namespaces. If weather/news tasks time out, check that the server's internet forwarding is working.

## Run It

```bash
cp .env.example .env
# Add your OMNIRUN_API_KEY to .env
npm install
npm start
```

## Expected Output

```
========================================
        DAILY BRIEFING
========================================

[-] Date & Time (0.3s)
    Date: Wednesday, March 18, 2026
    Time: 14:55 UTC
    Week: 11 of 52

[-] System Info (0.2s)
    Python: 3.11.15
    OS: Linux 4.14.174
    CPU: 2 cores
    Memory: 490MB

[-] Weather (1.8s)
    Temperature: 18C
    Condition: Partly cloudy
    Humidity: 62%

[-] Hacker News (2.1s)
    - Show HN: OmniRun (342 pts)
    - ...

[-] Inspiration (0.5s)
    "The best way to predict the future is to create it."
      -- Peter Drucker

========================================
5 sources collected in one sandbox.
All data fetched inside an isolated Firecracker VM.
========================================
```
