import React, { useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  GitCompare,
  RotateCcw,
  Search,
  Sliders,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CandidateStatus,
  EducationLevel,
  JobPosting,
  ScoringWeights,
  ScreenedCandidate,
} from '../types/screening';
import { DEFAULT_SCORING_WEIGHTS, recalculateWeightedScore } from '../nlp/ranker';
import {
  exportCandidatesToCsv,
  exportCandidatesToPdf,
  getCandidateDisplayName,
} from '../utils/exportUtils';

interface ScreeningDashboardProps {
  job: JobPosting | null;
  candidates: ScreenedCandidate[];
  loading: boolean;
  blindMode: boolean;
  onToggleBlindMode: () => void;
  compareIds: string[];
  onToggleCompare: (candidateId: string) => void;
  onOpenCompareView: () => void;
  onSelectCandidate: (candidate: ScreenedCandidate, displayRank: number) => void;
  onUploadFiles: (files: FileList) => Promise<{ uploadedCount: number; warnings?: string[] } | void>;
  onPasteResume: (fileName: string, rawText: string) => Promise<void>;
  onLoadSampleResumes: () => Promise<void>;
  onUpdateStatus: (candidateId: string, status: CandidateStatus) => Promise<void>;
  onDeleteCandidate: (candidateId: string) => Promise<void>;
  onPurgeJobResumes: () => Promise<void>;
  onSaveWeights: (weights: ScoringWeights) => Promise<void>;
  onNavigateToJobs: () => void;
}

const EDUCATION_ORDER: Record<EducationLevel, number> = {
  Unspecified: 0,
  'High School': 1,
  Associate: 2,
  Bachelor: 3,
  Master: 4,
  PhD: 5,
};

export const ScreeningDashboard: React.FC<ScreeningDashboardProps> = ({
  job,
  candidates,
  loading,
  blindMode,
  onToggleBlindMode,
  compareIds,
  onToggleCompare,
  onOpenCompareView,
  onSelectCandidate,
  onUploadFiles,
  onPasteResume,
  onLoadSampleResumes,
  onUpdateStatus,
  onDeleteCandidate,
  onPurgeJobResumes,
  onSaveWeights,
  onNavigateToJobs,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live local weights for instant zero-latency re-ranking as sliders move
  const [liveWeights, setLiveWeights] = useState<ScoringWeights>(
    job?.weights ?? DEFAULT_SCORING_WEIGHTS
  );
  const [weightsJobId, setWeightsJobId] = useState<string | null>(job?.id ?? null);
  const [showWeightsPanel, setShowWeightsPanel] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);

  // Sync liveWeights when active job changes
  if (job && job.id !== weightsJobId) {
    setWeightsJobId(job.id);
    setLiveWeights(job.weights);
  }

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CandidateStatus>('all');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [minExpFilter, setMinExpFilter] = useState(0);
  const [educationFilter, setEducationFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'finalScore' | 'skillMatch' | 'semantic' | 'experience'>('finalScore');

  // Upload & paste state
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteFileName, setPasteFileName] = useState('Candidate_Resume.txt');
  const [pasteText, setPasteText] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  const weightsChanged = useMemo(() => {
    if (!job) return false;
    return (
      Math.abs(liveWeights.semantic - job.weights.semantic) > 0.005 ||
      Math.abs(liveWeights.skillMatch - job.weights.skillMatch) > 0.005 ||
      Math.abs(liveWeights.experience - job.weights.experience) > 0.005 ||
      Math.abs(liveWeights.education - job.weights.education) > 0.005
    );
  }, [job, liveWeights]);

  // Apply live weight recalculation without waiting for network
  const liveRankedCandidates = useMemo(() => {
    const withLiveScore = candidates.map((c) => {
      const liveFinal = recalculateWeightedScore(c.score, liveWeights);
      return {
        ...c,
        score: {
          ...c.score,
          finalScore: liveFinal,
        },
      };
    });

    return withLiveScore.sort((a, b) => {
      if (sortBy === 'skillMatch') return b.score.skillMatchScore - a.score.skillMatchScore;
      if (sortBy === 'semantic') return b.score.combinedSemantic - a.score.combinedSemantic;
      if (sortBy === 'experience') return b.parsed.yearsOfExperience - a.parsed.yearsOfExperience;
      return b.score.finalScore - a.score.finalScore;
    });
  }, [candidates, liveWeights, sortBy]);

  const availableSkills = useMemo(() => {
    const set = new Set<string>(job?.requiredSkills ?? []);
    for (const c of candidates) {
      for (const s of c.score.matchedSkills) set.add(s);
    }
    return Array.from(set).sort();
  }, [job, candidates]);

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return liveRankedCandidates.filter((c, idx) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (c.score.finalScore < minScoreFilter) return false;
      if (c.parsed.yearsOfExperience < minExpFilter) return false;
      if (
        educationFilter !== 'all' &&
        EDUCATION_ORDER[c.parsed.educationLevel] < EDUCATION_ORDER[educationFilter as EducationLevel]
      ) {
        return false;
      }
      if (skillFilter !== 'all') {
        const hasSkill =
          c.score.matchedSkills.some((s) => s.toLowerCase() === skillFilter.toLowerCase()) ||
          c.score.bonusSkills.some((s) => s.toLowerCase() === skillFilter.toLowerCase()) ||
          c.parsed.skills.some((s) => s.toLowerCase() === skillFilter.toLowerCase());
        if (!hasSkill) return false;
      }
      if (q) {
        const displayName = getCandidateDisplayName(c, idx, blindMode).toLowerCase();
        const haystack = [
          displayName,
          c.parsed.predictedCategory,
          c.score.matchedSkills.join(' '),
          c.score.bonusSkills.join(' '),
          c.score.explanation,
          blindMode ? '' : c.parsed.entities.organizations.join(' '),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    liveRankedCandidates,
    statusFilter,
    minScoreFilter,
    minExpFilter,
    educationFilter,
    skillFilter,
    searchQuery,
    blindMode,
  ]);

  const metrics = useMemo(() => {
    const total = liveRankedCandidates.length;
    const shortlisted = liveRankedCandidates.filter((c) => c.status === 'shortlisted').length;
    const strongMatches = liveRankedCandidates.filter((c) => c.score.finalScore >= 75).length;
    const avgScore =
      total > 0
        ? Math.round(
            (liveRankedCandidates.reduce((acc, c) => acc + c.score.finalScore, 0) / total) * 10
          ) / 10
        : 0;
    return { total, shortlisted, strongMatches, avgScore };
  }, [liveRankedCandidates]);

  async function handleFilesChosen(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadFeedback(null);
    try {
      const result = await onUploadFiles(files);
      const count = result?.uploadedCount ?? files.length;
      const warnSuffix =
        result?.warnings && result.warnings.length > 0 ? ` (${result.warnings[0]})` : '';
      setUploadFeedback({
        type: 'success',
        message: `Screened and ranked ${count} resume${count === 1 ? '' : 's'}${warnSuffix}.`,
      });
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to upload resumes.',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pasteText.trim().length < 30) {
      setUploadFeedback({ type: 'error', message: 'Please paste at least 30 characters of resume text.' });
      return;
    }
    setUploading(true);
    setUploadFeedback(null);
    try {
      await onPasteResume(pasteFileName.trim() || 'Pasted_Resume.txt', pasteText.trim());
      setPasteText('');
      setShowPasteBox(false);
      setUploadFeedback({ type: 'success', message: 'Parsed and ranked pasted resume.' });
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not screen pasted text.',
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveWeightsClick() {
    setSavingWeights(true);
    try {
      const sum =
        liveWeights.semantic +
        liveWeights.skillMatch +
        liveWeights.experience +
        liveWeights.education;
      const normalized =
        sum > 0
          ? {
              semantic: Math.round((liveWeights.semantic / sum) * 100) / 100,
              skillMatch: Math.round((liveWeights.skillMatch / sum) * 100) / 100,
              experience: Math.round((liveWeights.experience / sum) * 100) / 100,
              education: Math.round((liveWeights.education / sum) * 100) / 100,
            }
          : DEFAULT_SCORING_WEIGHTS;
      await onSaveWeights(normalized);
      setLiveWeights(normalized);
    } finally {
      setSavingWeights(false);
    }
  }

  const normalizedWeightPcts = useMemo(() => {
    const sum =
      liveWeights.semantic +
      liveWeights.skillMatch +
      liveWeights.experience +
      liveWeights.education;
    if (sum <= 0) return { semantic: 40, skillMatch: 35, experience: 15, education: 10 };
    return {
      semantic: Math.round((liveWeights.semantic / sum) * 100),
      skillMatch: Math.round((liveWeights.skillMatch / sum) * 100),
      experience: Math.round((liveWeights.experience / sum) * 100),
      education: Math.round((liveWeights.education / sum) * 100),
    };
  }, [liveWeights]);

  if (!job) {
    return (
      <div className="p-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto mt-10">
        <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-2">
          Create your first job posting
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Define role requirements or paste a job description to auto-extract required skills with NLP before uploading resumes.
        </p>
        <button
          type="button"
          onClick={onNavigateToJobs}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
        >
          Create Job Posting
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Job Header & Action Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{job.department}</span>
            <span aria-hidden="true">·</span>
            <span>{job.location}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{job.minExperience}+ yrs</span>
            <span aria-hidden="true">·</span>
            <span>{job.educationRequirement}</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {job.title}
          </h1>
        </div>

        <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleBlindMode}
            aria-pressed={blindMode}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              blindMode
                ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {blindMode ? 'Blind Screening: On' : 'Anonymized Mode'}
          </button>

          <button
            type="button"
            onClick={() => setShowWeightsPanel((prev) => !prev)}
            aria-expanded={showWeightsPanel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            Scoring Weights
          </button>

          <button
            type="button"
            onClick={() => exportCandidatesToCsv(job, filteredCandidates, blindMode)}
            disabled={filteredCandidates.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV
          </button>

          <button
            type="button"
            onClick={() => exportCandidatesToPdf(job, filteredCandidates, blindMode)}
            disabled={filteredCandidates.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Blind Mode Active Banner */}
      {blindMode && (
        <div
          role="status"
          className="px-4 py-3 rounded-lg bg-slate-900 dark:bg-blue-950/60 text-white border border-slate-800 dark:border-blue-800 flex items-center justify-between gap-4 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <EyeOff className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Anonymized Screening Mode Active:</strong> Candidate names, emails, phone numbers, gendered pronouns, and graduation year cues are masked across the table, detail view, comparison, and exports.
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleBlindMode}
            className="underline font-semibold text-blue-300 hover:text-white shrink-0 cursor-pointer"
          >
            Reveal Identities
          </button>
        </div>
      )}

      {/* 4-Column Summary Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Candidates Screened</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
            {metrics.total}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Average Match Score</p>
          <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
            {metrics.avgScore.toFixed(1)}%
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Strong Matches (75%+)</p>
          <p className="font-mono text-2xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
            {metrics.strongMatches}
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Shortlisted</p>
          <p className="font-mono text-2xl font-semibold text-blue-700 dark:text-blue-400 tabular-nums mt-1">
            {metrics.shortlisted}
          </p>
        </div>
      </div>

      {/* Adjustable Scoring Weights Panel */}
      {showWeightsPanel && (
        <section
          aria-label="Adjustable scoring weights"
          className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Scoring Formula Weights
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag any slider to re-rank candidates instantaneously. Ratios auto-normalize to 100%.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLiveWeights(DEFAULT_SCORING_WEIGHTS)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Default
              </button>
              <button
                type="button"
                onClick={handleSaveWeightsClick}
                disabled={savingWeights || !weightsChanged}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg disabled:opacity-40 cursor-pointer"
              >
                {savingWeights ? 'Saving...' : 'Save Weights'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(
              [
                { key: 'semantic', label: 'Semantic & TF-IDF', pct: normalizedWeightPcts.semantic },
                { key: 'skillMatch', label: 'Required Skills', pct: normalizedWeightPcts.skillMatch },
                { key: 'experience', label: 'Experience', pct: normalizedWeightPcts.experience },
                { key: 'education', label: 'Education', pct: normalizedWeightPcts.education },
              ] as const
            ).map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor={`weight-${item.key}`} className="font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </label>
                  <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                    {item.pct}%
                  </span>
                </div>
                <input
                  id={`weight-${item.key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(liveWeights[item.key] * 100)}
                  onChange={(e) =>
                    setLiveWeights((prev) => ({
                      ...prev,
                      [item.key]: Number(e.target.value) / 100,
                    }))
                  }
                  className="w-full cursor-pointer"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bulk Resume Upload Dropzone */}
      <section aria-label="Upload resumes" className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFilesChosen(e.dataTransfer.files);
          }}
          className={`rounded-lg border border-dashed p-5 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            dragActive
              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Bulk Resume Upload (PDF, DOCX, TXT)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Drag and drop up to 25 resumes at once. Text extraction, skill normalization, NER, and ranking run automatically.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={(e) => handleFilesChosen(e.target.files)}
              className="hidden"
              aria-label="Choose resume files"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? 'Screening Files...' : 'Upload Resumes'}
            </button>
            <button
              type="button"
              onClick={() => setShowPasteBox((v) => !v)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {showPasteBox ? 'Close Text Paste' : 'Paste Text'}
            </button>
            {candidates.length === 0 && (
              <button
                type="button"
                onClick={async () => {
                  setUploading(true);
                  try {
                    await onLoadSampleResumes();
                    setUploadFeedback({
                      type: 'success',
                      message: 'Loaded and ranked 10 sample resumes for this job posting.',
                    });
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading}
                className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Load 10 Sample Resumes
              </button>
            )}
          </div>
        </div>

        {showPasteBox && (
          <form onSubmit={handlePasteSubmit} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="paste-file-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reference File Name
                </label>
                <input
                  id="paste-file-name"
                  type="text"
                  value={pasteFileName}
                  onChange={(e) => setPasteFileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="md:col-span-2 flex items-end justify-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Analyzing...' : 'Screen Pasted Resume'}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="paste-resume-text" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resume Text
              </label>
              <textarea
                id="paste-resume-text"
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste full resume text including name, summary, experience with dates, education, and skills..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </form>
        )}

        {uploadFeedback && (
          <div
            role="status"
            className={`mt-3 px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between ${
              uploadFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
            }`}
          >
            <span>{uploadFeedback.message}</span>
            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setUploadFeedback(null)}
              className="p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search candidates by name, skill, or category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate, skill, or category..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Segmented Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'shortlisted', label: 'Shortlisted' },
                { id: 'saved', label: 'Saved' },
                { id: 'new', label: 'New' },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Numeric & Skill Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by minimum score"
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value={0}>Score: Any</option>
              <option value={50}>Score: 50%+</option>
              <option value={70}>Score: 70%+</option>
              <option value={80}>Score: 80%+</option>
            </select>

            <select
              aria-label="Filter by minimum experience"
              value={minExpFilter}
              onChange={(e) => setMinExpFilter(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value={0}>Experience: Any</option>
              <option value={2}>2+ years</option>
              <option value={4}>4+ years</option>
              <option value={6}>6+ years</option>
            </select>

            <select
              aria-label="Filter by education level"
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="all">Education: Any</option>
              <option value="Bachelor">Bachelor+</option>
              <option value="Master">Master+</option>
              <option value="PhD">PhD</option>
            </select>

            <select
              aria-label="Filter by skill"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="all">Skill: Any</option>
              {availableSkills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort candidates"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="finalScore">Sort: Final Score</option>
              <option value="skillMatch">Sort: Skill Match</option>
              <option value="semantic">Sort: Semantic Alignment</option>
              <option value="experience">Sort: Experience</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            {compareIds.length >= 2 && (
              <button
                type="button"
                onClick={onOpenCompareView}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer whitespace-nowrap"
              >
                <GitCompare className="w-3.5 h-3.5" />
                Compare Selected ({compareIds.length})
              </button>
            )}

            {candidates.length > 0 && (
              !confirmPurge ? (
                <button
                  type="button"
                  onClick={() => setConfirmPurge(true)}
                  className="text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer whitespace-nowrap"
                >
                  Purge All Resumes
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-600 dark:text-red-400 font-medium">Delete all {candidates.length}?</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await onPurgeJobResumes();
                      setConfirmPurge(false);
                    }}
                    className="px-2 py-1 rounded bg-red-600 text-white font-semibold cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(false)}
                    className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Candidate Ranking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3" aria-label="Loading ranked candidates">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1">
              {candidates.length === 0
                ? 'No resumes uploaded for this job yet'
                : 'No candidates match your active filters'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {candidates.length === 0
                ? 'Upload PDF, DOCX, or TXT resumes above or load the 10-resume sample batch to test the ranking engine.'
                : 'Relax your score, experience, skill, or status filters to see more applicants.'}
            </p>
            {candidates.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setMinScoreFilter(0);
                  setMinExpFilter(0);
                  setEducationFilter('all');
                  setSkillFilter('all');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 w-10">
                    <span className="sr-only">Compare</span>
                  </th>
                  <th className="py-3 px-3 w-12">Rank</th>
                  <th className="py-3 px-4 min-w-[210px]">Candidate</th>
                  <th className="py-3 px-4 min-w-[150px]">Match Score</th>
                  <th className="py-3 px-4 min-w-[260px]">Matched & Missing Skills</th>
                  <th className="py-3 px-4 min-w-[155px]">Profile</th>
                  <th className="py-3 px-4 min-w-[150px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-sm">
                {filteredCandidates.map((candidate, idx) => {
                  const displayName = getCandidateDisplayName(candidate, idx, blindMode);
                  const isChecked = compareIds.includes(candidate.id);
                  const scoreVal = candidate.score.finalScore;
                  const barColor =
                    scoreVal >= 75
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : scoreVal >= 55
                        ? 'bg-amber-500'
                        : 'bg-red-500';
                  const scoreTextColor =
                    scoreVal >= 75
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : scoreVal >= 55
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400';

                  return (
                    <tr
                      key={candidate.id}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-top">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isChecked && compareIds.length >= 3}
                          onChange={() => onToggleCompare(candidate.id)}
                          aria-label={`Select ${displayName} for comparison`}
                          className="mt-1 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-3 align-top font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        #{idx + 1}
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <button
                          type="button"
                          onClick={() => onSelectCandidate(candidate, idx + 1)}
                          className="text-left group cursor-pointer"
                        >
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                            {displayName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {blindMode
                              ? 'Identity masked'
                              : candidate.parsed.entities.email ?? candidate.fileName}
                          </p>
                        </button>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{candidate.parsed.predictedCategory}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              candidate.status === 'shortlisted'
                                ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                : candidate.status === 'rejected'
                                  ? 'font-semibold text-red-600 dark:text-red-400'
                                  : candidate.status === 'saved'
                                    ? 'font-semibold text-blue-700 dark:text-blue-400'
                                    : ''
                            }
                          >
                            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className={`font-mono text-base font-bold tabular-nums ${scoreTextColor}`}>
                            {scoreVal.toFixed(1)}%
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                            Sem {Math.round(candidate.score.combinedSemantic * 100)}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${Math.min(100, Math.max(4, scoreVal))}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-snug">
                          {candidate.score.explanation}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.score.matchedSkills.slice(0, 5).map((skill) => (
                            <span
                              key={`m-${skill}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80"
                            >
                              + {skill}
                            </span>
                          ))}
                          {candidate.score.matchedSkills.length > 5 && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 self-center font-mono">
                              +{candidate.score.matchedSkills.length - 5} more
                            </span>
                          )}
                        </div>
                        {candidate.score.missingSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {candidate.score.missingSkills.slice(0, 3).map((skill) => (
                              <span
                                key={`x-${skill}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-900/80"
                              >
                                - {skill}
                              </span>
                            ))}
                            {candidate.score.missingSkills.length > 3 && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 self-center font-mono">
                                -{candidate.score.missingSkills.length - 3} gaps
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {candidate.parsed.yearsOfExperience} yrs exp
                        </p>
                        <p>{candidate.parsed.educationLevel}</p>
                        <p className="text-slate-500 dark:text-slate-400">
                          Skills: {candidate.score.matchedSkills.length}/{job.requiredSkills.length}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectCandidate(candidate, idx + 1)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStatus(
                                candidate.id,
                                candidate.status === 'shortlisted' ? 'new' : 'shortlisted'
                              )
                            }
                            aria-label={`Shortlist ${displayName}`}
                            title="Shortlist candidate"
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              candidate.status === 'shortlisted'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStatus(
                                candidate.id,
                                candidate.status === 'saved' ? 'new' : 'saved'
                              )
                            }
                            aria-label={`Save ${displayName}`}
                            title="Save for later"
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              candidate.status === 'saved'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStatus(
                                candidate.id,
                                candidate.status === 'rejected' ? 'new' : 'rejected'
                              )
                            }
                            aria-label={`Reject ${displayName}`}
                            title="Reject candidate"
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              candidate.status === 'rejected'
                                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                                : 'text-slate-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCandidate(candidate.id)}
                            aria-label={`Delete ${displayName}`}
                            title="Permanently delete resume"
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
