// Niche Packs for CraftlyCV
// Specialized templates, taxonomies, and prompts for vertical niches

export interface NicheSection {
  id: string
  name: string
  description: string
  required: boolean
  suggestions: string[]
}

export interface NicheSkill {
  category: string
  skills: string[]
}

export interface NicheAchievementPrompt {
  category: string
  prompts: string[]
}

export interface NichePack {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  color: string
  sections: NicheSection[]
  skills: NicheSkill[]
  achievementPrompts: NicheAchievementPrompt[]
  summaryTemplate: string
  jobTitles: string[]
}

// ─── CYBERSECURITY NICHE PACK ────────────────────────────────────────────────
export const CYBERSECURITY_PACK: NichePack = {
  id: 'cybersecurity',
  name: 'Cybersecurity',
  tagline: 'From SOC Analyst to Security Engineer',
  description: 'Perfect for cybersecurity roles including SOC analysts, pentesters, GRC specialists, and cloud security engineers.',
  icon: '🛡️',
  color: '#10b981',
  sections: [
    {
      id: 'security_clearance',
      name: 'Security Clearance',
      description: 'Current clearance level and eligibility',
      required: true,
      suggestions: ['Current clearance level (e.g., Secret, TS/SCI)', 'Eligibility for future clearances', 'Investigation dates'],
    },
    {
      id: 'certifications',
      name: 'Security Certifications',
      description: 'Industry-recognized security certifications',
      required: true,
      suggestions: ['CISSP, CISM, Security+', 'CEH, OSCP, GCIH', 'AWS Security Specialty, CCSP'],
    },
    {
      id: 'technical_skills',
      name: 'Technical Skills',
      description: 'Security tools and technologies',
      required: true,
      suggestions: ['SIEM tools (Splunk, QRadar, ArcSight)', 'EDR solutions (CrowdStrike, Carbon Black)', 'Vulnerability assessment tools', 'Cloud security (AWS, Azure, GCP)'],
    },
    {
      id: 'security_experience',
      name: 'Security Experience',
      description: 'Hands-on security work',
      required: true,
      suggestions: ['Incident response experience', 'Threat hunting activities', 'Penetration testing projects', 'Security architecture review'],
    },
    {
      id: 'grc_knowledge',
      name: 'GRC Knowledge',
      description: 'Governance, Risk, and Compliance experience',
      required: false,
      suggestions: ['Risk assessments', 'Compliance audits (SOC2, HIPAA, PCI)', 'Security policy development', 'Vendor security reviews'],
    },
  ],
  skills: [
    {
      category: 'Security Operations',
      skills: ['SIEM', 'Splunk', 'QRadar', 'ArcSight', 'Microsoft Sentinel', 'Log Analysis', 'Incident Response', 'Threat Hunting', 'Malware Analysis', 'DFIR'],
    },
    {
      category: 'Cloud Security',
      skills: ['AWS Security', 'Azure Security', 'GCP Security', 'Kubernetes Security', 'Container Security', 'IAM', 'CloudTrail', 'WAF', 'DDoS Protection'],
    },
    {
      category: 'Penetration Testing',
      skills: ['OWASP Top 10', 'Burp Suite', 'Nmap', 'Metasploit', ' Kali Linux', 'SQL Injection', 'XSS', 'CSRF', 'Network Penetration', 'Web App Testing'],
    },
    {
      category: 'Governance & Compliance',
      skills: ['NIST CSF', 'ISO 27001', 'SOC 2', 'HIPAA', 'PCI-DSS', 'GDPR', 'Risk Assessment', 'Gap Analysis', 'Policy Development', 'Vendor Management'],
    },
    {
      category: 'Programming & Automation',
      skills: ['Python', 'Bash', 'PowerShell', 'YARA', 'Sigma Rules', 'Splunk SPL', 'SQL', 'AWS Lambda', 'Terraform'],
    },
  ],
  achievementPrompts: [
    {
      category: 'Incident Response',
      prompts: [
        'Led incident response for {severity} incident affecting {number} systems in {timeframe}',
        'Reduced mean time to detect (MTTD) by {percentage} through implementation of {tool/method}',
        'Managed security incidents for {company} handling {type} threats',
      ],
    },
    {
      category: 'Vulnerability Management',
      prompts: [
        'Conducted vulnerability assessments scanning {number} assets identifying {criticality} vulnerabilities',
        'Reduced critical vulnerabilities by {percentage} through remediation program',
        'Implemented automated vulnerability scanning saving {hours} hours per week',
      ],
    },
    {
      category: 'Security Architecture',
      prompts: [
        'Designed zero-trust architecture for {company} securing {number} employees',
        'Implemented SIEM solution correlating {number} events per second',
        'Built cloud security posture management program for {company}',
      ],
    },
    {
      category: 'Compliance & Risk',
      prompts: [
        'Led {compliance_framework} compliance initiative achieving {status}',
        'Conducted risk assessment for {company} identifying and remediating {number} risks',
        'Developed security policies and procedures for {company}',
      ],
    },
  ],
  summaryTemplate: 'Cybersecurity professional with {years} years of experience in {focus_area}. Currently hold {certifications} with {clearance} clearance. Skilled in {top_skills}. Proven track record of {achievement_highlight}.',
  jobTitles: [
    'SOC Analyst',
    'Security Engineer',
    'Pentester',
    'GRC Analyst',
    'Cloud Security Engineer',
    'Incident Response Analyst',
    'Threat Intelligence Analyst',
    'Security Architect',
    'CISO',
    'Security Manager',
  ],
}

// ─── NURSING / ALLIED HEALTHCARE NICHE PACK ───────────────────────────────────
export const NURSING_PACK: NichePack = {
  id: 'nursing',
  name: 'Nursing & Healthcare',
  tagline: 'From RN to Nurse Practitioner',
  description: 'Tailored for registered nurses, nurse practitioners, and allied healthcare professionals looking to advance their careers.',
  icon: '🏥',
  color: '#ec4899',
  sections: [
    {
      id: 'licenses',
      name: 'Licenses & Registrations',
      description: 'Current nursing licenses and certifications',
      required: true,
      suggestions: ['RN License (State)', 'BLS/ACLS certification', 'Specialty certifications (CCRN, CEN, etc.)', 'DEA registration'],
    },
    {
      id: 'clinical_experience',
      name: 'Clinical Experience',
      description: 'Direct patient care experience',
      required: true,
      suggestions: ['Patient population (ICU, ER, Med-Surg, etc.)', 'Patient load and ratios managed', 'Specialty equipment proficiency', 'Electronic Medical Records systems'],
    },
    {
      id: 'healthcare_skills',
      name: 'Clinical Skills',
      description: 'Medical and nursing skills',
      required: true,
      suggestions: ['Patient assessment and evaluation', 'Medication administration', 'IV therapy and phlebotomy', 'Wound care and treatment', 'Telemetry monitoring'],
    },
    {
      id: 'healthcare_achievements',
      name: 'Patient Care Achievements',
      description: 'Quantifiable patient care accomplishments',
      required: false,
      suggestions: ['Patient satisfaction scores', 'Quality metrics achieved', 'Process improvements implemented', 'Patient safety initiatives'],
    },
    {
      id: 'specialty_training',
      name: 'Specialty Training',
      description: 'Specialized training and certifications',
      required: false,
      suggestions: ['Critical Care (CCRN)', 'Emergency Nursing (CEN)', 'Oncology (OCN)', 'Pediatric (CPN)', 'Labor & Delivery (RNC-OB)'],
    },
  ],
  skills: [
    {
      category: 'Clinical Skills',
      skills: ['Patient Assessment', 'Medication Administration', 'IV Therapy', 'Phlebotomy', 'Wound Care', 'Telemetry', 'EMR/EHR (Epic, Cerner)', 'Vital Signs Monitoring', 'Patient Education', 'Care Planning'],
    },
    {
      category: 'Specialty Areas',
      skills: ['ICU', 'Emergency Room', 'Operating Room', 'Labor & Delivery', 'Oncology', 'Pediatrics', 'Psychiatric', 'Geriatric', 'Rehabilitation', 'Home Health'],
    },
    {
      category: 'Leadership & Communication',
      skills: ['Staff Supervision', 'Preceptoring', 'Patient Advocacy', 'Family Communication', 'Interdisciplinary Collaboration', 'Handoff Reporting', 'Conflict Resolution', 'Cultural Competency'],
    },
    {
      category: 'Quality & Safety',
      skills: ['HIPAA Compliance', 'Patient Safety', 'Fall Prevention', 'Infection Control', 'Quality Improvement', 'Root Cause Analysis', 'Clinical Documentation', 'Medical Records'],
    },
  ],
  achievementPrompts: [
    {
      category: 'Patient Care Impact',
      prompts: [
        'Provided direct patient care for {population} averaging {census} patients per shift',
        'Achieved {percentage} patient satisfaction score consistently exceeding unit average',
        'Administered medications to {number} patients daily with zero medication errors',
      ],
    },
    {
      category: 'Clinical Leadership',
      prompts: [
        'Led team of {number} CNAs and assistive personnel during {number}-bed unit operations',
        'Precepted {number} new graduate nurses through orientation program',
        'Served as charge nurse coordinating care for {number} patients per shift',
      ],
    },
    {
      category: 'Quality Improvement',
      prompts: [
        'Implemented fall prevention protocol reducing falls by {percentage}',
        'Improved hand hygiene compliance from {old}% to {new}% through staff education',
        'Streamlined admission process reducing wait times by {percentage}',
      ],
    },
  ],
  summaryTemplate: 'Compassionate {specialty} nurse with {years} years of experience providing high-quality patient care in {setting}. Licensed as RN with certifications in {certifications}. Demonstrated ability to {achievement_highlight} while maintaining patient safety and satisfaction.',
  jobTitles: [
    'Registered Nurse (RN)',
    'ICU Nurse',
    'Emergency Room Nurse',
    'Operating Room Nurse',
    'Labor & Delivery Nurse',
    'Oncology Nurse',
    'Pediatric Nurse',
    'Nurse Practitioner (NP)',
    'Clinical Nurse Specialist',
    'Nurse Manager',
  ],
}

// ─── SKILLED TRADES NICHE PACK ───────────────────────────────────────────────
export const SKILLED_TRADES_PACK: NichePack = {
  id: 'skilled_trades',
  name: 'Skilled Trades',
  tagline: 'Electricians, Mechanics, HVAC & More',
  description: 'Designed for skilled trades professionals including electricians, plumbers, HVAC technicians, mechanics, and construction specialists.',
  icon: '🔧',
  color: '#f59e0b',
  sections: [
    {
      id: 'trade_license',
      name: 'Trade Licenses & Certifications',
      description: 'Professional licenses and trade certifications',
      required: true,
      suggestions: ['Journeyman/Master license', 'OSHA 10/30 certification', 'EPA 608 refrigerant certification', 'Commercial driver license (CDL)'],
    },
    {
      id: 'trade_skills',
      name: 'Trade-Specific Skills',
      description: 'Core trade skills and expertise',
      required: true,
      suggestions: ['Install, maintain, and repair activities', 'Blueprint reading and schematics', 'Equipment and tool proficiency', 'Safety protocol adherence'],
    },
    {
      id: 'field_experience',
      name: 'Field Experience',
      description: 'On-site work experience',
      required: true,
      suggestions: ['Commercial vs residential work', 'Industrial or manufacturing environment', 'New construction vs retrofit', 'Union vs non-union'],
    },
    {
      id: 'osha_safety',
      name: 'Safety Training',
      description: 'Safety certifications and experience',
      required: false,
      suggestions: ['OSHA 10-hour Construction', 'OSHA 30-hour General Industry', 'Fall protection training', 'Confined space entry', 'Hot work permits'],
    },
    {
      id: 'equipment',
      name: 'Equipment & Vehicles',
      description: 'Equipment operation and maintenance',
      required: false,
      suggestions: ['Heavy equipment operation', 'Company vehicle CDL operation', 'Personal tools and tool allowance', 'Diagnostic equipment proficiency'],
    },
  ],
  skills: [
    {
      category: 'Electrical',
      skills: ['Electrical Installation', 'Blueprint Reading', 'Conduit Bending', 'Wire Pulling', 'Panel Installation', 'Grounding', 'Testing Equipment', 'NEC Code Compliance', 'Commercial Wiring', 'Residential Wiring'],
    },
    {
      category: 'HVAC/R',
      skills: ['Refrigerant Handling', 'AC System Installation', 'Heating Systems', 'Ductwork', 'Heat Pumps', 'Chillers', 'EPA 608 Certification', 'Load Calculations', 'System Troubleshooting', 'Preventive Maintenance'],
    },
    {
      category: 'Plumbing',
      skills: ['Pipe Fitting', 'Drain Cleaning', 'Water Heater Installation', 'Fixture Installation', 'Backflow Prevention', 'Gas Line Installation', 'Soldering/Brazing', 'Residential Service', 'Commercial Plumbing', 'Code Compliance'],
    },
    {
      category: 'General Trades',
      skills: ['Blueprint Reading', 'Hand Tools', 'Power Tools', 'Heavy Equipment', 'Welding', 'Forklift Operation', 'Safety Protocols', 'Layout and Measurement', 'Material Handling', 'Job Site Communication'],
    },
  ],
  achievementPrompts: [
    {
      category: 'Project Completion',
      prompts: [
        'Completed {type} project for {company} on time and under budget, valued at ${amount}',
        'Installed {type} systems in new {building_type} construction, {number} stories high',
        'Retrofit {number} units in occupied residential building with zero disruption to tenants',
      ],
    },
    {
      category: 'Safety & Compliance',
      prompts: [
        'Maintained {number} days without a recordable safety incident',
        'Conducted {number} safety inspections with {percentage}% compliance rate',
        'Trained {number} apprentices in proper safety procedures and techniques',
      ],
    },
    {
      category: 'Efficiency & Quality',
      prompts: [
        'Improved installation efficiency by {percentage} through implementation of {method}',
        'Achieved {percentage} first-pass inspection rate on all work completed',
        'Reduced service call resolution time from {old} hours to {new} hours average',
      ],
    },
  ],
  summaryTemplate: 'Skilled {trade} with {years} years of experience in {sector} work. Licensed and certified in {licenses}. Proven expertise in {primary_skills}. Committed to safety, quality, and efficient completion of {type} projects.',
  jobTitles: [
    'Electrician',
    'Master Electrician',
    'HVAC Technician',
    'HVAC Installer',
    'Plumber',
    'Master Plumber',
    'Industrial Mechanic',
    'Welder',
    'Construction Foreman',
    'Facilities Technician',
  ],
}

// ─── ALL NICHE PACKS ─────────────────────────────────────────────────────────
export const NICHE_PACKS: Record<string, NichePack> = {
  general: {
    id: 'general',
    name: 'General Professional',
    tagline: 'All Industries, All Roles',
    description: 'A versatile template suitable for any industry or job function.',
    icon: '📄',
    color: '#6366f1',
    sections: [],
    skills: [],
    achievementPrompts: [],
    summaryTemplate: 'Professional with {years} years of experience in {industry}. Skilled in {skills}. Proven track record of {achievement}.',
    jobTitles: [],
  },
  cybersecurity: CYBERSECURITY_PACK,
  nursing: NURSING_PACK,
  skilled_trades: SKILLED_TRADES_PACK,
}

export function getNichePack(nicheId: string): NichePack {
  return NICHE_PACKS[nicheId] || NICHE_PACKS.general
}

export function getAllNichePacks(): NichePack[] {
  return Object.values(NICHE_PACKS)
}

export function getNicheJobTitles(nicheId: string): string[] {
  const pack = getNichePack(nicheId)
  return pack.jobTitles
}

export function getNicheSkillSuggestions(nicheId: string): string[] {
  const pack = getNichePack(nicheId)
  return pack.skills.flatMap(s => s.skills)
}
