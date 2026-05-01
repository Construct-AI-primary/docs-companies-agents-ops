-- =================================================
-- Migration 001: Add AGENTS.md frontmatter columns
-- to openclaw_agents table
-- =================================================

-- Add slug for agent identification (mirrors AGENTS.md slug field)
ALTER TABLE openclaw_agents ADD COLUMN slug TEXT UNIQUE;

-- Add reportsTo for reporting hierarchy (mirrors AGENTS.md reportsTo field)
ALTER TABLE openclaw_agents ADD COLUMN reports_to TEXT;

-- Add description (mirrors AGENTS.md description field)
ALTER TABLE openclaw_agents ADD COLUMN description TEXT;

-- Add skills as JSON array (mirrors AGENTS.md skills list)
ALTER TABLE openclaw_agents ADD COLUMN skills TEXT DEFAULT '[]';

-- Add company reference for multi-company agent registry
ALTER TABLE openclaw_agents ADD COLUMN company TEXT;

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_openclaw_agents_slug ON openclaw_agents(slug);

-- Index for reports_to hierarchy queries
CREATE INDEX IF NOT EXISTS idx_openclaw_agents_reports_to ON openclaw_agents(reports_to);

-- Index for company filtering
CREATE INDEX IF NOT EXISTS idx_openclaw_agents_company ON openclaw_agents(company);