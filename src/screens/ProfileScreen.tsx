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
  Modal,
  Pressable,
  Share,
  Platform,
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
import { calculateLevel, calculateLevelProgress, getAvatarForLevel } from '../utils/gamificationUtils';

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
  const [xpInfoVisible, setXpInfoVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);

  // Calculate real savings rate
  const freshIncome = transactions
    .filter(t => t.type === 'income' && !t.isCarriedOver && t.date.startsWith(new Date().toISOString().substring(0, 7)))
    .reduce((sum, t) => sum + t.amount, 0);

  const savedAmount = transactions
    .filter(t => t.type === 'expense' && t.category === 'savings' && t.date.startsWith(new Date().toISOString().substring(0, 7)))
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = freshIncome > 0 ? Math.round((savedAmount / freshIncome) * 100) : 0;

  // Gamification Calculations
  const currentXP = user.totalXP || 0;
  const level = calculateLevel(currentXP);
  const progress = calculateLevelProgress(currentXP);

  // Determine effective avatar (Auto-evolve only if generic 'bear' is set)
  const effectiveAvatar = user.avatar === 'bear'
    ? getAvatarForLevel(level)
    : user.avatar;


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

  const handleDownload = async () => {
    try {
      // In a real app we'd save local file to CameraRoll. 
      // For the demo, we use the Share API which allows "Save Image" or "Save to Files"
      await Share.share({
        message: `Check out my Level ${level} Bear on Beruang! 🐻✨`,
        title: 'Beruang Avatar',
      });
    } catch (error) {
      Alert.alert('Download Error', 'Could not save the image at this time.');
    }
  };



  return (
    <View style={styles.container}>
      {/* --- Modals --- */}
      <EditProfileModal
        visible={editModalVisible}
        user={user}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
        onAvatarPress={() => {
          setEditModalVisible(false);
          setTimeout(() => setAvatarModalVisible(true), 400); // Increased for stability
        }}
        onRetakeAssessment={handleRetakeQuestionnaire}
      />
      <AvatarPickerModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        onSelect={handleSelectAvatar}
        currentAvatar={user.avatar}
        userXP={user.totalXP || 0}
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
                  onPress={() => setViewerVisible(true)}
                  style={styles.avatarWrapper}
                  activeOpacity={0.9}
                >
                  <View style={[styles.avatarMain, { borderColor: COLORS.primary, borderWidth: 3 }]}>
                    {isBearAvatar(effectiveAvatar) ? (
                      <Image source={BEAR_AVATARS[effectiveAvatar]} style={styles.avatarImg} />
                    ) : (
                      <MaterialCommunityIcon name={effectiveAvatar || 'bear'} size={60} color={COLORS.accent} />
                    )}
                    <View style={[styles.proBadge, { backgroundColor: COLORS.primary }]}>
                      <Icon name="maximize-2" size={10} color={COLORS.accent} />
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
              <StatCard label="XP Level" value={`Lvl ${level}`} icon="star" color={COLORS.secondary} />
            </View>

            {/* --- Level Progress (Using primary) --- */}
            <View style={styles.premiumCard}>
              <View style={styles.levelHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.cardHeading}>Financial Mastery</Text>
                    <TouchableOpacity
                      onPress={() => setXpInfoVisible(true)}
                      style={{ marginLeft: 6, padding: 4 }}
                    >
                      <Icon name="info" size={14} color={COLORS.accent} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardSubheading}>
                    {level >= 13 ? 'Max Level Reached!' : `${progress.currentLevelXP} / ${progress.goalXP} XP to Level ${level + 1}`}
                  </Text>
                </View>
                <View style={[styles.medalContainer, { backgroundColor: COLORS.primary + '30' }]}>
                  <MaterialCommunityIcon name="medal" size={24} color={COLORS.accent} />
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: COLORS.primary + '20' }]}>
                  <View style={[styles.progressFill, { width: `${progress.percentage}%`, backgroundColor: COLORS.primary }]} />
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

      {/* --- XP GUIDE MODAL (The Mobile "Hover" equivalent) --- */}
      <Modal
        visible={xpInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setXpInfoVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setXpInfoVisible(false)}
        >
          <View style={styles.xpInfoContainer}>
            <View style={styles.xpInfoHeader}>
              <MaterialCommunityIcon name="shield-star" size={32} color={COLORS.accent} />
              <Text style={styles.xpInfoTitle}>How to Rank Up</Text>
            </View>

            <View style={styles.xpInfoScroll}>
              <View style={styles.xpItem}>
                <View style={styles.xpIconBox}>
                  <Icon name="save" size={18} color={COLORS.accent} />
                </View>
                <View style={styles.xpTextContent}>
                  <Text style={styles.xpItemLabel}>Move to Savings</Text>
                  <Text style={styles.xpItemValue}>+2 XP per RM 1.00</Text>
                </View>
              </View>

              <View style={styles.xpItem}>
                <View style={styles.xpIconBox}>
                  <Icon name="message-circle" size={18} color={COLORS.accent} />
                </View>
                <View style={styles.xpTextContent}>
                  <Text style={styles.xpItemLabel}>Chat with Beruang</Text>
                  <Text style={styles.xpItemValue}>+100 XP per session</Text>
                </View>
              </View>

              <View style={styles.xpItem}>
                <View style={styles.xpIconBox}>
                  <Icon name="plus-square" size={18} color={COLORS.accent} />
                </View>
                <View style={styles.xpTextContent}>
                  <Text style={styles.xpItemLabel}>Log Transactions</Text>
                  <Text style={styles.xpItemValue}>+50 XP per entry</Text>
                </View>
              </View>

              <View style={styles.xpItem}>
                <View style={styles.xpIconBox}>
                  <Icon name="check-circle" size={18} color={COLORS.accent} />
                </View>
                <View style={styles.xpTextContent}>
                  <Text style={styles.xpItemLabel}>Daily Check-in</Text>
                  <Text style={styles.xpItemValue}>+20 XP per day</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.xpCloseBtn}
              onPress={() => setXpInfoVisible(false)}
            >
              <Text style={styles.xpCloseText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* --- FULL SCREEN IMAGE VIEWER --- */}
      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <SafeAreaView style={styles.viewerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={() => setViewerVisible(false)}
              style={styles.viewerCloseBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Icon name="x" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.viewerTitle}>Profile Bear</Text>
            <TouchableOpacity
              onPress={handleDownload}
              style={styles.viewerCloseBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Icon name="download" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.viewerImageWrapper}>
            {isBearAvatar(effectiveAvatar) ? (
              <Image
                source={BEAR_AVATARS[effectiveAvatar]}
                style={styles.viewerFullImage}
                resizeMode="cover"
              />
            ) : (
              <MaterialCommunityIcon name={effectiveAvatar || 'account'} size={200} color={COLORS.primary} />
            )}
          </View>

          <View style={styles.viewerFooter}>
            <Text style={styles.viewerLevel}>
              {user.avatar === 'bear'
                ? `Level ${level} Grizzly`
                : isBearAvatar(user.avatar)
                  ? `Level ${user.avatar.split('_')[2]} Bear`
                  : `Level ${level} Master`}
            </Text>
            <TouchableOpacity
              style={styles.changeBtnSquare}
              onPress={() => {
                setViewerVisible(false);
                setTimeout(() => setAvatarModalVisible(true), 400);
              }}
            >
              <Icon name="edit-2" size={18} color={COLORS.white} />
              <Text style={styles.changeBtnText}>Change Avatar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  xpInfoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  xpInfoHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  xpInfoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accent,
    marginTop: 8,
  },
  xpInfoScroll: {
    gap: 16,
    marginBottom: 24,
  },
  xpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    padding: 12,
    borderRadius: 16,
  },
  xpIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  xpTextContent: {
    flex: 1,
  },
  xpItemLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },
  xpItemValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  xpCloseBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  xpCloseText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30, // Increased for iOS to clear notch comfortably
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
    elevation: 10,
  },
  viewerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  viewerCloseBtn: {
    padding: 8,
  },
  viewerImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerFullImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 40,
    backgroundColor: '#F9F7F2', // Matches the Bear's cream/white background
  },
  viewerFooter: {
    padding: 40,
    alignItems: 'center',
  },
  viewerLevel: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  changeBtnSquare: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  changeBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
    marginLeft: 10,
  },
});
