import React from 'react';
import { useApp, NavigationTab } from '../context/AppContext.tsx';
import { LayoutDashboard, Sparkles, HelpCircle, Layers, Calendar } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const items: Array<{ id: NavigationTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'tutor', label: 'AI Tutor', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'quiz', label: 'Quizzes', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Cards', icon: <Layers className="w-5 h-5" /> },
    { id: 'planner', label: 'Planner', icon: <Calendar className="w-5 h-5" /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around safe-area-pb">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/70' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
