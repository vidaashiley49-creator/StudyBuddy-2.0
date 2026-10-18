import React from 'react';
import { useApp, NavigationTab } from '../context/AppContext.tsx';
import { PLANS } from '../constants/index.ts';
import {
  LayoutDashboard,
  Sparkles,
  HelpCircle,
  Layers,
  BookOpen,
  Calendar,
  Trophy,
  Crown,
  Settings,
  Flame,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, plan, usage, streak, theme, toggleTheme, profile } = useApp();

  const currentPlan = PLANS[plan.tier];
  const tutorLeft = Math.max(0, currentPlan.limits.tutorMsgs - usage.tutorMsgs);

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    {
      id: 'tutor',
      label: 'AI Study Tutor',
      icon: <Sparkles className="w-5 h-5" />,
      badge: tutorLeft > 0 ? `${tutorLeft} left` : '0 left',
    },
    { id: 'quiz', label: 'Smart Quizzes', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers className="w-5 h-5" /> },
    { id: 'notes', label: 'Notes & Summaries', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'planner', label: 'Study Planner', icon: <Calendar className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-5 h-5" /> },
    {
      id: 'upgrade',
      label: 'Plans & Pricing',
      icon: <Crown className="w-5 h-5" />,
      badge: plan.tier === 'starter' ? 'Upgrade' : undefined,
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div
        onClick={() => setActiveTab('dashboard')}
        className="flex items-center gap-3 p-5 cursor-pointer border-b border-slate-100 dark:border-slate-800/80 group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-400 flex items-center justify-center p-1.5 shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
          <img src="/icon.svg" alt="StudyBuddy Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            StudyBuddy AI
            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {profile.level}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Understand More.</div>
        </div>
      </div>

      {/* Daily Streak Highlight */}
      <div className="mx-4 my-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {streak.current} Day Streak!
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400">Best: {streak.best} days</div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('achievements')}
          className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline"
        >
          Badges
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">
          Study Studio
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-900/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    item.badge === 'Upgrade'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                      : isActive
                      ? 'bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Plan Card & Controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {/* Plan card */}
        <div
          onClick={() => setActiveTab('upgrade')}
          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {currentPlan.name}
            </div>
            <span
              className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md ${
                plan.tier === 'pro'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : plan.tier === 'plus'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {plan.tier}
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
            <span>Daily AI questions</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {usage.tutorMsgs} / {currentPlan.limits.tutorMsgs}
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (usage.tutorMsgs / currentPlan.limits.tutorMsgs) * 100)}%`,
              }}
            />
          </div>

          {plan.tier === 'starter' && (
            <div className="mt-2 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Upgrade for 300+ msgs →
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
          </button>

          <div
            onClick={() => setActiveTab('settings')}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center cursor-pointer shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all"
            title="View Profile Settings"
          >
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </aside>
  );
};
