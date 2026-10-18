import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { NoteItem, FlashcardDeck } from '../types/index.ts';
import { STANDARD_SUBJECTS, PLANS } from '../constants/index.ts';
import { MarkdownRenderer } from '../components/MarkdownRenderer.tsx';
import {
  BookOpen,
  Sparkles,
  Upload,
  Download,
  Trash2,
  Layers,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

export const NotesView: React.FC = () => {
  const {
    notes,
    saveNote,
    deleteNote,
    saveDeck,
    canUse,
    consumeUsage,
    profile,
    plan,
    addToast,
    triggerConfetti,
    setActiveTab,
  } = useApp();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Creation form
  const [subject, setSubject] = useState('Integrated Science');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Selected note detail view
  const activeNote = notes.find((n) => n.id === activeNoteId) || null;
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(txt|md|text|json)$/i)) {
      addToast('Please upload a text file (.txt or .md)', 'warning');
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setSourceText(text);
        addToast(`Uploaded ${file.name} (${text.length} characters)`, 'success');
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateNotes = async () => {
    if (!sourceText || sourceText.trim().length < 25) {
      addToast('Please provide some syllabus text or notes to summarize (at least 25 characters).', 'warning');
      return;
    }

    if (!canUse('notes', 1)) {
      addToast('Daily Notes generation limit reached. Upgrade to Plus/Pro for more!', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          sourceText: sourceText.trim(),
          level: profile.level,
          country: profile.country,
          curriculum: profile.curriculum,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate revision notes.');
      }

      const data = await response.json();
      consumeUsage('notes', 1);

      const newNote: NoteItem = {
        id: `note_${Date.now()}`,
        title: data.title || `${subject} Revision Notes`,
        subject,
        sourceText: sourceText.slice(0, 1000),
        sections: {
          title: data.title || `${subject} Revision Notes`,
          summary: data.summary || '',
          detailedNotes: data.detailedNotes || '',
          keyPoints: data.keyPoints || [],
          terms: data.terms || [],
          practiceQuestions: data.practiceQuestions || [],
          checklist: data.checklist || [],
        },
        createdAt: Date.now(),
      };

      saveNote(newNote);
      setShowCreateModal(false);
      setSourceText('');
      setUploadedFileName(null);
      setActiveNoteId(newNote.id);
      triggerConfetti();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error creating notes', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConvertToFlashcards = (note: NoteItem) => {
    const s = note.sections;
    const cards = [
      ...s.terms.map((t, idx) => ({
        id: `card_from_note_${Date.now()}_t_${idx}`,
        q: `Define: ${t.term}`,
        a: t.definition,
        box: 1,
        due: Date.now(),
        reps: 0,
      })),
      ...s.practiceQuestions.map((q, idx) => ({
        id: `card_from_note_${Date.now()}_q_${idx}`,
        q: q.question,
        a: q.answer,
        box: 1,
        due: Date.now(),
        reps: 0,
      })),
    ];

    if (cards.length === 0) {
      addToast('No terms or questions found in this note.', 'warning');
      return;
    }

    const newDeck: FlashcardDeck = {
      id: `deck_from_note_${Date.now()}`,
      name: `${note.title} (Cards)`,
      folder: note.subject,
      cards,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveDeck(newDeck);
    triggerConfetti();
    addToast(`Created flashcard deck with ${cards.length} cards!`, 'success');
    setActiveTab('flashcards');
  };

  const handleExportMarkdown = (note: NoteItem) => {
    const s = note.sections;
    const mdLines = [
      `# ${s.title}`,
      `**Subject**: ${note.subject} | **Date**: ${new Date(note.createdAt).toLocaleDateString()}`,
      '',
      '## Executive Summary',
      s.summary,
      '',
      '## Detailed Revision Notes',
      s.detailedNotes,
      '',
      '## Key Takeaways',
      ...s.keyPoints.map((k) => `- ${k}`),
      '',
      '## Essential Terms & Definitions',
      ...s.terms.map((t) => `- **${t.term}**: ${t.definition}`),
      '',
      '## Practice Questions',
      ...s.practiceQuestions.map((q, i) => `${i + 1}. **${q.question}**\n   *Answer*: ${q.answer}\n`),
      '',
      '## Revision Checklist',
      ...s.checklist.map((c) => `- [ ] ${c}`),
    ];

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Downloaded Markdown study guide!', 'info');
  };

  // If viewing a single note
  if (activeNote) {
    const s = activeNote.sections;
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveNoteId(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Notes</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleConvertToFlashcards(activeNote)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Turn into Flashcards</span>
            </button>

            <button
              onClick={() => handleExportMarkdown(activeNote)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .md</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Delete these notes permanently?')) {
                  deleteNote(activeNote.id);
                  setActiveNoteId(null);
                }
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note Title & Header Card */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {activeNote.subject}
            </span>
            <span className="text-xs text-slate-400">
              Generated{' '}
              {new Date(activeNote.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {s.title}
          </h1>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
            "{s.summary}"
          </div>
        </div>

        {/* Detailed Revision Notes */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Comprehensive Revision Notes
          </h2>
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
            <MarkdownRenderer content={s.detailedNotes} />
          </div>
        </div>

        {/* Key Takeaways & Essential Terms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Takeaways */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Must-Know Key Takeaways
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {s.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Essential Terms */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Glossary of Essential Terms
            </h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {s.terms.map((t, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">{t.term}</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{t.definition}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Practice Questions with expandable answers */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Exam-Style Practice Questions
          </h2>
          <div className="space-y-3">
            {s.practiceQuestions.map((q, idx) => {
              const isExpanded = expandedQuestions[idx];
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden bg-slate-50 dark:bg-slate-800/50"
                >
                  <button
                    onClick={() =>
                      setExpandedQuestions((prev) => ({
                        ...prev,
                        [idx]: !prev[idx],
                      }))
                    }
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>
                      {idx + 1}. {q.question}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed animate-in fade-in">
                      <strong className="text-emerald-600 dark:text-emerald-400">Model Answer: </strong>
                      {q.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Revision Checklist */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            Topic Mastery Checklist
          </h2>
          <div className="space-y-2">
            {s.checklist.map((item, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // All Notes List View
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Study Guides & Summaries
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Turn long chapters, paste text, or upload files into high-yield revision summaries.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm transition-colors shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Revision Summary</span>
        </button>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              No Saved Notes Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Paste a chapter or topic description and StudyBuddy AI will build full revision notes, key terms, and practice questions.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-sm"
          >
            Create Your First Study Guide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {note.subject}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {note.sections.summary}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>{note.sections.keyPoints.length} key points</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                  Read Guide →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NOTES MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Generate Comprehensive Revision Notes
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Paste Source Text, Topic, or Chapter
                </label>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  rows={6}
                  placeholder="Paste class notes, textbook paragraphs, or describe the syllabus chapter..."
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-indigo-500 text-slate-900 dark:text-white resize-none"
                />
                <div className="text-[11px] text-slate-400 text-right">
                  {sourceText.length} characters
                </div>
              </div>

              {/* Upload Document Box */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
                <input
                  type="file"
                  id="note-file-upload"
                  accept=".txt,.md,.text"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="note-file-upload" className="cursor-pointer block space-y-1">
                  <Upload className="w-6 h-6 text-indigo-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {uploadedFileName ? `Attached: ${uploadedFileName}` : 'Or click to upload .txt or .md study notes'}
                  </div>
                  <div className="text-[10px] text-slate-400">Processed securely in-memory</div>
                </label>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateNotes}
                disabled={isGenerating || sourceText.trim().length < 25}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                    <span>Analyzing & Summarizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Notes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
