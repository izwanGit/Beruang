// src/components/BudgetExceededModal.tsx
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

type BudgetExceededModalProps = {
    visible: boolean;
    onClose: () => void;
    budgetStatus: {
        needsRemaining: number;
        wantsRemaining: number;
        savingsUnsaved: number;
        transactionAmount: number;
    };
};

export const BudgetExceededModal: React.FC<BudgetExceededModalProps> = ({
    visible,
    onClose,
    budgetStatus,
}) => {
    const { needsRemaining, wantsRemaining, savingsUnsaved, transactionAmount } = budgetStatus;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Icon name="alert-triangle" size={32} color={COLORS.white} />
                        </View>
                        <Text style={styles.title}>Budget Exhausted!</Text>
                        <Text style={styles.subtitle}>
                            You've used up all your available budget for this month.
                        </Text>
                    </View>

                    {/* Budget Status */}
                    <View style={styles.statusCard}>
                        <Text style={styles.statusTitle}>CURRENT BUDGET STATUS</Text>

                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Needs (50%)</Text>
                            <Text style={[styles.statusValue, needsRemaining <= 0 && styles.exhausted]}>
                                {needsRemaining <= 0 ? 'FULL' : `RM ${needsRemaining.toFixed(2)}`}
                            </Text>
                        </View>

                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Wants (30%)</Text>
                            <Text style={[styles.statusValue, wantsRemaining <= 0 && styles.exhausted]}>
                                {wantsRemaining <= 0 ? 'FULL' : `RM ${wantsRemaining.toFixed(2)}`}
                            </Text>
                        </View>

                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Savings Buffer (20%)</Text>
                            <Text style={[styles.statusValue, savingsUnsaved <= 0 && styles.exhausted]}>
                                {savingsUnsaved <= 0 ? 'USED' : `RM ${savingsUnsaved.toFixed(2)}`}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Transaction Amount</Text>
                            <Text style={styles.transactionAmount}>RM {transactionAmount.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Message */}
                    <View style={styles.messageBox}>
                        <Icon name="info" size={16} color={COLORS.accent} />
                        <Text style={styles.messageText}>
                            Consider waiting until next month's income, or review your expenses to free up budget.
                        </Text>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>I Understand</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: COLORS.white,
        borderRadius: 28,
        padding: 28,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E74C3C',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.accent,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.darkGray,
        textAlign: 'center',
        lineHeight: 20,
    },
    statusCard: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 20,
        padding: 20,
        width: '100%',
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.darkGray,
        letterSpacing: 1.2,
        marginBottom: 16,
        textAlign: 'center',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.accent,
    },
    statusValue: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
    },
    exhausted: {
        color: '#E74C3C',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '900',
        color: '#E74C3C',
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.primary + '15',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        gap: 10,
    },
    messageText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.accent,
        lineHeight: 18,
    },
    closeButton: {
        backgroundColor: COLORS.accent,
        borderRadius: 25,
        paddingVertical: 14,
        paddingHorizontal: 40,
        width: '100%',
        alignItems: 'center',
    },
    closeButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '800',
    },
});
