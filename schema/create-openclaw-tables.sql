-- =================================================
-- PART A: OpenClaw Orchestration Tables
-- SQLite Schema
-- =================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- =================================================
-- AGENT MANAGEMENT
-- =================================================

-- OpenClaw agent registry
CREATE TABLE IF NOT EXISTS openclaw_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'general',
    status TEXT NOT NULL DEFAULT 'idle',
    adapter_type TEXT NOT NULL DEFAULT 'process',
    adapter_config TEXT DEFAULT '{}',
    runtime_config TEXT DEFAULT '{}',
    budget_monthly_cents INTEGER NOT NULL DEFAULT 0,
    spent_monthly_cents INTEGER NOT NULL DEFAULT 0,
    last_heartbeat_at TEXT,
    capabilities TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (status IN ('idle', 'busy', 'paused', 'offline', 'error'))
);

-- OpenClaw agent capabilities (many-to-many)
CREATE TABLE IF NOT EXISTS openclaw_agent_capabilities (
    agent_id TEXT NOT NULL,
    capability TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (agent_id, capability),
    FOREIGN KEY (agent_id) REFERENCES openclaw_agents(id) ON DELETE CASCADE
);

-- Agent skill assignments
CREATE TABLE IF NOT EXISTS openclaw_agent_skills (
    agent_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    proficiency_level INTEGER DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (agent_id, skill_name),
    FOREIGN KEY (agent_id) REFERENCES openclaw_agents(id) ON DELETE CASCADE
);

-- =================================================
-- TASK MANAGEMENT
-- =================================================

-- Task dispatch and lifecycle tracking
CREATE TABLE IF NOT EXISTS openclaw_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT,
    estimated_complexity REAL DEFAULT 0.5,
    budget_limit_cents INTEGER,
    assignee_agent_id TEXT,
    parent_task_id TEXT,
    workflow_id TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (assignee_agent_id) REFERENCES openclaw_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_task_id) REFERENCES openclaw_tasks(id) ON DELETE CASCADE,
    CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled', 'blocked')),
    CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

-- Task dependencies (DAG)
CREATE TABLE IF NOT EXISTS openclaw_task_dependencies (
    task_id TEXT NOT NULL,
    depends_on_task_id TEXT NOT NULL,
    dependency_type TEXT NOT NULL DEFAULT 'required',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (task_id, depends_on_task_id),
    FOREIGN KEY (task_id) REFERENCES openclaw_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES openclaw_tasks(id) ON DELETE CASCADE,
    CHECK (dependency_type IN ('required', 'optional', 'soft'))
);

-- =================================================
-- WORKFLOW MANAGEMENT
-- =================================================

-- Multi-step workflow definitions
CREATE TABLE IF NOT EXISTS openclaw_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    version TEXT NOT NULL DEFAULT '1.0.0',
    config TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (status IN ('active', 'inactive', 'archived'))
);

-- Workflow steps
CREATE TABLE IF NOT EXISTS openclaw_workflow_steps (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    name TEXT NOT NULL,
    task_template TEXT,
    assigned_role TEXT,
    timeout_seconds INTEGER DEFAULT 300,
    retry_count INTEGER DEFAULT 0,
    config TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workflow_id) REFERENCES openclaw_workflows(id) ON DELETE CASCADE
);

-- =================================================
-- EXECUTION HISTORY
-- =================================================

-- Execution history per task/workflow
CREATE TABLE IF NOT EXISTS openclaw_executions (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    workflow_id TEXT,
    workflow_step_id TEXT,
    agent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    input_data TEXT,
    output_data TEXT,
    error_message TEXT,
    started_at TEXT,
    completed_at TEXT,
    duration_ms INTEGER,
    model_used TEXT,
    tokens_used INTEGER,
    cost_cents INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES openclaw_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES openclaw_workflows(id) ON DELETE SET NULL,
    FOREIGN KEY (agent_id) REFERENCES openclaw_agents(id) ON DELETE SET NULL,
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout'))
);

-- =================================================
-- MODEL ROUTING & SWITCHING
-- =================================================

-- Available AI models with cost/performance profiles
CREATE TABLE IF NOT EXISTS openclaw_models (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    display_name TEXT,
    model_family TEXT,
    capabilities TEXT DEFAULT '[]',
    cost_per_1k_input_tokens REAL DEFAULT 0.0,
    cost_per_1k_output_tokens REAL DEFAULT 0.0,
    avg_latency_ms INTEGER,
    max_tokens INTEGER DEFAULT 4096,
    status TEXT NOT NULL DEFAULT 'active',
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (status IN ('active', 'deprecated', 'beta', 'limited'))
);

-- Which models each agent can use
CREATE TABLE IF NOT EXISTS openclaw_agent_models (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    max_budget_cents INTEGER,
    allowed_categories TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES openclaw_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES openclaw_models(id) ON DELETE CASCADE
);

-- Task routing rules for model selection
CREATE TABLE IF NOT EXISTS openclaw_task_routing_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    condition_expression TEXT NOT NULL,
    agent_id TEXT,
    model_id TEXT,
    fallback_model_id TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES openclaw_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (model_id) REFERENCES openclaw_models(id) ON DELETE SET NULL,
    FOREIGN KEY (fallback_model_id) REFERENCES openclaw_models(id) ON DELETE SET NULL
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS openclaw_model_performance_log (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL,
    task_id TEXT,
    execution_id TEXT,
    task_category TEXT,
    task_complexity REAL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    latency_ms INTEGER,
    cost_cents INTEGER,
    success INTEGER NOT NULL DEFAULT 1,
    error_type TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (model_id) REFERENCES openclaw_models(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES openclaw_tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (execution_id) REFERENCES openclaw_executions(id) ON DELETE SET NULL
);

-- =================================================
-- SESSION MANAGEMENT
-- =================================================

-- Agent interaction sessions
CREATE TABLE IF NOT EXISTS openclaw_agent_sessions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    task_id TEXT,
    session_type TEXT NOT NULL DEFAULT 'interactive',
    status TEXT NOT NULL DEFAULT 'active',
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    context TEXT DEFAULT '{}',
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (agent_id) REFERENCES openclaw_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES openclaw_tasks(id) ON DELETE SET NULL,
    CHECK (status IN ('active', 'paused', 'completed', 'timed_out'))
);

-- =================================================
-- EVENT LOG / OBSERVABILITY
-- =================================================

-- Event log for observability
CREATE TABLE IF NOT EXISTS openclaw_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'system',
    severity TEXT NOT NULL DEFAULT 'info',
    agent_id TEXT,
    task_id TEXT,
    execution_id TEXT,
    message TEXT,
    payload TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (agent_id) REFERENCES openclaw_agents(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES openclaw_tasks(id) ON DELETE SET NULL,
    CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

-- =================================================
-- KNOWLEDGE BASE / DOCUMENTS
-- =================================================

-- Documentation/knowledge base articles
CREATE TABLE IF NOT EXISTS openclaw_documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    doc_type TEXT NOT NULL DEFAULT 'article',
    category TEXT,
    tags TEXT DEFAULT '[]',
    source_url TEXT,
    version TEXT DEFAULT '1.0.0',
    status TEXT NOT NULL DEFAULT 'active',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (status IN ('active', 'archived', 'draft'))
);

-- Chunked documents for RAG
CREATE TABLE IF NOT EXISTS openclaw_document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT,
    token_count INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES openclaw_documents(id) ON DELETE CASCADE
);

-- =================================================
-- CONFIGURATION
-- =================================================

-- Platform-level configuration
CREATE TABLE IF NOT EXISTS openclaw_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_secret INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- External service API keys
CREATE TABLE IF NOT EXISTS openclaw_api_keys (
    id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    provider TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_used_at TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_active IN (0, 1))
);

-- =================================================
-- INDEXES
-- =================================================

CREATE INDEX idx_openclaw_agents_status ON openclaw_agents(status);
CREATE INDEX idx_openclaw_agents_role ON openclaw_agents(role);
CREATE INDEX idx_openclaw_tasks_status ON openclaw_tasks(status);
CREATE INDEX idx_openclaw_tasks_assignee ON openclaw_tasks(assignee_agent_id);
CREATE INDEX idx_openclaw_tasks_workflow ON openclaw_tasks(workflow_id);
CREATE INDEX idx_openclaw_tasks_created ON openclaw_tasks(created_at);
CREATE INDEX idx_openclaw_executions_status ON openclaw_executions(status);
CREATE INDEX idx_openclaw_executions_task ON openclaw_executions(task_id);
CREATE INDEX idx_openclaw_executions_agent ON openclaw_executions(agent_id);
CREATE INDEX idx_openclaw_models_provider ON openclaw_models(provider);
CREATE INDEX idx_openclaw_models_status ON openclaw_models(status);
CREATE INDEX idx_openclaw_routing_rules_active ON openclaw_task_routing_rules(is_active);
CREATE INDEX idx_openclaw_perf_log_model ON openclaw_model_performance_log(model_id);
CREATE INDEX idx_openclaw_perf_log_created ON openclaw_model_performance_log(created_at);
CREATE INDEX idx_openclaw_events_type ON openclaw_events(event_type);
CREATE INDEX idx_openclaw_events_severity ON openclaw_events(severity);
CREATE INDEX idx_openclaw_events_created ON openclaw_events(created_at);
CREATE INDEX idx_openclaw_events_agent ON openclaw_events(agent_id);
CREATE INDEX idx_openclaw_sessions_status ON openclaw_agent_sessions(status);

-- =================================================
-- SEED DATA: Default OpenClaw Agent
-- =================================================

INSERT INTO openclaw_agents (id, name, role, status, adapter_type, adapter_config, capabilities, metadata)
VALUES (
    'openclaw-ai-sqlite-manager',
    'SQLite Manager',
    'database_administrator',
    'idle',
    'process',
    '{"process_type": "sqlite_manager"}',
    '["schema-management", "backup", "migration", "query-optimization", "integrity-check"]',
    '{"managed_by": "openclawforge-ai", "version": "1.0.0"}'
);

INSERT INTO openclaw_models (id, provider, model_name, display_name, model_family, capabilities, cost_per_1k_input_tokens, cost_per_1k_output_tokens, max_tokens, status) VALUES
('model-gpt-4o', 'openai', 'gpt-4o', 'GPT-4 Omni', 'gpt-4', '["text", "vision", "tool-use"]', 2.5, 10.0, 128000, 'active'),
('model-gpt-4o-mini', 'openai', 'gpt-4o-mini', 'GPT-4 Omni Mini', 'gpt-4', '["text", "vision", "tool-use"]', 0.15, 0.6, 128000, 'active'),
('model-claude-opus', 'anthropic', 'claude-3-opus', 'Claude 3 Opus', 'claude-3', '["text", "tool-use"]', 15.0, 75.0, 200000, 'active'),
('model-claude-sonnet', 'anthropic', 'claude-3-sonnet', 'Claude 3.5 Sonnet', 'claude-3', '["text", "tool-use"]', 3.0, 15.0, 200000, 'active');

INSERT INTO openclaw_agent_models (id, agent_id, model_id, priority) VALUES
('am-sqlite-gpt4o', 'openclaw-ai-sqlite-manager', 'model-gpt-4o', 1),
('am-sqlite-sonnet', 'openclaw-ai-sqlite-manager', 'model-claude-sonnet', 2);

-- Default configuration entries
INSERT INTO openclaw_config (key, value, description, category) VALUES
('db.schema_dir', './schema', 'Directory for SQLite schema files', 'database'),
('db.backup_dir', './backups', 'Directory for database backups', 'database'),
('task.default_timeout_sec', '600', 'Default task timeout in seconds', 'tasks'),
('task.max_retries', '3', 'Maximum task retries', 'tasks'),
('logging.level', 'info', 'Default logging level', 'system');