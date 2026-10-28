/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { CameraPage } from './pages/CameraPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ModelTrainingPage } from './pages/ModelTrainingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { WindowsSetupDocsPage } from './pages/WindowsSetupDocsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactModal } from './components/ContactModal';
import { DashboardStats, AnalysisRecord } from './types';
import { api } from './services/api';

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAnalysisComplete = (record: AnalysisRecord) => {
    setCurrentAnalysis(record);
    // Refresh stats to reflect newly saved analysis
    fetchStats();
  };

  const handleSelectRecordFromHistory = (record: AnalysisRecord) => {
    setCurrentAnalysis(record);
  };

  const handleDeleteRecord = async (analysisId: string) => {
    try {
      await api.deleteAnalysis(analysisId);
      setCurrentAnalysis(null);
      setCurrentTab('history');
      fetchStats();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  const activeKey = currentAnalysis ? `result_${currentAnalysis.analysis_id}` : `tab_${currentTab}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Subtle Ambient Decorative Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-cyber-grid opacity-30" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentAnalysis(null);
          setCurrentTab(tab);
        }}
        onOpenContact={() => setContactModalOpen(true)}
        databaseConnected={stats?.database_connected ?? true}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentAnalysis ? (
              <ResultsPage
                result={currentAnalysis}
                onDelete={handleDeleteRecord}
                onNewAnalysis={() => {
                  setCurrentAnalysis(null);
                  setCurrentTab('analyze');
                }}
              />
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardPage
                    stats={stats}
                    loading={loadingStats}
                    onNavigate={setCurrentTab}
                    onSelectAnalysis={handleSelectRecordFromHistory}
                    onOpenContact={() => setContactModalOpen(true)}
                  />
                )}

                {currentTab === 'analyze' && (
                  <AnalyzePage
                    onAnalysisComplete={handleAnalysisComplete}
                    onNavigateToCamera={() => setCurrentTab('camera')}
                  />
                )}

                {currentTab === 'camera' && (
                  <CameraPage
                    onAnalysisComplete={handleAnalysisComplete}
                    onCancel={() => setCurrentTab('analyze')}
                  />
                )}

                {currentTab === 'history' && (
                  <HistoryPage onSelectRecord={handleSelectRecordFromHistory} />
                )}

                {currentTab === 'model' && <ModelTrainingPage />}

                {currentTab === 'how_it_works' && <HowItWorksPage />}

                {currentTab === 'health' && <SystemHealthPage />}

                {currentTab === 'docs' && <WindowsSetupDocsPage />}

                {currentTab === 'about' && <AboutPage />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer onNavigate={setCurrentTab} />

      {/* Merchant Integration Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  );
}
