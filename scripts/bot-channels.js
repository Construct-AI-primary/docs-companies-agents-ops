// ============================================================
// BOT CHANNELS — Issue channel registry (grows with each project)
// ============================================================
// Each entry: channelId -> { server, name, agentSlug, purpose }
// Add new issue channels here as projects grow.

const ISSUE_CHANNELS = {

  // ── VOICE-COMM ──
  '1500106852615192626': { server: 'VOICE-COMM', name: 'devforge-voicecomm-core-interface', agentSlug: 'orion-devforge-orchestrator', purpose: 'VOICE-COMM-001' },
  '1500106928423178417': { server: 'VOICE-COMM', name: 'devforge-voicecomm-hitl-approval', agentSlug: 'orion-devforge-orchestrator', purpose: 'VOICE-COMM-002' },
  '1500107082647470132': { server: 'VOICE-COMM', name: 'devforge-voicecomm-document-attach', agentSlug: 'orion-devforge-orchestrator', purpose: 'VOICE-COMM-003' },
  '1500107182299938966': { server: 'VOICE-COMM', name: 'devforge-voicecomm-audit-logging', agentSlug: 'orion-devforge-orchestrator', purpose: 'VOICE-COMM-004' },
  '1500107298314649732': { server: 'VOICE-COMM', name: 'mobileforge-voicecomm-mobile-call', agentSlug: 'mobileforge-ai-mobile-specialist', purpose: 'VOICE-COMM-101' },
  '1500107364370616471': { server: 'VOICE-COMM', name: 'mobileforge-voicecomm-mobile-docs', agentSlug: 'mobileforge-ai-mobile-specialist', purpose: 'VOICE-COMM-102' },

  // ── PROCURE-TEST ──
  '1500118995213484053': { server: 'PROCURE-TEST', name: 'devforge-procure-foundation', agentSlug: 'devcore-devforge-core-development', purpose: 'PROCURE-001' },
  '1500118997558104157': { server: 'PROCURE-TEST', name: 'infraforge-procure-database', agentSlug: 'database-infraforge-database-infrastructure', purpose: 'PROCURE-002' },
  '1500118999630090272': { server: 'PROCURE-TEST', name: 'devforge-procure-agents', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'PROCURE-003' },
  '1500119002138148916': { server: 'PROCURE-TEST', name: 'devforge-procure-upserts', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'PROCURE-004' },
  '1500119004180779043': { server: 'PROCURE-TEST', name: 'devforge-procure-workspace', agentSlug: 'interface-devforge-api-integration', purpose: 'PROCURE-005' },
  '1500119007066456134': { server: 'PROCURE-TEST', name: 'devforge-procure-chatbot', agentSlug: 'interface-devforge-api-integration', purpose: 'PROCURE-006' },
  '1500119009134121081': { server: 'PROCURE-TEST', name: 'domainforge-procure-workflow', agentSlug: 'design-domainforge-design', purpose: 'PROCURE-007' },
  '1500119011252371538': { server: 'PROCURE-TEST', name: 'domainforge-procure-templates', agentSlug: 'design-domainforge-design', purpose: 'PROCURE-008' },
  '1500119013282283661': { server: 'PROCURE-TEST', name: 'domainforge-procure-suppliers', agentSlug: 'procurement-domainforge-procurement-contracts', purpose: 'PROCURE-009' },
  '1500119015509463120': { server: 'PROCURE-TEST', name: 'domainforge-procure-tenders', agentSlug: 'contracts-pre-award-domainforge-contracts-pre-award', purpose: 'PROCURE-010' },
  '1500119017560739890': { server: 'PROCURE-TEST', name: 'infraforge-procure-integrations', agentSlug: 'nimbus-infraforge-supabase-specialist', purpose: 'PROCURE-011' },
  '1500119020450349076': { server: 'PROCURE-TEST', name: 'devforge-procure-compliance', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'PROCURE-012' },
  '1500119022367412284': { server: 'PROCURE-TEST', name: 'devforge-procure-delegation', agentSlug: 'orion-devforge-orchestrator', purpose: 'PROCURE-013' },
  '1500119024732733540': { server: 'PROCURE-TEST', name: 'devforge-procure-feedback', agentSlug: 'orion-devforge-orchestrator', purpose: 'PROCURE-014' },
  '1500119027371216990': { server: 'PROCURE-TEST', name: 'devforge-procure-signoff', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'PROCURE-015' },
  '1500119029359316992': { server: 'PROCURE-TEST', name: 'qualityforge-procure-regression', agentSlug: 'governor-qualityforge-quality-director', purpose: 'PROCURE-016' },

  // ── PROCUREMENT-BIDDING ──
  '1500119413083602987': { server: 'PROCUREMENT-BIDDING', name: 'devforge-btnd-platform', agentSlug: 'orion-devforge-orchestrator', purpose: 'BTND-PLATFORM' },
  '1500119415554048174': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-001', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-001' },
  '1500119418051717': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-amend', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-AMEND' },
  '1500119420557725888': { server: 'PROCUREMENT-BIDDING', name: 'knowledgeforge-proc-analytics', agentSlug: 'knowledgeforge-ai-analytics-specialist', purpose: 'PROC-ANALYTICS' },
  '1500119422369796192': { server: 'PROCUREMENT-BIDDING', name: 'qualityforge-proc-audit', agentSlug: 'governor-qualityforge-quality-director', purpose: 'PROC-AUDIT' },
  '1500119424722800810': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-budget', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-BUDGET' },
  '1500119426652049438': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-emerg', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-EMERG' },
  '1500119428820631722': { server: 'PROCUREMENT-BIDDING', name: 'knowledgeforge-proc-intel', agentSlug: 'knowledgeforge-ai-analytics-specialist', purpose: 'PROC-INTEL' },
  '1500119431840403579': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-inv', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-INV' },
  '1500119433970974960': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-long', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-LONG' },
  '1500119436190023720': { server: 'PROCUREMENT-BIDDING', name: 'qualityforge-proc-ncr', agentSlug: 'governor-qualityforge-quality-director', purpose: 'PROC-NCR' },
  '1500119438295302234': { server: 'PROCUREMENT-BIDDING', name: 'devforge-proc-order', agentSlug: 'orion-devforge-orchestrator', purpose: 'PROC-ORDER' },
  '1500119439834611723': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-service', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-SERVICE' },
  '1500119442762371203': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-supp', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-SUPP' },
  '1500119445601915091': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-track', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-TRACK' },
  '1500119447749529681': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-vetting', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-VETTING' },
  '1500119449758334997': { server: 'PROCUREMENT-BIDDING', name: 'voiceforge-proc-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'PROC-VOICE' },

  // ── SAFETY ──
  '1500118682368475167': { server: 'SAFETY', name: 'voiceforge-safety-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'SAFE-VOICE' },
  '1500118685006954537': { server: 'SAFETY', name: 'devforge-safety-contractor', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-CONTRACTOR' },
  '1500118687791845507': { server: 'SAFETY', name: 'devforge-safety-emergency', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-EMERGENCY' },
  '1500118689943523500': { server: 'SAFETY', name: 'devforge-safety-hazard', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-HAZARD' },
  '1500118692162437221': { server: 'SAFETY', name: 'devforge-safety-health', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-HEALTH' },
  '1500118694406258769': { server: 'SAFETY', name: 'devforge-safety-incident', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-INCIDENT' },
  '1500118697111588945': { server: 'SAFETY', name: 'devforge-safety-inspection', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-INSPECTION' },
  '1500118698965598208': { server: 'SAFETY', name: 'devforge-safety-ppe', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-PPE' },
  '1500118701242974349': { server: 'SAFETY', name: 'knowledgeforge-safety-research', agentSlug: 'knowledgeforge-ai-analytics-specialist', purpose: 'SAFETY-RESEARCH-ENHANCEMENT' },
  '1500118703612760225': { server: 'SAFETY', name: 'devforge-safety-training', agentSlug: 'orion-devforge-orchestrator', purpose: 'SAFETY-TRAINING' },

  // ── ELEC-TEST ──
  '1500118034470404136': { server: 'ELEC-TEST', name: 'devforge-elec-test-foundation', agentSlug: 'devcore-devforge-core-development', purpose: 'ELEC-TEST-001' },
  '1500118036949237860': { server: 'ELEC-TEST', name: 'infraforge-elec-test-database', agentSlug: 'database-infraforge-database-infrastructure', purpose: 'ELEC-TEST-002' },
  '1500118039415488714': { server: 'ELEC-TEST', name: 'devforge-elec-test-agents', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'ELEC-TEST-003' },
  '1500118041533354084': { server: 'ELEC-TEST', name: 'devforge-elec-test-upserts', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'ELEC-TEST-004' },
  '1500118043798536356': { server: 'ELEC-TEST', name: 'devforge-elec-test-workspace', agentSlug: 'interface-devforge-api-integration', purpose: 'ELEC-TEST-005' },
  '1500118045899624590': { server: 'ELEC-TEST', name: 'devforge-elec-test-chatbot', agentSlug: 'interface-devforge-api-integration', purpose: 'ELEC-TEST-006' },
  '1500118048013549722': { server: 'ELEC-TEST', name: 'domainforge-elec-test-workflow', agentSlug: 'design-domainforge-design', purpose: 'ELEC-TEST-007' },
  '1500118050584793260': { server: 'ELEC-TEST', name: 'domainforge-elec-test-templates', agentSlug: 'design-domainforge-design', purpose: 'ELEC-TEST-008' },
  '1500118052883271760': { server: 'ELEC-TEST', name: 'domainforge-elec-test-suppliers', agentSlug: 'procurement-domainforge-procurement-contracts', purpose: 'ELEC-TEST-009' },
  '1500118054762451074': { server: 'ELEC-TEST', name: 'domainforge-elec-test-tenders', agentSlug: 'contracts-pre-award-domainforge-contracts-pre-award', purpose: 'ELEC-TEST-010' },
  '1500118057270513725': { server: 'ELEC-TEST', name: 'infraforge-elec-test-integrations', agentSlug: 'nimbus-infraforge-supabase-specialist', purpose: 'ELEC-TEST-011' },
  '1500118059610804305': { server: 'ELEC-TEST', name: 'devforge-elec-test-compliance', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'ELEC-TEST-012' },
  '1500118061405966438': { server: 'ELEC-TEST', name: 'devforge-elec-test-delegation', agentSlug: 'orion-devforge-orchestrator', purpose: 'ELEC-TEST-013' },
  '1500118063599718522': { server: 'ELEC-TEST', name: 'devforge-elec-test-feedback', agentSlug: 'orion-devforge-orchestrator', purpose: 'ELEC-TEST-014' },
  '1500118065508257933': { server: 'ELEC-TEST', name: 'devforge-elec-test-signoff', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'ELEC-TEST-015' },
  '1500118068444266536': { server: 'ELEC-TEST', name: 'qualityforge-elec-test-regression', agentSlug: 'governor-qualityforge-quality-director', purpose: 'ELEC-TEST-016' },

  // ── ELEC-PROJECTS ──
  '1500134762340290650': { server: 'ELEC-PROJECTS', name: 'devforge-elec-voice', agentSlug: 'orion-devforge-orchestrator', purpose: 'ELEC-VOICE' },
  '1500134809425543178': { server: 'ELEC-PROJECTS', name: 'domainforge-elec-workflow', agentSlug: 'design-domainforge-design', purpose: 'ELEC-WORKFLOW' },

  // ── QS-TEST ──
  '1500134848046698646': { server: 'QS-TEST', name: 'devforge-qs-test-foundation', agentSlug: 'devcore-devforge-core-development', purpose: 'QS-TEST-001' },
  '1500134849644597292': { server: 'QS-TEST', name: 'infraforge-qs-test-database', agentSlug: 'database-infraforge-database-infrastructure', purpose: 'QS-TEST-002' },
  '1500134852194730160': { server: 'QS-TEST', name: 'devforge-qs-test-agents', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'QS-TEST-003' },
  '1500134855004913664': { server: 'QS-TEST', name: 'devforge-qs-test-upserts', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'QS-TEST-004' },
  '1500134857182019604': { server: 'QS-TEST', name: 'devforge-qs-test-workspace', agentSlug: 'interface-devforge-api-integration', purpose: 'QS-TEST-005' },
  '1500134859081777292': { server: 'QS-TEST', name: 'devforge-qs-test-chatbot', agentSlug: 'interface-devforge-api-integration', purpose: 'QS-TEST-006' },
  '1500134861128601663': { server: 'QS-TEST', name: 'domainforge-qs-test-workflow', agentSlug: 'design-domainforge-design', purpose: 'QS-TEST-007' },
  '1500134863024685137': { server: 'QS-TEST', name: 'domainforge-qs-test-templates', agentSlug: 'design-domainforge-design', purpose: 'QS-TEST-008' },
  '1500134865889398844': { server: 'QS-TEST', name: 'domainforge-qs-test-suppliers', agentSlug: 'procurement-domainforge-procurement-contracts', purpose: 'QS-TEST-009' },
  '1500134867898208356': { server: 'QS-TEST', name: 'domainforge-qs-test-tenders', agentSlug: 'contracts-pre-award-domainforge-contracts-pre-award', purpose: 'QS-TEST-010' },
  '1500134869806878750': { server: 'QS-TEST', name: 'infraforge-qs-test-integrations', agentSlug: 'nimbus-infraforge-supabase-specialist', purpose: 'QS-TEST-011' },
  '1500134872369332284': { server: 'QS-TEST', name: 'devforge-qs-test-compliance', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'QS-TEST-012' },
  '1500134874009305250': { server: 'QS-TEST', name: 'devforge-qs-test-delegation', agentSlug: 'orion-devforge-orchestrator', purpose: 'QS-TEST-013' },
  '1500134876689731714': { server: 'QS-TEST', name: 'devforge-qs-test-feedback', agentSlug: 'orion-devforge-orchestrator', purpose: 'QS-TEST-014' },
  '1500134878795010148': { server: 'QS-TEST', name: 'devforge-qs-test-signoff', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'QS-TEST-015' },
  '1500134881727086654': { server: 'QS-TEST', name: 'qualityforge-qs-test-regression', agentSlug: 'governor-qualityforge-quality-director', purpose: 'QS-TEST-016' },

  // ── CONTRACTS-QS ──
  '1500134934331785367': { server: 'CONTRACTS-QS', name: 'domainforge-con-voice', agentSlug: 'orion-domainforge-ceo', purpose: 'CON-VOICE' },
  '1500134935942660139': { server: 'CONTRACTS-QS', name: 'domainforge-cpost-voice', agentSlug: 'orion-domainforge-ceo', purpose: 'CPOST-VOICE' },
  '1500134938769363046': { server: 'CONTRACTS-QS', name: 'domainforge-cpre-voice', agentSlug: 'orion-domainforge-ceo', purpose: 'CPRE-VOICE' },
  '1500134940724170884': { server: 'CONTRACTS-QS', name: 'paperclipforge-proc-001-qs', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'PROC-001' },
  '1500134942770725036': { server: 'CONTRACTS-QS', name: 'measureforge-qs-voice', agentSlug: 'measureforge-ai-measurement-specialist', purpose: 'QS-VOICE' },

  // ── MEASUREMENT ──
  '1500135012975120576': { server: 'MEASUREMENT', name: 'measureforge-measure-ai', agentSlug: 'measureforge-ai-measurement-specialist', purpose: 'MEASURE-AI' },
  '1500135015655411895': { server: 'MEASUREMENT', name: 'knowledgeforge-measure-analytics', agentSlug: 'knowledgeforge-ai-analytics-specialist', purpose: 'MEASURE-ANALYTICS' },
  '1500135018000023795': { server: 'MEASUREMENT', name: 'measureforge-measure-cad', agentSlug: 'measureforge-ai-measurement-specialist', purpose: 'MEASURE-CAD' },
  '1500135020684247172': { server: 'MEASUREMENT', name: 'measureforge-measure-comm', agentSlug: 'measureforge-ai-measurement-specialist', purpose: 'MEASURE-COMM' },
  '1500135023146172477': { server: 'MEASUREMENT', name: 'measureforge-measure-templates', agentSlug: 'measureforge-ai-measurement-specialist', purpose: 'MEASURE-TEMPLATES' },
  '1500135025512026183': { server: 'MEASUREMENT', name: 'measureforge-measure-tender', agentSlug: 'measureforge-ai-measurement-specialist', purpose: 'MEASURE-TENDER' },

  // ── LOGIS-TEST ──
  '1500135074379857920': { server: 'LOGIS-TEST', name: 'devforge-logis-test-foundation', agentSlug: 'devcore-devforge-core-development', purpose: 'LOGIS-TEST-001' },
  '1500135079224279042': { server: 'LOGIS-TEST', name: 'infraforge-logis-test-database', agentSlug: 'database-infraforge-database-infrastructure', purpose: 'LOGIS-TEST-002' },
  '1500135082005106749': { server: 'LOGIS-TEST', name: 'devforge-logis-test-agents', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'LOGIS-TEST-003' },
  '1500135085402493039': { server: 'LOGIS-TEST', name: 'devforge-logis-test-upserts', agentSlug: 'codesmith-devforge-backend-engineer', purpose: 'LOGIS-TEST-004' },
  '1500135089202397296': { server: 'LOGIS-TEST', name: 'devforge-logis-test-workspace', agentSlug: 'interface-devforge-api-integration', purpose: 'LOGIS-TEST-005' },
  '1500135091379372155': { server: 'LOGIS-TEST', name: 'devforge-logis-test-chatbot', agentSlug: 'interface-devforge-api-integration', purpose: 'LOGIS-TEST-006' },
  '1500135093149110362': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-workflow', agentSlug: 'design-domainforge-design', purpose: 'LOGIS-TEST-007' },
  '1500135095133012078': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-templates', agentSlug: 'design-domainforge-design', purpose: 'LOGIS-TEST-008' },
  '1500135097301467219': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-suppliers', agentSlug: 'procurement-domainforge-procurement-contracts', purpose: 'LOGIS-TEST-009' },
  '1500135099683963001': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-tenders', agentSlug: 'contracts-pre-award-domainforge-contracts-pre-award', purpose: 'LOGIS-TEST-010' },
  '1500135101210824897': { server: 'LOGIS-TEST', name: 'infraforge-logis-test-integrations', agentSlug: 'nimbus-infraforge-supabase-specialist', purpose: 'LOGIS-TEST-011' },
  '1500135103358042384': { server: 'LOGIS-TEST', name: 'devforge-logis-test-compliance', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'LOGIS-TEST-012' },
  '1500135105568571425': { server: 'LOGIS-TEST', name: 'devforge-logis-test-delegation', agentSlug: 'orion-devforge-orchestrator', purpose: 'LOGIS-TEST-013' },
  '1500135107871248457': { server: 'LOGIS-TEST', name: 'devforge-logis-test-feedback', agentSlug: 'orion-devforge-orchestrator', purpose: 'LOGIS-TEST-014' },
  '1500135110450745466': { server: 'LOGIS-TEST', name: 'devforge-logis-test-signoff', agentSlug: 'reviewer-devforge-code-review-qa', purpose: 'LOGIS-TEST-015' },
  '1500135112447365241': { server: 'LOGIS-TEST', name: 'qualityforge-logis-test-regression', agentSlug: 'governor-qualityforge-quality-director', purpose: 'LOGIS-TEST-016' },

  // ── LOGISTICS ──
  '1500135153278648480': { server: 'LOGISTICS', name: 'voiceforge-log-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'LOG-VOICE' },
  '1500135155694567457': { server: 'LOGISTICS', name: 'devforge-logistics-platform', agentSlug: 'orion-devforge-orchestrator', purpose: 'LOGISTICS-PLATFORM' },

  // ── ENGINEERING ──
  '1500135158739898399': { server: 'ENGINEERING', name: 'paperclipforge-eng-auto', agentSlug: 'paperclipforge-ai-automation-specialist', purpose: 'ENG-AUTO-000' },
  '1500135161302351922': { server: 'ENGINEERING', name: 'devforge-eng-platform', agentSlug: 'orion-devforge-orchestrator', purpose: 'ENG-PLATFORM-000' },
  '1500135162804043838': { server: 'ENGINEERING', name: 'voiceforge-eng-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'ENG-VOICE' },

  // ── ALL-DISCIPLINES (cross-discipline workflows) ──
  '1500135909285433435': { server: 'ALL-DISCIPLINES', name: 'domainforge-design-workflow', agentSlug: 'design-domainforge-design', purpose: 'DESIGN-WORKFLOW' },
  '1500135911361347727': { server: 'ALL-DISCIPLINES', name: 'voiceforge-arch-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'ARCH-VOICE' },
  '1500135913219424421': { server: 'ALL-DISCIPLINES', name: 'domainforge-architectural-workflow', agentSlug: 'design-domainforge-design', purpose: 'ARCHITECTURAL-WORKFLOW' },
  '1500135915295608933': { server: 'ALL-DISCIPLINES', name: 'voiceforge-chem-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'CHEM-VOICE' },
  '1500135917741150389': { server: 'ALL-DISCIPLINES', name: 'domainforge-chemical-workflow', agentSlug: 'design-domainforge-design', purpose: 'CHEMICAL-WORKFLOW' },
  '1500135919536181289': { server: 'ALL-DISCIPLINES', name: 'voiceforge-civil-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'CIVIL-VOICE' },
  '1500135922057089044': { server: 'ALL-DISCIPLINES', name: 'domainforge-civil-workflow', agentSlug: 'design-domainforge-design', purpose: 'CIVIL-WORKFLOW' },
  '1500135924158173255': { server: 'ALL-DISCIPLINES', name: 'voiceforge-land-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'LAND-VOICE' },
  '1500135925894877226': { server: 'ALL-DISCIPLINES', name: 'domainforge-geotech-workflow', agentSlug: 'design-domainforge-design', purpose: 'GEOTECH-WORKFLOW' },
  '1500135928377770166': { server: 'ALL-DISCIPLINES', name: 'voiceforge-geo-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'GEO-VOICE' },
  '1500135930340839484': { server: 'ALL-DISCIPLINES', name: 'voiceforge-mech-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'MECH-VOICE' },
  '1500135932349907115': { server: 'ALL-DISCIPLINES', name: 'domainforge-mech-workflow', agentSlug: 'design-domainforge-design', purpose: 'MECH-WORKFLOW' },
  '1500135934476288020': { server: 'ALL-DISCIPLINES', name: 'voiceforge-proce-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'PROCE-VOICE' },
  '1500135936967573729': { server: 'ALL-DISCIPLINES', name: 'domainforge-process-workflow', agentSlug: 'design-domainforge-design', purpose: 'PROCESS-WORKFLOW' },
  '1500135939488612503': { server: 'ALL-DISCIPLINES', name: 'voiceforge-struc-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'STRUC-VOICE' },
  '1500135941728112660': { server: 'ALL-DISCIPLINES', name: 'domainforge-env-workflow', agentSlug: 'design-domainforge-design', purpose: 'ENV-WORKFLOW' },
  '1500135943808614520': { server: 'ALL-DISCIPLINES', name: 'voiceforge-env-voice', agentSlug: 'voiceforge-ai-voice-specialist', purpose: 'ENV-VOICE' },
  '1500135945620684811': { server: 'ALL-DISCIPLINES', name: 'integrateforge-integration-settings', agentSlug: 'integrateforge-ai-integration-specialist', purpose: 'INTEGRATION-SETTINGS-UI' },
  '1500135947667374144': { server: 'ALL-DISCIPLINES', name: 'devforge-security-asset', agentSlug: 'orion-devforge-orchestrator', purpose: 'SECURITY-ASSET' },
  '1500135950422904852': { server: 'ALL-DISCIPLINES', name: 'domainforge-sundry-workflow', agentSlug: 'design-domainforge-design', purpose: 'SUNDRY-WORKFLOW' },
  '1500135953304653944': { server: 'ALL-DISCIPLINES', name: 'saasforge-saas-prod-prep', agentSlug: 'saasforge-ai-saas-specialist', purpose: 'SAAS-PROD-PREP' },
  '1500135955460395252': { server: 'ALL-DISCIPLINES', name: 'mobileforge-mobile-test', agentSlug: 'mobileforge-ai-mobile-specialist', purpose: 'MOBILE-TEST' },
  '1500135958111064154': { server: 'ALL-DISCIPLINES', name: 'qualityforge-prod-test', agentSlug: 'governor-qualityforge-quality-director', purpose: 'PROD-TEST' },

  // ── PROD-TEST (ALL-DISCIPLINES) — created 2026-05-05 ──
  '1501118691897774100': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-tier1', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-001' },
  '1501118694359695441': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-login', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-002' },
  '1501118696998047784': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-user-creation', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-003' },
  '1501118699212636211': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-database-upsert', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-004' },
  '1501118703885090976': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-accordion', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-005' },
  '1501118706015670303': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-environment', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-006' },
  '1501118708184256684': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-tier2', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-007' },
  '1501118710507634808': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-ui-settings', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-008' },
  '1501118712793665626': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-non-discipline', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-009' },
  '1501118715373031648': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-discipline', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-010' },
  '1501118718296592464': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-tier3', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-011' },
  '1501118721408765954': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-chatbot', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-012' },
  '1501118724147515446': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-tier4', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-013' },
  '1501118726840254626': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-hitl', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-014' },
  '1501118729709420565': { server: 'ALL-DISCIPLINES', name: 'devforge-prod-hitl-workflow', agentSlug: 'devcore-devforge-core-development', purpose: 'PROD-HITL' }
};

module.exports = { ISSUE_CHANNELS };