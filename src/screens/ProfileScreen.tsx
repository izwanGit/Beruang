// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { BEAR_AVATARS, isBearAvatar } from '../constants/avatars';
import { Screen } from './HomeScreen';
import { User } from '../../App';
import { EditProfileModal } from '../components/EditProfileModal';
import { AvatarPickerModal } from '../components/AvatarPickerModal';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

const { width } = Dimensions.get('window');

type ProfileScreenProps = {
  onNavigate: (screen: Screen) => void;
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
  onLogout: () => void;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
};

// Reusable row for settings with enhanced aesthetics
const SettingRow = ({
  icon,
  text,
  onPress,
  color = COLORS.accent,
  isLast = false,
}: {
  icon: string;
  text: string;
  onPress: () => void;
  color?: string;
  isLast?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.settingRow, isLast && { borderBottomWidth: 0 }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.settingIconContainer, { backgroundColor: color + '15' }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.settingText, { color: color }]}>{text}</Text>
    {color === COLORS.accent && (
      <Icon name="chevron-right" size={20} color={COLORS.darkGray} />
    )}
  </TouchableOpacity>
);

export const ProfileScreen = ({
  onNavigate,
  user,
  onUpdateUser,
  onLogout,
  navigation,
}: ProfileScreenProps) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const handleSaveProfile = (updatedData: Partial<User>) => {
    onUpdateUser(updatedData);
    setEditModalVisible(false);
  };

  const handleSelectAvatar = (avatar: string) => {
    onUpdateUser({ avatar });
    setAvatarModalVisible(false);
  };

  const handleRetakeQuestionnaire = () => {
    navigation?.navigate('Onboarding', { isRetake: true, initialData: user });
  };

  return (
    <View style={styles.container}>
      {/* --- Modals --- */}
      <EditProfileModal
        visible={editModalVisible}
        user={user}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
        onAvatarPress={() => setAvatarModalVisible(true)}
      />
      <AvatarPickerModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onSelect={handleSelectAvatar}
        currentAvatar={user.avatar}
      />

      {/* --- Main Screen --- */}
      <SafeAreaView style={styles.safeAreaContent} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

        {/* --- Header (Matching Expenses Page) --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate('Home')} style={styles.headerButton}>
            <Icon name="arrow-left" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.headerButton}>
            <Icon name="edit-3" size={22} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* --- Profile Top Section --- */}
          <View style={styles.profileHero}>
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(true)}
              style={styles.avatarWrapper}
              activeOpacity={0.9}
            >
              <View style={styles.avatarContainer}>
                {isBearAvatar(user.avatar) ? (
                  <Image
                    source={BEAR_AVATARS[user.avatar]}
                    style={styles.avatarImage}
                  />
                ) : (
                  <MaterialCommunityIcon name={user.avatar || 'bear'} size={70} color={COLORS.accent} />
                )}
                <View style={styles.editBadge}>
                  <Icon name="camera" size={14} color={COLORS.white} />
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.heroTextContainer}>
              <Text style={styles.nameText}>{user.name || 'Beruang User'}</Text>
              <View style={styles.occupationBadge}>
                <Text style={styles.occupationText}>{user.occupation || 'Finance Enthusiast'}</Text>
              </View>
            </View>

            {/* Level Progress Indicator (Visual) */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelLabel}>SAVER LEVEL 4</Text>
                <Text style={styles.experienceText}>1,250 / 2,000 XP</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '62.5%' }]} />
              </View>
            </View>
          </View>

          {/* --- User Details Section --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Information</Text>
            <View style={styles.premiumCard}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrapper, { backgroundColor: '#E3F2FD' }]}>
                  <Icon name="calendar" size={18} color="#1E88E5" />
                </View>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValueText}>{user.age || 'N/A'} years old</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrapper, { backgroundColor: '#F3E5F5' }]}>
                  <Icon name="map-pin" size={18} color="#8E24AA" />
                </View>
                <Text style={styles.infoLabel}>State</Text>
                <Text style={styles.infoValueText}>{user.state || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoIconWrapper, { backgroundColor: '#FFF3E0' }]}>
                  <Icon name="briefcase" size={18} color="#FB8C00" />
                </View>
                <Text style={styles.infoLabel}>Occupation</Text>
                <Text style={styles.infoValueText}>{user.occupation || 'N/A'}</Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.infoIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                  <Icon name="dollar-sign" size={18} color="#43A047" />
                </View>
                <Text style={styles.infoLabel}>Monthly Income</Text>
                <Text style={[styles.infoValueText, { fontWeight: 'bold', color: COLORS.success }]}>
                  RM {user.monthlyIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* --- App Settings & Support --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account & Settings</Text>
            <View style={styles.premiumCard}>
              <SettingRow
                icon="refresh-cw"
                text="Retake Financial Assessment"
                onPress={handleRetakeQuestionnaire}
              />
              <SettingRow
                icon="shield"
                text="Privacy & Security"
                onPress={() => Alert.alert('Coming Soon', 'Security settings are under development.')}
              />
              <SettingRow
                icon="bell"
                text="Notifications"
                onPress={() => Alert.alert('Coming Soon', 'Notification settings are under development.')}
              />
              <SettingRow
                icon="help-circle"
                text="Help Center"
                onPress={() => Alert.alert('Coming Soon', 'Support center is under development.')}
                isLast={true}
              />
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={onLogout}
              activeOpacity={0.8}
            >
              <Icon name="log-out" size={20} color={COLORS.danger} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>Beruang App v1.0 • Made With Passion</Text>
        </ScrollView>
      </SafeAreaView>

      {/* --- Bottom Navigation --- */}
      <SafeAreaView style={styles.bottomNavSafeArea} edges={['bottom']}>
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('Home')}
          >
            <Icon name="home" size={26} color={COLORS.darkGray} />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('Expenses')}
          >
            <Icon name="pie-chart" size={26} color={COLORS.darkGray} />
            <Text style={styles.navText}>Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('Chatbot')}
          >
            <Icon name="message-square" size={26} color={COLORS.darkGray} />
            <Text style={styles.navText}>Chatbot</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate('Profile')}
          >
            <Icon name="user" size={26} color={COLORS.accent} />
            <Text style={styles.navTextActive}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    paddingBottom: 100,
  },
  profileHero: {
    backgroundColor: COLORS.white,
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  avatarWrapper: {
    marginBottom: 15,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
    position: 'relative',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  heroTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.accent,
    marginBottom: 6,
  },
  occupationBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  occupationText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
    opacity: 0.9,
  },
  levelProgressContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  experienceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.darkGray,
    marginBottom: 12,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  premiumCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
    flex: 1,
  },
  infoValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accent,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    marginTop: 25,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE3E3',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 35,
    fontWeight: '500',
  },
  bottomNavSafeArea: {
    backgroundColor: COLORS.white,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 10,
    height: 65,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
    fontWeight: 'bold',
  },
});
