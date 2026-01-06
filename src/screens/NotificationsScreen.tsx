// src/screens/NotificationsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    RefreshControl,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import NotificationService, { StoredNotification } from '../services/NotificationService';

type NotificationsScreenProps = {
    onBack: () => void;
};

export const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
    const insets = useSafeAreaInsets();
    const headerTopPadding = Math.max(insets.top, 20) + 12;

    const [notifications, setNotifications] = useState<StoredNotification[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        const history = await NotificationService.getHistory();
        setNotifications(history);
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const handlePress = async (id: string) => {
        await NotificationService.markAsRead(id);
        await loadNotifications();
    };

    const handleReadAll = async () => {
        await NotificationService.markAllAsRead();
        await loadNotifications();
    };

    const handleDeleteAll = () => {
        Alert.alert(
            'Delete All Notifications',
            'Are you sure you want to delete all notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        await NotificationService.clearHistory();
                        await loadNotifications();
                    }
                },
            ]
        );
    };

    const handleDelete = (id: string, title: string) => {
        Alert.alert(
            'Delete Notification',
            `Delete "${title.substring(0, 30)}..."?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await NotificationService.deleteNotification(id);
                        await loadNotifications();
                    }
                },
            ]
        );
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return { name: 'alert-circle', color: '#FF5252' };
            case 'success': return { name: 'check-circle', color: '#66bb6a' };
            case 'warning': return { name: 'alert', color: '#ffa726' };
            default: return { name: 'bell', color: '#42a5f5' };
        }
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={[styles.header, { paddingTop: headerTopPadding, height: 60 + headerTopPadding }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                        <Icon name="arrow-left" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {notifications.length > 0 ? (
                        unreadCount > 0 ? (
                            <TouchableOpacity onPress={handleReadAll} style={styles.headerButton}>
                                <Icon name="check-circle" size={22} color={COLORS.accent} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={handleDeleteAll} style={styles.headerButton}>
                                <Icon name="trash-2" size={22} color="#FF5252" />
                            </TouchableOpacity>
                        )
                    ) : (
                        <View style={styles.headerButton} />
                    )}
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
                }
            >
                {notifications.length > 0 ? (
                    notifications.map((item) => {
                        const iconInfo = getIcon(item.type);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.card, !item.isRead && styles.unreadCard]}
                                onPress={() => handlePress(item.id)}
                                onLongPress={() => handleDelete(item.id, item.title)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: iconInfo.color + '15' }]}>
                                    <MaterialCommunityIcon name={iconInfo.name} size={24} color={iconInfo.color} />
                                </View>
                                <View style={styles.details}>
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.title, !item.isRead && styles.unreadText]} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
                                    </View>
                                    <Text style={styles.message} numberOfLines={2}>{item.body}</Text>
                                </View>
                                {!item.isRead && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcon name="bell-outline" size={80} color={COLORS.lightGray} />
                        <Text style={styles.emptyTitle}>No Notifications Yet</Text>
                        <Text style={styles.emptyText}>
                            Smart budget alerts will appear here when triggered.
                        </Text>
                    </View>
                )}

                {notifications.length > 0 && (
                    <Text style={styles.hintText}>Long press to delete a notification</Text>
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
        flexGrow: 1,
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
        flex: 1,
        marginRight: 8,
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
    emptyTitle: {
        marginTop: 20,
        fontSize: 18,
        color: COLORS.accent,
        fontWeight: '700',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.darkGray,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    hintText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#999',
        marginTop: 10,
        fontStyle: 'italic',
    },
});
