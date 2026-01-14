// src/components/InitialBalanceModal.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';

type InitialBalanceModalProps = {
  visible: boolean;
  onSubmit: (amount: number) => void;
};

export const InitialBalanceModal: React.FC<InitialBalanceModalProps> = ({
  visible,
  onSubmit,
}) => {
  // Store the raw integer value (cents) instead of a direct string
  const [rawValue, setRawValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const formatAmount = (value: number) => {
    return (value / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleTextChange = (text: string) => {
    // Remove non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setRawValue(Number(numericValue));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    onSubmit(rawValue / 100);
    // The modal will be closed by the App.tsx's logic
  };

  const displayValue = formatAmount(rawValue); // e.g. "0.00", "1.23"

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={() => { }} // Disallow closing
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Icon name="wallet-plus" size={40} color={COLORS.accent} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome to Beruang!</Text>

            {/* Description */}
            <Text style={styles.description}>
              Let's get started by setting your current total balance. This will be
              your starting point.
            </Text>

            {/* Amount Input */}
            <View style={styles.inputView}>
              <Text style={styles.currencySymbol}>RM</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={displayValue}
                onChangeText={handleTextChange}
                editable={!isLoading}
                autoFocus={true}
                caretHidden={true} // Hide caret since we format on the fly
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.saveButton, isLoading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Set Starting Balance</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    width: '100%',
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
  saveButton: {
    backgroundColor: COLORS.accent,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    width: '100%',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});