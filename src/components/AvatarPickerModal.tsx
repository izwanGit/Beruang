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
  Alert,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { BEAR_AVATARS, DEFAULT_AVATARS } from '../constants/avatars';
import { calculateLevel, getAvatarForLevel } from '../utils/gamificationUtils';

type AvatarPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (avatar: string) => void;
  currentAvatar: string;
  userXP: number; // Added userXP
};

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentAvatar,
  userXP,
}) => {
  const currentLevel = calculateLevel(userXP);
  const bearAvatarKeys = Object.keys(BEAR_AVATARS);

  // Highlight the level-based bear if they are in 'auto-evolve' mode
  const effectiveCurrentAvatar = currentAvatar === 'bear'
    ? getAvatarForLevel(currentLevel)
    : currentAvatar;

  const handleSelectBear = (key: string, requiredLevel: number) => {
    if (currentLevel >= requiredLevel) {
      onSelect(key);
    } else {
      Alert.alert(
        'Locked Avatar',
        `Save more and reach Level ${requiredLevel} to unlock this Bear!`
      );
    }
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
          <Text style={styles.title}>Choose an Avatar</Text>
          <ScrollView contentContainerStyle={styles.avatarGrid}>
            <Text style={styles.sectionTitle}>Bear Progression (Lvl {currentLevel})</Text>
            <View style={styles.gridRow}>
              {bearAvatarKeys.map((key) => {
                const requiredLevel = parseInt(key.split('_')[2]);
                const isLocked = currentLevel < requiredLevel;

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.avatarCell,
                      effectiveCurrentAvatar === key && styles.avatarCellSelected,
                      isLocked && styles.avatarCellLocked,
                    ]}
                    onPress={() => handleSelectBear(key, requiredLevel)}
                  >
                    <Image
                      source={BEAR_AVATARS[key]}
                      style={[styles.bearImage, isLocked && { opacity: 0.3 }]}
                    />
                    {isLocked && (
                      <View style={styles.lockBadge}>
                        <MaterialCommunityIcon name="lock" size={14} color={COLORS.white} />
                        <Text style={styles.lockText}>{requiredLevel}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
  avatarCellLocked: {
    backgroundColor: '#E0E0E0',
  },
  bearImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    bottom: 5,
  },
  lockText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
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
