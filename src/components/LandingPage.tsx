import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, FileText, Scale, ShieldCheck, Sliders, Sun, Moon } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLaunchDemo: () => Promise<void>;
  isLaunchingDemo: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const HERO_IMAGE_PATH = '/src/assets/images/hero_talent_workspace_1795611163539.jpg';

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onLaunchDemo,
  isLaunchingDemo,
  darkMode,
  onToggleDarkMode,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1120] dark:text-slate-100 transition-colors">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#0B1120]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            TalentLens
          </a>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#pipeline" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              NLP Pipeline
            </a>
            <a href="#ranking" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Ranking Engine
            </a>
            <a href="#fairness" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              Blind Screening
            </a>
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              API Docs
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Split Section */}
        <section className="max-w-7xl mx-auto px-6 pt-14 pb-16 lg:pt-20 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 tracking-wide mb-4">
                NLP-Driven Talent Intelligence · Explainable Candidate Ranking
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-900 dark:text-white leading-[1.08] mb-5"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)', textWrap: 'balance' }}
              >
                Screen hundreds of resumes with transparent NLP scoring.
              </h1>
              <p className="text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
                TalentLens parses PDF, DOCX, and text resumes using alias-normalized skill extraction, named entity recognition, TF-IDF vectorization, and dense semantic similarity—so hiring teams focus on evidence, not manual keyword skimming.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onLaunchDemo}
                  disabled={isLaunchingDemo}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {isLaunchingDemo ? 'Loading Demo Workspace...' : 'Launch Screening Workspace'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Create Recruiter Account
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Pre-seeded with 10 real-world sample resumes</span>
                <span aria-hidden="true">·</span>
                <span>SQLite persistence & JWT auth</span>
                <span aria-hidden="true">·</span>
                <span>One-click Blind Screening mode</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[300px] lg:min-h-[430px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-900 relative">
                {!heroImgFailed ? (
                  <img
                    src={HERO_IMAGE_PATH}
                    alt="Technical recruiter reviewing structured resume rankings on a laptop at a sunlit studio desk"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center bg-gradient-to-br from-slate-100 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                    <FileText className="w-10 h-10 text-blue-700 dark:text-blue-400 mb-3" />
                    <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                      Structured NLP Screening Workspace
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Quantitative Proof Strip */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 border-y border-slate-200 dark:border-slate-800 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            <div className="py-6 px-4 lg:px-6">
              <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                68 / 260+
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Canonical ESCO skills & mapped aliases
              </p>
            </div>
            <div className="py-6 px-4 lg:px-6">
              <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                TF-IDF + Dense
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Hybrid lexical & semantic vectorization
              </p>
            </div>
            <div className="py-6 px-4 lg:px-6">
              <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                8 Categories
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Live classifier with F1 & confusion matrix
              </p>
            </div>
            <div className="py-6 px-4 lg:px-6">
              <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
                PDF · DOCX · TXT
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Bulk multi-file upload & OCR detection
              </p>
            </div>
          </div>
        </section>

        {/* Core NLP Pipeline Section */}
        <section id="pipeline" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              End-to-End Natural Language Processing Pipeline
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Every uploaded resume passes through a deterministic 6-stage NLP workflow designed for interpretability, auditability, and zero black-box guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 p-7 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <p className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                01. Ingestion & Named Entity Recognition
              </p>
              <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Multi-format document parsing with section segmentation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Extracts raw text from PDF, DOCX, and TXT uploads, flags image-only scans for OCR fallback, segments Summary, Experience, Education, Projects, Skills, and Certifications, and merges overlapping date intervals to compute accurate years of experience.
              </p>
            </div>

            <div className="md:col-span-5 p-7 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <p className="font-mono text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                02. Alias-Normalized Skills Taxonomy
              </p>
              <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
                ESCO/O*NET PhraseMatcher
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Resolves technical and soft skill aliases (such as js to JavaScript, k8s to Kubernetes, sbert to Sentence-BERT, and sklearn to scikit-learn) against skills_master.csv to prevent missed matches.
              </p>
            </div>

            <div id="ranking" className="md:col-span-5 p-7 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                <Sliders className="w-4 h-4" />
                <span className="font-mono text-xs font-medium">03. Adjustable Weighted Ranking</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Recruiter-calibrated scoring formula
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Combines dense semantic similarity and TF-IDF cosine alignment (40%), required skill match ratio (35%), experience threshold (15%), and education match (10%)—with live sliders to re-rank instantly.
              </p>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-lg">
                Score = 0.40·Semantic + 0.35·Skills + 0.15·Exp + 0.10·Edu
              </p>
            </div>

            <div id="fairness" className="md:col-span-7 p-7 rounded-xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-mono text-xs font-medium">04. Bias-Awareness & Data Privacy</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Anonymized Blind Screening Mode & retention controls
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                One click masks candidate names, email addresses, phone numbers, gendered pronouns, honorifics, and graduation years across the ranking table, comparison view, detail drawer, and exported CSV/PDF reports. Delete individual resumes or purge an entire job cohort at any time.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Skill-gap recommendations per candidate
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Precision@K & Confusion Matrix analytics
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Action Band */}
        <section className="max-w-7xl mx-auto px-6 py-14">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
                Ready to evaluate the live screening pipeline?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Open the pre-loaded workspace with 10 sample resumes, adjust scoring weights, or upload your own PDF/DOCX files.
              </p>
            </div>
            <button
              type="button"
              onClick={onLaunchDemo}
              disabled={isLaunchingDemo}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isLaunchingDemo ? 'Opening...' : 'Open Demo Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>TalentLens — AI-Based Resume Screening System</p>
          <div className="flex items-center gap-5">
            <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              OpenAPI Swagger Docs
            </a>
            <a href="/api/openapi.json" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              OpenAPI JSON
            </a>
            <span>Resumes are stored locally in SQLite and can be purged anytime.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
