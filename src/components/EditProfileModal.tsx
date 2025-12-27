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
  Image,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { User } from '../../App';
import { BEAR_AVATARS, isBearAvatar } from '../constants/avatars';
import { calculateLevel, getAvatarForLevel } from '../utils/gamificationUtils';

type EditProfileModalProps = {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSave: (updatedData: Partial<User>) => void;
  onAvatarPress: () => void;
  onRetakeAssessment: () => void; // Added
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
  onAvatarPress,
  onRetakeAssessment,
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
    onSave({ name });
  };

  const level = calculateLevel(user.totalXP || 0);
  const effectiveAvatar = user.avatar === 'bear'
    ? getAvatarForLevel(level)
    : user.avatar;


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
              <View style={[styles.avatarCircle, { borderColor: COLORS.primary, borderWidth: 2 }]}>
                {isBearAvatar(effectiveAvatar) ? (
                  <View style={{ width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden' }}>
                    <Image source={BEAR_AVATARS[effectiveAvatar]} style={{ width: '100%', height: '100%' }} />
                  </View>
                ) : (
                  <MaterialCommunityIcon name={effectiveAvatar || 'account'} size={40} color={COLORS.accent} />
                )}
                <View style={styles.editIconBadge}>
                  <MaterialCommunityIcon name="camera" size={12} color={COLORS.white} />
                </View>
              </View>
              <Text style={styles.avatarLink}>Update Appearance</Text>
            </TouchableOpacity>

            {/* --- Inputs --- */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="How should we call you?"
                placeholderTextColor="#BDBDBD"
              />
            </View>

            <View style={styles.infoBox}>
              <MaterialCommunityIcon name="information-outline" size={16} color="#666" />
              <Text style={styles.infoText}>
                Other details like Occupation and State are managed via the Financial Assessment.
              </Text>
            </View>

            {/* --- Action Buttons --- */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => {
                onClose();
                onRetakeAssessment();
              }}
            >
              <MaterialCommunityIcon name="refresh" size={18} color={COLORS.accent} />
              <Text style={styles.retakeBtnText}>Retake Financial Assessment</Text>
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  retakeBtnText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 14,
    marginLeft: 8,
  },
});

