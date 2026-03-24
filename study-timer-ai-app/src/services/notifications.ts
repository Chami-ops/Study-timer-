// Notification Service for Study App
export class NotificationService {
  private permission: NotificationPermission = 'default';
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    this.permission = Notification.permission;

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  canNotify(): boolean {
    return this.permission === 'granted';
  }

  async notify(title: string, options?: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      if (this.swRegistration) {
        await this.swRegistration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options
        });
      } else {
        new Notification(title, {
          icon: '/icon-192.png',
          ...options
        });
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  async notifyProgress(percentage: number, remainingTime: string): Promise<void> {
    await this.notify('Study Session Progress', {
      body: `${percentage}% complete • ${remainingTime} remaining`,
      tag: 'study-progress',
      silent: true
    });
  }

  async notifySessionComplete(duration: number, focusScore: number): Promise<void> {
    await this.notify('🎉 Study Session Complete!', {
      body: `Great job! You studied for ${duration} minutes with a focus score of ${focusScore}%`,
      tag: 'session-complete'
    });
  }

  async notifyBreakTime(breakDuration: number): Promise<void> {
    await this.notify('⏰ Time for a Break!', {
      body: `Take a ${breakDuration} minute break to recharge your focus.`,
      tag: 'break-reminder'
    });
  }

  async notifyMotivation(message: string): Promise<void> {
    await this.notify('💪 Study Motivation', {
      body: message,
      tag: 'motivation'
    });
  }

  async notifyDailyReminder(goal: number, completed: number): Promise<void> {
    const remaining = Math.max(0, goal - completed);
    await this.notify('📚 Daily Study Reminder', {
      body: `You have ${remaining} minutes left to reach your daily goal!`,
      tag: 'daily-reminder'
    });
  }

  async notifyStreak(days: number): Promise<void> {
    await this.notify('🔥 Study Streak!', {
      body: `Amazing! You're on a ${days}-day study streak!`,
      tag: 'streak'
    });
  }
}

export const notificationService = new NotificationService();

export const motivationalMessages = [
  "Every expert was once a beginner. Keep going!",
  "Small progress is still progress. You've got this!",
  "Your future self will thank you for studying today.",
  "Discipline is the bridge between goals and accomplishment.",
  "The more you learn, the more you earn.",
  "Success is the sum of small efforts, repeated daily.",
  "Don't watch the clock; do what it does. Keep going.",
  "The secret of getting ahead is getting started.",
  "Focus on progress, not perfection.",
  "Your brain is a muscle. The more you use it, the stronger it gets."
];

export function getRandomMotivation(): string {
  return motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
}
