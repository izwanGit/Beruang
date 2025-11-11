// src/components/BalanceAllocationModal.tsx
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../constants/colors';

type BalanceAllocationModalProps = {
  visible: boolean;
  balance: number;
  onAllocate: (option: 'savings' | 'budget') => void;
};

export const BalanceAllocationModal = ({
  visible,
  balance,
  onAllocate,
}: BalanceAllocationModalProps) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon name="dollar-sign" size={40} color={COLORS.success} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Leftover Balance</Text>
          
          {/* Balance Amount */}
          <Text style={styles.balanceText}>RM {balance.toFixed(2)}</Text>
          
          {/* Description */}
          <Text style={styles.description}>
            You have leftover balance from last month. How would you like to allocate it?
          </Text>

          {/* Option 1: All to Savings */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => onAllocate('savings')}
          >
            <View style={styles.optionContent}>
              <Icon name="piggy-bank" size={24} color={COLORS.success} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Plan to Save All</Text>
                <Text style={styles.optionSubtitle}>
                  Add RM {balance.toFixed(2)} as income. You can save it manually later.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Option 2: Apply 50/30/20 */}
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => onAllocate('budget')}
          >
            <View style={styles.optionContent}>
              <Icon name="pie-chart" size={24} color={COLORS.accent} />
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Apply 50/30/20 Budget</Text>
                <Text style={styles.optionSubtitle}>
                  Add RM {balance.toFixed(2)} as income. Budget: Needs RM {(balance * 0.5).toFixed(2)}, Wants RM {(balance * 0.3).toFixed(2)}, Savings RM {(balance * 0.2).toFixed(2)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 15,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  optionButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 5,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
});