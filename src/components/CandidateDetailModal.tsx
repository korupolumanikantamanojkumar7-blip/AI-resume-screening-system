import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bookmark, Check, Lightbulb, Trash2, X } from 'lucide-react';
import { CandidateStatus, ResumeSections, ScreenedCandidate } from '../types/screening';
import { anonymizeCandidateText } from '../nlp/extractor';
import { getCandidateDisplayName } from '../utils/exportUtils';

interface CandidateDetailModalProps {
  candidate: ScreenedCandidate;
  rank: number;
  blindMode: boolean;
  onClose: () => void;
  onUpdateStatus: (candidateId: string, status: CandidateStatus) => Promise<void>;
  onDelete: (candidateId: string) => Promise<void>;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  rank,
  blindMode,
  onClose,
  onUpdateStatus,
  onDelete,
}) => {
  const [sectionTab, setSectionTab] = useState<keyof ResumeSections | 'raw'>('experience');
  const displayName = getCandidateDisplayName(candidate, rank - 1, blindMode);

  const chartData = useMemo(
    () => [
      { metric: 'Final', value: Math.round(candidate.score.finalScore), fill: '#1d4ed8' },
      { metric: 'Semantic', value: Math.round(candidate.score.semanticSimilarity * 100), fill: '#0284c7' },
      { metric: 'TF-IDF', value: Math.round(candidate.score.tfidfSimilarity * 100), fill: '#0ea5e9' },
      { metric: 'Skills', value: Math.round(candidate.score.skillMatchScore * 100), fill: '#16a34a' },
      { metric: 'Experience', value: Math.round(candidate.score.experienceScore * 100), fill: '#d97706' },
      { metric: 'Education', value: Math.round(candidate.score.educationScore * 100), fill: '#475569' },
    ],
    [candidate]
  );

  const displayedSectionText = useMemo(() => {
    const rawContent =
      sectionTab === 'raw'
        ? candidate.parsed.rawText
        : candidate.parsed.sections[sectionTab] ||
          `No explicit "${sectionTab}" heading detected in this resume. Switch to Full Text to view complete extracted content.`;
    return blindMode
      ? anonymizeCandidateText(rawContent, candidate.parsed.entities, displayName)
      : rawContent;
  }, [sectionTab, candidate, blindMode, displayName]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-detail-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-4xl bg-white dark:bg-[#0F172A] h-full overflow-y-auto border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-6 py-4 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                Rank #{rank}
              </span>
              <span aria-hidden="true">·</span>
              <span>{candidate.parsed.predictedCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {Math.round(candidate.parsed.categoryConfidence * 100)}% classifier confidence
              </span>
            </div>
            <h2
              id="candidate-detail-title"
              className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5"
            >
              {displayName}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onUpdateStatus(
                  candidate.id,
                  candidate.status === 'shortlisted' ? 'new' : 'shortlisted'
                )
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                candidate.status === 'shortlisted'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {candidate.status === 'shortlisted' ? 'Shortlisted' : 'Shortlist'}
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateStatus(candidate.id, candidate.status === 'saved' ? 'new' : 'saved')
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                candidate.status === 'saved'
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdateStatus(candidate.id, candidate.status === 'rejected' ? 'new' : 'rejected')
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors ${
                candidate.status === 'rejected'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/50'
              }`}
            >
              Reject
            </button>
            <button
              type="button"
              onClick={async () => {
                await onDelete(candidate.id);
                onClose();
              }}
              aria-label="Permanently delete candidate resume"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close candidate details"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-7">
          {/* Score Breakdown & Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Overall Match Score</p>
                <p className="font-mono text-4xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {candidate.score.finalScore.toFixed(1)}%
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {candidate.score.explanation}
              </p>
              <div className="pt-2 grid grid-cols-2 gap-3 text-xs border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Experience Detected</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {candidate.parsed.yearsOfExperience} years
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Education Level</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {candidate.parsed.educationLevel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Extraction Engine</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {candidate.parsed.extractionMethod.toUpperCase()} ({candidate.parsed.tokensCount} tokens)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Source File</span>
                  <span className="text-slate-900 dark:text-white truncate block">
                    {blindMode ? '[REDACTED FILENAME]' : candidate.fileName}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 h-56 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Score Component Breakdown (%)
              </p>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip
                    formatter={(v) => [`${Number(v ?? 0)}%`, 'Score']}
                    contentStyle={{
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.metric} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skills Match & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5">
                Matched Required Skills ({candidate.score.matchedSkills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.score.matchedSkills.length > 0 ? (
                  candidate.score.matchedSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      + {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">None detected</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5">
                Missing Required Skills ({candidate.score.missingSkills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.score.missingSkills.length > 0 ? (
                  candidate.score.missingSkills.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900"
                    >
                      - {s}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    100% required skills covered
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5">
                Additional Extracted Skills ({candidate.score.bonusSkills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {candidate.score.bonusSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Skill-Gap Suggestions */}
          {candidate.score.skillGapSuggestions.length > 0 && (
            <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Actionable Skill-Gap Suggestions
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {candidate.score.skillGapSuggestions.map((gap) => (
                  <div
                    key={gap.skill}
                    className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{gap.skill}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {gap.category} · {gap.priority} Priority
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {gap.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted NER Entities */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mb-3">
              Named Entity Recognition (NER) Output
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Contact</span>
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  {blindMode ? '[REDACTED IN BLIND MODE]' : candidate.parsed.entities.email ?? 'Not detected'}
                </p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {blindMode ? '[REDACTED PHONE]' : candidate.parsed.entities.phone ?? 'No phone listed'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Organizations</span>
                <p className="text-slate-900 dark:text-slate-100">
                  {candidate.parsed.entities.organizations.length > 0
                    ? candidate.parsed.entities.organizations.join(', ')
                    : 'Not detected'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Locations & Timeline</span>
                <p className="text-slate-900 dark:text-slate-100">
                  {candidate.parsed.entities.locations.join(', ') || 'Remote / Unspecified'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-mono text-[11px]">
                  {blindMode
                    ? '[DATES REDACTED]'
                    : candidate.parsed.entities.dates.slice(0, 3).join(' · ') || 'No dates'}
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Parsed Resume Viewer */}
          <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Segmented Resume Document
              </h3>
              <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(
                  [
                    { id: 'experience', label: 'Experience' },
                    { id: 'education', label: 'Education' },
                    { id: 'skills', label: 'Skills' },
                    { id: 'summary', label: 'Summary' },
                    { id: 'projects', label: 'Projects' },
                    { id: 'raw', label: 'Full Text' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSectionTab(tab.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                      sectionTab === tab.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto">
              {displayedSectionText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
