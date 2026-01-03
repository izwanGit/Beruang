// src/screens/AddMoneyScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

type AddMoneyScreenProps = {
  onBack: () => void;
  showMessage: (message: string) => void;
  onAddTransaction: (transaction: any | any[]) => void;
};

export const AddMoneyScreen = ({
  onBack,
  showMessage,
  onAddTransaction,
}: AddMoneyScreenProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [allocationMonths, setAllocationMonths] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== date.getDate()) {
      d.setDate(0);
    }
    return d;
  };

  const handleManualMonthChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setAllocationMonths(Math.max(1, Math.min(60, num)));
    } else if (val === '') {
      setAllocationMonths(1);
    }
  };

  const incrementMonth = () => setAllocationMonths(prev => Math.min(60, prev + 1));
  const decrementMonth = () => setAllocationMonths(prev => Math.max(1, prev - 1));

  const handleSaveIncome = async () => {
    if (!amount || !description) {
      showMessage('Please fill in both amount and description');
      return;
    }
    const amountNum = parseFloat(amount);
    const numMonths = allocationMonths;

    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    showMessage('Saving income...');

    try {
      const baseDate = new Date();
      const transactionsToCreate = [];

      if (numMonths === 1) {
        const newTransaction = {
          icon: 'dollar-sign',
          name: description,
          date: baseDate.toISOString().split('T')[0],
          amount: amountNum,
          type: 'income',
          category: 'income',
          subCategory: 'Income',
          isCarriedOver: false,
        };
        transactionsToCreate.push(newTransaction);
      } else {
        const amountPerMonth = amountNum / numMonths;
        let totalAllocated = 0;

        for (let i = 0; i < numMonths; i++) {
          const transactionDate = addMonths(baseDate, i);
          let currentMonthAmount = amountPerMonth;

          if (i === numMonths - 1) {
            currentMonthAmount = amountNum - totalAllocated;
          } else {
            totalAllocated += currentMonthAmount;
          }

          const newTransaction = {
            icon: 'dollar-sign',
            name: `${description} (${i + 1}/${numMonths})`,
            date: transactionDate.toISOString().split('T')[0],
            amount: parseFloat(currentMonthAmount.toFixed(2)),
            type: 'income',
            category: 'income',
            subCategory: 'Income',
            isCarriedOver: false,
          };
          transactionsToCreate.push(newTransaction);
        }
      }

      onAddTransaction(transactionsToCreate);

      setAmount('');
      setDescription('');
      setAllocationMonths(1);
      const successMessage =
        numMonths === 1
          ? 'Income added successfully!'
          : `Income allocated over ${numMonths} months!`;
      showMessage(successMessage);

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      showMessage('Error saving income. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={addMoneyStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <SafeAreaView style={addMoneyStyles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* --- Standardized Header --- */}
        <View style={addMoneyStyles.header}>
          <TouchableOpacity onPress={onBack} style={addMoneyStyles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={addMoneyStyles.headerTitle}>Add Money</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={addMoneyStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- Input Card --- */}
          <View style={addMoneyStyles.card}>
            <View style={addMoneyStyles.cardHeader}>
              <Icon name="trending-up" size={20} color={COLORS.secondary} />
              <Text style={addMoneyStyles.cardTitle}>New Income</Text>
            </View>

            <View style={addMoneyStyles.inputGroup}>
              <Text style={addMoneyStyles.label}>AMOUNT RECEIVED (RM)</Text>
              <View style={addMoneyStyles.amountRow}>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor={COLORS.darkGray + '80'}
                  style={addMoneyStyles.amountInput}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!isLoading}
                  autoFocus
                />
              </View>
            </View>

            <View style={addMoneyStyles.inputGroup}>
              <View style={addMoneyStyles.labelWithIcon}>
                <Icon name="tag" size={14} color={COLORS.primary} />
                <Text style={addMoneyStyles.label}>DESCRIPTION</Text>
              </View>
              <TextInput
                placeholder="e.g., Salary, Freelance Job"
                placeholderTextColor={COLORS.darkGray + '80'}
                style={addMoneyStyles.textInput}
                value={description}
                onChangeText={setDescription}
                editable={!isLoading}
              />
            </View>

            <View style={addMoneyStyles.inputGroup}>
              <View style={addMoneyStyles.labelWithIcon}>
                <Icon name="clock" size={14} color={COLORS.secondary} />
                <Text style={addMoneyStyles.label}>PLAN FOR FUTURE MONTHS?</Text>
              </View>

              {/* --- iOS Style Month Picker --- */}
              <View style={addMoneyStyles.monthPickerContainer}>
                <TouchableOpacity
                  onPress={decrementMonth}
                  style={addMoneyStyles.pickerButton}
                  activeOpacity={0.7}
                >
                  <Icon name="minus" size={20} color={COLORS.accent} />
                </TouchableOpacity>

                <View style={addMoneyStyles.pickerDisplay}>
                  <TextInput
                    style={addMoneyStyles.pickerValue}
                    keyboardType="numeric"
                    value={allocationMonths.toString()}
                    onChangeText={handleManualMonthChange}
                    editable={!isLoading}
                  />
                  <Text style={addMoneyStyles.pickerLabel}>MONTHS</Text>
                </View>

                <TouchableOpacity
                  onPress={incrementMonth}
                  style={addMoneyStyles.pickerButton}
                  activeOpacity={0.7}
                >
                  <Icon name="plus" size={20} color={COLORS.accent} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={addMoneyStyles.actionRow}>
              <TouchableOpacity
                style={[
                  addMoneyStyles.confirmButton,
                  isLoading && { opacity: 0.6 },
                ]}
                onPress={handleSaveIncome}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Text style={addMoneyStyles.confirmButtonText}>Confirm Income</Text>
                    <Icon name="check" size={14} color={COLORS.white} style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* --- Pro Tip --- */}
          <View style={addMoneyStyles.proTipCard}>
            <View style={addMoneyStyles.proTipHeader}>
              <Icon name="zap" size={14} color={COLORS.yellow} />
              <Text style={addMoneyStyles.proTipTitle}>Beruang Advice</Text>
            </View>
            <Text style={addMoneyStyles.proTipText}>
              Splitting income keeps your daily budget balanced and accurate across months.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const addMoneyStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 24,
    elevation: 4,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.accent,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.darkGray,
    letterSpacing: 0.8,
  },
  amountRow: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 4,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.accent,
    padding: 0,
  },
  textInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  monthPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  pickerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  pickerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.accent,
    minWidth: 40,
    textAlign: 'center',
    padding: 0,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.darkGray,
    letterSpacing: 1,
  },
  actionRow: {
    alignItems: 'flex-end',
    marginTop: 15,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 22,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  proTipCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  proTipTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.accent,
  },
  proTipText: {
    fontSize: 13,
    color: COLORS.accent,
    lineHeight: 20,
    fontWeight: '500',
    opacity: 0.8,
  },
});