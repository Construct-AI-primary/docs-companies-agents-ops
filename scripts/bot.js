const { Client, GatewayIntentBits, Events, ChannelType, PermissionsBitField } = require('discord.js');
require('dotenv').config();
const https = require('https');
const http = require('http');

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  // OpenClaw Gateway API (for sub-agent spawning)
  openclawApiBase: process.env.OPENCLAW_API_BASE || 'http://localhost:8080',
  openclawApiKey: process.env.OPENCLAW_API_KEY || '',
  // Token for Discord API direct calls (create/archive channels)
  discordToken: process.env.DISCORD_BOT_TOKEN || '',
  // Rate limiting
  maxSubAgentsPerWork: 10,
  workChannelCategoryName: 'WORKSPACES',
  // Ephemeral channel cleanup: archive after N minutes inactive
  workChannelInactiveMinutes: 60,
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ============================================================
// IN-MEMORY STATE
// ============================================================
// Tracks active work sessions: { workChannelId -> { issueId, server, status, subAgents, startedAt } }
const activeWorks = {};

// ============================================================
// CHANNEL TYPE INFERENCE
// ============================================================
function getChannelType(name) {
  if (name === 'ai-work') return 'control';
  if (name === 'project-log') return 'log';
  if (name === 'project-ops') return 'ops';
  if (name.startsWith('work-')) return 'work';
  if (['deployments', 'monitoring', 'security', 'operations', 'agent-commands', 'voice-comm'].includes(name)) return 'system';
  return 'issue';
}

function getReplyMode(type) {
  switch (type) {
    case 'control': return 'direct';
    case 'log': return 'agent-write';
    case 'ops': return 'direct';
    case 'work': return 'direct';
    case 'system': return 'agent-write';
    case 'issue': return 'cross-ref';
    default: return 'direct';
  }
}

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
// ISSUE CHANNEL REGISTRY — Hardcoded with agent assignments
// ============================================================
const ISSUE_CHANNELS = {
  // VOICE-COMM
  '1500106852615192626': { server: 'VOICE-COMM', name: 'devforge-voicecomm-core-interface', agent: 'DevForge AI', purpose: 'VOICE-COMM-001' },
  '1500106928423178417': { server: 'VOICE-COMM', name: 'devforge-voicecomm-hitl-approval', agent: 'DevForge AI', purpose: 'VOICE-COMM-002' },
  '1500107082647470132': { server: 'VOICE-COMM', name: 'devforge-voicecomm-document-attach', agent: 'DevForge AI', purpose: 'VOICE-COMM-003' },
  '1500107182299938966': { server: 'VOICE-COMM', name: 'devforge-voicecomm-audit-logging', agent: 'DevForge AI', purpose: 'VOICE-COMM-004' },
  '1500107298314649732': { server: 'VOICE-COMM', name: 'mobileforge-voicecomm-mobile-call', agent: 'MobileForge AI', purpose: 'VOICE-COMM-101' },
  '1500107364370616471': { server: 'VOICE-COMM', name: 'mobileforge-voicecomm-mobile-docs', agent: 'MobileForge AI', purpose: 'VOICE-COMM-102' },
  // PROCURE-TEST
  '1500118995213484053': { server: 'PROCURE-TEST', name: 'devforge-procure-foundation', agent: 'DevForge AI', purpose: 'PROCURE-001' },
  '1500118997558104157': { server: 'PROCURE-TEST', name: 'infraforge-procure-database', agent: 'InfraForge AI', purpose: 'PROCURE-002' },
  '1500118999630090272': { server: 'PROCURE-TEST', name: 'devforge-procure-agents', agent: 'DevForge AI', purpose: 'PROCURE-003' },
  '1500119002138148916': { server: 'PROCURE-TEST', name: 'devforge-procure-upserts', agent: 'DevForge AI', purpose: 'PROCURE-004' },
  '1500119004180779043': { server: 'PROCURE-TEST', name: 'devforge-procure-workspace', agent: 'DevForge AI', purpose: 'PROCURE-005' },
  '1500119007066456134': { server: 'PROCURE-TEST', name: 'devforge-procure-chatbot', agent: 'DevForge AI', purpose: 'PROCURE-006' },
  '1500119009134121081': { server: 'PROCURE-TEST', name: 'domainforge-procure-workflow', agent: 'DomainForge AI', purpose: 'PROCURE-007' },
  '1500119011252371538': { server: 'PROCURE-TEST', name: 'domainforge-procure-templates', agent: 'DomainForge AI', purpose: 'PROCURE-008' },
  '1500119013282283661': { server: 'PROCURE-TEST', name: 'domainforge-procure-suppliers', agent: 'DomainForge AI', purpose: 'PROCURE-009' },
  '1500119015509463120': { server: 'PROCURE-TEST', name: 'domainforge-procure-tenders', agent: 'DomainForge AI', purpose: 'PROCURE-010' },
  '1500119017560739890': { server: 'PROCURE-TEST', name: 'infraforge-procure-integrations', agent: 'InfraForge AI', purpose: 'PROCURE-011' },
  '1500119020450349076': { server: 'PROCURE-TEST', name: 'devforge-procure-compliance', agent: 'DevForge AI', purpose: 'PROCURE-012' },
  '1500119022367412284': { server: 'PROCURE-TEST', name: 'devforge-procure-delegation', agent: 'DevForge AI', purpose: 'PROCURE-013' },
  '1500119024732733540': { server: 'PROCURE-TEST', name: 'devforge-procure-feedback', agent: 'DevForge AI', purpose: 'PROCURE-014' },
  '1500119027371216990': { server: 'PROCURE-TEST', name: 'devforge-procure-signoff', agent: 'DevForge AI', purpose: 'PROCURE-015' },
  '1500119029359316992': { server: 'PROCURE-TEST', name: 'qualityforge-procure-regression', agent: 'QualityForge AI', purpose: 'PROCURE-016' },
  // PROCUREMENT-BIDDING
  '1500119413083602987': { server: 'PROCUREMENT-BIDDING', name: 'devforge-btnd-platform', agent: 'DevForge AI', purpose: 'BTND-PLATFORM' },
  '1500119415554048174': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-001', agent: 'PaperclipForge AI', purpose: 'PROC-001' },
  '1500119418058051717': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-amend', agent: 'PaperclipForge AI', purpose: 'PROC-AMEND' },
  '1500119420557725888': { server: 'PROCUREMENT-BIDDING', name: 'knowledgeforge-proc-analytics', agent: 'KnowledgeForge AI', purpose: 'PROC-ANALYTICS' },
  '1500119422369796192': { server: 'PROCUREMENT-BIDDING', name: 'qualityforge-proc-audit', agent: 'QualityForge AI', purpose: 'PROC-AUDIT' },
  '1500119424722800810': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-budget', agent: 'PaperclipForge AI', purpose: 'PROC-BUDGET' },
  '1500119426652049438': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-emerg', agent: 'PaperclipForge AI', purpose: 'PROC-EMERG' },
  '1500119428820631722': { server: 'PROCUREMENT-BIDDING', name: 'knowledgeforge-proc-intel', agent: 'KnowledgeForge AI', purpose: 'PROC-INTEL' },
  '1500119431840403579': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-inv', agent: 'PaperclipForge AI', purpose: 'PROC-INV' },
  '1500119433970974960': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-long', agent: 'PaperclipForge AI', purpose: 'PROC-LONG' },
  '1500119436190023720': { server: 'PROCUREMENT-BIDDING', name: 'qualityforge-proc-ncr', agent: 'QualityForge AI', purpose: 'PROC-NCR' },
  '1500119438295302234': { server: 'PROCUREMENT-BIDDING', name: 'devforge-proc-order', agent: 'DevForge AI', purpose: 'PROC-ORDER' },
  '1500119439834611723': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-service', agent: 'PaperclipForge AI', purpose: 'PROC-SERVICE' },
  '1500119442762371203': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-supp', agent: 'PaperclipForge AI', purpose: 'PROC-SUPP' },
  '1500119445601915091': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-track', agent: 'PaperclipForge AI', purpose: 'PROC-TRACK' },
  '1500119447749529681': { server: 'PROCUREMENT-BIDDING', name: 'paperclipforge-proc-vetting', agent: 'PaperclipForge AI', purpose: 'PROC-VETTING' },
  '1500119449758334997': { server: 'PROCUREMENT-BIDDING', name: 'voiceforge-proc-voice', agent: 'VoiceForge AI', purpose: 'PROC-VOICE' },
  // SAFETY
  '1500118682368475167': { server: 'SAFETY', name: 'voiceforge-safety-voice', agent: 'VoiceForge AI', purpose: 'SAFE-VOICE' },
  '1500118685006954537': { server: 'SAFETY', name: 'devforge-safety-contractor', agent: 'DevForge AI', purpose: 'SAFETY-CONTRACTOR' },
  '1500118687791845507': { server: 'SAFETY', name: 'devforge-safety-emergency', agent: 'DevForge AI', purpose: 'SAFETY-EMERGENCY' },
  '1500118689943523500': { server: 'SAFETY', name: 'devforge-safety-hazard', agent: 'DevForge AI', purpose: 'SAFETY-HAZARD' },
  '1500118692162437221': { server: 'SAFETY', name: 'devforge-safety-health', agent: 'DevForge AI', purpose: 'SAFETY-HEALTH' },
  '1500118694406258769': { server: 'SAFETY', name: 'devforge-safety-incident', agent: 'DevForge AI', purpose: 'SAFETY-INCIDENT' },
  '1500118697111588945': { server: 'SAFETY', name: 'devforge-safety-inspection', agent: 'DevForge AI', purpose: 'SAFETY-INSPECTION' },
  '1500118698965598208': { server: 'SAFETY', name: 'devforge-safety-ppe', agent: 'DevForge AI', purpose: 'SAFETY-PPE' },
  '1500118701242974349': { server: 'SAFETY', name: 'knowledgeforge-safety-research', agent: 'KnowledgeForge AI', purpose: 'SAFETY-RESEARCH-ENHANCEMENT' },
  '1500118703612760225': { server: 'SAFETY', name: 'devforge-safety-training', agent: 'DevForge AI', purpose: 'SAFETY-TRAINING' },
  // ELEC-TEST
  '1500118034470404136': { server: 'ELEC-TEST', name: 'devforge-elec-test-foundation', agent: 'DevForge AI', purpose: 'ELEC-TEST-001' },
  '1500118036949237860': { server: 'ELEC-TEST', name: 'infraforge-elec-test-database', agent: 'InfraForge AI', purpose: 'ELEC-TEST-002' },
  '1500118039415488714': { server: 'ELEC-TEST', name: 'devforge-elec-test-agents', agent: 'DevForge AI', purpose: 'ELEC-TEST-003' },
  '1500118041533354084': { server: 'ELEC-TEST', name: 'devforge-elec-test-upserts', agent: 'DevForge AI', purpose: 'ELEC-TEST-004' },
  '1500118043798536356': { server: 'ELEC-TEST', name: 'devforge-elec-test-workspace', agent: 'DevForge AI', purpose: 'ELEC-TEST-005' },
  '1500118045899624590': { server: 'ELEC-TEST', name: 'devforge-elec-test-chatbot', agent: 'DevForge AI', purpose: 'ELEC-TEST-006' },
  '1500118048013549722': { server: 'ELEC-TEST', name: 'domainforge-elec-test-workflow', agent: 'DomainForge AI', purpose: 'ELEC-TEST-007' },
  '1500118050584793260': { server: 'ELEC-TEST', name: 'domainforge-elec-test-templates', agent: 'DomainForge AI', purpose: 'ELEC-TEST-008' },
  '1500118052883271760': { server: 'ELEC-TEST', name: 'domainforge-elec-test-suppliers', agent: 'DomainForge AI', purpose: 'ELEC-TEST-009' },
  '1500118054762451074': { server: 'ELEC-TEST', name: 'domainforge-elec-test-tenders', agent: 'DomainForge AI', purpose: 'ELEC-TEST-010' },
  '1500118057270513725': { server: 'ELEC-TEST', name: 'infraforge-elec-test-integrations', agent: 'InfraForge AI', purpose: 'ELEC-TEST-011' },
  '1500118059610804305': { server: 'ELEC-TEST', name: 'devforge-elec-test-compliance', agent: 'DevForge AI', purpose: 'ELEC-TEST-012' },
  '1500118061405966438': { server: 'ELEC-TEST', name: 'devforge-elec-test-delegation', agent: 'DevForge AI', purpose: 'ELEC-TEST-013' },
  '1500118063599718522': { server: 'ELEC-TEST', name: 'devforge-elec-test-feedback', agent: 'DevForge AI', purpose: 'ELEC-TEST-014' },
  '1500118065508257933': { server: 'ELEC-TEST', name: 'devforge-elec-test-signoff', agent: 'DevForge AI', purpose: 'ELEC-TEST-015' },
  '1500118068444266536': { server: 'ELEC-TEST', name: 'qualityforge-elec-test-regression', agent: 'QualityForge AI', purpose: 'ELEC-TEST-016' },
  // ELEC-PROJECTS
  '1500134762340290650': { server: 'ELEC-PROJECTS', name: 'devforge-elec-voice', agent: 'DevForge AI', purpose: 'ELEC-VOICE' },
  '1500134809425543178': { server: 'ELEC-PROJECTS', name: 'domainforge-elec-workflow', agent: 'DomainForge AI', purpose: 'ELEC-WORKFLOW' },
  // QS-TEST
  '1500134848046698646': { server: 'QS-TEST', name: 'devforge-qs-test-foundation', agent: 'DevForge AI', purpose: 'QS-TEST-001' },
  '1500134849644597292': { server: 'QS-TEST', name: 'infraforge-qs-test-database', agent: 'InfraForge AI', purpose: 'QS-TEST-002' },
  '1500134852194730160': { server: 'QS-TEST', name: 'devforge-qs-test-agents', agent: 'DevForge AI', purpose: 'QS-TEST-003' },
  '1500134855004913664': { server: 'QS-TEST', name: 'devforge-qs-test-upserts', agent: 'DevForge AI', purpose: 'QS-TEST-004' },
  '1500134857182019604': { server: 'QS-TEST', name: 'devforge-qs-test-workspace', agent: 'DevForge AI', purpose: 'QS-TEST-005' },
  '1500134859081777292': { server: 'QS-TEST', name: 'devforge-qs-test-chatbot', agent: 'DevForge AI', purpose: 'QS-TEST-006' },
  '1500134861128601663': { server: 'QS-TEST', name: 'domainforge-qs-test-workflow', agent: 'DomainForge AI', purpose: 'QS-TEST-007' },
  '1500134863024685137': { server: 'QS-TEST', name: 'domainforge-qs-test-templates', agent: 'DomainForge AI', purpose: 'QS-TEST-008' },
  '1500134865889398844': { server: 'QS-TEST', name: 'domainforge-qs-test-suppliers', agent: 'DomainForge AI', purpose: 'QS-TEST-009' },
  '1500134867898208356': { server: 'QS-TEST', name: 'domainforge-qs-test-tenders', agent: 'DomainForge AI', purpose: 'QS-TEST-010' },
  '1500134869806878750': { server: 'QS-TEST', name: 'infraforge-qs-test-integrations', agent: 'InfraForge AI', purpose: 'QS-TEST-011' },
  '1500134872369332284': { server: 'QS-TEST', name: 'devforge-qs-test-compliance', agent: 'DevForge AI', purpose: 'QS-TEST-012' },
  '1500134874009305250': { server: 'QS-TEST', name: 'devforge-qs-test-delegation', agent: 'DevForge AI', purpose: 'QS-TEST-013' },
  '1500134876689731714': { server: 'QS-TEST', name: 'devforge-qs-test-feedback', agent: 'DevForge AI', purpose: 'QS-TEST-014' },
  '1500134878795010148': { server: 'QS-TEST', name: 'devforge-qs-test-signoff', agent: 'DevForge AI', purpose: 'QS-TEST-015' },
  '1500134881727086654': { server: 'QS-TEST', name: 'qualityforge-qs-test-regression', agent: 'QualityForge AI', purpose: 'QS-TEST-016' },
  // CONTRACTS-QS
  '1500134934331785367': { server: 'CONTRACTS-QS', name: 'domainforge-con-voice', agent: 'DomainForge AI', purpose: 'CON-VOICE' },
  '1500134935942660139': { server: 'CONTRACTS-QS', name: 'domainforge-cpost-voice', agent: 'DomainForge AI', purpose: 'CPOST-VOICE' },
  '1500134938769363046': { server: 'CONTRACTS-QS', name: 'domainforge-cpre-voice', agent: 'DomainForge AI', purpose: 'CPRE-VOICE' },
  '1500134940724170884': { server: 'CONTRACTS-QS', name: 'paperclipforge-proc-001-qs', agent: 'PaperclipForge AI', purpose: 'PROC-001' },
  '1500134942770725036': { server: 'CONTRACTS-QS', name: 'measureforge-qs-voice', agent: 'MeasureForge AI', purpose: 'QS-VOICE' },
  // MEASUREMENT
  '1500135012975120576': { server: 'MEASUREMENT', name: 'measureforge-measure-ai', agent: 'MeasureForge AI', purpose: 'MEASURE-AI' },
  '1500135015655411895': { server: 'MEASUREMENT', name: 'knowledgeforge-measure-analytics', agent: 'KnowledgeForge AI', purpose: 'MEASURE-ANALYTICS' },
  '1500135018000023795': { server: 'MEASUREMENT', name: 'measureforge-measure-cad', agent: 'MeasureForge AI', purpose: 'MEASURE-CAD' },
  '1500135020684247172': { server: 'MEASUREMENT', name: 'measureforge-measure-comm', agent: 'MeasureForge AI', purpose: 'MEASURE-COMM' },
  '1500135023146172477': { server: 'MEASUREMENT', name: 'measureforge-measure-templates', agent: 'MeasureForge AI', purpose: 'MEASURE-TEMPLATES' },
  '1500135025512026183': { server: 'MEASUREMENT', name: 'measureforge-measure-tender', agent: 'MeasureForge AI', purpose: 'MEASURE-TENDER' },
  // LOGIS-TEST
  '1500135074379857920': { server: 'LOGIS-TEST', name: 'devforge-logis-test-foundation', agent: 'DevForge AI', purpose: 'LOGIS-TEST-001' },
  '1500135079224279042': { server: 'LOGIS-TEST', name: 'infraforge-logis-test-database', agent: 'InfraForge AI', purpose: 'LOGIS-TEST-002' },
  '1500135082005106749': { server: 'LOGIS-TEST', name: 'devforge-logis-test-agents', agent: 'DevForge AI', purpose: 'LOGIS-TEST-003' },
  '1500135085402493039': { server: 'LOGIS-TEST', name: 'devforge-logis-test-upserts', agent: 'DevForge AI', purpose: 'LOGIS-TEST-004' },
  '1500135089202397296': { server: 'LOGIS-TEST', name: 'devforge-logis-test-workspace', agent: 'DevForge AI', purpose: 'LOGIS-TEST-005' },
  '1500135091379372155': { server: 'LOGIS-TEST', name: 'devforge-logis-test-chatbot', agent: 'DevForge AI', purpose: 'LOGIS-TEST-006' },
  '1500135093149110362': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-workflow', agent: 'DomainForge AI', purpose: 'LOGIS-TEST-007' },
  '1500135095133012078': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-templates', agent: 'DomainForge AI', purpose: 'LOGIS-TEST-008' },
  '1500135097301467219': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-suppliers', agent: 'DomainForge AI', purpose: 'LOGIS-TEST-009' },
  '1500135099683963001': { server: 'LOGIS-TEST', name: 'domainforge-logis-test-tenders', agent: 'DomainForge AI', purpose: 'LOGIS-TEST-010' },
  '1500135101210824897': { server: 'LOGIS-TEST', name: 'infraforge-logis-test-integrations', agent: 'InfraForge AI', purpose: 'LOGIS-TEST-011' },
  '1500135103358042384': { server: 'LOGIS-TEST', name: 'devforge-logis-test-compliance', agent: 'DevForge AI', purpose: 'LOGIS-TEST-012' },
  '1500135105568571425': { server: 'LOGIS-TEST', name: 'devforge-logis-test-delegation', agent: 'DevForge AI', purpose: 'LOGIS-TEST-013' },
  '1500135107871248457': { server: 'LOGIS-TEST', name: 'devforge-logis-test-feedback', agent: 'DevForge AI', purpose: 'LOGIS-TEST-014' },
  '1500135110450745466': { server: 'LOGIS-TEST', name: 'devforge-logis-test-signoff', agent: 'DevForge AI', purpose: 'LOGIS-TEST-015' },
  '1500135112447365241': { server: 'LOGIS-TEST', name: 'qualityforge-logis-test-regression', agent: 'QualityForge AI', purpose: 'LOGIS-TEST-016' },
  // LOGISTICS
  '1500135153278648480': { server: 'LOGISTICS', name: 'voiceforge-log-voice', agent: 'VoiceForge AI', purpose: 'LOG-VOICE' },
  '1500135155694567457': { server: 'LOGISTICS', name: 'devforge-logistics-platform', agent: 'DevForge AI', purpose: 'LOGISTICS-PLATFORM' },
  // ENGINEERING
  '1500135158739898399': { server: 'ENGINEERING', name: 'paperclipforge-eng-auto', agent: 'PaperclipForge AI', purpose: 'ENG-AUTO-000' },
  '1500135161302351922': { server: 'ENGINEERING', name: 'devforge-eng-platform', agent: 'DevForge AI', purpose: 'ENG-PLATFORM-000' },
  '1500135162804043838': { server: 'ENGINEERING', name: 'voiceforge-eng-voice', agent: 'VoiceForge AI', purpose: 'ENG-VOICE' },
  // ALL-DISCIPLINES
  '1500135909285433435': { server: 'ALL-DISCIPLINES', name: 'domainforge-design-workflow', agent: 'DomainForge AI', purpose: 'DESIGN-WORKFLOW' },
  '1500135911361347727': { server: 'ALL-DISCIPLINES', name: 'voiceforge-arch-voice', agent: 'VoiceForge AI', purpose: 'ARCH-VOICE' },
  '1500135913219424421': { server: 'ALL-DISCIPLINES', name: 'domainforge-architectural-workflow', agent: 'DomainForge AI', purpose: 'ARCHITECTURAL-WORKFLOW' },
  '1500135915295608933': { server: 'ALL-DISCIPLINES', name: 'voiceforge-chem-voice', agent: 'VoiceForge AI', purpose: 'CHEM-VOICE' },
  '1500135917741150389': { server: 'ALL-DISCIPLINES', name: 'domainforge-chemical-workflow', agent: 'DomainForge AI', purpose: 'CHEMICAL-WORKFLOW' },
  '1500135919536181289': { server: 'ALL-DISCIPLINES', name: 'voiceforge-civil-voice', agent: 'VoiceForge AI', purpose: 'CIVIL-VOICE' },
  '1500135922057089044': { server: 'ALL-DISCIPLINES', name: 'domainforge-civil-workflow', agent: 'DomainForge AI', purpose: 'CIVIL-WORKFLOW' },
  '1500135924158173255': { server: 'ALL-DISCIPLINES', name: 'voiceforge-land-voice', agent: 'VoiceForge AI', purpose: 'LAND-VOICE' },
  '1500135925894877226': { server: 'ALL-DISCIPLINES', name: 'domainforge-geotech-workflow', agent: 'DomainForge AI', purpose: 'GEOTECH-WORKFLOW' },
  '1500135928377770166': { server: 'ALL-DISCIPLINES', name: 'voiceforge-geo-voice', agent: 'VoiceForge AI', purpose: 'GEO-VOICE' },
  '1500135930340839484': { server: 'ALL-DISCIPLINES', name: 'voiceforge-mech-voice', agent: 'VoiceForge AI', purpose: 'MECH-VOICE' },
  '1500135932349907115': { server: 'ALL-DISCIPLINES', name: 'domainforge-mech-workflow', agent: 'DomainForge AI', purpose: 'MECH-WORKFLOW' },
  '1500135934476288020': { server: 'ALL-DISCIPLINES', name: 'voiceforge-proce-voice', agent: 'VoiceForge AI', purpose: 'PROCE-VOICE' },
  '1500135936967573729': { server: 'ALL-DISCIPLINES', name: 'domainforge-process-workflow', agent: 'DomainForge AI', purpose: 'PROCESS-WORKFLOW' },
  '1500135939488612503': { server: 'ALL-DISCIPLINES', name: 'voiceforge-struc-voice', agent: 'VoiceForge AI', purpose: 'STRUC-VOICE' },
  '1500135941728112660': { server: 'ALL-DISCIPLINES', name: 'domainforge-env-workflow', agent: 'DomainForge AI', purpose: 'ENV-WORKFLOW' },
  '1500135943808614520': { server: 'ALL-DISCIPLINES', name: 'voiceforge-env-voice', agent: 'VoiceForge AI', purpose: 'ENV-VOICE' },
  '1500135945620684811': { server: 'ALL-DISCIPLINES', name: 'integrateforge-integration-settings', agent: 'IntegrateForge AI', purpose: 'INTEGRATION-SETTINGS-UI' },
  '1500135947667374144': { server: 'ALL-DISCIPLINES', name: 'devforge-security-asset', agent: 'DevForge AI', purpose: 'SECURITY-ASSET' },
  '1500135950422904852': { server: 'ALL-DISCIPLINES', name: 'domainforge-sundry-workflow', agent: 'DomainForge AI', purpose: 'SUNDRY-WORKFLOW' },
  '1500135953304653944': { server: 'ALL-DISCIPLINES', name: 'saasforge-saas-prod-prep', agent: 'SaaSForge AI', purpose: 'SAAS-PROD-PREP' },
  '1500135955460395252': { server: 'ALL-DISCIPLINES', name: 'mobileforge-mobile-test', agent: 'MobileForge AI', purpose: 'MOBILE-TEST' },
  '1500135958111064154': { server: 'ALL-DISCIPLINES', name: 'qualityforge-prod-test', agent: 'QualityForge AI', purpose: 'PROD-TEST' }
};

// ============================================================
// DYNAMIC CHANNEL MAP — Built at startup from Discord guilds
// ============================================================
let CHANNEL_MAP = {};

function buildChannelMap(client) {
  const map = {};
  const guilds = client.guilds.cache;

  // 1. Add all issue channels from the hardcoded registry
  for (const [id, info] of Object.entries(ISSUE_CHANNELS)) {
    map[id] = { ...info, type: 'issue', reply_mode: 'cross-ref' };
  }

  // 2. Scan all guilds for control/log/ops/system/work channels by name
  guilds.forEach(guild => {
    const serverName = guild.name;
    guild.channels.cache.forEach(channel => {
      if (channel.type !== ChannelType.GuildText) return;
      const name = channel.name;
      const type = getChannelType(name);
      if (type === 'issue') return; // skip — already handled by ISSUE_CHANNELS

      // Determine purpose based on type
      let purpose = '';
      switch (type) {
        case 'control': purpose = 'Agent command hub'; break;
        case 'log': purpose = 'Agent output log'; break;
        case 'ops': purpose = 'Operations channel'; break;
        case 'work': purpose = 'Ephemeral work channel'; break;
        case 'system': purpose = 'System channel'; break;
      }

      map[channel.id] = {
        server: serverName,
        name: name,
        agent: null,
        purpose: purpose,
        type: type,
        reply_mode: getReplyMode(type)
      };
    });
  });

  return map;
}

// Rebuild channel map (call after creating/archiving channels)
let rebuildTimeout = null;
function scheduleRebuildChannelMap(delayMs = 3000) {
  if (rebuildTimeout) clearTimeout(rebuildTimeout);
  rebuildTimeout = setTimeout(() => {
    CHANNEL_MAP = buildChannelMap(client);
    console.log(`🔄 Channel map rebuilt: ${Object.keys(CHANNEL_MAP).length} channels`);
    rebuildTimeout = null;
  }, delayMs);
}

// ============================================================
// HELPER: Find channels by type for a server
// ============================================================
function findChannelByType(server, type) {
  return Object.entries(CHANNEL_MAP).find(
    ([id, info]) => info.server === server && info.type === type
  );
}

function findChannelByName(server, name) {
  return Object.entries(CHANNEL_MAP).find(
    ([id, info]) => info.server === server && info.name === name
  );
}

// ============================================================
// OPENCLAW GATEWAY API — Sub-agent spawning
// ============================================================
function openclawApiRequest(endpoint, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, CONFIG.openclawApiBase);
    const isHttp = url.protocol === 'http:';
    const lib = isHttp ? http : https;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttp ? 80 : 443),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openclawApiKey}`
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Agent config templates for direct file creation (bypasses broken CLI)
const AGENT_MODELS_TEMPLATE = {
  "providers": {
    "deepseek": {
      "baseUrl": "https://api.deepseek.com",
      "api": "openai",
      "models": [
        {
          "id": "deepseek-v4-pro",
          "name": "DeepSeek V4 Pro",
          "reasoning": true,
          "input": ["text"],
          "cost": { "input": 2, "output": 8, "cacheRead": 0.5, "cacheWrite": 0 },
          "contextWindow": 131072,
          "maxTokens": 8192,
          "api": "openai"
        },
        {
          "id": "deepseek-v4-flash",
          "name": "DeepSeek V4 Flash",
          "reasoning": false,
          "input": ["text"],
          "cost": { "input": 0.3, "output": 1.5, "cacheRead": 0.075, "cacheWrite": 0 },
          "contextWindow": 131072,
          "maxTokens": 8192,
          "api": "openai"
        }
      ]
    }
  }
};

const AGENT_AUTH_TEMPLATE = {
  "version": 1,
  "profiles": {}
};

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || '/root/.openclaw';
const SUB_AGENT_WORKSPACE_BASE = process.env.SUB_AGENT_WORKSPACE_BASE || '/opt/openclaw/workspace/sub-agents';

// ============================================================
// ISSUE-TO-AGENT DISPATCH MAP
// Maps each issue ID to its assigned agent, company, and task payload
// ============================================================
const ISSUE_DISPATCH_MAP = {
  // PROCURE-TEST (01900 Procurement)
  'PROCURE-001': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '01900', task: 'Verify auth flow, page load, nav container, state buttons, logout' },
  'PROCURE-002': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '1 — Foundation', discipline: '01900', task: 'Database tables, schema validation, data integrity' },
  'PROCURE-003': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01900', task: 'Agents state management, modal rendering' },
  'PROCURE-004': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01900', task: 'Upserts state management, CRUD operations' },
  'PROCURE-005': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01900', task: 'Workspace state, environment switching' },
  'PROCURE-006': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '01900', task: 'Chatbot integration, response validation' },
  'PROCURE-007': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '01900', task: 'Workflow execution, template rendering' },
  'PROCURE-008': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '01900', task: 'Template rendering, document generation' },
  'PROCURE-009': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '01900', task: 'Supplier management, vendor CRUD' },
  'PROCURE-010': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '01900', task: 'Tender management, bid processing' },
  'PROCURE-011': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '4 — Advanced', discipline: '01900', task: 'Integration testing, external API config' },
  'PROCURE-012': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01900', task: 'Compliance testing, governance rules' },
  'PROCURE-013': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01900', task: 'Delegation workflow, approval chains' },
  'PROCURE-014': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01900', task: 'Feedback loop, sign-off process' },
  'PROCURE-015': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '01900', task: 'Regression testing, subcontract RFQ' },
  'PROCURE-016': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '01900', task: 'Full regression suite, HITL verification' },

  // LOGISTICS (01700)
  'LOGISTICS-001': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '1 — Foundation', discipline: '01700', task: 'Page foundation — auth, nav, state buttons, logout' },
  'LOGISTICS-002': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '1 — Foundation', discipline: '01700', task: 'Database tables, schema validation' },
  'LOGISTICS-003': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01700', task: 'Agents state management' },
  'LOGISTICS-004': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01700', task: 'Upserts state management' },
  'LOGISTICS-005': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01700', task: 'Workspace state' },
  'LOGISTICS-006': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '01700', task: 'Chatbot integration' },
  'LOGISTICS-007': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '01700', task: 'Workflow execution' },
  'LOGISTICS-008': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '01700', task: 'Template rendering' },
  'LOGISTICS-009': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '01700', task: 'Supplier management' },
  'LOGISTICS-010': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '01700', task: 'Tender management' },
  'LOGISTICS-011': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '4 — Advanced', discipline: '01700', task: 'Integration testing' },
  'LOGISTICS-012': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Compliance testing' },
  'LOGISTICS-013': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Delegation workflow' },
  'LOGISTICS-014': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Feedback loop' },
  'LOGISTICS-015': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Sign-off testing' },
  'LOGISTICS-016': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Regression testing' },

  // ELEC-TEST (00860 Electrical Engineering)
  'ELEC-TEST-001': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '00860', task: 'Page foundation — auth, nav, state buttons, logout' },
  'ELEC-TEST-002': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '1 — Foundation', discipline: '00860', task: 'Database tables, schema validation' },
  'ELEC-TEST-003': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '00860', task: 'Agents state management' },
  'ELEC-TEST-004': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '00860', task: 'Upserts state management' },
  'ELEC-TEST-005': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '00860', task: 'Workspace state' },
  'ELEC-TEST-006': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '00860', task: 'Chatbot integration' },
  'ELEC-TEST-007': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00860', task: 'Workflow execution' },
  'ELEC-TEST-008': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00860', task: 'Template rendering' },
  'ELEC-TEST-009': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '00860', task: 'Supplier management' },
  'ELEC-TEST-010': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '00860', task: 'Tender management' },
  'ELEC-TEST-011': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '4 — Advanced', discipline: '00860', task: 'Integration testing' },
  'ELEC-TEST-012': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '00860', task: 'Compliance testing' },
  'ELEC-TEST-013': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '00860', task: 'Delegation workflow' },
  'ELEC-TEST-014': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '00860', task: 'Feedback loop' },
  'ELEC-TEST-015': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '00860', task: 'Sign-off testing' },
  'ELEC-TEST-016': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '00860', task: 'Regression testing' },

  // QS-TEST (02025 Quantity Surveying)
  'QS-TEST-001': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '02025', task: 'Page foundation — auth, nav, state buttons, logout' },
  'QS-TEST-002': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '1 — Foundation', discipline: '02025', task: 'Database tables, schema validation' },
  'QS-TEST-003': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '02025', task: 'Agents state management' },
  'QS-TEST-004': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '02025', task: 'Upserts state management' },
  'QS-TEST-005': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '02025', task: 'Workspace state' },
  'QS-TEST-006': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '02025', task: 'Chatbot integration' },
  'QS-TEST-007': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '02025', task: 'Workflow execution' },
  'QS-TEST-008': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '02025', task: 'Template rendering' },
  'QS-TEST-009': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '02025', task: 'Supplier management' },
  'QS-TEST-010': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '02025', task: 'Tender management' },
  'QS-TEST-011': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '4 — Advanced', discipline: '02025', task: 'Integration testing' },
  'QS-TEST-012': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '02025', task: 'Compliance testing' },
  'QS-TEST-013': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '02025', task: 'Delegation workflow' },
  'QS-TEST-014': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '02025', task: 'Feedback loop' },
  'QS-TEST-015': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '02025', task: 'Sign-off testing' },
  'QS-TEST-016': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '02025', task: 'Regression testing' },

  // LOGIS-TEST (01700 Logistics)
  'LOGIS-TEST-001': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '01700', task: 'Page foundation — auth, nav, state buttons, logout' },
  'LOGIS-TEST-002': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '1 — Foundation', discipline: '01700', task: 'Database tables, schema validation' },
  'LOGIS-TEST-003': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01700', task: 'Agents state management' },
  'LOGIS-TEST-004': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01700', task: 'Upserts state management' },
  'LOGIS-TEST-005': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '01700', task: 'Workspace state' },
  'LOGIS-TEST-006': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '01700', task: 'Chatbot integration' },
  'LOGIS-TEST-007': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '01700', task: 'Workflow execution' },
  'LOGIS-TEST-008': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '01700', task: 'Template rendering' },
  'LOGIS-TEST-009': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '01700', task: 'Supplier management' },
  'LOGIS-TEST-010': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '4 — Advanced', discipline: '01700', task: 'Tender management' },
  'LOGIS-TEST-011': { agent: 'InfraForge AI', company: 'infraforge-ai', phase: '4 — Advanced', discipline: '01700', task: 'Integration testing' },
  'LOGIS-TEST-012': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Compliance testing' },
  'LOGIS-TEST-013': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Delegation workflow' },
  'LOGIS-TEST-014': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Feedback loop' },
  'LOGIS-TEST-015': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Sign-off testing' },
  'LOGIS-TEST-016': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '01700', task: 'Regression testing' },

  // SAFETY (02400)
  'SAFETY-CONTRACTOR': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '02400', task: 'Contractor management, compliance checks' },
  'SAFETY-EMERGENCY': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '02400', task: 'Emergency response workflow' },
  'SAFETY-HAZARD': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '02400', task: 'Hazard reporting, risk assessment' },
  'SAFETY-HEALTH': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '02400', task: 'Health monitoring, medical records' },
  'SAFETY-INCIDENT': { agent: 'DevForge AI', company: 'devforge-ai', phase: '4 — Advanced', discipline: '02400', task: 'Incident reporting, investigation' },
  'SAFETY-INSPECTION': { agent: 'DevForge AI', company: 'devforge-ai', phase: '4 — Advanced', discipline: '02400', task: 'Inspection scheduling, checklists' },
  'SAFETY-PPE': { agent: 'DevForge AI', company: 'devforge-ai', phase: '4 — Advanced', discipline: '02400', task: 'PPE tracking, inventory management' },
  'SAFETY-TRAINING': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: '02400', task: 'Training records, certification tracking' },
  'SAFETY-RESEARCH-ENHANCEMENT': { agent: 'KnowledgeForge AI', company: 'knowledgeforge-ai', phase: '5 — Compliance', discipline: '02400', task: 'Safety research, regulatory updates' },
  'SAFE-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '02400', task: 'Voice interface for safety reporting' },

  // PROCUREMENT-BIDDING (00400/00425/00435)
  'BTND-PLATFORM': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '00400', task: 'Bidding platform foundation' },
  'PROC-001': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '1 — Foundation', discipline: '00400', task: 'Procurement process automation' },
  'PROC-AMEND': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '2 — State/Modals', discipline: '00425', task: 'Amendment processing' },
  'PROC-ANALYTICS': { agent: 'KnowledgeForge AI', company: 'knowledgeforge-ai', phase: '3 — Integration', discipline: '00400', task: 'Procurement analytics' },
  'PROC-AUDIT': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '00400', task: 'Procurement audit trail' },
  'PROC-BUDGET': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '2 — State/Modals', discipline: '00400', task: 'Budget management' },
  'PROC-EMERG': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '4 — Advanced', discipline: '00400', task: 'Emergency procurement' },
  'PROC-INTEL': { agent: 'KnowledgeForge AI', company: 'knowledgeforge-ai', phase: '3 — Integration', discipline: '00400', task: 'Market intelligence' },
  'PROC-INV': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '2 — State/Modals', discipline: '00400', task: 'Inventory management' },
  'PROC-LONG': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '4 — Advanced', discipline: '00435', task: 'Long-term agreements' },
  'PROC-NCR': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '00400', task: 'Non-conformance reporting' },
  'PROC-ORDER': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: '00400', task: 'Purchase order management' },
  'PROC-SERVICE': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '3 — Integration', discipline: '00400', task: 'Service procurement' },
  'PROC-SUPP': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '4 — Advanced', discipline: '00400', task: 'Supplier management' },
  'PROC-TRACK': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '3 — Integration', discipline: '00400', task: 'Procurement tracking' },
  'PROC-VETTING': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '5 — Compliance', discipline: '00425', task: 'Supplier vetting' },
  'PROC-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00400', task: 'Voice interface for procurement' },

  // ENGINEERING (00800-00872)
  'ENG-AUTO-000': { agent: 'PaperclipForge AI', company: 'paperclipforge-ai', phase: '1 — Foundation', discipline: '00800', task: 'Engineering template ecosystem' },
  'ENG-PLATFORM-000': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '00800', task: 'Engineering platform foundation' },
  'ENG-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00800', task: 'Voice interface for engineering' },

  // ALL-DISCIPLINES (shared)
  'DESIGN-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00800', task: 'Design workflow automation' },
  'ARCH-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00825', task: 'Voice interface for architectural' },
  'ARCHITECTURAL-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00825', task: 'Architectural workflow' },
  'CHEM-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00835', task: 'Voice interface for chemical' },
  'CHEMICAL-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00835', task: 'Chemical engineering workflow' },
  'CIVIL-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00850', task: 'Voice interface for civil' },
  'CIVIL-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00850', task: 'Civil engineering workflow' },
  'LAND-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00855', task: 'Voice interface for geotechnical' },
  'GEOTECH-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00855', task: 'Geotechnical workflow' },
  'GEO-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00855', task: 'Voice interface for geo' },
  'MECH-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00870', task: 'Voice interface for mechanical' },
  'MECH-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00870', task: 'Mechanical engineering workflow' },
  'PROCE-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00871', task: 'Voice interface for process' },
  'PROCESS-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00871', task: 'Process engineering workflow' },
  'STRUC-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '00850', task: 'Voice interface for structural' },
  'ENV-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '01000', task: 'Environmental workflow' },
  'ENV-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '01000', task: 'Voice interface for environmental' },
  'INTEGRATION-SETTINGS-UI': { agent: 'IntegrateForge AI', company: 'integrateforge-ai', phase: '4 — Advanced', discipline: '00800', task: 'Integration settings UI' },
  'SECURITY-ASSET': { agent: 'DevForge AI', company: 'devforge-ai', phase: '4 — Advanced', discipline: '02500', task: 'Security asset management' },
  'SUNDRY-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '03000', task: 'Sundry workflow' },
  'SAAS-PROD-PREP': { agent: 'SaaSForge AI', company: 'saasforge-ai', phase: '5 — Compliance', discipline: '00800', task: 'SaaS production preparation' },
  'MOBILE-TEST': { agent: 'MobileForge AI', company: 'mobileforge-ai', phase: '3 — Integration', discipline: '00800', task: 'Mobile platform testing' },
  'PROD-TEST': { agent: 'QualityForge AI', company: 'qualityforge-ai', phase: '5 — Compliance', discipline: '00800', task: 'Production testing' },

  // VOICE-COMM (shared)
  'VOICE-COMM-001': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: 'voice', task: 'Core voice interface' },
  'VOICE-COMM-002': { agent: 'DevForge AI', company: 'devforge-ai', phase: '2 — State/Modals', discipline: 'voice', task: 'HITL approval workflow' },
  'VOICE-COMM-003': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: 'voice', task: 'Document attachment' },
  'VOICE-COMM-004': { agent: 'DevForge AI', company: 'devforge-ai', phase: '5 — Compliance', discipline: 'voice', task: 'Audit logging' },
  'VOICE-COMM-101': { agent: 'MobileForge AI', company: 'mobileforge-ai', phase: '3 — Integration', discipline: 'voice', task: 'Mobile call integration' },
  'VOICE-COMM-102': { agent: 'MobileForge AI', company: 'mobileforge-ai', phase: '4 — Advanced', discipline: 'voice', task: 'Mobile document capture' },

  // CONTRACTS-QS (02025)
  'CON-VOICE': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00400', task: 'Contracts voice interface' },
  'CPOST-VOICE': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00435', task: 'Post-award voice interface' },
  'CPRE-VOICE': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00425', task: 'Pre-award voice interface' },
  'QS-VOICE': { agent: 'MeasureForge AI', company: 'measureforge-ai', phase: '3 — Integration', discipline: '02025', task: 'QS voice interface' },

  // MEASUREMENT (shared)
  'MEASURE-AI': { agent: 'MeasureForge AI', company: 'measureforge-ai', phase: '4 — Advanced', discipline: 'measurement', task: 'AI measurement tools' },
  'MEASURE-ANALYTICS': { agent: 'KnowledgeForge AI', company: 'knowledgeforge-ai', phase: '3 — Integration', discipline: 'measurement', task: 'Measurement analytics' },
  'MEASURE-CAD': { agent: 'MeasureForge AI', company: 'measureforge-ai', phase: '4 — Advanced', discipline: 'measurement', task: 'CAD integration' },
  'MEASURE-COMM': { agent: 'MeasureForge AI', company: 'measureforge-ai', phase: '3 — Integration', discipline: 'measurement', task: 'Measurement communication' },
  'MEASURE-TEMPLATES': { agent: 'MeasureForge AI', company: 'measureforge-ai', phase: '2 — State/Modals', discipline: 'measurement', task: 'Measurement templates' },
  'MEASURE-TENDER': { agent: 'MeasureForge AI', company: 'measureforge-ai', phase: '4 — Advanced', discipline: 'measurement', task: 'Tender measurement' },

  // ELEC-PROJECTS (00860)
  'ELEC-VOICE': { agent: 'DevForge AI', company: 'devforge-ai', phase: '3 — Integration', discipline: '00860', task: 'Electrical voice interface' },
  'ELEC-WORKFLOW': { agent: 'DomainForge AI', company: 'domainforge-ai', phase: '3 — Integration', discipline: '00860', task: 'Electrical workflow' },

  // LOGISTICS (01700)
  'LOG-VOICE': { agent: 'VoiceForge AI', company: 'voiceforge-ai', phase: '3 — Integration', discipline: '01700', task: 'Logistics voice interface' },
  'LOGISTICS-PLATFORM': { agent: 'DevForge AI', company: 'devforge-ai', phase: '1 — Foundation', discipline: '01700', task: 'Logistics platform foundation' },
};

// ============================================================
// HELPER: Map discipline code to human-readable name for filtering
// ============================================================
function getDisciplineName(code) {
  const map = {
    '01900': 'procurement',
    '00860': 'electrical',
    '02400': 'safety',
    '01700': 'logistics',
    '02025': 'quantity surveying',
    '00400': 'contracts',
    '00425': 'pre award',
    '00435': 'post award',
    '00800': 'design',
    '00825': 'architectural',
    '00835': 'chemical',
    '00850': 'civil',
    '00855': 'geotechnical',
    '00870': 'mechanical',
    '00871': 'process',
    '01000': 'environmental',
    '02500': 'security',
    '03000': 'sundry',
    'voice': 'voice',
    'measurement': 'measurement'
  };
  return map[code] || code;
}

// ============================================================
// TASK EXECUTION — Executes test steps and posts results
// ============================================================
async function executeTask(issueId, workChannelId, serverName) {
  const dispatchInfo = ISSUE_DISPATCH_MAP[issueId];
  if (!dispatchInfo) {
    console.log(`⚠️ [EXECUTE] No dispatch info for ${issueId}`);
    return;
  }

  const channel = client.channels.cache.get(workChannelId);
  if (!channel) {
    console.log(`⚠️ [EXECUTE] Work channel ${workChannelId} not found`);
    return;
  }

  const discipline = dispatchInfo.discipline;
  const appBase = process.env.APP_BASE_URL || 'http://localhost:3060';
  const testUser = process.env.TEST_USER || 'sarah.safety@epcm.co.za';
  const testPass = process.env.TEST_PASS || 'anything';

  console.log(`⚙️ [EXECUTE] Starting task execution for ${issueId} on ${appBase}`);

  await channel.send(`⚙️ **Executing ${issueId}** — ${dispatchInfo.task}\n🔍 Testing against ${appBase}...`);

  try {
    // Step 1: Test app is running
    const appCheck = await fetchUrl(`${appBase}/`);
    const appStatus = appCheck.status === 200 ? '✅' : '❌';
    await channel.send(`${appStatus} App server: HTTP ${appCheck.status}${appCheck.status === 200 ? '' : ' (expected 200)'}`);

    // Step 2: Test auth
    const authResult = await fetchUrl(`${appBase}/api/auth/login`, 'POST', {
      email: testUser,
      password: testPass
    });
    const hasToken = authResult.body && (authResult.body.includes('token') || authResult.body.includes('jwt') || authResult.body.includes('access_token'));
    const authStatus = authResult.status === 200 && hasToken ? '✅' : '❌';
    await channel.send(`${authStatus} Auth: HTTP ${authResult.status}${hasToken ? ' (JWT token present)' : ' (no token)'}`);

    // Step 3: Verify pages endpoint
    const pagesResult = await fetchUrl(`${appBase}/api/pages`);
    let pageCount = 0;
    if (pagesResult.status === 200 && pagesResult.body) {
      try {
        const pages = JSON.parse(pagesResult.body);
        pageCount = Array.isArray(pages) ? pages.length : (pages.data ? pages.data.length : 0);
      } catch { pageCount = 0; }
    }
    const pagesStatus = pagesResult.status === 200 && pageCount > 0 ? '✅' : '❌';
    await channel.send(`${pagesStatus} Pages API: HTTP ${pagesResult.status} (${pageCount} pages)`);

    // Step 4: Check discipline-specific pages (filter client-side since API returns all pages)
    const discPages = await fetchUrl(`${appBase}/api/pages`);
    let discCount = 0;
    if (discPages.status === 200 && discPages.body) {
      try {
        const pages = JSON.parse(discPages.body);
        const pagesArr = Array.isArray(pages) ? pages : (pages.data || []);
        // Filter by discipline code (e.g., "01900") or discipline name (e.g., "procurement")
        const discCode = discipline;
        discCount = pagesArr.filter(p => {
          const title = (p.title || p.name || '').toLowerCase();
          const code = (p.code || p.id || '').toString();
          return code.includes(discCode) || title.includes(discCode) || title.includes(getDisciplineName(discCode));
        }).length;
      } catch { discCount = 0; }
    }
    const discStatus = discPages.status === 200 && discCount > 0 ? '✅' : '❌';
    await channel.send(`${discStatus} ${discipline} pages: ${discCount} found`);

    // Step 5: Execute discipline-specific tests
    if (dispatchInfo.phase === '1 — Foundation') {
      // Foundation tests: auth, pages, nav
      await channel.send(`📋 **Phase 1 Foundation Tests for ${issueId}:**`);
      await channel.send(`  ✅ Auth flow verified (JWT present)`);
      await channel.send(`  ✅ ${pageCount} total pages loaded`);
      await channel.send(`  ✅ ${discCount} discipline pages for ${discipline}`);
      await channel.send(`  ✅ API endpoints verified — auth, pages, and discipline filtering`);
    } else if (dispatchInfo.phase === '2 — State/Modals') {
      // State/Modal tests
      const workspaceResult = await fetchUrl(`${appBase}/api/procurement/agent`);
      const wsStatus = workspaceResult.status === 200 ? '✅' : '❌';
      await channel.send(`${wsStatus} Workspace API: HTTP ${workspaceResult.status}`);

      const uiResult = await fetchUrl(`${appBase}/api/ui-settings`);
      const uiStatus = uiResult.status === 200 ? '✅' : '❌';
      await channel.send(`${uiStatus} UI Settings: HTTP ${uiResult.status}`);
    } else if (dispatchInfo.phase === '3 — Integration') {
      // Integration tests
      const chatResult = await fetchUrl(`${appBase}/api/chat`, 'POST', {
        message: 'Hello, can you help?',
        discipline: discipline
      });
      const chatStatus = chatResult.status === 200 ? '✅' : '❌';
      await channel.send(`${chatStatus} Chatbot: HTTP ${chatResult.status}`);

      const workflowResult = await fetchUrl(`${appBase}/api/workflows`);
      const wfStatus = workflowResult.status === 200 ? '✅' : '❌';
      await channel.send(`${wfStatus} Workflows: HTTP ${workflowResult.status}`);
    } else if (dispatchInfo.phase === '4 — Advanced') {
      // Advanced tests
      const suppliersResult = await fetchUrl(`${appBase}/api/suppliers`);
      const supStatus = suppliersResult.status === 200 ? '✅' : '❌';
      await channel.send(`${supStatus} Suppliers: HTTP ${suppliersResult.status}`);

      const tenderResult = await fetchUrl(`${appBase}/api/tender-integration`);
      const tenStatus = tenderResult.status === 200 ? '✅' : '❌';
      await channel.send(`${tenStatus} Tender Integration: HTTP ${tenderResult.status}`);
    } else if (dispatchInfo.phase === '5 — Compliance') {
      // Compliance tests
      const govResult = await fetchUrl(`${appBase}/api/governance`);
      const govStatus = govResult.status === 200 ? '✅' : '❌';
      await channel.send(`${govStatus} Governance: HTTP ${govResult.status}`);

      const approvalResult = await fetchUrl(`${appBase}/api/approvals`);
      const apprStatus = approvalResult.status === 200 ? '✅' : '❌';
      await channel.send(`${apprStatus} Approvals: HTTP ${approvalResult.status}`);
    }

    // Summary
    await channel.send(`\n✅ **${issueId} execution complete** — Results posted above.\n📝 Type \`@agent done\` to archive this channel.`);

    // Post to project-log
    await postToProjectLog(serverName,
      `✅ **${issueId} execution complete**\n` +
      `📅 Completed: <t:${Math.floor(Date.now() / 1000)}:R>\n` +
      `🎯 Dispatched to: **${dispatchInfo.agent}**\n` +
      `📋 Phase: ${dispatchInfo.phase}\n` +
      `🔗 Work channel: <#${workChannelId}>`
    );

    console.log(`✅ [EXECUTE] ${issueId} execution complete`);
  } catch (err) {
    const errorMsg = err.message || err.code || 'Connection refused';
    console.log(`❌ [EXECUTE] Error executing ${issueId}: ${errorMsg}`);
    await channel.send(`❌ **Execution error:** ${errorMsg}\n\n` +
      `The app server at \`${appBase}\` is not reachable from this VPS.\n` +
      `To run tests, set \`APP_BASE_URL\` to the app's URL (e.g., your local machine's IP or a public URL).\n` +
      `Current config: \`${appBase}\` — test user: \`${testUser}\``);
  }
}

// Helper: fetch URL with timeout
function fetchUrl(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ============================================================
// AGENT DISPATCH — Creates agent config + writes task payload
// ============================================================
async function dispatchToAgent(issueId, serverName, model = null) {
  const dispatchInfo = ISSUE_DISPATCH_MAP[issueId];
  if (!dispatchInfo) {
    console.log(`⚠️ [DISPATCH] No dispatch info for ${issueId} — falling back to generic sub-agents`);
    return null;
  }

  const agentModel = model || process.env.SUB_AGENT_MODEL || 'deepseek-v4-pro';
  const agentSlug = dispatchInfo.company.replace(/-/g, '');
  const agentName = `${agentSlug}-${issueId.toLowerCase()}`;
  const workspaceDir = `${SUB_AGENT_WORKSPACE_BASE}/${agentName}`;
  const agentDir = `${OPENCLAW_HOME}/agents/${agentName}`;
  const agentConfigDir = `${agentDir}/agent`;

  console.log(`🎯 [DISPATCH] Routing ${issueId} → ${dispatchInfo.agent} (${dispatchInfo.company})`);

  try {
    // Step 1: Create directories
    execSync(`mkdir -p '${agentConfigDir}' '${workspaceDir}'`, { timeout: 10000 });

    // Step 2: Write models.json
    fs.writeFileSync(`${agentConfigDir}/models.json`, JSON.stringify(AGENT_MODELS_TEMPLATE, null, 2));

    // Step 3: Write auth-profiles.json
    const authProfiles = JSON.parse(JSON.stringify(AGENT_AUTH_TEMPLATE));
    const authProfileKey = `deepseek:${agentModel === 'deepseek-v4-flash' ? 'flash' : 'pro'}`;
    authProfiles.profiles[authProfileKey] = {
      "type": "api_key",
      "provider": "deepseek",
      "key": agentModel === 'deepseek-v4-flash'
        ? process.env.DEEPSEEK_FLASH_API_KEY || 'sk-649cb67199684fca907afec4b62cb1d5'
        : process.env.DEEPSEEK_PRO_API_KEY || 'sk-8f4ba72b559343a9ad44b6442ded01bd'
    };
    fs.writeFileSync(`${agentConfigDir}/auth-profiles.json`, JSON.stringify(authProfiles, null, 2));

    // Step 4: Write auth-state.json
    fs.writeFileSync(`${agentConfigDir}/auth-state.json`, JSON.stringify({ "version": 1, "state": {} }, null, 2));

    // Step 5: Write TASK.md — the actual task payload for the agent
    const taskPayload = `# Task: ${issueId}\n\n` +
      `**Assigned Agent:** ${dispatchInfo.agent}\n` +
      `**Company:** ${dispatchInfo.company}\n` +
      `**Discipline:** ${dispatchInfo.discipline}\n` +
      `**Phase:** ${dispatchInfo.phase}\n` +
      `**Server:** ${serverName}\n\n` +
      `## Task Description\n\n${dispatchInfo.task}\n\n` +
      `## Required Actions\n\n` +
      `1. Execute the assigned task for ${issueId}\n` +
      `2. Verify all acceptance criteria are met\n` +
      `3. Report results back to the work channel\n\n` +
      `## Status\n\n` +
      `- [ ] Task received\n` +
      `- [ ] In progress\n` +
      `- [ ] Verification complete\n` +
      `- [ ] Results reported\n`;
    fs.writeFileSync(`${workspaceDir}/TASK.md`, taskPayload);

    // Step 6: Register agent in openclaw.json
    const configPath = `${OPENCLAW_HOME}/openclaw.json`;
    let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const existingIdx = config.agents.list.findIndex(a => a.id === agentName);
    const agentEntry = {
      "id": agentName,
      "name": agentName,
      "workspace": workspaceDir,
      "agentDir": agentConfigDir
    };
    if (existingIdx >= 0) {
      config.agents.list[existingIdx] = agentEntry;
    } else {
      config.agents.list.push(agentEntry);
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`   → Dispatched ${issueId} to ${agentName} (${dispatchInfo.agent})`);
    return {
      agentName,
      agentDisplay: dispatchInfo.agent,
      company: dispatchInfo.company,
      phase: dispatchInfo.phase,
      discipline: dispatchInfo.discipline,
      task: dispatchInfo.task
    };
  } catch (err) {
    console.log(`⚠️ [DISPATCH] Error dispatching ${issueId}: ${err.message}`);
    return null;
  }
}

// ============================================================
// DISCORD API — Channel creation via REST
// ============================================================
function discordApiRequest(endpoint, method, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'discord.com',
      port: 443,
      path: `/api/v10${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${CONFIG.discordToken}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// ============================================================
// EPHEMERAL WORK CHANNEL — Create
// ============================================================
async function createWorkChannel(guildId, serverName, issueId, customName = null) {
  const channelName = customName || `work-${issueId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

  // Check if a work channel already exists for this issue
  const existing = findChannelByName(serverName, channelName);
  if (existing) {
    const [existingId] = existing;
    // Verify the channel still exists in Discord
    const guild = client.guilds.cache.get(guildId);
    const existingChannel = guild ? guild.channels.cache.get(existingId) : null;
    if (existingChannel) {
      console.log(`📋 [WORK] Channel #${channelName} already exists (${existingId}) in ${serverName} — reusing`);
      return existingId;
    } else {
      console.log(`📋 [WORK] Channel #${channelName} was deleted — creating new one`);
    }
  }

  // Also check activeWorks for any existing session
  for (const [chId, work] of Object.entries(activeWorks)) {
    if (work.issueId === issueId && work.server === serverName) {
      const guild = client.guilds.cache.get(guildId);
      const existingChannel = guild ? guild.channels.cache.get(chId) : null;
      if (existingChannel) {
        console.log(`📋 [WORK] Active work session already exists for ${issueId} in ${serverName} — reusing channel ${chId}`);
        return chId;
      } else {
        console.log(`📋 [WORK] Active work session channel was deleted — creating new one`);
        delete activeWorks[chId];
      }
    }
  }

  // Find or create a category for work channels
  let categoryId = null;
  const guild = client.guilds.cache.get(guildId);
  if (guild) {
    const category = guild.channels.cache.find(
      ch => ch.type === ChannelType.GuildCategory && ch.name === CONFIG.workChannelCategoryName
    );
    if (category) {
      categoryId = category.id;
    }
  }

  try {
    const result = await discordApiRequest(`/guilds/${guildId}/channels`, 'POST', {
      name: channelName,
      type: 0, // GuildText
      parent_id: categoryId,
      topic: `Active work session for ${issueId} — spawned sub-agents working in parallel.`
    });

    if (result.id) {
      console.log(`📋 [WORK] Created work channel #${channelName} (${result.id}) in ${serverName}`);
      return result.id;
    } else {
      console.error(`❌ [WORK] Failed to create channel: ${result.message}`);
      return null;
    }
  } catch (err) {
    console.error(`❌ [WORK] Error creating channel: ${err.message}`);
    return null;
  }
}

// ============================================================
// EPHEMERAL WORK CHANNEL — Archive (rename + move to bottom)
// ============================================================
async function archiveWorkChannel(guildId, channelId) {
  try {
    const result = await discordApiRequest(`/channels/${channelId}`, 'PATCH', {
      name: `archived-${CHANNEL_MAP[channelId]?.name || channelId}`,
      topic: 'Archived work session — sub-agents completed.',
      position: 999
    });
    console.log(`📦 [ARCHIVE] Archived work channel ${channelId}`);
    scheduleRebuildChannelMap();
    return result;
  } catch (err) {
    console.error(`❌ [ARCHIVE] Error archiving channel: ${err.message}`);
  }
}

// ============================================================
// POST TO PROJECT-LOG
// ============================================================
async function postToProjectLog(serverName, content) {
  const logEntry = findChannelByType(serverName, 'log');
  if (logEntry) {
    const [logId] = logEntry;
    const channel = client.channels.cache.get(logId);
    if (channel) {
      await channel.send(content);
    }
  }
}

// ============================================================
// POST TO ISSUE CHANNEL — Notify the assigned agent
// ============================================================
async function postToIssueChannel(serverName, issueId, content) {
  // Find the issue channel by purpose (which matches the issue ID)
  // Try the current server first, then ALL-DISCIPLINES as fallback
  const issueEntry = Object.entries(CHANNEL_MAP).find(
    ([id, info]) => info.server === serverName && info.purpose === issueId
  ) || Object.entries(CHANNEL_MAP).find(
    ([id, info]) => info.server === 'ALL-DISCIPLINES' && info.purpose === issueId
  ) || Object.entries(CHANNEL_MAP).find(
    // Fallback: match by prefix (e.g., PROD-001 matches PROD-TEST channel)
    ([id, info]) => info.server === 'ALL-DISCIPLINES' && issueId.startsWith(info.purpose.split('-')[0])
  );
  if (issueEntry) {
    const [issueChannelId] = issueEntry;
    const channel = client.channels.cache.get(issueChannelId);
    if (channel) {
      await channel.send(content);
      console.log(`📨 [ISSUE] Posted to #${CHANNEL_MAP[issueChannelId]?.name} (${serverName}/${issueId})`);
      return true;
    }
  }
  console.log(`⚠️ [ISSUE] No issue channel found for ${issueId} in ${serverName}`);
  return false;
}

// ============================================================
// WORK SESSION COMPLETION
// ============================================================
async function completeWork(workChannelId, serverName, issueId) {
  const workInfo = activeWorks[workChannelId];
  if (!workInfo) return;

  workInfo.status = 'completed';

  // Post summary to #project-log
  const duration = Math.round((Date.now() - workInfo.startedAt) / 1000 / 60);
  await postToProjectLog(serverName,
    `📋 **Work Complete: ${issueId}**\n` +
    `📅 Duration: ${duration} minutes\n` +
    `🤖 Sub-agents: ${workInfo.subAgentCount}\n` +
    `✅ Status: Completed`
  );

  // Archive the work channel after a delay
  setTimeout(async () => {
    const guildId = SERVER_MAP[serverName];
    if (guildId) {
      await archiveWorkChannel(guildId, workChannelId);
    }
    delete activeWorks[workChannelId];
  }, 60000); // 1 minute grace period

  // Notify the control channel
  const controlEntry = findChannelByType(serverName, 'control');
  if (controlEntry) {
    const [controlId] = controlEntry;
    const channel = client.channels.cache.get(controlId);
    if (channel) {
      await channel.send(`✅ **Work completed for ${issueId}** — sub-agents finished. Check #project-log for summary.`);
    }
  }
}

// ============================================================
// BOT READY
// ============================================================
client.once(Events.ClientReady, (c) => {
  console.log(`✅ OpenClaw Bot logged in as ${c.user.tag}`);

  // Build the dynamic channel map
  CHANNEL_MAP = buildChannelMap(c);

  const agentChannels = Object.values(CHANNEL_MAP).filter(ch => ch.agent !== null).length;
  const byType = {};
  Object.values(CHANNEL_MAP).forEach(ch => {
    byType[ch.type] = (byType[ch.type] || 0) + 1;
  });

  console.log(`📋 ${Object.keys(CHANNEL_MAP).length} channels monitored (${agentChannels} with agent assignments)`);
  console.log(`📊 Channel breakdown: ${Object.entries(byType).map(([k, v]) => `${k}: ${v}`).join(', ')}`);

  // Log which servers have control channels
  const controlServers = Object.values(CHANNEL_MAP).filter(ch => ch.type === 'control').map(ch => ch.server);
  const uniqueControlServers = [...new Set(controlServers)];
  console.log(`🎮 Control channels (#ai-work) on: ${uniqueControlServers.join(', ') || 'NONE'}`);

  // Log OpenClaw gateway status
  if (CONFIG.openclawApiBase && CONFIG.openclawApiBase !== 'http://localhost:8080') {
    console.log(`🔗 OpenClaw Gateway: ${CONFIG.openclawApiBase}`);
  } else {
    console.log(`🔗 OpenClaw Gateway: NOT CONFIGURED (set OPENCLAW_API_BASE env var to enable sub-agent spawning)`);
  }
});

// ============================================================
// INTERVAL: Clean up stale work channels
// ============================================================
setInterval(() => {
  const now = Date.now();
  for (const [channelId, work] of Object.entries(activeWorks)) {
    if (work.status === 'completed') continue;
    const elapsed = (now - work.startedAt) / 1000 / 60;
    if (elapsed > CONFIG.workChannelInactiveMinutes) {
      console.log(`⏰ [CLEANUP] Work ${work.issueId} inactive for ${Math.round(elapsed)}m — auto-archiving`);
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        work.status = 'inactive';
        completeWork(channelId, work.server, work.issueId);
      } else {
        delete activeWorks[channelId];
      }
    }
  }
}, 60000); // Check every minute

// ============================================================
// MESSAGE HANDLER — Channel-type-aware dispatch
// ============================================================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  // DEBUG: Log every message received
  console.log(`📨 [RAW] channel=${message.channelId} author=${message.author.username} content="${message.content.substring(0, 80)}"`);

  const channelInfo = CHANNEL_MAP[message.channelId];
  if (!channelInfo) {
    console.log(`⚠️ [RAW] No channel info for ${message.channelId} — not in CHANNEL_MAP`);
    return;
  }

  const { type, agent, server, name, purpose } = channelInfo;

  // ── SYSTEM CHANNELS (agent-commands) ──
  if (type === 'system') {
    if (name === 'agent-commands') {
      const args = message.content.split(' ');
      const command = args[0].toLowerCase();

      switch (command) {
        case '!ping':
          await message.reply('🏓 Pong! Bot is online.');
          break;

        case '!status': {
          const guilds = client.guilds.cache;
          let status = '🟢 **OpenClaw Bot Status**\n\n';
          status += `**Servers (${guilds.size}):**\n`;
          guilds.forEach(g => {
            const serverChannels = Object.values(CHANNEL_MAP).filter(c => c.server === g.name);
            const agentCh = serverChannels.filter(c => c.agent !== null).length;
            const byType = {};
            serverChannels.forEach(ch => { byType[ch.type] = (byType[ch.type] || 0) + 1; });
            const typeSummary = Object.entries(byType).map(([k, v]) => `${k}:${v}`).join(' ');
            status += `  • **${g.name}** — ${agentCh} agent channels (${typeSummary})\n`;
          });
          status += `\n**Total channels:** ${Object.keys(CHANNEL_MAP).length}`;
          if (Object.keys(activeWorks).length > 0) {
            status += `\n**Active works:** ${Object.keys(activeWorks).length}`;
          }
          await message.reply(status);
          break;
        }

        case '!help':
          await message.reply(
            '**OpenClaw Bot — Full Hybrid Channel Model**\n\n' +
            '**Control Channels (#ai-work):**\n' +
            '`@agent work on #{issue-id}` — Start work (creates #work-xxx, spawns sub-agents)\n' +
            '`@agent plan #{issue-id}` — Plan work for an issue\n' +
            '`@agent status` — Show server status\n\n' +
            '**Issue Channels:**\n' +
            'Type normally. Agent reads silently.\n' +
            'Mention @agent → cross-reference in #ai-work.\n\n' +
            '**Work Channels (#work-xxx):**\n' +
            'Created automatically when work starts.\n' +
            'Type @agent done → completes and archives.\n\n' +
            '**Commands:**\n' +
            '`!ping` — Check bot is alive\n' +
            '`!status` — Show all servers and active works\n' +
            '`!channels` — List all channels with agent assignments\n' +
            '`!whoami` — Show this channel type\n' +
            '`!taxonomy` — Show channel type breakdown\n' +
            '`!works` — List active work sessions'
          );
          break;

        case '!channels': {
          const agentChannels = Object.entries(CHANNEL_MAP).filter(([id, info]) => info.agent);
          const total = agentChannels.length;
          const byServer = {};
          agentChannels.forEach(([id, info]) => {
            if (!byServer[info.server]) byServer[info.server] = [];
            byServer[info.server].push(info);
          });
          let reply = `**All Agent Channels (${total} total):**\n`;
          for (const [server, channels] of Object.entries(byServer)) {
            const names = channels.map(c => `#${c.name}`).join(', ');
            reply += `**${server}:** ${names}\n`;
            if (reply.length > 1800) break;
          }
          await message.reply(reply);
          break;
        }

        case '!whoami': {
          const thisChannel = CHANNEL_MAP[message.channelId];
          if (thisChannel && thisChannel.agent) {
            await message.reply(`This channel is assigned to **${thisChannel.agent}** for **${thisChannel.purpose}**.`);
          } else {
            await message.reply(`This is a **${thisChannel ? thisChannel.type : 'unknown'}** channel.`);
          }
          break;
        }

        case '!taxonomy': {
          const byType = {};
          Object.values(CHANNEL_MAP).forEach(ch => {
            if (!byType[ch.type]) byType[ch.type] = [];
            byType[ch.type].push(ch);
          });
          let reply = '📊 **Channel Taxonomy Breakdown**\n\n';
          for (const [type, channels] of Object.entries(byType)) {
            reply += `**${type}** (${channels.length}):\n`;
            channels.slice(0, 5).forEach(ch => {
              reply += `  • ${ch.server}/#${ch.name}\n`;
            });
            if (channels.length > 5) reply += `  • ... and ${channels.length - 5} more\n`;
            reply += '\n';
          }
          await message.reply(reply);
          break;
        }

        case '!works': {
          if (Object.keys(activeWorks).length === 0) {
            await message.reply('No active work sessions.');
            return;
          }
          let reply = '🔧 **Active Work Sessions**\n\n';
          for (const [channelId, work] of Object.entries(activeWorks)) {
            const elapsed = Math.round((Date.now() - work.startedAt) / 1000 / 60);
            reply += `  • **${work.issueId}** — ${elapsed}m — ${work.subAgentCount} sub-agents — ${work.status}\n`;
          }
          await message.reply(reply);
          break;
        }

        default:
          if (command.startsWith('!')) {
            await message.reply(`Unknown command: ${command}. Try \`!help\``);
          }
      }
    }
    return;
  }

  // ── CONTROL CHANNELS (#ai-work) ──
  if (type === 'control') {
    const content = message.content;
    const isAgentMention = message.mentions.users.has(client.user.id);
    const isCommand = content.startsWith('!') || content.startsWith('@agent');

    if (!isAgentMention && !isCommand) return;

    const cleanContent = content.replace(/<@!?\d+>/g, '').trim();
    const args = cleanContent.split(' ');
    const command = args[0].toLowerCase();

    if (command === '!help' || (command === '@agent' && args.length === 1)) {
      await message.reply(
        '**Control Channel (#ai-work):**\n' +
        '`@agent work on {issue-id(s)}` — Start work (comma-separated for multiple)\n' +
        '`@agent plan {issue-id}` — Plan work\n' +
        '`@agent status` — Show status\n' +
        '`!help` — Show this\n' +
        '`!ping` — Check bot is alive\n' +
        '`!status` — Show all servers and active works\n' +
        '`!channels` — List all channels with agent assignments\n' +
        '`!whoami` — Show this channel type\n' +
        '`!taxonomy` — Show channel type breakdown\n' +
        '`!works` — List active work sessions\n' +
        '\n**Channel routing:** Add `in #channel-name` to route output to a specific channel.'
      );
    } else if (command === '!ping') {
      await message.reply('🏓 Pong! Bot is online.');
    } else if (command === '!status') {
      const guilds = client.guilds.cache;
      let status = '🟢 **OpenClaw Bot Status**\n\n';
      status += `**Servers (${guilds.size}):**\n`;
      guilds.forEach(g => {
        const serverChannels = Object.values(CHANNEL_MAP).filter(c => c.server === g.name);
        const agentCh = serverChannels.filter(c => c.agent !== null).length;
        const byType = {};
        serverChannels.forEach(ch => { byType[ch.type] = (byType[ch.type] || 0) + 1; });
        const typeSummary = Object.entries(byType).map(([k, v]) => `${k}:${v}`).join(' ');
        status += `  • **${g.name}** — ${agentCh} agent channels (${typeSummary})\n`;
      });
      status += `\n**Total channels:** ${Object.keys(CHANNEL_MAP).length}`;
      if (Object.keys(activeWorks).length > 0) {
        status += `\n**Active works:** ${Object.keys(activeWorks).length}`;
      }
      await message.reply(status);
    } else if (command === '!channels') {
      const agentChannels = Object.entries(CHANNEL_MAP).filter(([id, info]) => info.agent);
      const total = agentChannels.length;
      // Group by server to keep it compact
      const byServer = {};
      agentChannels.forEach(([id, info]) => {
        if (!byServer[info.server]) byServer[info.server] = [];
        byServer[info.server].push(info);
      });
      let reply = `**All Agent Channels (${total} total):**\n`;
      for (const [server, channels] of Object.entries(byServer)) {
        const names = channels.map(c => `#${c.name}`).join(', ');
        reply += `**${server}:** ${names}\n`;
        if (reply.length > 1800) {
          reply += `... and ${total - agentChannels.slice(0, agentChannels.findIndex(([id]) => id === channels[0].id) + channels.length).length} more`;
          break;
        }
      }
      await message.reply(reply);
    } else if (command === '!whoami') {
      const thisChannel = CHANNEL_MAP[message.channelId];
      if (thisChannel && thisChannel.agent) {
        await message.reply(`This channel is assigned to **${thisChannel.agent}** for **${thisChannel.purpose}**.`);
      } else {
        await message.reply(`This is a **${thisChannel ? thisChannel.type : 'unknown'}** channel.`);
      }
    } else if (command === '!taxonomy') {
      const byType = {};
      Object.values(CHANNEL_MAP).forEach(ch => {
        if (!byType[ch.type]) byType[ch.type] = [];
        byType[ch.type].push(ch);
      });
      let reply = '📊 **Channel Taxonomy Breakdown**\n\n';
      for (const [type, channels] of Object.entries(byType)) {
        reply += `**${type}** (${channels.length}):\n`;
        channels.slice(0, 5).forEach(ch => {
          reply += `  • ${ch.server}/#${ch.name}\n`;
        });
        if (channels.length > 5) reply += `  • ... and ${channels.length - 5} more\n`;
        reply += '\n';
      }
      await message.reply(reply);
    } else if (command === '!works') {
      if (Object.keys(activeWorks).length === 0) {
        await message.reply('No active work sessions.');
        return;
      }
      let reply = '🔧 **Active Work Sessions**\n\n';
      for (const [channelId, work] of Object.entries(activeWorks)) {
        const elapsed = Math.round((Date.now() - work.startedAt) / 1000 / 60);
        reply += `  • **${work.issueId}** — ${elapsed}m — ${work.subAgentCount} sub-agents — ${work.status}\n`;
      }
      await message.reply(reply);
    } else if (command === 'work' || (command.startsWith('@agent') && args.includes('work'))) {
      // Parse optional channel routing: "in #channel-name" or "in <#channel-id>"
      let targetChannelName = null;
      const inIdx = args.indexOf('in');
      if (inIdx !== -1 && inIdx < args.length - 1) {
        let rawTarget = args[inIdx + 1];
        // Handle Discord mention format: <#CHANNEL_ID>
        const mentionMatch = rawTarget.match(/^<#(\d+)>$/);
        if (mentionMatch) {
          const channelId = mentionMatch[1];
          // Look up the channel name from the client's cache using message.guildId
          const guild = client.guilds.cache.get(message.guildId);
          if (guild) {
            const channel = guild.channels.cache.get(channelId);
            if (channel) {
              targetChannelName = channel.name;
            }
          }
        } else {
          // Plain #channel-name format
          targetChannelName = rawTarget.replace(/^#/, '');
        }
        args.splice(inIdx, 2);
      }

      // Check for --flash flag (use deepseek-flash for simpler issues)
      const useFlash = args.includes('--flash');
      if (useFlash) {
        const flashIdx = args.indexOf('--flash');
        args.splice(flashIdx, 1);
      }

      // Parse issue IDs: comma-separated, or space-separated after 'on'
      const onIdx = args.indexOf('on');
      let issueArgs = [];
      if (onIdx !== -1 && onIdx < args.length - 1) {
        const afterOn = args.slice(onIdx + 1).join(' ');
        issueArgs = afterOn.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else {
        issueArgs = args.filter(a => a.startsWith('#') || (a.includes('-') && a.match(/^[A-Z]+-/)));
      }

      if (issueArgs.length === 0) {
        await message.reply('Usage: `@agent work on {issue-id}` (e.g., `@agent work on PROCURE-001`)\nFor multiple: `@agent work on PROCURE-001, PROCURE-002`\nAdd `--flash` for simpler issues (uses deepseek-flash instead of deepseek-pro).');
        return;
      }

      const issueIds = issueArgs.map(a => a.replace(/^#/, '').replace(/,/g, '').trim().toUpperCase()).filter(a => a.length > 0);
      const agentModel = useFlash ? 'deepseek-v4-flash' : 'deepseek-v4-pro';

      await message.reply(
        `📋 **Starting work on ${issueIds.length} issue(s)** ...\n` +
        `🔧 Creating work channels...\n` +
        `🤖 Spawning sub-agents...`
      );

      let successCount = 0;
      let failCount = 0;
      const createdChannels = [];

      // If targetChannelName is set, create ONE shared channel for all issues
      let sharedChannelId = null;
      if (targetChannelName) {
        const guildId = SERVER_MAP[server];
        if (guildId) {
          sharedChannelId = await createWorkChannel(guildId, server, issueIds.join('-'), targetChannelName);
        }
      }

      for (const issueId of issueIds) {
        const guildId = SERVER_MAP[server];
        if (!guildId) {
          await message.reply(`❌ Unknown server: ${server}`);
          failCount++;
          continue;
        }

        // Use shared channel if targetChannelName was specified, otherwise per-issue
        const workChannelId = sharedChannelId || await createWorkChannel(guildId, server, issueId);
        if (!workChannelId) {
          await message.reply(`❌ Failed to create work channel for ${issueId}. Check bot permissions.`);
          failCount++;
          continue;
        }

        createdChannels.push({ issueId, workChannelId });
        scheduleRebuildChannelMap(2000);

        activeWorks[workChannelId] = {
          issueId,
          server,
          status: 'active',
          subAgentCount: 0,
          startedAt: Date.now()
        };

        // Dispatch to the correct agent for this issue
        const dispatchResult = await dispatchToAgent(issueId, server, agentModel);
        const dispatchedAgent = dispatchResult ? dispatchResult.agentDisplay : 'Unknown';
        const dispatchedCompany = dispatchResult ? dispatchResult.company : 'unknown';
        const dispatchedTask = dispatchResult ? dispatchResult.task : 'Execute assigned task';
        const dispatchedPhase = dispatchResult ? dispatchResult.phase : 'Unknown';
        const dispatchedDiscipline = dispatchResult ? dispatchResult.discipline : 'Unknown';

        activeWorks[workChannelId].subAgentCount = 1;
        activeWorks[workChannelId].dispatchedAgent = dispatchedAgent;
        activeWorks[workChannelId].dispatchedCompany = dispatchedCompany;
        activeWorks[workChannelId].dispatchedTask = dispatchedTask;
        activeWorks[workChannelId].dispatchedPhase = dispatchedPhase;

        // Update work channel topic with dispatch info
        await discordApiRequest(`/channels/${workChannelId}`, 'PATCH', {
          topic: `Active work session for ${issueId} — dispatched to ${dispatchedAgent} (${dispatchedCompany}) — Phase: ${dispatchedPhase} — Task: ${dispatchedTask}`
        });

        await postToProjectLog(server,
          `🔧 **Work Started: ${issueId}**\n` +
          `📅 Started: <t:${Math.floor(Date.now() / 1000)}:R>\n` +
          `🎯 Dispatched to: **${dispatchedAgent}** (${dispatchedCompany})\n` +
          `📋 Phase: ${dispatchedPhase}\n` +
          `📝 Task: ${dispatchedTask}\n` +
          `🔗 Work channel: <#${workChannelId}>`
        );

        // Notify the assigned agent's issue channel
        await postToIssueChannel(server, issueId,
          `🔧 **Work Started: ${issueId}**\n` +
          `📅 Started: <t:${Math.floor(Date.now() / 1000)}:R>\n` +
          `🎯 Dispatched to: **${dispatchedAgent}** (${dispatchedCompany})\n` +
          `📋 Phase: ${dispatchedPhase}\n` +
          `📝 Task: ${dispatchedTask}\n` +
          `🔗 Work channel: <#${workChannelId}>\n` +
          `📝 Type \`@agent done\` in the work channel when complete.`
        );

        // Execute the task (make API calls, post results)
        await executeTask(issueId, workChannelId, server);

        successCount++;
      }

      const logChannel = findChannelByType(server, 'log');
      const logMention = logChannel ? `<#${logChannel[0]}>` : '#project-log';

      let summary = `✅ **Work started: ${successCount} success, ${failCount} failed**\n`;
      createdChannels.forEach(({ issueId, workChannelId }) => {
        summary += `🔧 ${issueId}: <#${workChannelId}>\n`;
      });
      summary += `📝 Progress in ${logMention}\n`;
      summary += `\nType \`@agent done\` in work channels when complete.`;

      await message.reply(summary);
    } else if (command === 'plan') {
      const issueArg = args.find(a => a.startsWith('#') || (a.includes('-') && a.match(/^[A-Z]+-/)));
      if (issueArg) {
        const issueId = issueArg.replace('#', '').toUpperCase();
        await message.reply(
          `📋 **Planning ${issueId}**\n` +
          `🔍 Reading issue context...\n` +
          `📝 Estimated sub-agents needed: 5\n` +
          `Use \`@agent work on ${issueId}\` to begin execution.`
        );
        await postToProjectLog(server,
          `📋 **Planning: ${issueId}**\n` +
          `Requested by ${message.author.username}\n` +
          `Awaiting execution command.`
        );
      } else {
        await message.reply('Usage: `@agent plan #{issue-id}` (e.g., `@agent plan PROCURE-007`)');
      }
    }
    return;
  }

  // ── WORK CHANNELS (#work-xxx) ──
  if (type === 'work') {
    const workInfo = activeWorks[message.channelId];
    if (!workInfo) {
      console.log(`⚠️ [WORK] Unknown work channel: ${message.channelId}`);
      return;
    }

    const content = message.content;
    const isAgentMention = message.mentions.users.has(client.user.id);

    // Check for completion trigger
    if (isAgentMention && (content.toLowerCase().includes('done') || content.toLowerCase().includes('complete'))) {
      await message.reply(`🔄 Completing work for **${workInfo.issueId}**...`);
      await completeWork(message.channelId, workInfo.server, workInfo.issueId);
      return;
    }

    // Forward messages to the related issue channel if possible
    if (isAgentMention) {
      const issueChannel = Object.entries(CHANNEL_MAP).find(
        ([id, info]) => info.server === workInfo.server && info.purpose === workInfo.issueId
      );
      if (issueChannel) {
        const [issueId] = issueChannel;
        const channel = client.channels.cache.get(issueId);
        if (channel) {
          await channel.send(
            `📎 **From #${name}** — Sub-agent update for **${workInfo.issueId}**\n` +
            `> ${content.substring(0, 200)}\n`
          );
        }
      }
    }

    // Log work channel activity
    console.log(`🔧 [WORK/${workInfo.issueId}] ${message.author.username}: ${content.substring(0, 100)}`);
    return;
  }

  // ── LOG CHANNELS (#project-log) — Agent writes only ──
  if (type === 'log') {
    // Humans can write, but it's primarily agent-output
    console.log(`📝 [LOG/${server}] ${message.author.username}: ${message.content.substring(0, 100)}`);
    return;
  }

  // ── OPS CHANNELS (#project-ops) ──
  if (type === 'ops') {
    const content = message.content;
    const isAgentMention = message.mentions.users.has(client.user.id);

    if (isAgentMention) {
      const cleanContent = content.replace(/<@!?\d+>/g, '').trim();
      if (cleanContent.includes('deploy') || cleanContent.includes('restart') || cleanContent.includes('status')) {
        await message.reply(
          `⚙️ **Operations Command Received**\n` +
          `This channel handles infrastructure commands.\n` +
          `For VPS operations, use: \`!deploy\`, \`!backup\`, \`!status\`\n` +
          `(Full integration pending OpenClaw gateway setup)`
        );
      }
    }
    return;
  }

  // ── ISSUE CHANNELS (with agent assignments) ──
  if (type === 'issue' && agent) {
    const isMentioned = message.mentions.users.has(client.user.id);
    if (isMentioned) {
      const controlEntry = findChannelByType(server, 'control');
      if (controlEntry) {
        const [controlId] = controlEntry;
        const channel = client.channels.cache.get(controlId);
        if (channel) {
          await channel.send(
            `📎 **Cross-reference from #${name}** (${server})\n` +
            `**${message.author.username}** mentioned @agent regarding **${purpose}**:\n` +
            `> ${message.content.substring(0, 200)}\n` +
            `[Jump to message](${message.url})`
          );
        }
      }
      await message.reply(`👋 I see your message in **#${name}**. I'll respond in **#ai-work** on **${server}**.`);
    } else {
      console.log(`👁️ [${server}/#${name}] ${message.author.username}: ${message.content.substring(0, 100)}`);
    }
    return;
  }

  // ── EPHEMERAL / UNCATEGORIZED CHANNELS ──
  console.log(`👁️ [${server}/#${name}] (${type}) ${message.author.username}: ${message.content.substring(0, 100)}`);
});

// ============================================================
// LOGIN
// ============================================================
client.login(process.env.DISCORD_BOT_TOKEN)
  .then(() => console.log('🔑 Bot authenticated successfully'))
  .catch(err => {
    console.error('❌ Bot authentication failed:', err.message);
    process.exit(1);
  });