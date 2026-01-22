import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Types
type ProfileSettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type SettingsItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  label: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDestructive?: boolean;
  showChevron?: boolean;
};

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

// Settings Item Component
const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  iconColor = '#6B7280',
  iconBackground = '#F3F4F6',
  label,
  description,
  onPress,
  rightElement,
  isDestructive = false,
  showChevron = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.settingsItem}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={!onPress && !rightElement}
      >
        <View style={[styles.settingsIconContainer, { backgroundColor: iconBackground }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.settingsItemContent}>
          <Text style={[styles.settingsItemLabel, isDestructive && styles.destructiveText]}>
            {label}
          </Text>
          {description && (
            <Text style={styles.settingsItemDescription}>{description}</Text>
          )}
        </View>
        {rightElement ? (
          rightElement
        ) : showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Settings Section Component
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

// Main Component
const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ navigation }) => {
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(true);

  // Profile avatar animation
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleEditProfile = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('ProfileEdit');
  };

  const handleAvatarPressIn = () => {
    Animated.spring(avatarScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleAvatarPressOut = () => {
    Animated.spring(avatarScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleToggleNotifications = (value: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setNotificationsEnabled(value);
  };

  const handleToggleDailyReminders = (value: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDailyRemindersEnabled(value);
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file. This feature is coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your check-ins, streaks, and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data clearing
            Alert.alert('Data Cleared', 'All your data has been cleared.');
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    // TODO: Link to privacy policy
    Alert.alert('Privacy Policy', 'Privacy policy coming soon!');
  };

  const handleTermsOfService = () => {
    // TODO: Link to terms of service
    Alert.alert('Terms of Service', 'Terms of service coming soon!');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@lifeosapp.com?subject=Life OS Support');
  };

  const handleRateApp = () => {
    // TODO: Link to App Store / Play Store
    Alert.alert('Rate App', 'Thank you for your support! App Store link coming soon.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          onPress: () => {
            // TODO: Implement logout
            Alert.alert('Logged Out', 'You have been logged out.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  const renderToggle = (value: boolean, onValueChange: (value: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E5E7EB', true: '#A78BFA' }}
      thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : value ? '#8B5CF6' : '#F4F4F5'}
      ios_backgroundColor="#E5E7EB"
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <Animated.View style={{ transform: [{ scale: avatarScaleAnim }] }}>
            <TouchableOpacity
              activeOpacity={1}
              onPressIn={handleAvatarPressIn}
              onPressOut={handleAvatarPressOut}
              onPress={handleEditProfile}
            >
              <LinearGradient
                colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
                style={styles.profileCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Decorative elements */}
                <View style={styles.profileDecoration1} />
                <View style={styles.profileDecoration2} />

                <View style={styles.profileContent}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={40} color="#6366F1" />
                    </View>
                    <View style={styles.editAvatarBadge}>
                      <Ionicons name="camera" size={12} color="#FFFFFF" />
                    </View>
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>Life OS User</Text>
                    <Text style={styles.profileSubtitle}>Tap to edit profile</Text>
                  </View>

                  <View style={styles.editButton}>
                    <Ionicons name="pencil" size={16} color="#6366F1" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Preferences Section */}
          <SettingsSection title="Preferences">
            <SettingsItem
              icon="notifications-outline"
              iconColor="#8B5CF6"
              iconBackground="#EDE9FE"
              label="Push Notifications"
              description="Receive reminders and updates"
              rightElement={renderToggle(notificationsEnabled, handleToggleNotifications)}
              showChevron={false}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="alarm-outline"
              iconColor="#F59E0B"
              iconBackground="#FEF3C7"
              label="Daily Reminders"
              description="Morning and evening check-in prompts"
              rightElement={renderToggle(dailyRemindersEnabled, handleToggleDailyReminders)}
              showChevron={false}
            />
          </SettingsSection>

          {/* Data & Privacy Section */}
          <SettingsSection title="Data & Privacy">
            <SettingsItem
              icon="download-outline"
              iconColor="#10B981"
              iconBackground="#D1FAE5"
              label="Export Data"
              description="Download your data as JSON"
              onPress={handleExportData}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="trash-outline"
              iconColor="#EF4444"
              iconBackground="#FEE2E2"
              label="Clear All Data"
              description="Delete all check-ins and progress"
              onPress={handleClearData}
              isDestructive
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="shield-checkmark-outline"
              iconColor="#3B82F6"
              iconBackground="#DBEAFE"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />
          </SettingsSection>

          {/* About & Support Section */}
          <SettingsSection title="About & Support">
            <SettingsItem
              icon="information-circle-outline"
              iconColor="#6B7280"
              iconBackground="#F3F4F6"
              label="App Version"
              rightElement={<Text style={styles.versionText}>1.0.0</Text>}
              showChevron={false}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="star-outline"
              iconColor="#FBBF24"
              iconBackground="#FEF3C7"
              label="Rate Life OS"
              description="Help us with a review"
              onPress={handleRateApp}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="mail-outline"
              iconColor="#8B5CF6"
              iconBackground="#EDE9FE"
              label="Contact Support"
              description="Get help or send feedback"
              onPress={handleContactSupport}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="document-text-outline"
              iconColor="#6B7280"
              iconBackground="#F3F4F6"
              label="Terms of Service"
              onPress={handleTermsOfService}
            />
          </SettingsSection>

          {/* Account Section */}
          <SettingsSection title="Account">
            <SettingsItem
              icon="log-out-outline"
              iconColor="#6B7280"
              iconBackground="#F3F4F6"
              label="Log Out"
              onPress={handleLogout}
            />
            <View style={styles.separator} />
            <SettingsItem
              icon="person-remove-outline"
              iconColor="#EF4444"
              iconBackground="#FEE2E2"
              label="Delete Account"
              description="Permanently remove your account"
              onPress={handleDeleteAccount}
              isDestructive
            />
          </SettingsSection>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with ❤️ for your life journey</Text>
            <Text style={styles.footerSubtext}>Life OS © 2024</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16, paddingBottom: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  // Profile Card
  profileCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  profileDecoration1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  profileDecoration2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#C7D2FE',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Settings Item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  settingsItemDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 2,
  },
  destructiveText: {
    color: '#EF4444',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 64,
  },
  versionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#D1D5DB',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ProfileSettingsScreen;
