# Triggers

**Status**: ⏳ Placeholder — pending OpenClaw investigation.

## Purpose

This directory will contain OpenClaw-native automation triggers. Triggers define when and how agents are dispatched to work on issues, based on events (issue created, status changed, schedule elapsed, etc.).

## Structure

```
triggers/
├── TRIGGER-README.md              ← This file
└── PROC-001-000-automation.md     ← Rewrite of the Paperclip PROC-001 stub
```

## Next Steps

1. Investigate OpenClaw's trigger/event model
2. Rewrite `PROC-001-000-automation.md` with real OpenClaw primitives:
   - Agent routing rules (which agent → which task)
   - OpenClaw API call templates
   - Error handling and retry logic
   - Desktop platform initialization sequence

## Reference

Source Paperclip version: `agent-companies-paperclip/docs-paperclip/disciplines/01900-procurement/projects/PROC-001/desktop/trigger/PROC-001-000-project-automation.md`

---

*Fill this in when OpenClaw trigger primitives are known.*