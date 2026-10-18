import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { STANDARD_SUBJECTS, PLANS } from '../constants/index.ts';
import { EducationLevel } from '../types/index.ts';
import {
  User,
  Sparkles,
  Download,
  Trash2,
  ShieldCheck,
  Moon,
  Sun,
  BookOpen,
  Check,
  FileText,
  X,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    plan,
    theme,
    toggleTheme,
    resetAllData,
    exportDataJson,
    addToast,
  } = useApp();

  const [name, setName] = useState(profile.name);
  const [level, setLevel] = useState<EducationLevel>(profile.level);
  const [country, setCountry] = useState(profile.country);
  const [curriculum, setCurriculum] = useState(profile.curriculum);
  const [language, setLanguage] = useState(profile.language);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(profile.subjects);

  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isTestingHealth, setIsTestingHealth] = useState(false);

  // Modals for Privacy and Terms
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Scholar',
      level,
      country: country.trim() || 'Ghana',
      curriculum: curriculum.trim(),
      language: language.trim() || 'English',
      subjects: selectedSubjects,
    });
  };

  const toggleSubject = (s: string) => {
    if (selectedSubjects.includes(s)) {
      setSelectedSubjects(selectedSubjects.filter((x) => x !== s));
    } else {
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  const handleTestHealth = async () => {
    setIsTestingHealth(true);
    setHealthStatus(null);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'ok') {
        setHealthStatus(`Connected! Model: ${data.model} · Ready for learning.`);
        addToast('AI Server is healthy and responsive!', 'success');
      } else {
        setHealthStatus('Server responded with an issue.');
      }
    } catch (err: any) {
      setHealthStatus('Could not reach backend server.');
      addToast('Error reaching server health check', 'error');
    } finally {
      setIsTestingHealth(false);
    }
  };

  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      const res = await fetch('/api/download-zip');
      if (!res.ok) throw new Error('Download failed from server');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'studybuddy-ai-source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Downloaded StudyBuddy source ZIP!', 'success');
    } catch (err: any) {
      console.error(err);
      window.location.href = '/api/download-zip';
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleExportData = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyBuddy_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('All data exported as JSON!', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Profile Configuration Form */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Student Academic Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            StudyBuddy AI uses this information to adapt explanations, difficulty, and examples to your exact syllabus.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Student Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Education Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as EducationLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-indigo-500"
              >
                <option value="JHS">JHS (Junior High School / Basic 7-9)</option>
                <option value="SHS">SHS (Senior High School / Form 1-3)</option>
                <option value="University">University / College Undergraduate</option>
                <option value="Other">Other / Lifelong Learner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Curriculum / Board</label>
              <input
                type="text"
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                placeholder="e.g. WAEC / GES / Cambridge"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Subjects of Interest */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Primary Subjects of Interest
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_SUBJECTS.map((subj) => {
                const isSelected = selectedSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* AI Intelligence Architecture */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Intelligence & Security
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Powered by Google Gemini 3.8 Flash running securely server-side.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">Gemini 3.8 Flash SDK</div>
            <div className="text-slate-500 dark:text-slate-400">
              Low-latency streaming responses, structured JSON quiz schemas, and formula derivations.
            </div>
          </div>

          <button
            onClick={handleTestHealth}
            disabled={isTestingHealth}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs shrink-0 transition-colors"
          >
            {isTestingHealth ? 'Checking...' : 'Test Connection'}
          </button>
        </div>

        {healthStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold animate-in fade-in">
            {healthStatus}
          </div>
        )}
      </div>

      {/* Appearance & Preferences */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
          Appearance & Display
        </h2>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              High-contrast theme optimized for nighttime studying and eye comfort
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Data Management & Privacy */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            Data Management & Privacy
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All your notes, chats, quizzes, and decks remain strictly in your browser's private local storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-white" />
            <span>{isDownloadingZip ? 'Preparing ZIP...' : 'Download Project Source (.ZIP)'}</span>
          </button>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Export Study Data (JSON)</span>
          </button>

          <button
            onClick={() => setShowPrivacy(true)}
            className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
          >
            Privacy Policy
          </button>

          <button
            onClick={() => setShowTerms(true)}
            className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
          >
            Terms of Service
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400">Reset Local Storage</div>
            <div className="text-[11px] text-slate-400">Erases all saved chats, flashcards, and quizzes from this browser.</div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to erase all data and reset the app?')) {
                resetAllData();
              }
            }}
            className="py-1.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs hover:bg-rose-100 transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </div>

      {/* PRIVACY MODAL */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Privacy Policy</h3>
              <button onClick={() => setShowPrivacy(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p><strong>1. Data Storage:</strong> StudyBuddy AI is local-first. Your personal profile, study chats, flashcards, quizzes, and revision notes are stored exclusively in your browser's private local storage.</p>
              <p><strong>2. AI Processing:</strong> Academic questions and syllabus excerpts sent to the AI tutor are transmitted securely through the server backend to Google Gemini's API to generate explanations. We do not sell your academic prompts or telemetry.</p>
              <p><strong>3. Children & Minors:</strong> StudyBuddy is designed for students. We collect only what is strictly required to run academic revision tools.</p>
            </div>
            <div className="pt-2 text-right">
              <button onClick={() => setShowPrivacy(false)} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TERMS MODAL */}
      {showTerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Terms of Service</h3>
              <button onClick={() => setShowTerms(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p><strong>1. Educational Aid:</strong> StudyBuddy AI provides supplemental study materials, explanations, and practice questions. It is a study partner and is not an official examination body or substitute for teachers.</p>
              <p><strong>2. Accuracy:</strong> While Gemini 3.8 Flash is highly capable in STEM and humanities, students should always corroborate critical formulas and syllabus guidelines with their official textbooks and teachers.</p>
              <p><strong>3. Practice Questions:</strong> Practice tests generated by the AI are synthetic questions designed for active recall practice and are not stolen or official leaked examination papers.</p>
            </div>
            <div className="pt-2 text-right">
              <button onClick={() => setShowTerms(false)} className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
