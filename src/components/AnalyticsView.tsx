import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnalyticsSummary } from '../types/screening';

interface AnalyticsViewProps {
  analytics: AnalyticsSummary | null;
  loading: boolean;
  onRefresh: () => void;
}

const CHART_PALETTE = [
  '#1d4ed8',
  '#0284c7',
  '#16a34a',
  '#d97706',
  '#4f46e5',
  '#0891b2',
  '#64748b',
  '#dc2626',
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  loading,
  onRefresh,
}) => {
  if (loading || !analytics) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="h-72 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  const { classifier, datasetStats, skillFrequency, scoreDistribution, categoryDistribution } =
    analytics;

  const maxCell = Math.max(
    1,
    ...classifier.confusionMatrix.flatMap((row) => row)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Model Evaluation & Screening Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stratified train/test classifier metrics ({classifier.trainSamples} train / {classifier.testSamples} test samples), Precision@K ranking quality, and live workspace distributions.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          Refresh Metrics
        </button>
      </div>

      {/* Classifier & Ranking Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Test Accuracy</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {(classifier.accuracy * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Macro Precision</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {(classifier.macroPrecision * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Macro Recall</p>
          <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
            {(classifier.macroRecall * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Macro F1</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-1">
            {(classifier.macroF1 * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Precision@3</p>
          <p className="font-mono text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums mt-1">
            {(classifier.precisionAt3 * 100).toFixed(1)}%
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Precision@5</p>
          <p className="font-mono text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums mt-1">
            {(classifier.precisionAt5 * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Frequency Chart */}
        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1">
            Top Extracted Skills Across Screened Resumes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Canonical skills normalized via ESCO taxonomy ({datasetStats.totalSkillsInTaxonomy} skills · {datasetStats.totalAliasesMapped} aliases)
          </p>
          <div className="h-64">
            {skillFrequency.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillFrequency.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis dataKey="skill" type="category" width={115} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="count" name="Resumes" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 pt-10 text-center">
                Screen resumes to populate skill frequency statistics.
              </p>
            )}
          </div>
        </section>

        {/* Score Distribution Histogram */}
        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1">
            Candidate Match Score Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {datasetStats.totalCandidatesScreened} screened resumes · Average score {datasetStats.averageMatchScore}%
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, idx) => (
                    <Cell
                      key={entry.range}
                      fill={idx >= 3 ? '#16a34a' : idx === 2 ? '#0284c7' : idx === 1 ? '#d97706' : '#dc2626'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Predicted Category Distribution */}
        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1">
            Predicted Job Category Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Assigned automatically by the TF-IDF Multinomial Resume Category Classifier
          </p>
          <div className="h-64 grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
            <div className="sm:col-span-7 h-56">
              {categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {categoryDistribution.map((entry, i) => (
                        <Cell key={entry.category} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500 pt-10 text-center">No categorized resumes yet.</p>
              )}
            </div>
            <div className="sm:col-span-5 space-y-1.5 text-xs">
              {categoryDistribution.map((item, i) => (
                <div key={item.category} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: CHART_PALETTE[i % CHART_PALETTE.length] }}
                    />
                    <span className="truncate">{item.category}</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Per-Class Evaluation Table */}
        <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1">
            Per-Category Classification Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Evaluated on stratified held-out test split (25% of labeled corpus)
          </p>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2 pr-3 font-semibold">Category</th>
                <th className="py-2 px-2 text-right font-semibold">Precision</th>
                <th className="py-2 px-2 text-right font-semibold">Recall</th>
                <th className="py-2 px-2 text-right font-semibold">F1</th>
                <th className="py-2 pl-2 text-right font-semibold">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {classifier.perClassMetrics.map((row) => (
                <tr key={row.category}>
                  <td className="py-2 pr-3 font-medium text-slate-900 dark:text-slate-100">
                    {row.category}
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {(row.precision * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {(row.recall * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-2 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                    {(row.f1 * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 pl-2 text-right font-mono tabular-nums text-slate-500">
                    {row.support}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* Confusion Matrix Heatmap */}
      <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mb-1">
          Confusion Matrix (Actual Rows vs. Predicted Columns)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Diagonal intensity represents correct held-out classifications across all 8 occupational categories.
        </p>

        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left text-slate-500 dark:text-slate-400 font-semibold">
                Actual \ Pred
              </th>
              {classifier.categories.map((cat) => (
                <th
                  key={cat}
                  className="py-2 px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400 max-w-[95px] truncate"
                  title={cat}
                >
                  {cat.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classifier.confusionMatrix.map((row, rIdx) => (
              <tr key={classifier.categories[rIdx]} className="border-t border-slate-100 dark:border-slate-800/80">
                <td className="py-2 px-3 text-left font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {classifier.categories[rIdx]}
                </td>
                {row.map((val, cIdx) => {
                  const isDiag = rIdx === cIdx;
                  const intensity = val / maxCell;
                  const bgClass =
                    val === 0
                      ? 'bg-slate-50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                      : isDiag
                        ? intensity > 0.6
                          ? 'bg-blue-700 text-white font-bold'
                          : 'bg-blue-200 dark:bg-blue-900/70 text-blue-950 dark:text-blue-100 font-semibold'
                        : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 font-semibold';
                  return (
                    <td key={cIdx} className="p-1">
                      <div className={`py-2 rounded-md font-mono tabular-nums ${bgClass}`}>
                        {val}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
