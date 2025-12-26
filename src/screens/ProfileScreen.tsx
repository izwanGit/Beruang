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
  transactions: Array<any>;
  onUpdateUser: (updatedData: Partial<User>) => void;
  onLogout: () => void;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
};

// Stat Card Component
const StatCard = ({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={16} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Reusable row for settings with enhanced aesthetics
const SettingRow = ({
  icon,
  text,
  onPress,
  color = COLORS.accent,
  isLast = false,
  description,
}: {
  icon: string;
  text: string;
  onPress: () => void;
  color?: string;
  isLast?: boolean;
  description?: string;
}) => (
  <TouchableOpacity
    style={[styles.settingRow, isLast && { borderBottomWidth: 0 }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.settingIconContainer, { backgroundColor: color + '10' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <View style={styles.settingTextContainer}>
      <Text style={[styles.settingText, { color: color === COLORS.accent ? '#1A1A1A' : color }]}>{text}</Text>
      {description && <Text style={styles.settingDescription}>{description}</Text>}
    </View>
    <Icon name="chevron-right" size={18} color="#C1C1C1" />
  </TouchableOpacity>
);

export const ProfileScreen = ({
  onNavigate,
  user,
  transactions,
  onUpdateUser,
  onLogout,
  navigation,
}: ProfileScreenProps) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  // Calculate real savings rate
  const freshIncome = transactions
    .filter(t => t.type === 'income' && !t.isCarriedOver && t.date.startsWith(new Date().toISOString().substring(0, 7)))
    .reduce((sum, t) => sum + t.amount, 0);

  const savedAmount = transactions
    .filter(t => t.type === 'expense' && t.category === 'savings' && t.date.startsWith(new Date().toISOString().substring(0, 7)))
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = freshIncome > 0 ? Math.round((savedAmount / freshIncome) * 100) : 0;

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

        {/* --- Reverted Standard Header --- */}
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
          {/* --- Updated Hero Section with COLORS.primary --- */}
          <View style={styles.heroWrapper}>
            <View style={styles.heroBackground}>
              <View style={styles.heroContent}>
                <TouchableOpacity
                  onPress={() => setAvatarModalVisible(true)}
                  style={styles.avatarWrapper}
                  activeOpacity={0.9}
                >
                  <View style={[styles.avatarMain, { borderColor: COLORS.primary, borderWidth: 3 }]}>
                    {isBearAvatar(user.avatar) ? (
                      <Image source={BEAR_AVATARS[user.avatar]} style={styles.avatarImg} />
                    ) : (
                      <MaterialCommunityIcon name={user.avatar || 'bear'} size={60} color={COLORS.accent} />
                    )}
                    <View style={[styles.proBadge, { backgroundColor: COLORS.primary }]}>
                      <Icon name="check" size={10} color={COLORS.accent} />
                    </View>
                  </View>
                </TouchableOpacity>

                <Text style={styles.userName}>{user.name || 'Beruang User'}</Text>
                <Text style={styles.userHandle}>@{user.name?.toLowerCase().replace(/\s/g, '') || 'beruang'}</Text>

                <View style={styles.badgeRow}>
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.primary }]}>
                    <Text style={[styles.statusBadgeText, { color: COLORS.accent, fontWeight: '900' }]}>
                      {user.occupation?.toUpperCase() || 'FINANCER'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.yellow }]}>
                    <Text style={[styles.statusBadgeText, { color: COLORS.accent, fontWeight: '900' }]}>PRO MEMBER</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.mainContent}>
            {/* --- Stat Cards (Using primary for some) --- */}
            <View style={styles.statsContainer}>
              <StatCard label="Savings Rate" value={`${savingsRate}%`} icon="trending-up" color="#4CAF50" />
              <StatCard label="Monthly Income" value={`RM${Math.round(user.monthlyIncome / 1000)}k`} icon="dollar-sign" color="#2196F3" />
              <StatCard label="XP Level" value="Lvl 4" icon="star" color={COLORS.secondary} />
            </View>

            {/* --- Level Progress (Using primary) --- */}
            <View style={styles.premiumCard}>
              <View style={styles.levelHeader}>
                <View>
                  <Text style={styles.cardHeading}>Financial Mastery</Text>
                  <Text style={styles.cardSubheading}>1,250 / 2,000 XP to Level 5</Text>
                </View>
                <View style={[styles.medalContainer, { backgroundColor: COLORS.primary + '30' }]}>
                  <MaterialCommunityIcon name="medal" size={24} color={COLORS.accent} />
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: COLORS.primary + '20' }]}>
                  <View style={[styles.progressFill, { width: '62.5%', backgroundColor: COLORS.primary }]} />
                </View>
              </View>
            </View>

            {/* --- Information Section --- */}
            <Text style={styles.sectionLabel}>ACCOUNT DETAILS</Text>
            <View style={styles.actionCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Employment</Text>
                <Text style={styles.detailValue}>{user.occupation || 'Not Set'}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{user.state || 'Malaysia'}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Monthly Income</Text>
                <Text style={[styles.detailValue, { color: COLORS.accent, fontWeight: '800' }]}>
                  RM {user.monthlyIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* --- Settings Options --- */}
            <Text style={styles.sectionLabel}>PREFERENCES & SECURITY</Text>
            <View style={styles.actionCard}>
              <SettingRow
                icon="refresh-cw"
                text="Retake Assessment"
                description="Update your financial profile and goals"
                onPress={handleRetakeQuestionnaire}
                color={COLORS.accent}
              />
              <SettingRow
                icon="lock"
                text="Privacy Settings"
                description="Manage your data and security"
                onPress={() => Alert.alert('Coming Soon', 'Security settings are under development.')}
              />
              <SettingRow
                icon="bell"
                text="Notifications"
                description="Control your alerts and reminders"
                onPress={() => Alert.alert('Coming Soon', 'Notification settings are under development.')}
                isLast={true}
              />
            </View>

            <TouchableOpacity style={styles.logOutBtn} onPress={onLogout} activeOpacity={0.8}>
              <Icon name="log-out" size={18} color="#FF5252" />
              <Text style={styles.logOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionInfo}>
              Beruang v1.0.4 • Made With Passion
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* --- Reverted Standard Bottom Navigation --- */}
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
    paddingBottom: 20,
  },
  heroWrapper: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroBackground: {
    backgroundColor: COLORS.accent,
    borderRadius: 30,
    paddingVertical: 35,
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  heroContent: {
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarMain: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  proBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 3,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: '700',
    marginTop: 2,
  },
  premiumCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  cardSubheading: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '600',
    marginTop: 2,
  },
  medalContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9E9E9E',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1.2,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#757575',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 18,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingDescription: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
    marginTop: 2,
  },
  logOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: '#FFEEF0',
    marginTop: 10,
    marginBottom: 30,
  },
  logOutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF5252',
    marginLeft: 8,
  },
  versionInfo: {
    textAlign: 'center',
    fontSize: 11,
    color: '#BDBDBD',
    fontWeight: '600',
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
