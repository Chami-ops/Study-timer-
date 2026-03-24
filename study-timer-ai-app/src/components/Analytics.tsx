import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Brain, Target, Clock, Flame, Award } from 'lucide-react';
import { dbHelpers, DailyStat } from '../db/database';
import { studyAI, StudyPatternAnalysis } from '../ai/studyAI';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics: React.FC = () => {
  const [weeklyStats, setWeeklyStats] = useState<DailyStat[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<StudyPatternAnalysis | null>(null);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const stats = await dbHelpers.getWeeklyStats();
      setWeeklyStats(stats);

      const profile = await dbHelpers.getProfile();
      setTotalStudyTime(profile.totalStudyTime);
      setStreak(profile.streakDays);

      const analysis = await studyAI.analyzePatterns();
      setAIAnalysis(analysis);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  // Prepare chart data
  const lineChartData = {
    labels: weeklyStats.map(s => {
      const date = new Date(s.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Study Minutes',
        data: weeklyStats.map(s => s.totalMinutes),
        fill: true,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgb(139, 92, 246)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointRadius: 5
      }
    ]
  };

  const focusChartData = {
    labels: weeklyStats.map(s => {
      const date = new Date(s.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Focus Score',
        data: weeklyStats.map(s => s.averageFocusScore),
        backgroundColor: 'rgba(236, 72, 153, 0.7)',
        borderColor: 'rgb(236, 72, 153)',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  // Technique distribution
  const techniqueData = (() => {
    const techniques: Record<string, number> = {};
    weeklyStats.forEach(s => {
      Object.entries(s.techniques || {}).forEach(([tech, count]) => {
        techniques[tech] = (techniques[tech] || 0) + count;
      });
    });
    return {
      labels: Object.keys(techniques).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
      datasets: [{
        data: Object.values(techniques),
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  })();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 15
        }
      }
    },
    cutout: '65%'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl p-4 border border-purple-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Time</p>
              <p className="text-xl font-bold text-white">
                {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 rounded-2xl p-4 border border-pink-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/20 rounded-lg">
              <Flame className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Streak</p>
              <p className="text-xl font-bold text-white">{streak} days</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-2xl p-4 border border-blue-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Avg Focus</p>
              <p className="text-xl font-bold text-white">
                {aiAnalysis?.averageFocusScore || 0}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-2xl p-4 border border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Completion</p>
              <p className="text-xl font-bold text-white">
                {aiAnalysis?.completionRate || 0}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* AI Insights */}
      {aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-indigo-900/50 to-purple-900/30 rounded-2xl p-5 border border-indigo-500/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">AI Insights</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Best Day</span>
              <span className="text-white font-medium">{aiAnalysis.bestDayOfWeek}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Peak Hours</span>
              <span className="text-white font-medium">{aiAnalysis.bestTimeOfDay}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Avg Session</span>
              <span className="text-white font-medium">{aiAnalysis.averageSessionLength} min</span>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Recommendations:</p>
            <div className="space-y-2">
              {aiAnalysis.recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-900/50 rounded-2xl p-5 border border-gray-700/50"
      >
        <h3 className="font-semibold text-white mb-4">Weekly Progress</h3>
        <div className="h-48">
          {weeklyStats.length > 0 ? (
            <Line data={lineChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Complete sessions to see your progress
            </div>
          )}
        </div>
      </motion.div>

      {/* Focus Score Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gray-900/50 rounded-2xl p-5 border border-gray-700/50"
      >
        <h3 className="font-semibold text-white mb-4">Focus Scores</h3>
        <div className="h-48">
          {weeklyStats.length > 0 ? (
            <Bar data={focusChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data yet
            </div>
          )}
        </div>
      </motion.div>

      {/* Technique Distribution */}
      {Object.keys(techniqueData.labels).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-900/50 rounded-2xl p-5 border border-gray-700/50"
        >
          <h3 className="font-semibold text-white mb-4">Techniques Used</h3>
          <div className="h-56">
            <Doughnut data={techniqueData} options={doughnutOptions} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Analytics;
