import React from 'react';
import { Check, Minus, X } from 'lucide-react';
import { JobPosting, ScreenedCandidate } from '../types/screening';
import { getCandidateDisplayName } from '../utils/exportUtils';

interface CompareCandidatesViewProps {
  job: JobPosting | null;
  allCandidates: ScreenedCandidate[];
  compareIds: string[];
  blindMode: boolean;
  onToggleCompare: (candidateId: string) => void;
  onClearCompare: () => void;
  onBackToScreening: () => void;
}

export const CompareCandidatesView: React.FC<CompareCandidatesViewProps> = ({
  job,
  allCandidates,
  compareIds,
  blindMode,
  onToggleCompare,
  onClearCompare,
  onBackToScreening,
}) => {
  const selected = compareIds
    .map((id) => {
      const idx = allCandidates.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      return { candidate: allCandidates[idx], rank: idx + 1 };
    })
    .filter((item): item is { candidate: ScreenedCandidate; rank: number } => item !== null);

  // Quick-pick up to 3 top candidates if user hasn't picked 2 yet
  const quickPickTop3 = () => {
    onClearCompare();
    allCandidates.slice(0, 3).forEach((c) => onToggleCompare(c.id));
  };

  if (!job) {
    return (
      <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
        Select an active job posting to compare candidates.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Side-by-Side Candidate Comparison
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare 2 to 3 candidates across semantic alignment, required skill coverage, experience, and education.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selected.length >= 2 && allCandidates.length >= 2 && (
            <button
              type="button"
              onClick={quickPickTop3}
              className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
            >
              Reset to Top 3
            </button>
          )}
          <button
            type="button"
            onClick={onBackToScreening}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Back to Rankings
          </button>
        </div>
      </div>

      {/* Candidate Picker Strip */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
          Select up to 3 candidates ({selected.length}/3 selected):
        </p>
        <div className="flex flex-wrap gap-2">
          {allCandidates.slice(0, 12).map((c, idx) => {
            const active = compareIds.includes(c.id);
            const label = getCandidateDisplayName(c, idx, blindMode);
            return (
              <button
                key={c.id}
                type="button"
                disabled={!active && compareIds.length >= 3}
                onClick={() => onToggleCompare(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                #{idx + 1} {label} ({c.score.finalScore.toFixed(0)}%)
              </button>
            );
          })}
        </div>
      </div>

      {selected.length < 2 ? (
        <div className="p-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="font-display text-base font-semibold text-slate-900 dark:text-white mb-1">
            Select at least 2 candidates to compare
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Pick candidates above or click "Compare Top 3 Ranked" for an instant side-by-side matrix.
          </p>
          {allCandidates.length >= 2 && (
            <button
              type="button"
              onClick={quickPickTop3}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
            >
              Compare Top 3 Ranked
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <th className="py-4 px-5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-48">
                  Evaluation Dimension
                </th>
                {selected.map(({ candidate, rank }) => (
                  <th key={candidate.id} className="py-4 px-5 min-w-[220px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-blue-700 dark:text-blue-400 font-semibold">
                          Rank #{rank}
                        </span>
                        <p className="font-display text-base font-bold text-slate-900 dark:text-white">
                          {getCandidateDisplayName(candidate, rank - 1, blindMode)}
                        </p>
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          {candidate.parsed.predictedCategory}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${getCandidateDisplayName(candidate, rank - 1, blindMode)} from comparison`}
                        onClick={() => onToggleCompare(candidate.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 text-xs">
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">Final Weighted Score</td>
                {selected.map(({ candidate }) => (
                  <td key={candidate.id} className="py-3.5 px-5 font-mono text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {candidate.score.finalScore.toFixed(1)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">Semantic Alignment</td>
                {selected.map(({ candidate }) => (
                  <td key={candidate.id} className="py-3.5 px-5 font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {Math.round(candidate.score.combinedSemantic * 100)}% (TF-IDF {Math.round(candidate.score.tfidfSimilarity * 100)}%)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">Required Skill Match</td>
                {selected.map(({ candidate }) => (
                  <td key={candidate.id} className="py-3.5 px-5 font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {candidate.score.matchedSkills.length}/{job.requiredSkills.length} ({Math.round(candidate.score.skillMatchScore * 100)}%)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">Experience</td>
                {selected.map(({ candidate }) => (
                  <td key={candidate.id} className="py-3.5 px-5 font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {candidate.parsed.yearsOfExperience} years
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">Education Level</td>
                {selected.map(({ candidate }) => (
                  <td key={candidate.id} className="py-3.5 px-5 text-slate-700 dark:text-slate-200">
                    {candidate.parsed.educationLevel}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-300">Workflow Status</td>
                {selected.map(({ candidate }) => (
                  <td key={candidate.id} className="py-3.5 px-5 capitalize font-medium text-slate-700 dark:text-slate-200">
                    {candidate.status}
                  </td>
                ))}
              </tr>

              {/* Skill-by-Skill Matrix */}
              <tr className="bg-slate-50/70 dark:bg-slate-950/50">
                <td colSpan={selected.length + 1} className="py-2.5 px-5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Required Skills Coverage Matrix
                </td>
              </tr>
              {job.requiredSkills.map((reqSkill) => (
                <tr key={reqSkill}>
                  <td className="py-2.5 px-5 font-medium text-slate-700 dark:text-slate-300">{reqSkill}</td>
                  {selected.map(({ candidate }) => {
                    const matched = candidate.score.matchedSkills.some(
                      (s) => s.toLowerCase() === reqSkill.toLowerCase()
                    );
                    return (
                      <td key={candidate.id} className="py-2.5 px-5">
                        {matched ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" />
                            Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <Minus className="w-3.5 h-3.5" />
                            Missing
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
