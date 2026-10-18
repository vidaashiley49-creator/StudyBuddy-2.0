import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { PLANS } from '../constants/index.ts';
import { Sun, Moon, Sparkles, BookOpen, Crown } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { activeTab, setActiveTab, plan, usage, theme, toggleTheme, profile } = useApp();

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Study Dashboard',
      subtitle: `Welcome back, ${profile.name.split(' ')[0]}! Keep up your streak today.`,
    },
    tutor: {
      title: 'AI Study Tutor',
      subtitle: 'Ask step-by-step explanations, math derivations, and curriculum Q&A.',
    },
    quiz: {
      title: 'Smart Practice Quizzes',
      subtitle: 'Auto-marked practice tests with instant feedback & weak-spot diagnosis.',
    },
    flashcards: {
      title: 'Spaced Repetition Flashcards',
      subtitle: 'Leitner review system designed for long-term syllabus retention.',
    },
    notes: {
      title: 'Notes & Chapter Summaries',
      subtitle: 'Transform lengthy chapters, paste text, or upload documents into high-yield summaries.',
    },
    planner: {
      title: 'Exam Planner & Tasks',
      subtitle: 'Track exam countdowns and generate personalized revision schedules.',
    },
    achievements: {
      title: 'Achievements & Streaks',
      subtitle: 'Track your consistency, earn badges, and celebrate academic milestones.',
    },
    upgrade: {
      title: 'Plans & Entitlements',
      subtitle: 'Compare Starter, Plus, and Pro tiers with full test-mode payment gateway.',
    },
    settings: {
      title: 'Profile & Settings',
      subtitle: 'Configure your education level, exam board, curriculum, and data.',
    },
  };

  const currentPlan = PLANS[plan.tier];
  const tutorLeft = Math.max(0, currentPlan.limits.tutorMsgs - usage.tutorMsgs);
  const info = titleMap[activeTab] || titleMap.dashboard;

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Title & mobile brand logo */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          onClick={() => setActiveTab('dashboard')}
          className="lg:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 flex items-center justify-center p-1 shrink-0 cursor-pointer shadow-sm"
        >
          <img src="/icon.svg" alt="StudyBuddy" className="w-full h-full object-contain" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
            {info.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right status & actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* AI quota pill */}
        <div
          onClick={() => setActiveTab('upgrade')}
          className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105 border ${
            tutorLeft <= 0
              ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : tutorLeft <= 5
              ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
          }`}
          title="Daily AI Messages Left"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI: {tutorLeft} left</span>
        </div>

        {/* Education level indicator */}
        <div
          onClick={() => setActiveTab('settings')}
          className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Current Education Level"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>{profile.level}</span>
        </div>

        {/* Theme toggle (mobile + desktop) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Avatar */}
        <div
          onClick={() => setActiveTab('settings')}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center cursor-pointer shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all shrink-0"
        >
          {profile.name.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
