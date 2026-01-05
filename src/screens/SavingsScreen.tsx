// src/screens/SavingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';
import { calculateSavingsProgress, calculateMonthlyStats } from '../utils/financeUtils';

type SavingsScreenProps = {
  onBack: () => void;
  transactions: Array<any>;
  onAddTransaction: (transaction: any | any[]) => void;
  refreshing: boolean;
  onRefresh: () => void;
};

// --- MODAL COMPONENTS ---

// --- 1. Save Modal ---
type SaveModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, type: '20_percent' | 'leftover') => void;
  monthlyBalance: number;
  hasLeftoverGoal: boolean;
  remainingToSave20Percent: number;
  remainingToSaveLeftover: number;
};

const SaveModal: React.FC<SaveModalProps> = ({
  visible,
  onClose,
  onSubmit,
  monthlyBalance,
  hasLeftoverGoal,
  remainingToSave20Percent,
  remainingToSaveLeftover,
}) => {
  const [amount, setAmount] = useState('');
  const [saveType, setSaveType] = useState<'20_percent' | 'leftover'>('20_percent');
  const [error, setError] = useState('');
  const [currentMaxAmount, setCurrentMaxAmount] = useState(0);
  const [balanceLabel, setBalanceLabel] = useState('');

  useEffect(() => {
    if (visible) {
      let maxAmount = 0;
      let label = '';
      let defaultType = saveType;

      // If leftover goal exists and 20% is 0, default to leftover
      if (hasLeftoverGoal && remainingToSave20Percent <= 0 && remainingToSaveLeftover > 0) {
        defaultType = 'leftover';
        setSaveType('leftover');
      } else {
        defaultType = '20_percent';
        setSaveType('20_percent');
      }

      if (defaultType === '20_percent') {
        maxAmount = Math.min(monthlyBalance, remainingToSave20Percent);
        label = 'Available for 20% Goal:';
      } else {
        // 'leftover'
        maxAmount = Math.min(monthlyBalance, remainingToSaveLeftover);
        label = 'Available for Leftover Goal:';
      }

      const finalAmount = Math.max(0, maxAmount);
      setCurrentMaxAmount(finalAmount);
      setBalanceLabel(label);
      setAmount(finalAmount > 0 ? finalAmount.toFixed(2) : '');
      setError('');
    }
  }, [visible, monthlyBalance, remainingToSave20Percent, remainingToSaveLeftover, hasLeftoverGoal]);

  const handleSetAmount = (text: string) => {
    const num = parseFloat(text);
    if (text === '') {
      setAmount('');
      setError('');
      return;
    }
    if (isNaN(num)) {
      setAmount(text);
      return;
    }
    if (num > currentMaxAmount) {
      setError(`Amount cannot exceed available balance of RM ${currentMaxAmount.toFixed(2)}`);
    } else {
      setError('');
    }
    setAmount(text);
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (numAmount > currentMaxAmount) {
      setError(`Amount cannot exceed available balance of RM ${currentMaxAmount.toFixed(2)}`);
      return;
    }
    onSubmit(numAmount, saveType);
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    setSaveType('20_percent');
    setCurrentMaxAmount(0);
    setBalanceLabel('');
    onClose();
  };

  useEffect(() => {
    if (!hasLeftoverGoal) {
      setSaveType('20_percent');
    }
  }, [hasLeftoverGoal]);

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Add to Savings</Text>

          <Text style={modalStyles.label}>Amount to Save</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="RM 0.00"
            placeholderTextColor={COLORS.darkGray + '80'}
            keyboardType="numeric"
            value={amount}
            onChangeText={handleSetAmount}
          />
          <Text style={modalStyles.balanceInfo}>
            {balanceLabel} <Text style={{ color: COLORS.accent }}>RM {currentMaxAmount.toFixed(2)}</Text>
          </Text>

          <Text style={modalStyles.label}>Save Towards</Text>
          <View style={modalStyles.toggleContainer}>
            <TouchableOpacity
              style={[
                modalStyles.toggleButton,
                saveType === '20_percent' && modalStyles.toggleActive,
              ]}
              onPress={() => setSaveType('20_percent')}
            >
              <Text style={[
                modalStyles.toggleText,
                saveType === '20_percent' && modalStyles.toggleTextActive
              ]}>
                20% Goal
              </Text>
            </TouchableOpacity>
            {hasLeftoverGoal && (
              <TouchableOpacity
                style={[
                  modalStyles.toggleButton,
                  saveType === 'leftover' && modalStyles.toggleActive,
                ]}
                onPress={() => setSaveType('leftover')}
              >
                <Text style={[
                  modalStyles.toggleText,
                  saveType === 'leftover' && modalStyles.toggleTextActive
                ]}>
                  Leftover
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? <Text style={modalStyles.errorText}>{error}</Text> : null}

          <View style={modalStyles.buttonRow}>
            <TouchableOpacity style={[modalStyles.button, modalStyles.cancelButton]} onPress={handleClose}>
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.button, modalStyles.confirmButton]} onPress={handleSubmit}>
              <Text style={modalStyles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// --- 2. Withdraw Modal ---
type WithdrawModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, type: 'budget' | 'emergency') => void;
  totalSaved: number;
};

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  visible,
  onClose,
  onSubmit,
  totalSaved,
}) => {
  const [amountCents, setAmountCents] = useState(0); // Bank-style: store as cents
  const [error, setError] = useState('');

  // Format cents to currency display (empty when 0)
  const formatCentsToCurrency = (cents: number): string => {
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
  };

  // Handle bank-style input
  const handleAmountChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    const cents = parseInt(numericOnly, 10) || 0;
    const maxCents = Math.round(totalSaved * 100);

    if (cents > maxCents) {
      setError(`Amount cannot exceed RM ${totalSaved.toFixed(2)}`);
      setAmountCents(Math.min(cents, 99999999));
    } else {
      setError('');
      setAmountCents(cents);
    }
  };

  const handleSubmit = (type: 'budget' | 'emergency') => {
    const numAmount = amountCents / 100; // Convert cents to RM
    if (numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (numAmount > totalSaved) {
      setError(`Amount cannot exceed RM ${totalSaved.toFixed(2)}`);
      return;
    }
    onSubmit(numAmount, type);
    handleClose();
  };

  const handleClose = () => {
    setAmountCents(0);
    setError('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Withdraw</Text>

          <Text style={modalStyles.label}>Amount</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="0.00"
            placeholderTextColor={COLORS.darkGray + '80'}
            keyboardType="number-pad"
            value={formatCentsToCurrency(amountCents)}
            onChangeText={handleAmountChange}
          />
          <Text style={modalStyles.balanceInfo}>
            Available: <Text style={{ color: COLORS.accent }}>RM {totalSaved.toFixed(2)}</Text>
          </Text>

          {error ? <Text style={modalStyles.errorText}>{error}</Text> : null}

          <Text style={modalStyles.label}>Method</Text>

          <TouchableOpacity
            style={[modalStyles.optionButton, { backgroundColor: COLORS.info }]}
            onPress={() => handleSubmit('budget')}
            activeOpacity={0.8}
          >
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, marginRight: 14 }}>
              <Icon name="arrow-right-circle" size={20} color={COLORS.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.optionTitle}>Move to Budget</Text>
              <Text style={modalStyles.optionSubtitle}>Add to this month's spending pool</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[modalStyles.optionButton, { backgroundColor: COLORS.accent }]}
            onPress={() => handleSubmit('emergency')}
            activeOpacity={0.8}
          >
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12, marginRight: 14 }}>
              <Icon name="alert-triangle" size={20} color={COLORS.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.optionTitle}>Direct Withdraw</Text>
              <Text style={modalStyles.optionSubtitle}>Withdraw as cash (bypasses budget)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginTop: 16,
              paddingVertical: 16,
              borderRadius: 20,
              backgroundColor: '#F8F9FA',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleClose}
          >
            <Text style={{ color: '#665A48', fontWeight: '800', fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- Main Savings Screen ---

export const SavingsScreen = ({
  onBack,
  transactions,
  onAddTransaction,
  refreshing,
  onRefresh,
}: SavingsScreenProps) => {
  // --- STATE ---
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // --- CALCULATIONS USING FINANCE UTILS ---
  const savingsData = calculateSavingsProgress(transactions);
  const { target: derivedTarget } = calculateMonthlyStats(transactions).budget.leftover;

  const {
    monthlyIncome,
    targetSavings20Percent,
    monthlySaved20Percent,
    monthlySavedLeftover,
    totalMonthlySaved,
    totalSavedAllTime,
    remainingToSave20Percent,
    remainingToSaveLeftover,
    savingsPercentage20,
    monthlyBalance,
  } = savingsData;

  const hasLeftoverGoal = derivedTarget > 0;

  // --- Chart Data ---
  const allSavingsTransactions = transactions.filter(
    (t) => t.type === 'expense' && t.category === 'savings'
  );

  const sortedSavingsTx = allSavingsTransactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let cumulativeTotal = 0;
  const cumulativeChartData = sortedSavingsTx.map(t => {
    cumulativeTotal += t.amount;
    return cumulativeTotal;
  });

  const getMonthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const chartLabels = sortedSavingsTx.map(t => {
    const d = new Date(t.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const chartDataPoints = cumulativeChartData;

  // --- HANDLERS ---

  const remainingToSaveTotal = remainingToSave20Percent + (hasLeftoverGoal ? remainingToSaveLeftover : 0);
  const totalMissionTarget = targetSavings20Percent + (hasLeftoverGoal ? derivedTarget : 0);
  const savingsPercentageOverall = totalMissionTarget > 0 ? (totalMonthlySaved / totalMissionTarget) * 100 : 100;

  const handleSaveSubmit = (amount: number, type: '20_percent' | 'leftover') => {
    const transactionName =
      type === '20_percent' ? 'Monthly Savings' : 'Saving Leftover Balance';

    const currentDate = new Date();
    const newTransaction = {
      id: Date.now().toString(),
      icon: 'dollar-sign',
      name: transactionName,
      date: currentDate.toISOString().split('T')[0],
      amount: amount, // Positive amount
      type: 'expense',
      category: 'savings',
      subCategory: 'Savings',
    };

    onAddTransaction(newTransaction);
    Alert.alert(
      'Savings Added',
      `RM ${amount.toFixed(2)} has been added to your savings.`
    );
  };

  const handleWithdrawSubmit = (amount: number, type: 'budget' | 'emergency') => {
    const positiveAmount = amount;
    const negativeAmount = -amount; // Store as negative

    const currentDate = new Date();
    if (type === 'budget') {
      const incomeTx = {
        id: `${Date.now()}-income`,
        icon: 'arrow-right-circle',
        name: 'Transfer from Savings',
        date: currentDate.toISOString().split('T')[0],
        amount: positiveAmount,
        type: 'income',
        category: 'income',
        subCategory: 'Income',
        isCarriedOver: false,
      };
      const expenseTx = {
        id: `${Date.now()}-expense`,
        icon: 'arrow-left-circle',
        name: 'Withdrawal to Budget',
        date: currentDate.toISOString().split('T')[0],
        amount: negativeAmount, // Negative amount
        type: 'expense',
        category: 'savings',
        subCategory: 'Withdrawal',
      };

      onAddTransaction([incomeTx, expenseTx]);

      Alert.alert(
        'Transfer Complete',
        `RM ${positiveAmount.toFixed(2)} has been moved from Savings to your Budget.`
      );

    } else {
      // 'emergency'
      const emergencyTx = {
        id: Date.now().toString(),
        icon: 'alert-triangle',
        name: 'Emergency Withdrawal',
        date: currentDate.toISOString().split('T')[0],
        amount: negativeAmount, // Negative amount
        type: 'expense',
        category: 'savings',
        subCategory: 'Withdrawal',
      };
      onAddTransaction(emergencyTx);
      Alert.alert(
        'Withdrawal Complete',
        `RM ${positiveAmount.toFixed(2)} has been withdrawn from your savings.`
      );
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const chartReady = chartLabels.length > 0 && chartDataPoints.length > 0;

  const insets = useSafeAreaInsets();
  const headerTopPadding = Math.max(insets.top, 20) + 12;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* --- Modals --- */}
        <SaveModal
          visible={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSubmit={handleSaveSubmit}
          monthlyBalance={monthlyBalance}
          hasLeftoverGoal={hasLeftoverGoal}
          remainingToSave20Percent={remainingToSave20Percent}
          remainingToSaveLeftover={remainingToSaveLeftover}
        />
        <WithdrawModal
          visible={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          onSubmit={handleWithdrawSubmit}
          totalSaved={totalSavedAllTime}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: headerTopPadding, height: 60 + headerTopPadding }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Savings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.accent]}
              tintColor={COLORS.accent}
            />
          }
        >
          {/* --- Wealth Cockpit --- */}
          <View style={styles.cockpitCard}>
            <View style={styles.cockpitTop}>
              <View>
                <Text style={styles.cockpitLabel}>Total Savings</Text>
                <Text style={styles.cockpitAmount}>RM {totalSavedAllTime.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={styles.withdrawCircle}
                onPress={() => setShowWithdrawModal(true)}
              >
                <Icon name="log-out" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            </View>

            <View style={styles.missionSummary}>
              <Icon name="info" size={16} color={COLORS.accent} style={{ opacity: 0.6 }} />
              <Text style={styles.missionText}>
                {remainingToSaveTotal <= 0
                  ? "You've hit your saving mission! Great job! 🐻🏆"
                  : `You're RM ${remainingToSaveTotal.toFixed(2)} away from your monthly mission.`}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primarySaveButton,
                (monthlyBalance <= 0 || remainingToSaveTotal <= 0) && styles.saveButtonDisabled
              ]}
              onPress={() => setShowSaveModal(true)}
              disabled={monthlyBalance <= 0 || remainingToSaveTotal <= 0}
            >
              <Icon name="heart" size={20} color={COLORS.white} style={{ marginRight: 10 }} />
              <Text style={styles.primarySaveButtonText}>
                {remainingToSaveTotal <= 0 ? "Mission Complete" : (monthlyBalance <= 0 ? "Saved & Sorted" : "Save Your Balance")}
              </Text>
              {remainingToSaveTotal > 0 && monthlyBalance > 0 && (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>+ RM {monthlyBalance.toFixed(0)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>


          {/* --- Information Section --- */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Goal Breakdown</Text>
                <Text style={styles.sectionSubtitle}>Where your savings come from</Text>
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>Real-time</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '40' }]}>
                    <Icon name="trending-up" size={18} color={COLORS.accent} />
                  </View>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={styles.statValue}>RM {monthlyIncome.toFixed(0)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: COLORS.info + '20' }]}>
                    <Icon name="target" size={18} color={COLORS.info} />
                  </View>
                  <Text style={styles.statLabel}>Target</Text>
                  <Text style={styles.statValue}>RM {(targetSavings20Percent + (hasLeftoverGoal ? derivedTarget : 0)).toFixed(0)}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
                    <Icon name="check-circle" size={18} color={COLORS.success} />
                  </View>
                  <Text style={styles.statLabel}>Saved</Text>
                  <Text style={[styles.statValue, { color: COLORS.success }]}>RM {totalMonthlySaved.toFixed(0)}</Text>
                </View>
              </View>

              <View style={styles.chartAndProgressRow}>
                {/* Progress Circle - DATA VISUALIZATION */}
                <View style={styles.chartCircleWrapper}>
                  <ProgressChart
                    data={{
                      data: [Math.min(savingsPercentageOverall / 100, 1) || 0]
                    }}
                    width={100}
                    height={100}
                    strokeWidth={10}
                    radius={36}
                    chartConfig={{
                      backgroundColor: COLORS.white,
                      backgroundGradientFrom: COLORS.white,
                      backgroundGradientTo: COLORS.white,
                      color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(102, 90, 72, ${opacity})`,
                    }}
                    hideLegend={true}
                  />
                  <View style={styles.chartCenterTextWrapper}>
                    <Text style={styles.chartCenterPercentage}>{savingsPercentageOverall.toFixed(0)}%</Text>
                  </View>
                </View>

                {/* Progress Details */}
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.progressStatus}>Overall Mission Progress</Text>
                  <View style={styles.missionGoalRow}>
                    <Text style={styles.missionGoalLabel}>Saved so far:</Text>
                    <Text style={styles.missionGoalValue}>RM {totalMonthlySaved.toFixed(0)}</Text>
                  </View>
                  <View style={styles.missionGoalRow}>
                    <Text style={styles.missionGoalLabel}>Total Mission:</Text>
                    <Text style={styles.missionGoalValue}>RM {totalMissionTarget.toFixed(0)}</Text>
                  </View>

                  <View style={styles.progressBarWrapper}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.min(savingsPercentageOverall, 100)}%`,
                          backgroundColor: COLORS.success,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* --- Explicit Targets Breakdown or Completion Indicator --- */}
              {remainingToSaveTotal <= 0 ? (
                <View style={styles.completionIndicator}>
                  <Icon name="award" size={24} color={COLORS.success} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completionTitle}>Goal Reached!</Text>
                    <Text style={styles.completionSubtext}>Your future self says thank you! 🐻🏆</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.targetsContainer}>
                  <View style={styles.targetRow}>
                    <View style={styles.targetLabelBox}>
                      <View style={[styles.targetDot, { backgroundColor: COLORS.success }]} />
                      <View>
                        <Text style={styles.targetLabel}>Monthly Target (20%)</Text>
                        <Text style={styles.targetStatusText}>Based on 50/30/20 rule</Text>
                      </View>
                    </View>
                    <Text style={styles.targetValue}>RM {remainingToSave20Percent.toFixed(2)}</Text>
                  </View>

                  {hasLeftoverGoal && (
                    <View style={[styles.targetRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 }]}>
                      <View style={styles.targetLabelBox}>
                        <View style={[styles.targetDot, { backgroundColor: COLORS.info }]} />
                        <View>
                          <Text style={styles.targetLabel}>Unsaved from Last Month</Text>
                          <Text style={styles.targetStatusText}>Carry-over balance</Text>
                        </View>
                      </View>
                      <Text style={[styles.targetValue, { color: COLORS.info }]}>RM {remainingToSaveLeftover.toFixed(2)}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* --- Beruang Guide --- */}
            <View style={styles.adviceCard}>
              <View style={styles.adviceHeader}>
                <Icon name="shield" size={16} color={COLORS.accent} />
                <Text style={styles.adviceTitle}>Why have these targets?</Text>
              </View>
              <Text style={styles.adviceText}>
                Beruang follows the <Text style={{ fontWeight: 'bold' }}>50/30/20 rule</Text>.
                We automatically allocate 20% of your earnings to savings.
                If you don't save it by the end of the month, it carries over to keep you disciplined! 🐻💪
              </Text>
            </View>

            {/* --- Single "Add to Savings" Button (REMOVED FROM BOTTOM) --- */}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cumulative Savings History (RM)</Text>
            {chartReady ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: chartLabels.length > 6 ? chartLabels.map((l, i) => (i % Math.ceil(chartLabels.length / 5) === 0 ? l : '')) : chartLabels,
                    datasets: [{ data: chartDataPoints }],
                  }}
                  width={screenWidth - 64}
                  height={240}
                  yAxisInterval={1}
                  formatYLabel={(value) => {
                    const num = Math.round(parseFloat(value));
                    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                    return `${num}`;
                  }}
                  chartConfig={{
                    backgroundColor: COLORS.white,
                    backgroundGradientFrom: COLORS.white,
                    backgroundGradientTo: COLORS.white,
                    decimalPlaces: 0,
                    color: (opacity = 1) => COLORS.success,
                    labelColor: (opacity = 1) => `rgba(102, 90, 72, ${opacity * 0.9})`,
                    propsForDots: {
                      r: '6',
                      strokeWidth: '3',
                      stroke: COLORS.white,
                      fill: COLORS.success,
                    },
                    propsForBackgroundLines: {
                      strokeWidth: 0.8,
                      stroke: COLORS.primary,
                      strokeDasharray: '5, 5',
                    },
                    fillShadowGradient: COLORS.primary,
                    fillShadowGradientOpacity: 0.2,
                  }}
                  bezier
                  withInnerLines={true}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  style={{
                    marginVertical: 12,
                    borderRadius: 24,
                  }}
                />
              </View>
            ) : (
              <View style={styles.noDataCard}>
                <Icon name="pie-chart" size={48} color={COLORS.darkGray} />
                <Text style={styles.noDataText}>
                  No savings data available yet.
                </Text>
                <Text style={styles.noDataSubtext}>
                  Start saving to see your progress!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
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
  cockpitCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  cockpitTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cockpitLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
    textTransform: 'uppercase',
    opacity: 0.6,
    letterSpacing: 1,
  },
  cockpitAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: -1,
  },
  withdrawCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  missionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginTop: 18,
  },
  missionText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  primarySaveButton: {
    backgroundColor: COLORS.accent,
    height: 58,
    borderRadius: 20,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(102, 90, 72, 0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  primarySaveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  saveBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  saveBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },
  footerInfo: {
    fontSize: 10,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
    opacity: 0.7,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeContainer: {
    backgroundColor: COLORS.primary + '30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accent,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 10,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accent,
    lineHeight: 36,
  },
  progressStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkGray,
    paddingBottom: 4,
  },
  progressBarWrapper: {
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  targetsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  targetValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
  },
  completionIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 0.3,
  },
  completionSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
    marginTop: 2,
    lineHeight: 18,
  },
  targetStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  adviceCard: {
    backgroundColor: '#FAF7F2', // Warm light brown/cream
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.accent + '20',
  },
  chartAndProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartCircleWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenterTextWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenterPercentage: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.success,
  },
  missionGoalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  missionGoalLabel: {
    fontSize: 11,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  missionGoalValue: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '800',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accent,
    marginLeft: 8,
  },
  adviceText: {
    fontSize: 12,
    color: COLORS.accent,
    lineHeight: 18,
    opacity: 0.9,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    height: 60,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.darkGray,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.5,
  },
  disabledButtonText: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  chartStyle: {
    borderRadius: 16,
    paddingRight: 40,
  },
  noDataCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    marginTop: 15,
  },
  noDataSubtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: '500',
  },
});

// --- STYLES FOR MODALS ---
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(102, 90, 72, 0.4)', // Accent color overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    width: '100%',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56,
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  balanceInfo: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'left',
    marginTop: 6,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    padding: 4,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkGray,
  },
  toggleTextActive: {
    color: COLORS.accent,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    flex: 1,
  },
  cancelButtonText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
    flex: 1,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 15,
  },
  optionButton: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.85,
    fontWeight: '500',
    marginTop: 2,
  },
});