# AI Daily Briefing — Parallel Data Collection in Isolated Sandboxes

Runs multiple data collection tasks in parallel, each in its own isolated Firecracker VM. Weather, news, system info, time, and a random quote — all fetched concurrently in separate sandboxes.

## What This Demonstrates

- **Parallel sandbox execution** — 5 sandboxes run simultaneously via `Promise.all`
- **Internet-enabled sandboxes** — each VM can reach external APIs
- **Isolated failure domains** — if one data source fails, others still succeed
- **Metadata tagging** — each sandbox is tagged with its task name for observability

## How It Works

1. Spawns 5 Firecracker microVMs in parallel
2. Each VM runs a Python script to fetch data from a different source
3. Results are collected and formatted into a morning briefing
4. All VMs are destroyed after execution

## Run It

```bash
cp .env.example .env
# Add your OMNIRUN_API_KEY to .env
npm install
npm start
```

## Expected Output

```
Generating daily briefing...
Spawning parallel sandboxes for each data source...

========================================
  DAILY BRIEFING
========================================

Weather (2.1s)
   Temperature: 18°C
   Condition: Partly cloudy
   ...

HackerNews (1.8s)
   - Show HN: ... (142 pts)
   ...

========================================
5 data sources collected in parallel.
Each ran in its own isolated Firecracker VM.
========================================
```
