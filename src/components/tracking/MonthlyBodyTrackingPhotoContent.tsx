import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

export interface ProgressPhotoData {
  photoUri: string | null;
}

interface MonthlyBodyTrackingPhotoContentProps {
  data: ProgressPhotoData;
  onDataChange: (data: ProgressPhotoData) => void;
  onContinue: () => void;
}

const MonthlyBodyTrackingPhotoContent: React.FC<MonthlyBodyTrackingPhotoContentProps> = ({
  data,
  onDataChange,
  onContinue,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to take progress photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please allow photo library access to upload photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onDataChange({ photoUri: result.assets[0].uri });
    }
  };

  const handleUploadPhoto = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onDataChange({ photoUri: result.assets[0].uri });
    }
  };

  const handleRemovePhoto = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDataChange({ photoUri: null });
  };

  const handleSkip = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onContinue();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.headerIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerIconInner}>
              <Ionicons name="camera" size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Progress Photo</Text>
          <Text style={styles.headerSubtitle}>
            Capture your journey - photos reveal changes numbers can't show
          </Text>
        </View>

        {/* Photo Area */}
        {data.photoUri ? (
          // Photo Preview
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: data.photoUri }} style={styles.photoPreview} />
            <View style={styles.photoOverlay}>
              <TouchableOpacity
                style={styles.photoActionButton}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.photoActionText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoActionButton}
                onPress={handleRemovePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                <Text style={styles.photoActionText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Empty State - Photo Capture Area
          <View style={styles.photoPlaceholder}>
            <View style={styles.photoPlaceholderInner}>
              <View style={styles.cameraIconContainer}>
                <Ionicons name="body-outline" size={48} color={THEME_COLORS.primaryLight} />
              </View>
              <Text style={styles.placeholderTitle}>Add a Progress Photo</Text>
              <Text style={styles.placeholderSubtitle}>
                Track visual changes over time
              </Text>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={handleUploadPhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images-outline" size={20} color={THEME_COLORS.primary} />
                  <Text style={styles.secondaryActionText}>Upload from Library</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.buttonContainer}>
        {data.photoUri ? (
          // Continue Button (when photo is added)
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          // Skip Button (when no photo)
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    paddingHorizontal: 24,
    lineHeight: 20,
  },

  // Photo Placeholder (Empty State)
  photoPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  photoPlaceholderInner: {
    borderWidth: 2,
    borderColor: THEME_COLORS.primaryLighter,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cameraIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME_COLORS.primaryLighter + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  placeholderSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 24,
  },

  // Action Buttons
  actionButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: THEME_COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: THEME_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  secondaryActionButton: {
    backgroundColor: THEME_COLORS.primaryLighter + '40',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME_COLORS.primary,
    letterSpacing: -0.2,
  },

  // Photo Preview (When photo is taken)
  photoPreviewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  photoActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
});

export default MonthlyBodyTrackingPhotoContent;
