// ============================================================
// BOT REGISTRY — Data-only module (grows with projects/issues)
// ============================================================
// This file contains all registries that scale with projects and issues.
// Agents are relatively stable; channels grow with each new project.

// ============================================================
// SERVER REGISTRY — Maps server names to guild IDs
// ============================================================
const SERVER_MAP = {
  'Openclaw-comms': '1481205775710949428',
  'VOICE-COMM': '1500106236669071534',
  'PROCURE-TEST': '1500115728769093632',
  'PROCUREMENT-BIDDING': '1500116207552954540',
  'SAFETY': '1500117103817134131',
  'ELEC-TEST': '1500117452238098554',
  'ELEC-PROJECTS': '1500129930053161010',
  'QS-TEST': '1500129675916214486',
  'CONTRACTS-QS': '1500130883154219258',
  'MEASUREMENT': '1500131294879809696',
  'LOGIS-TEST': '1500131631833288926',
  'LOGISTICS': '1500131961761566851',
  'ENGINEERING': '1500132315949699177',
  'ALL-DISCIPLINES': '1500134557649731634'
};

// ============================================================
// AGENT_REGISTRY — Maps agent slugs to display names and details
// ============================================================
// Source: agent-companies-paperclip/docs-paperclip/companies/*/agents/ directories
// and agent-companies-core/companies/*/agents/ symlinks
// Data from actual AGENTS.md files
const AGENT_REGISTRY = {
  // DevForge AI agents
  'orion-devforge-orchestrator': { display: 'Orion (DevForge AI)', type: 'orchestrator', role: 'Orion Orchestrator', company: 'DevForge AI', reportsTo: 'nexus-devforge-ceo' },
  'nexus-devforge-ceo': { display: 'Nexus (DevForge AI)', type: 'ceo', role: 'Nexus CEO', company: 'DevForge AI', reportsTo: 'none' },
  'codesmith-devforge-backend-engineer': { display: 'Codesmith (DevForge AI)', type: 'backend', role: 'Codesmith Backend Engineer', company: 'DevForge AI', reportsTo: 'nexus-devforge-ceo' },
  'interface-devforge-api-integration': { display: 'Interface (DevForge AI)', type: 'integration', role: 'Interface API Integration', company: 'DevForge AI', reportsTo: 'nexus-devforge-ceo' },
  'devcore-devforge-core-development': { display: 'Devcore (DevForge AI)', type: 'core', role: 'Devcore Core Development', company: 'DevForge AI', reportsTo: 'nexus-devforge-ceo' },
  'reviewer-devforge-code-review-qa': { display: 'Reviewer (DevForge AI)', type: 'qa', role: 'Reviewer Code Review QA', company: 'DevForge AI', reportsTo: 'nexus-devforge-ceo' },
  
  // DomainForge AI agents
  'design-domainforge-design': { display: 'Design (DomainForge AI)', type: 'design', role: 'Design', company: 'DomainForge AI', reportsTo: 'orion-domainforge-ceo' },
  'procurement-domainforge-procurement-contracts': { display: 'Procurement Specialist (DomainForge AI)', type: 'procurement', role: 'Procurement Specialist', company: 'DomainForge AI', reportsTo: 'orion-domainforge-ceo' },
  'contracts-pre-award-domainforge-contracts-pre-award': { display: 'Contracts Pre-Award (DomainForge AI)', type: 'procurement', role: 'Contracts Pre-Award', company: 'DomainForge AI', reportsTo: 'orion-domainforge-ceo' },
  'orion-domainforge-ceo': { display: 'Orion (DomainForge AI)', type: 'ceo', role: 'Orion CEO', company: 'DomainForge AI', reportsTo: 'none' },
  
  // InfraForge AI agents
  'database-infraforge-database-infrastructure': { display: 'Database Ops (InfraForge AI)', type: 'database', role: 'Database Ops', company: 'InfraForge AI', reportsTo: 'orchestrator-infraforge-ceo' },
  'nimbus-infraforge-supabase-specialist': { display: 'Supabase Specialist (InfraForge AI)', type: 'database', role: 'Supabase Specialist', company: 'InfraForge AI', reportsTo: 'orchestrator-infraforge-ceo' },
  'orchestrator-infraforge-ceo': { display: 'Orchestrator (InfraForge AI)', type: 'ceo', role: 'Orchestrator CEO', company: 'InfraForge AI', reportsTo: 'none' },
  
  // QualityForge AI agents
  'governor-qualityforge-quality-director': { display: 'Governor (QualityForge AI)', type: 'quality', role: 'Governor Quality Director', company: 'QualityForge AI', reportsTo: 'apex-qualityforge-ceo' },
  'apex-qualityforge-ceo': { display: 'Apex (QualityForge AI)', type: 'ceo', role: 'Apex CEO', company: 'QualityForge AI', reportsTo: 'none' },
  
  // MobileForge AI agents
  'mobileforge-ai-mobile-specialist': { display: 'Mobile Specialist (MobileForge AI)', type: 'mobile', role: 'Mobile Specialist', company: 'MobileForge AI', reportsTo: 'ceo' },
  
  // VoiceForge AI agents
  'voiceforge-ai-voice-specialist': { display: 'Voice Specialist (VoiceForge AI)', type: 'voice', role: 'Voice Specialist', company: 'VoiceForge AI', reportsTo: 'ceo' },
  
  // KnowledgeForge AI agents
  'knowledgeforge-ai-analytics-specialist': { display: 'Analytics Specialist (KnowledgeForge AI)', type: 'analytics', role: 'Analytics Specialist', company: 'KnowledgeForge AI', reportsTo: 'ceo' },
  
  // PaperclipForge AI agents
  'paperclipforge-ai-automation-specialist': { display: 'Automation Specialist (PaperclipForge AI)', type: 'automation', role: 'Automation Specialist', company: 'PaperclipForge AI', reportsTo: 'ceo' },
  
  // MeasureForge AI agents
  'measureforge-ai-measurement-specialist': { display: 'Measurement Specialist (MeasureForge AI)', type: 'measurement', role: 'Measurement Specialist', company: 'MeasureForge AI', reportsTo: 'ceo' },

  // IntegrateForge AI agents
  'integrateforge-ai-integration-specialist': { display: 'Integration Specialist (IntegrateForge AI)', type: 'integration', role: 'Integration Specialist', company: 'IntegrateForge AI', reportsTo: 'ceo' },

  // SaaSForge AI agents
  'saasforge-ai-saas-specialist': { display: 'SaaS Specialist (SaaSForge AI)', type: 'saas', role: 'SaaS Specialist', company: 'SaaSForge AI', reportsTo: 'ceo' },

  // OpenClaw Discord Bot Agent
  'integrateforge-ai-openclawbot': { display: 'OpenClaw Bot (IntegrateForge AI)', type: 'discord-bot-operator', role: 'Discord Bot Operator', company: 'IntegrateForge AI', reportsTo: 'integrateforge-ai-ziggyorchestrator' }
};

module.exports = { SERVER_MAP, AGENT_REGISTRY };