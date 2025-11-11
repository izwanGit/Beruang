// src/components/AvatarPickerModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';

type AvatarPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (avatar: string) => void;
  currentAvatar: string;
};

// A list of available avatars
const AVATARS = [
  'bear',
  'cat',
  'dog',
  'rabbit',
  'panda',
  'koala',
  'account',
  'account-circle',
  'face-man-profile',
  'face-woman-profile',
  'alien',
  'robot-happy',
  'ghost',
  'rocket',
  'star',
  'heart',
];

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentAvatar,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Choose an Avatar</Text>
          <ScrollView contentContainerStyle={styles.avatarGrid}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar}
                style={[
                  styles.avatarCell,
                  currentAvatar === avatar && styles.avatarCellSelected,
                ]}
                onPress={() => onSelect(avatar)}
              >
                <MaterialCommunityIcon name={avatar} size={40} color={COLORS.accent} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
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
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  avatarCell: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCellSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.primary,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
});

