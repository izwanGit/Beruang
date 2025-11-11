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
  // --- MODIFIED: Can now accept a single transaction or an array ---
  onAddTransaction: (transaction: any | any[]) => void;
};

export const AddMoneyScreen = ({
  onBack,
  showMessage,
  onAddTransaction,
}: AddMoneyScreenProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // --- NEW: State for allocation ---
  const [allocationMonths, setAllocationMonths] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW: Helper function to add months to a date ---
  const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    // Handle edge cases like Feb 30th -> Mar 2nd
    if (d.getDate() !== date.getDate()) {
      d.setDate(0); // Go to last day of previous month
    }
    return d;
  };

  const handleSaveIncome = async () => {
    if (!amount || !description) {
      showMessage('Please fill in all fields');
      return;
    }
    const amountNum = parseFloat(amount);
    const numMonths = parseInt(allocationMonths, 10) || 1;

    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage('Please enter a valid amount');
      return;
    }
    if (isNaN(numMonths) || numMonths <= 0) {
      showMessage('Please enter a valid number of months');
      return;
    }

    setIsLoading(true);
    showMessage('Saving income...');

    try {
      const baseDate = new Date();
      const transactionsToCreate = [];

      if (numMonths === 1) {
        // --- Logic for a single transaction ---
        const newTransaction = {
          id: Date.now().toString(),
          icon: 'dollar-sign',
          name: description,
          date: baseDate.toISOString().split('T')[0],
          amount: amountNum,
          type: 'income',
          category: 'income',
          subCategory: 'Income',
          isCarriedOver: false, // This is new, budgetable income
        };
        transactionsToCreate.push(newTransaction);
      } else {
        // --- Logic for multiple, allocated transactions ---
        const amountPerMonth = amountNum / numMonths;
        let totalAllocated = 0;

        for (let i = 0; i < numMonths; i++) {
          const transactionDate = addMonths(baseDate, i);
          let currentMonthAmount = amountPerMonth;

          // On the last month, add any remainder from division to avoid losing cents
          if (i === numMonths - 1) {
            currentMonthAmount = amountNum - totalAllocated;
          } else {
            totalAllocated += currentMonthAmount;
          }

          const newTransaction = {
            id: `${Date.now().toString()}-${i}`,
            icon: 'dollar-sign',
            // Add (1/6), (2/6), etc. to the name
            name: `${description} (${i + 1}/${numMonths})`,
            date: transactionDate.toISOString().split('T')[0],
            amount: parseFloat(currentMonthAmount.toFixed(2)),
            type: 'income',
            category: 'income',
            subCategory: 'Income',
            isCarriedOver: false, // This is new, budgetable income for that month
          };
          transactionsToCreate.push(newTransaction);
        }
      }

      // Call the main add transaction function (which accepts an array)
      onAddTransaction(transactionsToCreate);

      // Reset form and show success
      setAmount('');
      setDescription('');
      setAllocationMonths('1');
      const successMessage =
        numMonths === 1
          ? 'Income added successfully!'
          : `Income allocated successfully over ${numMonths} months!`;
      showMessage(successMessage);

      // Go back after a short delay
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
    <SafeAreaView style={addMoneyStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      {/* --- Header --- */}
      <View style={addMoneyStyles.header}>
        <TouchableOpacity onPress={onBack} style={addMoneyStyles.backButton}>
          <Icon name="arrow-left" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={addMoneyStyles.headerTitle}>Add Money</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* --- Form --- */}
      <ScrollView contentContainerStyle={addMoneyStyles.scrollContainer}>
        <View style={addMoneyStyles.section}>
          <Text style={addMoneyStyles.sectionTitle}>Add Income</Text>
          {/* --- Amount Input --- */}
          <View style={addMoneyStyles.inputView}>
            <Text style={addMoneyStyles.currencySymbol}>RM</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={COLORS.darkGray}
              style={addMoneyStyles.amountInput}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!isLoading}
            />
          </View>
          {/* --- Description Input --- */}
          <TextInput
            placeholder="Description (e.g., Student Loan, Salary)"
            placeholderTextColor={COLORS.darkGray}
            style={addMoneyStyles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
          />

          {/* --- NEW: Allocation Input --- */}
          <Text style={addMoneyStyles.label}>
            Allocate over how many months?
          </Text>
          <TextInput
            placeholder="1"
            placeholderTextColor={COLORS.darkGray}
            style={addMoneyStyles.descriptionInput} // Re-use style
            keyboardType="numeric"
            value={allocationMonths}
            onChangeText={setAllocationMonths}
            editable={!isLoading}
          />
          <Text style={addMoneyStyles.infoTextSmall}>
            Enter "1" for a one-time income. Enter "6" to spread the
            total amount over 6 months.
          </Text>

          {/* --- Save Button --- */}
          <TouchableOpacity
            style={[
              addMoneyStyles.saveButton,
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleSaveIncome}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={addMoneyStyles.saveButtonText}>Save Income</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* --- Info Box --- */}
        <View style={addMoneyStyles.infoBox}>
          <Icon
            name="info"
            size={20}
            color={COLORS.accent}
            style={{ marginRight: 10 }}
          />
          <Text style={addMoneyStyles.infoText}>
            Use this screen to add any money you receive. You can allocate
            large sums over multiple months to budget correctly.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles for AddMoneyScreen ---
const addMoneyStyles = StyleSheet.create({
  container: {
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
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginBottom: 10,
    marginLeft: 5,
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.accent,
    height: 70,
  },
  descriptionInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 20,
    height: 60,
    fontSize: 16,
    marginBottom: 15, // Adjusted margin
    color: COLORS.accent,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    marginTop: 20, // Added margin top
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    color: COLORS.accent,
    fontSize: 14,
    lineHeight: 20,
  },
  infoTextSmall: {
    flex: 1,
    color: COLORS.darkGray,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 5,
    marginBottom: 20, // Add space before button
  },
});
