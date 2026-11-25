import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import {
  createJobForUser,
  deleteCandidateForUser,
  deleteJobForUser,
  getJobByIdForUser,
  insertScreenedResumes,
  listAllCandidatesForUser,
  listCandidatesForJob,
  listJobsForUser,
  purgeJobResumesForUser,
  updateCandidateStatusForUser,
  updateJobForUser,
} from './src/server/db';
import {
  AuthenticatedRequest,
  createUserAccount,
  findUserByEmail,
  getOrCreateDemoRecruiter,
  requireAuth,
  signAuthToken,
  toUserProfile,
  verifyPassword,
} from './src/server/auth';
import { extractResumeFileText, isSupportedResumeFile } from './src/server/fileParser';
import { OPENAPI_SPEC, renderSwaggerDocsHtml } from './src/server/openapi';
import {
  extractEducationLevel,
  extractRequiredSkillsFromJobDescription,
  extractYearsOfExperience,
} from './src/nlp/extractor';
import { getClassifierEvaluationMetrics } from './src/nlp/classifier';
import {
  getSkillDisplayName,
  getTaxonomyStats,
  SKILL_BY_CANONICAL,
  SKILLS_TAXONOMY,
} from './src/nlp/skillsTaxonomy';
import { DEMO_RESUMES } from './src/nlp/sampleCorpus';
import { AnalyticsSummary } from './src/types/screening';

const app = express();
app.use(express.json({ limit: '5mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 25 },
});

// Validation schemas
const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Please provide a valid email address').max(120),
  organization: z.string().trim().min(2, 'Organization is required').max(100).default('TalentLens Recruiting'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const LoginSchema = z.object({
  email: z.string().trim().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
});

const EducationEnum = z.enum(['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Unspecified']);

const WeightsSchema = z.object({
  semantic: z.number().min(0).max(1),
  skillMatch: z.number().min(0).max(1),
  experience: z.number().min(0).max(1),
  education: z.number().min(0).max(1),
});

const CreateJobSchema = z.object({
  title: z.string().trim().min(2, 'Job title is required').max(120),
  department: z.string().trim().min(1).max(80).default('Engineering'),
  location: z.string().trim().min(1).max(80).default('Remote'),
  description: z.string().trim().min(20, 'Job description must be at least 20 characters').max(15000),
  requiredSkills: z.array(z.string().trim().min(1).max(60)).min(1, 'Add at least 1 required skill').max(40),
  minExperience: z.number().min(0).max(30).default(2),
  educationRequirement: EducationEnum.default('Bachelor'),
  weights: WeightsSchema.optional(),
});

const UpdateJobSchema = CreateJobSchema.partial();

const StatusSchema = z.object({
  status: z.enum(['new', 'shortlisted', 'saved', 'rejected']),
});

const PasteResumeSchema = z.object({
  fileName: z.string().trim().min(1).max(120).default('Pasted_Resume.txt'),
  rawText: z.string().trim().min(30, 'Resume text must be at least 30 characters').max(80000),
});

// Public Health & OpenAPI Docs
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'TalentLens NLP Screening API' });
});

app.get('/api/openapi.json', (_req, res) => {
  res.json(OPENAPI_SPEC);
});

app.get('/api/docs', (_req, res) => {
  res.type('html').send(renderSwaggerDocsHtml());
});

// Authentication routes
app.post('/api/auth/register', (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid registration data' });
    return;
  }
  const existing = findUserByEmail(parsed.data.email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }
  const user = createUserAccount(parsed.data);
  const token = signAuthToken(user);
  res.status(201).json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid login input' });
    return;
  }
  const userRow = findUserByEmail(parsed.data.email);
  if (!userRow || !verifyPassword(parsed.data.password, userRow.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }
  const user = toUserProfile(userRow);
  const token = signAuthToken(user);
  res.json({ token, user });
});

app.post('/api/auth/demo', (_req, res) => {
  const user = getOrCreateDemoRecruiter();
  const token = signAuthToken(user);
  res.json({ token, user });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// NLP utility endpoints
app.post('/api/nlp/extract-skills', requireAuth, (req, res) => {
  const schema = z.object({ text: z.string().trim().min(10, 'Provide job description text').max(20000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid text input' });
    return;
  }
  const skills = extractRequiredSkillsFromJobDescription(parsed.data.text);
  const minExperience = extractYearsOfExperience(parsed.data.text);
  const education = extractEducationLevel(parsed.data.text);
  res.json({
    skills,
    suggestedMinExperience: Math.min(15, Math.round(minExperience)),
    suggestedEducation: education.level === 'Unspecified' ? 'Bachelor' : education.level,
  });
});

app.get('/api/taxonomy', requireAuth, (_req, res) => {
  res.json({
    stats: getTaxonomyStats(),
    skills: SKILLS_TAXONOMY.map((s) => ({
      canonical: s.canonical,
      displayName: s.displayName,
      category: s.category,
      aliases: s.aliases,
      escoCode: s.escoCode,
    })),
  });
});

// Job Posting CRUD
app.get('/api/jobs', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const jobs = listJobsForUser(userId);
  res.json({ jobs });
});

app.post('/api/jobs', requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = CreateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid job payload' });
    return;
  }
  const job = createJobForUser(req.user!.id, parsed.data);
  res.status(201).json({ job });
});

app.patch('/api/jobs/:jobId', requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = UpdateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid job update' });
    return;
  }
  const updated = updateJobForUser(String(req.params.jobId), req.user!.id, parsed.data);
  if (!updated) {
    res.status(404).json({ error: 'Job posting not found.' });
    return;
  }
  const candidates = listCandidatesForJob(updated.id, req.user!.id);
  res.json({ job: updated, candidates });
});

app.delete('/api/jobs/:jobId', requireAuth, (req: AuthenticatedRequest, res) => {
  const ok = deleteJobForUser(String(req.params.jobId), req.user!.id);
  if (!ok) {
    res.status(404).json({ error: 'Job posting not found.' });
    return;
  }
  res.json({ deleted: true });
});

// Resumes & Screening
app.get('/api/jobs/:jobId/resumes', requireAuth, (req: AuthenticatedRequest, res) => {
  const job = getJobByIdForUser(String(req.params.jobId), req.user!.id);
  if (!job) {
    res.status(404).json({ error: 'Job posting not found.' });
    return;
  }
  const candidates = listCandidatesForJob(job.id, req.user!.id);
  res.json({ job, candidates });
});

app.post(
  '/api/jobs/:jobId/resumes/upload',
  requireAuth,
  upload.array('files', 25),
  async (req: AuthenticatedRequest, res) => {
    const job = getJobByIdForUser(String(req.params.jobId), req.user!.id);
    if (!job) {
      res.status(404).json({ error: 'Job posting not found.' });
      return;
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      res.status(400).json({ error: 'Please select at least one PDF, DOCX, or TXT resume file.' });
      return;
    }

    const extractedItems: Array<{
      fileName: string;
      rawText: string;
      extractionMethod: 'pdf' | 'docx' | 'txt' | 'text' | 'ocr-fallback';
    }> = [];
    const warnings: string[] = [];

    for (const file of files) {
      const safeName = path.basename(file.originalname).replace(/[^\w.\-\s()]/g, '_');
      if (!isSupportedResumeFile(safeName)) {
        warnings.push(`Skipped ${safeName}: unsupported format (use PDF, DOCX, or TXT).`);
        continue;
      }
      try {
        const result = await extractResumeFileText(file.buffer, safeName);
        if (result.warning) {
          warnings.push(`${safeName}: ${result.warning}`);
        }
        extractedItems.push({
          fileName: safeName,
          rawText: result.text,
          extractionMethod: result.method,
        });
      } catch (err) {
        warnings.push(
          `Failed to parse ${safeName}: ${err instanceof Error ? err.message : 'parse error'}`
        );
      }
    }

    if (extractedItems.length === 0) {
      res.status(400).json({
        error: warnings[0] ?? 'No valid resumes could be extracted from the uploaded files.',
        warnings,
      });
      return;
    }

    const created = insertScreenedResumes(job, req.user!.id, extractedItems);
    const allCandidates = listCandidatesForJob(job.id, req.user!.id);
    res.status(201).json({
      uploadedCount: created.length,
      warnings,
      created,
      candidates: allCandidates,
    });
  }
);

app.post('/api/jobs/:jobId/resumes/text', requireAuth, (req: AuthenticatedRequest, res) => {
  const job = getJobByIdForUser(String(req.params.jobId), req.user!.id);
  if (!job) {
    res.status(404).json({ error: 'Job posting not found.' });
    return;
  }
  const parsed = PasteResumeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid resume text' });
    return;
  }
  const created = insertScreenedResumes(job, req.user!.id, [
    {
      fileName: parsed.data.fileName,
      rawText: parsed.data.rawText,
      extractionMethod: 'text',
    },
  ]);
  const allCandidates = listCandidatesForJob(job.id, req.user!.id);
  res.status(201).json({ created: created[0], candidates: allCandidates });
});

app.post('/api/jobs/:jobId/resumes/load-samples', requireAuth, (req: AuthenticatedRequest, res) => {
  const job = getJobByIdForUser(String(req.params.jobId), req.user!.id);
  if (!job) {
    res.status(404).json({ error: 'Job posting not found.' });
    return;
  }
  const created = insertScreenedResumes(
    job,
    req.user!.id,
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
  const allCandidates = listCandidatesForJob(job.id, req.user!.id);
  res.status(201).json({ uploadedCount: created.length, candidates: allCandidates });
});

app.delete('/api/jobs/:jobId/resumes', requireAuth, (req: AuthenticatedRequest, res) => {
  const job = getJobByIdForUser(String(req.params.jobId), req.user!.id);
  if (!job) {
    res.status(404).json({ error: 'Job posting not found.' });
    return;
  }
  const purgedCount = purgeJobResumesForUser(job.id, req.user!.id);
  res.json({ purgedCount });
});

app.patch('/api/resumes/:resumeId/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid candidate status.' });
    return;
  }
  const updated = updateCandidateStatusForUser(
    String(req.params.resumeId),
    req.user!.id,
    parsed.data.status
  );
  if (!updated) {
    res.status(404).json({ error: 'Candidate resume not found.' });
    return;
  }
  res.json({ updated: true, status: parsed.data.status });
});

app.delete('/api/resumes/:resumeId', requireAuth, (req: AuthenticatedRequest, res) => {
  const deleted = deleteCandidateForUser(String(req.params.resumeId), req.user!.id);
  if (!deleted) {
    res.status(404).json({ error: 'Candidate resume not found.' });
    return;
  }
  res.json({ deleted: true });
});

// Analytics & Model Evaluation
app.get('/api/analytics', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const jobs = listJobsForUser(userId);
  const candidates = listAllCandidatesForUser(userId);
  const classifier = getClassifierEvaluationMetrics();
  const taxonomyStats = getTaxonomyStats();

  // Skill frequency
  const skillCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const buckets = [
    { range: '0-39%', min: 0, max: 39.99, count: 0 },
    { range: '40-59%', min: 40, max: 59.99, count: 0 },
    { range: '60-74%', min: 60, max: 74.99, count: 0 },
    { range: '75-89%', min: 75, max: 89.99, count: 0 },
    { range: '90-100%', min: 90, max: 100.1, count: 0 },
  ];

  let scoreSum = 0;
  let shortlistedCount = 0;

  for (const c of candidates) {
    scoreSum += c.score.finalScore;
    if (c.status === 'shortlisted') shortlistedCount += 1;

    for (const s of c.parsed.skills) {
      skillCounts.set(s, (skillCounts.get(s) ?? 0) + 1);
    }
    const cat = c.parsed.predictedCategory;
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);

    for (const b of buckets) {
      if (c.score.finalScore >= b.min && c.score.finalScore <= b.max) {
        b.count += 1;
        break;
      }
    }
  }

  const skillFrequency = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([canonical, count]) => ({
      skill: getSkillDisplayName(canonical),
      count,
      category: SKILL_BY_CANONICAL.get(canonical)?.category ?? 'Other',
    }));

  const categoryDistribution = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  const summary: AnalyticsSummary = {
    classifier,
    datasetStats: {
      totalSkillsInTaxonomy: taxonomyStats.totalSkills,
      totalAliasesMapped: taxonomyStats.totalAliases,
      totalJobs: jobs.length,
      totalCandidatesScreened: candidates.length,
      shortlistedCount,
      averageMatchScore:
        candidates.length > 0 ? Math.round((scoreSum / candidates.length) * 10) / 10 : 0,
    },
    skillFrequency,
    scoreDistribution: buckets.map(({ range, count }) => ({ range, count })),
    categoryDistribution,
  };

  res.json(summary);
});

// Reset / ensure demo recruiter has default job ready on startup
getOrCreateDemoRecruiter();

// Serve Vite in dev or static dist in production
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TalentLens server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TalentLens server:', err);
  process.exit(1);
});
