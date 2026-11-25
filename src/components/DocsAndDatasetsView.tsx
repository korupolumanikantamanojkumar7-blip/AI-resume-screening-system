import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react';
import { SKILLS_TAXONOMY } from '../nlp/skillsTaxonomy';

const KAGGLE_COMMANDS = `# 1. Install Kaggle CLI and place your kaggle.json token in ~/.kaggle/kaggle.json
pip install kaggle

# 2. Download Snehaan Bhawal's Resume Dataset (~2,400 resumes, 24 categories)
kaggle datasets download -d snehaanbhawal/resume-dataset -p data/raw --unzip

# 3. Download Gaurav Dutta's UpdatedResumeDataSet.csv (~960 resumes)
kaggle datasets download -d gauravduttakiit/resume-dataset -p data/raw --unzip

# 4. Download LinkedIn Job Postings (real job descriptions)
kaggle datasets download -d arshkon/linkedin-job-postings -p data/raw/jobs --unzip

# 5. Train & evaluate the Python TF-IDF + LinearSVC + Sentence-BERT benchmark
pip install -r ml/requirements.txt
python -m spacy download en_core_web_sm
python ml/train_classifier.py --resume-csv data/raw/Resume/Resume.csv`;

const VIVA_QA: Array<{ q: string; a: string }> = [
  {
    q: '1. Why combine TF-IDF with dense semantic embeddings (Sentence-BERT) instead of using keyword matching alone?',
    a: 'Keyword matching misses synonyms and contextual phrasing (e.g., "built REST services in FastAPI" vs "backend API engineering"). TF-IDF captures exact high-signal domain terms with inverse document frequency weighting, while dense semantic embeddings capture conceptual proximity across related technologies and responsibilities.',
  },
  {
    q: '2. How does your alias-normalized skills taxonomy (skills_master.csv) prevent false negatives?',
    a: 'Candidates abbreviate skills inconsistently ("js", "ts", "k8s", "sklearn", "sbert", "pg"). Mapping aliases to ESCO/O*NET canonical identifiers via boundary-aware PhraseMatcher ensures both job descriptions and resumes resolve to the same canonical skill vocabulary before computing Skill Match = |Matched| / |Required|.',
  },
  {
    q: '3. How do you compute Years of Experience accurately when a candidate holds overlapping roles?',
    a: 'The extractor parses both explicit experience statements ("6+ years of experience") and date intervals from the Experience section (e.g., Jan 2020 - Dec 2023), sorts intervals chronologically, merges overlapping intervals so concurrent roles are not double-counted, and reconciles both signals.',
  },
  {
    q: '4. Explain the weighted ranking formula and why weights are recruiter-adjustable.',
    a: 'The default score is 0.40 * Semantic + 0.35 * SkillMatch + 0.15 * Experience + 0.10 * Education. Different roles prioritize different factors—for example, research roles weigh education and semantic depth higher, while immediate delivery roles weigh required stack skills higher. Sliders normalize weights to 100% and re-rank in real time.',
  },
  {
    q: '5. How do you evaluate the Resume Category Classifier and Ranking Engine?',
    a: 'Classification is evaluated on a stratified held-out test split using Accuracy, Macro Precision, Macro Recall, Macro F1-score, and a Confusion Matrix. Ranking quality is measured with Precision@K (P@3 and P@5)—the fraction of top-K ranked resumes that match the target occupational category.',
  },
  {
    q: '6. How does your system mitigate algorithmic and human hiring bias?',
    a: 'Anonymized Blind Screening Mode redacts candidate names, emails, phone numbers, gendered honorifics/pronouns, and graduation years across the ranking table, detail view, side-by-side comparison, and CSV/PDF exports. Explainable score breakdowns also prevent opaque black-box rejections.',
  },
  {
    q: '7. How do you handle scanned image-based PDF resumes with no embedded text layer?',
    a: 'The ingestion pipeline inspects extracted character density from PDF streams. When embedded text is minimal or absent, it flags the document for OCR fallback (Tesseract/PyMuPDF in Python or text-paste fallback in the browser) rather than silently assigning a zero score.',
  },
  {
    q: '8. Why use SQLite with parameterized queries and JWT authentication?',
    a: 'SQLite provides reliable zero-configuration relational persistence (users, jobs, resumes, scores) with foreign-key cascading deletes for privacy compliance. Parameterized prepared statements eliminate SQL injection, scrypt hashes passwords with unique salts, and Bearer JWTs enforce per-user tenant isolation.',
  },
  {
    q: '9. What are the key limitations of automated NLP resume screening?',
    a: 'Resumes with complex multi-column tables or graphics can scramble reading order; niche domain acronyms outside skills_master.csv may need periodic taxonomy updates; and automated scores should always assist—never autonomously replace—human hiring decisions.',
  },
  {
    q: '10. What future enhancements would you prioritize in production?',
    a: 'Integrating pgvector for millisecond approximate nearest-neighbor search across 100k+ resumes, adding active learning feedback loops from recruiter shortlist decisions, multilingual ESCO taxonomy support, and ATS webhook synchronization.',
  },
];

export const DocsAndDatasetsView: React.FC = () => {
  const [skillSearch, setSkillSearch] = useState('');
  const [openViva, setOpenViva] = useState<number | null>(0);

  const filteredTaxonomy = useMemo(() => {
    const q = skillSearch.trim().toLowerCase();
    if (!q) return SKILLS_TAXONOMY;
    return SKILLS_TAXONOMY.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [skillSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Datasets, Taxonomy, Report & Viva Q&A
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kaggle CLI dataset setup, ESCO skills_master.csv explorer, OpenAPI Swagger documentation, and project report deliverables.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg"
          >
            Open Swagger API Docs
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Kaggle Datasets & Python Training Script */}
      <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            1. Kaggle Datasets & CLI Download Steps
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Exact commands included in <code className="font-mono">scripts/download_kaggle_datasets.sh</code> and <code className="font-mono">ml/train_classifier.py</code> for training on the full Snehaan Bhawal (~2,400 resumes), Gaurav Dutta (~960 resumes), and LinkedIn Job Postings corpora.
          </p>
        </div>
        <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
          {KAGGLE_COMMANDS}
        </pre>
      </section>

      {/* Live ESCO / O*NET skills_master.csv Explorer */}
      <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              2. Skills Taxonomy Explorer (data/skills_master.csv)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {SKILLS_TAXONOMY.length} canonical technical & soft skills with alias normalization (e.g., js → JavaScript, k8s → Kubernetes).
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Filter skills taxonomy"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Search skill or alias (e.g. k8s)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Canonical Skill</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Mapped Aliases</th>
                <th className="py-2.5 px-3 font-semibold">ESCO Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTaxonomy.map((entry) => (
                <tr key={entry.canonical}>
                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {entry.displayName}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {entry.category}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {entry.aliases.join(', ')}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {entry.escoCode}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Project Report Summary & Architecture */}
      <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          3. Project Report Outline (Full Report in docs/PROJECT_REPORT_AND_VIVA.md)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Abstract & Problem</h3>
            <p>
              Manual resume triage consumes hours per open requisition and is vulnerable to keyword oversights and unconscious bias. TalentLens automates multi-format ingestion, ESCO skill normalization, hybrid TF-IDF + dense semantic matching, and explainable candidate ranking.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">System Architecture</h3>
            <p className="font-mono text-[11px]">
              Upload (PDF/DOCX/TXT) → Parser + OCR Check → Preprocessor (Lemmatize/Stopwords) → ESCO PhraseMatcher + NER + Date-Union Exp → TF-IDF + Semantic Vectorizer → Weighted Ranker + Classifier → SQLite + React UI
            </p>
          </div>
        </div>
      </section>

      {/* 10 Viva Q&A Accordion */}
      <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          4. Project Defense / Viva Q&A (10 Questions)
        </h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          {VIVA_QA.map((item, idx) => {
            const isOpen = openViva === idx;
            return (
              <div key={item.q} className="bg-white dark:bg-slate-900">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenViva(isOpen ? null : idx)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {item.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
