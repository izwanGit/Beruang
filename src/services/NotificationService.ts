import notifee, { AndroidImportance, TriggerType, EventType } from '@notifee/react-native';

// NOTE: Using ONLY Notifee for notifications (no Firebase = no $99 fee)

class NotificationService {

    // 1. Request Permission
    async requestUserPermission() {
        console.log('Requesting notification permission...');
        await notifee.requestPermission();
        console.log('Notification permission granted via Notifee');
    }

    // 2. FCM Token - Disabled for FYP demo
    async getFCMToken() {
        console.log('FCM Token skipped (FYP demo mode - using local notifications only)');
        return null;
    }

    // 3. Listeners
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

    // 4. Display Local Notification
    async displayLocalNotification(title: string, body: string, data = {}) {
        const channelId = await notifee.createChannel({
            id: 'default',
            name: 'Default Channel',
            importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
            title,
            body,
            data,
            android: {
                channelId,
                smallIcon: 'ic_launcher',
                pressAction: { id: 'default' },
            },
            ios: { sound: 'default' },
        });
    }

    // ========================================
    // 5. DEMO FUNCTIONS (FYP Special)
    // ========================================

    // Manual Test Button (5 seconds)
    async testTrigger() {
        console.log('Triggering test notification in 5 seconds...');

        const trigger: any = {
            type: TriggerType.TIMESTAMP,
            timestamp: Date.now() + 5000,
        };

        const channelId = await notifee.createChannel({
            id: 'demo',
            name: 'Demo Channel',
            importance: AndroidImportance.HIGH,
        });

        await notifee.createTriggerNotification(
            {
                title: '🔥 Live Demo Alert',
                body: 'This notification was triggered just now! The system is working perfectly.',
                android: { channelId, pressAction: { id: 'default' } },
            },
            trigger,
        );
    }

    // ========================================
    // 6. SMART REMINDER (The "WOW" Factor)
    // ========================================
    async scheduleSmartReminder(budgetData: any) {
        console.log('Scheduling smart reminder in 10 seconds...');

        const trigger: any = {
            type: TriggerType.TIMESTAMP,
            timestamp: Date.now() + 10000, // 10 seconds for testing
        };

        const channelId = await notifee.createChannel({
            id: 'smart-reminder',
            name: 'Smart Reminders',
            importance: AndroidImportance.DEFAULT,
        });

        // Generate personalized message based on budget data
        let title = '🐻 Beruang Misses You!';
        let body = "Come back and check your budget!";

        console.log('📊 Budget data received:', budgetData ? 'YES' : 'NO');
        if (budgetData) {
            console.log('📊 Budget details:', JSON.stringify({
                needsRemaining: budgetData.budget?.needs?.remaining,
                wantsRemaining: budgetData.budget?.wants?.remaining,
                savingsTarget: budgetData.budget?.savings20?.target,
                savingsSaved: budgetData.budget?.savings20?.saved,
            }));
            const { budget, totals } = budgetData;
            const needsRemaining = Math.max(0, budget.needs.remaining);
            const wantsRemaining = Math.max(0, budget.wants.remaining);
            const totalSafeToSpend = needsRemaining + wantsRemaining;
            const savingsProgress = budget.savings20.target > 0
                ? Math.round((budget.savings20.saved / budget.savings20.target) * 100)
                : 0;

            // Choose the most relevant message
            if (savingsProgress >= 100) {
                title = '🏆 Savings Goal Achieved!';
                body = `You've saved 100% of your monthly goal! Keep it up, financial master! 💪`;
            } else if (totalSafeToSpend < 50) {
                title = '⚠️ Budget Running Low';
                body = `You only have RM ${totalSafeToSpend.toFixed(0)} left to spend safely this month. Be careful!`;
            } else if (wantsRemaining > 100) {
                title = '💡 Smart Spending Tip';
                body = `You still have RM ${wantsRemaining.toFixed(0)} in your "Wants" budget. Treat yourself wisely! 🛍️`;
            } else {
                title = '📊 Your Budget Update';
                body = `Safe to spend: RM ${totalSafeToSpend.toFixed(0)} | Savings: ${savingsProgress}% complete`;
            }
        }

        try {
            await notifee.createTriggerNotification(
                {
                    title,
                    body,
                    android: { channelId },
                },
                trigger,
            );
        } catch (e) {
            console.log("Error scheduling notification: ", e);
        }
    }

    // Cancel all pending notifications
    async cancelAll() {
        await notifee.cancelAllNotifications();
    }
}

export default new NotificationService();
