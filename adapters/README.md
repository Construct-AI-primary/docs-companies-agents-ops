# Adapters

**Status**: ⏳ Placeholder — pending OpenClaw investigation.

## Purpose

This directory will contain OpenClaw adapter configurations for connecting AI coding assistants (Claude, Codex, Cursor, etc.) to the OpenClaw orchestration platform.

## Expected Contents

- OpenClaw adapter definitions and configurations
- Agent registration templates (OpenClaw-native IDs)
- API key management for OpenClaw agent access
- Adapter lifecycle: install, configure, test, update

## Next Steps

1. Investigate OpenClaw's adapter/plugin model
2. Determine if OpenClaw uses the same `agentcompanies/v1` adapter spec as Paperclip
3. Create adapter configs for each of the 449 agents registered in `agent-companies-core`
4. Document how agents authenticate to OpenClaw

## Reference

Paperclip adapter docs: `agent-companies-paperclip/docs-paperclip/adapters/`

---

*Fill this in when OpenClaw adapter SDK is available.*