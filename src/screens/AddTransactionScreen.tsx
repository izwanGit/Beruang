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
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  onAddTransaction: (transaction: any, showMsg?: boolean) => void;
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
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'android' ? 50 : Math.max(insets.top, 20) + 12;

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
  const [exceedBalanceModal, setExceedBalanceModal] = useState<{
    visible: boolean;
    total: number;
    itemCount: number;
  }>({ visible: false, total: 0, itemCount: 0 });
  const [bulkImportResult, setBulkImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
  } | null>(null);
  const [xpSummary, setXpSummary] = useState<{
    visible: boolean;
    itemsLogged: number;
    xpGained: number;
    overflows: number;
    overflowPenalty: number;
    savingsDips: number;
    savingsPenalty: number;
    netXp: number;
  } | null>(null);

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
        // --- NEW VALIDATION: Check for "Invalid" Receipt ---
        // If amount is 0 AND we have no good description, it's likely a bad scan (e.g. random object)
        const candidateDesc = data.description || data.merchant || '';
        const isUnknown = !candidateDesc || candidateDesc === 'Unknown Transaction';

        if (data.amount === 0 && isUnknown) {
          // It's a bad scan
          showMessage('Invalid receipt. Please try scanning a valid receipt again.');
          // Do NOT set state, leave inputs empty
          return;
        }

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

    Keyboard.dismiss(); // Ensure keyboard is down before switching focus to progress/alerts
    setIsImporting(true);

    try {
      const response = await fetch(IMPORT_DATA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ text: bulkTextInput })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Backend error');
      }

      const data = await response.json();

      if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
        // PRE-CHECK: Calculate total and compare with balance
        const total = data.transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

        if (total > monthlyBalance) {
          // Close import modal first
          setIsImportModalVisible(false);
          setIsImporting(false);

          // Give iOS 800ms to finish modal unmount/animations
          setTimeout(() => {
            setExceedBalanceModal({
              visible: true,
              total: total,
              itemCount: data.transactions.length,
            });
          }, 800);
          return;
        }



        let importedCount = 0;
        let skippedCount = 0;
        let xpGained = 0;
        let overflows = 0;
        let savingsDips = 0;

        // XP Constants (same as App.tsx)
        const XP_PER_TRANSACTION = 10;
        const OVERFLOW_PENALTY = -250;
        const SAVINGS_DIP_PENALTY = -500;

        // Process each transaction through local TensorFlow (same as manual entry)
        for (const t of data.transactions) {
          const result = await categorizeTransaction(t.name || 'Unknown');

          // Check budget accommodation (same as manual entry)
          if (canAccommodateBudget) {
            const canProceed = canAccommodateBudget(t.amount, result.category as 'needs' | 'wants');
            if (!canProceed) {
              skippedCount++;
              // Track as overflow (budget full = overflow)
              overflows++;
              continue; // Skip this transaction if budget is full
            }
          }

          // Add transaction with category from local AI (silent - no popups)
          onAddTransaction({
            icon: 'shopping-cart',
            name: t.name,
            date: t.date || new Date().toISOString().split('T')[0],
            amount: t.amount,
            type: 'expense',
            category: result.category,
            subCategory: result.subCategory,
          }, false); // false = suppress modal feedback

          // Track XP gain
          xpGained += XP_PER_TRANSACTION;
          importedCount++;
        }

        if (importedCount === 0) {
          // All skipped - show feedback, don't navigate away
          showMessage('No items imported - budget categories are full');
          return;
        }

        setIsImportModalVisible(false);
        setIsImporting(false);
        setBulkTextInput('');

        // Calculate penalties
        const overflowPenalty = overflows * OVERFLOW_PENALTY;
        const savingsPenalty = savingsDips * SAVINGS_DIP_PENALTY;
        const netXp = xpGained + overflowPenalty + savingsPenalty;

        // Show XP Summary Modal FIRST
        setXpSummary({
          visible: true,
          itemsLogged: importedCount,
          xpGained: xpGained,
          overflows: overflows,
          overflowPenalty: overflowPenalty,
          savingsDips: savingsDips,
          savingsPenalty: savingsPenalty,
          netXp: netXp,
        });

        // Store result for after modal is dismissed
        setBulkImportResult({ importedCount, skippedCount });
      } else {
        throw new Error('No transactions found');
      }

    } catch (error: any) {
      console.error(error);
      setIsImportModalVisible(false);
      setIsImporting(false);

      // Delay error message until modal finishes closing
      setTimeout(() => {
        showMessage(error.message || 'Failed to import data. Try being more specific.');
      }, 500);
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={addTransactionStyles.safeArea}>
        {/* --- Standardized Header --- */}
        <View style={[addTransactionStyles.header, { paddingTop: headerTopPadding, height: 60 + headerTopPadding }]}>
          <TouchableOpacity onPress={onBack} style={addTransactionStyles.headerButton}>
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
            {bulkImportResult ? (
              // BULK IMPORT SUCCESS STATE
              <View style={addTransactionStyles.successState}>
                <View style={addTransactionStyles.successHeader}>
                  <View style={addTransactionStyles.checkCircle}>
                    <Icon name="check" size={28} color={COLORS.white} />
                  </View>
                  <Text style={addTransactionStyles.successText}>
                    {bulkImportResult.importedCount} Item{bulkImportResult.importedCount > 1 ? 's' : ''} Imported!
                  </Text>
                </View>

                {bulkImportResult.skippedCount > 0 && (
                  <View style={addTransactionStyles.resultBox}>
                    <Text style={addTransactionStyles.resultLabel}>NOTE</Text>
                    <Text style={{ color: COLORS.darkGray, fontSize: 13 }}>
                      {bulkImportResult.skippedCount} item{bulkImportResult.skippedCount > 1 ? 's' : ''} skipped (budget full)
                    </Text>
                  </View>
                )}

                <View style={addTransactionStyles.buttonRow}>
                  <TouchableOpacity
                    style={addTransactionStyles.addMoreButton}
                    onPress={() => {
                      setBulkImportResult(null);
                      setIsImportModalVisible(true);
                    }}
                  >
                    <Icon name="plus-circle" size={18} color={COLORS.white} />
                    <Text style={addTransactionStyles.addMoreText}>Add More</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={addTransactionStyles.finishButton}
                    onPress={onBack}
                  >
                    <Text style={addTransactionStyles.finishText}>I'm Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !lastAdded ? (
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
                      (isLoading || (amountCents / 100) > monthlyBalance) && { opacity: 0.5 },
                    ]}
                    onPress={handleSaveTransaction}
                    disabled={isLoading || (amountCents / 100) > monthlyBalance}
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
      </View>

      {/* --- Bulk Import Modal --- Conditionally rendered for clean unmount */}
      {isImportModalVisible && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsImportModalVisible(false)}
        >
          <View style={addTransactionStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      )}

      {/* --- Exceed Balance Modal --- restored with conditional rendering */}
      {exceedBalanceModal.visible && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setExceedBalanceModal(prev => ({ ...prev, visible: false }))}
        >
          <View style={addTransactionStyles.modalOverlay}>
            <View style={addTransactionStyles.exceedModalContent}>
              <View style={addTransactionStyles.exceedIconCircle}>
                <Icon name="alert-triangle" size={32} color="#E74C3C" />
              </View>
              <Text style={addTransactionStyles.exceedTitle}>Insufficient Balance</Text>
              <Text style={addTransactionStyles.exceedDesc}>
                Your bulk import total exceeds your available balance.
              </Text>

              <View style={addTransactionStyles.exceedDetails}>
                <View style={addTransactionStyles.exceedRow}>
                  <Text style={addTransactionStyles.exceedLabel}>Items Found</Text>
                  <Text style={addTransactionStyles.exceedValue}>{exceedBalanceModal.itemCount}</Text>
                </View>
                <View style={addTransactionStyles.exceedRow}>
                  <Text style={addTransactionStyles.exceedLabel}>Total Amount</Text>
                  <Text style={[addTransactionStyles.exceedValue, { color: '#E74C3C' }]}>
                    RM {exceedBalanceModal.total.toFixed(2)}
                  </Text>
                </View>
                <View style={[addTransactionStyles.exceedRow, { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 12 }]}>
                  <Text style={addTransactionStyles.exceedLabel}>Your Balance</Text>
                  <Text style={addTransactionStyles.exceedValue}>RM {monthlyBalance.toFixed(2)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={addTransactionStyles.exceedBtn}
                onPress={() => {
                  setExceedBalanceModal({ visible: false, total: 0, itemCount: 0 });
                  setBulkTextInput('');
                  if (onNavigateToAddMoney) onNavigateToAddMoney();
                }}
              >
                <Icon name="plus-circle" size={18} color={COLORS.white} />
                <Text style={addTransactionStyles.exceedBtnText}>Add Money First</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={addTransactionStyles.exceedCancelBtn}
                onPress={() => {
                  setExceedBalanceModal({ visible: false, total: 0, itemCount: 0 });
                }}
              >
                <Text style={addTransactionStyles.exceedCancelText}>Cancel Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* --- XP Summary Modal for Bulk Import --- */}
      {xpSummary?.visible && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setXpSummary(null)}
        >
          <View style={addTransactionStyles.modalOverlay}>
            <View style={addTransactionStyles.xpModalContent}>
              <View style={[
                addTransactionStyles.xpHeader,
                { backgroundColor: xpSummary.netXp >= 0 ? '#4CAF50' : '#E74C3C' }
              ]}>
                <Icon
                  name={xpSummary.netXp >= 0 ? "trending-up" : "trending-down"}
                  size={32}
                  color={COLORS.white}
                />
                <Text style={addTransactionStyles.xpHeaderText}>
                  {xpSummary.netXp >= 0 ? 'XP Gained!' : 'XP Lost!'}
                </Text>
              </View>

              <View style={addTransactionStyles.xpBody}>
                <View style={addTransactionStyles.xpRow}>
                  <Text style={addTransactionStyles.xpLabel}>
                    {xpSummary.itemsLogged} item{xpSummary.itemsLogged > 1 ? 's' : ''} logged
                  </Text>
                  <Text style={[addTransactionStyles.xpValue, { color: '#4CAF50' }]}>
                    +{xpSummary.xpGained} XP
                  </Text>
                </View>

                {xpSummary.overflows > 0 && (
                  <View style={addTransactionStyles.xpRow}>
                    <Text style={addTransactionStyles.xpLabel}>
                      {xpSummary.overflows} overflow{xpSummary.overflows > 1 ? 's' : ''} (budget full)
                    </Text>
                    <Text style={[addTransactionStyles.xpValue, { color: '#E74C3C' }]}>
                      {xpSummary.overflowPenalty} XP
                    </Text>
                  </View>
                )}

                {xpSummary.savingsDips > 0 && (
                  <View style={addTransactionStyles.xpRow}>
                    <Text style={addTransactionStyles.xpLabel}>
                      {xpSummary.savingsDips} savings dip{xpSummary.savingsDips > 1 ? 's' : ''}
                    </Text>
                    <Text style={[addTransactionStyles.xpValue, { color: '#E74C3C' }]}>
                      {xpSummary.savingsPenalty} XP
                    </Text>
                  </View>
                )}

                <View style={[addTransactionStyles.xpRow, addTransactionStyles.xpTotal]}>
                  <Text style={addTransactionStyles.xpTotalLabel}>NET XP</Text>
                  <Text style={[
                    addTransactionStyles.xpTotalValue,
                    { color: xpSummary.netXp >= 0 ? '#4CAF50' : '#E74C3C' }
                  ]}>
                    {xpSummary.netXp >= 0 ? '+' : ''}{xpSummary.netXp} XP
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  addTransactionStyles.xpButton,
                  { backgroundColor: xpSummary.netXp >= 0 ? '#4CAF50' : COLORS.accent }
                ]}
                onPress={() => setXpSummary(null)}
              >
                <Text style={addTransactionStyles.xpButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View >
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
    color: COLORS.accent,
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
  // Exceed Balance Modal Styles
  exceedModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 30,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  exceedIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FDECEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  exceedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.accent,
    marginBottom: 8,
  },
  exceedDesc: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  exceedDetails: {
    width: '100%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  exceedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exceedLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  exceedValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accent,
  },
  exceedBtn: {
    backgroundColor: COLORS.accent,
    width: '100%',
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  exceedBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  exceedCancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exceedCancelText: {
    color: COLORS.darkGray,
    fontSize: 14,
    fontWeight: '700',
  },
  // XP Summary Modal Styles
  xpModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '85%',
    overflow: 'hidden',
  },
  xpHeader: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  xpHeaderText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  xpBody: {
    padding: 20,
    gap: 12,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    color: COLORS.darkGray,
    fontSize: 14,
    flex: 1,
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  xpTotal: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    marginTop: 8,
  },
  xpTotalLabel: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  xpTotalValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  xpButton: {
    margin: 20,
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  xpButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});