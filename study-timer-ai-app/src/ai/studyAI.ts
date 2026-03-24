// Lightweight AI Engine for Study Predictions and Recommendations
// Using simple statistical ML algorithms instead of heavy TensorFlow.js

import { dbHelpers, AITrainingData } from '../db/database';

// Simple Linear Regression for predictions
class SimpleLinearRegression {
  private slope: number = 0;
  private intercept: number = 0;
  private trained: boolean = false;

  train(x: number[], y: number[]): void {
    if (x.length < 2) return;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    this.slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    this.intercept = (sumY - this.slope * sumX) / n;
    this.trained = true;
  }

  predict(x: number): number {
    if (!this.trained) return 0;
    return this.slope * x + this.intercept;
  }

  isTrained(): boolean {
    return this.trained;
  }
}

// K-Nearest Neighbors for pattern matching
class SimpleKNN {
  private data: { features: number[]; label: number }[] = [];
  private k: number = 3;

  addData(features: number[], label: number): void {
    this.data.push({ features, label });
  }

  predict(features: number[]): number {
    if (this.data.length < this.k) {
      return this.data.length > 0 
        ? this.data.reduce((sum, d) => sum + d.label, 0) / this.data.length 
        : 0;
    }

    // Calculate distances
    const distances = this.data.map(d => ({
      distance: this.euclideanDistance(features, d.features),
      label: d.label
    }));

    // Sort by distance and get k nearest
    distances.sort((a, b) => a.distance - b.distance);
    const kNearest = distances.slice(0, this.k);

    // Return average label of k nearest neighbors
    return kNearest.reduce((sum, d) => sum + d.label, 0) / this.k;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, ai, i) => sum + Math.pow(ai - (b[i] || 0), 2), 0));
  }

  hasData(): boolean {
    return this.data.length >= this.k;
  }

  clear(): void {
    this.data = [];
  }
}

// Main AI Engine
export class StudyAI {
  private durationModel: SimpleLinearRegression;
  private focusModel: SimpleKNN;
  private completionModel: SimpleKNN;
  private modelTrained: boolean = false;

  constructor() {
    this.durationModel = new SimpleLinearRegression();
    this.focusModel = new SimpleKNN();
    this.completionModel = new SimpleKNN();
    this.loadModels();
  }

  // Train the models with user's study data
  async trainModel(): Promise<void> {
    try {
      const data = await dbHelpers.getAITrainingData();
      
      if (data.length < 3) {
        console.log('Not enough data to train. Need at least 3 sessions.');
        return;
      }

      // Clear existing model data
      this.focusModel.clear();
      this.completionModel.clear();

      // Prepare training data
      const hours: number[] = [];
      const durations: number[] = [];

      data.forEach(item => {
        // For duration prediction based on hour
        hours.push(item.hourOfDay);
        durations.push(item.sessionDuration);

        // For focus score prediction
        const features = [
          item.dayOfWeek / 6,
          item.hourOfDay / 23,
          item.sessionDuration / 120
        ];
        this.focusModel.addData(features, item.focusScore);

        // For completion prediction
        this.completionModel.addData(features, item.completed ? 100 : 0);
      });

      // Train duration model
      this.durationModel.train(hours, durations);

      this.modelTrained = true;
      this.saveModels();
      console.log('AI models trained successfully');
    } catch (error) {
      console.error('Training error:', error);
    }
  }

  // Predict optimal study time for current moment
  async predictOptimalStudyTime(): Promise<{
    recommendedDuration: number;
    predictedFocusScore: number;
    successProbability: number;
    confidence: string;
  }> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    if (!this.modelTrained) {
      return this.getScientificDefaults(now);
    }

    try {
      // Predict duration
      let predictedDuration = this.durationModel.predict(hour);
      predictedDuration = Math.max(15, Math.min(120, Math.round(predictedDuration)));

      // Predict focus score
      const features = [dayOfWeek / 6, hour / 23, predictedDuration / 120];
      let predictedFocus = this.focusModel.predict(features);
      predictedFocus = Math.max(50, Math.min(100, Math.round(predictedFocus)));

      // Predict success probability
      let successProb = this.completionModel.predict(features);
      successProb = Math.max(50, Math.min(100, Math.round(successProb)));

      return {
        recommendedDuration: predictedDuration,
        predictedFocusScore: predictedFocus,
        successProbability: successProb,
        confidence: this.getConfidenceLevel()
      };
    } catch (error) {
      return this.getScientificDefaults(now);
    }
  }

  // Get recommendations based on scientific research when AI isn't trained
  private getScientificDefaults(now: Date): {
    recommendedDuration: number;
    predictedFocusScore: number;
    successProbability: number;
    confidence: string;
  } {
    const hour = now.getHours();
    
    // Based on circadian rhythm research
    let recommendedDuration = 45;
    let predictedFocusScore = 70;
    
    // Peak focus hours (9-11 AM and 3-5 PM based on research)
    if ((hour >= 9 && hour <= 11) || (hour >= 15 && hour <= 17)) {
      recommendedDuration = 90; // Ultradian rhythm cycle
      predictedFocusScore = 85;
    } else if (hour >= 20 || hour <= 6) {
      recommendedDuration = 25; // Short Pomodoro for low energy
      predictedFocusScore = 50;
    }

    return {
      recommendedDuration,
      predictedFocusScore,
      successProbability: 75,
      confidence: 'scientific-default'
    };
  }

  private getConfidenceLevel(): string {
    const data = this.focusModel.hasData();
    if (data && this.modelTrained) return 'high';
    if (this.modelTrained) return 'medium';
    return 'low';
  }

  // Analyze study patterns
  async analyzePatterns(): Promise<StudyPatternAnalysis> {
    const data = await dbHelpers.getAITrainingData();
    
    if (data.length < 3) {
      return {
        bestDayOfWeek: 'Not enough data',
        bestTimeOfDay: 'Not enough data',
        averageSessionLength: 0,
        averageFocusScore: 0,
        completionRate: 0,
        recommendations: ['Complete more study sessions to unlock AI insights!'],
        streakAnalysis: 'Start your study streak today!'
      };
    }

    // Analyze by day of week
    const dayStats: Record<number, { total: number; count: number; focus: number }> = {};
    const hourStats: Record<number, { total: number; count: number; focus: number }> = {};

    data.forEach(item => {
      if (!dayStats[item.dayOfWeek]) {
        dayStats[item.dayOfWeek] = { total: 0, count: 0, focus: 0 };
      }
      dayStats[item.dayOfWeek].total += item.sessionDuration;
      dayStats[item.dayOfWeek].count++;
      dayStats[item.dayOfWeek].focus += item.focusScore;

      if (!hourStats[item.hourOfDay]) {
        hourStats[item.hourOfDay] = { total: 0, count: 0, focus: 0 };
      }
      hourStats[item.hourOfDay].total += item.sessionDuration;
      hourStats[item.hourOfDay].count++;
      hourStats[item.hourOfDay].focus += item.focusScore;
    });

    // Find best performing times
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDay = 0;
    let bestDayScore = 0;
    let bestHour = 0;
    let bestHourScore = 0;

    Object.entries(dayStats).forEach(([day, stats]) => {
      const score = (stats.focus / stats.count) * (stats.total / stats.count);
      if (score > bestDayScore) {
        bestDayScore = score;
        bestDay = parseInt(day);
      }
    });

    Object.entries(hourStats).forEach(([hour, stats]) => {
      const score = (stats.focus / stats.count) * (stats.total / stats.count);
      if (score > bestHourScore) {
        bestHourScore = score;
        bestHour = parseInt(hour);
      }
    });

    const totalSessions = data.length;
    const completedSessions = data.filter(d => d.completed).length;
    const avgDuration = data.reduce((sum, d) => sum + d.sessionDuration, 0) / totalSessions;
    const avgFocus = data.reduce((sum, d) => sum + d.focusScore, 0) / totalSessions;

    // Generate AI recommendations
    const recommendations = this.generateRecommendations({
      bestDay: days[bestDay],
      bestHour,
      avgDuration,
      avgFocus,
      completionRate: (completedSessions / totalSessions) * 100
    });

    return {
      bestDayOfWeek: days[bestDay],
      bestTimeOfDay: this.formatHour(bestHour),
      averageSessionLength: Math.round(avgDuration),
      averageFocusScore: Math.round(avgFocus),
      completionRate: Math.round((completedSessions / totalSessions) * 100),
      recommendations,
      streakAnalysis: this.analyzeStreak(data)
    };
  }

  private formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }

  private generateRecommendations(stats: {
    bestDay: string;
    bestHour: number;
    avgDuration: number;
    avgFocus: number;
    completionRate: number;
  }): string[] {
    const recommendations: string[] = [];

    // Duration recommendations
    if (stats.avgDuration < 25) {
      recommendations.push('Try longer study sessions (25-50 min) for deeper learning.');
    } else if (stats.avgDuration > 90) {
      recommendations.push('Consider breaking long sessions into 90-min blocks with breaks.');
    }

    // Focus recommendations
    if (stats.avgFocus < 60) {
      recommendations.push('Your focus is improving! Try eliminating distractions for higher scores.');
    } else if (stats.avgFocus >= 80) {
      recommendations.push('Excellent focus! Maintain your current study environment.');
    }

    // Completion rate
    if (stats.completionRate < 70) {
      recommendations.push('Set smaller, achievable goals to improve completion rate.');
    }

    // Time-based recommendations
    recommendations.push(`Your peak performance time is ${this.formatHour(stats.bestHour)} on ${stats.bestDay}s.`);

    // Scientific study tips
    recommendations.push('Use active recall: Test yourself instead of re-reading.');
    recommendations.push('Apply spaced repetition for long-term retention.');

    return recommendations;
  }

  private analyzeStreak(data: AITrainingData[]): string {
    if (data.length === 0) return 'Start your first session to begin your streak!';
    
    const sortedData = [...data].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const today = new Date().toDateString();
    const lastSession = new Date(sortedData[0].timestamp).toDateString();

    if (today === lastSession) {
      return 'Great job! You studied today. Keep the streak going!';
    } else {
      return 'Complete a session today to maintain your streak!';
    }
  }

  // Save models to localStorage
  private saveModels(): void {
    try {
      localStorage.setItem('study-ai-trained', 'true');
      console.log('Model state saved');
    } catch (error) {
      console.error('Error saving model:', error);
    }
  }

  // Load models from localStorage
  private loadModels(): void {
    try {
      const trained = localStorage.getItem('study-ai-trained');
      if (trained === 'true') {
        // Retrain on next data fetch
        this.trainModel();
      }
    } catch (error) {
      console.log('No saved model found');
    }
  }

  // Get study technique recommendation
  getStudyTechniqueRecommendation(duration: number): StudyTechnique {
    if (duration <= 30) {
      return {
        name: 'Pomodoro',
        workDuration: 25,
        breakDuration: 5,
        description: 'Perfect for short, focused bursts. Work for 25 min, rest for 5.',
        scientificBasis: 'Based on Francesco Cirillo\'s technique, proven to reduce mental fatigue.'
      };
    } else if (duration <= 60) {
      return {
        name: 'Extended Pomodoro',
        workDuration: 50,
        breakDuration: 10,
        description: 'Two Pomodoro cycles for medium sessions.',
        scientificBasis: 'Extended focus periods for complex problem-solving.'
      };
    } else if (duration <= 120) {
      return {
        name: 'Ultradian Sprint',
        workDuration: 90,
        breakDuration: 20,
        description: 'Aligns with natural ultradian rhythms for deep work.',
        scientificBasis: 'Based on 90-minute biological cycles discovered by Nathaniel Kleitman.'
      };
    } else {
      return {
        name: 'Deep Work',
        workDuration: 120,
        breakDuration: 30,
        description: 'Extended deep focus for mastery and complex projects.',
        scientificBasis: 'Cal Newport\'s Deep Work methodology for cognitively demanding tasks.'
      };
    }
  }
}

// Interfaces
export interface StudyPatternAnalysis {
  bestDayOfWeek: string;
  bestTimeOfDay: string;
  averageSessionLength: number;
  averageFocusScore: number;
  completionRate: number;
  recommendations: string[];
  streakAnalysis: string;
}

export interface StudyTechnique {
  name: string;
  workDuration: number;
  breakDuration: number;
  description: string;
  scientificBasis: string;
}

// Singleton instance
export const studyAI = new StudyAI();
