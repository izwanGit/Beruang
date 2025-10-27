// src/components/MessageModal.tsx
import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';

// --- Reusable Message Modal Component ---
type MessageModalProps = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
};

export const MessageModal: React.FC<MessageModalProps> = ({
  visible,
  message,
  onDismiss,
}) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onDismiss}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalText}>{message}</Text>
        <TouchableOpacity style={styles.modalButton} onPress={onDismiss}>
          <Text style={styles.modalButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// --- Shared Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    width: '80%',
    alignItems: 'center',
    elevation: 10,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});