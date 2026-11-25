import React, { useState } from 'react';
import { ArrowRight, Plus, Trash2, Wand2, X } from 'lucide-react';
import { EducationLevel, JobPosting } from '../types/screening';

interface JobsManagerProps {
  jobs: JobPosting[];
  selectedJobId: string | null;
  authToken: string;
  onSelectJob: (jobId: string) => void;
  onCreateJob: (payload: {
    title: string;
    department: string;
    location: string;
    description: string;
    requiredSkills: string[];
    minExperience: number;
    educationRequirement: EducationLevel;
  }) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
}

const EDUCATION_LEVELS: EducationLevel[] = [
  'Unspecified',
  'High School',
  'Associate',
  'Bachelor',
  'Master',
  'PhD',
];

export const JobsManager: React.FC<JobsManagerProps> = ({
  jobs,
  selectedJobId,
  authToken,
  onSelectJob,
  onCreateJob,
  onDeleteJob,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [location, setLocation] = useState('Remote');
  const [minExperience, setMinExperience] = useState(3);
  const [educationRequirement, setEducationRequirement] = useState<EducationLevel>('Bachelor');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function addSkill(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (!requiredSkills.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
      setRequiredSkills((prev) => [...prev, cleaned]);
    }
    setSkillInput('');
  }

  async function handleAutoExtractSkills() {
    if (description.trim().length < 20) {
      setFeedback({
        type: 'error',
        message: 'Paste a job description (at least 20 characters) before auto-extracting skills.',
      });
      return;
    }
    setExtracting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/nlp/extract-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error ?? 'Skill extraction failed.' });
        return;
      }
      const extracted: string[] = data.skills ?? [];
      setRequiredSkills((prev) => {
        const merged = [...prev];
        for (const s of extracted) {
          if (!merged.some((m) => m.toLowerCase() === s.toLowerCase())) {
            merged.push(s);
          }
        }
        return merged;
      });
      if (typeof data.suggestedMinExperience === 'number' && data.suggestedMinExperience > 0) {
        setMinExperience(data.suggestedMinExperience);
      }
      if (data.suggestedEducation) {
        setEducationRequirement(data.suggestedEducation);
      }
      setFeedback({
        type: 'success',
        message: `Extracted ${extracted.length} canonical skills from the job description using ESCO PhraseMatcher.`,
      });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to reach NLP skill extractor.' });
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (title.trim().length < 2) {
      setFeedback({ type: 'error', message: 'Enter a job title.' });
      return;
    }
    if (description.trim().length < 20) {
      setFeedback({ type: 'error', message: 'Enter a job description (at least 20 characters).' });
      return;
    }
    if (requiredSkills.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Add at least 1 required skill or click "Auto-Extract Skills".',
      });
      return;
    }

    setSubmitting(true);
    try {
      await onCreateJob({
        title: title.trim(),
        department: department.trim() || 'Engineering',
        location: location.trim() || 'Remote',
        description: description.trim(),
        requiredSkills,
        minExperience,
        educationRequirement,
      });
      setTitle('');
      setDescription('');
      setRequiredSkills([]);
      setMinExperience(3);
      setEducationRequirement('Bachelor');
      setFeedback({ type: 'success', message: 'Job posting created and selected for screening.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create job posting.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Create Job Form */}
      <section className="xl:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="mb-5">
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Create Job Posting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Paste any job description and run NLP skill extraction to automatically populate canonical skill requirements.
          </p>
        </div>

        {feedback && (
          <div
            role="status"
            className={`mb-4 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="job-title" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Job Title
              </label>
              <input
                id="job-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Applied Machine Learning Engineer"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="job-dept" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                id="job-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="job-loc" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                id="job-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="job-exp" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Minimum Experience (Years)
              </label>
              <input
                id="job-exp"
                type="number"
                min={0}
                max={25}
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="job-edu" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Education Requirement
              </label>
              <select
                id="job-edu"
                value={educationRequirement}
                onChange={(e) => setEducationRequirement(e.target.value as EducationLevel)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="job-desc" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Job Description
              </label>
              <button
                type="button"
                onClick={handleAutoExtractSkills}
                disabled={extracting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {extracting ? 'Extracting...' : 'Auto-Extract Skills'}
              </button>
            </div>
            <textarea
              id="job-desc"
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job description here (responsibilities, stack, qualifications)..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="job-skill-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Required Skills ({requiredSkills.length})
            </label>
            <div className="flex gap-2 mb-2.5">
              <input
                id="job-skill-input"
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                placeholder="Type a skill (e.g., Python, Docker, FastAPI) and press Enter"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      aria-label={`Remove skill ${skill}`}
                      onClick={() => setRequiredSkills((prev) => prev.filter((s) => s !== skill))}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating Job...' : 'Save Job Posting'}
            </button>
          </div>
        </form>
      </section>

      {/* Existing Jobs List */}
      <section className="xl:col-span-5 space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Active Job Postings ({jobs.length})
        </h2>

        {jobs.length === 0 ? (
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            No job postings yet. Create one using the form.
          </div>
        ) : (
          jobs.map((job) => {
            const isSelected = job.id === selectedJobId;
            return (
              <div
                key={job.id}
                className={`p-5 rounded-xl bg-white dark:bg-slate-900 border transition-colors ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {job.department} · {job.location} · {job.minExperience}+ yrs · {job.educationRequirement}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0">
                    {job.candidateCount ?? 0} resumes
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2">
                  {job.requiredSkills.join(', ')}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onSelectJob(job.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Open Screening Dashboard
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteJob(job.id)}
                    aria-label={`Delete job ${job.title}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
