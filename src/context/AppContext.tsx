import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  UserPlan,
  PlanTier,
  ChatSession,
  ChatMessage,
  QuizAttempt,
  FlashcardDeck,
  Flashcard,
  NoteItem,
  PlannerTask,
  ExamCountdown,
  DailyActivity,
  DailyUsage,
} from '../types/index.ts';
import { PLANS, ACHIEVEMENTS, STANDARD_SUBJECTS } from '../constants/index.ts';

export type NavigationTab =
  | 'dashboard'
  | 'tutor'
  | 'quiz'
  | 'flashcards'
  | 'notes'
  | 'planner'
  | 'achievements'
  | 'upgrade'
  | 'settings';

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  tabArg: any;
  setTabWithArg: (tab: NavigationTab, arg?: any) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  plan: UserPlan;
  setPlanTier: (tier: PlanTier, annual?: boolean) => void;
  usage: DailyUsage;
  canUse: (key: keyof Omit<DailyUsage, 'date'>, amount?: number) => boolean;
  consumeUsage: (key: keyof Omit<DailyUsage, 'date'>, amount?: number) => boolean;
  chats: ChatSession[];
  activeChat: ChatSession | null;
  setActiveChatId: (id: string | null) => void;
  createNewChat: (subject?: string) => ChatSession;
  deleteChat: (id: string) => void;
  addChatMessage: (chatId: string, message: ChatMessage) => void;
  updateLastMessageContent: (chatId: string, appendText: string) => void;
  quizzes: QuizAttempt[];
  saveQuizAttempt: (attempt: Omit<QuizAttempt, 'id'>) => void;
  decks: FlashcardDeck[];
  saveDeck: (deck: FlashcardDeck) => void;
  deleteDeck: (deckId: string) => void;
  updateCardReview: (deckId: string, cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  notes: NoteItem[];
  saveNote: (note: NoteItem) => void;
  deleteNote: (noteId: string) => void;
  tasks: PlannerTask[];
  addTask: (title: string, due?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  exams: ExamCountdown[];
  addExam: (title: string, subject: string, date: string) => void;
  deleteExam: (id: string) => void;
  dailyMinutesGoal: number;
  setDailyMinutesGoal: (minutes: number) => void;
  streak: { current: number; best: number; lastDate: string };
  activity: Record<string, DailyActivity>;
  recordActivity: (type: keyof DailyActivity, count?: number, minutes?: number) => void;
  unlockedAchievements: Record<string, number>;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
  triggerConfetti: () => void;
  resetAllData: () => void;
  exportDataJson: () => string;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  profile: 'sb_profile_v2',
  plan: 'sb_plan_v2',
  theme: 'sb_theme_v2',
  chats: 'sb_chats_v2',
  activeChatId: 'sb_active_chat_id_v2',
  quizzes: 'sb_quizzes_v2',
  decks: 'sb_decks_v2',
  notes: 'sb_notes_v2',
  tasks: 'sb_tasks_v2',
  exams: 'sb_exams_v2',
  goals: 'sb_goals_v2',
  streak: 'sb_streak_v2',
  activity: 'sb_activity_v2',
  usage: 'sb_usage_v2',
  achievements: 'sb_achievements_v2',
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavigationTab>('dashboard');
  const [tabArg, setTabArg] = useState<any>(null);

  const setTabWithArg = (tab: NavigationTab, arg?: any) => {
    setActiveTabState(tab);
    setTabArg(arg ?? null);
  };

  const setActiveTab = (tab: NavigationTab) => {
    setTabWithArg(tab, null);
  };

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // safe fallback
    }
  };

  // Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.profile);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      name: 'Scholar',
      email: 'student@studybuddy.ai',
      level: 'SHS',
      country: 'Ghana',
      curriculum: 'WAEC / WASSCE',
      language: 'English',
      subjects: ['Mathematics', 'Integrated Science', 'English Language', 'Social Studies'],
    };
  });

  const updateProfile = (patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(updated));
      return updated;
    });
    addToast('Profile updated', 'success');
  };

  // Plan
  const [plan, setPlan] = useState<UserPlan>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.plan);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      tier: 'starter',
      since: Date.now(),
      renews: Date.now() + 30 * 86400000,
      source: 'free',
      annual: false,
    };
  });

  const setPlanTier = (tier: PlanTier, annual: boolean = false) => {
    const updated: UserPlan = {
      tier,
      since: Date.now(),
      renews: Date.now() + (annual ? 365 : 30) * 86400000,
      source: tier === 'starter' ? 'free' : 'test',
      annual,
    };
    setPlan(updated);
    localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(updated));
    triggerConfetti();
    addToast(`Switched to ${PLANS[tier].name}!`, 'success');
  };

  // Daily Usage Limits
  const [usage, setUsage] = useState<DailyUsage>(() => {
    const today = getTodayKey();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.usage);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.date === today) return parsed;
      }
    } catch (e) {}
    return {
      date: today,
      tutorMsgs: 0,
      quizzes: 0,
      flashcardGen: 0,
      notes: 0,
    };
  });

  const saveUsageState = (newUsage: DailyUsage) => {
    setUsage(newUsage);
    localStorage.setItem(STORAGE_KEYS.usage, JSON.stringify(newUsage));
  };

  const checkUsageReset = () => {
    const today = getTodayKey();
    if (usage.date !== today) {
      const resetUsage: DailyUsage = {
        date: today,
        tutorMsgs: 0,
        quizzes: 0,
        flashcardGen: 0,
        notes: 0,
      };
      saveUsageState(resetUsage);
      return resetUsage;
    }
    return usage;
  };

  const canUse = (key: keyof Omit<DailyUsage, 'date'>, amount = 1): boolean => {
    const current = checkUsageReset();
    const limit = PLANS[plan.tier].limits[key];
    return current[key] + amount <= limit;
  };

  const consumeUsage = (key: keyof Omit<DailyUsage, 'date'>, amount = 1): boolean => {
    const current = checkUsageReset();
    const limit = PLANS[plan.tier].limits[key];
    if (current[key] + amount > limit) {
      addToast(
        `Daily ${key} limit reached on ${PLANS[plan.tier].name}. Upgrade to Plus/Pro for more!`,
        'warning'
      );
      return false;
    }
    const updated = {
      ...current,
      [key]: current[key] + amount,
    };
    saveUsageState(updated);
    return true;
  };

  // Streak & Activity
  const [streak, setStreak] = useState<{ current: number; best: number; lastDate: string }>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.streak);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return { current: 1, best: 1, lastDate: getTodayKey() };
  });

  const [activity, setActivity] = useState<Record<string, DailyActivity>>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.activity);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return {
      [getTodayKey()]: { minutes: 15, tutorMsgs: 1, quizzes: 1, flashcards: 5, notes: 0 },
    };
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, number>>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.achievements);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return { first_steps: Date.now() };
  });

  const checkAchievementsAfterAction = (
    updatedActivity: Record<string, DailyActivity>,
    updatedQuizzes: QuizAttempt[],
    updatedDecks: FlashcardDeck[],
    updatedNotes: NoteItem[],
    updatedExams: ExamCountdown[],
    currentStreak: number
  ) => {
    const totalTutorMsgs = Object.values(updatedActivity).reduce((acc, a) => acc + (a.tutorMsgs || 0), 0);
    const totalCards = updatedDecks.reduce((acc, d) => acc + d.cards.length, 0);

    const checks: Record<string, boolean> = {
      first_steps: true,
      curious: totalTutorMsgs >= 10,
      quiz_rookie: updatedQuizzes.length >= 1,
      sharp_shooter: updatedQuizzes.length >= 5,
      perfect_score: updatedQuizzes.some((q) => q.total > 0 && q.score === q.total),
      card_maker: totalCards >= 20,
      deck_master: totalCards >= 50,
      note_taker: updatedNotes.length >= 3,
      exam_ready: updatedExams.length >= 1,
      streak_3: currentStreak >= 3,
      streak_7: currentStreak >= 7,
      streak_30: currentStreak >= 30,
    };

    setUnlockedAchievements((prev) => {
      let changed = false;
      const copy = { ...prev };
      for (const [id, passed] of Object.entries(checks)) {
        if (passed && !copy[id]) {
          copy[id] = Date.now();
          changed = true;
          const achObj = ACHIEVEMENTS.find((a) => a.id === id);
          if (achObj) {
            triggerConfetti();
            addToast(`Badge Unlocked: ${achObj.emoji} ${achObj.name}!`, 'success');
          }
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(copy));
      }
      return copy;
    });
  };

  const recordActivity = (type: keyof DailyActivity, count = 1, minutes = 0) => {
    const today = getTodayKey();
    const updated = { ...activity };
    const cur = updated[today] || { minutes: 0, tutorMsgs: 0, quizzes: 0, flashcards: 0, notes: 0 };
    updated[today] = {
      ...cur,
      [type]: cur[type] + count,
      minutes: cur.minutes + minutes,
    };
    setActivity(updated);
    localStorage.setItem(STORAGE_KEYS.activity, JSON.stringify(updated));

    // Update streak
    setStreak((prev) => {
      if (prev.lastDate === today) return prev;
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const isConsecutive = prev.lastDate === yesterday;
      const newCurrent = isConsecutive ? prev.current + 1 : 1;
      const newBest = Math.max(prev.best, newCurrent);
      const newStreak = { current: newCurrent, best: newBest, lastDate: today };
      localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(newStreak));
      return newStreak;
    });

    checkAchievementsAfterAction(updated, quizzes, decks, notes, exams, streak.current);
  };

  // Chats
  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.chats);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: 'chat_sample_1',
        title: 'Photosynthesis & Light Reactions',
        subject: 'Integrated Science',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Can you explain the difference between light-dependent and light-independent reactions?',
            timestamp: Date.now() - 3600000,
          },
          {
            id: 'm2',
            role: 'model',
            content: `### Understanding Photosynthesis

Photosynthesis takes place in chloroplasts through two main interconnected stages:

1. **Light-Dependent Reactions (In Thylakoids)**:
   - **Requires Sunlight**: Photons hit chlorophyll pigments, exciting electrons.
   - **Water Split ($H_2O$)**: Photolysis splits water, releasing oxygen ($O_2$) into the air.
   - **Energy Created**: Generates ATP and NADPH chemical energy carriers.

2. **Light-Independent Reactions / Calvin Cycle (In Stroma)**:
   - **No direct light needed**: Uses the ATP and NADPH produced in stage 1.
   - **Carbon Fixation**: Takes carbon dioxide ($CO_2$) and combines it with RuBP to synthesize glucose ($C_6H_{12}O_6$).

**Everyday Analogy**:
Think of stage 1 like solar panels capturing electricity during daytime to charge a battery. Stage 2 is like using that battery power in the kitchen to bake bread!

**Check Yourself**:
*Which stage is responsible for producing the oxygen we breathe?*`,
            timestamp: Date.now() - 3500000,
          },
        ],
      },
    ];
  });

  const [activeChatId, setActiveChatIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.activeChatId) || (chats[0]?.id ?? null);
  });

  const setActiveChatId = (id: string | null) => {
    setActiveChatIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.activeChatId, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.activeChatId);
    }
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const createNewChat = (subject = 'General') => {
    const newChat: ChatSession = {
      id: `chat_${Date.now()}`,
      title: `${subject} Study Session`,
      subject,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newChat, ...chats];
    setChats(updated);
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(updated));
    setActiveChatId(newChat.id);
    return newChat;
  };

  const deleteChat = (id: string) => {
    const updated = chats.filter((c) => c.id !== id);
    setChats(updated);
    localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(updated));
    if (activeChatId === id) {
      setActiveChatId(updated[0]?.id || null);
    }
    addToast('Chat removed', 'info');
  };

  const addChatMessage = (chatId: string, message: ChatMessage) => {
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c.id === chatId) {
          const newMessages = [...c.messages, message];
          let title = c.title;
          if (c.messages.length === 0 && message.role === 'user') {
            title = message.content.slice(0, 42) + (message.content.length > 42 ? '...' : '');
          }
          return {
            ...c,
            title,
            messages: newMessages,
            updatedAt: Date.now(),
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(updated));
      return updated;
    });
  };

  const updateLastMessageContent = (chatId: string, appendText: string) => {
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c.id === chatId && c.messages.length > 0) {
          const lastMsg = c.messages[c.messages.length - 1];
          const updatedLastMsg = {
            ...lastMsg,
            content: lastMsg.content + appendText,
          };
          return {
            ...c,
            messages: [...c.messages.slice(0, -1), updatedLastMsg],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
      return updated;
    });
  };

  // Quizzes
  const [quizzes, setQuizzes] = useState<QuizAttempt[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.quizzes);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: 'quiz_init_1',
        subject: 'Mathematics',
        topic: 'Quadratic Equations & Factoring',
        difficulty: 'medium',
        score: 8,
        total: 10,
        startedAt: Date.now() - 86400000,
        finishedAt: Date.now() - 86400000 + 600000,
        questions: [],
        answers: [],
      },
      {
        id: 'quiz_init_2',
        subject: 'Integrated Science',
        topic: 'Photosynthesis & Plant Transport',
        difficulty: 'hard',
        score: 7,
        total: 10,
        startedAt: Date.now() - 172800000,
        finishedAt: Date.now() - 172800000 + 720000,
        questions: [],
        answers: [],
      },
    ];
  });

  const saveQuizAttempt = (attempt: Omit<QuizAttempt, 'id'>) => {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `quiz_attempt_${Date.now()}`,
    };
    const updated = [newAttempt, ...quizzes];
    setQuizzes(updated);
    localStorage.setItem(STORAGE_KEYS.quizzes, JSON.stringify(updated));
    recordActivity('quizzes', 1, 10);
    if (newAttempt.score === newAttempt.total && newAttempt.total > 0) {
      triggerConfetti();
    }
  };

  // Flashcards
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.decks);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: 'deck_core_bio',
        name: 'Cell Biology & Cell Division',
        folder: 'Integrated Science',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
        cards: [
          {
            id: 'fc_1',
            q: 'What is the primary function of Mitochondria?',
            a: 'Known as the powerhouse of the cell; produces ATP energy through cellular aerobic respiration.',
            hint: 'Think of cell energy production.',
            box: 2,
            due: Date.now() - 1000,
            reps: 2,
          },
          {
            id: 'fc_2',
            q: 'Define Osmosis.',
            a: 'The movement of water molecules from a region of higher water potential to a lower water potential across a selectively permeable membrane.',
            hint: 'Involves water through a semi-permeable membrane.',
            box: 1,
            due: Date.now() - 2000,
            reps: 1,
          },
          {
            id: 'fc_3',
            q: 'What is the difference between Mitosis and Meiosis?',
            a: 'Mitosis results in 2 genetically identical diploid daughter cells (growth/repair). Meiosis produces 4 genetically varied haploid gametes (sexual reproduction).',
            hint: 'One makes 2 identical cells; one makes 4 sex cells.',
            box: 3,
            due: Date.now() + 86400000 * 3,
            reps: 3,
          },
        ],
      },
      {
        id: 'deck_math_alg',
        name: 'Algebraic Expressions & Surds',
        folder: 'Mathematics',
        createdAt: Date.now() - 172800000,
        updatedAt: Date.now() - 172800000,
        cards: [
          {
            id: 'fc_m1',
            q: 'What is the quadratic formula to solve $ax^2 + bx + c = 0$?',
            a: '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
            hint: 'Negative b plus or minus square root of the discriminant...',
            box: 4,
            due: Date.now() + 86400000 * 5,
            reps: 4,
          },
          {
            id: 'fc_m2',
            q: 'How do you rationalize the denominator of $\\frac{1}{\\sqrt{3}}$?',
            a: 'Multiply numerator and denominator by $\\sqrt{3}$, yielding $\\frac{\\sqrt{3}}{3}$.',
            hint: 'Multiply top and bottom by the radical.',
            box: 2,
            due: Date.now() - 500,
            reps: 2,
          },
        ],
      },
    ];
  });

  const saveDeck = (deck: FlashcardDeck) => {
    setDecks((prev) => {
      const idx = prev.findIndex((d) => d.id === deck.id);
      let updated: FlashcardDeck[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...deck, updatedAt: Date.now() };
      } else {
        updated = [deck, ...prev];
      }
      localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(updated));
      return updated;
    });
    addToast('Flashcard deck saved!', 'success');
  };

  const deleteDeck = (deckId: string) => {
    setDecks((prev) => {
      const updated = prev.filter((d) => d.id !== deckId);
      localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(updated));
      return updated;
    });
    addToast('Deck deleted', 'info');
  };

  const updateCardReview = (
    deckId: string,
    cardId: string,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) => {
    setDecks((prev) => {
      const updated = prev.map((deck) => {
        if (deck.id === deckId) {
          const updatedCards = deck.cards.map((c) => {
            if (c.id === cardId) {
              let newBox = c.box;
              let nextDueDays = 1;
              if (rating === 'again') {
                newBox = 1;
                nextDueDays = 0; // due immediately/today
              } else if (rating === 'hard') {
                newBox = Math.max(1, c.box - 1);
                nextDueDays = 1;
              } else if (rating === 'good') {
                newBox = Math.min(5, c.box + 1);
                nextDueDays = newBox * 2;
              } else if (rating === 'easy') {
                newBox = Math.min(5, c.box + 2);
                nextDueDays = newBox * 4;
              }

              return {
                ...c,
                box: newBox,
                due: Date.now() + nextDueDays * 86400000,
                reps: c.reps + 1,
                lastReviewed: Date.now(),
              };
            }
            return c;
          });
          return { ...deck, cards: updatedCards, updatedAt: Date.now() };
        }
        return deck;
      });
      localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(updated));
      return updated;
    });
    recordActivity('flashcards', 1, 0.5);
  };

  // Notes
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.notes);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: 'note_demo_1',
        title: 'Photosynthesis & Autotrophic Nutrition',
        subject: 'Integrated Science',
        sourceText: 'Chloroplasts, thylakoids, photolysis, dark reactions, glucose creation.',
        sections: {
          title: 'Photosynthesis & Autotrophic Nutrition',
          summary:
            'Photosynthesis is the fundamental physiological process wherein autotrophic plants convert solar radiant energy into stable chemical bonds in carbohydrates using water, carbon dioxide, and chlorophyll pigments.',
          detailedNotes: `### Core Biological Principles of Photosynthesis

#### 1. Chemical Formula & Overall Reaction
$$6CO_2 + 6H_2O \\xrightarrow{\\text{Light, Chlorophyll}} C_6H_{12}O_6 + 6O_2$$

#### 2. Key Organs & Organelles
- **Palisade Mesophyll**: Layer packed with abundant chloroplasts for maximum photon absorption.
- **Thylakoid Membrane**: Location of light-dependent phase, photolysis, and electron transport chain.
- **Stroma**: Fluid matrix where Calvin cycle enzymes fix atmospheric $CO_2$.

#### 3. Limiting Factors
The rate of photosynthesis depends upon:
1. **Light Intensity**: Linear rate increase until saturation point.
2. **Carbon Dioxide Concentration**: Generally the primary limiting factor in natural atmospheres (~0.04%).
3. **Temperature**: Enzyme-mediated reactions accelerate until denaturation past ~40°C.`,
          keyPoints: [
            'Photosynthesis converts radiant energy into glucose and releases oxygen as a vital byproduct.',
            'Light reaction occurs in thylakoids; Calvin cycle occurs in the stroma.',
            'Photolysis of water is the specific source of evolved oxygen gas.',
            'Key limiting factors are carbon dioxide concentration, light intensity, and ambient temperature.',
          ],
          terms: [
            { term: 'Chloroplast', definition: 'The double-membrane organelle that houses chlorophyll pigments.' },
            { term: 'Photolysis', definition: 'The splitting of water molecules into hydrogen ions, electrons, and oxygen gas triggered by light.' },
            { term: 'Stroma', definition: 'The fluid-filled internal space surrounding the grana in chloroplasts where dark reactions occur.' },
          ],
          practiceQuestions: [
            {
              question: 'Why does the rate of photosynthesis decrease if the temperature exceeds 45°C?',
              answer: 'Enzymes catalyzing the light-independent reactions (such as RuBisCO) become thermally denatured, losing their functional tertiary active site conformation.',
            },
            {
              question: 'Distinguish between autotrophic and heterotrophic nutrition.',
              answer: 'Autotrophs synthesize organic molecules from inorganic raw materials ($CO_2$, $H_2O$), whereas heterotrophs consume pre-existing organic matter.',
            },
          ],
          checklist: [
            'Memorize the balanced chemical equation for photosynthesis',
            'Draw and label a chloroplast showing thylakoid, granum, and stroma',
            'Understand how limiting factors graphs behave',
            'Explain the role of stomata and guard cells in gas exchange',
          ],
        },
        createdAt: Date.now() - 86400000 * 2,
      },
    ];
  });

  const saveNote = (note: NoteItem) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.id === note.id);
      let updated: NoteItem[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = note;
      } else {
        updated = [note, ...prev];
      }
      localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(updated));
      return updated;
    });
    recordActivity('notes', 1, 5);
    addToast('Revision notes saved!', 'success');
  };

  const deleteNote = (noteId: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== noteId);
      localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(updated));
      return updated;
    });
    addToast('Note deleted', 'info');
  };

  // Planner: Tasks
  const [tasks, setTasks] = useState<PlannerTask[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.tasks);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      { id: 't1', title: 'Revise Photosynthesis light and dark reactions', due: getTodayKey(), done: true, createdAt: Date.now() - 86400000 },
      { id: 't2', title: 'Solve 10 quadratic equation factoring problems', due: getTodayKey(), done: false, createdAt: Date.now() },
      { id: 't3', title: 'Review 15 Cell Biology flashcards', due: getTodayKey(), done: false, createdAt: Date.now() },
    ];
  });

  const addTask = (title: string, due?: string) => {
    const newTask: PlannerTask = {
      id: `task_${Date.now()}`,
      title,
      due: due || getTodayKey(),
      done: false,
      createdAt: Date.now(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(updated));
    addToast('Task added to planner', 'success');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const nowDone = !t.done;
          if (nowDone) {
            triggerConfetti();
            addToast('Task completed! Keep the momentum! 🎯', 'success');
          }
          return {
            ...t,
            done: nowDone,
            doneAt: nowDone ? Date.now() : undefined,
          };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(updated));
      return updated;
    });
    recordActivity('minutes', 0, 10);
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(updated));
      return updated;
    });
  };

  // Planner: Exams
  const [exams, setExams] = useState<ExamCountdown[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.exams);
      if (data) return JSON.parse(data);
    } catch (e) {}
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const in45Days = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
    return [
      { id: 'ex_1', title: 'Core Mathematics Paper 1 & 2', subject: 'Mathematics', date: in30Days },
      { id: 'ex_2', title: 'Integrated Science Practical & Theory', subject: 'Integrated Science', date: in45Days },
    ];
  });

  const addExam = (title: string, subject: string, date: string) => {
    const newExam: ExamCountdown = {
      id: `exam_${Date.now()}`,
      title,
      subject,
      date,
    };
    const updated = [...exams, newExam].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setExams(updated);
    localStorage.setItem(STORAGE_KEYS.exams, JSON.stringify(updated));
    addToast('Exam target added to your countdown', 'success');
    checkAchievementsAfterAction(activity, quizzes, decks, notes, updated, streak.current);
  };

  const deleteExam = (id: string) => {
    setExams((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      localStorage.setItem(STORAGE_KEYS.exams, JSON.stringify(updated));
      return updated;
    });
    addToast('Exam removed', 'info');
  };

  // Planner: Daily Minutes Goal
  const [dailyMinutesGoal, setDailyMinutesGoal] = useState<number>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.goals);
      if (data) return Number(data) || 45;
    } catch (e) {}
    return 45;
  });

  const saveDailyMinutesGoal = (minutes: number) => {
    setDailyMinutesGoal(minutes);
    localStorage.setItem(STORAGE_KEYS.goals, String(minutes));
    addToast(`Daily goal set to ${minutes} minutes`, 'success');
  };

  // Reset & Export
  const resetAllData = () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  const exportDataJson = () => {
    const dump = {
      exportedAt: new Date().toISOString(),
      profile,
      plan,
      usage,
      streak,
      activity,
      quizzes,
      decks,
      notes,
      tasks,
      exams,
      dailyMinutesGoal,
      unlockedAchievements,
    };
    return JSON.stringify(dump, null, 2);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        tabArg,
        setTabWithArg,
        theme,
        toggleTheme,
        profile,
        updateProfile,
        plan,
        setPlanTier,
        usage,
        canUse,
        consumeUsage,
        chats,
        activeChat,
        setActiveChatId,
        createNewChat,
        deleteChat,
        addChatMessage,
        updateLastMessageContent,
        quizzes,
        saveQuizAttempt,
        decks,
        saveDeck,
        deleteDeck,
        updateCardReview,
        notes,
        saveNote,
        deleteNote,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        exams,
        addExam,
        deleteExam,
        dailyMinutesGoal,
        setDailyMinutesGoal: saveDailyMinutesGoal,
        streak,
        activity,
        recordActivity,
        unlockedAchievements,
        toasts,
        addToast,
        dismissToast,
        triggerConfetti,
        resetAllData,
        exportDataJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
