import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../constants/colors';
import Icon from 'react-native-vector-icons/Feather';

interface GoalProgressProps {
    data: {
        name: string;
        cur: number;
        tar: number;
    };
}

export const GoalProgressWidget: React.FC<GoalProgressProps> = ({ data }) => {
    const { name, cur, tar } = data;
    const progress = Math.min(100, (cur / tar) * 100);

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconBox}>
                    <Icon name="target" size={20} color={COLORS.white} />
                </View>
                <View style={styles.titleInfo}>
                    <Text style={styles.title}>{name}</Text>
                    <Text style={styles.goalText}>Target: RM {tar.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.barContainer}>
                    <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                <View style={styles.stats}>
                    <Text style={styles.currentText}>RM {cur.toLocaleString()}</Text>
                    <Text style={styles.percentText}>{progress.toFixed(0)}%</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Keep saving to reach your goal! 🚀</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 18,
        borderWidth: 1.5,
        borderColor: COLORS.primary + '30',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleInfo: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.accent,
    },
    goalText: {
        fontSize: 12,
        color: COLORS.darkGray,
        fontWeight: '600',
    },
    progressSection: {
        marginBottom: 12,
    },
    barContainer: {
        height: 12,
        backgroundColor: '#F0F0F0',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 6,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    currentText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.accent,
    },
    percentText: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.primary,
    },
    footer: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    footerText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: COLORS.darkGray,
        textAlign: 'center',
    }
});
