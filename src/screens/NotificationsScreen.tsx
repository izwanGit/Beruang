// src/screens/NotificationsScreen.tsx
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';

type Notification = {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'alert';
    time: string;
    isRead: boolean;
};

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Budget Alert! 🚨',
        message: "Rawrr! You've spent 90% of your 'Wants' category for January. Better slow down!",
        type: 'alert',
        time: '2 hours ago',
        isRead: false,
    },
    {
        id: '2',
        title: 'New Avatar Unlocked! 🎩',
        message: "Level 10 reached! You've unlocked the 'Gentleman Bear' suit. Check your profile!",
        type: 'success',
        time: '5 hours ago',
        isRead: false,
    },
    {
        id: '3',
        title: 'Daily Reminder 🐻',
        message: "Don't forget to log your lunch expense! Staying consistent is the key to wealth.",
        type: 'info',
        time: '1 day ago',
        isRead: true,
    },
    {
        id: '4',
        title: 'AI Analysis Ready ✨',
        message: "I've analyzed your spending patterns from last week. Ready to see how to save RM 50?",
        type: 'info',
        time: '2 days ago',
        isRead: true,
    },
];

type NotificationsScreenProps = {
    onBack: () => void;
};

export const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
    const insets = useSafeAreaInsets();
    const headerTopPadding = Math.max(insets.top, 20) + 12;

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return { name: 'alert-circle', color: '#FF5252' };
            case 'success': return { name: 'check-circle', color: '#66bb6a' };
            case 'warning': return { name: 'help-circle', color: '#ffa726' };
            default: return { name: 'info', color: '#42a5f5' };
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={[styles.header, { paddingTop: headerTopPadding, height: 60 + headerTopPadding }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                        <Icon name="arrow-left" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <TouchableOpacity style={styles.headerButton}>
                        <Icon name="check" size={22} color={COLORS.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {MOCK_NOTIFICATIONS.length > 0 ? (
                    MOCK_NOTIFICATIONS.map((item) => {
                        const iconInfo = getIcon(item.type);
                        return (
                            <TouchableOpacity key={item.id} style={[styles.card, !item.isRead && styles.unreadCard]}>
                                <View style={[styles.iconContainer, { backgroundColor: iconInfo.color + '15' }]}>
                                    <MaterialCommunityIcon name={iconInfo.name} size={24} color={iconInfo.color} />
                                </View>
                                <View style={styles.details}>
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
                                        <Text style={styles.time}>{item.time}</Text>
                                    </View>
                                    <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                                </View>
                                {!item.isRead && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcon name="bell-off-outline" size={80} color={COLORS.lightGray} />
                        <Text style={styles.emptyText}>All quiet in the forest... 🐻</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.accent,
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    unreadCard: {
        backgroundColor: '#FFF',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.accent,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    details: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    unreadText: {
        fontWeight: 'bold',
    },
    time: {
        fontSize: 11,
        color: '#999',
    },
    message: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 16,
        color: COLORS.darkGray,
        fontWeight: '500',
    },
});
