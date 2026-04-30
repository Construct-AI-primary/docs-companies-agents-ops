# Schema — OpenClaw SQLite Database

**Status**: ✅ Active

## Architecture

The SQLite database has two parts:

```
┌────────────────────────────────────────────────────────────────┐
│ PART A: OpenClaw Orchestration (18 tables)                    │
│  Prefix: openclaw_*                                           │
│  Purpose: Agent registry, task dispatch, workflow execution,   │
│           model routing/selection, performance tracking,       │
│           events/logging, document knowledge base              │
│  File: create-openclaw-tables.sql                              │
├────────────────────────────────────────────────────────────────┤
│ PART B: construct-ai-master Mirror (62 tables)                 │
│  Purpose: Local replica of critical+high priority tables from  │
│           construct-ai-master Supabase for offline development │
│           and testing by OpenClaw agents.                      │
│  File: create-tables.sql                                       │
├────────────────────────────────────────────────────────────────┤
│ INDEXES (141 total)                                            │
│  File: indexes.sql                                             │
└────────────────────────────────────────────────────────────────┘
```

## Part A: OpenClaw Orchestration Tables (18)

| Table | Purpose |
|-------|---------|
| `openclaw_agents` | Agent registry with role, status, adapter config |
| `openclaw_agent_capabilities` | Many-to-many agent capabilities |
| `openclaw_agent_skills` | Skill assignments with proficiency levels |
| `openclaw_tasks` | Task dispatch with lifecycle tracking |
| `openclaw_task_dependencies` | DAG task dependency graph |
| `openclaw_workflows` | Multi-step workflow definitions |
| `openclaw_workflow_steps` | Ordered workflow step definitions |
| `openclaw_executions` | Execution history per task/workflow |
| `openclaw_models` | AI model registry with cost/performance profiles |
| `openclaw_agent_models` | Which models each agent can use (priority-ordered) |
| `openclaw_task_routing_rules` | **Model switching rules** — condition-based routing |
| `openclaw_model_performance_log` | Per-call performance tracking for benchmark data |
| `openclaw_agent_sessions` | Active interaction sessions |
| `openclaw_events` | Event log for observability |
| `openclaw_documents` | Knowledge base articles |
| `openclaw_document_chunks` | Chunked documents for RAG |
| `openclaw_config` | Platform-level configuration |
| `openclaw_api_keys` | External service API keys |

### Model Routing Flow

```
Task created → openclaw_tasks (category, estimated_complexity, budget_limit)
  → openclaw_task_routing_rules evaluated (condition_expression matched)
    → openclaw_agent_models checked (priority-ordered model assignments)
      → Best model selected based on rules & cost constraints
        → Dispatched to agent via openclaw_executions
          → Performance logged in openclaw_model_performance_log
```

## Part B: Construct AI Mirror Tables (62)

By domain area:

| Domain | Tables |
|--------|--------|
| **Organizations & Users** | `organizations`, `organization_users`, `user_management`, `user_organizations`, `user_companies`, `available_companies`, `companies` |
| **Projects & Contracts** | `projects`, `contracts`, `contracts_post_summary`, `a_00435_contracts_post_data` |
| **Procurement** | `procurement_orders`, `procurement_order_documents`, `procurement_approvals`, `procurement_contributions`, `sow_templates` |
| **Tenders** | `tender_documents`, `tender_approvals` |
| **Document Control** | `a_00900_doccontrol_documents`, `a_00900_doccontrol_approvals`, `consolidated_documents`, `match_all_documents`, `monthly_documents_created` |
| **Templates** | `templates`, `active_templates`, `master_templates`, `project_templates`, `form_templates`, `form_templates_audit`, `approval_workflow_templates`, `document_routing_templates`, `email_templates` |
| **Discipline Templates** | `safety_templates`, `safety_incidents`, `procurement_templates`, `project_procurement_templates`, `project_engineering_templates`, `master_engineering_templates`, `civil_engineering_documents`, `logistics_documents`, `governance_document_templates` |
| **Contractor Vetting** | `contractor_vetting`, `contractor_vetting_documents`, `contractor_vetting_document_parts`, `contractor_vetting_document_hashes`, `contractor_vetting_sections`, `contractor_vetting_ingestion_registry`, `contractor_vetting_dashboard_stats`, `a_02400_contractor_vetting_document_versions` |
| **Signatures** | `signature_documents`, `signature_templates` |
| **HR** | `cv_applications`, `personnel_records`, `job_descriptions` |
| **Finance** | `financial_records`, `commercial_invoices` |
| **Collaboration** | `contributors` |
| **Config & Integrations** | `external_api_configurations`, `prompts` |
| **Travel & Timesheets** | `active_users_travel_docs`, `travel_templates`, `timesheet_templates` |

## Build Database

```bash
# Create the full SQLite database
sqlite3 openclaw.db < schema/create-openclaw-tables.sql
sqlite3 openclaw.db < schema/create-tables.sql
sqlite3 openclaw.db < schema/indexes.sql

# Verify integrity
sqlite3 openclaw.db "PRAGMA integrity_check;"
# Expected: "ok"

# Verify foreign keys
sqlite3 openclaw.db "PRAGMA foreign_key_check;"
# Expected: no output (all keys valid)

# List tables
sqlite3 openclaw.db ".tables"
# 80 tables total

# List indexes
sqlite3 openclaw.db "SELECT name FROM sqlite_master WHERE type='index' ORDER BY name;"
# 141 indexes total
```

## Schema Files

| File | Contents |
|------|----------|
| `create-openclaw-tables.sql` | Part A: 18 OpenClaw orchestration tables + seed data |
| `create-tables.sql` | Part B: 62 construct-ai-master mirror tables |
| `indexes.sql` | All performance indexes |
| `README.md` | This file |

## Source

Part B mirrors the **construct-ai-master** Supabase project (`mseizswoiwyewsidknta.supabase.co`). Tables are based on:

- `supabase/schema/table_inventory/table_inventory.json` — 452 tables cataloged, critical+high selected for mirror
- `server/schema/agent_registry.sql` — Agent registry schema  
- `server/schema/template-system-schema.sql` — Discipline template tables
- `server/schema/privacy-tables.sql` — Privacy compliance tables
- `server/scripts/*.js/.cjs/.sql` — Individual table creation scripts
- `client/src/pages/*/sql/*.sql` — Page-specific table definitions

## Status: 📋 Placeholder

This README replaces the original placeholder. Updates to the schema should be tracked in the `migrations/` subdirectory.