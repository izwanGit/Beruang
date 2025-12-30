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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { transactionItemStyles } from '../styles/transactionItemStyles';
import { calculateMonthlyStats } from '../utils/financeUtils';
import { calculateLevel } from '../utils/gamificationUtils';
import { BEAR_AVATARS, isBearAvatar } from '../constants/avatars';

const categoryIcons: Record<string, { icon: string; color: string }> = {
  'Financial Services': { icon: 'bank', color: COLORS.accent },
  'Food & Beverage': { icon: 'silverware-fork-knife', color: COLORS.accent },
  Transportation: { icon: 'car', color: COLORS.accent },
  Telecommunication: { icon: 'wifi', color: COLORS.accent },
  Entertainment: { icon: 'popcorn', color: COLORS.accent },
  Shopping: { icon: 'shopping', color: COLORS.accent },
  Others: { icon: 'dots-horizontal', color: COLORS.accent },
};

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
  userAvatar: string;
  userXP: number;
  allocatedSavingsTarget: number;
};

export const HomeScreen = ({
  onNavigate,
  transactions,
  userName,
  userAvatar,
  userXP,
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
  const needsTotal = budget.needs.spent;
  const wantsTotal = budget.wants.spent;
  const totalExpenses = totals.totalExpenses;
  const actualSavings20Percent = budget.savings20.saved;
  const cumulativeTotalSavings = totals.savedAllTime;
  const needsTarget = budget.needs.target;
  const wantsTarget = budget.wants.target;
  const savingsTarget20Percent = budget.savings20.target;
  const remainingToSave20Percent = budget.savings20.pending;
  const pendingLeftoverToSave = budget.leftover.pending;
  const totalPendingToSave = remainingToSave20Percent + pendingLeftoverToSave;
  const displayBalance = totals.displayBalance;
  const level = calculateLevel(userXP);

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

  const handleVerifyPress = () => {
    Alert.alert(
      "Verified Account 🛡️",
      "Your financial records are secured with Beruang's 256-bit encryption. Your data is for your eyes only."
    );
  };

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <View style={homeStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.accent} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* --- Header --- */}
        <View style={homeStyles.header}>
          <View>
            <Text style={homeStyles.greeting}>Hello, {userName}!</Text>
            <Text style={homeStyles.headerDate}>Welcome back to Beruang</Text>
          </View>
          <TouchableOpacity
            style={homeStyles.avatarContainer}
            onPress={() => onNavigate('Profile')}
          >
            <View style={homeStyles.avatarRing}>
              {isBearAvatar(userAvatar) ? (
                <Image source={BEAR_AVATARS[userAvatar]} style={homeStyles.avatarImage} />
              ) : (
                <MaterialCommunityIcon name={userAvatar as any || 'account'} size={28} color={COLORS.white} />
              )}
            </View>
            <View style={homeStyles.levelBadge}>
              <Text style={homeStyles.levelBadgeText}>{level}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* --- Balance Card --- */}
        <View style={homeStyles.balanceCard}>
          <View style={homeStyles.balanceHeader}>
            <Text style={homeStyles.balanceLabel}>{currentMonthName} Balance</Text>
            <TouchableOpacity onPress={handleVerifyPress}>
              <MaterialCommunityIcon name="shield-check-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={homeStyles.balanceAmount}>
            RM {displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <View style={homeStyles.incomeExpenseContainer}>
            <View style={homeStyles.incomeExpenseBox}>
              <Icon name="arrow-up" size={20} color={COLORS.success} />
              <View style={{ marginLeft: 8 }}>
                <Text style={homeStyles.incomeExpenseLabel}>Income</Text>
                <Text style={homeStyles.incomeExpenseAmount}>
                  RM {newMonthlyIncome.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={homeStyles.incomeExpenseBox}>
              <Icon name="arrow-down" size={20} color={COLORS.danger} />
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
                <Icon name="plus" size={18} color={COLORS.white} />
              </View>
              <Text style={homeStyles.actionText}>Add money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={homeStyles.actionButton}
              onPress={() => onNavigate('AddTransaction')}
            >
              <View style={homeStyles.iconCircle}>
                <Icon name="plus-circle" size={18} color={COLORS.white} />
              </View>
              <Text style={homeStyles.actionText}>Add Transaction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={homeStyles.actionButton}
              onPress={() => onNavigate('SavedAdvice')}
            >
              <View style={homeStyles.iconCircle}>
                <Icon name="bookmark" size={18} color={COLORS.white} />
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
                RM {cumulativeTotalSavings.toLocaleString()}
              </Text>

              {totalPendingToSave > 0 && (
                <Text style={[homeStyles.pendingText, { color: COLORS.info }]}>
                  To Save: RM {totalPendingToSave.toFixed(2)}
                </Text>
              )}

              <View style={{ flex: 1 }} />
              <Text style={homeStyles.splitBoxLink}>Check Progress →</Text>
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
              .map((item) => {
                const subCat = item.subCategory || 'Others';
                const iconInfo = categoryIcons[subCat] || categoryIcons['Others'];

                return (
                  <View key={item.id} style={homeStyles.transactionCard}>
                    <View style={homeStyles.transactionMainContent}>
                      <View style={homeStyles.transactionIconContainer}>
                        <MaterialCommunityIcon
                          name={iconInfo.icon}
                          size={22}
                          color={COLORS.accent}
                        />
                      </View>
                      <View style={homeStyles.transactionDetails}>
                        <Text style={homeStyles.transactionName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={homeStyles.transactionMeta}>
                          {subCat} • {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                      <Text
                        style={[
                          homeStyles.transactionAmountDisplay,
                          { color: item.type === 'income' ? COLORS.success : COLORS.accent },
                        ]}
                      >
                        {item.type === 'income' ? '+' : '-'}RM{Math.abs(item.amount).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })
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
      <SafeAreaView style={homeStyles.bottomNavSafeArea} edges={['bottom']}>
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
          <TouchableOpacity style={homeStyles.navItem} onPress={() => onNavigate('Profile')}>
            <Icon name="user" size={26} color={COLORS.darkGray} />
            <Text style={homeStyles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// --- Styles for HomeScreen ---
const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingTop: 65,
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
  avatarContainer: {
    position: 'relative',
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.yellow,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  balanceCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
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
  iconIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.primary, // Sage Green Background
    paddingVertical: 12,
    marginBottom: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18, // Perfect circle
    backgroundColor: COLORS.accent, // Dark Brown Circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '700',
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    height: 190,
  },
  splitBoxLeft: {
    marginRight: 10,
  },
  splitBoxRight: {
    marginLeft: 10,
  },
  splitBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  splitBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
  },
  splitBoxPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkGray,
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
  noTransactionsText: {
    textAlign: 'center',
    color: COLORS.darkGray,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  viewMoreButton: {
    padding: 15,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: COLORS.primary + '50',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  transactionMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: COLORS.primary,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 8,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  transactionMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  transactionAmountDisplay: {
    fontSize: 15,
    fontWeight: '700',
  },
  bottomNavSafeArea: {
    backgroundColor: COLORS.white,
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
});