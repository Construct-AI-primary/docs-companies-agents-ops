-- =================================================
-- Performance Indexes
-- =================================================

-- Part A: OpenClaw Orchestration Indexes
CREATE INDEX IF NOT EXISTS idx_openclaw_agents_status ON openclaw_agents(status);
CREATE INDEX IF NOT EXISTS idx_openclaw_agents_role ON openclaw_agents(role);
CREATE INDEX IF NOT EXISTS idx_openclaw_tasks_status ON openclaw_tasks(status);
CREATE INDEX IF NOT EXISTS idx_openclaw_tasks_assignee ON openclaw_tasks(assignee_agent_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_tasks_workflow ON openclaw_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_tasks_created ON openclaw_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_openclaw_executions_status ON openclaw_executions(status);
CREATE INDEX IF NOT EXISTS idx_openclaw_executions_task ON openclaw_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_executions_agent ON openclaw_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_models_provider ON openclaw_models(provider);
CREATE INDEX IF NOT EXISTS idx_openclaw_models_status ON openclaw_models(status);
CREATE INDEX IF NOT EXISTS idx_openclaw_routing_rules_active ON openclaw_task_routing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_openclaw_perf_log_model ON openclaw_model_performance_log(model_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_perf_log_created ON openclaw_model_performance_log(created_at);
CREATE INDEX IF NOT EXISTS idx_openclaw_events_type ON openclaw_events(event_type);
CREATE INDEX IF NOT EXISTS idx_openclaw_events_severity ON openclaw_events(severity);
CREATE INDEX IF NOT EXISTS idx_openclaw_events_created ON openclaw_events(created_at);
CREATE INDEX IF NOT EXISTS idx_openclaw_events_agent ON openclaw_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_openclaw_sessions_status ON openclaw_agent_sessions(status);

-- Part B: Organization & User Indexes
CREATE INDEX IF NOT EXISTS idx_org_users_org ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_users_user ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_org ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_user ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Part B: Contract & Procurement Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_proc_orders_org ON procurement_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_proc_orders_project ON procurement_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_proc_orders_status ON procurement_orders(status);
CREATE INDEX IF NOT EXISTS idx_proc_order_docs_order ON procurement_order_documents(procurement_order_id);
CREATE INDEX IF NOT EXISTS idx_proc_approvals_order ON procurement_approvals(procurement_order_id);
CREATE INDEX IF NOT EXISTS idx_tender_docs_status ON tender_documents(status);
CREATE INDEX IF NOT EXISTS idx_tender_approvals_doc ON tender_approvals(tender_document_id);

-- Part B: Document Indexes
CREATE INDEX IF NOT EXISTS idx_doccontrol_docs_org ON a_00900_doccontrol_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_doccontrol_docs_project ON a_00900_doccontrol_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_doccontrol_docs_status ON a_00900_doccontrol_documents(status);
CREATE INDEX IF NOT EXISTS idx_doccontrol_approvals_doc ON a_00900_doccontrol_approvals(document_id);
CREATE INDEX IF NOT EXISTS idx_doccontrol_approvals_status ON a_00900_doccontrol_approvals(status);
CREATE INDEX IF NOT EXISTS idx_contract_post_data_contract ON a_00435_contracts_post_data(contract_id);

-- Part B: Contractor Vetting Indexes
CREATE INDEX IF NOT EXISTS idx_contractor_vetting_org ON contractor_vetting(organization_id);
CREATE INDEX IF NOT EXISTS idx_contractor_vetting_status ON contractor_vetting(status);
CREATE INDEX IF NOT EXISTS idx_cv_docs_contractor ON contractor_vetting_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_cv_sections_contractor ON contractor_vetting_sections(contractor_id);
CREATE INDEX IF NOT EXISTS idx_cv_doc_parts_doc ON contractor_vetting_document_parts(vetting_document_id);
CREATE INDEX IF NOT EXISTS idx_cv_doc_versions_doc ON a_02400_contractor_vetting_document_versions(vetting_document_id);

-- Part B: Templates Indexes
CREATE INDEX IF NOT EXISTS idx_active_templates_type ON active_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_active_templates_org ON active_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_template_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_org ON templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_safety_templates_type ON safety_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_procurement_templates_type ON procurement_templates(template_type);

-- Part B: HR & Financial Indexes
CREATE INDEX IF NOT EXISTS idx_cv_applications_status ON cv_applications(status);
CREATE INDEX IF NOT EXISTS idx_personnel_org ON personnel_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_org ON financial_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_project ON financial_records(project_id);
CREATE INDEX IF NOT EXISTS idx_commercial_invoices_org ON commercial_invoices(organization_id);