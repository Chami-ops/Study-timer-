import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Calendar, Trash2, Check, AlertCircle } from 'lucide-react';
import { dbHelpers, StudyGoal } from '../db/database';
import { format, differenceInDays } from 'date-fns';

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState<{
    subject: string;
    targetHours: number;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
  }>({
    subject: '',
    targetHours: 10,
    deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    priority: 'medium'
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const activeGoals = await dbHelpers.getActiveGoals();
    setGoals(activeGoals);
  };

  const addGoal = async () => {
    if (!newGoal.subject.trim()) return;
    
    await dbHelpers.addGoal({
      subject: newGoal.subject,
      targetHours: newGoal.targetHours,
      completedHours: 0,
      deadline: new Date(newGoal.deadline),
      priority: newGoal.priority,
      createdAt: new Date()
    });

    setNewGoal({
      subject: '',
      targetHours: 10,
      deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      priority: 'medium'
    });
    setShowAddForm(false);
    loadGoals();
  };

  const deleteGoal = async (id: number) => {
    // Using Dexie directly for delete
    const { db } = await import('../db/database');
    await db.goals.delete(id);
    loadGoals();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 50) return 'from-blue-500 to-cyan-500';
    if (progress >= 25) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Study Goals</h2>
          <p className="text-sm text-gray-400">Track your learning objectives</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Add Goal Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-900/80 rounded-2xl p-5 border border-gray-700/50 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                New Goal
              </h3>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Subject</label>
                <input
                  type="text"
                  value={newGoal.subject}
                  onChange={(e) => setNewGoal({ ...newGoal, subject: e.target.value })}
                  placeholder="e.g., Mathematics, Physics"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Target Hours</label>
                  <input
                    type="number"
                    value={newGoal.targetHours}
                    onChange={(e) => setNewGoal({ ...newGoal, targetHours: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Deadline</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-2">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewGoal({ ...newGoal, priority: p })}
                      className={`px-4 py-2 rounded-lg border capitalize transition-all ${
                        newGoal.priority === p
                          ? getPriorityColor(p)
                          : 'border-gray-700 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addGoal}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
                >
                  Create Goal
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Target className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No active goals</p>
            <p className="text-sm text-gray-600">Create a goal to track your progress</p>
          </motion.div>
        ) : (
          goals.map((goal, index) => {
            const progress = Math.min(100, (goal.completedHours / goal.targetHours) * 100);
            const daysLeft = differenceInDays(new Date(goal.deadline), new Date());
            const isOverdue = daysLeft < 0;
            const isUrgent = daysLeft <= 2 && daysLeft >= 0;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/80 rounded-2xl p-5 border border-gray-700/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{goal.subject}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${
                        isOverdue ? 'text-red-400' : isUrgent ? 'text-orange-400' : 'text-gray-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? 'Overdue' : `${daysLeft} days left`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => goal.id && deleteGoal(goal.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">
                      {goal.completedHours.toFixed(1)}h / {goal.targetHours}h
                    </span>
                    <span className="text-white font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full bg-gradient-to-r ${getProgressColor(progress)} rounded-full`}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {progress >= 100 ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Goal Achieved!
                    </span>
                  ) : isUrgent ? (
                    <span className="text-xs text-orange-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Deadline approaching
                    </span>
                  ) : null}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Scientific Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl p-5 border border-indigo-500/20"
      >
        <h4 className="font-medium text-white mb-3">📚 Goal-Setting Science</h4>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span>Use SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span>Break large goals into smaller milestones for motivation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">•</span>
            <span>Review and adjust goals weekly for optimal progress</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default Goals;
