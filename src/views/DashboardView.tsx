import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { PLANS } from '../constants/index.ts';
import {
  Sparkles,
  HelpCircle,
  Layers,
  BookOpen,
  Calendar,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Zap,
  CheckCircle2,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    profile,
    plan,
    usage,
    streak,
    activity,
    quizzes,
    decks,
    notes,
    exams,
    dailyMinutesGoal,
    setTabWithArg,
    setActiveTab,
  } = useApp();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayActivity = activity[todayKey] || { minutes: 0, tutorMsgs: 0, quizzes: 0, flashcards: 0, notes: 0 };
  const currentMinutes = todayActivity.minutes;
  const goalPercent = Math.min(100, Math.round((currentMinutes / dailyMinutesGoal) * 100));

  // 7-day study minutes history
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
    const mins = activity[k]?.minutes || 0;
    return { key: k, dayName, mins };
  });

  const maxMinutesInWeek = Math.max(dailyMinutesGoal, ...last7Days.map((d) => d.mins));

  // Next upcoming exam
  const sortedExams = [...exams]
    .filter((e) => new Date(e.date).getTime() >= new Date(todayKey).getTime())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextExam = sortedExams[0];
  const daysToNextExam = nextExam
    ? Math.max(0, Math.ceil((new Date(nextExam.date).getTime() - new Date(todayKey).getTime()) / 86400000))
    : null;

  // Weak topics detection from quiz history
  const topicStats: Record<string, { subject: string; correct: number; total: number }> = {};
  quizzes.forEach((q) => {
    if (!q.topic) return;
    if (!topicStats[q.topic]) {
      topicStats[q.topic] = { subject: q.subject, correct: 0, total: 0 };
    }
    topicStats[q.topic].correct += q.score;
    topicStats[q.topic].total += q.total;
  });

  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.total >= 3)
    .map(([topic, stats]) => ({
      topic,
      subject: stats.subject,
      percent: Math.round((stats.correct / stats.total) * 100),
    }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);

  // Flashcards due today
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);
  const dueCardsCount = decks.reduce(
    (acc, d) => acc + d.cards.filter((c) => !c.due || c.due <= Date.now()).length,
    0
  );

  const currentPlan = PLANS[plan.tier];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/15">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-24 -bottom-16 w-48 h-48 rounded-full bg-cyan-400/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Personalized for {profile.level} · {profile.country}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              {getGreeting()}, {profile.name}!
            </h1>
            <p className="text-sm sm:text-base text-indigo-100 font-medium">
              Ready to master something new today? Keep your streak active with step-by-step AI guidance.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-bold text-white">
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{streak.current} day streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs font-bold text-white">
                <Clock className="w-4 h-4 text-cyan-300" />
                <span>{currentMinutes} of {dailyMinutesGoal} min studied today</span>
              </div>
            </div>
          </div>

          {/* Daily Goal Ring */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 shrink-0 self-start md:self-auto">
            <div className="relative w-18 h-18 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-300 stroke-current transition-all duration-700 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={`${goalPercent}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-sm text-white">
                {goalPercent}%
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-indigo-200 font-bold">Daily Target</div>
              <div className="text-lg font-black text-white">{currentMinutes} min</div>
              <div className="text-xs text-indigo-200 font-medium">{dailyMinutesGoal} min goal</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Fast-Action Study Launchers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'tutor' as const,
            title: 'AI Study Tutor',
            desc: 'Ask questions, get step-by-step explanations and math proofs',
            icon: <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
            badge: `${Math.max(0, currentPlan.limits.tutorMsgs - usage.tutorMsgs)} msgs left`,
            bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40',
          },
          {
            id: 'quiz' as const,
            title: 'Practice Quizzes',
            desc: 'Auto-marked practice tests with instant detailed explanations',
            icon: <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
            badge: `${Math.max(0, currentPlan.limits.quizzes - usage.quizzes)} quizzes left`,
            bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200/60 dark:border-purple-800/40',
          },
          {
            id: 'flashcards' as const,
            title: 'Flashcards',
            desc: 'Spaced repetition review to cement formulas and definitions',
            icon: <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
            badge: `${dueCardsCount} due today`,
            bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/60 dark:border-cyan-800/40',
          },
          {
            id: 'notes' as const,
            title: 'Notes & Summaries',
            desc: 'Turn syllabus chapters or pasted text into structured study notes',
            icon: <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
            badge: `${notes.length} saved sets`,
            bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
          },
        ].map((launcher) => (
          <div
            key={launcher.id}
            onClick={() => setActiveTab(launcher.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group ${launcher.bg} bg-white dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                {launcher.icon}
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                {launcher.badge}
              </span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {launcher.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {launcher.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Main Grid: Weekly Chart & Next Exam / Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Activity Chart (2 columns on desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                This Week's Revision Effort
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Minutes studied per day vs your daily {dailyMinutesGoal}-minute target
              </p>
            </div>
            <button
              onClick={() => setActiveTab('planner')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Planner <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bar Chart */}
          <div className="pt-4 flex items-end justify-between gap-3 h-44 border-b border-slate-100 dark:border-slate-800 pb-2">
            {last7Days.map((day) => {
              const heightPct = Math.min(100, Math.round((day.mins / maxMinutesInWeek) * 100));
              const isGoalMet = day.mins >= dailyMinutesGoal;
              const isToday = day.key === todayKey;

              return (
                <div key={day.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {day.mins > 0 ? `${day.mins}m` : '0'}
                  </div>
                  <div className="w-full max-w-[38px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden flex flex-col justify-end h-32 relative">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        isGoalMet
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                          : isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-purple-500'
                          : 'bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                  <div
                    className={`text-xs font-bold ${
                      isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Goal reached ({dailyMinutesGoal}+ min)</span>
            </div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Total this week: {last7Days.reduce((a, b) => a + b.mins, 0)} minutes
            </div>
          </div>
        </div>

        {/* Next Exam Countdown & Quick Target */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Exam Target</h3>
              </div>
              <button
                onClick={() => setActiveTab('planner')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                All Exams ({exams.length})
              </button>
            </div>

            {nextExam ? (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                    {nextExam.subject}
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                      {daysToNextExam}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-1">days left</span>
                  </div>
                </div>

                <div className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                  {nextExam.title}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(nextExam.date).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No upcoming exams logged yet. Add your exam dates to receive personalized countdown revision schedules.
                </p>
                <button
                  onClick={() => setActiveTab('planner')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
                >
                  Add Exam Date
                </button>
              </div>
            )}
          </div>

          {/* Quick study start */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                if (nextExam) {
                  setTabWithArg('quiz', { subject: nextExam.subject, topic: nextExam.title });
                } else {
                  setActiveTab('tutor');
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>{nextExam ? `Practice for ${nextExam.subject}` : 'Start Quick Tutor Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Revision from Weak Topics & Today's Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Revision */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Recommended Focus Areas
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('quiz')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Take Quiz
            </button>
          </div>

          {weakTopics.length > 0 ? (
            <div className="space-y-3">
              {weakTopics.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{item.topic}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.subject}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        item.percent < 50
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {item.percent}% mastery
                    </span>
                    <button
                      onClick={() => setTabWithArg('quiz', { subject: item.subject, topic: item.topic })}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Revise
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Complete practice quizzes and StudyBuddy AI will automatically diagnose your weak concepts and curate focused revision sets.
            </div>
          )}
        </div>

        {/* Quota & Usage breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Daily Entitlements ({currentPlan.name})
              </h3>
            </div>
            {plan.tier === 'starter' && (
              <button
                onClick={() => setActiveTab('upgrade')}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Upgrade Plan
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {[
              {
                label: 'AI Tutor Questions',
                used: usage.tutorMsgs,
                limit: currentPlan.limits.tutorMsgs,
              },
              {
                label: 'AI Quizzes Generated',
                used: usage.quizzes,
                limit: currentPlan.limits.quizzes,
              },
              {
                label: 'AI Flashcards Generated',
                used: usage.flashcardGen,
                limit: currentPlan.limits.flashcardGen,
              },
              {
                label: 'Notes & Chapter Summaries',
                used: usage.notes,
                limit: currentPlan.limits.notes,
              },
            ].map((meter, i) => {
              const pct = Math.min(100, Math.round((meter.used / meter.limit) * 100));
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{meter.label}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {meter.used} / {meter.limit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct > 90
                          ? 'bg-rose-500'
                          : pct > 70
                          ? 'bg-amber-500'
                          : 'bg-indigo-600 dark:bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
            Usage counters reset automatically every midnight (00:00).
          </div>
        </div>
      </div>
    </div>
  );
};
