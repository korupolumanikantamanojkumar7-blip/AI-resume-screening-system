export type EducationLevel = 'High School' | 'Associate' | 'Bachelor' | 'Master' | 'PhD' | 'Unspecified';

export type CandidateStatus = 'new' | 'shortlisted' | 'saved' | 'rejected';

export interface ScoringWeights {
  semantic: number;
  skillMatch: number;
  experience: number;
  education: number;
}

export interface ExtractedEntities {
  name: string;
  email: string | null;
  phone: string | null;
  locations: string[];
  organizations: string[];
  dates: string[];
  educationMentions: string[];
}

export interface ResumeSections {
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  certifications: string;
  other: string;
}

export interface SkillGapSuggestion {
  skill: string;
  category: string;
  priority: 'High' | 'Medium';
  suggestion: string;
}

export interface ParsedResumeData {
  rawText: string;
  cleanedText: string;
  tokensCount: number;
  skills: string[];
  skillCategories: Record<string, string[]>;
  entities: ExtractedEntities;
  yearsOfExperience: number;
  educationLevel: EducationLevel;
  sections: ResumeSections;
  predictedCategory: string;
  categoryConfidence: number;
  categoryScores: Array<{ category: string; score: number }>;
  extractionMethod: 'pdf' | 'docx' | 'txt' | 'text' | 'ocr-fallback';
}

export interface ScoreBreakdown {
  finalScore: number;
  tfidfSimilarity: number;
  semanticSimilarity: number;
  combinedSemantic: number;
  skillMatchScore: number;
  experienceScore: number;
  educationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];
  explanation: string;
  skillGapSuggestions: SkillGapSuggestion[];
}

export interface JobPosting {
  id: string;
  userId: string;
  title: string;
  department: string;
  location: string;
  description: string;
  requiredSkills: string[];
  minExperience: number;
  educationRequirement: EducationLevel;
  weights: ScoringWeights;
  createdAt: string;
  candidateCount?: number;
}

export interface ScreenedCandidate {
  id: string;
  jobId: string;
  fileName: string;
  status: CandidateStatus;
  createdAt: string;
  parsed: ParsedResumeData;
  score: ScoreBreakdown;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
}

export interface ClassifierMetrics {
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  precisionAt3: number;
  precisionAt5: number;
  totalSamples: number;
  trainSamples: number;
  testSamples: number;
  categories: string[];
  perClassMetrics: Array<{
    category: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusionMatrix: number[][];
}

export interface AnalyticsSummary {
  classifier: ClassifierMetrics;
  datasetStats: {
    totalSkillsInTaxonomy: number;
    totalAliasesMapped: number;
    totalJobs: number;
    totalCandidatesScreened: number;
    shortlistedCount: number;
    averageMatchScore: number;
  };
  skillFrequency: Array<{ skill: string; count: number; category: string }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
}
