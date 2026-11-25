import {
  EducationLevel,
  ParsedResumeData,
  ScoreBreakdown,
  ScoringWeights,
  SkillGapSuggestion,
} from '../types/screening';
import { cleanText, tokenizeAndLemmatize } from './preprocessor';
import {
  extractEducationLevel,
  extractEntities,
  extractSkills,
  extractYearsOfExperience,
  getEducationRank,
  segmentResumeSections,
} from './extractor';
import {
  SKILL_BY_CANONICAL,
  getSkillDisplayName,
  normalizeSkillName,
} from './skillsTaxonomy';
import { computeDocumentSimilarities } from './vectorizer';
import { classifyResumeText } from './classifier';

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  semantic: 0.4,
  skillMatch: 0.35,
  experience: 0.15,
  education: 0.1,
};

export function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const sum =
    Math.max(0, weights.semantic) +
    Math.max(0, weights.skillMatch) +
    Math.max(0, weights.experience) +
    Math.max(0, weights.education);
  if (sum <= 0) return { ...DEFAULT_SCORING_WEIGHTS };
  return {
    semantic: Math.max(0, weights.semantic) / sum,
    skillMatch: Math.max(0, weights.skillMatch) / sum,
    experience: Math.max(0, weights.experience) / sum,
    education: Math.max(0, weights.education) / sum,
  };
}

export function parseResumeText(
  rawText: string,
  fileName = 'resume.txt',
  extractionMethod: ParsedResumeData['extractionMethod'] = 'text'
): ParsedResumeData {
  const cleanedText = cleanText(rawText);
  const tokens = tokenizeAndLemmatize(rawText);
  const { skills, skillCategories } = extractSkills(rawText);
  const entities = extractEntities(rawText, fileName);
  const yearsOfExperience = extractYearsOfExperience(rawText);
  const { level: educationLevel } = extractEducationLevel(rawText);
  const sections = segmentResumeSections(rawText);
  const classification = classifyResumeText(rawText);

  return {
    rawText,
    cleanedText,
    tokensCount: tokens.length,
    skills,
    skillCategories,
    entities,
    yearsOfExperience,
    educationLevel,
    sections,
    predictedCategory: classification.category,
    categoryConfidence: classification.confidence,
    categoryScores: classification.scores,
    extractionMethod,
  };
}

export function computeExperienceScore(candidateYears: number, minRequiredYears: number): number {
  if (minRequiredYears <= 0) {
    return candidateYears > 0 ? 1 : 0.7;
  }
  if (candidateYears >= minRequiredYears) {
    return 1;
  }
  const ratio = candidateYears / minRequiredYears;
  return Math.round(Math.max(0.15, Math.min(1, ratio)) * 1000) / 1000;
}

export function computeEducationScore(
  candidateLevel: EducationLevel,
  requiredLevel: EducationLevel
): number {
  const reqRank = getEducationRank(requiredLevel);
  const candRank = getEducationRank(candidateLevel);
  if (reqRank === 0) return 1;
  if (candRank >= reqRank) return 1;
  if (candRank === 0) return 0.35;
  return Math.round(Math.max(0.35, candRank / reqRank) * 1000) / 1000;
}

export function buildSkillGapSuggestions(missingCanonicalSkills: string[]): SkillGapSuggestion[] {
  return missingCanonicalSkills.slice(0, 6).map((canonical, idx) => {
    const entry = SKILL_BY_CANONICAL.get(canonical);
    return {
      skill: getSkillDisplayName(canonical),
      category: entry?.category ?? 'Domain Skill',
      priority: idx < 3 ? 'High' : 'Medium',
      suggestion:
        entry?.upskillingSuggestion ??
        `Build a practical portfolio project demonstrating applied proficiency in ${getSkillDisplayName(canonical)}.`,
    };
  });
}

export interface JobRequirementInput {
  title: string;
  description: string;
  requiredSkills: string[];
  minExperience: number;
  educationRequirement: EducationLevel;
  weights?: ScoringWeights;
}

export function scoreCandidateAgainstJob(
  parsed: ParsedResumeData,
  job: JobRequirementInput,
  corpusTexts: string[] = []
): ScoreBreakdown {
  const weights = normalizeWeights(job.weights ?? DEFAULT_SCORING_WEIGHTS);

  // Canonicalize required job skills & candidate skills
  const requiredCanonical = Array.from(
    new Set(job.requiredSkills.map((s) => normalizeSkillName(s)).filter(Boolean))
  );
  const candidateCanonicalSet = new Set(parsed.skills.map((s) => normalizeSkillName(s)));

  const matchedCanonical = requiredCanonical.filter((s) => candidateCanonicalSet.has(s));
  const missingCanonical = requiredCanonical.filter((s) => !candidateCanonicalSet.has(s));
  const bonusCanonical = Array.from(candidateCanonicalSet).filter(
    (s) => !requiredCanonical.includes(s)
  );

  // Skill Match Score = matched required skills / total required skills
  const skillMatchScore =
    requiredCanonical.length > 0
      ? Math.round((matchedCanonical.length / requiredCanonical.length) * 1000) / 1000
      : 0.75;

  // Semantic + TF-IDF Cosine Similarity
  const jdFull = `${job.title}\n${job.description}\nRequired Skills: ${job.requiredSkills.join(', ')}`;
  const { tfidfSimilarity, semanticSimilarity, combinedSemantic } = computeDocumentSimilarities(
    parsed.rawText,
    jdFull,
    corpusTexts
  );

  const experienceScore = computeExperienceScore(parsed.yearsOfExperience, job.minExperience);
  const educationScore = computeEducationScore(parsed.educationLevel, job.educationRequirement);

  const weightedRaw =
    weights.semantic * combinedSemantic +
    weights.skillMatch * skillMatchScore +
    weights.experience * experienceScore +
    weights.education * educationScore;

  const finalScore = Math.round(Math.max(0, Math.min(1, weightedRaw)) * 1000) / 10; // 0.0 to 100.0

  const matchedSkills = matchedCanonical.map(getSkillDisplayName);
  const missingSkills = missingCanonical.map(getSkillDisplayName);
  const bonusSkills = bonusCanonical.slice(0, 8).map(getSkillDisplayName);

  // Compose concise, transparent explanation
  const explanationParts: string[] = [];
  if (requiredCanonical.length > 0) {
    explanationParts.push(
      `Matches ${matchedSkills.length}/${requiredCanonical.length} required skills (${Math.round(skillMatchScore * 100)}%)`
    );
  }
  explanationParts.push(
    `with ${Math.round(combinedSemantic * 100)}% semantic alignment to the role description.`
  );
  if (parsed.yearsOfExperience >= job.minExperience) {
    explanationParts.push(
      `Meets the ${job.minExperience}+ yr experience bar (${parsed.yearsOfExperience} yrs detected).`
    );
  } else {
    explanationParts.push(
      `Below the ${job.minExperience}+ yr target (${parsed.yearsOfExperience} yrs detected).`
    );
  }
  if (missingSkills.length > 0) {
    explanationParts.push(
      `Key gaps: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? ` (+${missingSkills.length - 3} more)` : ''}.`
    );
  } else {
    explanationParts.push('Covers all listed core skill requirements.');
  }

  return {
    finalScore,
    tfidfSimilarity,
    semanticSimilarity,
    combinedSemantic,
    skillMatchScore,
    experienceScore,
    educationScore,
    matchedSkills,
    missingSkills,
    bonusSkills,
    explanation: explanationParts.join(' '),
    skillGapSuggestions: buildSkillGapSuggestions(missingCanonical),
  };
}

/**
 * Recompute weighted final score dynamically when recruiter drags weight sliders
 * (fast pure calculation without re-parsing text).
 */
export function recalculateWeightedScore(
  score: ScoreBreakdown,
  weights: ScoringWeights
): number {
  const w = normalizeWeights(weights);
  const raw =
    w.semantic * score.combinedSemantic +
    w.skillMatch * score.skillMatchScore +
    w.experience * score.experienceScore +
    w.education * score.educationScore;
  return Math.round(Math.max(0, Math.min(1, raw)) * 1000) / 10;
}

/**
 * Computes Precision@K for ranking evaluation given ranked relevance booleans.
 */
export function computePrecisionAtK(rankedRelevant: boolean[], k: number): number {
  if (k <= 0 || rankedRelevant.length === 0) return 0;
  const slice = rankedRelevant.slice(0, k);
  const hits = slice.filter(Boolean).length;
  return Math.round((hits / Math.min(k, slice.length)) * 1000) / 1000;
}
