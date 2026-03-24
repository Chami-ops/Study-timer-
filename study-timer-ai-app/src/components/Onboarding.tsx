import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Timer, Target, Bell, ChevronRight, Sparkles } from 'lucide-react';
import { dbHelpers } from '../db/database';
import { notificationService } from '../services/notifications';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dailyGoal, setDailyGoal] = useState(60);

  const steps = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Our built-in machine learning engine learns from your study patterns to optimize your focus sessions.',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: Timer,
      title: 'Scientific Study Methods',
      description: 'Pomodoro, Ultradian Rhythms, and Deep Work techniques backed by cognitive science research.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Target,
      title: 'Track Your Progress',
      description: 'Monitor your study time, focus scores, and achievement streaks with beautiful analytics.',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get progress updates and motivational reminders even when the app is in the background.',
      color: 'from-cyan-500 to-blue-500'
    }
  ];

  const handleFinish = async () => {
    // Save user profile
    await dbHelpers.updateProfile({
      name: name || 'Student',
      dailyGoal
    });

    // Request notification permission
    await notificationService.requestPermission();

    onComplete();
  };

  const currentStep = steps[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {step < steps.length ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 text-center max-w-sm"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className={`w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center shadow-lg`}
            >
              <currentStep.icon className="w-12 h-12 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-4"
            >
              {currentStep.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-12 leading-relaxed"
            >
              {currentStep.description}
            </motion.p>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === step ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(step + 1)}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-sm"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">Let's Get Started</h2>
              <p className="text-gray-400 mt-2">Set up your study profile</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">
                  Daily Study Goal: {Math.floor(dailyGoal / 60)}h {dailyGoal % 60}m
                </label>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="30"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>30 min</span>
                  <span>5 hours</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinish}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-semibold shadow-lg shadow-purple-500/30"
              >
                Start Learning
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
