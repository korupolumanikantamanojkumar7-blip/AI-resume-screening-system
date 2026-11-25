import { useCallback, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import {
  AnalyticsSummary,
  CandidateStatus,
  EducationLevel,
  JobPosting,
  ScoringWeights,
  ScreenedCandidate,
  UserProfile,
} from './types/screening';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { WorkspaceSidebar, WorkspaceTab } from './components/WorkspaceSidebar';
import { ScreeningDashboard } from './components/ScreeningDashboard';
import { JobsManager } from './components/JobsManager';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { CompareCandidatesView } from './components/CompareCandidatesView';
import { AnalyticsView } from './components/AnalyticsView';
import { DocsAndDatasetsView } from './components/DocsAndDatasetsView';

export default function App() {
  // Authentication state held strictly in React memory (never localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [launchingDemo, setLaunchingDemo] = useState(false);

  // Theme state synced with <html class="dark">
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Workspace state
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('screening');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ScreenedCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [detailCandidate, setDetailCandidate] = useState<{
    candidate: ScreenedCandidate;
    rank: number;
  } | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}, tokenOverride?: string) => {
      const token = tokenOverride ?? authToken;
      const headers = new Headers(options.headers);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      return data;
    },
    [authToken]
  );

  const loadCandidates = useCallback(
    async (jobId: string, tokenOverride?: string) => {
      setLoadingCandidates(true);
      setGlobalError(null);
      try {
        const data = await apiFetch(`/api/jobs/${jobId}/resumes`, {}, tokenOverride);
        setCandidates(data.candidates ?? []);
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : 'Failed to load candidates.');
      } finally {
        setLoadingCandidates(false);
      }
    },
    [apiFetch]
  );

  const loadJobs = useCallback(
    async (tokenOverride?: string, preferredJobId?: string | null) => {
      try {
        const data = await apiFetch('/api/jobs', {}, tokenOverride);
        const list: JobPosting[] = data.jobs ?? [];
        setJobs(list);
        const targetId =
          preferredJobId && list.some((j) => j.id === preferredJobId)
            ? preferredJobId
            : list[0]?.id ?? null;
        setSelectedJobId(targetId);
        if (targetId) {
          await loadCandidates(targetId, tokenOverride);
        } else {
          setCandidates([]);
        }
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : 'Failed to load job postings.');
      }
    },
    [apiFetch, loadCandidates]
  );

  const loadAnalytics = useCallback(
    async (tokenOverride?: string) => {
      setLoadingAnalytics(true);
      try {
        const data = await apiFetch('/api/analytics', {}, tokenOverride);
        setAnalytics(data as AnalyticsSummary);
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : 'Failed to load analytics.');
      } finally {
        setLoadingAnalytics(false);
      }
    },
    [apiFetch]
  );

  const handleAuthenticated = useCallback(
    async (token: string, profile: UserProfile) => {
      setAuthToken(token);
      setUser(profile);
      setAuthModalMode(null);
      setCompareIds([]);
      await loadJobs(token);
    },
    [loadJobs]
  );

  const handleLaunchDemo = useCallback(async () => {
    setLaunchingDemo(true);
    setGlobalError(null);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not initialize demo session.');
      }
      await handleAuthenticated(data.token, data.user);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Demo startup failed.');
    } finally {
      setLaunchingDemo(false);
    }
  }, [handleAuthenticated]);

  // Support ?autostart=1 to jump directly into the pre-seeded workspace
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !authToken) {
      void handleLaunchDemo();
    }
  }, [authToken, handleLaunchDemo]);

  useEffect(() => {
    if (authToken && activeTab === 'analytics') {
      void loadAnalytics();
    }
  }, [authToken, activeTab, loadAnalytics]);

  const activeJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    setCompareIds([]);
    setDetailCandidate(null);
    if (jobId) {
      await loadCandidates(jobId);
    }
  };

  const handleCreateJob = async (payload: {
    title: string;
    department: string;
    location: string;
    description: string;
    requiredSkills: string[];
    minExperience: number;
    educationRequirement: EducationLevel;
  }) => {
    const data = await apiFetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const created: JobPosting = data.job;
    await loadJobs(undefined, created.id);
    setActiveTab('screening');
  };

  const handleDeleteJob = async (jobId: string) => {
    await apiFetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
    await loadJobs();
  };

  const handleUploadFiles = async (files: FileList) => {
    if (!selectedJobId) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('files', f));
    const data = await apiFetch(`/api/jobs/${selectedJobId}/resumes/upload`, {
      method: 'POST',
      body: formData,
    });
    setCandidates(data.candidates ?? []);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === selectedJobId ? { ...j, candidateCount: (data.candidates ?? []).length } : j
      )
    );
    return { uploadedCount: data.uploadedCount ?? 0, warnings: data.warnings ?? [] };
  };

  const handlePasteResume = async (fileName: string, rawText: string) => {
    if (!selectedJobId) return;
    const data = await apiFetch(`/api/jobs/${selectedJobId}/resumes/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, rawText }),
    });
    setCandidates(data.candidates ?? []);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === selectedJobId ? { ...j, candidateCount: (data.candidates ?? []).length } : j
      )
    );
  };

  const handleLoadSampleResumes = async () => {
    if (!selectedJobId) return;
    const data = await apiFetch(`/api/jobs/${selectedJobId}/resumes/load-samples`, {
      method: 'POST',
    });
    setCandidates(data.candidates ?? []);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === selectedJobId ? { ...j, candidateCount: (data.candidates ?? []).length } : j
      )
    );
  };

  const handleUpdateStatus = async (candidateId: string, status: CandidateStatus) => {
    await apiFetch(`/api/resumes/${candidateId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, status } : c)));
    setDetailCandidate((prev) =>
      prev && prev.candidate.id === candidateId
        ? { ...prev, candidate: { ...prev.candidate, status } }
        : prev
    );
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    await apiFetch(`/api/resumes/${candidateId}`, { method: 'DELETE' });
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    setCompareIds((prev) => prev.filter((id) => id !== candidateId));
    setJobs((prev) =>
      prev.map((j) =>
        j.id === selectedJobId
          ? { ...j, candidateCount: Math.max(0, (j.candidateCount ?? 1) - 1) }
          : j
      )
    );
  };

  const handlePurgeJobResumes = async () => {
    if (!selectedJobId) return;
    await apiFetch(`/api/jobs/${selectedJobId}/resumes`, { method: 'DELETE' });
    setCandidates([]);
    setCompareIds([]);
    setJobs((prev) =>
      prev.map((j) => (j.id === selectedJobId ? { ...j, candidateCount: 0 } : j))
    );
  };

  const handleSaveWeights = async (weights: ScoringWeights) => {
    if (!selectedJobId) return;
    const data = await apiFetch(`/api/jobs/${selectedJobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weights }),
    });
    if (data.job) {
      setJobs((prev) => prev.map((j) => (j.id === selectedJobId ? data.job : j)));
    }
    if (data.candidates) {
      setCandidates(data.candidates);
    }
  };

  const handleToggleCompare = (candidateId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(candidateId)) return prev.filter((id) => id !== candidateId);
      if (prev.length >= 3) return prev;
      return [...prev, candidateId];
    });
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setJobs([]);
    setCandidates([]);
    setCompareIds([]);
    setDetailCandidate(null);
    setActiveTab('screening');
  };

  // Unauthenticated Landing Page
  if (!authToken || !user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => setAuthModalMode(mode)}
          onLaunchDemo={handleLaunchDemo}
          isLaunchingDemo={launchingDemo}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
        />
        {authModalMode && (
          <AuthModal
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
            onSuccess={handleAuthenticated}
            onLaunchDemo={handleLaunchDemo}
          />
        )}
      </>
    );
  }

  const tabTitles: Record<WorkspaceTab, string> = {
    screening: 'Candidate Ranking',
    jobs: 'Job Postings',
    compare: 'Compare Candidates',
    analytics: 'Model Analytics',
    docs: 'Datasets & Project Report',
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <WorkspaceSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        jobs={jobs}
        selectedJobId={selectedJobId}
        onSelectJob={handleSelectJob}
        compareCount={compareIds.length}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Workspace Breadcrumb Top Bar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open workspace navigation"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="font-medium text-slate-800 dark:text-slate-200">Workspace</span>
              <span aria-hidden="true">/</span>
              <span className="truncate">{tabTitles[activeTab]}</span>
              {activeJob && activeTab === 'screening' && (
                <>
                  <span aria-hidden="true" className="hidden sm:inline">/</span>
                  <span className="hidden sm:inline font-medium text-slate-900 dark:text-white truncate">
                    {activeJob.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-block text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 whitespace-nowrap"
            >
              API Docs
            </a>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              New Job Posting
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {globalError && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300 flex items-center justify-between"
            >
              <span>{globalError}</span>
              <button
                type="button"
                onClick={() => setGlobalError(null)}
                className="underline font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'screening' && (
            <ScreeningDashboard
              job={activeJob}
              candidates={candidates}
              loading={loadingCandidates}
              blindMode={blindMode}
              onToggleBlindMode={() => setBlindMode((b) => !b)}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onOpenCompareView={() => setActiveTab('compare')}
              onSelectCandidate={(candidate, rank) => setDetailCandidate({ candidate, rank })}
              onUploadFiles={handleUploadFiles}
              onPasteResume={handlePasteResume}
              onLoadSampleResumes={handleLoadSampleResumes}
              onUpdateStatus={handleUpdateStatus}
              onDeleteCandidate={handleDeleteCandidate}
              onPurgeJobResumes={handlePurgeJobResumes}
              onSaveWeights={handleSaveWeights}
              onNavigateToJobs={() => setActiveTab('jobs')}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsManager
              jobs={jobs}
              selectedJobId={selectedJobId}
              authToken={authToken}
              onSelectJob={async (id) => {
                await handleSelectJob(id);
                setActiveTab('screening');
              }}
              onCreateJob={handleCreateJob}
              onDeleteJob={handleDeleteJob}
            />
          )}

          {activeTab === 'compare' && (
            <CompareCandidatesView
              job={activeJob}
              allCandidates={candidates}
              compareIds={compareIds}
              blindMode={blindMode}
              onToggleCompare={handleToggleCompare}
              onClearCompare={() => setCompareIds([])}
              onBackToScreening={() => setActiveTab('screening')}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              analytics={analytics}
              loading={loadingAnalytics}
              onRefresh={() => void loadAnalytics()}
            />
          )}

          {activeTab === 'docs' && <DocsAndDatasetsView />}
        </main>
      </div>

      {detailCandidate && (
        <CandidateDetailModal
          candidate={detailCandidate.candidate}
          rank={detailCandidate.rank}
          blindMode={blindMode}
          onClose={() => setDetailCandidate(null)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteCandidate}
        />
      )}
    </div>
  );
}
