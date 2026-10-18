import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DayPlan } from '../types/index.ts';
import { STANDARD_SUBJECTS } from '../constants/index.ts';
import {
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const PlannerView: React.FC = () => {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    exams,
    addExam,
    deleteExam,
    dailyMinutesGoal,
    setDailyMinutesGoal,
    activity,
    quizzes,
    profile,
    addToast,
    triggerConfetti,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'exams' | 'ai-plan' | 'goals'>('tasks');

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(new Date().toISOString().slice(0, 10));

  // Exam form
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('Mathematics');
  const [examDate, setExamDate] = useState('');

  // AI Plan Generator form
  const [planDays, setPlanDays] = useState(14);
  const [planMinutes, setPlanMinutes] = useState(dailyMinutesGoal || 60);
  const [focusArea, setFocusArea] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{ overview: string; days: DayPlan[] } | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter((t) => !t.done);
  const completedTasks = tasks.filter((t) => t.done);

  // Weak topics from quizzes
  const topicStats: Record<string, { correct: number; total: number }> = {};
  quizzes.forEach((q) => {
    if (!q.topic) return;
    if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
    topicStats[q.topic].correct += q.score;
    topicStats[q.topic].total += q.total;
  });
  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.total >= 3 && stats.correct / stats.total < 0.65)
    .map(([topic]) => topic);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle.trim(), taskDue);
    setTaskTitle('');
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) {
      addToast('Please enter an exam title and valid date', 'warning');
      return;
    }
    addExam(examTitle.trim(), examSubject, examDate);
    setExamTitle('');
    setExamDate('');
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);

    try {
      const response = await fetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyMinutes: planMinutes,
          daysCount: planDays,
          exams: exams.map((e) => ({ title: e.title, subject: e.subject, date: e.date })),
          weakTopics,
          focusAreas: focusArea.trim(),
          level: profile.level,
          country: profile.country,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate study plan.');
      }

      const data = await response.json();
      setGeneratedPlan(data);
      triggerConfetti();
      addToast('Personalized revision schedule created!', 'success');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error generating plan', 'error');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleAddPlanTasksToPlanner = () => {
    if (!generatedPlan) return;
    let count = 0;
    const now = new Date();

    generatedPlan.days.forEach((day, idx) => {
      const taskDate = new Date(now.getTime() + idx * 86400000).toISOString().slice(0, 10);
      day.tasks.forEach((t) => {
        addTask(`[${day.focusSubject}] ${t}`, taskDate);
        count++;
      });
    });

    addToast(`Added ${count} revision tasks to your planner!`, 'success');
    setActiveSubTab('tasks');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'tasks' as const, label: `Daily Tasks (${openTasks.length})` },
          { id: 'exams' as const, label: `Exam Targets (${exams.length})` },
          { id: 'ai-plan' as const, label: 'AI Study Schedule' },
          { id: 'goals' as const, label: 'Study Goals & Hours' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. TASKS TAB */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Add task bar */}
          <form
            onSubmit={handleAddTask}
            className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Add a revision task... e.g. Solve 5 surd problems, Revise digestive enzymes"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-indigo-500 text-slate-900 dark:text-white"
            />
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            />
            <button
              type="submit"
              disabled={!taskTitle.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </form>

          {/* Open Tasks List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Open Study Tasks</span>
              <span className="text-xs text-slate-400 font-semibold">{openTasks.length} pending</span>
            </h3>

            {openTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  All caught up! No pending tasks.
                </p>
                <p className="text-xs">Add revision goals above or generate an AI timetable.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {openTasks.map((t) => {
                  const isOverdue = t.due && t.due < todayKey;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <button
                          type="button"
                          onClick={() => toggleTask(t.id)}
                          className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-indigo-500 transition-colors shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {t.title}
                          </div>
                          {t.due && (
                            <div
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{isOverdue ? `Overdue (${t.due})` : `Due: ${t.due}`}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteTask(t.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 opacity-75">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-1.5">
                {completedTasks.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 line-through"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{t.title}</span>
                    </div>
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. EXAMS TAB */}
      {activeSubTab === 'exams' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Add exam form */}
          <form
            onSubmit={handleAddExam}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="sm:col-span-2">
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="e.g. WASSCE Core Mathematics Paper 2"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <select
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {STANDARD_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0"
              >
                Add
              </button>
            </div>
          </form>

          {/* Exams list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => {
              const daysLeft = Math.ceil(
                (new Date(ex.date).getTime() - new Date(todayKey).getTime()) / 86400000
              );
              const isUrgent = daysLeft <= 14;

              return (
                <div
                  key={ex.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {ex.subject}
                    </span>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {ex.title}
                    </h4>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(ex.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <div
                      className={`text-2xl font-black ${
                        daysLeft <= 7
                          ? 'text-rose-600 dark:text-rose-400'
                          : isUrgent
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {Math.max(0, daysLeft)}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Days Left</div>
                    <button
                      onClick={() => deleteExam(ex.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. AI STUDY SCHEDULE GENERATOR */}
      {activeSubTab === 'ai-plan' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Smart Revision Timetable
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                The AI analyzes your upcoming exam dates, daily study time, and past quiz weak topics to assemble a realistic daily study roadmap.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Daily Revision Allowance
                </label>
                <select
                  value={planMinutes}
                  onChange={(e) => setPlanMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  {[30, 45, 60, 90, 120, 180].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes / day
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Plan Duration
                </label>
                <select
                  value={planDays}
                  onChange={(e) => setPlanDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  {[7, 14, 21, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} Days Plan
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Special Focus or Priority Topics (Optional)
              </label>
              <input
                type="text"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                placeholder="e.g. Focus heavily on Surds, Photosynthesis, and Essay structuring"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="w-full py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              {isGeneratingPlan ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                  <span>Calculating Optimal Revision Path...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {planDays}-Day Timetable</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Plan Output */}
          {generatedPlan && (
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Your Personalized Revision Timetable
                </h3>
                <button
                  onClick={handleAddPlanTasksToPlanner}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  + Add All to My Tasks
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic">
                "{generatedPlan.overview}"
              </div>

              <div className="space-y-3">
                {generatedPlan.days.map((day) => (
                  <div
                    key={day.dayNumber}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                          {day.dayName}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {day.focusSubject}: {day.topic}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">
                        ~{day.estimatedMinutes} min
                      </span>
                    </div>

                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-4 list-disc">
                      {day.tasks.map((task, idx) => (
                        <li key={idx}>{task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. GOALS TAB */}
      {activeSubTab === 'goals' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Daily Study Target Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adjust your daily target. Consistency is proven to outperform last-minute cramming.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="number"
              min="15"
              max="480"
              step="5"
              value={dailyMinutesGoal}
              onChange={(e) => setDailyMinutesGoal(Math.max(15, Number(e.target.value)))}
              className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-black text-indigo-600 dark:text-indigo-400 text-center"
            />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Minutes of focused revision each day
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Recent Revision Log
            </h3>
            <div className="space-y-2">
              {Object.entries(activity)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 7)
                .map(([dateKey, act]) => (
                  <div
                    key={dateKey}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs flex justify-between items-center text-slate-600 dark:text-slate-300"
                  >
                    <span className="font-semibold">{dateKey}</span>
                    <span>
                      {act.minutes} min · {act.tutorMsgs} questions · {act.quizzes} quizzes
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
