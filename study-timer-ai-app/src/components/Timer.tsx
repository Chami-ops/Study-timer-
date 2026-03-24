import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Zap, Coffee } from 'lucide-react';
import { notificationService, getRandomMotivation } from '../services/notifications';
import { dbHelpers } from '../db/database';
import { studyAI, StudyTechnique } from '../ai/studyAI';

interface TimerProps {
  onSessionComplete: (duration: number, focusScore: number) => void;
  selectedSubject: string;
}

type TimerState = 'idle' | 'running' | 'paused' | 'break' | 'completed';

const Timer: React.FC<TimerProps> = ({ onSessionComplete, selectedSubject }) => {
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [timeRemaining, setTimeRemaining] = useState(targetMinutes * 60);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [percentage, setPercentage] = useState(0);
  const [breakTime, setBreakTime] = useState(5);
  const [focusScore, setFocusScore] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [technique, setTechnique] = useState<StudyTechnique | null>(null);
  const [pauseCount, setPauseCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [aiRecommendation, setAIRecommendation] = useState<string>('');
  
  const intervalRef = useRef<number | null>(null);
  const lastNotificationRef = useRef<number>(0);

  // Load AI recommendation on mount
  useEffect(() => {
    const loadRecommendation = async () => {
      const prediction = await studyAI.predictOptimalStudyTime();
      setAIRecommendation(
        `AI suggests ${prediction.recommendedDuration} min session with ${prediction.predictedFocusScore}% predicted focus`
      );
      setTargetMinutes(prediction.recommendedDuration);
      setTimeRemaining(prediction.recommendedDuration * 60);
    };
    loadRecommendation();
  }, []);

  // Update technique when target changes
  useEffect(() => {
    const newTechnique = studyAI.getStudyTechniqueRecommendation(targetMinutes);
    setTechnique(newTechnique);
    setBreakTime(newTechnique.breakDuration);
  }, [targetMinutes]);

  // Timer logic
  useEffect(() => {
    if (timerState === 'running' || timerState === 'break') {
      intervalRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerState === 'running') {
              handleSessionComplete();
            } else {
              handleBreakComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState]);

  // Update percentage and send notifications
  useEffect(() => {
    if (timerState === 'running') {
      const totalSeconds = targetMinutes * 60;
      const elapsed = totalSeconds - timeRemaining;
      const newPercentage = Math.round((elapsed / totalSeconds) * 100);
      setPercentage(newPercentage);

      // Send progress notification every 25%
      if (newPercentage > 0 && newPercentage % 25 === 0 && newPercentage !== lastNotificationRef.current) {
        lastNotificationRef.current = newPercentage;
        const remaining = formatTime(timeRemaining);
        notificationService.notifyProgress(newPercentage, remaining);
      }
    }
  }, [timeRemaining, timerState, targetMinutes]);

  const handleSessionComplete = useCallback(async () => {
    setTimerState('completed');
    playSound('complete');
    
    // Calculate final focus score based on pauses
    const finalFocusScore = Math.max(50, focusScore - (pauseCount * 5));
    
    // Save session to database
    const actualDuration = sessionStartTime 
      ? Math.round((new Date().getTime() - sessionStartTime.getTime()) / 60000)
      : targetMinutes;

    await dbHelpers.addSession({
      startTime: sessionStartTime || new Date(),
      endTime: new Date(),
      targetDuration: targetMinutes,
      actualDuration: Math.min(actualDuration, targetMinutes),
      subject: selectedSubject,
      completed: true,
      focusScore: finalFocusScore,
      technique: technique?.name.toLowerCase().replace(' ', '-') as 'pomodoro' | 'deep-work' | 'ultradian' | 'custom' || 'pomodoro',
      breaks: pauseCount
    });

    // Notify completion
    await notificationService.notifySessionComplete(targetMinutes, finalFocusScore);
    
    // Train AI with new data
    studyAI.trainModel();

    onSessionComplete(targetMinutes, finalFocusScore);
    
    // Start break automatically
    setTimeout(() => {
      setTimerState('break');
      setTimeRemaining(breakTime * 60);
      notificationService.notifyBreakTime(breakTime);
    }, 2000);
  }, [focusScore, pauseCount, selectedSubject, sessionStartTime, targetMinutes, technique, breakTime, onSessionComplete]);

  const handleBreakComplete = useCallback(() => {
    playSound('break-end');
    setTimerState('idle');
    setTimeRemaining(targetMinutes * 60);
    setPercentage(0);
    setPauseCount(0);
    setFocusScore(100);
    notificationService.notifyMotivation(getRandomMotivation());
  }, [targetMinutes]);

  const startTimer = () => {
    setTimerState('running');
    setSessionStartTime(new Date());
    lastNotificationRef.current = 0;
    playSound('start');
  };

  const pauseTimer = () => {
    setTimerState('paused');
    setPauseCount(prev => prev + 1);
    setFocusScore(prev => Math.max(50, prev - 3));
  };

  const resumeTimer = () => {
    setTimerState('running');
  };

  const resetTimer = () => {
    setTimerState('idle');
    setTimeRemaining(targetMinutes * 60);
    setPercentage(0);
    setPauseCount(0);
    setFocusScore(100);
    setSessionStartTime(null);
  };

  const updateTargetTime = (minutes: number) => {
    if (timerState === 'idle') {
      setTargetMinutes(minutes);
      setTimeRemaining(minutes * 60);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playSound = (type: 'start' | 'complete' | 'break-end') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'complete') {
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;
    } else if (type === 'start') {
      oscillator.frequency.value = 600;
      gainNode.gain.value = 0.2;
    } else {
      oscillator.frequency.value = 500;
      gainNode.gain.value = 0.2;
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const presetTimes = [15, 25, 45, 60, 90, 120];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* AI Recommendation */}
      {aiRecommendation && timerState === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-gray-300">{aiRecommendation}</span>
        </motion.div>
      )}

      {/* Technique Info */}
      {technique && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 text-center"
        >
          <span className="text-sm font-medium text-purple-400">{technique.name} Technique</span>
          <p className="text-xs text-gray-500 max-w-xs">{technique.scientificBasis}</p>
        </motion.div>
      )}

      {/* Timer Circle */}
      <div className="relative w-72 h-72">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="144"
            cy="144"
            r="120"
            stroke="rgba(99, 102, 241, 0.1)"
            strokeWidth="12"
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx="144"
            cy="144"
            r="120"
            stroke={timerState === 'break' ? 'url(#breakGradient)' : 'url(#progressGradient)'}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {timerState === 'break' ? (
              <motion.div
                key="break"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-center"
              >
                <Coffee className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <span className="text-sm text-green-400">Break Time</span>
              </motion.div>
            ) : (
              <motion.div
                key="timer"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-center"
              >
                <motion.span
                  className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                  key={timeRemaining}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  {formatTime(timeRemaining)}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Percentage */}
          {timerState !== 'idle' && timerState !== 'break' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-center"
            >
              <span className="text-2xl font-bold text-purple-400">{percentage}%</span>
              <p className="text-xs text-gray-500">Complete</p>
            </motion.div>
          )}

          {/* Focus Score */}
          {timerState === 'running' && (
            <div className="mt-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-gray-400">Focus: {focusScore}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Time Presets */}
      {timerState === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2 mt-6"
        >
          {presetTimes.map(time => (
            <button
              key={time}
              onClick={() => updateTargetTime(time)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                targetMinutes === time
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {time}m
            </button>
          ))}
        </motion.div>
      )}

      {/* Custom Time Input */}
      {timerState === 'idle' && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="range"
            min="5"
            max="180"
            value={targetMinutes}
            onChange={(e) => updateTargetTime(parseInt(e.target.value))}
            className="w-48 accent-purple-500"
          />
          <span className="text-sm text-gray-400 w-12">{targetMinutes}m</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4 mt-8">
        {timerState === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startTimer}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/30"
          >
            <Play className="w-5 h-5" />
            Start Focus
          </motion.button>
        )}

        {timerState === 'running' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={pauseTimer}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg"
          >
            <Pause className="w-5 h-5" />
            Pause
          </motion.button>
        )}

        {timerState === 'paused' && (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resumeTimer}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg"
            >
              <Play className="w-5 h-5" />
              Resume
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetTimer}
              className="p-4 bg-gray-800 rounded-full text-gray-400 hover:text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          </>
        )}

        {(timerState === 'completed' || timerState === 'break') && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-white font-semibold flex items-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
            New Session
          </motion.button>
        )}

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Session Info */}
      {timerState !== 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-500">
            Studying: <span className="text-purple-400">{selectedSubject}</span>
          </p>
          {pauseCount > 0 && (
            <p className="text-xs text-orange-400 mt-1">
              Paused {pauseCount} time{pauseCount > 1 ? 's' : ''} (-{pauseCount * 3}% focus)
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Timer;
