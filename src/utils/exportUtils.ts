import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JobPosting, ScreenedCandidate } from '../types/screening';

function csvEscape(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function getCandidateDisplayName(
  candidate: ScreenedCandidate,
  index: number,
  blindMode: boolean
): string {
  if (blindMode) {
    const code = candidate.id.slice(0, 4).toUpperCase();
    return `Candidate #${String(index + 1).padStart(2, '0')}-${code}`;
  }
  return candidate.parsed.entities.name;
}

export function exportCandidatesToCsv(
  job: JobPosting,
  candidates: ScreenedCandidate[],
  blindMode: boolean
): void {
  const headers = [
    'Rank',
    'Candidate',
    'Email',
    'Status',
    'Final Score (%)',
    'Semantic Match (%)',
    'TF-IDF Match (%)',
    'Skill Match (%)',
    'Experience (Years)',
    'Education',
    'Predicted Category',
    'Matched Skills',
    'Missing Skills',
    'Summary Explanation',
  ];

  const rows = candidates.map((c, idx) => [
    idx + 1,
    getCandidateDisplayName(c, idx, blindMode),
    blindMode ? '[REDACTED]' : c.parsed.entities.email ?? '',
    c.status,
    c.score.finalScore.toFixed(1),
    Math.round(c.score.combinedSemantic * 100),
    Math.round(c.score.tfidfSimilarity * 100),
    Math.round(c.score.skillMatchScore * 100),
    c.parsed.yearsOfExperience,
    c.parsed.educationLevel,
    c.parsed.predictedCategory,
    c.score.matchedSkills.join('; '),
    c.score.missingSkills.join('; '),
    c.score.explanation,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  link.href = url;
  link.download = `talentlens-${slug}-${blindMode ? 'blind-' : ''}rankings.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCandidatesToPdf(
  job: JobPosting,
  candidates: ScreenedCandidate[],
  blindMode: boolean
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`TalentLens Screening Report — ${job.title}`, 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const subtitle = [
    `Department: ${job.department}`,
    `Location: ${job.location}`,
    `Mode: ${blindMode ? 'Anonymized Blind Screening' : 'Standard Screening'}`,
    `Candidates: ${candidates.length}`,
    `Generated: ${new Date().toLocaleDateString()}`,
  ].join('  |  ');
  doc.text(subtitle, 40, 60);

  const weightsLine = `Weights: Semantic ${Math.round(job.weights.semantic * 100)}% · Skills ${Math.round(job.weights.skillMatch * 100)}% · Experience ${Math.round(job.weights.experience * 100)}% · Education ${Math.round(job.weights.education * 100)}%`;
  doc.text(weightsLine, 40, 75);

  autoTable(doc, {
    startY: 92,
    head: [
      [
        '#',
        'Candidate',
        'Score',
        'Semantic',
        'Skills',
        'Exp',
        'Education',
        'Category',
        'Status',
        'Matched / Missing Skills',
      ],
    ],
    body: candidates.map((c, idx) => [
      String(idx + 1),
      getCandidateDisplayName(c, idx, blindMode),
      `${c.score.finalScore.toFixed(1)}%`,
      `${Math.round(c.score.combinedSemantic * 100)}%`,
      `${Math.round(c.score.skillMatchScore * 100)}%`,
      `${c.parsed.yearsOfExperience}y`,
      c.parsed.educationLevel,
      c.parsed.predictedCategory,
      c.status,
      `+${c.score.matchedSkills.slice(0, 4).join(', ')}${c.score.missingSkills.length > 0 ? ` | Missing: ${c.score.missingSkills.slice(0, 3).join(', ')}` : ''}`,
    ]),
    styles: { fontSize: 8.5, cellPadding: 5, textColor: [15, 23, 42] },
    headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const slug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  doc.save(`talentlens-${slug}-report.pdf`);
}
