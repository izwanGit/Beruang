// src/screens/ExpensesScreen.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  LayoutAnimation,
  UIManager,
  RefreshControl,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { DonutChart } from '../components/DonutChart';
import { transactionItemStyles } from '../styles/transactionItemStyles';
import { Screen } from './HomeScreen';
import { Transaction } from '../../App';
import { calculateMonthlyStats } from '../utils/financeUtils';
import { ReallocateModal } from '../components/ReallocateModal';
import { v4 as uuidv4 } from 'uuid';

type ExpensesScreenProps = {
  onBack: () => void;
  transactions: Array<Transaction>;
  onNavigate: (screen: Screen) => void;
  onAskAI: (message: string) => void;
  onUpdateTransaction: (transactionId: string, updatedData: Partial<Transaction>) => Promise<void>;
  onDeleteTransaction: (transactionId: string) => Promise<void>;
  onDeleteTransactions: (transactionIds: string[]) => Promise<void>;
  onAddTransaction: (transaction: Transaction | Transaction[], showMsg?: boolean) => Promise<void>;
  refreshing: boolean;
  onRefresh: () => void;
};

type SortOption = 'dateDesc' | 'dateAsc' | 'amountHigh' | 'amountLow';

const categoryIcons: Record<string, { icon: string; color: string }> = {
  'Financial Services': { icon: 'bank', color: COLORS.accent },
  'Food & Beverage': { icon: 'silverware-fork-knife', color: COLORS.accent },
  Transportation: { icon: 'car', color: COLORS.accent },
  Telecommunication: { icon: 'wifi', color: COLORS.accent },
  Entertainment: { icon: 'popcorn', color: COLORS.accent },
  Shopping: { icon: 'shopping', color: COLORS.accent },
  Others: { icon: 'dots-horizontal', color: COLORS.accent },
};

const categoryColors = [
  '#FF6384', // Pink
  '#36A2EB', // Blue
  '#FFCE56', // Yellow
  '#4BC0C0', // Teal
  '#9966FF', // Purple
  '#FF9F40', // Orange
  '#FF6384', // Red-ish
  '#C9CBCF', // Silver
  '#4D5360', // Dark Grey
  '#8E44AD', // Amethyst
  '#27AE60', // Nephritis
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
  onDeleteTransactions,
  onAddTransaction,
  refreshing,
  onRefresh,
}: ExpensesScreenProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState('latest');
  const [sortOption, setSortOption] = useState<SortOption>('dateDesc');
  const [searchQuery, setSearchQuery] = useState('');

  // --- EDIT MODAL STATE ---
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmountCents, setEditAmountCents] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<'needs' | 'wants' | 'savings' | 'income'>('needs');
  const [editSubCategory, setEditSubCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- REALLOCATE MODAL STATE ---
  const [isReallocateModalVisible, setIsReallocateModalVisible] = useState(false);
  const [reallocateTotalRemaining, setReallocateTotalRemaining] = useState(0);

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

  const switchTab = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const currentYear = currentDate.getFullYear();
  const allMonthlyTransactions = transactions.filter((t) => {
    const txDate = new Date(t.date);
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();

    // Logic: If selectedMonth is Dec (12) and current actual month is Jan (1),
    // we should look for Dec in (currentYear - 1).
    let targetYear = currentYear;
    if (selectedMonth > currentDate.getMonth() + 1 && currentDate.getMonth() === 0 && selectedMonth >= 10) {
      targetYear = currentYear - 1;
    }

    return txMonth === selectedMonth && txYear === targetYear;
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
    if (t.type === 'expense' && (t.category === 'needs' || t.category === 'wants' || (t.category as string) === 'others')) {
      return true;
    }
    // Show ALL Income (But we will hide 'Carried Over' in the render loop)
    if (t.type === 'income') {
      return true;
    }
    return false;
  });

  const expenses = allMonthlyTransactions.filter(
    (t) => t.type === 'expense' && (t.category === 'needs' || t.category === 'wants' || (t.category as string) === 'others')
  );

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  // --- BUDGET LOGIC (Using centralized financeUtils) ---
  const {
    budget,
    totals
  } = React.useMemo(() => calculateMonthlyStats(allMonthlyTransactions, undefined), [allMonthlyTransactions]);

  const needsBudget = budget.needs.target;
  const wantsBudget = budget.wants.target;
  const needsForMonth = budget.needs.spentRaw; // Use raw for internal calculations if needed
  const wantsForMonth = budget.wants.spentRaw;

  // Use the values directly from financeUtils which has the correct cascade logic
  const isNeedsOverBudget = budget.needs.overflow > 0;
  // Wants is over budget if it has overflow (which accounts for Needs overflow pushing into it)
  const isWantsOverBudget = budget.wants.overflow > 0;

  // For transaction highlighting:
  // If Needs has overflow, that amount reduces the effective budget for Wants
  const needsOverflowAmount = budget.needs.overflow;

  // Needed for chart data and other local logic
  // Needed for chart data and other local logic
  const needsExpenses = expenses.filter((t) => t.category === 'needs');
  const wantsExpenses = expenses.filter((t) => t.category === 'wants');
  const wantsReceivedOverflow = totals.wantsReceivedOverflow;
  const needsReceivedOverflow = totals.needsReceivedOverflow || false;

  // --- CHART DATA PREPARATION ---
  const { chartData, totalForChart, colorMap, subCategoryGroups } = useMemo(() => {
    let subCategoryGroups;
    let total;

    if (activeTab === 'needs') {
      subCategoryGroups = getSubCategoryGroups(needsExpenses);
      total = needsForMonth;
    } else if (activeTab === 'wants') {
      subCategoryGroups = getSubCategoryGroups(wantsExpenses);
      total = wantsForMonth;
    } else {
      subCategoryGroups = getSubCategoryGroups(expenses);
      total = totalExpenses;
    }

    const data = Object.entries(subCategoryGroups).map(
      ([sub, subData]: [string, any], index) => ({
        name: sub,
        population: subData.amount,
        color: categoryColors[index % categoryColors.length],
      }),
    );

    const colors: Record<string, string> = data.reduce((acc, slice) => {
      acc[slice.name] = slice.color;
      return acc;
    }, {} as Record<string, string>);

    return { chartData: data, totalForChart: total, colorMap: colors, subCategoryGroups };
  }, [activeTab, expenses, needsExpenses, wantsExpenses, needsForMonth, wantsForMonth, totalExpenses]);

  // Specific chart data for Needs/Wants tabs (memoized)
  const needsChartData = useMemo(() => {
    const needsSubGroups = getSubCategoryGroups(needsExpenses);
    return Object.entries(needsSubGroups).map(
      ([sub, data]: [string, any], index) => ({
        name: sub,
        population: data.amount,
        color: categoryColors[index % categoryColors.length],
      }),
    );
  }, [needsExpenses]);

  const wantsChartData = useMemo(() => {
    const wantsSubGroups = getSubCategoryGroups(wantsExpenses);
    return Object.entries(wantsSubGroups).map(
      ([sub, data]: [string, any], index) => ({
        name: sub,
        population: data.amount,
        color: categoryColors[index % categoryColors.length],
      }),
    );
  }, [wantsExpenses]);

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

  // Format cents to currency display
  const formatCentsToCurrency = (cents: number): string => {
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
  };

  const handleEditAmountChange = (text: string) => {
    const numericOnly = text.replace(/[^0-9]/g, '');
    const cents = parseInt(numericOnly, 10) || 0;
    setEditAmountCents(Math.min(cents, 99999999));
  };

  // --- EDIT MODAL ---
  const openEditModal = (transaction: Transaction) => {
    if (transaction.category === 'savings' && transaction.isCarriedOver) {
      Alert.alert("System Transaction", "This carried-over savings allocation cannot be edited here.");
      return;
    }
    setEditingTransaction(transaction);
    setEditAmountCents(Math.round(transaction.amount * 100));
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

  const handleOpenReallocate = () => {
    console.log('[DEBUG] handleOpenReallocate called');
    if (!editingTransaction?.allocationId) {
      console.log('[DEBUG] No allocationId on editingTransaction');
      return;
    }

    try {
      // 1. Calculate Remaining Pool (This tx + all future tx of same series)
      const seriesId = editingTransaction.allocationId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // We only want THIS specific transaction + any with a date in the future
      const relatedTransactions = transactions.filter(t =>
        t.allocationId === seriesId &&
        (t.id === editingTransaction.id || new Date(t.date) >= today)
      );

      console.log(`[DEBUG] Found ${relatedTransactions.length} related transactions for pool`);

      // Sum them up safely
      const totalRem = relatedTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      console.log(`[DEBUG] Calculated totalRem: ${totalRem}`);

      setReallocateTotalRemaining(totalRem);

      // Close edit modal first, THEN open reallocate modal in the cleanup callback
      // This prevents React Native from trying to manage two Modal components toggling in the same frame
      closeEditModal(() => {
        console.log('[DEBUG] Callback from closeEditModal: Opening ReallocateModal');
        setIsReallocateModalVisible(true);
      });
    } catch (err) {
      console.error('[ERROR] handleOpenReallocate logic failed:', err);
      Alert.alert('Error', 'Something went wrong opening the reallocation tool.');
    }
  };

  const handleConfirmRelocate = async (numMonths: number) => {
    if (!editingTransaction?.allocationId) return;

    setIsReallocateModalVisible(false); // Close reallocate modal
    setIsSaving(true); // Show loading somewhere if possible, or just blocking

    try {
      const seriesId = editingTransaction.allocationId;
      const currentTxId = editingTransaction.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Identify transactions to replace (This one + all future)
      // We do NOT touch past transactions (history preservation)
      const allTransactionsInSeries = transactions.filter(t => t.allocationId === seriesId);

      // Split into "Keep" (Past) and "Replace" (Current + Future)
      // Current transaction is always "Replace" because we are reallocating it
      const txToReplace = allTransactionsInSeries.filter(t => {
        const tDate = new Date(t.date);
        // Delete if it is THIS transaction OR if it is in the future
        return t.id === currentTxId || tDate > today;
      });

      // 2. Identify Total Amount to Redistribute
      // Logic: The 'totalRemaining' passed to modal is trustable, recalculate to be safe
      const totalAmountToRedistribute = txToReplace.reduce((acc, t) => acc + t.amount, 0);

      // 3. Delete Old Transactions in Batch
      const idsToDelete = txToReplace.map(t => t.id);
      console.log(`[DEBUG] Deleting ${idsToDelete.length} transactions in batch...`);
      await onDeleteTransactions(idsToDelete);

      // 4. Create New Transactions
      const baseDate = new Date(editingTransaction.date);
      const amountPerMonth = totalAmountToRedistribute / numMonths;
      let totalAllocated = 0;
      const newTransactions: any[] = [];

      for (let i = 0; i < numMonths; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        if (d.getDate() !== baseDate.getDate()) {
          d.setDate(0);
        }

        let amt = amountPerMonth;
        if (i === numMonths - 1) {
          amt = totalAmountToRedistribute - totalAllocated;
        } else {
          totalAllocated += amt;
        }

        const newTx = {
          ...editingTransaction,
          id: undefined,
          name: editingTransaction.name.replace(/\(\d+\/\d+\)/, '').trim() + ` (${i + 1}/${numMonths})`,
          date: d.toISOString().split('T')[0],
          amount: parseFloat(amt.toFixed(2)),
          allocationId: seriesId,
          allocationIndex: i + 1,
          allocationTotalMonths: numMonths,
          isAllocated: true,
        };
        newTransactions.push(newTx);
      }

      await onAddTransaction(newTransactions, false);
      Alert.alert("Success", `Reallocated into ${numMonths} months.`);

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to reallocate.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- END REALLOCATE LOGIC ---

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
    const amountNum = editAmountCents / 100;
    if (amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number.');
      return;
    }
    if (!editDescription.trim()) {
      Alert.alert('Invalid Description', 'Please enter a description.');
      return;
    }

    // SMART EDIT LOGIC
    // If allocated, and amount changed, adjust future months
    if (editingTransaction.allocationId && Math.abs(amountNum - editingTransaction.amount) > 0.01) {
      // Calculate diff
      const diff = amountNum - editingTransaction.amount; // e.g. +200

      // Find future transactions in series
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Future = Date > Today
      const futureTxs = transactions.filter(t =>
        t.allocationId === editingTransaction.allocationId &&
        t.id !== editingTransaction.id &&
        new Date(t.date) > today
      );

      if (futureTxs.length > 0) {
        // Distribute diff inverse? 
        // User says: "If he edit 1200 (was 1000), the next 2 months will be 900 (was 1000)"
        // So if I INCREASE current, I DECREASE future.

        // Total adjustment needed = -diff
        // Spread evenly
        const adjustmentPerTx = -diff / futureTxs.length;

        // Validation: Ensure no future tx goes below 0
        const invalid = futureTxs.some(t => (t.amount + adjustmentPerTx) < 0);
        if (invalid) {
          Alert.alert("Cannot Update", "Increasing this amount would reduce future months below zero. Please use 'Reallocate' instead.");
          return;
        }

        // Proceed with multi-update
        setIsSaving(true);
        closeEditModal(async () => {
          try {
            // 1. Update THIS transaction
            await onUpdateTransaction(editingTransaction.id, {
              amount: amountNum,
              name: editDescription,
              category: editCategory,
              subCategory: editSubCategory,
            });

            // 2. Update FUTURE transactions
            for (const fTx of futureTxs) {
              await onUpdateTransaction(fTx.id, {
                amount: fTx.amount + adjustmentPerTx,
                // Don't change name/cat usually, but maybe should sync? 
                // Let's sync category/subCategory/name(base)
                category: editCategory,
                subCategory: editSubCategory,
              });
            }
          } catch (e) {
            Alert.alert("Error", "Failed to update series.");
          } finally {
            setIsSaving(false);
          }
        });
        return; // Exit early
      }
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
    const isOverBudget = remaining < 0;
    const overflowPercentage = total > 0 ? Math.min(((spent - total) / total) * 100, 100) : 0;

    // Use red for overflow
    const displayColor = isOverBudget ? '#E53935' : color;

    return (
      <View style={[
        expensesStyles.budgetBanner,
        {
          borderLeftWidth: 8,
          borderLeftColor: displayColor,
          backgroundColor: isOverBudget ? '#FFF5F5' : COLORS.white,
        }
      ]}>
        <View style={expensesStyles.budgetBannerHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={expensesStyles.budgetBannerTitle}>{title}</Text>
              {isOverBudget && (
                <View style={{
                  backgroundColor: '#E53935',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  marginLeft: 8
                }}>
                  <Text style={{ color: '#FFF', fontSize: 9, fontWeight: 'bold' }}>⚠️ OVER</Text>
                </View>
              )}
            </View>
            <Text style={[
              expensesStyles.budgetBannerSub,
              isOverBudget && { color: '#E53935', fontWeight: '600' }
            ]}>
              {remaining >= 0
                ? `RM ${remaining.toFixed(2)} remaining`
                : `Over by RM ${Math.abs(remaining).toFixed(2)}!`}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[
              expensesStyles.budgetBannerAmount,
              isOverBudget && { color: '#E53935' }
            ]}>
              RM {spent.toFixed(0)}
            </Text>
            <Text style={expensesStyles.budgetBannerTotal}>of RM {total.toFixed(0)}</Text>
          </View>
        </View>
        <View style={expensesStyles.bannerProgressBg}>
          <View
            style={[
              expensesStyles.bannerProgressFill,
              {
                width: `${spentPercentage}%`,
                backgroundColor: displayColor,
              },
            ]}
          />
          {/* Show overflow bar extending beyond */}
          {isOverBudget && (
            <View
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${Math.min(overflowPercentage, 20)}%`,
                backgroundColor: '#E53935',
                opacity: 0.7,
                borderTopRightRadius: 6,
                borderBottomRightRadius: 6,
              }}
            />
          )}
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
    // Simplified logic using txStatuses from financeUtils
    const sortedList = getSortedTransactions(filteredList);

    if (sortedList.length === 0) {
      return (
        <Text style={expensesStyles.merchantsText}>
          No transactions match your search.
        </Text>
      );
    }

    return sortedList.map((item) => {
      const subCat = item.subCategory || 'Others';
      const iconInfo = categoryIcons[subCat] || categoryIcons['Others'];

      const txStatus = totals.txStatuses ? totals.txStatuses[item.id] : null;
      const isOverflow = txStatus ? (txStatus.overflowSource !== null) : false;

      return (
        <View key={item.id} style={expensesStyles.transactionCard}>
          <TouchableOpacity
            style={expensesStyles.transactionMainContent}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <View style={expensesStyles.transactionIconContainer}>
              <MaterialCommunityIcon
                name={iconInfo.icon}
                size={22}
                color={COLORS.accent}
              />
              {isOverflow && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: '#E53935',
                  borderRadius: 5,
                  width: 10,
                  height: 10,
                }} />
              )}
            </View>
            <View style={expensesStyles.transactionDetails}>
              <Text style={expensesStyles.transactionName} numberOfLines={1}>{item.name}</Text>
              <Text style={expensesStyles.transactionMeta}>
                {subCat} • {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <Text
              style={[
                expensesStyles.transactionAmount,
                { color: item.type === 'income' ? COLORS.success : (isOverflow ? '#E53935' : COLORS.accent) },
              ]}
            >
              {item.type === 'income' ? '+' : '-'}RM{item.amount.toFixed(2)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={expensesStyles.editButton}
            onPress={() => openEditModal(item)}
            activeOpacity={0.6}
          >
            <Icon name="edit-2" size={14} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      );
    });
  };

  const renderSubCategorySelector = () => {
    const subCategories = Object.keys(categoryIcons);
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={expensesStyles.chipScrollView}>
        {subCategories.map((subCat) => {
          const isActive = editSubCategory === subCat;
          return (
            <TouchableOpacity
              key={subCat}
              style={[
                expensesStyles.chip,
                isActive && expensesStyles.chipActive
              ]}
              onPress={() => setEditSubCategory(subCat)}
              disabled={isSaving}
            >
              <MaterialCommunityIcon
                name={categoryIcons[subCat].icon}
                size={16}
                color={isActive ? COLORS.white : COLORS.accent}
                style={{ marginRight: 6 }}
              />
              <Text style={[
                expensesStyles.chipText,
                isActive && expensesStyles.chipTextActive
              ]}>
                {subCat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // --- RENDER FUNCTIONS ---
  const renderSearchSection = () => (
    <View style={expensesStyles.searchSection}>
      <View style={expensesStyles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.darkGray} style={{ opacity: 0.6 }} />
        <TextInput
          style={expensesStyles.searchInputPremium}
          placeholder="Search transactions..."
          placeholderTextColor={COLORS.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x-circle" size={18} color={COLORS.darkGray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTransactionHeader = () => (
    <View style={expensesStyles.transactionHeader}>
      <View>
        <Text style={expensesStyles.transactionsTitle}>Recent Transactions</Text>
        <Text style={expensesStyles.transactionsSubtitle}>Track your latest movement</Text>
      </View>
      <TouchableOpacity style={expensesStyles.sortButton} onPress={openSortModal}>
        <Icon name="sliders" size={18} color={COLORS.accent} />
      </TouchableOpacity>
    </View>
  );

  const insets = useSafeAreaInsets();
  const headerTopPadding = Math.max(insets.top, 20) + 12;

  return (
    <View style={expensesStyles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <View style={expensesStyles.safeAreaContent}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={[expensesStyles.header, { paddingTop: headerTopPadding, height: 60 + headerTopPadding }]}>
              <TouchableOpacity onPress={onBack} style={expensesStyles.headerButton}>
                <Icon name="arrow-left" size={24} color={COLORS.accent} />
              </TouchableOpacity>
              <Text style={expensesStyles.headerTitle}>Expenses</Text>
              <View style={{ width: 40 }} />
            </View>
            <ScrollView
              contentContainerStyle={expensesStyles.scrollContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.accent]}
                  tintColor={COLORS.accent}
                />
              }
            >
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

              {/* --- DASHBOARD AREA --- */}
              {activeTab === 'latest' ? (
                /* CENTERED DONUT FOR LATEST */
                <View style={expensesStyles.dashboardCard}>
                  <DonutChart
                    data={chartData}
                    total={totalForChart}
                    radius={85}
                    strokeWidth={22}
                    showCenterText={true}
                    centerLabel="THIS MONTH SPENDING"
                  />
                  {/* AI Button */}
                  <TouchableOpacity onPress={handleAskAI} style={expensesStyles.aiButtonSubtle}>
                    <MaterialCommunityIcon name="auto-fix" size={12} color="#666" style={{ marginRight: 4 }} />
                    <Text style={expensesStyles.aiButtonSubtleText}>Get Analysis</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* SIDE-BY-SIDE FOR NEEDS/WANTS */
                <View style={expensesStyles.dashboardCard}>
                  <View style={expensesStyles.splitContent}>
                    <View style={expensesStyles.chartSide}>
                      <DonutChart
                        data={activeTab === 'needs' ? needsChartData : wantsChartData}
                        total={activeTab === 'needs' ? needsForMonth : wantsForMonth}
                        radius={70}
                        strokeWidth={18}
                        showCenterText={true}
                        centerLabel={activeTab === 'needs' ? 'NEEDS SPENT' : 'WANTS SPENT'}
                      />
                    </View>
                    <View style={expensesStyles.statsSide}>
                      <Text style={[
                        expensesStyles.statsLabel,
                        { color: activeTab === 'needs' ? '#42a5f5' : '#ff7043' }
                      ]}>
                        {activeTab === 'needs' ? 'NEEDS' : 'WANTS'} BUDGET
                      </Text>
                      <Text style={expensesStyles.statsValue}>
                        RM {(activeTab === 'needs' ? needsBudget : wantsBudget).toFixed(2)}
                      </Text>
                      <Text style={expensesStyles.statsValueSmall}>
                        {activeTab === 'needs' ? '50%' : '30%'} of income
                      </Text>
                      <View style={expensesStyles.statsDivider} />
                      {/* Dynamic label based on over/under budget */}
                      {/* Dynamic label based on over/under budget */}
                      {(activeTab === 'needs' ? !isNeedsOverBudget : !isWantsOverBudget) ? (
                        <>
                          <Text style={expensesStyles.statsLabel}>
                            {(activeTab === 'wants' && wantsReceivedOverflow) || (activeTab === 'needs' && needsReceivedOverflow) ? "REMAINING (REDUCED)" : "REMAINING"}
                          </Text>
                          <Text style={[expensesStyles.statsRemaining, { color: COLORS.success }]}>
                            RM {(activeTab === 'needs'
                              ? budget.needs.remaining
                              : budget.wants.remaining).toFixed(2)}
                          </Text>
                          {activeTab === 'wants' && wantsReceivedOverflow && (
                            <Text style={{ fontSize: 9, color: '#666', marginTop: 2 }}>
                              ⚠️ Capacity reduced by Needs overflow
                            </Text>
                          )}
                          {activeTab === 'needs' && needsReceivedOverflow && (
                            <Text style={{ fontSize: 9, color: '#666', marginTop: 2 }}>
                              ⚠️ Capacity reduced by Wants overflow
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[expensesStyles.statsLabel, { color: COLORS.danger }]}>
                              OVERFLOW ⚠️
                            </Text>
                          </View>
                          <Text style={[expensesStyles.statsRemaining, { color: COLORS.danger }]}>
                            RM {Math.abs(activeTab === 'needs'
                              ? budget.needs.overflow
                              : budget.wants.overflow).toFixed(2)}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                            → Using {
                              activeTab === 'needs'
                                ? [budget.needs.overflowToWants > 0 ? 'Wants' : null, budget.needs.overflowToSavings > 0 ? 'Savings' : null].filter(Boolean).join(' & ')
                                : [budget.wants.overflowToNeeds > 0 ? 'Needs' : null, budget.wants.overflowToSavings > 0 ? 'Savings' : null].filter(Boolean).join(' & ')
                            } allocation
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  {/* Progress Bar */}
                  <View style={expensesStyles.progressSection}>
                    <View style={expensesStyles.progressLabels}>
                      <Text style={expensesStyles.progressLabelSpent}>
                        {Math.min(100, Math.round(((activeTab === 'needs' ? needsForMonth : wantsForMonth) / (activeTab === 'needs' ? needsBudget : wantsBudget)) * 100))}% Spent
                      </Text>
                      <Text style={expensesStyles.progressLabelRemaining}>
                        {Math.max(0, 100 - Math.round(((activeTab === 'needs' ? needsForMonth : wantsForMonth) / (activeTab === 'needs' ? needsBudget : wantsBudget)) * 100))}% Left
                      </Text>
                    </View>
                    <View style={expensesStyles.progressBarBg}>
                      <View
                        style={[
                          expensesStyles.progressBarFill,
                          {
                            width: `${Math.min(100, ((activeTab === 'needs' ? needsForMonth : wantsForMonth) / (activeTab === 'needs' ? needsBudget : wantsBudget)) * 100)}%`,
                            backgroundColor: ((activeTab === 'needs' ? needsForMonth : wantsForMonth) / (activeTab === 'needs' ? needsBudget : wantsBudget)) > 0.9 ? COLORS.danger : COLORS.primary
                          }
                        ]}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Horizontal Scroll (Legend) - Clean Style */}
              {totalForChart > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={expensesStyles.categoriesScroll}
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {Object.entries(subCategoryGroups).map(([sub, group]) => {
                    const { icon } = categoryIcons[sub] || { icon: 'dots-horizontal' };
                    const color = colorMap[sub] || categoryIcons[sub]?.color || COLORS.darkGray;
                    const { amount } = group as { amount: number };

                    return (
                      <View key={sub} style={expensesStyles.legendChip}>
                        <View style={[
                          expensesStyles.legendIconCircle,
                          { backgroundColor: color }
                        ]}>
                          <MaterialCommunityIcon name={icon} size={18} color={COLORS.white} />
                        </View>
                        <Text style={expensesStyles.legendName} numberOfLines={1}>{sub}</Text>
                        <Text style={expensesStyles.legendAmount}>
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
                  onPress={() => switchTab('latest')}
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
                  onPress={() => switchTab('needs')}
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
                  onPress={() => switchTab('wants')}
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
                  {renderSearchSection()}
                  {renderTransactionHeader()}
                  {renderTransactionsList(latestTransactions)}
                </View>
              ) : activeTab === 'needs' ? (
                <View>
                  {renderSearchSection()}
                  {renderTransactionHeader()}
                  {renderTransactionsList(needsExpenses)}
                </View>
              ) : ( // activeTab === 'wants'
                <View>
                  {renderSearchSection()}
                  {renderTransactionHeader()}
                  {renderTransactionsList(wantsExpenses)}
                </View>
              )}
            </ScrollView>
          </View>

          {/* Bottom Nav */}
          <View style={expensesStyles.bottomNavSafeArea}>
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
          </View>
        </View>
      </TouchableWithoutFeedback>

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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? -50 : 0}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={expensesStyles.modalHeader}>
                    <View style={expensesStyles.modalHandle} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <View>
                        <Text style={expensesStyles.modalTitle}>Edit Transaction</Text>
                        {editingTransaction && totals.txStatuses?.[editingTransaction.id]?.overflowSource && (
                          <Text style={{ fontSize: 11, color: '#E53935', marginTop: 2 }}>
                            ⚠️ Using {
                              [
                                totals.txStatuses[editingTransaction.id].usedNeeds > 0 ? `Needs (RM ${totals.txStatuses[editingTransaction.id].usedNeeds.toFixed(2)})` : null,
                                totals.txStatuses[editingTransaction.id].usedWants > 0 ? `Wants (RM ${totals.txStatuses[editingTransaction.id].usedWants.toFixed(2)})` : null,
                                totals.txStatuses[editingTransaction.id].usedSavings > 0 ? `Savings (RM ${totals.txStatuses[editingTransaction.id].usedSavings.toFixed(2)})` : null
                              ].filter(Boolean).join(' & ')
                            } allocation
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => closeEditModal()} style={expensesStyles.closeButton} disabled={isSaving}>
                        <Icon name="x" size={22} color={COLORS.darkGray} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={expensesStyles.modalHero}>
                    <Text style={expensesStyles.modalHeroLabel}>TOTAL AMOUNT</Text>
                    <View style={expensesStyles.modalHeroAmountRow}>
                      <Text style={expensesStyles.modalHeroCurrency}>RM</Text>
                      <TextInput
                        style={expensesStyles.modalHeroInput}
                        value={formatCentsToCurrency(editAmountCents)}
                        onChangeText={handleEditAmountChange}
                        keyboardType="number-pad"
                        placeholder="0.00"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        editable={!isSaving}
                      />
                    </View>
                  </View>

                  <View style={expensesStyles.formContainer}>
                    <View style={expensesStyles.inputGroup}>
                      <Text style={expensesStyles.inputLabel}>WHAT WAS THIS FOR?</Text>
                      <TextInput
                        style={expensesStyles.textInput}
                        value={editDescription}
                        onChangeText={setEditDescription}
                        placeholder="e.g. Lunch"
                        placeholderTextColor={COLORS.darkGray}
                        editable={!isSaving}
                      />
                    </View>

                    {editingTransaction?.type === 'expense' && (
                      <View style={expensesStyles.inputGroup}>
                        <Text style={expensesStyles.inputLabel}>SPENDING CATEGORY</Text>
                        <View style={expensesStyles.segmentedControlPremium}>
                          <TouchableOpacity
                            style={[expensesStyles.segmentBtnP, editCategory === 'needs' && expensesStyles.segmentBtnActiveP]}
                            onPress={() => setEditCategory('needs')}
                            disabled={isSaving}
                          >
                            <Icon name="shield" size={16} color={editCategory === 'needs' ? COLORS.white : COLORS.darkGray} style={{ marginRight: 6 }} />
                            <Text style={[expensesStyles.segmentTextP, editCategory === 'needs' && expensesStyles.segmentTextActiveP]}>Needs</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[expensesStyles.segmentBtnP, editCategory === 'wants' && expensesStyles.segmentBtnActiveP]}
                            onPress={() => setEditCategory('wants')}
                            disabled={isSaving}
                          >
                            <Icon name="heart" size={16} color={editCategory === 'wants' ? COLORS.white : COLORS.darkGray} style={{ marginRight: 6 }} />
                            <Text style={[expensesStyles.segmentTextP, editCategory === 'wants' && expensesStyles.segmentTextActiveP]}>Wants</Text>
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

                  {editingTransaction?.isAllocated && (
                    <TouchableOpacity
                      style={expensesStyles.reallocateInlineButton}
                      onPress={handleOpenReallocate}
                      disabled={isSaving}
                    >
                      <MaterialCommunityIcon name="refresh" size={18} color={COLORS.primary} />
                      <Text style={expensesStyles.reallocateInlineButtonText}>Reallocate</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={[expensesStyles.saveButton, isSaving && { opacity: 0.7 }]} onPress={handleSaveEdit} disabled={isSaving}>
                    <Text style={expensesStyles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
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

            <View style={{ gap: 12, paddingHorizontal: 20 }}>
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
            <View style={{ height: 40 }} />
          </Animated.View>
        </View>
      </Modal>
      {/* --- REALLOCATE MODAL --- */}
      <ReallocateModal
        isVisible={isReallocateModalVisible}
        onClose={() => setIsReallocateModalVisible(false)}
        totalRemaining={reallocateTotalRemaining}
        initialMonths={editingTransaction?.allocationTotalMonths}
        onConfirm={handleConfirmRelocate}
      />
    </View>
  );
};

// --- Styles for ExpensesScreen ---
const expensesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeAreaContent: {
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
  headerButton: {
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
  monthTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    paddingBottom: 20,
  },
  monthTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: 'rgba(200, 219, 190, 0.3)', // Subtle sage
  },
  activeMonthTab: {
    backgroundColor: COLORS.accent, // Dark Earth active month
  },
  monthText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    opacity: 0.6,
  },
  activeMonthText: {
    color: COLORS.white,
    fontWeight: '800',
    opacity: 1,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    position: 'relative',
  },
  headerAiButton: {
    backgroundColor: 'rgba(200, 219, 190, 0.4)',
    padding: 10,
    borderRadius: 16,
  },
  aiInsightsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.accent + '30',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  aiInsightsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiInsightsText: {
    flex: 1,
  },
  aiInsightsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 2,
  },
  aiInsightsSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  aiButtonSubtle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  aiButtonSubtleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  dashboardCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 15,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    height: 290,
    overflow: 'visible',
  },
  progressSection: {
    width: '100%',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabelSpent: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  progressLabelRemaining: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  splitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  chartSide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSide: {
    flex: 1,
    paddingLeft: 24,
    paddingRight: 16,
    justifyContent: 'center',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  legendChip: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 65,
  },
  legendIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  legendName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E57373',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    minWidth: 80,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.darkGray,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  heroDashboard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 15,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    minHeight: 250,
  },
  statsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.darkGray,
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.6,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: -0.3,
  },
  statsValueSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: 2,
    opacity: 0.5,
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 14,
    width: '100%',
  },
  statsValues: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statsRemaining: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  aiButtonPill: {
    position: 'absolute',
    bottom: -15,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  aiButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  budgetContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  budgetBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginTop: 10,
    marginBottom: 25,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, // Clearer, deeper shadow
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)', // Subtle but visible stroke
  },
  budgetBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  budgetBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
  },
  budgetBannerSub: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginTop: 2,
  },
  budgetBannerAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.accent,
  },
  budgetBannerTotal: {
    fontSize: 12,
    color: COLORS.darkGray,
    opacity: 0.6,
    fontWeight: '600',
  },
  bannerProgressBg: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bannerProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  budgetCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetCategoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
  },
  budgetCategoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  budgetRemainingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  budgetRemainingText: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginRight: 6,
  },
  budgetRemainingAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 15,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.3,
  },
  transactionsSubtitle: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '40', // Theme color border
  },
  searchInputPremium: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
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
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  merchantsText: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    paddingTop: 16,
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  modalHero: {
    backgroundColor: COLORS.primary,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  modalHeroLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    opacity: 0.7,
  },
  modalHeroAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeroCurrency: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.accent,
    marginRight: 6,
    opacity: 0.7,
  },
  modalHeroInput: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.accent,
    padding: 0,
    minWidth: 100,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  segmentTextActive: {
    color: COLORS.accent,
  },
  segmentedControlPremium: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 4,
    height: 48,
  },
  segmentBtnP: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segmentBtnActiveP: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentTextP: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  segmentTextActiveP: {
    color: COLORS.white,
    fontWeight: '700',
  },
  chipScrollView: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
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
    fontWeight: '600',
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  deleteButton: {
    width: 52,
    height: 52,
    backgroundColor: '#FEE',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCC',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sortOptionActive: {
    backgroundColor: '#F0F9FF',
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
  scrollContainer: {
    paddingBottom: 100,
  },
  reallocateInlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200, 219, 190, 0.3)',
    borderRadius: 16,
    height: 52,
    marginHorizontal: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '20',
  },
  reallocateInlineButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});