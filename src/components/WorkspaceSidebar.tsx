import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  GitCompare,
  LogOut,
  Moon,
  Shield,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { JobPosting, UserProfile } from '../types/screening';

export type WorkspaceTab = 'screening' | 'jobs' | 'compare' | 'analytics' | 'docs';

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  jobs: JobPosting[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  compareCount: number;
  user: UserProfile;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const AVATAR_PATH = '/src/assets/images/recruiter_avatar_1795611165746.jpg';

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  onSelectTab,
  jobs,
  selectedJobId,
  onSelectJob,
  compareCount,
  user,
  onLogout,
  darkMode,
  onToggleDarkMode,
  mobileOpen,
  onCloseMobile,
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
    meta?: string;
  }> = [
    { id: 'screening', label: 'Candidate Ranking', icon: <Users className="w-4 h-4" /> },
    {
      id: 'jobs',
      label: 'Job Postings',
      icon: <Briefcase className="w-4 h-4" />,
      meta: String(jobs.length),
    },
    {
      id: 'compare',
      label: 'Compare Candidates',
      icon: <GitCompare className="w-4 h-4" />,
      meta: compareCount > 0 ? `${compareCount}/3` : undefined,
    },
    { id: 'analytics', label: 'Model Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'docs', label: 'Datasets & Report', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const sidebarBody = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 w-64">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
          TalentLens
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Job Selector */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <label
          htmlFor="sidebar-job-select"
          className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
        >
          Active Job Posting
        </label>
        <select
          id="sidebar-job-select"
          value={selectedJobId ?? ''}
          onChange={(e) => {
            onSelectJob(e.target.value);
            if (activeTab === 'jobs') onSelectTab('screening');
          }}
          className="w-full px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate"
        >
          {jobs.length === 0 ? (
            <option value="">No jobs created yet</option>
          ) : (
            jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.candidateCount ?? 0})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Workspace navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
              {item.meta && (
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {item.meta}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Privacy Notice */}
      <div className="mx-3 mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
          <Shield className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
          <span>Data Privacy Notice</span>
        </div>
        <p>
          Retain resumes only while hiring is active. Delete individual candidates or purge job cohorts anytime.
        </p>
      </div>

      {/* Theme & Profile Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span>{darkMode ? 'Light Appearance' : 'Dark Appearance'}</span>
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {!avatarFailed ? (
              <img
                src={AVATAR_PATH}
                alt={user.name}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.organization}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen">{sidebarBody}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="relative z-10">{sidebarBody}</div>
          <button
            type="button"
            aria-label="Dismiss navigation drawer"
            onClick={onCloseMobile}
            className="flex-1 bg-slate-950/50"
          />
        </div>
      )}
    </>
  );
};
