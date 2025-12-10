// src/screens/HomeScreen.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';
import { transactionItemStyles } from '../styles/transactionItemStyles';
import { calculateMonthlyStats } from '../utils/financeUtils';

export type Screen =
  | 'Login'
  | 'Home'
  | 'AddTransaction'
  | 'SignUp'
  | 'Onboarding'
  | 'Chatbot'
  | 'Expenses'
  | 'Savings'
  | 'AddMoney'
  | 'SavedAdvice'
  | 'Profile';

type HomeScreenProps = {
  onNavigate: (screen: Screen) => void;
  transactions: Array<any>;
  userName: string;
  allocatedSavingsTarget: number;
};

export const HomeScreen = ({
  onNavigate,
  transactions,
  userName,
  allocatedSavingsTarget,
}: HomeScreenProps) => {
  // Calculate all budget data using financeUtils
  const budgetData = calculateMonthlyStats(transactions, { allocatedSavingsTarget });
  
  const {
    income,
    budget,
    totals
  } = budgetData;

  const newMonthlyIncome = income.fresh;
  const allMonthlyIncome = income.total;
  const needsTotal = budget.needs.spent;
  const wantsTotal = budget.wants.spent;
  const totalExpenses = totals.totalExpenses;
  const actualSavings20Percent = budget.savings20.saved;
  const monthlySavedLeftover = budget.leftover.saved;
  const allMonthlySavings = totals.savedThisMonth;
  const cumulativeTotalSavings = totals.savedAllTime;
  const needsTarget = budget.needs.target;
  const wantsTarget = budget.wants.target;
  const savingsTarget20Percent = budget.savings20.target;
  const remainingToSave20Percent = budget.savings20.pending;
  const pendingLeftoverToSave = budget.leftover.pending;
  const totalPendingToSave = remainingToSave20Percent + pendingLeftoverToSave;
  const currentBalance = totals.walletBalance;
  const displayBalance = totals.displayBalance;

  // --- Mini Budget Bar Component ---
  type MiniBudgetCategoryProps = {
    name: string;
    spent: number;
    total: number;
    color: string;
  };
  const MiniBudgetCategory: React.FC<MiniBudgetCategoryProps> = ({
    name,
    spent,
    total,
    color,
  }) => (
    <View style={homeStyles.miniBudgetCategory}>
      <View style={homeStyles.miniBudgetHeader}>
        <Text style={homeStyles.miniBudgetName}>{name}</Text>
        <Text style={homeStyles.miniBudgetAmount}>
          RM {spent.toFixed(0)} / {total.toFixed(0)}
        </Text>
      </View>
      <View style={homeStyles.miniProgressBarBackground}>
        <View
          style={[
            homeStyles.miniProgressBar,
            {
              width: `${Math.max(0, Math.min((spent / (total || 1)) * 100, 100))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );

  const filteredTransactions = transactions.filter(t => {
    if (t.type === 'income' && t.isCarriedOver) {
      return false;
    }
    return true;
  });

  const recentTransactions = filteredTransactions.slice(0, 3);
  const hasMoreTransactions = filteredTransactions.length > 3;

  return (
    <SafeAreaView
      style={homeStyles.container}
      edges={['right', 'bottom', 'left']}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.accent} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* --- Header --- */}
        <View style={homeStyles.header}>
          <View>
            <Text style={homeStyles.greeting}>Hello, {userName}!</Text>
            <Text style={homeStyles.headerDate}>Welcome back to Beruang</Text>
          </View>
          <TouchableOpacity>
            <Icon name="bell" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* --- Balance Card --- */}
        <View style={homeStyles.balanceCard}>
          <Text style={homeStyles.balanceLabel}>Total Balance</Text>
          <Text style={homeStyles.balanceAmount}>
            RM {displayBalance.toFixed(2)}
          </Text>
          <View style={homeStyles.incomeExpenseContainer}>
            <View style={homeStyles.incomeExpenseBox}>
              <Icon name="arrow-down" size={20} color={COLORS.success} />
              <View style={{ marginLeft: 8 }}>
                <Text style={homeStyles.incomeExpenseLabel}>Income</Text>
                <Text style={homeStyles.incomeExpenseAmount}>
                  RM {newMonthlyIncome.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={homeStyles.incomeExpenseBox}>
              <Icon name="arrow-up" size={20} color={COLORS.danger} />
              <View style={{ marginLeft: 8 }}>
                <Text style={homeStyles.incomeExpenseLabel}>Expense</Text>
                <Text style={homeStyles.incomeExpenseAmount}>
                  RM {totalExpenses.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* --- Action Bar --- */}
        <View style={homeStyles.section}>
          <View style={homeStyles.actionBar}>
            <TouchableOpacity
              style={homeStyles.actionButton}
              onPress={() => onNavigate('AddMoney')}
            >
              <View style={homeStyles.iconCircle}>
                <Icon name="plus" size={24} color={COLORS.white} />
              </View>
              <Text style={homeStyles.actionText}>Add money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={homeStyles.actionButton}
              onPress={() => onNavigate('AddTransaction')}
            >
              <View style={homeStyles.iconCircle}>
                <Icon name="plus-circle" size={24} color={COLORS.white} />
              </View>
              <Text style={homeStyles.actionText}>Add Transaction</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={homeStyles.actionButton}
              onPress={() => onNavigate('SavedAdvice')}
            >
              <View style={homeStyles.iconCircle}>
                <Icon name="bookmark" size={24} color={COLORS.white} />
              </View>
              <Text style={homeStyles.actionText}>Saved Advice</Text>
            </TouchableOpacity>
          </View>

          {/* --- Savings & Budget Section --- */}
          <View style={homeStyles.splitBoxContainer}>
            {/* Left Box: Savings */}
            <TouchableOpacity 
              style={[homeStyles.splitBox, homeStyles.splitBoxLeft]}
              onPress={() => onNavigate('Savings')}
            >
              <Text style={homeStyles.splitBoxTitle}>Total Savings</Text>
              <Text style={homeStyles.splitBoxAmountSmall}>
                RM {cumulativeTotalSavings.toFixed(2)}
              </Text>

              {totalPendingToSave > 0 && (
                <Text style={homeStyles.pendingText}>
                  To Save: RM {totalPendingToSave.toFixed(2)}
                </Text>
              )}

              <View style={{ flex: 1 }} /> 
              <Text style={homeStyles.splitBoxLink}>View Graph</Text>
            </TouchableOpacity>
            
            {/* Right Box: Budget Breakdown */}
            <View style={[homeStyles.splitBox, homeStyles.splitBoxRight]}>
              <Text style={homeStyles.splitBoxTitle}>Budget Breakdown</Text>
              <MiniBudgetCategory
                name="Needs (50%)"
                spent={needsTotal}
                total={needsTarget}
                color="#42a5f5"
              />
              <MiniBudgetCategory
                name="Wants (30%)"
                spent={wantsTotal}
                total={wantsTarget}
                color="#ff7043"
              />
              <MiniBudgetCategory
                name="Savings (20%)"
                spent={actualSavings20Percent}
                total={savingsTarget20Percent}
                color="#66bb6a"
              />
            </View>
          </View>
        </View>
        
        {/* --- Recent Transactions --- */}
        <View style={homeStyles.section}>
          <Text style={homeStyles.sectionTitle}>Recent Transactions</Text>

          {recentTransactions.length > 0 ? (
            recentTransactions
              .map((item) => (
                <View key={item.id} style={transactionItemStyles.transactionItem}>
                  <View
                    style={[
                      transactionItemStyles.transactionIcon,
                      { backgroundColor: COLORS.primary },
                    ]}
                  >
                    <Icon name={item.icon} size={22} color={COLORS.accent} />
                  </View>
                  <View style={transactionItemStyles.transactionDetails}>
                    <Text style={transactionItemStyles.transactionName}>{item.name}</Text>

                    <Text style={transactionItemStyles.transactionDate}>
                      {new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      • {item.subCategory}
                    </Text>
                  </View>
                  <Text
                    style={[
                      transactionItemStyles.transactionAmount,
                      {
                        color:
                          item.type === 'income' ? COLORS.success : 
                          (item.amount < 0 ? COLORS.danger : COLORS.accent),
                      },
                    ]}
                  >
                    {item.type === 'income' ? '+' : (item.amount > 0 ? '-' : '')} RM {Math.abs(item.amount).toFixed(2)}
                  </Text>
                </View>
              ))
          ) : (
            <Text style={homeStyles.noTransactionsText}>No transactions yet.</Text>
          )}
          
          {hasMoreTransactions && (
            <TouchableOpacity 
              style={homeStyles.viewMoreButton}
              onPress={() => onNavigate('Expenses')}
            >
              <Text style={homeStyles.viewMoreText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* --- Bottom Tab Navigator --- */}
      <View style={homeStyles.bottomNav}>
        <TouchableOpacity
          style={homeStyles.navItem}
          onPress={() => onNavigate('Home')}
        >
          <Icon name="home" size={26} color={COLORS.accent} />
          <Text style={homeStyles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={homeStyles.navItem}
          onPress={() => onNavigate('Expenses')}
        >
          <Icon name="pie-chart" size={26} color={COLORS.darkGray} />
          <Text style={homeStyles.navText}>Expenses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={homeStyles.navItem}
          onPress={() => onNavigate('Chatbot')}
        >
          <Icon name="message-square" size={26} color={COLORS.darkGray} />
          <Text style={homeStyles.navText}>Chatbot</Text>
        </TouchableOpacity>
        {/* --- MODIFIED: onPress now navigates to 'Profile' --- */}
        <TouchableOpacity style={homeStyles.navItem} onPress={() => onNavigate('Profile')}>
          <Icon name="user" size={26} color={COLORS.darkGray} />
          <Text style={homeStyles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Styles for HomeScreen ---
const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingTop: 75,
    paddingBottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerDate: {
    fontSize: 14,
    color: COLORS.primary,
  },
  balanceCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -40,
    elevation: 5,
  },
  balanceLabel: {
    color: COLORS.primary,
    fontSize: 16,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  incomeExpenseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  incomeExpenseBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeExpenseLabel: {
    color: COLORS.primary,
    fontSize: 14,
  },
  incomeExpenseAmount: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 15, 
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  viewMoreButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  noTransactionsText: {
    textAlign: 'center',
    color: COLORS.darkGray,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  splitBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  splitBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    height: 190,
  },
  splitBoxLeft: {
    marginRight: 10,
    flexDirection: 'column',
  },
  splitBoxRight: {
    marginLeft: 10,
  },
  splitBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
  },
  splitBoxAmountSmall: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 10,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.info,
    marginTop: -5,
    marginBottom: 5,
  },
  splitBoxLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginTop: 'auto',
  },
  miniBudgetCategory: {
    marginBottom: 12,
  },
  miniBudgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  miniBudgetName: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },
  miniBudgetAmount: {
    fontSize: 9,
    color: COLORS.darkGray,
  },
  miniProgressBarBackground: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 10,
    height: 65,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    marginBottom: 20,
    borderRadius: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 4,
    fontWeight: '500',
  },
});