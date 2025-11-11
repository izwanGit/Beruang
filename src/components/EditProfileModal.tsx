// src/components/EditProfileModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { User } from '../../App';

type EditProfileModalProps = {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updatedData: Partial<User>) => void;
  onAvatarPress: () => void;
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
  onAvatarPress,
}) => {
  const [name, setName] = useState(user.name);
  const [occupation, setOccupation] = useState(user.occupation);

  // Update state if the user prop changes
  useEffect(() => {
    if (visible) {
      setName(user.name);
      setOccupation(user.occupation);
    }
  }, [user, visible]);

  const handleSave = () => {
    onSave({ name, occupation });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Edit Profile</Text>

          {/* --- Avatar Edit --- */}
          <Text style={styles.label}>Avatar</Text>
          <TouchableOpacity style={styles.avatarButton} onPress={onAvatarPress}>
            <MaterialCommunityIcon name={user.avatar} size={40} color={COLORS.accent} />
            <Text style={styles.avatarButtonText}>Change Avatar</Text>
          </TouchableOpacity>

          {/* --- Name Edit --- */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
            placeholderTextColor={COLORS.darkGray}
          />

          {/* --- Occupation Edit --- */}
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Your Occupation"
            placeholderTextColor={COLORS.darkGray}
          />

          {/* --- Action Buttons --- */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: COLORS.accent,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    marginLeft: 15,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    marginRight: 10,
  },
  cancelButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.success,
    marginLeft: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

