import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { QuizQuestion, QuestionType } from '../types/index.ts';
import { STANDARD_SUBJECTS, PLANS } from '../constants/index.ts';
import {
  HelpCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  History,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

export const QuizView: React.FC = () => {
  const {
    tabArg,
    quizzes,
    saveQuizAttempt,
    canUse,
    consumeUsage,
    profile,
    plan,
    addToast,
    triggerConfetti,
  } = useApp();

  const [mode, setMode] = useState<'create' | 'running' | 'result' | 'history'>('create');

  // Form states
  const [subject, setSubject] = useState(tabArg?.subject || 'Mathematics');
  const [topic, setTopic] = useState(tabArg?.topic || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState<number>(10);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['mcq']);
  const [isTimed, setIsTimed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active quiz runner state
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    Array<{ questionId: string; givenAnswer: string; isCorrect: boolean }>
  >([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Sync tabArg if passed
  useEffect(() => {
    if (tabArg) {
      if (tabArg.subject) setSubject(tabArg.subject);
      if (tabArg.topic) setTopic(tabArg.topic);
      setMode('create');
    }
  }, [tabArg]);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (mode === 'running' && isTimed && timeRemaining > 0 && !isAnswerSubmitted) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmitOnTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, isTimed, timeRemaining, isAnswerSubmitted]);

  const toggleType = (t: QuestionType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((x) => x !== t));
      }
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      addToast('Please enter a topic to test.', 'warning');
      return;
    }

    if (!canUse('quizzes', 1)) {
      addToast('Daily Quiz limit reached on your plan. Upgrade to unlock more!', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic: topic.trim(),
          difficulty,
          count,
          types: selectedTypes,
          level: profile.level,
          country: profile.country,
          curriculum: profile.curriculum,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate quiz.');
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('AI returned no valid questions. Please try again.');
      }

      consumeUsage('quizzes', 1);

      setActiveQuestions(data.questions);
      setCurrentIndex(0);
      setUserAnswers([]);
      setSelectedAnswer('');
      setIsAnswerSubmitted(false);
      setQuizStartTime(Date.now());
      if (isTimed) {
        setTimeRemaining(data.questions.length * 45); // 45 seconds per question
      }
      setMode('running');
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error creating quiz', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const evaluateAnswer = (given: string, currentQ: QuizQuestion): boolean => {
    const cleanGiven = given.trim().toLowerCase();
    const cleanAnswer = currentQ.answer.trim().toLowerCase();

    if (currentQ.type === 'mcq' || currentQ.type === 'tf') {
      return cleanGiven === cleanAnswer;
    }

    // Short answer flexible comparison
    if (cleanGiven === cleanAnswer) return true;
    if (cleanGiven.length > 3 && cleanAnswer.includes(cleanGiven)) return true;
    if (cleanAnswer.length > 3 && cleanGiven.includes(cleanAnswer)) return true;

    return false;
  };

  const handleConfirmAnswer = () => {
    if (!selectedAnswer.trim() || isAnswerSubmitted) return;

    const currentQ = activeQuestions[currentIndex];
    const isCorrect = evaluateAnswer(selectedAnswer, currentQ);

    const record = {
      questionId: currentQ.id,
      givenAnswer: selectedAnswer.trim(),
      isCorrect,
    };

    setUserAnswers((prev) => [...prev, record]);
    setIsAnswerSubmitted(true);
  };

  const handleAutoSubmitOnTimeout = () => {
    if (isAnswerSubmitted) return;
    const currentQ = activeQuestions[currentIndex];
    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        givenAnswer: '(Time Expired)',
        isCorrect: false,
      },
    ]);
    setIsAnswerSubmitted(true);
    addToast('Time expired for this question!', 'warning');
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setIsAnswerSubmitted(false);
    } else {
      // Finished quiz!
      const finalAnswers = userAnswers;
      const score = finalAnswers.filter((a) => a.isCorrect).length;
      const total = activeQuestions.length;

      saveQuizAttempt({
        subject,
        topic,
        difficulty,
        questions: activeQuestions,
        answers: finalAnswers,
        score,
        total,
        startedAt: quizStartTime,
        finishedAt: Date.now(),
      });

      if (score === total && total > 0) {
        triggerConfetti();
      }

      setMode('result');
    }
  };

  // Result metrics
  const score = userAnswers.filter((a) => a.isCorrect).length;
  const total = activeQuestions.length || 1;
  const scorePercent = Math.round((score / total) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header Mode Toggle */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('create')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              mode === 'create' || mode === 'running' || mode === 'result'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Practice Studio
          </button>
          <button
            onClick={() => setMode('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              mode === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({quizzes.length})</span>
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Daily Quota:{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {Math.max(0, PLANS[plan.tier].limits.quizzes - useApp().usage.quizzes)} quizzes left
          </span>
        </div>
      </div>

      {/* 1. CREATE MODE */}
      {mode === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Generate Smart Practice Quiz
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                AI crafts authentic syllabus questions tailored for {profile.level} students.
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
              >
                {STANDARD_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Topic or Chapter
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quadratic Factoring, Photosynthesis, West African Empires..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-indigo-500"
              />
            </div>

            {/* Difficulty Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Difficulty Level
              </label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      difficulty === lvl
                        ? lvl === 'easy'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : lvl === 'medium'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Types */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Question Types
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'mcq' as const, label: 'Multiple Choice (4 options)' },
                  { id: 'tf' as const, label: 'True / False' },
                  { id: 'short' as const, label: 'Short Answer' },
                ].map((type) => {
                  const isSel = selectedTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleType(type.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        isSel
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Count & Timed options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Question Count
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} Questions
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Timer Mode
                </label>
                <select
                  value={isTimed ? 'timed' : 'untimed'}
                  onChange={(e) => setIsTimed(e.target.value === 'timed')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
                >
                  <option value="untimed">Untimed (Self-Paced)</option>
                  <option value="timed">Timed (45s per Q)</option>
                </select>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md ${
                isGenerating || !topic.trim()
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                  <span>Drafting Curriculum Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Practice Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Info & Topic Suggestions */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" />
                Why Practice with StudyBuddy?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every question is paired with a clear explanation of <em>why</em> the answer is correct. Taking short quizzes identifies weak conceptual points before real exam day.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Popular High-Yield Topics
              </h3>
              <div className="space-y-2">
                {[
                  { subj: 'Mathematics', top: 'Surds and Logarithms' },
                  { subj: 'Integrated Science', top: 'Acids, Bases, and Salts' },
                  { subj: 'Physics', top: 'Newton’s Laws of Motion' },
                  { subj: 'Social Studies', top: 'Constitutional Rule & Democracy' },
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSubject(sug.subj);
                      setTopic(sug.top);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex justify-between items-center"
                  >
                    <span>{sug.top}</span>
                    <span className="text-[10px] text-indigo-500 font-bold">{sug.subj}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RUNNING QUIZ MODE */}
      {mode === 'running' && activeQuestions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {subject}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{topic}</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Question {currentIndex + 1} of {activeQuestions.length}
              </div>
            </div>

            {isTimed && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-mono font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  {Math.floor(timeRemaining / 60)}:
                  {String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
            />
          </div>

          {/* Question Body */}
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed">
              {activeQuestions[currentIndex].question}
            </h3>

            {/* Multiple Choice Options */}
            {(activeQuestions[currentIndex].type === 'mcq' ||
              activeQuestions[currentIndex].type === 'tf') && (
              <div className="space-y-2.5 pt-2">
                {(
                  activeQuestions[currentIndex].options ||
                  (activeQuestions[currentIndex].type === 'tf' ? ['True', 'False'] : [])
                ).map((opt, idx) => {
                  const isSelected = selectedAnswer === opt;
                  const isCurrentCorrect =
                    opt.trim().toLowerCase() === activeQuestions[currentIndex].answer.trim().toLowerCase();

                  let optStyle =
                    'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200';

                  if (isAnswerSubmitted) {
                    if (isCurrentCorrect) {
                      optStyle =
                        'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold';
                    } else if (isSelected && !isCurrentCorrect) {
                      optStyle =
                        'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 font-bold';
                    } else {
                      optStyle = 'opacity-50 border-slate-200 dark:border-slate-800';
                    }
                  } else if (isSelected) {
                    optStyle =
                      'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerSubmitted}
                      onClick={() => setSelectedAnswer(opt)}
                      className={`w-full p-4 rounded-2xl border text-left text-sm flex items-center justify-between transition-all ${optStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </div>

                      {isAnswerSubmitted && isCurrentCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCurrentCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer Input */}
            {activeQuestions[currentIndex].type === 'short' && (
              <div className="pt-2 space-y-3">
                <input
                  type="text"
                  disabled={isAnswerSubmitted}
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="Type your model answer..."
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Explanation Banner when answered */}
          {isAnswerSubmitted && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Concept Explanation</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeQuestions[currentIndex].explanation}
              </p>
              <div className="text-xs text-slate-500 font-semibold pt-1">
                Correct Answer: <strong className="text-slate-900 dark:text-white">{activeQuestions[currentIndex].answer}</strong>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit this quiz? Progress will be lost.')) {
                  setMode('create');
                }
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Quit Quiz
            </button>

            {!isAnswerSubmitted ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={!selectedAnswer.trim()}
                className={`py-2.5 px-6 rounded-xl font-bold text-sm transition-all shadow-xs ${
                  selectedAnswer.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                Confirm Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>{currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. RESULT MODE */}
      {mode === 'result' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs mb-2">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {scorePercent >= 80 ? 'Outstanding Mastery! 🎉' : scorePercent >= 60 ? 'Good Effort! 👏' : 'Keep Practicing! 💪'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                You scored {score} out of {total} questions correctly ({scorePercent}%).
              </p>
            </div>

            {/* Circular summary ring */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800 stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    scorePercent >= 70 ? 'text-emerald-500' : scorePercent >= 50 ? 'text-amber-500' : 'text-rose-500'
                  } stroke-current transition-all duration-1000 ease-out`}
                  strokeWidth="3.5"
                  strokeDasharray={`${scorePercent}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-slate-900 dark:text-white">
                {scorePercent}%
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setMode('create')}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Take Another Quiz</span>
              </button>

              <button
                onClick={() => setMode('history')}
                className="py-2.5 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors"
              >
                View History
              </button>
            </div>
          </div>

          {/* Breakdown Review of Every Question */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Detailed Question Breakdown
            </h3>

            <div className="space-y-4">
              {activeQuestions.map((q, idx) => {
                const answerRecord = userAnswers[idx];
                const isCorrect = answerRecord?.isCorrect;

                return (
                  <div
                    key={q.id || idx}
                    className={`p-4 rounded-2xl border text-sm space-y-2 ${
                      isCorrect
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {idx + 1}. {q.question}
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Your answer: <strong>{answerRecord?.givenAnswer || '(None)'}</strong>
                    </div>

                    {!isCorrect && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Correct answer: <strong>{q.answer}</strong>
                      </div>
                    )}

                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <strong>Why:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. HISTORY MODE */}
      {mode === 'history' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Quiz History & Progress
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track how your mastery has improved over time.
              </p>
            </div>
            <button
              onClick={() => setMode('create')}
              className="py-1.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              + New Quiz
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold">No quiz attempts recorded yet.</p>
              <button
                onClick={() => setMode('create')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Create your first practice quiz →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => {
                const pct = Math.round((quiz.score / (quiz.total || 1)) * 100);
                return (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {quiz.topic || quiz.subject}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {quiz.subject}
                        </span>
                        <span>·</span>
                        <span className="capitalize">{quiz.difficulty}</span>
                        <span>·</span>
                        <span>
                          {new Date(quiz.finishedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-lg font-black ${
                          pct >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pct >= 50
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {quiz.score}/{quiz.total} ({pct}%)
                      </div>
                      <button
                        onClick={() => {
                          setSubject(quiz.subject);
                          setTopic(quiz.topic);
                          setMode('create');
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Retake Topic
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
