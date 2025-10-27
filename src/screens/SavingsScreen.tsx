// src/screens/SavingsScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/colors';

type SavingsScreenProps = {
  onBack: () => void;
  transactions: Array<any>;
  onAddTransaction: (transaction: any) => void;
};

export const SavingsScreen = ({
  onBack,
  transactions,
  onAddTransaction,
}: SavingsScreenProps) => {
  const getMonthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentDate = new Date();
  const currentMonthKey = getMonthKey(currentDate.toISOString().split('T')[0]);

  // --- Monthly Calculations ---
  const monthlyIncome = transactions
    .filter((t) => t.type === 'income' && getMonthKey(t.date) === currentMonthKey)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions.filter(
    (t) => t.type === 'expense' && getMonthKey(t.date) === currentMonthKey
  );

  const monthlySaved = monthlyExpenses
    .filter((t) => t.category === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  const targetSavings = monthlyIncome * 0.2;
  const remainingToSave = Math.max(0, targetSavings - monthlySaved);
  const monthlyTotalExpenses = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
  const monthlyBalance = monthlyIncome - monthlyTotalExpenses;

  // --- All-Time Savings Calculation ---
  const allSavingsTransactions = transactions.filter(
    (t) => t.type === 'expense' && t.category === 'savings'
  );

  const totalSavedAllTime = allSavingsTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // --- Graph Data (Cumulative) ---
  const savingsByMonth = allSavingsTransactions.reduce(
    (acc: { [key: string]: number }, t) => {
      const key = getMonthKey(t.date);
      acc[key] = (acc[key] || 0) + t.amount;
      return acc;
    },
    {}
  );

  const months = Object.keys(savingsByMonth).sort();

  // Create cumulative data for the chart
  let cumulativeTotal = 0;
  const chartData = months.map((key) => {
    cumulativeTotal += savingsByMonth[key];
    return cumulativeTotal;
  });

  const handleAddSaving = () => {
    if (remainingToSave <= 0) {
      Alert.alert(
        'Target Met',
        'You have already met your 20% savings target for this month.'
      );
      return;
    }

    const amountToSave = Math.min(remainingToSave, Math.max(0, monthlyBalance));
    if (amountToSave <= 0) {
      Alert.alert(
        'Insufficient Balance',
        'You do not have enough balance to save.'
      );
      return;
    }

    const newTransaction = {
      id: Date.now().toString(),
      icon: 'dollar-sign',
      name: 'Monthly Savings',
      date: currentDate.toISOString().split('T')[0],
      amount: amountToSave,
      type: 'expense',
      category: 'savings',
      subCategory: 'Savings',
    };

    onAddTransaction(newTransaction);
    Alert.alert(
      'Savings Added',
      `RM ${amountToSave.toFixed(2)} has been added to your savings.`
    );
  };

  const screenWidth = Dimensions.get('window').width;
  const chartLabels = months.map(
    (m) => `${parseInt(m.split('-')[1], 10)}/${m.split('-')[0].slice(2)}`
  );

  const savingsPercentage =
    targetSavings > 0 ? (monthlySaved / targetSavings) * 100 : 0;

  return (
    // --- MODIFIED: Page background color reverted ---
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

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
            <Text style={styles.heroAmount}>RM {totalSavedAllTime.toFixed(2)}</Text>
            {/* Withdraw Button */}
            <TouchableOpacity
              style={styles.heroWithdrawButton}
              onPress={() => Alert.alert('Coming Soon', 'Withdraw feature is under development.')}
            >
              <Text style={styles.heroWithdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* Current Month Summary */}
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
                  RM {targetSavings.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Saved (This Month):</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  RM {monthlySaved.toFixed(2)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(savingsPercentage, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {savingsPercentage.toFixed(0)}% of monthly target
                </Text>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  {
                    borderTopWidth: 1,
                    borderTopColor: COLORS.lightGray,
                    paddingTop: 15,
                    marginTop: 10,
                    marginBottom: 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.summaryLabel,
                    {
                      fontSize: 16,
                      fontWeight: '600',
                      color: COLORS.accent,
                    },
                  ]}
                >
                  Remaining to Save:
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { fontSize: 16, color: COLORS.accent },
                  ]}
                >
                  RM {remainingToSave.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Smaller "Save" Button */}
            <TouchableOpacity
              style={[
                styles.addButton,
                (remainingToSave <= 0 || monthlyBalance <= 0) &&
                  styles.addButtonDisabled,
              ]}
              onPress={handleAddSaving}
              disabled={remainingToSave <= 0 || monthlyBalance <= 0}
            >
              <Icon
                name="plus-circle"
                size={20}
                color={COLORS.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addButtonText}>Save Remaining Amount</Text>
            </TouchableOpacity>
          </View>

          {/* Savings Graph */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cumulative Savings History</Text>
            {months.length > 0 ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: chartLabels,
                    datasets: [{ data: chartData }],
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
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(102, 90, 72, ${opacity})`,
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
  // --- MODIFIED: Page background reverted to white ---
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.white, // Reverted
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white, // Reverted
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.white, // Reverted
  },

  // Header styles (Unchanged)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },

  // Hero Card Styles (Unchanged from last step)
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
    marginTop: 10,
  },
  heroWithdrawText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    opacity: 0.7,
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
    // --- MODIFIED: Removed border ---
    // borderWidth: 1,
    // borderColor: COLORS.lightGray,
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
    backgroundColor: COLORS.lightGray, // --- MODIFIED: Reverted ---
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 5,
    textAlign: 'right',
  },
  // Smaller button (Unchanged from last step)
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexDirection: 'row',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.accent,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
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
    // --- MODIFIED: Removed border ---
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
    // --- MODIFIED: Removed border ---
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