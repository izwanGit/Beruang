// src/screens/ExpensesScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { DonutChart } from '../components/DonutChart';
import { transactionItemStyles } from '../styles/transactionItemStyles';
import { Screen } from './HomeScreen';
import { Transaction } from '../../App';

type ExpensesScreenProps = {
  onBack: () => void;
  transactions: Array<Transaction>;
  onNavigate: (screen: Screen) => void;
  onAskAI: (message: string) => void;
  onUpdateTransaction: (transactionId: string, updatedData: Partial<Transaction>) => Promise<void>;
  onDeleteTransaction: (transactionId: string) => Promise<void>;
};

type SortOption = 'dateDesc' | 'dateAsc' | 'amountHigh' | 'amountLow';

const categoryIcons: Record<string, { icon: string; color: string }> = {
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

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const ExpensesScreen = ({
  onBack,
  transactions,
  onNavigate,
  onAskAI,
  onUpdateTransaction,
  onDeleteTransaction,
}: ExpensesScreenProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState('latest');
  const [sortOption, setSortOption] = useState<SortOption>('dateDesc');
  const [searchQuery, setSearchQuery] = useState('');

  // --- EDIT MODAL STATE ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<'needs' | 'wants' | 'savings' | 'income'>('needs');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- ANIMATION REFS ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const sortSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

  // --- SORTING LOGIC ---
  const getSortedTransactions = (list: Transaction[]) => {
    return [...list].sort((a, b) => {
      switch (sortOption) {
        case 'dateAsc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amountHigh':
          return b.amount - a.amount;
        case 'amountLow':
          return a.amount - b.amount;
        case 'dateDesc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
  };

  // --- FILTER TRANSACTIONS ---
  const latestTransactions = allMonthlyTransactions.filter((t) => {
    // Show normal expenses
    if (t.type === 'expense' && (t.category === 'needs' || t.category === 'wants' || t.category === 'others')) {
      return true;
    }
    // Show ALL Income (But we will hide 'Carried Over' in the render loop)
    if (t.type === 'income') {
      return true;
    }
    return false;
  });

  const expenses = allMonthlyTransactions.filter(
    (t) => t.type === 'expense' && (t.category === 'needs' || t.category === 'wants' || t.category === 'others')
  );

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  // --- BUDGET LOGIC ---
  const totalIncomeForMonth = allMonthlyTransactions
    .filter((t) => t.type === 'income' && t.isCarriedOver !== true)
    .reduce((sum, t) => sum + t.amount, 0);

  const needsBudget = totalIncomeForMonth * 0.5;
  const wantsBudget = totalIncomeForMonth * 0.3;

  const needsExpenses = expenses.filter((t) => t.category === 'needs');
  const wantsExpenses = expenses.filter((t) => t.category === 'wants');
  const needsForMonth = needsExpenses.reduce((sum, t) => sum + t.amount, 0);
  const wantsForMonth = wantsExpenses.reduce((sum, t) => sum + t.amount, 0);

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

  // --- MODAL HELPERS ---
  const animateModal = (visible: boolean, slideVal: Animated.Value) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 300 : 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideVal, {
        toValue: visible ? 0 : SCREEN_HEIGHT,
        bounciness: 5,
        useNativeDriver: true,
      })
    ]).start();
  };

  // --- EDIT MODAL ---
  const openEditModal = (transaction: Transaction) => {
    if (transaction.category === 'savings' && transaction.isCarriedOver) {
      Alert.alert("System Transaction", "This carried-over savings allocation cannot be edited here.");
      return;
    }
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.name);
    const cat = transaction.category;
    if (cat === 'needs' || cat === 'wants' || cat === 'savings' || cat === 'income') {
      setEditCategory(cat);
    } else {
      setEditCategory('wants');
    }
    setEditSubCategory(transaction.subCategory || 'Others');
    setIsEditModalVisible(true);
    animateModal(true, slideAnim);
  };

  const closeEditModal = (callback?: () => void) => {
    Keyboard.dismiss();
    animateModal(false, slideAnim);
    setTimeout(() => {
      setIsEditModalVisible(false);
      if (callback) callback();
    }, 250);
  };

  const openSortModal = () => {
    setIsSortModalVisible(true);
    animateModal(true, sortSlideAnim);
  };

  const closeSortModal = () => {
    animateModal(false, sortSlideAnim);
    setTimeout(() => {
      setIsSortModalVisible(false);
    }, 250);
  };

  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    closeSortModal();
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction || isSaving) return;
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
      return;
    }
    if (!editDescription.trim()) {
      Alert.alert('Invalid Description', 'Please enter a description.');
      return;
    }
    const transactionId = editingTransaction.id;
    const updatedData = {
      amount: amountNum,
      name: editDescription,
      category: editCategory,
      subCategory: editSubCategory,
    };
    setIsSaving(true);
    closeEditModal(async () => {
      try {
        await onUpdateTransaction(transactionId, updatedData);
      } catch (error) {
        console.error('Save failed:', error);
        Alert.alert('Error', 'Failed to update transaction. Please try again.');
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleDelete = () => {
    if (!editingTransaction || isSaving) return;
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsSaving(true);
            closeEditModal(async () => {
              try {
                await onDeleteTransaction(editingTransaction.id);
              } catch (error) {
                console.error('Delete failed:', error);
                Alert.alert('Error', 'Failed to delete transaction. Please try again.');
              } finally {
                setIsSaving(false);
              }
            });
          },
        },
      ]
    );
  };

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
    onAskAI(`${context}Can you give me some advice or insights based on this?`);
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

  const renderTransactionsList = (txList: Transaction[]) => {
    // Filter out "Carried Over" from the visual list
    const visualList = txList.filter(t => t.subCategory !== 'Carried Over');

    if (!visualList || visualList.length === 0) {
      return (
        <Text style={expensesStyles.merchantsText}>
          No transactions found for {monthNames[selectedMonth - 1]}.
        </Text>
      );
    }
    const lowerSearch = searchQuery.toLowerCase().trim();
    let filteredList = visualList;
    if (lowerSearch) {
      filteredList = visualList.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(lowerSearch);
        const subCatMatch = t.subCategory?.toLowerCase().includes(lowerSearch) || false;
        const catMatch = t.category.toLowerCase().includes(lowerSearch);
        const amountMatch = t.amount.toString().includes(lowerSearch);
        return nameMatch || subCatMatch || catMatch || amountMatch;
      });
    }
    const sortedList = getSortedTransactions(filteredList);
    if (sortedList.length === 0) {
      return (
        <Text style={expensesStyles.merchantsText}>
          No transactions match your search.
        </Text>
      );
    }
    return sortedList.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={transactionItemStyles.transactionItem}
        onPress={() => openEditModal(item)}
        activeOpacity={0.7}
      >
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
        <View style={{ alignItems: 'flex-end' }}>
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
          <Icon name="edit-2" size={12} color={COLORS.darkGray} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    ));
  };

  const renderSubCategorySelector = () => {
    const subCategories = Object.keys(categoryIcons);
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={expensesStyles.chipScrollView}>
        {subCategories.map((subCat) => (
          <TouchableOpacity
            key={subCat}
            style={[
              expensesStyles.chip,
              editSubCategory === subCat && expensesStyles.chipActive
            ]}
            onPress={() => setEditSubCategory(subCat)}
            disabled={isSaving}
          >
            <MaterialCommunityIcon
              name={categoryIcons[subCat].icon}
              size={16}
              color={editSubCategory === subCat ? COLORS.white : COLORS.darkGray}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              expensesStyles.chipText,
              editSubCategory === subCat && expensesStyles.chipTextActive
            ]}>
              {subCat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderTransactionHeader = () => (
    <View style={expensesStyles.transactionHeader}>
      <Text style={expensesStyles.transactionsTitle}>Transactions</Text>
      <TextInput
        style={expensesStyles.searchInput}
        placeholder="Search..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={expensesStyles.sortButton} onPress={openSortModal}>
        <Icon name="filter" size={18} color={COLORS.accent} />
        <Text style={expensesStyles.sortButtonText}>Sort</Text>
      </TouchableOpacity>
    </View>
  );

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
              {renderTransactionHeader()}
              {renderTransactionsList(latestTransactions)}
            </View>
          ) : activeTab === 'needs' ? (
            <View>
              <View style={expensesStyles.budgetContainer}>
                {/* ★★★ FIXED: Using totalIncomeForMonth ★★★ */}
                {totalIncomeForMonth > 0 ? (
                  <BudgetCategoryView
                    title="Needs (50%)"
                    spent={needsForMonth}
                    total={needsBudget}
                    color="#42a5f5"
                  />
                ) : (
                  <Text style={expensesStyles.merchantsText}>
                    No income recorded for {monthNames[selectedMonth - 1]} to calculate budget.
                  </Text>
                )}
              </View>
              {renderTransactionHeader()}
              {renderTransactionsList(needsExpenses)}
            </View>
          ) : ( // activeTab === 'wants'
            <View>
              <View style={expensesStyles.budgetContainer}>
                {/* ★★★ FIXED: Using totalIncomeForMonth ★★★ */}
                {totalIncomeForMonth > 0 ? (
                  <BudgetCategoryView
                    title="Wants (30%)"
                    spent={wantsForMonth}
                    total={wantsBudget}
                    color="#ff7043"
                  />
                ) : (
                  <Text style={expensesStyles.merchantsText}>
                    No income recorded for {monthNames[selectedMonth - 1]} to calculate budget.
                  </Text>
                )}
              </View>
              {renderTransactionHeader()}
              {renderTransactionsList(wantsExpenses)}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Nav */}
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
          <TouchableOpacity style={expensesStyles.navItem} onPress={() => onNavigate('Profile')}>
            <Icon name="user" size={26} color={COLORS.darkGray} />
            <Text style={expensesStyles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* --- EDIT MODAL --- */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => closeEditModal()}
      >
        <View style={expensesStyles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => closeEditModal()} disabled={isSaving}>
            <Animated.View style={[expensesStyles.backdrop, { opacity: fadeAnim }]} />
          </TouchableWithoutFeedback>
          <Animated.View style={[expensesStyles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={expensesStyles.modalHeader}>
                  <View style={expensesStyles.modalHandle} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <Text style={expensesStyles.modalTitle}>Edit Transaction</Text>
                    <TouchableOpacity onPress={() => closeEditModal()} style={expensesStyles.closeButton} disabled={isSaving}>
                      <Icon name="x" size={22} color={COLORS.darkGray} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={expensesStyles.formContainer}>
                  <View style={expensesStyles.inputGroup}>
                    <Text style={expensesStyles.inputLabel}>DESCRIPTION</Text>
                    <TextInput
                      style={expensesStyles.textInput}
                      value={editDescription}
                      onChangeText={setEditDescription}
                      placeholder="e.g. Lunch"
                      placeholderTextColor={COLORS.darkGray}
                      editable={!isSaving}
                    />
                  </View>
                  <View style={expensesStyles.inputGroup}>
                    <Text style={expensesStyles.inputLabel}>AMOUNT (RM)</Text>
                    <TextInput
                      style={expensesStyles.textInput}
                      value={editAmount}
                      onChangeText={setEditAmount}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={COLORS.darkGray}
                      editable={!isSaving}
                    />
                  </View>
                  {editingTransaction?.type === 'expense' && (
                    <View style={expensesStyles.inputGroup}>
                      <Text style={expensesStyles.inputLabel}>CATEGORY TYPE</Text>
                      <View style={expensesStyles.segmentedControl}>
                        <TouchableOpacity
                          style={[expensesStyles.segmentBtn, editCategory === 'needs' && expensesStyles.segmentBtnActive]}
                          onPress={() => setEditCategory('needs')}
                          activeOpacity={0.8}
                          disabled={isSaving}
                        >
                          <Text style={[expensesStyles.segmentText, editCategory === 'needs' && expensesStyles.segmentTextActive]}>Needs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[expensesStyles.segmentBtn, editCategory === 'wants' && expensesStyles.segmentBtnActive]}
                          onPress={() => setEditCategory('wants')}
                          activeOpacity={0.8}
                          disabled={isSaving}
                        >
                          <Text style={[expensesStyles.segmentText, editCategory === 'wants' && expensesStyles.segmentTextActive]}>Wants</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {editingTransaction?.type === 'expense' && (
                    <View style={expensesStyles.inputGroup}>
                      <Text style={expensesStyles.inputLabel}>SUBCATEGORY</Text>
                      {renderSubCategorySelector()}
                    </View>
                  )}
                </View>
              </ScrollView>
              <View style={expensesStyles.actionButtons}>
                <TouchableOpacity style={expensesStyles.deleteButton} onPress={handleDelete} disabled={isSaving} activeOpacity={isSaving ? 1 : 0.7}>
                  {isSaving ? <ActivityIndicator color={COLORS.danger} /> : <Icon name="trash-2" size={20} color={COLORS.danger} />}
                </TouchableOpacity>
                <TouchableOpacity style={[expensesStyles.saveButton, isSaving && { opacity: 0.7 }]} onPress={handleSaveEdit} disabled={isSaving}>
                  <Text style={expensesStyles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* --- SORT MODAL --- */}
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeSortModal}
      >
        <View style={expensesStyles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeSortModal}>
            <Animated.View style={[expensesStyles.backdrop, { opacity: fadeAnim }]} />
          </TouchableWithoutFeedback>

          <Animated.View style={[expensesStyles.modalContent, { transform: [{ translateY: sortSlideAnim }] }]}>
            <View style={expensesStyles.modalHeader}>
              <View style={expensesStyles.modalHandle} />
              <Text style={[expensesStyles.modalTitle, { textAlign: 'center', marginTop: 10 }]}>Sort By</Text>
            </View>

            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={[expensesStyles.sortOption, sortOption === 'dateDesc' && expensesStyles.sortOptionActive]}
                onPress={() => handleSortSelect('dateDesc')}
              >
                <Text style={[expensesStyles.sortOptionText, sortOption === 'dateDesc' && expensesStyles.sortOptionTextActive]}>Date (Newest First)</Text>
                {sortOption === 'dateDesc' && <Icon name="check" size={20} color={COLORS.accent} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[expensesStyles.sortOption, sortOption === 'dateAsc' && expensesStyles.sortOptionActive]}
                onPress={() => handleSortSelect('dateAsc')}
              >
                <Text style={[expensesStyles.sortOptionText, sortOption === 'dateAsc' && expensesStyles.sortOptionTextActive]}>Date (Oldest First)</Text>
                {sortOption === 'dateAsc' && <Icon name="check" size={20} color={COLORS.accent} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[expensesStyles.sortOption, sortOption === 'amountHigh' && expensesStyles.sortOptionActive]}
                onPress={() => handleSortSelect('amountHigh')}
              >
                <Text style={[expensesStyles.sortOptionText, sortOption === 'amountHigh' && expensesStyles.sortOptionTextActive]}>Highest Amount</Text>
                {sortOption === 'amountHigh' && <Icon name="check" size={20} color={COLORS.accent} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[expensesStyles.sortOption, sortOption === 'amountLow' && expensesStyles.sortOptionActive]}
                onPress={() => handleSortSelect('amountLow')}
              >
                <Text style={[expensesStyles.sortOptionText, sortOption === 'amountLow' && expensesStyles.sortOptionTextActive]}>Lowest Amount</Text>
                {sortOption === 'amountLow' && <Icon name="check" size={20} color={COLORS.accent} />}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortButtonText: {
    marginLeft: 6,
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
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
  // --- UPDATED MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 25,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  modalHeader: {
    marginBottom: 25,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.lightGray,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  closeButton: {
    padding: 5,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  // Segmented Control Styles
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F5',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  // Chip Styles
  chipScrollView: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  // Button Styles
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 52,
    height: 52,
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  deleteButtonText: {
    display: 'none',
  },
  // Sort Modal Styles
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  sortOptionActive: {
    backgroundColor: '#E9F7EF',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  sortOptionText: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  // Transaction Header Styles
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
});