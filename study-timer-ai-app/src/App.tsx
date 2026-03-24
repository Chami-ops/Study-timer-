import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer as TimerIcon, 
  BarChart3, 
  Target, 
  Settings as SettingsIcon,
  Book,
  Plus,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import Timer from './components/Timer';
import Analytics from './components/Analytics';
import Goals from './components/Goals';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { dbHelpers } from './db/database';
import { studyAI } from './ai/studyAI';
import { notificationService, getRandomMotivation } from './services/notifications';

type Tab = 'timer' | 'analytics' | 'goals' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [selectedSubject, setSelectedSubject] = useState('General Study');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'History', 'English', 'Programming', 'General Study'
  ]);
  const [newSubject, setNewSubject] = useState('');
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(120);
  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [aiPrediction, setAIPrediction] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Request notification permission
    await notificationService.requestPermission();

    // Load user profile
    const profile = await dbHelpers.getProfile();
    setDailyGoal(profile.dailyGoal);

    // Load today's progress
    const todaySessions = await dbHelpers.getTodaySessions();
    const totalMinutes = todaySessions.reduce((sum, s) => sum + s.actualDuration, 0);
    setTodayMinutes(totalMinutes);

    // Set motivational quote
    setMotivationalQuote(getRandomMotivation());

    // Get AI prediction
    const prediction = await studyAI.predictOptimalStudyTime();
    setAIPrediction(`AI recommends ${prediction.recommendedDuration}min sessions for optimal focus`);

    // Train AI model periodically
    studyAI.trainModel();
  };

  const handleSessionComplete = async (duration: number, _focusScore: number) => {
    setTodayMinutes(prev => prev + duration);
    
    // Check if daily goal reached
    const newTotal = todayMinutes + duration;
    if (newTotal >= dailyGoal && todayMinutes < dailyGoal) {
      notificationService.notifyStreak(1);
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const progressPercentage = Math.min(100, (todayMinutes / dailyGoal) * 100);

  const tabs = [
    { id: 'timer' as Tab, icon: TimerIcon, label: 'Focus' },
    { id: 'analytics' as Tab, icon: BarChart3, label: 'Stats' },
    { id: 'goals' as Tab, icon: Target, label: 'Goals' },
    { id: 'settings' as Tab, icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md mx-auto pb-24">
        {/* Header */}
        <header className="p-4 pt-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Study Focus AI
              </h1>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by Machine Learning
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-full border border-gray-700/50"
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</span>
            </motion.div>
          </motion.div>

          {/* Daily Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Daily Goal Progress</span>
              <span className="text-purple-400 font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {todayMinutes} / {dailyGoal} minutes
            </p>
          </motion.div>

          {/* AI Insight */}
          {aiPrediction && activeTab === 'timer' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/20"
            >
              <p className="text-xs text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {aiPrediction}
              </p>
            </motion.div>
          )}

          {/* Subject Selector */}
          {activeTab === 'timer' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4"
            >
              <button
                onClick={() => setShowSubjectModal(true)}
                className="w-full p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-between hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Book className="w-5 h-5 text-purple-400" />
                  <span className="text-white">{selectedSubject}</span>
                </div>
                <span className="text-xs text-gray-500">Tap to change</span>
              </button>
            </motion.div>
          )}
        </header>

        {/* Tab Content */}
        <main className="p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'timer' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Timer 
                  onSessionComplete={handleSessionComplete}
                  selectedSubject={selectedSubject}
                />
                
                {/* Motivational Quote */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 text-center"
                >
                  <p className="text-gray-400 text-sm italic">"{motivationalQuote}"</p>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Analytics />
              </motion.div>
            )}

            {activeTab === 'goals' && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Goals />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Settings />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800/50 z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'text-purple-400' : ''}`} />
              <span className="text-xs mt-1">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-0 w-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Subject Selection Modal */}
      <AnimatePresence>
        {showSubjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowSubjectModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-t-3xl p-6 border-t border-gray-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Select Subject</h3>
                <button
                  onClick={() => setShowSubjectModal(false)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add new subject */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Add new subject..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                />
                <button
                  onClick={addSubject}
                  className="p-3 bg-purple-500 rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Subject list */}
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {subjects.map((subject) => (
                  <motion.button
                    key={subject}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedSubject(subject);
                      setShowSubjectModal(false);
                    }}
                    className={`p-4 rounded-xl text-left transition-all ${
                      selectedSubject === subject
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{subject}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
