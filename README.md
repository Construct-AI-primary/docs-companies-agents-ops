# agent-companies-openclaw

**OpenClaw orchestration layer — scripts, schemas, bot, and infrastructure.**

This repository contains the OpenClaw-native orchestration infrastructure: Discord bot, database schemas, deployment scripts, and adapter configurations. 

**Knowledge content (agents, companies, skills, disciplines, triggers) has moved to [`docs-companies-agents`](https://github.com/Construct-AI-primary/docs-companies-agents).**

## Repository Structure

```
├── scripts/                   ← Discord bot (bot.js, bot-core.js, bot-channels.js, bot-registry.js)
├── schema/                    ← SQLite database schemas
├── sql/                       ← SQL scripts and data manipulation
├── migration/                 ← Paperclip→OpenClaw migration docs
├── adapters/                  ← OpenClaw adapter configurations
├── agent-companies-core/      ← Submodule (kept for history)
└── agent-companies-paperclip/ ← Submodule (kept for history)
```

## Related Repositories

| Repo | Purpose |
|------|---------|
| **[docs-companies-agents](https://github.com/Construct-AI-primary/docs-companies-agents)** | **Flat knowledge repo** — agents, companies, skills, disciplines, triggers, orchestration docs |
| `agent-companies-core` | Original source (kept for history) |
| `agent-companies-paperclip` | Paperclip application (server, UI, CLI, packages) |

## Quick Start

```bash
# Clone this repo
git clone https://github.com/Construct-AI-primary/agent-companies-openclaw.git
cd agent-companies-openclaw

# Initialize submodules
git submodule update --init --recursive

# Browse available agents and projects
ls agent-companies-core/agents/
ls agent-companies-core/projects/
```

## Origin

Part of the Agent Companies repo restructure (Phase 3). Platform-agnostic content lives in `agent-companies-core`; OpenClaw-specific orchestration will be developed here as OpenClaw capabilities are understood.