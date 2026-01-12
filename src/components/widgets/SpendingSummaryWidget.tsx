import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../constants/colors';
import Icon from 'react-native-vector-icons/Feather';

interface SpendingSummaryProps {
    data: {
        d: Array<{ c: string, a: number }>;
        p: number;
        o?: {
            from: string;
            to: string;
            a: number;
        };
    };
}

export const SpendingSummaryWidget: React.FC<SpendingSummaryProps> = ({ data }) => {
    const { d: detailedData, p: budgetPercentage } = data;

    const getCategoryIcon = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('need')) return 'shopping-cart';
        if (c.includes('want')) return 'heart';
        if (c.includes('save')) return 'briefcase';
        if (c.includes('food')) return 'coffee';
        return 'tag';
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.percentageCircle}>
                    <Text style={styles.percentageText}>{budgetPercentage}%</Text>
                    <Text style={styles.percentageLabel}>Used</Text>
                </View>
                <View style={styles.titleGroup}>
                    <Text style={styles.title}>Spending Review</Text>
                    <Text style={styles.subtitle}>Budget Utilization</Text>
                </View>
            </View>

            <View style={styles.list}>
                {detailedData.map((item, index) => (
                    <View key={index} style={styles.item}>
                        <View style={styles.iconCircle}>
                            <Icon name={getCategoryIcon(item.c)} size={14} color={COLORS.accent} />
                        </View>
                        <Text style={styles.itemCategory}>{item.c}</Text>
                        <Text style={styles.itemAmount}>RM {item.a.toFixed(2)}</Text>
                    </View>
                ))}
            </View>

            {data.o && (
                <View style={styles.overflowContainer}>
                    <View style={styles.overflowBadge}>
                        <Icon name="zap" size={10} color={COLORS.white} />
                        <Text style={styles.overflowBadgeText}>WATERFALL OVERFLOW</Text>
                    </View>
                    <Text style={styles.overflowText}>
                        <Text style={styles.bold}>{data.o.from}</Text> exceeded! RM {data.o.a.toFixed(0)} absorbed from <Text style={styles.bold}>{data.o.to}</Text>.
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1.5,
        borderColor: COLORS.primary + '40',
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 16,
    },
    percentageCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    percentageText: {
        fontSize: 16,
        fontWeight: '900',
        color: COLORS.accent,
    },
    percentageLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: COLORS.accent,
        textTransform: 'uppercase',
    },
    titleGroup: {
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.accent,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.darkGray,
        fontWeight: '500',
    },
    list: {
        gap: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    itemCategory: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.accent,
    },
    itemAmount: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.accent,
    },
    overflowContainer: {
        marginTop: 16,
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#FFD54F',
    },
    overflowBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF8F00',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 4,
    },
    overflowBadgeText: {
        color: COLORS.white,
        fontSize: 8,
        fontWeight: '900',
        marginLeft: 4,
    },
    overflowText: {
        fontSize: 11,
        color: COLORS.accent,
        lineHeight: 14,
        fontWeight: '500',
    },
    bold: {
        fontWeight: '800',
    }
});
