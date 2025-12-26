// src/components/EditProfileModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcon name="close" size={24} color="#C1C1C1" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* --- Avatar Edit --- */}
            <TouchableOpacity style={styles.avatarSection} onPress={onAvatarPress} activeOpacity={0.8}>
              <View style={styles.avatarCircle}>
                <MaterialCommunityIcon name={user.avatar || 'account'} size={40} color={COLORS.accent} />
                <View style={styles.editIconBadge}>
                  <MaterialCommunityIcon name="pencil" size={12} color={COLORS.white} />
                </View>
              </View>
              <Text style={styles.avatarLink}>Change Profile Picture</Text>
            </TouchableOpacity>

            {/* --- Inputs --- */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#BDBDBD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation</Text>
              <TextInput
                style={styles.input}
                value={occupation}
                onChangeText={setOccupation}
                placeholder="Enter your profession"
                placeholderTextColor="#BDBDBD"
              />
            </View>

            {/* --- Action Buttons --- */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  content: {
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#757575',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
  cancelBtn: {
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#9E9E9E',
    fontWeight: '700',
    fontSize: 15,
  },
});

