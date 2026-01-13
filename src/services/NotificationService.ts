import notifee, { AndroidImportance, TriggerType, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// NOTE: Using ONLY Notifee for notifications (no Firebase = no $99 fee)

const NOTIFICATION_HISTORY_KEY = '@beruang_notification_history';

export type StoredNotification = {
    id: string;
    title: string;
    body: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    timestamp: number;
    isRead: boolean;
};

class NotificationService {

    // ========================================
    // NOTIFICATION HISTORY STORAGE
    // ========================================

    async saveToHistory(title: string, body: string, type: StoredNotification['type'] = 'info') {
        try {
            const history = await this.getHistory();
            const newNotification: StoredNotification = {
                id: Date.now().toString(),
                title,
                body,
                type,
                timestamp: Date.now(),
                isRead: false,
            };
            const updated = [newNotification, ...history].slice(0, 20); // Keep max 20
            await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
            console.log('📥 Notification saved to history:', title);
        } catch (e) {
            console.log('Error saving notification to history:', e);
        }
    }

    async getHistory(): Promise<StoredNotification[]> {
        try {
            const data = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.log('Error getting notification history:', e);
            return [];
        }
    }

    async markAsRead(id: string) {
        try {
            const history = await this.getHistory();
            const updated = history.map(n => n.id === id ? { ...n, isRead: true } : n);
            await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
            console.log('Error marking notification as read:', e);
        }
    }

    async markAllAsRead() {
        try {
            const history = await this.getHistory();
            const updated = history.map(n => ({ ...n, isRead: true }));
            await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
            console.log('Error marking all as read:', e);
        }
    }

    async getUnreadCount(): Promise<number> {
        const history = await this.getHistory();
        return history.filter(n => !n.isRead).length;
    }

    async deleteNotification(id: string) {
        try {
            const history = await this.getHistory();
            const updated = history.filter(n => n.id !== id);
            await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
            console.log('Error deleting notification:', e);
        }
    }

    async clearHistory() {
        try {
            await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
        } catch (e) {
            console.log('Error clearing notification history:', e);
        }
    }

    // ========================================
    // PERMISSION & SETUP
    // ========================================

    async requestUserPermission() {
        console.log('Requesting notification permission...');
        const settings = await notifee.requestPermission();

        if (settings.authorizationStatus >= 1) {
            console.log('Notification permission granted');
        } else {
            console.log('Notification permission denied');
        }
    }

    async getFCMToken() {
        console.log('FCM Token skipped (FYP demo mode - using local notifications only)');
        return null;
    }

    setupListeners() {
        notifee.onForegroundEvent(({ type, detail }) => {
            switch (type) {
                case EventType.DISMISSED:
                    console.log('User dismissed notification', detail.notification);
                    break;
                case EventType.PRESS:
                    console.log('User pressed notification', detail.notification);
                    break;
            }
        });
        console.log('Notifee foreground listeners set up');
    }

    // ========================================
    // DEMO FUNCTIONS (FYP Special)
    // ========================================

    async testTrigger() {
        console.log('Triggering test notification in 5 seconds...');

        const title = '🔥 Live Demo Alert';
        const body = 'This notification was triggered just now! The system is working perfectly.';

        // Save to history immediately
        await this.saveToHistory(title, body, 'success');

        const trigger: any = {
            type: TriggerType.TIMESTAMP,
            timestamp: Date.now() + 5000,
        };

        const channelId = await notifee.createChannel({
            id: 'demo',
            name: 'Demo Channel',
            importance: AndroidImportance.HIGH,
            sound: 'noti',
        });

        await notifee.createTriggerNotification(
            {
                title,
                body,
                android: {
                    channelId,
                    smallIcon: 'ic_launcher',
                    pressAction: { id: 'default' },
                    importance: AndroidImportance.HIGH,
                },
                ios: {
                    sound: 'noti.mp3',
                }
            },
            trigger,
        );
    }

    // ========================================
    // SCHEDULED DAILY REMINDERS (5x per day)
    // ========================================
    async scheduleDailyReminders(budgetData: any) {
        // Cancel existing reminders first
        await notifee.cancelAllNotifications();

        const channelId = await notifee.createChannel({
            id: 'daily-reminder',
            name: 'Daily Reminders',
            importance: AndroidImportance.HIGH,
            sound: 'noti',
        });

        // Define reminder times and messages
        const reminders = [
            // NEAR FUTURE REMINDERS (For FYP Demo)
            { relativeMinutes: 15, title: '🚀 FYP Demo Mode', body: 'The automated monitoring system is active and tracking your budget!' },
            { relativeMinutes: 60, title: '🛡️ Financial Guardian', body: 'Friendly reminder: Consistency is key to reaching your savings goals!' },

            // FIXED DAILY REMINDERS
            { hour: 9, minute: 0, title: '☀️ Good Morning!', body: 'Start your day by logging any expenses. Every ringgit counts!' },
            { hour: 12, minute: 0, title: '🍽️ Lunch Time Check', body: 'Had lunch? Don\'t forget to track that meal expense!' },
            { hour: 15, minute: 0, title: '📊 Afternoon Update', body: 'Quick check: How\'s your budget looking today?' },
            { hour: 18, minute: 0, title: '🌆 Evening Reminder', body: 'Heading home? Log any transport or shopping expenses!' },
            { hour: 21, minute: 0, title: '🌙 Daily Wrap-up', body: 'Before bed, make sure all today\'s expenses are logged!' },
        ];

        const now = new Date();

        for (let i = 0; i < reminders.length; i++) {
            const reminder = reminders[i] as any;
            const triggerDate = new Date();

            if (reminder.relativeMinutes !== undefined) {
                triggerDate.setMinutes(triggerDate.getMinutes() + reminder.relativeMinutes);
            } else {
                triggerDate.setHours(reminder.hour, reminder.minute, 0, 0);
                // If the time has passed today, schedule for tomorrow
                if (triggerDate <= now) {
                    triggerDate.setDate(triggerDate.getDate() + 1);
                }
            }

            // Customize body with budget data if available
            let body = reminder.body;
            if (budgetData && reminder.hour === 21) {
                const { budget } = budgetData;
                const totalSafe = Math.max(0, budget.needs.remaining) + Math.max(0, budget.wants.remaining);
                body = `Today's budget left: RM${totalSafe.toFixed(0)}. Log any missed expenses!`;
            }

            try {
                await notifee.createTriggerNotification(
                    {
                        id: `daily-${i}`,
                        title: reminder.title,
                        body: body,
                        android: {
                            channelId,
                            smallIcon: 'ic_launcher',
                            pressAction: { id: 'default' },
                        },
                        ios: {
                            sound: 'noti.mp3',
                        }
                    },
                    {
                        type: TriggerType.TIMESTAMP,
                        timestamp: triggerDate.getTime(),
                    },
                );
                console.log(`Scheduled: ${reminder.title} at ${triggerDate.toLocaleTimeString()}`);
            } catch (e) {
                console.log('Error scheduling reminder:', e);
            }
        }

        console.log('✅ All 5 daily reminders scheduled!');
    }

    // ========================================
    // SMART REMINDER (The "WOW" Factor)
    // ========================================
    async scheduleSmartReminder(budgetData: any) {
        console.log('Scheduling smart reminder in 10 seconds...');

        // Generate personalized message based on budget data
        let title = '🐻 Beruang Misses You!';
        let body = "Come back and check your budget!";
        let type: StoredNotification['type'] = 'info';

        if (budgetData) {
            const { budget } = budgetData;
            const needsRemaining = Math.max(0, budget.needs.remaining);
            const wantsRemaining = Math.max(0, budget.wants.remaining);
            const totalSafeToSpend = needsRemaining + wantsRemaining;
            const savingsProgress = budget.savings20.target > 0
                ? Math.round((budget.savings20.saved / budget.savings20.target) * 100)
                : 0;

            if (savingsProgress >= 100) {
                title = '🏆 Savings Goal Achieved!';
                body = `You've saved 100% of your monthly goal! Keep it up, financial master! 💪`;
                type = 'success';
            } else if (totalSafeToSpend < 50) {
                title = '⚠️ Budget Running Low';
                body = `You only have RM ${totalSafeToSpend.toFixed(0)} left to spend safely this month. Be careful!`;
                type = 'warning';
            } else if (wantsRemaining > 100) {
                title = '💡 Smart Spending Tip';
                body = `You still have RM ${wantsRemaining.toFixed(0)} in your "Wants" budget. Treat yourself wisely! 🛍️`;
                type = 'info';
            } else {
                title = '📊 Your Budget Update';
                body = `Safe to spend: RM ${totalSafeToSpend.toFixed(0)} | Savings: ${savingsProgress}% complete`;
                type = 'info';
            }
        }

        // Save to history immediately
        await this.saveToHistory(title, body, type);

        const trigger: any = {
            type: TriggerType.TIMESTAMP,
            timestamp: Date.now() + 900000, // 15 minutes for demo (was 30s)
        };

        const channelId = await notifee.createChannel({
            id: 'smart-reminder',
            name: 'Smart Reminders',
            importance: AndroidImportance.DEFAULT,
            sound: 'noti',
        });

        try {
            await notifee.createTriggerNotification(
                {
                    title,
                    body,
                    android: {
                        channelId,
                        smallIcon: 'ic_launcher',
                    },
                    ios: {
                        sound: 'noti.mp3',
                    }
                },
                trigger,
            );
        } catch (e) {
            console.log("Error scheduling notification: ", e);
        }
    }

    async cancelAll() {
        await notifee.cancelAllNotifications();
    }
}

export default new NotificationService();
