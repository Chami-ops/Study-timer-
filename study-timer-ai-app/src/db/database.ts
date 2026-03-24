import Dexie, { Table } from 'dexie';

// Study Session Interface
export interface StudySession {
  id?: number;
  startTime: Date;
  endTime: Date;
  targetDuration: number; // in minutes
  actualDuration: number; // in minutes
  subject: string;
  completed: boolean;
  focusScore: number; // 0-100
  technique: 'pomodoro' | 'deep-work' | 'ultradian' | 'custom';
  breaks: number;
  notes?: string;
}

// User Profile
export interface UserProfile {
  id?: number;
  name: string;
  dailyGoal: number; // minutes
  preferredTechnique: string;
  streakDays: number;
  totalStudyTime: number;
  createdAt: Date;
  lastActiveAt: Date;
}

// AI Training Data
export interface AITrainingData {
  id?: number;
  dayOfWeek: number;
  hourOfDay: number;
  sessionDuration: number;
  focusScore: number;
  completed: boolean;
  timestamp: Date;
}

// Study Goals
export interface StudyGoal {
  id?: number;
  subject: string;
  targetHours: number;
  completedHours: number;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

// Daily Stats
export interface DailyStat {
  id?: number;
  date: string;
  totalMinutes: number;
  sessionsCompleted: number;
  averageFocusScore: number;
  techniques: Record<string, number>;
}

class StudyDatabase extends Dexie {
  sessions!: Table<StudySession>;
  profile!: Table<UserProfile>;
  aiData!: Table<AITrainingData>;
  goals!: Table<StudyGoal>;
  dailyStats!: Table<DailyStat>;

  constructor() {
    super('StudyFocusDB');
    
    this.version(1).stores({
      sessions: '++id, startTime, endTime, subject, technique, completed',
      profile: '++id, name',
      aiData: '++id, timestamp, dayOfWeek, hourOfDay',
      goals: '++id, subject, deadline, priority',
      dailyStats: '++id, date'
    });
  }
}

export const db = new StudyDatabase();

// Database Helper Functions
export const dbHelpers = {
  // Get or create user profile
  async getProfile(): Promise<UserProfile> {
    let profile = await db.profile.toCollection().first();
    if (!profile) {
      const id = await db.profile.add({
        name: 'Student',
        dailyGoal: 120,
        preferredTechnique: 'pomodoro',
        streakDays: 0,
        totalStudyTime: 0,
        createdAt: new Date(),
        lastActiveAt: new Date()
      });
      profile = await db.profile.get(id);
    }
    return profile!;
  },

  // Update profile
  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    const profile = await this.getProfile();
    await db.profile.update(profile.id!, updates);
  },

  // Add study session
  async addSession(session: Omit<StudySession, 'id'>): Promise<number> {
    const id = await db.sessions.add(session as StudySession);
    
    // Also add to AI training data
    await db.aiData.add({
      dayOfWeek: session.startTime.getDay(),
      hourOfDay: session.startTime.getHours(),
      sessionDuration: session.actualDuration,
      focusScore: session.focusScore,
      completed: session.completed,
      timestamp: new Date()
    });

    // Update daily stats
    await this.updateDailyStats(session);
    
    // Update profile
    const profile = await this.getProfile();
    await this.updateProfile({
      totalStudyTime: profile.totalStudyTime + session.actualDuration,
      lastActiveAt: new Date()
    });

    return id;
  },

  // Update daily stats
  async updateDailyStats(session: Omit<StudySession, 'id'>): Promise<void> {
    const dateStr = new Date().toISOString().split('T')[0];
    let stat = await db.dailyStats.where('date').equals(dateStr).first();
    
    if (stat) {
      const newTotal = stat.totalMinutes + session.actualDuration;
      const newSessions = stat.sessionsCompleted + (session.completed ? 1 : 0);
      const newAvgFocus = (stat.averageFocusScore * stat.sessionsCompleted + session.focusScore) / (newSessions || 1);
      
      await db.dailyStats.update(stat.id!, {
        totalMinutes: newTotal,
        sessionsCompleted: newSessions,
        averageFocusScore: newAvgFocus,
        techniques: {
          ...stat.techniques,
          [session.technique]: (stat.techniques[session.technique] || 0) + 1
        }
      });
    } else {
      await db.dailyStats.add({
        date: dateStr,
        totalMinutes: session.actualDuration,
        sessionsCompleted: session.completed ? 1 : 0,
        averageFocusScore: session.focusScore,
        techniques: { [session.technique]: 1 }
      });
    }
  },

  // Get sessions for a date range
  async getSessionsInRange(startDate: Date, endDate: Date): Promise<StudySession[]> {
    return await db.sessions
      .where('startTime')
      .between(startDate, endDate)
      .toArray();
  },

  // Get today's sessions
  async getTodaySessions(): Promise<StudySession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return await this.getSessionsInRange(today, tomorrow);
  },

  // Get all AI training data
  async getAITrainingData(): Promise<AITrainingData[]> {
    return await db.aiData.toArray();
  },

  // Get weekly stats
  async getWeeklyStats(): Promise<DailyStat[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const dateStr = weekAgo.toISOString().split('T')[0];
    
    return await db.dailyStats
      .where('date')
      .above(dateStr)
      .toArray();
  },

  // Add goal
  async addGoal(goal: Omit<StudyGoal, 'id'>): Promise<number> {
    return await db.goals.add(goal as StudyGoal);
  },

  // Get active goals
  async getActiveGoals(): Promise<StudyGoal[]> {
    return await db.goals
      .where('deadline')
      .above(new Date())
      .toArray();
  },

  // Update goal progress
  async updateGoalProgress(goalId: number, additionalHours: number): Promise<void> {
    const goal = await db.goals.get(goalId);
    if (goal) {
      await db.goals.update(goalId, {
        completedHours: goal.completedHours + additionalHours
      });
    }
  }
};
