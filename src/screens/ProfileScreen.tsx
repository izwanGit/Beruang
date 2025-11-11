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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/colors';
import { Screen } from './HomeScreen';
import { User } from '../../App'; // Import the User type
import { EditProfileModal } from '../components/EditProfileModal'; // Import new component
import { AvatarPickerModal } from '../components/AvatarPickerModal'; // Import new component
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type ProfileScreenProps = {
  onNavigate: (screen: Screen) => void;
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
  onLogout: () => void;
  navigation?: NativeStackNavigationProp<RootStackParamList>;
};

// Reusable row for settings
const SettingRow = ({
  icon,
  text,
  onPress,
  color = COLORS.accent,
}: {
  icon: string;
  text: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress}>
    <Icon name={icon} size={22} color={color} style={styles.settingIcon} />
    <Text style={[styles.settingText, { color: color }]}>{text}</Text>
    {color === COLORS.accent && (
      <Icon name="chevron-right" size={22} color={COLORS.darkGray} />
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
        {/* --- Header --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* --- Profile Header --- */}
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={() => setAvatarModalVisible(true)}>
              <View style={styles.avatar}>
                <MaterialCommunityIcon name={user.avatar || 'bear'} size={60} color={COLORS.accent} />
              </View>
            </TouchableOpacity>
            <Text style={styles.nameText}>{user.name || 'Beruang User'}</Text>
            <Text style={styles.occupationText}>{user.occupation || 'Finance Enthusiast'}</Text>
          </View>

          {/* --- User Details Section --- */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Information</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(true)}>
                <Icon name="edit-2" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Icon name="calendar" size={20} color={COLORS.darkGray} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{user.age || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="briefcase" size={20} color={COLORS.darkGray} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Occupation</Text>
                <Text style={styles.infoValue}>{user.occupation || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="dollar-sign" size={20} color={COLORS.darkGray} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Monthly Income</Text>
                <Text style={styles.infoValue}>RM {user.monthlyIncome.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* --- Settings Section --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings & Support</Text>
            <View style={styles.infoCard}>
              <SettingRow
                icon="repeat"
                text="Retake Onboarding Questionnaire"
                onPress={handleRetakeQuestionnaire}
              />
              <SettingRow
                icon="shield"
                text="Privacy & Security"
                onPress={() => Alert.alert('Coming Soon', 'This feature is under development.')}
              />
              <SettingRow
                icon="help-circle"
                text="Help & Support"
                onPress={() => Alert.alert('Coming Soon', 'This feature is under development.')}
              />
              <SettingRow
                icon="log-out"
                text="Logout"
                onPress={onLogout}
                color={COLORS.danger}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* --- Bottom Tab Navigator --- */}
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
    backgroundColor: COLORS.white,
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingVertical: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  occupationText: {
    fontSize: 16,
    color: COLORS.accent,
    opacity: 0.8,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.accent,
    flex: 1,
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