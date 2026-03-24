import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Bell, Moon, Palette, Clock, Brain, 
  Download, Trash2, RefreshCw, Check 
} from 'lucide-react';
import { dbHelpers, db, UserProfile } from '../db/database';
import { notificationService } from '../services/notifications';
import { studyAI } from '../ai/studyAI';

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [dailyGoal, setDailyGoal] = useState(120);
  const [aiTraining, setAITraining] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const userProfile = await dbHelpers.getProfile();
    setProfile(userProfile);
    setDailyGoal(userProfile.dailyGoal);
    setNotificationsEnabled(notificationService.canNotify());
  };

  const saveSettings = async () => {
    if (profile) {
      await dbHelpers.updateProfile({
        dailyGoal,
        name: profile.name
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const requestNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);
  };

  const trainAI = async () => {
    setAITraining(true);
    await studyAI.trainModel();
    setAITraining(false);
  };

  const exportData = async () => {
    const sessions = await db.sessions.toArray();
    const goals = await db.goals.toArray();
    const stats = await db.dailyStats.toArray();
    
    const data = { sessions, goals, stats, exportedAt: new Date() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-focus-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      await db.sessions.clear();
      await db.goals.clear();
      await db.dailyStats.clear();
      await db.aiData.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/80 rounded-2xl p-5 border border-gray-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <User className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="font-semibold text-white">Profile</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Name</label>
            <input
              type="text"
              value={profile?.name || ''}
              onChange={(e) => setProfile(profile ? { ...profile, name: e.target.value } : null)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Daily Study Goal</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="30"
                max="480"
                step="30"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-white font-medium w-20 text-right">
                {Math.floor(dailyGoal / 60)}h {dailyGoal % 60}m
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveSettings}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/80 rounded-2xl p-5 border border-gray-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-white">Notifications</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white">Push Notifications</p>
            <p className="text-sm text-gray-400">
              {notificationsEnabled ? 'Enabled' : 'Get timer and progress alerts'}
            </p>
          </div>
          {notificationsEnabled ? (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
              Enabled
            </span>
          ) : (
            <button
              onClick={requestNotifications}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              Enable
            </button>
          )}
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900/80 rounded-2xl p-5 border border-gray-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-500/20 rounded-lg">
            <Palette className="w-5 h-5 text-pink-400" />
          </div>
          <h3 className="font-semibold text-white">Appearance</h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-gray-400" />
            <span className="text-white">Dark Mode</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-6 rounded-full transition-colors ${
              darkMode ? 'bg-purple-500' : 'bg-gray-600'
            }`}
          >
            <motion.div
              animate={{ x: darkMode ? 24 : 2 }}
              className="w-5 h-5 bg-white rounded-full"
            />
          </button>
        </div>
      </motion.div>

      {/* AI Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/80 rounded-2xl p-5 border border-gray-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white">AI Engine</h3>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Train the AI model with your study patterns for better recommendations.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={trainAI}
          disabled={aiTraining}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {aiTraining ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Training Model...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Train AI Model
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900/80 rounded-2xl p-5 border border-gray-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="font-semibold text-white">Data Management</h3>
        </div>

        <div className="space-y-3">
          <button
            onClick={exportData}
            className="w-full py-3 bg-gray-800 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Data
          </button>

          <button
            onClick={clearAllData}
            className="w-full py-3 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Data
          </button>
        </div>
      </motion.div>

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center py-6"
      >
        <p className="text-gray-500 text-sm">Study Focus AI</p>
        <p className="text-gray-600 text-xs">Version 1.0.0</p>
        <p className="text-gray-600 text-xs mt-1">
          Built with TensorFlow.js ML Engine
        </p>
      </motion.div>
    </div>
  );
};

export default Settings;
