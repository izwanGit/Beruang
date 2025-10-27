// src/screens/AddTransactionScreen.tsx
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
import { simpleCategorizeFallback } from '../utils/categorization';

type AddTransactionScreenProps = {
  onBack: () => void;
  showMessage: (message: string) => void;
  onAddTransaction: (transaction: any) => void;
};

export const AddTransactionScreen = ({
  onBack,
  showMessage,
  onAddTransaction,
}: AddTransactionScreenProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveTransaction = async () => {
    if (!amount || !description) {
      showMessage('Please fill in both amount and description');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showMessage('Please enter a valid amount');
      return;
    }
    setIsLoading(true);
    showMessage('Analyzing transaction...'); // Changed from AI

    try {
      // Using fallback categorization directly
      const { category, subCategory } = simpleCategorizeFallback(description);
      const newTransaction = {
        id: Date.now().toString(),
        icon: 'shopping-cart',
        name: description,
        date: new Date().toISOString().split('T')[0],
        amount: amountNum,
        type: 'expense',
        category,
        subCategory,
      };

      onAddTransaction(newTransaction);
      setAmount('');
      setDescription('');
      showMessage(
        `Transaction saved! Categorized as: ${subCategory} (${category.toUpperCase()})`,
      );
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      showMessage('Error saving transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraPress = () => {
    showMessage('Camera feature coming soon!');
  };

  const handleUploadPress = () => {
    showMessage('Upload feature coming soon!');
  };

  return (
    <SafeAreaView style={addTransactionStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={addTransactionStyles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={addTransactionStyles.backButton}
        >
          <Icon name="arrow-left" size={24} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={addTransactionStyles.headerTitle}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={addTransactionStyles.scrollContainer}>
        <View style={addTransactionStyles.section}>
          <Text style={addTransactionStyles.sectionTitle}>Enter Manually</Text>
          <View style={addTransactionStyles.inputView}>
            <Text style={addTransactionStyles.currencySymbol}>RM</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor={COLORS.darkGray}
              style={addTransactionStyles.amountInput}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              editable={!isLoading}
            />
          </View>
          <TextInput
            placeholder="Description (e.g., Lunch with friends)"
            placeholderTextColor={COLORS.darkGray}
            style={addTransactionStyles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              addTransactionStyles.saveButton,
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleSaveTransaction}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={addTransactionStyles.saveButtonText}>
                Save Transaction
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={addTransactionStyles.dividerContainer}>
          <View style={addTransactionStyles.divider} />
          <Text style={addTransactionStyles.dividerText}>OR</Text>
          <View style={addTransactionStyles.divider} />
        </View>
        <View style={addTransactionStyles.section}>
          <Text style={addTransactionStyles.sectionTitle}>Use a Receipt</Text>
          <View style={addTransactionStyles.receiptOptionsContainer}>
            <TouchableOpacity
              style={addTransactionStyles.receiptOption}
              onPress={handleCameraPress}
            >
              <Icon name="camera" size={30} color={COLORS.accent} />
              <Text style={addTransactionStyles.receiptOptionText}>
                Scan Receipt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={addTransactionStyles.receiptOption}
              onPress={handleUploadPress}
            >
              <Icon name="image" size={30} color={COLORS.accent} />
              <Text style={addTransactionStyles.receiptOptionText}>
                Upload Image
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles for AddTransactionScreen ---
const addTransactionStyles = StyleSheet.create({
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
    marginBottom: 20,
    color: COLORS.accent,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.darkGray,
  },
  dividerText: {
    marginHorizontal: 15,
    color: COLORS.darkGray,
    fontWeight: 'bold',
  },
  receiptOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  receiptOption: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '45%',
    elevation: 3,
  },
  receiptOptionText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
});