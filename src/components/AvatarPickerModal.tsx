// src/components/AvatarPickerModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { BEAR_AVATARS, DEFAULT_AVATARS } from '../constants/avatars';

type AvatarPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (avatar: string) => void;
  currentAvatar: string;
};

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentAvatar,
}) => {
  const bearAvatarKeys = Object.keys(BEAR_AVATARS);

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
            <Text style={styles.sectionTitle}>Level Avatars</Text>
            <View style={styles.gridRow}>
              {bearAvatarKeys.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.avatarCell,
                    currentAvatar === key && styles.avatarCellSelected,
                  ]}
                  onPress={() => onSelect(key)}
                >
                  <Image source={BEAR_AVATARS[key]} style={styles.bearImage} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Default Icons</Text>
            <View style={styles.gridRow}>
              {DEFAULT_AVATARS.map((avatar) => (
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
            </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  avatarGrid: {
    paddingBottom: 20,
  },
  gridRow: {
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
    overflow: 'hidden',
  },
  avatarCellSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.primary,
  },
  bearImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
