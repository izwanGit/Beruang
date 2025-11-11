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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';

type SavingsScreenProps = {
  onBack: () => void;
  transactions: Array<any>;
  onAddTransaction: (transaction: any | any[]) => void; // MODIFIED: Can accept array
  allocatedSavingsTarget: number;
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
  }, [visible, saveType, monthlyBalance, remainingToSave20Percent, remainingToSaveLeftover, hasLeftoverGoal]);

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
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Add to Savings</Text>
          <Text style={modalStyles.label}>Amount to Save</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="e.g., 50.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={handleSetAmount}
          />
          <Text style={modalStyles.balanceInfo}>
            {balanceLabel} RM {currentMaxAmount.toFixed(2)}
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
                  Leftover Goal
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {error ? <Text style={modalStyles.errorText}>{error}</Text> : null}

          <View style={modalStyles.buttonRow}>
            <TouchableOpacity style={[modalStyles.button, modalStyles.cancelButton, {flex: 1}]} onPress={handleClose}>
              <Text style={[modalStyles.buttonText, modalStyles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.button, modalStyles.confirmButton, {flex: 1}]} onPress={handleSubmit}>
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
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSetAmount = (text: string) => {
    if (text === '') {
      setAmount('');
      setError('');
      return;
    }
    const num = parseFloat(text);
    if (isNaN(num)) {
      setAmount(text);
      return;
    }
    if (num > totalSaved) {
      setError(`Amount cannot exceed your total savings of RM ${totalSaved.toFixed(2)}`);
    } else {
      setError('');
    }
    setAmount(text);
  };

  const handleSubmit = (type: 'budget' | 'emergency') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (numAmount > totalSaved) {
      setError(`Amount cannot exceed your total savings of RM ${totalSaved.toFixed(2)}`);
      return;
    }
    onSubmit(numAmount, type);
    handleClose();
  };

  const handleClose = () => {
    setAmount('');
    setError('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <Text style={modalStyles.title}>Withdraw Savings</Text>
          <Text style={modalStyles.label}>Amount to Withdraw</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="e.g., 100.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={handleSetAmount}
          />
          <Text style={modalStyles.balanceInfo}>
            Total Saved: RM {totalSaved.toFixed(2)}
          </Text>

          {error ? <Text style={modalStyles.errorText}>{error}</Text> : null}

          <Text style={modalStyles.label}>Withdrawal Option</Text>
          
          <TouchableOpacity style={[modalStyles.optionButton, {backgroundColor: COLORS.info}]} onPress={() => handleSubmit('budget')}>
            <Icon name="arrow-right-circle" size={20} color={COLORS.white} style={{marginRight: 10}}/>
            <View>
              <Text style={modalStyles.optionTitle}>Move to Budget</Text>
              <Text style={modalStyles.optionSubtitle}>Adds to monthly income (50/30/20 rule)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[modalStyles.optionButton, {backgroundColor: COLORS.danger}]} onPress={() => handleSubmit('emergency')}>
            <Icon name="alert-triangle" size={20} color={COLORS.white} style={{marginRight: 10}}/>
            <View>
              <Text style={modalStyles.optionTitle}>Emergency Withdraw</Text>
              <Text style={modalStyles.optionSubtitle}>Removes money from savings permanently</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={[modalStyles.button, modalStyles.cancelButton, {marginTop: 20, marginRight: 0}]} onPress={handleClose}>
            <Text style={[modalStyles.buttonText, modalStyles.cancelButtonText]}>Cancel</Text>
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
  allocatedSavingsTarget,
}: SavingsScreenProps) => {
  // --- STATE ---
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // --- CALCULATIONS ---
  const getMonthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentDate = new Date();
  const currentMonthKey = getMonthKey(currentDate.toISOString().split('T')[0]);

  // *New* income (for 20% target)
  const monthlyIncome = transactions
    .filter(
      (t) =>
        t.type === 'income' &&
        getMonthKey(t.date) === currentMonthKey &&
        !t.isCarriedOver
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // All expense transactions for the month
  const monthlyExpenses = transactions.filter(
    (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
  );

  // *Positive* 20% savings
  const monthlySaved20Percent = monthlyExpenses
    .filter(
      (t) => t.category === 'savings' && t.name === 'Monthly Savings'
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // *Positive* leftover savings
  const monthlySavedLeftover = monthlyExpenses
    .filter(
      (t) => t.category === 'savings' && t.name === 'Saving Leftover Balance'
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Total *positive* savings this month
  const totalMonthlySaved = monthlySaved20Percent + monthlySavedLeftover;

  // Total *all-time* savings (includes negative withdrawals)
  const totalSavedAllTime = transactions
    .filter((t) => t.type === 'expense' && t.category === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  // 20% target
  const targetSavings20Percent = monthlyIncome * 0.2;
  const remainingToSave20Percent = Math.max(
    0,
    targetSavings20Percent - monthlySaved20Percent
  );

  // Leftover target
  const remainingToSaveLeftover = Math.max(
    0,
    allocatedSavingsTarget - monthlySavedLeftover
  );

  // *All* income this month (for balance calc)
  const allMonthlyIncome = transactions
    .filter((t) => t.type === 'income' && getMonthKey(t.date) === currentMonthKey)
    .reduce((sum, t) => sum + t.amount, 0);

  // *All* spendable expenses (Needs + Wants)
  const allSpendableExpenses = monthlyExpenses
    .filter(t => t.category === 'needs' || t.category === 'wants')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Available balance = All Income - (Needs + Wants) - (Positive Savings)
  const monthlyBalance = allMonthlyIncome - allSpendableExpenses - totalMonthlySaved;

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
  
  const chartLabels = sortedSavingsTx
    .map(t => {
      const m = getMonthKey(t.date);
      return `${parseInt(m.split('-')[1], 10)}/${m.split('-')[0].slice(2)}`;
    })
    .filter((value, index, self) => self.indexOf(value) === index); // Unique labels

  const chartDataPoints = chartLabels.map(label => {
    let lastCumulativeAmount = 0;
    for(let i = sortedSavingsTx.length - 1; i >= 0; i--) {
      const t = sortedSavingsTx[i];
      const tLabel = `${parseInt(getMonthKey(t.date).split('-')[1], 10)}/${getMonthKey(t.date).split('-')[0].slice(2)}`;
      if (tLabel === label) {
        lastCumulativeAmount = cumulativeChartData[i];
        break;
      }
    }
    return lastCumulativeAmount;
  });


  const savingsPercentage20 =
    targetSavings20Percent > 0
      ? (monthlySaved20Percent / targetSavings20Percent) * 100
      : 0;

  // --- HANDLERS ---

  const handleSaveSubmit = (amount: number, type: '20_percent' | 'leftover') => {
    const transactionName =
      type === '20_percent' ? 'Monthly Savings' : 'Saving Leftover Balance';

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
        isCarriedOver: false, // --- THIS IS KEY: It counts as new income ---
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
      
      // --- MODIFIED: Pass as an array ---
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

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* --- Modals --- */}
        <SaveModal
          visible={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSubmit={handleSaveSubmit}
          monthlyBalance={monthlyBalance}
          hasLeftoverGoal={allocatedSavingsTarget > 0}
          remainingToSave20Percent={remainingToSave20Percent}
          remainingToSaveLeftover={remainingToSaveLeftover}
        />
        <WithdrawModal
          visible={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          onSubmit={handleWithdrawSubmit}
          totalSaved={totalSavedAllTime}
        />

        {/* Header (Unchanged) */}
        <View style={styles.header}>
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
        >
          {/* Hero Card (Primary color) */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Saved (All Time)</Text>
            <Text style={styles.heroAmount}>
              RM {totalSavedAllTime.toFixed(2)}
            </Text>
            <TouchableOpacity
              style={styles.heroWithdrawButton}
              onPress={() => setShowWithdrawModal(true)}
            >
              <Text style={styles.heroWithdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* --- SINGLE summary card --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Month Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monthly Income:</Text>
                <Text style={styles.summaryValue}>
                  RM {monthlyIncome.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Target Savings (20%):</Text>
                <Text style={styles.summaryValue}>
                  RM {targetSavings20Percent.toFixed(2)}
                </Text>
              </View>
              {allocatedSavingsTarget > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Leftover Balance Target:
                  </Text>
                  <Text style={[styles.summaryValue, { color: COLORS.info }]}>
                    RM {allocatedSavingsTarget.toFixed(2)}
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Saved (This Month):</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  RM {totalMonthlySaved.toFixed(2)}
                </Text>
              </View>

              {/* Progress Bar (tracks the 20% goal) */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(savingsPercentage20, 100)}%`,
                        backgroundColor: COLORS.success,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {savingsPercentage20.toFixed(0)}% of 20% target
                </Text>
              </View>

              {/* --- Combined Remaining Section --- */}
              <View style={styles.remainingContainer}>
                <View style={styles.remainingRow}>
                  <Text style={styles.remainingLabel}>Remaining (20% Goal):</Text>
                  <Text style={styles.remainingValue}>
                    RM {remainingToSave20Percent.toFixed(2)}
                  </Text>
                </View>
                {allocatedSavingsTarget > 0 && (
                  <View style={styles.remainingRow}>
                    <Text style={styles.remainingLabel}>
                      Remaining (Leftover):
                    </Text>
                    <Text style={[styles.remainingValue, { color: COLORS.info }]}>
                      RM {remainingToSaveLeftover.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* --- Single "Add to Savings" Button --- */}
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: COLORS.success },
                monthlyBalance <= 0 && styles.addButtonDisabled,
              ]}
              onPress={() => setShowSaveModal(true)}
              disabled={monthlyBalance <= 0}
            >
              <Icon
                name="plus-circle"
                size={20}
                color={COLORS.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addButtonText}>Add to Savings</Text>
            </TouchableOpacity>
            {monthlyBalance <= 0 && (
              <Text style={styles.disabledButtonText}>
                You have no available balance to save.
              </Text>
            )}
          </View>

          {/* Savings Graph */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cumulative Savings History</Text>
            {chartReady ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: chartLabels,
                    datasets: [{ data: chartDataPoints }],
                  }}
                  width={screenWidth - 60}
                  height={220}
                  yAxisLabel="RM "
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: COLORS.white,
                    backgroundGradientFrom: COLORS.white,
                    backgroundGradientTo: COLORS.white,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // COLORS.success
                    labelColor: (opacity = 1) =>
                      `rgba(102, 90, 72, ${opacity})`, // COLORS.accent
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: COLORS.success,
                      fill: COLORS.white,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: COLORS.lightGray,
                      strokeWidth: 1,
                    },
                  }}
                  bezier
                  style={styles.chartStyle}
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
      </SafeAreaView>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  heroLabel: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 5,
  },
  heroWithdrawButton: {
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heroWithdrawText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: COLORS.darkGray,
  },
  summaryValue: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
  },
  progressContainer: {
    marginVertical: 15,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 5,
    textAlign: 'right',
  },
  remainingContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 15,
    marginTop: 10,
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  remainingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  remainingValue: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
  },
  addButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    textAlign: 'center',
    color: COLORS.darkGray,
    fontSize: 12,
    marginTop: 5,
  },
  addButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartStyle: {
    borderRadius: 10,
  },
  noDataCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataText: {
    textAlign: 'center',
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
  noDataSubtext: {
    textAlign: 'center',
    color: COLORS.darkGray,
    fontSize: 14,
    marginTop: 5,
  },
});

// --- STYLES FOR MODALS ---
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.accent,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  balanceInfo: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'left',
    marginTop: 5,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  toggleActive: {
    backgroundColor: COLORS.accent,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    marginRight: 10,
  },
  cancelButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: COLORS.success,
    marginLeft: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  optionButton: {
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
  },
});

