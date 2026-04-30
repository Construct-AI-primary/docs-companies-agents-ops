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

def find_skill(agent_slug, company):
    """Find matching skill file for an agent slug."""
    ag = agent_slug
    al = ag.lower()
    
    # Direct match
    if al in all_skills:
        return all_skills[al]
    
    if company not in company_skills:
        return None
    
    # Match within company
    for slug in company_skills[company]:
        if al == slug.lower():
            return company_skills[company][slug]
    
    # Strip company prefix and try
    for pfx in [f"{company}-", f"{company.replace('-ai', '')}-"]:
        if al.startswith(pfx.lower()):
            stripped = al[len(pfx):]
            if stripped in all_skills:
                return all_skills[stripped]
            for slug in company_skills[company]:
                if stripped == slug.lower():
                    return company_skills[company][slug]
    
    # For knowledgeforge: agent slug has "knowledgeforge-ai-X" but skill is "X-knowledgeforge-*"
    if company == "knowledgeforge-ai":
        # agent slug: knowledgeforge-ai-administrator
        # skill slug: administrator-knowledgeforge-administration
        role_part = al.replace("knowledgeforge-ai-", "")
        for slug, sf in company_skills[company].items():
            if slug.startswith(role_part) or role_part in slug:
                return sf
            # Also try matching the first word
            aw = role_part.split('-')
            sw = slug.split('-')
            if aw[0] == sw[0] or aw[-1] == sw[-1]:
                return sf
    
    # For domainforge: already has the full slug in skill, just different prefix
    # agent: architectural-domainforge-architectural
    # skill: same
    for slug, sf in company_skills[company].items():
        if slug in ag or ag in slug:
            return sf
    
    return None

# Match
matched = 0
unmatched = 0
for company in sorted(os.listdir(agents_dir)):
    ap = os.path.join(agents_dir, company, "agents")
    if not os.path.isdir(ap): continue
    for agent in sorted(os.listdir(ap)):
        f = os.path.join(ap, agent, "AGENTS.md")
        if not os.path.isfile(f): continue
        skill = find_skill(agent, company)
        if skill:
            matched += 1
            # Update file
            with open(f) as fh:
                content = fh.read()
            
            # Only update placeholders
            if "Agent for" in content and len(content.split('---')) <= 3:
                with open(skill) as fh:
                    sk = fh.read()
                
                # Parse frontmatter
                parts = content.split('---')
                fm = safe_parse_yaml(parts[1]) if len(parts) >= 2 else {}
                agent_name = fm.get('name', agent)
                reports_to = fm.get('reportsTo', 'unknown')
                skill_slug = agent  # Use agent slug as-is
                
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
                
                description = safe_parse_yaml(sparts[1]).get('description', f'Agent for {agent_name}') if len(sparts) >= 3 else f'Agent for {agent_name}'
                
                lines_out = [
                    '---',
                    f'name: {agent_name}',
                    f'slug: {skill_slug}',
                    f'reportsTo: {reports_to}',
                    f'role: {role}',
                ]
                desc_text = str(description)[:200]
                lines_out.append('description: >')
                lines_out.append(f'  {desc_text}')
                lines_out.append('skills:')
                lines_out.append(f'  - {skill_slug}')
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
                
                with open(f, 'w') as fh:
                    fh.write('\n'.join(lines_out))
        else:
            unmatched += 1

print(f"Total matched: {matched}")
print(f"Total unmatched: {unmatched}")