/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TopBar } from './components/TopBar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';

import { DashboardView } from './views/DashboardView.tsx';
import { TutorView } from './views/TutorView.tsx';
import { QuizView } from './views/QuizView.tsx';
import { FlashcardsView } from './views/FlashcardsView.tsx';
import { NotesView } from './views/NotesView.tsx';
import { PlannerView } from './views/PlannerView.tsx';
import { AchievementsView } from './views/AchievementsView.tsx';
import { UpgradeView } from './views/UpgradeView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'tutor':
        return <TutorView />;
      case 'quiz':
        return <QuizView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'notes':
        return <NotesView />;
      case 'planner':
        return <PlannerView />;
      case 'achievements':
        return <AchievementsView />;
      case 'upgrade':
        return <UpgradeView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Floating System Toasts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
