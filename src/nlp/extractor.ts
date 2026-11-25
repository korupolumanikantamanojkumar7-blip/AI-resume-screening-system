import { EducationLevel, ExtractedEntities, ResumeSections } from '../types/screening';
import { SKILLS_TAXONOMY, getSkillDisplayName } from './skillsTaxonomy';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Precompile boundary-aware PhraseMatcher regexes for every alias in skills_master
interface CompiledSkillPattern {
  canonical: string;
  category: string;
  regex: RegExp;
}

const COMPILED_SKILL_PATTERNS: CompiledSkillPattern[] = [];

for (const entry of SKILLS_TAXONOMY) {
  for (const alias of entry.aliases) {
    const escaped = escapeRegex(alias);
    // For symbols like c++, c#, .net, standard \b fails on non-word characters
    const startsWithWord = /^[a-z0-9]/i.test(alias);
    const endsWithWord = /[a-z0-9]$/i.test(alias);
    const leftBoundary = startsWithWord ? '(?<![a-z0-9])' : '(?<![a-z0-9+#])';
    const rightBoundary = endsWithWord ? '(?![a-z0-9])' : '(?![a-z0-9+#])';
    const regex = new RegExp(`${leftBoundary}${escaped}${rightBoundary}`, 'i');
    COMPILED_SKILL_PATTERNS.push({
      canonical: entry.canonical,
      category: entry.category,
      regex,
    });
  }
}

export function extractSkills(text: string): {
  skills: string[];
  skillCategories: Record<string, string[]>;
} {
  const foundSet = new Set<string>();
  const categories: Record<string, string[]> = {};

  for (const pattern of COMPILED_SKILL_PATTERNS) {
    if (foundSet.has(pattern.canonical)) continue;
    if (pattern.regex.test(text)) {
      foundSet.add(pattern.canonical);
      if (!categories[pattern.category]) {
        categories[pattern.category] = [];
      }
      categories[pattern.category].push(pattern.canonical);
    }
  }

  return {
    skills: Array.from(foundSet).sort(),
    skillCategories: categories,
  };
}

const EDUCATION_RANK: Record<EducationLevel, number> = {
  Unspecified: 0,
  'High School': 1,
  Associate: 2,
  Bachelor: 3,
  Master: 4,
  PhD: 5,
};

export function getEducationRank(level: EducationLevel): number {
  return EDUCATION_RANK[level] ?? 0;
}

export function extractEducationLevel(text: string): {
  level: EducationLevel;
  mentions: string[];
} {
  const mentions: string[] = [];
  let level: EducationLevel = 'Unspecified';

  const checks: Array<{ level: EducationLevel; regex: RegExp }> = [
    {
      level: 'PhD',
      regex: /\b(?:ph\.?d\.?|doctor of philosophy|doctorate|d\.?phil\.?)\b/gi,
    },
    {
      level: 'Master',
      regex: /\b(?:m\.?s\.?c?\.?|master(?:'s)?|m\.?tech\.?|m\.?eng\.?|mba|master of (?:science|engineering|arts|business|computer))\b/gi,
    },
    {
      level: 'Bachelor',
      regex: /\b(?:b\.?s\.?c?\.?|b\.?tech\.?|b\.?e\.?|b\.?eng\.?|bachelor(?:'s)?|b\.?a\.?|bachelor of (?:science|technology|engineering|arts))\b/gi,
    },
    {
      level: 'Associate',
      regex: /\b(?:associate(?:'s)? degree|a\.?a\.?s?\.?|a\.?s\.? degree)\b/gi,
    },
    {
      level: 'High School',
      regex: /\b(?:high school diploma|ged|secondary school)\b/gi,
    },
  ];

  // Collect education lines/snippets for NER display
  const eduLineRegex = /(?:university|institute|college|school of|b\.?s\.?|b\.?tech|m\.?s\.?|m\.?tech|mba|ph\.?d|bachelor|master|doctorate)[^\n]{0,90}/gi;
  const lineMatches = text.match(eduLineRegex) ?? [];
  for (const m of lineMatches) {
    const clean = m.trim().replace(/\s+/g, ' ');
    if (clean.length >= 6 && !mentions.includes(clean) && mentions.length < 5) {
      mentions.push(clean);
    }
  }

  for (const check of checks) {
    if (check.regex.test(text)) {
      if (EDUCATION_RANK[check.level] > EDUCATION_RANK[level]) {
        level = check.level;
      }
    }
  }

  return { level, mentions };
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

export function extractYearsOfExperience(text: string, referenceYear = 2026): number {
  let explicitMax = 0;

  // 1. Explicit years patterns: "6+ years of experience", "5 years experience", "over 7 years"
  const explicitPatterns = [
    /(?:over\s+)?(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|industry\s+|relevant\s+|hands-on\s+|work\s+)?experience/gi,
    /experience\s*[:\-]\s*(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)/gi,
    /(\d{1,2})\s*\+?\s*(?:years?|yrs?)\s+(?:building|developing|leading|working|in\s+(?:software|data|nlp|engineering|product|hr|devops|security))/gi,
  ];

  for (const regex of explicitPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const val = parseFloat(match[1]);
      if (!Number.isNaN(val) && val > 0 && val <= 45) {
        explicitMax = Math.max(explicitMax, val);
      }
    }
  }

  // 2. Date-range extraction from Experience section (or full text excluding education lines)
  const sections = segmentResumeSections(text);
  const expText = sections.experience.length > 40 ? sections.experience : text;

  const intervals: Array<[number, number]> = [];
  const dateRangeRegex =
    /(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(19\d{2}|20[0-2]\d)\s*(?:-|–|—|to)\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(19\d{2}|20[0-2]\d|present|current|now)/gi;

  let match: RegExpExecArray | null;
  while ((match = dateRangeRegex.exec(expText)) !== null) {
    const startMonth = match[1] ? MONTH_MAP[match[1].toLowerCase()] ?? 0 : 0;
    const startYear = parseInt(match[2], 10);
    const endRaw = match[4].toLowerCase();
    const isPresent = endRaw === 'present' || endRaw === 'current' || endRaw === 'now';
    const endYear = isPresent ? referenceYear : parseInt(match[4], 10);
    const endMonth = isPresent ? 10 : match[3] ? MONTH_MAP[match[3].toLowerCase()] ?? 11 : 11;

    const startVal = startYear + startMonth / 12;
    const endVal = endYear + endMonth / 12;

    if (endVal >= startVal && startYear >= 1985 && endVal - startVal <= 40) {
      intervals.push([startVal, endVal]);
    }
  }

  // Merge overlapping intervals so concurrent jobs do not double-count
  let dateDerivedYears = 0;
  if (intervals.length > 0) {
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = intervals[i];
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1]);
      } else {
        merged.push(curr);
      }
    }
    dateDerivedYears = merged.reduce((sum, [s, e]) => sum + Math.max(0.25, e - s), 0);
    dateDerivedYears = Math.round(dateDerivedYears * 10) / 10;
  }

  // Prefer explicit statement if reasonable, otherwise blend / choose date-derived
  if (explicitMax > 0 && dateDerivedYears > 0) {
    return Math.round(Math.max(explicitMax, Math.min(dateDerivedYears, explicitMax + 3)) * 10) / 10;
  }
  return Math.round(Math.max(explicitMax, dateDerivedYears) * 10) / 10;
}

const SECTION_HEADERS: Array<{ key: keyof ResumeSections; pattern: RegExp }> = [
  { key: 'summary', pattern: /^(?:professional\s+)?(?:summary|profile|objective|about\s+me)\s*:?$/i },
  { key: 'experience', pattern: /^(?:work\s+|professional\s+|relevant\s+)?(?:experience|employment(?:\s+history)?|career\s+history)\s*:?$/i },
  { key: 'education', pattern: /^(?:education(?:al\s+background)?|academic(?:\s+qualifications)?)\s*:?$/i },
  { key: 'skills', pattern: /^(?:technical\s+|core\s+|key\s+)?(?:skills|competencies|technologies|tech\s+stack)\s*:?$/i },
  { key: 'projects', pattern: /^(?:selected\s+|key\s+|personal\s+|academic\s+)?projects?\s*:?$/i },
  { key: 'certifications', pattern: /^(?:certifications?|licenses?(?:\s*&\s*certifications?)?|awards?|publications?)\s*:?$/i },
];

export function segmentResumeSections(text: string): ResumeSections {
  const sections: ResumeSections = {
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    certifications: '',
    other: '',
  };

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let current: keyof ResumeSections = 'other';

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (sections[current].length > 0) {
        sections[current] += '\n';
      }
      continue;
    }

    const normalizedHeader = trimmed.replace(/^[\-#*=_\s]+|[\-#*=_\s]+$/g, '');
    let matchedHeader = false;
    if (normalizedHeader.length <= 42) {
      for (const h of SECTION_HEADERS) {
        if (h.pattern.test(normalizedHeader)) {
          current = h.key;
          matchedHeader = true;
          break;
        }
      }
    }
    if (!matchedHeader) {
      sections[current] += (sections[current] ? '\n' : '') + trimmed;
    }
  }

  for (const key of Object.keys(sections) as Array<keyof ResumeSections>) {
    sections[key] = sections[key].trim();
  }
  return sections;
}

const KNOWN_LOCATIONS = [
  'San Francisco', 'New York', 'Seattle', 'Austin', 'Boston', 'Chicago', 'Los Angeles',
  'Denver', 'Atlanta', 'Remote', 'London', 'Toronto', 'Bengaluru', 'Bangalore', 'Hyderabad',
  'Mumbai', 'Pune', 'Delhi', 'Singapore', 'Berlin', 'Dublin', 'Zurich', 'Amsterdam',
  'California', 'Texas', 'Washington', 'Massachusetts', 'Illinois', 'India', 'United States', 'UK',
];

const IGNORE_NAME_LINES = /^(?:resume|curriculum vitae|cv|profile|contact|email|phone|summary|experience|skills)$/i;

export function extractEntities(text: string, fallbackFileName?: string): ExtractedEntities {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/);

  // Extract candidate name from first non-empty lines
  const topLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 6);

  let name = '';
  for (const line of topLines) {
    const cleanedLine = line
      .replace(/[|•(].*$/, '')
      .replace(/^(?:mr\.|mrs\.|ms\.|miss|dr\.)\s+/i, '')
      .trim();
    if (
      cleanedLine.length >= 3 &&
      cleanedLine.length <= 45 &&
      !cleanedLine.includes('@') &&
      !/\d/.test(cleanedLine) &&
      !IGNORE_NAME_LINES.test(cleanedLine) &&
      /^[A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3}$/.test(cleanedLine)
    ) {
      name = cleanedLine;
      break;
    }
  }

  if (!name && fallbackFileName) {
    name = fallbackFileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b(?:resume|cv)\b/gi, '')
      .trim();
    if (name) {
      name = name
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }
  if (!name) {
    name = 'Unnamed Candidate';
  }

  // Locations
  const locations: string[] = [];
  for (const loc of KNOWN_LOCATIONS) {
    const re = new RegExp(`\\b${escapeRegex(loc)}\\b`, 'i');
    if (re.test(text) && !locations.includes(loc) && locations.length < 4) {
      locations.push(loc);
    }
  }

  // Organizations (single-line, no sentence period crossing)
  const orgSet = new Set<string>();
  const orgRegex = /\b([A-Z][A-Za-z0-9&-]+(?:[ \t]+[A-Z][A-Za-z0-9&-]+){0,3}[ \t]+(?:Inc\.?|Corp\.?|LLC|Ltd\.?|Technologies|Systems|Labs|Analytics|AI|Solutions|Software|Bank|Health|Cloud|University|Institute|College))\b/g;
  let orgMatch: RegExpExecArray | null;
  while ((orgMatch = orgRegex.exec(text)) !== null) {
    const candidateOrg = orgMatch[1].trim();
    if (candidateOrg.length >= 4 && candidateOrg.length <= 55 && !candidateOrg.includes('\n')) {
      orgSet.add(candidateOrg);
    }
    if (orgSet.size >= 6) break;
  }

  // Also check "at <Org>" or "| <Org> |" in experience section
  const atOrgRegex = /\b(?:at|@)\s+([A-Z][A-Za-z0-9&]+(?:\s+[A-Z][A-Za-z0-9&]+){0,2})\b/g;
  while ((orgMatch = atOrgRegex.exec(text)) !== null && orgSet.size < 6) {
    const candidateOrg = orgMatch[1].trim();
    if (!KNOWN_LOCATIONS.includes(candidateOrg) && candidateOrg.length >= 3) {
      orgSet.add(candidateOrg);
    }
  }

  // Dates
  const dateMatches =
    text.match(
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+)?(?:19|20)\d{2}(?:\s*(?:-|–|—|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+)?(?:(?:19|20)\d{2}|Present|Current))?/gi
    ) ?? [];
  const dates = Array.from(new Set(dateMatches.map((d) => d.trim()))).slice(0, 8);

  const edu = extractEducationLevel(text);

  return {
    name,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    locations,
    organizations: Array.from(orgSet),
    dates,
    educationMentions: edu.mentions,
  };
}

/**
 * Bias-aware Anonymized Screening Mode redaction:
 * Removes name, email, phone, gender honorifics/pronouns, and age/graduation year cues.
 */
export function anonymizeCandidateText(
  text: string,
  entities: ExtractedEntities,
  anonymousHandle: string
): string {
  let redacted = text;
  if (entities.name && entities.name !== 'Unnamed Candidate') {
    const parts = entities.name.split(/\s+/).filter((p) => p.length > 2);
    redacted = redacted.replace(new RegExp(escapeRegex(entities.name), 'gi'), anonymousHandle);
    for (const part of parts) {
      redacted = redacted.replace(new RegExp(`\\b${escapeRegex(part)}\\b`, 'gi'), '[REDACTED]');
    }
  }
  if (entities.email) {
    redacted = redacted.replace(new RegExp(escapeRegex(entities.email), 'gi'), '[REDACTED EMAIL]');
  }
  if (entities.phone) {
    redacted = redacted.replace(new RegExp(escapeRegex(entities.phone), 'gi'), '[REDACTED PHONE]');
  }
  // Redact gendered titles/pronouns & age/DOB references
  redacted = redacted
    .replace(/\b(?:mr\.|mrs\.|ms\.|miss|he\/him|she\/her|he|she|him|her|his|hers|himself|herself)\b/gi, '[REDACTED]')
    .replace(/\b(?:age|dob|date of birth)\s*[:\-]?\s*[^\n,;]+/gi, '[REDACTED AGE]')
    .replace(/\b(?:class of|graduated(?:\s+in)?)\s+(?:19|20)\d{2}\b/gi, 'Graduated [YEAR REDACTED]');

  return redacted;
}

export function extractRequiredSkillsFromJobDescription(description: string): string[] {
  const { skills } = extractSkills(description);
  return skills.map((s) => getSkillDisplayName(s));
}
