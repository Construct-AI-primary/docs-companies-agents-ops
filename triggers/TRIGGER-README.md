# Triggers

**Status**: ✅ Active — Dispatch system operational via Discord bot.

## Purpose

This directory defines automation triggers for the Construct AI agent ecosystem. Triggers determine how and when agents are dispatched to work on issues, based on Discord commands, issue status changes, or scheduled events.

## Trigger Architecture

```
User types "@agent work on {issue-id}" in #ai-work
  → Discord bot (agent-vps#0729) receives the command
  → Bot looks up issue in ISSUE_DISPATCH_MAP (scripts/bot.js)
  → Bot creates #work-{issue-id} channel
  → Bot dispatches to the correct agent per issue assignee:
       - Creates agent config in ~/.openclaw/agents/{company}-{issue}/
       - Writes TASK.md with task payload in workspace
       - Registers agent in openclaw.json
  → Bot updates channel topic with dispatch info
  → Bot posts to #project-log and issue channel
  → Agent executes task and reports results
```

## Active Triggers

### Trigger 1: Discord Work Command
- **Source**: `#ai-work` control channel
- **Command**: `@agent work on {issue-id(s)}`
- **Dispatch**: Routes to the agent assigned in `ISSUE_DISPATCH_MAP`
- **Output**: Creates `#work-{issue-id}` channel, dispatches agent, posts to `#project-log`
- **Status**: ✅ Active

### Trigger 2: Discord Plan Command
- **Source**: `#ai-work` control channel
- **Command**: `@agent plan {issue-id}`
- **Dispatch**: Posts planning notice to `#project-log`
- **Output**: Planning summary in control channel
- **Status**: ✅ Active

### Trigger 3: Work Completion
- **Source**: `#work-{issue-id}` work channel
- **Command**: `@agent done` or `@agent complete`
- **Dispatch**: Archives work channel, posts completion summary to `#project-log`
- **Output**: Archived channel, completion notification
- **Status**: ✅ Active

### Trigger 4: Issue Channel Cross-Reference
- **Source**: Any issue channel
- **Trigger**: User mentions `@agent`
- **Dispatch**: Bot cross-references the message in `#ai-work` on the same server
- **Output**: Cross-reference post with jump link
- **Status**: ✅ Active

## Issue Dispatch Map

The `ISSUE_DISPATCH_MAP` in `scripts/bot.js` covers **all disciplines** with issue channels:

| Discipline | Server | Issues | Assigned Agents |
|------------|--------|--------|-----------------|
| 01900 Procurement | PROCURE-TEST | PROCURE-001 to -016 | DevForge, InfraForge, DomainForge, QualityForge |
| 00860 Electrical | ELEC-TEST | ELEC-TEST-001 to -016 | DevForge, InfraForge, DomainForge, QualityForge |
| 02025 QS | QS-TEST | QS-TEST-001 to -016 | DevForge, InfraForge, DomainForge, QualityForge |
| 01700 Logistics | LOGIS-TEST | LOGIS-TEST-001 to -016 | DevForge, InfraForge, DomainForge, QualityForge |
| 02400 Safety | SAFETY | SAFETY-* (10 issues) | DevForge, KnowledgeForge, VoiceForge |
| 00400/425/435 Procurement | PROCUREMENT-BIDDING | PROC-*, BTND-* (17 issues) | DevForge, PaperclipForge, KnowledgeForge, QualityForge, VoiceForge |
| 00800-872 Engineering | ENGINEERING | ENG-* (3 issues) | PaperclipForge, DevForge, VoiceForge |
| Shared disciplines | ALL-DISCIPLINES | 24 issues | DomainForge, VoiceForge, IntegrateForge, DevForge, SaaSForge, MobileForge, QualityForge |
| Voice comm | VOICE-COMM | VOICE-COMM-* (6 issues) | DevForge, MobileForge |
| Contracts/QS | CONTRACTS-QS | CON-*, CPOST-*, CPRE-*, QS-* (5 issues) | DomainForge, PaperclipForge, MeasureForge |
| Measurement | MEASUREMENT | MEASURE-* (6 issues) | MeasureForge, KnowledgeForge |
| Electrical projects | ELEC-PROJECTS | ELEC-* (2 issues) | DevForge, DomainForge |
| Logistics | LOGISTICS | LOG-*, LOGISTICS-* (2 issues) | VoiceForge, DevForge |

## How to Add a New Trigger

1. Add the issue ID and dispatch info to `ISSUE_DISPATCH_MAP` in `scripts/bot.js`
2. Add the issue channel to `ISSUE_CHANNELS` with the correct Discord channel ID
3. Deploy: `cat scripts/bot.js | ssh ... "cat > /opt/openclaw-discord-bot/bot.js"`
4. Restart: `ssh ... "systemctl restart openclaw-discord-bot"`

## Future Enhancements

- [ ] **Scheduled triggers**: Time-based dispatch (e.g., "run PROCURE-001 every Monday")
- [ ] **Status-based triggers**: Auto-dispatch when issue status changes to "ready"
- [ ] **Dependency chain triggers**: Auto-dispatch dependent issues when parent completes
- [ ] **Heartbeat monitoring**: 15-min polling loop for stalled agents
- [ ] **OpenClaw native triggers**: When CLI `agents add` and `agents bind` bugs are fixed

## Reference

- `scripts/bot.js` — Main bot with ISSUE_DISPATCH_MAP and dispatchToAgent()
- `orchestration/EXECUTION-TRACKER.md` — Execution status tracking
- `orchestration/DISCORD-CHANNEL-TAXONOMY.md` — Channel type definitions
- `agent-companies-paperclip/docs-paperclip/procedures/projects/batched-execution-plan.md` — Batch execution plan