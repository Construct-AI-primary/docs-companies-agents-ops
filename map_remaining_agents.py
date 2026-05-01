#!/usr/bin/env python3
"""
Map remaining placeholder AGENTS.md files to their SKILL.md content.

Handles:
1. knowledgeforge-ai: agent slug "knowledgeforge-ai-X" → skill "X-knowledgeforge-*"
2. learningforge-ai: agents without 1:1 skill mapping → generate from name
3. Truncated names: execforge-ai-presentationspecialis → Presentation-Specialist, etc.
4. domainforge-ai: agent slugs already match skill names
5. Other stragglers: apex-qualityforge-ceo, contentforge-ai-communicationorchestr
"""

import os
import yaml
import re

agents_dir = "agent-companies-core/agents"
skills_dir = "agent-companies-core/skills"

def safe_parse_yaml(text):
    try:
        return yaml.safe_load(text) or {}
    except:
        result = {}
        for line in text.split('\n'):
            line = line.strip()
            if ':' in line:
                key, _, val = line.partition(':')
                key = key.strip()
                val = val.strip()
                if key and val and not val.startswith('- '):
                    result[key] = val
        return result

# Build skill database: company -> { skill_slug: skill_path }
company_skills = {}
all_skills = {}
for company in os.listdir(skills_dir):
    sp = os.path.join(skills_dir, company, "skills")
    if not os.path.isdir(sp): continue
    for slug in os.listdir(sp):
        sf = os.path.join(sp, slug, "SKILL.md")
        if os.path.isfile(sf):
            company_skills.setdefault(company, {})[slug] = sf
            all_skills[slug.lower()] = sf
            all_skills[slug] = sf

# ============================================================
# EXPLICIT ALIAS MAPPINGS
# ============================================================

# knowledgeforge-ai: agent slug → skill slug
KNOWLEDGEFORGE_ALIASES = {
    "knowledgeforge-ai-administrator": "administrator-knowledgeforge-administration",
    "knowledgeforge-ai-ambiguityprime": "ambiguityprime-knowledgeforge-ceo",
    "knowledgeforge-ai-archivist": "archivist-knowledgeforge-document-control",
    "knowledgeforge-ai-builder": "builder-knowledgeforge-civil-engineer",
    "knowledgeforge-ai-buyer": "buyer-knowledgeforge-procurement",
    "knowledgeforge-ai-chairman": "chairman-knowledgeforge-board-of-directors",
    "knowledgeforge-ai-chemist": "chemist-knowledgeforge-chemical-engineer",
    "knowledgeforge-ai-communicator": "communicator-knowledgeforge-public-relations",
    "knowledgeforge-ai-concierge": "concierge-knowledgeforge-home-login",
    "knowledgeforge-ai-constructor": "constructor-knowledgeforge-construction",
    "knowledgeforge-ai-controller": "controller-knowledgeforge-project-controls",
    "knowledgeforge-ai-counsel": "counsel-knowledgeforge-legal",
    "knowledgeforge-ai-critic": "critic-knowledgeforge-doc-analyzer",
    "knowledgeforge-ai-designer": "designer-knowledgeforge-design",
    "knowledgeforge-ai-developer": "developer-knowledgeforge-developer",
    "knowledgeforge-ai-directors": "directors-knowledgeforge-directors",
    "knowledgeforge-ai-dispatcher": "dispatcher-knowledgeforge-logistics",
    "knowledgeforge-ai-electrician": "electrician-knowledgeforge-electrical-engineer",
    "knowledgeforge-ai-engineer": "engineer-knowledgeforge-mechanical-engineer",
    "knowledgeforge-ai-environmentalist": "environmentalist-knowledgeforge-environmental",
    "knowledgeforge-ai-ethicist": "ethicist-knowledgeforge-ethics",
    "knowledgeforge-ai-examiner": "examiner-knowledgeforge-quality-assurance",
    "knowledgeforge-ai-gatekeeper": "gatekeeper-knowledgeforge-auth-flow",
    "knowledgeforge-ai-generalist": "generalist-knowledgeforge-sundry",
    "knowledgeforge-ai-geologist": "geologist-knowledgeforge-geotechnical-engineer",
    "knowledgeforge-ai-governor": "governor-knowledgeforge-governance",
    "knowledgeforge-ai-greeter": "greeter-knowledgeforge-user-signup",
    "knowledgeforge-ai-guardian": "guardian-knowledgeforge-safety",
    "knowledgeforge-ai-inetrmediary": "inetrmediary-knowledgeforge-cross-discipline-guardian",
    "knowledgeforge-ai-inspector": "inspector-knowledgeforge-inspection",
    "knowledgeforge-ai-landscaper": "landscaper-knowledgeforge-landscaping",
    "knowledgeforge-ai-leader": "leader-knowledgeforge-sector-qa-lead",
    "knowledgeforge-ai-merchant": "merchant-knowledgeforge-commercial",
    "knowledgeforge-ai-negotiator": "negotiator-knowledgeforge-contracts",
    "knowledgeforge-ai-optimizer": "optimizer-knowledgeforge-process-engineer",
    "knowledgeforge-ai-physician": "physician-knowledgeforge-health",
    "knowledgeforge-ai-salesperson": "salesperson-knowledgeforge-sales",
    "knowledgeforge-ai-sentinel": "sentinel-knowledgeforge-security",
    "knowledgeforge-ai-specialist": "specialist-knowledgeforge-local-content",
    "knowledgeforge-ai-surveyor": "surveyor-knowledgeforge-quantity-surveying",
    "knowledgeforge-ai-technician": "technician-knowledgeforge-information-technology",
    "knowledgeforge-ai-treasurer": "treasurer-knowledgeforge-finance",
}

# Truncated name mappings
TRUNCATED_ALIASES = {
    "execforge-ai-presentationspecialis": ("execforge-ai", "Presentation-Specialist"),
    "contentforge-ai-technicalseo": ("contentforge-ai", "Technical-SEO-Specialist"),
    "saasforge-ai-deploymentorchestrato": ("saasforge-ai", "Deployment-Orchestrator"),
}

# learningforge-ai agents without 1:1 skill mapping → generate from name
LEARNINGFORGE_NO_SKILL = [
    "learningforge-ai-audit-by-path",
    "learningforge-ai-audit-explainability",
    "learningforge-ai-autoresearch-gap-analyzer",
    "learningforge-ai-autoresearch-literature-scanner",
    "learningforge-ai-autoresearch-skills-enhancer",
    "learningforge-ai-ceo",
    "learningforge-ai-compliance-guard",
    "learningforge-ai-construction-law-research",
    "learningforge-ai-doc-gap-detector",
    "learningforge-ai-doc-usage-analyzer",
    "learningforge-ai-from-doc-to-lesson-generator",
    "learningforge-ai-goal-alignment-budget",
    "learningforge-ai-hermes-research",
    "learningforge-ai-knowledge-flow-agent",
    "learningforge-ai-knowledge-flow-division-lead",
    "learningforge-ai-knowledge-hygiene",
    "learningforge-ai-knowledge-provenance",
    "learningforge-ai-knowledge-transparency",
    "learningforge-ai-langchain-runner",
    "learningforge-ai-micro-lesson-generator",
    "learningforge-ai-priority-disciplines-lead",
    "learningforge-ai-research-compliance-division-lead",
    "learningforge-ai-research-scheduler",
    "learningforge-ai-vfs-markdown-tracker",
    "learningforge-ai-vfs-watcher",
]

# Other stragglers with no skill match
OTHER_NO_SKILL = {
    "apex-qualityforge-ceo": ("qualityforge-ai", "CEO"),
    "contentforge-ai-communicationorchestr": ("contentforge-ai", "Communication Orchestrator"),
    "human-resources-domainforge-human-resources": ("domainforge-ai", "HR Specialist"),
}

def slug_to_name(slug):
    """Convert a slug like 'knowledgeforge-ai-administrator' to 'Administrator'."""
    # Remove company prefix
    name = re.sub(r'^(knowledgeforge|learningforge|execforge|contentforge|saasforge|qualityforge|domainforge)-ai-', '', slug)
    name = re.sub(r'^(apex|orion)-', '', name)
    name = name.replace('-', ' ')
    # Capitalize each word
    return ' '.join(w.capitalize() for w in name.split())

def generate_basic_content(agent_name, agent_slug, company):
    """Generate basic AGENTS.md content for agents without a matching skill."""
    name_parts = agent_slug.replace(f"{company}-", "").replace("-ai-", "-").split("-")
    role = name_parts[-1] if name_parts else "general"
    company_name = company.replace('-ai', '').replace('-', ' ').title()
    
    desc = f"{agent_name} agent within {company_name} AI"
    
    lines = [
        '---',
        f'name: {agent_name}',
        f'slug: {agent_slug}',
        f'reportsTo: ceo',
        f'role: general',
        'description: >',
        f'  {desc}',
        'skills:',
        f'  - {agent_slug}',
        '---',
        '',
        '## Overview',
        '',
        f'{agent_name} is a specialized agent within {company.replace("-ai", "").replace("-", " ").title()} AI.',
        '',
        '## Core Procedures',
        '',
        f'### Standard Operations',
        f'- Execute {role} tasks within the {company.replace("-ai", "").replace("-", " ").title()} AI ecosystem',
        '- Coordinate with other agents for cross-functional workflows',
        '- Maintain quality standards and documentation',
        '- Report to leadership on task progress and outcomes',
        '',
    ]
    return '\n'.join(lines)

def extract_skill_content(skill_path):
    """Extract content from a SKILL.md file."""
    with open(skill_path) as fh:
        sk = fh.read()
    
    sparts = sk.split('---')
    role = safe_parse_yaml(sparts[1]).get('role', 'general') if len(sparts) >= 3 else 'general'
    body = '---'.join(sparts[2:]).strip() if len(sparts) >= 3 else sk
    
    # Extract sections
    sections = {}
    cur, clines = '', []
    for line in body.split('\n'):
        if line.startswith('## '):
            if cur: sections[cur] = '\n'.join(clines).strip()
            cur = line.lstrip('# ').strip().lower()
            clines = []
        elif cur:
            clines.append(line)
    if cur: sections[cur] = '\n'.join(clines).strip()
    
    overview = sections.get('overview', '') or sections.get('purpose', '') or sections.get('description', '') or ''
    when_to_use = sections.get('when to use', '') or ''
    core = sections.get('core procedures', '') or sections.get('capabilities', '') or sections.get('workflow', '') or sections.get('procedures', '') or ''
    
    return role, overview, when_to_use, core

def write_agents_md(filepath, agent_name, agent_slug, reports_to, role, description, overview, when_to_use, core):
    """Write enriched AGENTS.md file."""
    lines_out = [
        '---',
        f'name: {agent_name}',
        f'slug: {agent_slug}',
        f'reportsTo: {reports_to}',
        f'role: {role}',
    ]
    desc_text = str(description)[:200]
    lines_out.append('description: >')
    lines_out.append(f'  {desc_text}')
    lines_out.append('skills:')
    lines_out.append(f'  - {agent_slug}')
    lines_out.append('---')
    lines_out.append('')
    
    if overview:
        lines_out.append('## Overview')
        lines_out.append('')
        lines_out.append(overview)
        lines_out.append('')
    if when_to_use:
        lines_out.append('## When To Use')
        lines_out.append('')
        lines_out.append(when_to_use)
        lines_out.append('')
    if core:
        lines_out.append('## Core Procedures')
        lines_out.append('')
        lines_out.append(core)
        lines_out.append('')
    
    with open(filepath, 'w') as fh:
        fh.write('\n'.join(lines_out))

# ============================================================
# MAIN PROCESSING
# ============================================================

matched = 0
unmatched = 0
generated = 0

for company in sorted(os.listdir(agents_dir)):
    ap = os.path.join(agents_dir, company, "agents")
    if not os.path.isdir(ap): continue
    for agent in sorted(os.listdir(ap)):
        f = os.path.join(ap, agent, "AGENTS.md")
        if not os.path.isfile(f): continue
        
        # Read current content
        with open(f) as fh:
            content = fh.read()
        
        # Check if it's a placeholder (has "Agent for" and is short)
        is_placeholder = "Agent for " in content and len(content.split('---')) <= 3
        
        if not is_placeholder:
            continue  # Already populated
        
        # Parse frontmatter
        parts = content.split('---')
        fm = safe_parse_yaml(parts[1]) if len(parts) >= 2 else {}
        agent_name = fm.get('name', slug_to_name(agent))
        reports_to = fm.get('reportsTo', 'ceo')
        
        # ---- Try to find matching skill ----
        skill_path = None
        role = 'general'
        overview = ''
        when_to_use = ''
        core = ''
        
        # 1. Check truncated aliases
        if agent in TRUNCATED_ALIASES:
            t_company, t_skill = TRUNCATED_ALIASES[agent]
            sp = os.path.join(skills_dir, t_company, "skills", t_skill, "SKILL.md")
            if os.path.isfile(sp):
                skill_path = sp
        
        # 2. Check knowledgeforge explicit aliases
        if not skill_path and agent in KNOWLEDGEFORGE_ALIASES:
            skill_slug = KNOWLEDGEFORGE_ALIASES[agent]
            sp = os.path.join(skills_dir, "knowledgeforge-ai", "skills", skill_slug, "SKILL.md")
            if os.path.isfile(sp):
                skill_path = sp
        
        # 3. Direct match: agent slug == skill slug
        if not skill_path:
            for slug, sf in company_skills.get(company, {}).items():
                if agent.lower() == slug.lower():
                    skill_path = sf
                    break
        
        # 4. For domainforge: agent slug already matches skill name
        if not skill_path and company == "domainforge-ai":
            for slug, sf in company_skills.get(company, {}).items():
                if agent == slug:
                    skill_path = sf
                    break
        
        # 5. For qualityforge: check if agent slug is in skill list
        if not skill_path and company == "qualityforge-ai":
            for slug, sf in company_skills.get(company, {}).items():
                if agent.lower() in slug.lower() or slug.lower() in agent.lower():
                    skill_path = sf
                    break
        
        # 6. For contentforge: check if agent slug contains skill name
        if not skill_path and company == "contentforge-ai":
            for slug, sf in company_skills.get(company, {}).items():
                slug_clean = slug.lower().replace('-', '')
                agent_clean = agent.lower().replace('-', '')
                if slug_clean in agent_clean or agent_clean in slug_clean:
                    skill_path = sf
                    break
        
        # 7. For saasforge: similar matching
        if not skill_path and company == "saasforge-ai":
            for slug, sf in company_skills.get(company, {}).items():
                slug_clean = slug.lower().replace('-', '')
                agent_clean = agent.lower().replace('-', '')
                if slug_clean in agent_clean or agent_clean in slug_clean:
                    skill_path = sf
                    break
        
        # 8. For execforge: similar matching
        if not skill_path and company == "execforge-ai":
            for slug, sf in company_skills.get(company, {}).items():
                slug_clean = slug.lower().replace('-', '')
                agent_clean = agent.lower().replace('-', '')
                if slug_clean in agent_clean or agent_clean in slug_clean:
                    skill_path = sf
                    break
        
        # ---- Process based on whether we found a skill ----
        if skill_path:
            role, overview, when_to_use, core = extract_skill_content(skill_path)
            skill_desc = safe_parse_yaml(open(skill_path).read().split('---')[1]).get('description', '')
            if skill_desc:
                description = skill_desc
            elif overview:
                description = overview[:200]
            else:
                description = f'{agent_name} agent within {company.replace("-ai", "").replace("-", " ").title()} AI'
            write_agents_md(f, agent_name, agent, reports_to, role, description, overview, when_to_use, core)
            matched += 1
            print(f"  MATCHED [{company}] {agent} → {os.path.basename(os.path.dirname(skill_path))}")
        else:
            # Generate basic content for agents without skills
            if company == "learningforge-ai" and agent in LEARNINGFORGE_NO_SKILL:
                content = generate_basic_content(agent_name, agent, company)
                with open(f, 'w') as fh:
                    fh.write(content)
                generated += 1
                print(f"  GENERATED [{company}] {agent} (no matching skill)")
            elif agent in OTHER_NO_SKILL:
                content = generate_basic_content(agent_name, agent, company)
                with open(f, 'w') as fh:
                    fh.write(content)
                generated += 1
                print(f"  GENERATED [{company}] {agent} (no matching skill)")
            else:
                unmatched += 1
                print(f"  UNMATCHED [{company}] {agent}")

print(f"\n{'='*60}")
print(f"Matched with skill: {matched}")
print(f"Generated (no skill): {generated}")
print(f"Unmatched: {unmatched}")
print(f"Total processed: {matched + generated + unmatched}")