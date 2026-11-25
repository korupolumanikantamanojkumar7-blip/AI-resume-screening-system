import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CandidateStatus,
  EducationLevel,
  JobPosting,
  ParsedResumeData,
  ScoreBreakdown,
  ScoringWeights,
  ScreenedCandidate,
} from '../types/screening';
import {
  DEFAULT_SCORING_WEIGHTS,
  parseResumeText,
  recalculateWeightedScore,
  scoreCandidateAgainstJob,
} from '../nlp/ranker';
import { DEMO_RESUMES, SAMPLE_JOB_POSTING } from '../nlp/sampleCorpus';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'talentlens.db');
export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    organization TEXT NOT NULL DEFAULT 'TalentLens Recruiting',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'recruiter',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Engineering',
    location TEXT NOT NULL DEFAULT 'Remote',
    description TEXT NOT NULL,
    required_skills_json TEXT NOT NULL,
    min_experience REAL NOT NULL DEFAULT 0,
    education_requirement TEXT NOT NULL DEFAULT 'Bachelor',
    weights_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    parsed_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    resume_id TEXT UNIQUE NOT NULL,
    job_id TEXT NOT NULL,
    final_score REAL NOT NULL,
    score_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
  CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON resumes(job_id);
  CREATE INDEX IF NOT EXISTS idx_scores_job_id ON scores(job_id);
`);

export interface DbUserRow {
  id: string;
  name: string;
  email: string;
  organization: string;
  password_hash: string;
  role: string;
  created_at: string;
}

interface DbJobRow {
  id: string;
  user_id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  required_skills_json: string;
  min_experience: number;
  education_requirement: string;
  weights_json: string;
  created_at: string;
  candidate_count?: number;
}

interface DbCandidateJoinRow {
  id: string;
  job_id: string;
  file_name: string;
  parsed_json: string;
  status: string;
  created_at: string;
  score_json: string;
}

function mapJobRow(row: DbJobRow): JobPosting {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    department: row.department,
    location: row.location,
    description: row.description,
    requiredSkills: JSON.parse(row.required_skills_json) as string[],
    minExperience: row.min_experience,
    educationRequirement: row.education_requirement as EducationLevel,
    weights: JSON.parse(row.weights_json) as ScoringWeights,
    createdAt: row.created_at,
    candidateCount: row.candidate_count ?? 0,
  };
}

export function listJobsForUser(userId: string): JobPosting[] {
  const rows = db
    .prepare(
      `SELECT j.*, COUNT(r.id) as candidate_count
       FROM jobs j
       LEFT JOIN resumes r ON r.job_id = j.id
       WHERE j.user_id = ?
       GROUP BY j.id
       ORDER BY j.created_at DESC`
    )
    .all(userId) as DbJobRow[];
  return rows.map(mapJobRow);
}

export function getJobByIdForUser(jobId: string, userId: string): JobPosting | null {
  const row = db
    .prepare(
      `SELECT j.*, COUNT(r.id) as candidate_count
       FROM jobs j
       LEFT JOIN resumes r ON r.job_id = j.id
       WHERE j.id = ? AND j.user_id = ?
       GROUP BY j.id`
    )
    .get(jobId, userId) as DbJobRow | undefined;
  return row ? mapJobRow(row) : null;
}

export function createJobForUser(
  userId: string,
  input: {
    title: string;
    department: string;
    location: string;
    description: string;
    requiredSkills: string[];
    minExperience: number;
    educationRequirement: EducationLevel;
    weights?: ScoringWeights;
  }
): JobPosting {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const weights = input.weights ?? DEFAULT_SCORING_WEIGHTS;

  db.prepare(
    `INSERT INTO jobs (
      id, user_id, title, department, location, description,
      required_skills_json, min_experience, education_requirement, weights_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.title,
    input.department,
    input.location,
    input.description,
    JSON.stringify(input.requiredSkills),
    input.minExperience,
    input.educationRequirement,
    JSON.stringify(weights),
    now
  );

  return {
    id,
    userId,
    title: input.title,
    department: input.department,
    location: input.location,
    description: input.description,
    requiredSkills: input.requiredSkills,
    minExperience: input.minExperience,
    educationRequirement: input.educationRequirement,
    weights,
    createdAt: now,
    candidateCount: 0,
  };
}

export function updateJobForUser(
  jobId: string,
  userId: string,
  updates: {
    title?: string;
    department?: string;
    location?: string;
    description?: string;
    requiredSkills?: string[];
    minExperience?: number;
    educationRequirement?: EducationLevel;
    weights?: ScoringWeights;
  }
): JobPosting | null {
  const existing = getJobByIdForUser(jobId, userId);
  if (!existing) return null;

  const merged: JobPosting = {
    ...existing,
    ...updates,
    weights: updates.weights ?? existing.weights,
    requiredSkills: updates.requiredSkills ?? existing.requiredSkills,
  };

  db.prepare(
    `UPDATE jobs
     SET title = ?, department = ?, location = ?, description = ?,
         required_skills_json = ?, min_experience = ?, education_requirement = ?, weights_json = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    merged.title,
    merged.department,
    merged.location,
    merged.description,
    JSON.stringify(merged.requiredSkills),
    merged.minExperience,
    merged.educationRequirement,
    JSON.stringify(merged.weights),
    jobId,
    userId
  );

  // Re-score existing candidates for this job cleanly
  rescoreJobCandidates(jobId, userId, merged, Boolean(updates.description || updates.requiredSkills || updates.minExperience !== undefined || updates.educationRequirement));

  return getJobByIdForUser(jobId, userId);
}

export function rescoreJobCandidates(
  jobId: string,
  userId: string,
  job: JobPosting,
  fullRescore: boolean
): void {
  const rows = db
    .prepare(
      `SELECT r.id, r.parsed_json, s.score_json
       FROM resumes r
       JOIN scores s ON s.resume_id = r.id
       WHERE r.job_id = ? AND r.user_id = ?`
    )
    .all(jobId, userId) as Array<{ id: string; parsed_json: string; score_json: string }>;

  if (rows.length === 0) return;

  const corpusTexts = fullRescore
    ? rows.map((r) => (JSON.parse(r.parsed_json) as ParsedResumeData).rawText)
    : [];

  const updateStmt = db.prepare(
    `UPDATE scores SET final_score = ?, score_json = ?, updated_at = ? WHERE resume_id = ?`
  );
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const row of rows) {
      let nextScore: ScoreBreakdown;
      if (fullRescore) {
        const parsed = JSON.parse(row.parsed_json) as ParsedResumeData;
        nextScore = scoreCandidateAgainstJob(parsed, job, corpusTexts);
      } else {
        const existingScore = JSON.parse(row.score_json) as ScoreBreakdown;
        nextScore = {
          ...existingScore,
          finalScore: recalculateWeightedScore(existingScore, job.weights),
        };
      }
      updateStmt.run(nextScore.finalScore, JSON.stringify(nextScore), now, row.id);
    }
  });
  tx();
}

export function deleteJobForUser(jobId: string, userId: string): boolean {
  const result = db.prepare(`DELETE FROM jobs WHERE id = ? AND user_id = ?`).run(jobId, userId);
  return result.changes > 0;
}

export function listCandidatesForJob(jobId: string, userId: string): ScreenedCandidate[] {
  const rows = db
    .prepare(
      `SELECT r.id, r.job_id, r.file_name, r.parsed_json, r.status, r.created_at, s.score_json
       FROM resumes r
       JOIN scores s ON s.resume_id = r.id
       WHERE r.job_id = ? AND r.user_id = ?
       ORDER BY s.final_score DESC, r.created_at DESC`
    )
    .all(jobId, userId) as DbCandidateJoinRow[];

  return rows.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    fileName: row.file_name,
    status: row.status as CandidateStatus,
    createdAt: row.created_at,
    parsed: JSON.parse(row.parsed_json) as ParsedResumeData,
    score: JSON.parse(row.score_json) as ScoreBreakdown,
  }));
}

export function listAllCandidatesForUser(userId: string): ScreenedCandidate[] {
  const rows = db
    .prepare(
      `SELECT r.id, r.job_id, r.file_name, r.parsed_json, r.status, r.created_at, s.score_json
       FROM resumes r
       JOIN scores s ON s.resume_id = r.id
       WHERE r.user_id = ?
       ORDER BY s.final_score DESC`
    )
    .all(userId) as DbCandidateJoinRow[];

  return rows.map((row) => ({
    id: row.id,
    jobId: row.job_id,
    fileName: row.file_name,
    status: row.status as CandidateStatus,
    createdAt: row.created_at,
    parsed: JSON.parse(row.parsed_json) as ParsedResumeData,
    score: JSON.parse(row.score_json) as ScoreBreakdown,
  }));
}

export function insertScreenedResumes(
  job: JobPosting,
  userId: string,
  items: Array<{
    fileName: string;
    rawText: string;
    extractionMethod: ParsedResumeData['extractionMethod'];
  }>
): ScreenedCandidate[] {
  const existingTexts = (
    db
      .prepare(`SELECT raw_text FROM resumes WHERE job_id = ? AND user_id = ?`)
      .all(job.id, userId) as Array<{ raw_text: string }>
  ).map((r) => r.raw_text);

  const corpusTexts = [...existingTexts, ...items.map((i) => i.rawText)];

  const insertResumeStmt = db.prepare(
    `INSERT INTO resumes (id, job_id, user_id, file_name, raw_text, parsed_json, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`
  );
  const insertScoreStmt = db.prepare(
    `INSERT INTO scores (id, resume_id, job_id, final_score, score_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const created: ScreenedCandidate[] = [];
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    for (const item of items) {
      const resumeId = crypto.randomUUID();
      const scoreId = crypto.randomUUID();
      const parsed = parseResumeText(item.rawText, item.fileName, item.extractionMethod);
      const score = scoreCandidateAgainstJob(parsed, job, corpusTexts);

      insertResumeStmt.run(
        resumeId,
        job.id,
        userId,
        item.fileName,
        item.rawText,
        JSON.stringify(parsed),
        now
      );
      insertScoreStmt.run(
        scoreId,
        resumeId,
        job.id,
        score.finalScore,
        JSON.stringify(score),
        now
      );

      created.push({
        id: resumeId,
        jobId: job.id,
        fileName: item.fileName,
        status: 'new',
        createdAt: now,
        parsed,
        score,
      });
    }
  });
  tx();

  return created.sort((a, b) => b.score.finalScore - a.score.finalScore);
}

export function updateCandidateStatusForUser(
  resumeId: string,
  userId: string,
  status: CandidateStatus
): boolean {
  const res = db
    .prepare(`UPDATE resumes SET status = ? WHERE id = ? AND user_id = ?`)
    .run(status, resumeId, userId);
  return res.changes > 0;
}

export function deleteCandidateForUser(resumeId: string, userId: string): boolean {
  const res = db
    .prepare(`DELETE FROM resumes WHERE id = ? AND user_id = ?`)
    .run(resumeId, userId);
  return res.changes > 0;
}

export function purgeJobResumesForUser(jobId: string, userId: string): number {
  const res = db
    .prepare(`DELETE FROM resumes WHERE job_id = ? AND user_id = ?`)
    .run(jobId, userId);
  return res.changes;
}

export function seedDemoWorkspaceIfEmpty(userId: string): JobPosting {
  const existingJobs = listJobsForUser(userId);
  if (existingJobs.length > 0) {
    return existingJobs[0];
  }

  const job = createJobForUser(userId, {
    title: SAMPLE_JOB_POSTING.title,
    department: SAMPLE_JOB_POSTING.department,
    location: SAMPLE_JOB_POSTING.location,
    description: SAMPLE_JOB_POSTING.description,
    requiredSkills: SAMPLE_JOB_POSTING.requiredSkills,
    minExperience: SAMPLE_JOB_POSTING.minExperience,
    educationRequirement: SAMPLE_JOB_POSTING.educationRequirement,
    weights: DEFAULT_SCORING_WEIGHTS,
  });

  const seeded = insertScreenedResumes(
    job,
    userId,
    DEMO_RESUMES.map((r) => ({
      fileName: r.fileName,
      rawText: r.text,
      extractionMethod: r.fileName.endsWith('.pdf')
        ? 'pdf'
        : r.fileName.endsWith('.docx')
          ? 'docx'
          : 'txt',
    }))
  );

  // Pre-mark the top 2 candidates as shortlisted so recruiters immediately see workflow states
  if (seeded[0]) updateCandidateStatusForUser(seeded[0].id, userId, 'shortlisted');
  if (seeded[1]) updateCandidateStatusForUser(seeded[1].id, userId, 'shortlisted');
  if (seeded[seeded.length - 1]) {
    updateCandidateStatusForUser(seeded[seeded.length - 1].id, userId, 'rejected');
  }

  return getJobByIdForUser(job.id, userId) ?? job;
}
