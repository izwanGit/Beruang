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

type NotificationsScreenProps = {
    onBack: () => void;
};

export const NotificationsScreen = ({ onBack }: NotificationsScreenProps) => {
    const insets = useSafeAreaInsets();
    const headerTopPadding = Math.max(insets.top, 20) + 12;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={[styles.header, { paddingTop: headerTopPadding, height: 60 + headerTopPadding }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
                        <Icon name="arrow-left" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <View style={styles.headerButton} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcon name="bell-ring-outline" size={80} color={COLORS.accent} />
                    <Text style={styles.emptyTitle}>Smart Notifications Active! 🔔</Text>
                    <Text style={styles.emptyText}>
                        Beruang sends helpful reminders directly to your phone:
                    </Text>

                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcon name="trophy-outline" size={24} color="#66bb6a" />
                            <Text style={styles.featureText}>Savings goal achievements</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcon name="alert-circle-outline" size={24} color="#FF5252" />
                            <Text style={styles.featureText}>Budget running low alerts</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <MaterialCommunityIcon name="lightbulb-outline" size={24} color="#ffa726" />
                            <Text style={styles.featureText}>Smart spending tips</Text>
                        </View>
                        <View style={[styles.featureItem, { borderBottomWidth: 0 }]}>
                            <MaterialCommunityIcon name="paw" size={24} color={COLORS.accent} />
                            <Text style={styles.featureText}>Friendly reminders from Beruang</Text>
                        </View>
                    </View>
                </View>
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    emptyTitle: {
        marginTop: 20,
        fontSize: 20,
        color: COLORS.accent,
        fontWeight: '700',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: COLORS.darkGray,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    featureList: {
        marginTop: 30,
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    featureText: {
        marginLeft: 15,
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },
});
