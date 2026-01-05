// src/screens/AddTransactionScreen.tsx
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '../constants/colors';
import { categorizeTransaction } from '../utils/categorization';
import { PREDICT_TRANSACTION_URL } from '../config/urls';

// Construct URLs
const SCAN_RECEIPT_URL = PREDICT_TRANSACTION_URL.replace('/predict-transaction', '/scan-receipt');
const IMPORT_DATA_URL = PREDICT_TRANSACTION_URL.replace('/predict-transaction', '/import-data');

type AddTransactionScreenProps = {
  onBack: () => void;
  showMessage: (message: string) => void;
  onAddTransaction: (transaction: any) => void;
  canAccommodateBudget?: (amount: number, category: 'needs' | 'wants') => boolean;
  monthlyBalance?: number; // Available spending balance
  onNavigateToAddMoney?: () => void;
};

export const AddTransactionScreen = ({
  onBack,
  showMessage,
  onAddTransaction,
  canAccommodateBudget,
  monthlyBalance = 0,
  onNavigateToAddMoney,
}: AddTransactionScreenProps) => {
  const [amountCents, setAmountCents] = useState(0); // Store as cents for bank-style input
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionItems, setSessionItems] = useState<any[]>([]);
  const amountInputRef = useRef<TextInput>(null);
  const [lastAdded, setLastAdded] = useState<any>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Format cents to currency display (e.g., 123 cents -> "1.23")
  // Show empty string when 0 so placeholder shows
  const formatCentsToCurrency = (cents: number): string => {
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
  };

  // Handle bank-style input: each digit shifts left, backspace shifts right
  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters
    const numericOnly = text.replace(/[^0-9]/g, '');
    // Parse as integer (cents)
    const cents = parseInt(numericOnly, 10) || 0;
    // Cap at reasonable max (e.g., RM 999,999.99 = 99999999 cents)
    setAmountCents(Math.min(cents, 99999999));
  };

  const handlePickImage = async (useCamera: boolean) => {
    const options: any = {
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.7,
    };

    const result = useCamera
      ? await launchCamera(options)
      : await launchImageLibrary(options);

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return;
    }

    const imageAsset = result.assets[0];
    if (imageAsset.base64) {
      processReceiptImage(imageAsset.base64);
    }
  };

  const processReceiptImage = async (base64Data: string) => {
    setIsProcessingImage(true);
    showMessage('AI is reading your receipt...');

    try {
      const response = await fetch(SCAN_RECEIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ image: base64Data })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Backend error');
      }

      if (data && (data.amount !== undefined)) {
        // Convert RM amount to cents for bank-style input
        setAmountCents(Math.round(data.amount * 100));
        // Use the AI description if available, otherwise merchant
        const finalDesc = data.description || data.merchant || 'Unknown Transaction';
        setDescription(finalDesc);
        showMessage('Receipt read successfully!');
      } else {
        throw new Error('Invalid data format');
      }

    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Failed to read receipt. Technical error.';
      showMessage(msg);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkTextInput.trim()) {
      showMessage('Please paste some text first');
      return;
    }

    setIsImporting(true);
    showMessage('AI is parsing your data...');

    try {
      const response = await fetch(IMPORT_DATA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ text: bulkTextInput })
      });

      if (!response.ok) throw new Error('Backend error');

      const data = await response.json();

      if (data.transactions && Array.isArray(data.transactions)) {
        data.transactions.forEach((t: any) => {
          onAddTransaction({
            ...t,
            date: t.date || new Date().toISOString().split('T')[0],
            icon: 'shopping-cart',
            type: 'expense'
          });
        });

        showMessage(`Successfully imported ${data.transactions.length} items!`);
        setIsImportModalVisible(false);
        setBulkTextInput('');
        onBack();
      } else {
        throw new Error('No transactions found');
      }

    } catch (error) {
      console.error(error);
      showMessage('Failed to import data. Try being more specific.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (amountCents === 0 || !description) {
      showMessage('Please fill in both amount and description');
      return;
    }
    const amountNum = amountCents / 100; // Convert cents to RM
    if (amountNum <= 0) {
      showMessage('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    showMessage('Analyzing transaction...');

    try {
      const result = await categorizeTransaction(description);

      // PRE-CHECK: Validate budget can accommodate this transaction
      if (canAccommodateBudget) {
        const canProceed = canAccommodateBudget(amountNum, result.category as 'needs' | 'wants');
        if (!canProceed) {
          setIsLoading(false);
          showMessage('Budget full! Add income or wait for next month. 💸');
          onBack();
          return;
        }
      }

      const newTransaction = {
        icon: 'shopping-cart',
        name: description,
        date: new Date().toISOString().split('T')[0],
        amount: amountNum,
        type: 'expense',
        category: result.category,
        subCategory: result.subCategory,
      };

      onAddTransaction(newTransaction);
      setSessionItems(prev => [newTransaction, ...prev]);
      setLastAdded({ ...newTransaction, isAi: result.isAi });
      setAmountCents(0);
      setDescription('');

    } catch (error) {
      console.error(error);
      showMessage('Error saving transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMore = () => {
    setLastAdded(null);
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 100);
  };

  return (
    <View style={addTransactionStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <SafeAreaView style={addTransactionStyles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* --- Standardized Header --- */}
        <View style={addTransactionStyles.header}>
          <TouchableOpacity onPress={onBack} style={addTransactionStyles.backButton}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={addTransactionStyles.headerTitle}>Add Expense</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={addTransactionStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* --- Manual Entry Card --- */}
          <View style={addTransactionStyles.card}>
            {!lastAdded ? (
              <>
                <View style={addTransactionStyles.cardHeader}>
                  <Icon name="edit-3" size={20} color={COLORS.secondary} />
                  <Text style={addTransactionStyles.cardTitle}>Manual Entry</Text>
                </View>

                <View style={addTransactionStyles.inputGroup}>
                  <Text style={addTransactionStyles.label}>AMOUNT SPENT (RM)</Text>
                  <View style={addTransactionStyles.amountRow}>
                    <TextInput
                      ref={amountInputRef}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.darkGray}
                      style={addTransactionStyles.amountInput}
                      keyboardType="number-pad"
                      value={formatCentsToCurrency(amountCents)}
                      onChangeText={handleAmountChange}
                      editable={!isLoading}
                      autoFocus
                    />
                  </View>
                  {/* Balance Display */}
                  <View style={addTransactionStyles.balanceRow}>
                    <Text style={[
                      addTransactionStyles.balanceText,
                      (amountCents / 100) > monthlyBalance && { color: '#E74C3C' }
                    ]}>
                      Balance: RM {monthlyBalance.toFixed(2)}
                    </Text>
                    {(amountCents / 100) > monthlyBalance && onNavigateToAddMoney && (
                      <TouchableOpacity onPress={onNavigateToAddMoney}>
                        <Text style={addTransactionStyles.addMoneyLink}>Add Money</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={addTransactionStyles.inputGroup}>
                  <View style={addTransactionStyles.labelWithIcon}>
                    <Icon name="tag" size={14} color={COLORS.primary} />
                    <Text style={addTransactionStyles.label}>DESCRIPTION</Text>
                  </View>
                  <TextInput
                    placeholder="e.g., Starbucks Lunch, Spotify, Groceries"
                    placeholderTextColor={COLORS.darkGray}
                    style={addTransactionStyles.textInput}
                    value={description}
                    onChangeText={setDescription}
                    editable={!isLoading}
                  />
                </View>

                <View style={addTransactionStyles.actionRow}>
                  <TouchableOpacity
                    style={[
                      addTransactionStyles.confirmButton,
                      isLoading && { opacity: 0.6 },
                    ]}
                    onPress={handleSaveTransaction}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <>
                        <Text style={addTransactionStyles.confirmButtonText}>Confirm Entry</Text>
                        <Icon name="check" size={14} color={COLORS.white} style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={addTransactionStyles.successState}>
                <View style={addTransactionStyles.successHeader}>
                  <View style={addTransactionStyles.checkCircle}>
                    <Icon name="check" size={28} color={COLORS.white} />
                  </View>
                  <Text style={addTransactionStyles.successText}>Item Saved!</Text>
                </View>

                <View style={addTransactionStyles.resultBox}>
                  <Text style={addTransactionStyles.resultLabel}>AI CATEGORIZATION</Text>
                  <View style={addTransactionStyles.resultRow}>
                    <View style={addTransactionStyles.categoryBadge}>
                      <Text style={addTransactionStyles.categoryBadgeText}>
                        {lastAdded.category.toUpperCase()}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={14} color={COLORS.darkGray} />
                    <Text style={addTransactionStyles.subCategoryText}>
                      {lastAdded.subCategory}
                    </Text>
                  </View>
                </View>

                <View style={addTransactionStyles.buttonRow}>
                  <TouchableOpacity
                    style={addTransactionStyles.addMoreButton}
                    onPress={handleAddMore}
                  >
                    <Icon name="plus-circle" size={18} color={COLORS.white} />
                    <Text style={addTransactionStyles.addMoreText}>Add Another</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={addTransactionStyles.finishButton}
                    onPress={onBack}
                  >
                    <Text style={addTransactionStyles.finishText}>I'm Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* --- Receipt Quick Actions --- */}
          <View style={addTransactionStyles.receiptSection}>
            <Text style={addTransactionStyles.labelSmall}>USE A RECEIPT (BETA)</Text>

            <View style={addTransactionStyles.receiptRow}>
              <TouchableOpacity
                style={[
                  addTransactionStyles.receiptCard,
                  isProcessingImage && { opacity: 0.6 }
                ]}
                onPress={() => handlePickImage(true)}
                disabled={isProcessingImage}
              >
                <View style={[addTransactionStyles.iconCircle, { backgroundColor: COLORS.primary }]}>
                  {isProcessingImage ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Icon name="camera" size={18} color={COLORS.white} />
                  )}
                </View>
                <Text style={addTransactionStyles.receiptCardText}>Scan</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  addTransactionStyles.receiptCard,
                  isProcessingImage && { opacity: 0.6 }
                ]}
                onPress={() => handlePickImage(false)}
                disabled={isProcessingImage}
              >
                <View style={[addTransactionStyles.iconCircle, { backgroundColor: COLORS.secondary }]}>
                  {isProcessingImage ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Icon name="image" size={18} color={COLORS.white} />
                  )}
                </View>
                <Text style={addTransactionStyles.receiptCardText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- Bulk Import Quick Action --- */}
          <View style={addTransactionStyles.bulkSection}>
            <Text style={addTransactionStyles.labelSmall}>BULK IMPORT (EXCEL/TEXT)</Text>
            <TouchableOpacity
              style={addTransactionStyles.bulkCard}
              onPress={() => setIsImportModalVisible(true)}
            >
              <View style={[addTransactionStyles.iconCircle, { backgroundColor: COLORS.accent }]}>
                <Icon name="file-text" size={18} color={COLORS.white} />
              </View>
              <View style={addTransactionStyles.bulkCardInfo}>
                <Text style={addTransactionStyles.bulkCardTitle}>Paste from Excel/Notes</Text>
                <Text style={addTransactionStyles.bulkCardSub}>AI will auto-organize your messy data</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          {/* --- Session History --- */}
          {sessionItems.length > 0 && (
            <View style={addTransactionStyles.sessionHistory}>
              <View style={addTransactionStyles.historyHeader}>
                <Text style={addTransactionStyles.historyTitle}>RECENTLY ADDED</Text>
                <View style={addTransactionStyles.itemCount}>
                  <Text style={addTransactionStyles.itemCountText}>{sessionItems.length}</Text>
                </View>
              </View>

              {sessionItems.map((item, index) => (
                <View key={index} style={addTransactionStyles.historyItem}>
                  <View style={addTransactionStyles.itemDot} />
                  <Text style={addTransactionStyles.itemName}>{item.name}</Text>
                  <Text style={addTransactionStyles.itemAmount}>- RM {item.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* --- Bulk Import Modal --- */}
        <Modal
          visible={isImportModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsImportModalVisible(false)}
        >
          <View style={addTransactionStyles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <View style={addTransactionStyles.modalContent}>
                <View style={addTransactionStyles.modalHeader}>
                  <Text style={addTransactionStyles.modalTitle}>Bulk Import</Text>
                  <TouchableOpacity onPress={() => setIsImportModalVisible(false)}>
                    <Icon name="x" size={24} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={addTransactionStyles.bulkInput}
                  multiline
                  placeholder="Paste your transaction history here (e.g. from Excel, Notes, or WhatsApp)..."
                  placeholderTextColor={COLORS.darkGray}
                  value={bulkTextInput}
                  onChangeText={setBulkTextInput}
                />

                <View style={addTransactionStyles.importActions}>
                  <TouchableOpacity
                    style={[addTransactionStyles.importBtn, isImporting && { opacity: 0.7 }]}
                    onPress={handleBulkImport}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <>
                        <Text style={addTransactionStyles.importBtnText}>Process with AI</Text>
                        <Icon name="zap" size={18} color={COLORS.white} />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={addTransactionStyles.cancelBtn}
                    onPress={() => setIsImportModalVisible(false)}
                  >
                    <Text style={addTransactionStyles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const addTransactionStyles = StyleSheet.create({
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
    fontWeight: '800',
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
    marginBottom: 25,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accent,
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.accent,
    padding: 0,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  balanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  addMoneyLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.info,
    textDecorationLine: 'underline',
  },
  textInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  actionRow: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  receiptSection: {
    marginBottom: 30,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.darkGray,
    marginBottom: 15,
    letterSpacing: 1,
    paddingHorizontal: 5,
    opacity: 0.7,
  },
  receiptRow: {
    flexDirection: 'row',
    gap: 12,
  },
  receiptCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptCardText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
  },
  bulkSection: {
    marginBottom: 30,
  },
  bulkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 18,
    elevation: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  bulkCardInfo: {
    flex: 1,
    marginLeft: 15,
  },
  bulkCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accent,
  },
  bulkCardSub: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
    fontWeight: '600',
  },
  sessionHistory: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 20,
    elevation: 2,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 40,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.darkGray,
    letterSpacing: 1.2,
  },
  itemCount: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accent,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E74C3C',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  successText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.accent,
  },
  resultBox: {
    backgroundColor: COLORS.primary + '15',
    width: '100%',
    padding: 20,
    borderRadius: 25,
    marginBottom: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.darkGray,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  categoryBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  subCategoryText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accent,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  addMoreButton: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: COLORS.accent,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
  },
  addMoreText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
  finishButton: {
    flex: 1,
    backgroundColor: COLORS.accent + '15',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 25,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.accent,
  },
  bulkInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    padding: 20,
    height: 300,
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  importActions: {
    marginTop: 25,
    gap: 12,
  },
  importBtn: {
    backgroundColor: COLORS.accent,
    height: 55,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  importBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
  },
  cancelBtn: {
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontWeight: '800',
  },
});