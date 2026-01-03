import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../../constants/colors';

interface DailyTransactionItem {
    n: string;      // name
    a: number;      // amount (positive = income, negative = expense)
    type: 'income' | 'expense';
    cat?: string;   // category (for expenses)
}

interface DailyTransactionsData {
    t: 'd';
    date: string;
    items: DailyTransactionItem[];
    net: number;
}

export const DailyTransactionsWidget: React.FC<{ data: DailyTransactionsData }> = ({ data }) => {
    const formatAmount = (amount: number) => {
        const absAmount = Math.abs(amount);
        const prefix = amount >= 0 ? '+' : '-';
        return `${prefix}RM ${absAmount.toFixed(2)}`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Icon name="calendar" size={18} color={COLORS.accent} />
                <Text style={styles.dateText}>{data.date}</Text>
            </View>

            {/* Items */}
            <View style={styles.itemsContainer}>
                {data.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <View style={styles.itemLeft}>
                            <View style={[
                                styles.iconContainer,
                                { backgroundColor: item.type === 'income' ? '#E8F5E9' : '#FFF3E0' }
                            ]}>
                                <Icon
                                    name={item.type === 'income' ? 'trending-up' : 'shopping-bag'}
                                    size={14}
                                    color={item.type === 'income' ? '#4CAF50' : '#FF9800'}
                                />
                            </View>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName} numberOfLines={1}>{item.n}</Text>
                                {item.cat && <Text style={styles.itemCategory}>{item.cat}</Text>}
                            </View>
                        </View>
                        <Text style={[
                            styles.itemAmount,
                            { color: item.type === 'income' ? '#4CAF50' : '#EF5350' }
                        ]}>
                            {formatAmount(item.a)}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Net */}
            <View style={styles.netContainer}>
                <Text style={styles.netLabel}>Net</Text>
                <Text style={[
                    styles.netAmount,
                    { color: data.net >= 0 ? '#4CAF50' : '#EF5350' }
                ]}>
                    {formatAmount(data.net)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.accent,
        marginLeft: 8,
    },
    itemsContainer: {
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemDetails: {
        marginLeft: 12,
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.accent,
    },
    itemCategory: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 2,
    },
    itemAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    netContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    netLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9E9E9E',
    },
    netAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
});
