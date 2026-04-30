-- =================================================
-- PART B: construct-ai-master Main App Mirror
-- SQLite Schema
-- 
-- Mirrors the critical+high priority tables from the 
-- construct-ai-master Supabase project for local 
-- development, coding, and testing by OpenClaw agents.
-- =================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- =================================================
-- CORE ORGANIZATION & USER TABLES
-- =================================================

-- Organizations (multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    domain TEXT,
    logo_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_active IN (0, 1))
);

-- Organization users
CREATE TABLE IF NOT EXISTS organization_users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    is_active INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CHECK (is_active IN (0, 1))
);

-- User management
CREATE TABLE IF NOT EXISTS user_management (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_verified INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    CHECK (is_verified IN (0, 1))
);

-- User organizations (many-to-many view)
CREATE TABLE IF NOT EXISTS user_organizations (
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    is_default INTEGER NOT NULL DEFAULT 0,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, organization_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CHECK (is_default IN (0, 1))
);

-- User companies
CREATE TABLE IF NOT EXISTS user_companies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_registration TEXT,
    tax_id TEXT,
    company_type TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_active IN (0, 1))
);

-- Available companies directory
CREATE TABLE IF NOT EXISTS available_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT,
    tax_number TEXT,
    industry TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_active IN (0, 1))
);

-- Companies (master)
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registration_number TEXT,
    tax_id TEXT,
    industry TEXT,
    company_type TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    address TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_active IN (0, 1))
);

-- =================================================
-- PROJECTS & CONTRACTS
-- =================================================

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    project_number TEXT,
    project_type TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    budget_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    location TEXT,
    project_manager TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT,
    contract_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    contract_type TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    contractor TEXT,
    contractor_id TEXT,
    value_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    start_date TEXT,
    end_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Contracts post summary
CREATE TABLE IF NOT EXISTS contracts_post_summary (
    id TEXT PRIMARY KEY,
    contract_id TEXT,
    summary_type TEXT NOT NULL,
    summary_content TEXT,
    key_obligations TEXT,
    key_dates TEXT,
    risk_assessment TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Contracts post data
CREATE TABLE IF NOT EXISTS a_00435_contracts_post_data (
    id TEXT PRIMARY KEY,
    contract_id TEXT,
    document_id TEXT,
    data_type TEXT NOT NULL,
    data_content TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL
);

-- =================================================
-- PROCUREMENT ORDERS
-- =================================================

-- Procurement orders
CREATE TABLE IF NOT EXISTS procurement_orders (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT,
    order_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    supplier_name TEXT,
    supplier_id TEXT,
    total_value_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    order_date TEXT,
    delivery_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Procurement order documents
CREATE TABLE IF NOT EXISTS procurement_order_documents (
    id TEXT PRIMARY KEY,
    procurement_order_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT,
    document_content TEXT,
    file_url TEXT,
    uploaded_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (procurement_order_id) REFERENCES procurement_orders(id) ON DELETE CASCADE
);

-- Procurement approvals
CREATE TABLE IF NOT EXISTS procurement_approvals (
    id TEXT PRIMARY KEY,
    procurement_order_id TEXT,
    approver_name TEXT NOT NULL,
    approver_email TEXT,
    approval_level INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    comments TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (procurement_order_id) REFERENCES procurement_orders(id) ON DELETE CASCADE,
    CHECK (status IN ('pending', 'approved', 'rejected', 'escalated'))
);

-- SOW (Scope of Work) templates
CREATE TABLE IF NOT EXISTS sow_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT,
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_type TEXT,
    scope_content TEXT,
    deliverables TEXT,
    schedule TEXT,
    payment_terms TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Procurement contributions
CREATE TABLE IF NOT EXISTS procurement_contributions (
    id TEXT PRIMARY KEY,
    procurement_order_id TEXT,
    contributor_type TEXT NOT NULL,
    contributor_name TEXT,
    contribution_type TEXT NOT NULL,
    contribution_value TEXT,
    contributed_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (procurement_order_id) REFERENCES procurement_orders(id) ON DELETE CASCADE
);

-- =================================================
-- TENDER MANAGEMENT
-- =================================================

-- Tender documents
CREATE TABLE IF NOT EXISTS tender_documents (
    id TEXT PRIMARY KEY,
    tender_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT,
    issuing_organization TEXT,
    closing_date TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    estimated_value_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_active IN (0, 1))
);

-- Tender approvals
CREATE TABLE IF NOT EXISTS tender_approvals (
    id TEXT PRIMARY KEY,
    tender_document_id TEXT,
    approver_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    comments TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (tender_document_id) REFERENCES tender_documents(id) ON DELETE CASCADE,
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- =================================================
-- DOCUMENT MANAGEMENT
-- =================================================

-- Document control documents
CREATE TABLE IF NOT EXISTS a_00900_doccontrol_documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT,
    document_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    document_type TEXT,
    discipline TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    revision TEXT DEFAULT 'A',
    author TEXT,
    owner TEXT,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Document approvals
CREATE TABLE IF NOT EXISTS a_00900_doccontrol_approvals (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    approver_name TEXT NOT NULL,
    approver_role TEXT,
    approval_order INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    comments TEXT,
    approved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES a_00900_doccontrol_documents(id) ON DELETE CASCADE,
    CHECK (status IN ('pending', 'approved', 'rejected', 'conditionally_approved'))
);

-- Consolidated documents view
CREATE TABLE IF NOT EXISTS consolidated_documents (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    source_table TEXT,
    consolidated_content TEXT,
    merged_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Matched documents
CREATE TABLE IF NOT EXISTS match_all_documents (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    matched_document_id TEXT,
    match_type TEXT NOT NULL,
    match_score REAL,
    match_details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Monthly documents created (reporting)
CREATE TABLE IF NOT EXISTS monthly_documents_created (
    id TEXT PRIMARY KEY,
    year_month TEXT NOT NULL,
    organization_id TEXT,
    document_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =================================================
-- TEMPLATES
-- =================================================

-- Active templates
CREATE TABLE IF NOT EXISTS active_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT,
    template_category TEXT,
    description TEXT,
    content TEXT,
    form_schema TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    organization_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Master templates
CREATE TABLE IF NOT EXISTS master_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    template_category TEXT,
    description TEXT,
    content TEXT,
    form_schema TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_active IN (0, 1))
);

-- Project templates
CREATE TABLE IF NOT EXISTS project_templates (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    description TEXT,
    content TEXT,
    form_schema TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CHECK (is_active IN (0, 1))
);

-- Templates (generic)
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL,
    category TEXT,
    content TEXT,
    form_schema TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    organization_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Form templates
CREATE TABLE IF NOT EXISTS form_templates (
    id TEXT PRIMARY KEY,
    form_name TEXT NOT NULL,
    form_type TEXT,
    description TEXT,
    form_schema TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    organization_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Form templates audit
CREATE TABLE IF NOT EXISTS form_templates_audit (
    id TEXT PRIMARY KEY,
    form_template_id TEXT,
    action TEXT NOT NULL,
    changed_by TEXT,
    old_values TEXT,
    new_values TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (form_template_id) REFERENCES form_templates(id) ON DELETE CASCADE
);

-- Approval workflow templates
CREATE TABLE IF NOT EXISTS approval_workflow_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    workflow_type TEXT NOT NULL,
    steps TEXT DEFAULT '[]',
    conditions TEXT DEFAULT '{}',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    organization_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Document routing templates
CREATE TABLE IF NOT EXISTS document_routing_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    routing_rules TEXT DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    organization_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    organization_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    CHECK (is_active IN (0, 1))
);

-- =================================================
-- DISCIPLINE-SPECIFIC TEMPLATES
-- =================================================

-- Safety templates
CREATE TABLE IF NOT EXISTS safety_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    discipline_id TEXT DEFAULT 'safety',
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_type TEXT NOT NULL,
    template_category TEXT DEFAULT 'safety',
    risk_level TEXT,
    status TEXT DEFAULT 'draft',
    version TEXT DEFAULT '1.0',
    is_active INTEGER NOT NULL DEFAULT 1,
    html_content TEXT,
    template_content TEXT,
    form_schema TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Safety incidents
CREATE TABLE IF NOT EXISTS safety_incidents (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT,
    incident_number TEXT NOT NULL,
    incident_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    incident_date TEXT,
    severity TEXT NOT NULL,
    location TEXT,
    reported_by TEXT,
    root_cause TEXT,
    corrective_actions TEXT,
    status TEXT NOT NULL DEFAULT 'reported',
    is_closed INTEGER NOT NULL DEFAULT 0,
    closed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CHECK (is_closed IN (0, 1))
);

-- Procurement templates
CREATE TABLE IF NOT EXISTS procurement_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    discipline_id TEXT DEFAULT 'procurement',
    template_name TEXT NOT NULL,
    template_description TEXT,
    template_type TEXT NOT NULL,
    template_category TEXT DEFAULT 'procurement',
    status TEXT DEFAULT 'draft',
    version TEXT DEFAULT '1.0',
    is_active INTEGER NOT NULL DEFAULT 1,
    html_content TEXT,
    template_content TEXT,
    form_schema TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- SOW templates (procurement version)
CREATE TABLE IF NOT EXISTS sow_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    template_name TEXT NOT NULL,
    description TEXT,
    scope_content TEXT,
    deliverables TEXT,
    schedule TEXT,
    payment_terms TEXT,
    status TEXT DEFAULT 'draft',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Project procurement templates
CREATE TABLE IF NOT EXISTS project_procurement_templates (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    description TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project engineering templates
CREATE TABLE IF NOT EXISTS project_engineering_templates (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    engineering_discipline TEXT,
    description TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Master engineering templates
CREATE TABLE IF NOT EXISTS master_engineering_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    engineering_discipline TEXT,
    description TEXT,
    content TEXT,
    form_schema TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Discipline-specific document tables
CREATE TABLE IF NOT EXISTS civil_engineering_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    document_number TEXT NOT NULL,
    title TEXT NOT NULL,
    document_type TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    file_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS logistics_documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    document_number TEXT NOT NULL,
    title TEXT NOT NULL,
    document_type TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Governance document templates
CREATE TABLE IF NOT EXISTS governance_document_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL,
    discipline TEXT DEFAULT 'governance',
    description TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =================================================
-- CONTRACTOR VETTING
-- =================================================

-- Contractor vetting
CREATE TABLE IF NOT EXISTS contractor_vetting (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    contractor_name TEXT NOT NULL,
    registration_number TEXT,
    tax_number TEXT,
    contractor_type TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    risk_rating TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Contractor vetting documents
CREATE TABLE IF NOT EXISTS contractor_vetting_documents (
    id TEXT PRIMARY KEY,
    contractor_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT,
    file_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    comments TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contractor_id) REFERENCES contractor_vetting(id) ON DELETE CASCADE
);

-- Contractor vetting document parts
CREATE TABLE IF NOT EXISTS contractor_vetting_document_parts (
    id TEXT PRIMARY KEY,
    vetting_document_id TEXT NOT NULL,
    part_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vetting_document_id) REFERENCES contractor_vetting_documents(id) ON DELETE CASCADE
);

-- Contractor vetting document hashes
CREATE TABLE IF NOT EXISTS contractor_vetting_document_hashes (
    id TEXT PRIMARY KEY,
    vetting_document_id TEXT,
    hash_type TEXT NOT NULL DEFAULT 'sha256',
    hash_value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vetting_document_id) REFERENCES contractor_vetting_documents(id) ON DELETE CASCADE
);

-- Contractor vetting sections
CREATE TABLE IF NOT EXISTS contractor_vetting_sections (
    id TEXT PRIMARY KEY,
    contractor_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    section_content TEXT,
    score INTEGER,
    max_score INTEGER DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contractor_id) REFERENCES contractor_vetting(id) ON DELETE CASCADE
);

-- Contractor vetting ingestion registry
CREATE TABLE IF NOT EXISTS contractor_vetting_ingestion_registry (
    id TEXT PRIMARY KEY,
    source_name TEXT NOT NULL,
    source_type TEXT,
    items_processed INTEGER DEFAULT 0,
    items_succeeded INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contractor vetting dashboard stats
CREATE TABLE IF NOT EXISTS contractor_vetting_dashboard_stats (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    total_contractors INTEGER DEFAULT 0,
    pending_review INTEGER DEFAULT 0,
    approved INTEGER DEFAULT 0,
    rejected INTEGER DEFAULT 0,
    high_risk INTEGER DEFAULT 0,
    stats_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contractor vetting document versions
CREATE TABLE IF NOT EXISTS a_02400_contractor_vetting_document_versions (
    id TEXT PRIMARY KEY,
    vetting_document_id TEXT,
    version_number INTEGER NOT NULL DEFAULT 1,
    content TEXT,
    file_url TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (vetting_document_id) REFERENCES contractor_vetting_documents(id) ON DELETE CASCADE
);

-- =================================================
-- SIGNATURES
-- =================================================

-- Signature documents
CREATE TABLE IF NOT EXISTS signature_documents (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    document_name TEXT NOT NULL,
    signer_name TEXT,
    signer_email TEXT,
    signature_type TEXT NOT NULL DEFAULT 'electronic',
    signed_content TEXT,
    signature_data TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    signed_at TEXT,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (is_completed IN (0, 1))
);

-- Signature templates
CREATE TABLE IF NOT EXISTS signature_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT,
    content TEXT,
    signature_fields TEXT DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =================================================
-- HR & PERSONNEL
-- =================================================

-- CV applications
CREATE TABLE IF NOT EXISTS cv_applications (
    id TEXT PRIMARY KEY,
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    position TEXT NOT NULL,
    department TEXT DEFAULT 'Human Resources',
    status TEXT NOT NULL DEFAULT 'pending',
    experience_years INTEGER DEFAULT 0,
    education_level TEXT,
    skills TEXT DEFAULT '[]',
    certifications TEXT DEFAULT '[]',
    salary_expectation REAL,
    currency TEXT DEFAULT 'ZAR',
    availability_date TEXT,
    employment_type TEXT DEFAULT 'full_time',
    location TEXT,
    remote_work_preference TEXT DEFAULT 'hybrid',
    cv_file_url TEXT,
    cover_letter_url TEXT,
    portfolio_url TEXT,
    interview_stage TEXT DEFAULT 'not_started',
    interview_date TEXT,
    interview_notes TEXT,
    interviewer_id TEXT,
    technical_score INTEGER DEFAULT 0,
    communication_score INTEGER DEFAULT 0,
    culture_fit_score INTEGER DEFAULT 0,
    overall_rating REAL DEFAULT 0.0,
    hr_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (status IN ('pending', 'under_review', 'interview_scheduled', 'approved', 'rejected', 'on_hold'))
);

-- Personnel records
CREATE TABLE IF NOT EXISTS personnel_records (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    employee_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT,
    job_title TEXT,
    employment_status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- =================================================
-- FINANCIAL RECORDS
-- =================================================

-- Financial records
CREATE TABLE IF NOT EXISTS financial_records (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    project_id TEXT,
    record_type TEXT NOT NULL,
    record_number TEXT,
    description TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'ZAR',
    record_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    category TEXT,
    reference_id TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Commercial invoices
CREATE TABLE IF NOT EXISTS commercial_invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    organization_id TEXT,
    project_id TEXT,
    supplier_name TEXT,
    supplier_vat TEXT,
    invoice_date TEXT,
    due_date TEXT,
    total_amount_cents INTEGER,
    vat_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    status TEXT NOT NULL DEFAULT 'received',
    payment_terms TEXT,
    purchase_order_ref TEXT,
    invoice_file_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- =================================================
-- CONTRIBUTORS & COLLABORATION
-- =================================================

-- Contributors
CREATE TABLE IF NOT EXISTS contributors (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    user_id TEXT,
    contributor_type TEXT NOT NULL,
    role TEXT,
    display_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    expertise TEXT DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- =================================================
-- CONFIGURATION & INTEGRATIONS
-- =================================================

-- External API configurations
CREATE TABLE IF NOT EXISTS external_api_configurations (
    id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    api_url TEXT,
    api_key TEXT,
    auth_type TEXT DEFAULT 'api_key',
    is_active INTEGER NOT NULL DEFAULT 1,
    configuration TEXT DEFAULT '{}',
    last_used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    prompt_key TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    prompt_type TEXT,
    system_prompt TEXT,
    model TEXT,
    parameters TEXT DEFAULT '{}',
    is_active INTEGER NOT NULL DEFAULT 1,
    version TEXT DEFAULT '1.0',
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Job descriptions
CREATE TABLE IF NOT EXISTS job_descriptions (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    title TEXT NOT NULL,
    department TEXT,
    description TEXT,
    requirements TEXT DEFAULT '[]',
    responsibilities TEXT DEFAULT '[]',
    salary_range_min INTEGER,
    salary_range_max INTEGER,
    currency TEXT DEFAULT 'ZAR',
    employment_type TEXT DEFAULT 'full_time',
    location TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- =================================================
-- PARTY EVALUATION & TRAVEL
-- =================================================

-- Active users travel docs
CREATE TABLE IF NOT EXISTS active_users_travel_docs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_number TEXT,
    issuing_country TEXT,
    expiry_date TEXT,
    is_valid INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Travel templates
CREATE TABLE IF NOT EXISTS travel_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    template_type TEXT,
    destination TEXT,
    purpose TEXT,
    duration_days INTEGER,
    estimated_cost_cents INTEGER,
    currency TEXT DEFAULT 'ZAR',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Timesheet templates
CREATE TABLE IF NOT EXISTS timesheet_templates (
    id TEXT PRIMARY KEY,
    template_name TEXT NOT NULL,
    work_hours_per_day REAL DEFAULT 8.0,
    work_days_per_week INTEGER DEFAULT 5,
    overtime_rules TEXT DEFAULT '{}',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =================================================
-- UPSERT / SEED DATA
-- =================================================

-- Seed a default organization
INSERT INTO organizations (id, name, slug, is_active) VALUES
('default-org', 'Construct AI', 'construct-ai', 1)
ON CONFLICT DO NOTHING;