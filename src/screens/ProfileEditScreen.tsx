import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Animated,
  Alert,
  KeyboardAvoidingView,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Types
type ProfileEditScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

// Main Component
const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation }) => {
  // Form state
  const [name, setName] = useState('Life OS User');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Avatar animation
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSave = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name.');
      return;
    }

    // TODO: Save profile data to storage/backend
    Alert.alert('Profile Saved', 'Your profile has been updated successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
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

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', 'Remove Photo'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 3,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // TODO: Open camera
            Alert.alert('Camera', 'Camera functionality coming soon!');
          } else if (buttonIndex === 2) {
            // TODO: Open photo library
            Alert.alert('Photo Library', 'Photo library functionality coming soon!');
          } else if (buttonIndex === 3) {
            // TODO: Remove photo
            Alert.alert('Photo Removed', 'Profile photo has been removed.');
          }
        }
      );
    } else {
      Alert.alert(
        'Change Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => Alert.alert('Camera', 'Coming soon!') },
          { text: 'Choose from Library', onPress: () => Alert.alert('Library', 'Coming soon!') },
          { text: 'Remove Photo', style: 'destructive', onPress: () => {} },
        ]
      );
    }
  };

  const updateField = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasChanges(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.roundButton, !hasChanges && styles.roundButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={!hasChanges}
          >
            <Ionicons name="checkmark" size={20} color={hasChanges ? '#1F2937' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Animated.View style={{ transform: [{ scale: avatarScaleAnim }] }}>
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={handleAvatarPressIn}
                onPressOut={handleAvatarPressOut}
                onPress={handleChangePhoto}
                style={styles.avatarContainer}
              >
                <LinearGradient
                  colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={48} color="#6366F1" />
                  </View>
                </LinearGradient>
                <View style={styles.editAvatarBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Personal Info Card */}
          <View style={styles.card}>
            {/* Name Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={20} color="#6366F1" />
                </View>
                <Text style={styles.cardLabel}>Name</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name..."
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={updateField(setName)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputDivider} />

            {/* Email Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-outline" size={20} color="#6366F1" />
                </View>
                <Text style={styles.cardLabel}>Email</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email..."
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={updateField(setEmail)}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Additional Details Card */}
          <View style={styles.card}>
            {/* Birthday Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar-outline" size={20} color="#6366F1" />
                </View>
                <Text style={styles.cardLabel}>Birthday</Text>
                <Text style={styles.optionalLabel}>optional</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#9CA3AF"
                value={birthday}
                onChangeText={updateField(setBirthday)}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
            <Text style={styles.infoNoteText}>
              Your profile information is stored locally on your device and never shared.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
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
  roundButton: {
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
    shadowRadius: 3,
    elevation: 1,
  },
  roundButtonDisabled: {
    opacity: 0.6,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F7F5F2',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Input Section
  inputSection: {
    // Container for each input within a card
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  optionalLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  textInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});

export default ProfileEditScreen;
