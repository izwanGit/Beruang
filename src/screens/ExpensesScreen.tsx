// src/screens/ExpensesScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { DonutChart } from '../components/DonutChart';
import { transactionItemStyles } from '../styles/transactionItemStyles';
import { Screen } from './HomeScreen'; // Import Screen type

type ExpensesScreenProps = {
  onBack: () => void;
  transactions: Array<any>;
  onNavigate: (screen: Screen) => void;
  onAskAI: (message: string) => void;
};

const categoryIcons = {
  'Financial Services': { icon: 'calculator', color: COLORS.danger },
  'Food & Beverage': { icon: 'silverware-fork-knife', color: '#FF69B4' },
  Transportation: { icon: 'train', color: '#9370DB' },
  Telecommunication: { icon: 'phone', color: '#4169E1' },
  Entertainment: { icon: 'filmstrip', color: '#FFA500' },
  Shopping: { icon: 'shopping', color: '#32CD32' },
  Others: { icon: 'dots-horizontal', color: COLORS.darkGray },
};

const categoryColors = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#C9CBCF',
];

const getSubCategoryGroups = (expenseList: Array<any>) => {
  const spendableExpenses = expenseList.filter(
    (t) => t.category === 'needs' || t.category === 'wants' || t.category === 'others'
  );
  
  return spendableExpenses.reduce((acc, t) => {
    if (!acc[t.subCategory]) {
      acc[t.subCategory] = { amount: 0, count: 0 };
    }
    acc[t.subCategory].amount += t.amount;
    acc[t.subCategory].count += 1;
    return acc;
  }, {});
};

export const ExpensesScreen = ({
  onBack,
  transactions,
  onNavigate,
  onAskAI,
}: ExpensesScreenProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState('latest');

  const currentDate = new Date();
  const monthNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];

  const months = [];
  const currentMonth = currentDate.getMonth();
  for (let i = 4; i >= 0; i--) {
    const m = (currentMonth - i + 12) % 12;
    months.push({ label: monthNames[m], value: m + 1 });
  }

  const currentYear = currentDate.getFullYear();

  const allMonthlyTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();
    return txMonth === selectedMonth && txYear === currentYear;
  });

  const latestTransactions = allMonthlyTransactions.filter((t) => {
    if (t.type === 'expense' && (t.category === 'needs' || t.category === 'wants' || t.category === 'others')) {
      return true;
    }
    if (t.type === 'income' && !t.isCarriedOver) {
      return true;
    }
    return false;
  });

  const expenses = allMonthlyTransactions.filter(
    (t) => t.type === 'expense' && (t.category === 'needs' || t.category === 'wants' || t.category === 'others')
  );
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const incomeForMonth = allMonthlyTransactions
    .filter((t) => t.type === 'income' && !t.isCarriedOver)
    .reduce((sum, t) => sum + t.amount, 0);

  const needsExpenses = expenses.filter((t) => t.category === 'needs');
  const wantsExpenses = expenses.filter((t) => t.category === 'wants');

  const needsForMonth = needsExpenses.reduce((sum, t) => sum + t.amount, 0);
  const wantsForMonth = wantsExpenses.reduce((sum, t) => sum + t.amount, 0);

  const needsBudget = incomeForMonth * 0.5;
  const wantsBudget = incomeForMonth * 0.3;

  let chartData;
  let totalForChart;
  let subCategoryGroups;

  if (activeTab === 'needs') {
    subCategoryGroups = getSubCategoryGroups(needsExpenses);
    totalForChart = needsForMonth;
  } else if (activeTab === 'wants') {
    subCategoryGroups = getSubCategoryGroups(wantsExpenses);
    totalForChart = wantsForMonth;
  } else {
    subCategoryGroups = getSubCategoryGroups(expenses);
    totalForChart = totalExpenses;
  }

  chartData = Object.entries(subCategoryGroups).map(
    ([sub, { amount }], index) => ({
      name: sub,
      population: amount,
      color: categoryColors[index % categoryColors.length],
    }),
  );

  const colorMap: Record<string, string> = chartData.reduce((acc, slice) => {
    acc[slice.name] = slice.color;
    return acc;
  }, {} as Record<string, string>);

  const handleAskAI = () => {
    const monthName = monthNames[selectedMonth - 1];
    let context = `I'm looking at my expenses for ${monthName}. `;

    if (activeTab === 'needs') {
      context += `My total 'Needs' spending is RM ${totalForChart.toFixed(2)}. `;
    } else if (activeTab === 'wants') {
      context += `My total 'Wants' spending is RM ${totalForChart.toFixed(2)}. `;
    } else {
      context += `My total spending is RM ${totalForChart.toFixed(2)}. `;
    }

    if (chartData.length > 0) {
      context += "Here's the breakdown by category: ";
      const breakdown = chartData
        .map(
          (item) =>
            `${item.name}: RM ${item.population.toFixed(2)}`
        )
        .join(', ');
      context += breakdown + '. ';
    } else {
      context += 'There are no expenses in this view. ';
    }

    const message = `${context}Can you give me some advice or insights based on this?`;
    
    onAskAI(message);
  };

  const BudgetCategoryView: React.FC<{
    title: string;
    spent: number;
    total: number;
    color: string;
  }> = ({ title, spent, total, color }) => {
    const spentPercentage = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
    const remaining = total - spent;

    return (
      <View style={expensesStyles.budgetCategory}>
        <View style={expensesStyles.budgetCategoryHeader}>
          <Text style={expensesStyles.budgetCategoryName}>{title}</Text>
          <Text style={expensesStyles.budgetCategoryAmount}>
            RM {spent.toFixed(2)} / RM {total.toFixed(2)}
          </Text>
        </View>
        <View style={expensesStyles.progressBarBackground}>
          <View
            style={[
              expensesStyles.progressBar,
              {
                width: `${spentPercentage}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
        <View style={expensesStyles.budgetRemainingContainer}>
          <Text style={expensesStyles.budgetRemainingText}>
            {remaining >= 0 ? 'Remaining:' : 'Overspent:'}
          </Text>
          <Text
            style={[
              expensesStyles.budgetRemainingAmount,
              { color: remaining >= 0 ? COLORS.success : COLORS.danger },
            ]}
          >
            RM {Math.abs(remaining).toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={expensesStyles.container}>
      <SafeAreaView style={expensesStyles.safeAreaContent} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={expensesStyles.header}>
          <TouchableOpacity onPress={onBack} style={expensesStyles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={expensesStyles.headerTitle}>Expenses</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={expensesStyles.scrollContainer}>
          {/* Month Tabs */}
          <View style={expensesStyles.monthTabs}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  expensesStyles.monthTab,
                  selectedMonth === month.value && expensesStyles.activeMonthTab,
                ]}
                onPress={() => setSelectedMonth(month.value)}
              >
                <Text
                  style={[
                    expensesStyles.monthText,
                    selectedMonth === month.value && expensesStyles.activeMonthText,
                  ]}
                >
                  {month.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* --- CHART CONTAINER --- */}
          <View style={expensesStyles.chartContainer}>
            <DonutChart data={chartData} total={totalForChart} />
            <TouchableOpacity onPress={handleAskAI} style={expensesStyles.aiChartButton}>
              <MaterialCommunityIcon name="robot-outline" size={24} color={COLORS.accent} />
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll */}
          {totalForChart > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={expensesStyles.categoriesScroll}
            >
              {Object.entries(subCategoryGroups).map(([sub, { amount }]) => {
                const { icon } = categoryIcons[sub] || { icon: 'dots-horizontal' };
                const color = colorMap[sub] || categoryIcons[sub]?.color || COLORS.darkGray;
                
                return (
                  <View key={sub} style={expensesStyles.categoryItem}>
                    <View
                      style={[
                        expensesStyles.categoryIcon,
                        { backgroundColor: color + '33' },
                      ]}
                    >
                      <MaterialCommunityIcon name={icon} size={24} color={color} />
                    </View>
                    <Text style={expensesStyles.categoryName}>{sub}</Text>
                    <Text style={expensesStyles.categoryAmount}>
                      -RM {amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Tabs: Latest, Needs, Wants */}
          <View style={expensesStyles.tabContainer}>
            <TouchableOpacity
              style={[
                expensesStyles.tab,
                activeTab === 'latest' && expensesStyles.activeTab,
              ]}
              onPress={() => setActiveTab('latest')}
            >
              <Text
                style={[
                  expensesStyles.tabText,
                  activeTab === 'latest' && expensesStyles.activeTabText,
                ]}
              >
                Latest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                expensesStyles.tab,
                activeTab === 'needs' && expensesStyles.activeTab,
              ]}
              onPress={() => setActiveTab('needs')}
            >
              <Text
                style={[
                  expensesStyles.tabText,
                  activeTab === 'needs' && expensesStyles.activeTabText,
                ]}
              >
                Needs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                expensesStyles.tab,
                activeTab === 'wants' && expensesStyles.activeTab,
              ]}
              onPress={() => setActiveTab('wants')}
            >
              <Text
                style={[
                  expensesStyles.tabText,
                  activeTab === 'wants' && expensesStyles.activeTabText,
                ]}
              >
                Wants
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'latest' ? (
            <View>
              {latestTransactions.length > 0 ? (
                latestTransactions
                  .slice()
                  .reverse()
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
                              item.type === 'income'
                                ? COLORS.success
                                : COLORS.danger,
                          },
                        ]}
                      >
                        {item.type === 'income' ? '+' : '-'} RM{' '}
                        {item.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={expensesStyles.merchantsText}>
                  No spendable transactions for {monthNames[selectedMonth - 1]}.
                </Text>
              )}
            </View>
          ) : activeTab === 'needs' ? (
            <View style={expensesStyles.budgetContainer}>
              {incomeForMonth > 0 ? (
                <BudgetCategoryView
                  title="Needs (50%)"
                  spent={needsForMonth}
                  total={needsBudget}
                  color="#42a5f5"
                />
              ) : (
                <Text style={expensesStyles.merchantsText}>
                  No new income recorded for {monthNames[selectedMonth - 1]} to calculate budget.
                </Text>
              )}
            </View>
          ) : ( // activeTab === 'wants'
            <View style={expensesStyles.budgetContainer}>
              {incomeForMonth > 0 ? (
                <BudgetCategoryView
                  title="Wants (30%)"
                  spent={wantsForMonth}
                  total={wantsBudget}
                  color="#ff7043"
                />
              ) : (
                <Text style={expensesStyles.merchantsText}>
                  No new income recorded for {monthNames[selectedMonth - 1]} to calculate budget.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Tab Navigator */}
      <SafeAreaView style={expensesStyles.bottomNavSafeArea} edges={['bottom']}>
        <View style={expensesStyles.bottomNav}>
          <TouchableOpacity
            style={expensesStyles.navItem}
            onPress={() => onNavigate('Home')}
          >
            <Icon name="home" size={26} color={COLORS.darkGray} />
            <Text style={expensesStyles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={expensesStyles.navItem}
            onPress={() => onNavigate('Expenses')}
          >
            <Icon name="pie-chart" size={26} color={COLORS.accent} />
            <Text style={expensesStyles.navTextActive}>Expenses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={expensesStyles.navItem}
            onPress={() => onNavigate('Chatbot')}
          >
            <Icon name="message-square" size={26} color={COLORS.darkGray} />
            <Text style={expensesStyles.navText}>Chatbot</Text>
          </TouchableOpacity>
          {/* --- MODIFIED: Link to Profile --- */}
          <TouchableOpacity style={expensesStyles.navItem} onPress={() => onNavigate('Profile')}>
            <Icon name="user" size={26} color={COLORS.darkGray} />
            <Text style={expensesStyles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// --- Styles for ExpensesScreen ---
const expensesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeAreaContent: {
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
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  monthTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  monthTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeMonthTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  monthText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  activeMonthText: {
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiChartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: 5,
  },
  categoryAmount: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: 'bold',
  },
  merchantsText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  budgetContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 10,
  },
  budgetCategory: {
    marginBottom: 15,
  },
  budgetCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetCategoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  budgetCategoryAmount: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  budgetRemainingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  budgetRemainingText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginRight: 8,
  },
  budgetRemainingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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

