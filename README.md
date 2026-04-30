# agent-companies-openclaw

**OpenClaw orchestration for AI agent companies — scaffolded, awaiting details.**

This repository is the active development platform for orchestrating the Construct AI agent ecosystem on OpenClaw. Platform-agnostic agent definitions, domain knowledge, and project specifications are consumed from the `agent-companies-core` submodule.

## Repository Structure

```
├── agent-companies-core/      ← Submodule: platform-agnostic agent definitions
│   ├── companies/             (16 companies, 29 teams)
│   ├── agents/                (449 agents)
│   ├── skills/                (1,123 skills)
│   ├── domain-knowledge/      (50+ disciplines)
│   ├── projects/              (~70 project charters, ~479 issues)
│   ├── specs/                 (78 UI-UX specs)
│   └── para/                  (full PARA knowledge base)
├── orchestration/             ← OpenClaw-native coordination docs [TODO]
├── triggers/                  ← OpenClaw automation triggers [TODO]
├── migration/                 ← Paperclip→OpenClaw migration docs [TODO]
├── adapters/                  ← OpenClaw adapter config [TODO]
├── procedures/                ← OpenClaw deployment/setup [TODO]
└── reports/                   ← OpenClaw execution reports [TODO]
```

## Status

| Layer | Status |
|-------|--------|
| `agent-companies-core` | ✅ Imported as submodule |
| `orchestration/` | 📋 Placeholder — fill when OpenClaw API/details known |
| `triggers/` | 📋 Placeholder — fill when OpenClaw automation primitives known |
| `migration/` | 📋 Placeholder — fill when Paperclip→OpenClaw mapping known |
| `adapters/` | 📋 Placeholder — fill when OpenClaw adapter SDK known |
| `procedures/` | 📋 Placeholder — fill when deployment details known |

## Quick Start

```bash
# Initialize submodules
git submodule update --init --recursive

# Browse available agents and projects
ls agent-companies-core/agents/
ls agent-companies-core/projects/
```

## Origin

Part of the Agent Companies repo restructure (Phase 3). Platform-agnostic content lives in `agent-companies-core`; OpenClaw-specific orchestration will be developed here as OpenClaw capabilities are understood.