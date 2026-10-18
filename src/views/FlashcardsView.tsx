import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { FlashcardDeck, Flashcard } from '../types/index.ts';
import { STANDARD_SUBJECTS, PLANS } from '../constants/index.ts';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Play,
  RotateCw,
  Lightbulb,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
} from 'lucide-react';

export const FlashcardsView: React.FC = () => {
  const {
    decks,
    saveDeck,
    deleteDeck,
    updateCardReview,
    canUse,
    consumeUsage,
    profile,
    plan,
    addToast,
    triggerConfetti,
  } = useApp();

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [cardsCompletedInSession, setCardsCompletedInSession] = useState(0);

  // Modals
  const [showManualDeckModal, setShowManualDeckModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // Manual Deck form
  const [deckName, setDeckName] = useState('');
  const [deckFolder, setDeckFolder] = useState('General');

  // AI Generation form
  const [aiSubject, setAiSubject] = useState('Mathematics');
  const [aiTopic, setAiTopic] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [aiCount, setAiCount] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Card form
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');
  const [cardHint, setCardHint] = useState('');

  const activeDeck = decks.find((d) => d.id === activeDeckId) || null;

  // Start Review Session
  const startReview = (deck: FlashcardDeck) => {
    // Prioritize due cards first
    const now = Date.now();
    const dueCards = deck.cards.filter((c) => !c.due || c.due <= now);
    const queue = dueCards.length > 0 ? dueCards : deck.cards;

    if (queue.length === 0) {
      addToast('Add some cards to this deck first!', 'warning');
      return;
    }

    setActiveDeckId(deck.id);
    setReviewQueue(queue);
    setCurrentReviewIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setCardsCompletedInSession(0);
    setIsReviewing(true);
  };

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeDeck || reviewQueue.length === 0) return;

    const currentCard = reviewQueue[currentReviewIndex];
    updateCardReview(activeDeck.id, currentCard.id, rating);
    setCardsCompletedInSession((prev) => prev + 1);

    if (currentReviewIndex + 1 < reviewQueue.length) {
      setCurrentReviewIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // Completed session
      triggerConfetti();
      setIsReviewing(false);
      addToast('Review session completed! Great memory work!', 'success');
    }
  };

  const handleCreateManualDeck = () => {
    if (!deckName.trim()) {
      addToast('Please enter a deck title', 'warning');
      return;
    }

    const newDeck: FlashcardDeck = {
      id: `deck_${Date.now()}`,
      name: deckName.trim(),
      folder: deckFolder.trim() || 'General',
      cards: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveDeck(newDeck);
    setDeckName('');
    setShowManualDeckModal(false);
    setActiveDeckId(newDeck.id);
  };

  const handleAddManualCard = () => {
    if (!activeDeck || !cardQ.trim() || !cardA.trim()) {
      addToast('Please provide both question and answer', 'warning');
      return;
    }

    const newCard: Flashcard = {
      id: `card_${Date.now()}`,
      q: cardQ.trim(),
      a: cardA.trim(),
      hint: cardHint.trim() || undefined,
      box: 1,
      due: Date.now(),
      reps: 0,
    };

    saveDeck({
      ...activeDeck,
      cards: [...activeDeck.cards, newCard],
    });

    setCardQ('');
    setCardA('');
    setCardHint('');
    setShowAddCardModal(false);
  };

  const handleGenerateAiDeck = async () => {
    if (!aiTopic.trim() && !aiNotes.trim()) {
      addToast('Please provide a topic or paste notes', 'warning');
      return;
    }

    if (!canUse('flashcardGen', aiCount)) {
      addToast('Daily AI Flashcard generation limit reached. Upgrade for more!', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSubject,
          topic: aiTopic.trim(),
          notesText: aiNotes.trim(),
          count: aiCount,
          level: profile.level,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate flashcards.');
      }

      const data = await response.json();
      if (!data.cards || data.cards.length === 0) {
        throw new Error('No flashcards were returned. Please try again.');
      }

      consumeUsage('flashcardGen', data.cards.length);

      const newDeck: FlashcardDeck = {
        id: `deck_ai_${Date.now()}`,
        name: data.deckTitle || `${aiSubject}: ${aiTopic || 'Revision'}`,
        folder: aiSubject,
        cards: data.cards.map((c: any, i: number) => ({
          id: `card_ai_${Date.now()}_${i}`,
          q: c.q,
          a: c.a,
          hint: c.hint,
          box: 1,
          due: Date.now(),
          reps: 0,
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      saveDeck(newDeck);
      setShowAiModal(false);
      setAiTopic('');
      setAiNotes('');
      setActiveDeckId(newDeck.id);
      triggerConfetti();
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Error generating cards', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Review Mode View
  if (isReviewing && activeDeck && reviewQueue.length > 0) {
    const currentCard = reviewQueue[currentReviewIndex];
    const progressPct = Math.round(((currentReviewIndex + 1) / reviewQueue.length) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsReviewing(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>End Review</span>
          </button>

          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Card {currentReviewIndex + 1} of {reviewQueue.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 3D Flip Card Container */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="perspective-1000 min-h-[300px] sm:min-h-[360px] cursor-pointer select-none"
        >
          <div
            className={`relative w-full h-full min-h-[300px] sm:min-h-[360px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-transform duration-500 transform-style-3d border shadow-lg ${
              isFlipped
                ? 'bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 border-indigo-200 dark:border-indigo-800 rotate-y-180'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Front Side */}
            {!isFlipped ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Question (Box {currentCard.box})</span>
                  <span className="flex items-center gap-1 text-indigo-500">
                    <RotateCw className="w-3.5 h-3.5" /> Tap card to flip
                  </span>
                </div>

                <div className="my-auto py-4 text-center">
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
                    {currentCard.q}
                  </h3>

                  {currentCard.hint && (
                    <div className="mt-4">
                      {showHint ? (
                        <div className="inline-block p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-200 animate-in fade-in">
                          <strong>Hint:</strong> {currentCard.hint}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowHint(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Show Hint</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center text-xs text-slate-400 font-semibold">
                  Click anywhere to reveal answer
                </div>
              </div>
            ) : (
              /* Back Side */
              <div className="flex-1 flex flex-col justify-between [transform:rotateY(180deg)]">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <span>Answer</span>
                  <span>Tap to flip back</span>
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {currentCard.a}
                  </p>
                </div>

                <div className="text-center text-xs text-slate-400 font-semibold">
                  Rate how well you recalled this concept below
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Buttons (Leitner Algorithm) */}
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-in fade-in">
            <button
              onClick={() => handleRating('again')}
              className="py-3 px-2 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-extrabold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors text-center"
            >
              <div>Again</div>
              <div className="text-[10px] font-medium opacity-80 mt-0.5">&lt; 10 min</div>
            </button>

            <button
              onClick={() => handleRating('hard')}
              className="py-3 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-extrabold hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-center"
            >
              <div>Hard</div>
              <div className="text-[10px] font-medium opacity-80 mt-0.5">1 day</div>
            </button>

            <button
              onClick={() => handleRating('good')}
              className="py-3 px-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-extrabold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors text-center"
            >
              <div>Good</div>
              <div className="text-[10px] font-medium opacity-80 mt-0.5">3-4 days</div>
            </button>

            <button
              onClick={() => handleRating('easy')}
              className="py-3 px-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors text-center"
            >
              <div>Easy</div>
              <div className="text-[10px] font-medium opacity-80 mt-0.5">8-12 days</div>
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setIsFlipped(true)}
              className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-colors"
            >
              Reveal Answer
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Revision Flashcard Decks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Master syllabus definitions, formulas, and diagrams using active recall.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManualDeckModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Deck</span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>AI Deck Generator</span>
          </button>
        </div>
      </div>

      {/* Decks Grid */}
      {decks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              No Flashcard Decks Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Create a deck manually or generate one instantly with AI from any syllabus topic or notes.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setShowManualDeckModal(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
            >
              Create Blank Deck
            </button>
            <button
              onClick={() => setShowAiModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold"
            >
              Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {decks.map((deck) => {
            const now = Date.now();
            const dueCount = deck.cards.filter((c) => !c.due || c.due <= now).length;

            return (
              <div
                key={deck.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {deck.folder || 'General'}
                    </span>

                    {dueCount > 0 ? (
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {dueCount} due
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All caught up
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {deck.name}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {deck.cards.length} flashcards in deck
                    </div>
                  </div>
                </div>

                {/* Bottom Deck Action Controls */}
                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => startReview(deck)}
                    disabled={deck.cards.length === 0}
                    className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-xs ${
                      deck.cards.length === 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Review ({deck.cards.length})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setActiveDeckId(deck.id);
                        setShowAddCardModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                      title="Add card to deck"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${deck.name}" and all cards?`)) {
                          deleteDeck(deck.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete deck"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: AI Deck Generator */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Generate Flashcards with AI
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Subject
                </label>
                <select
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
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
                  Topic Title
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Chemical Bonding, African Geography, Circle Theorems"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Paste Notes or Syllabus Text (Optional)
                </label>
                <textarea
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  rows={4}
                  placeholder="Paste textbook excerpts or summary paragraphs..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-indigo-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Number of Cards
                </label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  {[10, 15, 20, 30].map((n) => (
                    <option key={n} value={n}>
                      {n} Cards
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAiDeck}
                disabled={isGenerating || (!aiTopic.trim() && !aiNotes.trim())}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                    <span>Writing Cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Deck</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manual Deck Create */}
      {showManualDeckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Create New Blank Deck</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Deck Title</label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="e.g. Physics Formulas"
                  className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Subject / Category</label>
                <select
                  value={deckFolder}
                  onChange={(e) => setDeckFolder(e.target.value)}
                  className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                >
                  {STANDARD_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowManualDeckModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualDeck}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs"
              >
                Create Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Card to active deck */}
      {showAddCardModal && activeDeck && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Add Card to "{activeDeck.name}"
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Front (Question / Prompt)</label>
                <textarea
                  rows={2}
                  value={cardQ}
                  onChange={(e) => setCardQ(e.target.value)}
                  placeholder="e.g. State Archimedes' Principle"
                  className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Back (Answer / Explanation)</label>
                <textarea
                  rows={3}
                  value={cardA}
                  onChange={(e) => setCardA(e.target.value)}
                  placeholder="e.g. An object immersed in a fluid experiences an upward buoyant force equal to the weight of fluid displaced."
                  className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Memory Clue / Hint (Optional)</label>
                <input
                  type="text"
                  value={cardHint}
                  onChange={(e) => setCardHint(e.target.value)}
                  placeholder="e.g. Think of bathtub displacement"
                  className="w-full px-3.5 py-2 mt-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCardModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddManualCard}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
