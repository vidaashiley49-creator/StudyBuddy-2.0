import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ACHIEVEMENTS } from '../constants/index.ts';
import { Trophy, Flame, Zap, Award, CheckCircle2, Lock } from 'lucide-react';

export const AchievementsView: React.FC = () => {
  const { streak, unlockedAchievements, activity, quizzes, decks, notes } = useApp();

  const totalBadges = ACHIEVEMENTS.length;
  const unlockedCount = Object.keys(unlockedAchievements).length;
  const progressPercent = Math.round((unlockedCount / totalBadges) * 100);

  // Total study minutes
  const totalMinutes = Object.values(activity).reduce((acc, a) => acc + (a.minutes || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Hero Streak & Progress Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold">
              <Flame className="w-4 h-4 fill-white" />
              <span>Study Streak</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {streak.current} Days in a Row!
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 font-medium">
              Consistency is the key to deep neural learning. Keep showing up every day!
            </p>
          </div>

          <div className="pt-4 flex items-center gap-4 text-xs font-bold text-white/90">
            <div>Best streak: {streak.best} days</div>
            <div>·</div>
            <div>{totalMinutes} total minutes studied</div>
          </div>
        </div>

        {/* Badges Progress Meter Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-center">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {unlockedCount} / {totalBadges}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Badges Earned
            </div>
          </div>

          <div className="space-y-1.5 pt-4">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{progressPercent}% Completed</div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Academic Mastery Badges
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unlock new accolades as you ask questions, finish quizzes, and review flashcards.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
          {ACHIEVEMENTS.map((badge) => {
            const isUnlocked = Boolean(unlockedAchievements[badge.id]);
            const unlockedTime = unlockedAchievements[badge.id];

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between gap-2.5 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200 dark:border-amber-800/60 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs transition-transform ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-amber-400 to-orange-500 shadow-amber-500/25 scale-105'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isUnlocked ? badge.emoji : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                <div className="space-y-0.5">
                  <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {badge.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {badge.desc}
                  </div>
                </div>

                {isUnlocked && unlockedTime ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">Locked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
