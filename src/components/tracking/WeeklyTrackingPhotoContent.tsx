import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

// Teal color scheme for weekly check-in
const THEME_COLORS = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryLighter: '#5EEAD4',
  gradient: ['#5EEAD4', '#14B8A6', '#0D9488'] as const,
};

interface WeeklyTrackingPhotoContentProps {
  photoUri: string | null;
  onPhotoChange: (uri: string | null) => void;
  onContinue: () => void;
}

const WeeklyTrackingPhotoContent: React.FC<WeeklyTrackingPhotoContentProps> = ({
  photoUri,
  onPhotoChange,
  onContinue,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to take a selfie.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Gallery Permission Required',
        'Please enable photo library access in your device settings to select a photo.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const handleTakeSelfie = async () => {
    triggerHaptic();

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFromGallery = async () => {
    triggerHaptic();

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onPhotoChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    triggerHaptic();
    onPhotoChange(null);
  };

  const handleContinue = () => {
    triggerHaptic();
    onContinue();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Question Section */}
        <View style={styles.questionSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.iconGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconInnerCircle}>
              <Ionicons name="camera" size={26} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.questionText}>
            Capture Your Week
          </Text>
          <Text style={styles.questionSubtext}>
            Take a selfie or add a favorite photo from this week
          </Text>
        </View>

        {/* Photo Area */}
        <View style={styles.photoSection}>
          {photoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={handleRemovePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.placeholderIconContainer}>
                <Ionicons name="image-outline" size={48} color="#D1D5DB" />
              </View>
              <Text style={styles.placeholderText}>No photo added yet</Text>
              <Text style={styles.placeholderSubtext}>
                Use the buttons below to add one
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakeSelfie}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <LinearGradient
              colors={THEME_COLORS.gradient}
              style={styles.actionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="camera" size={22} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Take Selfie</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={handleChooseFromGallery}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Ionicons name="images-outline" size={22} color={THEME_COLORS.primary} />
            <Text style={styles.actionButtonSecondaryText}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Optional Note */}
        <View style={styles.optionalNoteContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
          <Text style={styles.optionalNoteText}>
            This step is optional - feel free to skip
          </Text>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Finish Check-in</Text>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 2,
  },
  iconInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  questionSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 16,
  },

  // Photo Section
  photoSection: {
    marginBottom: 20,
  },
  photoPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: THEME_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  actionButtonSecondary: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: THEME_COLORS.primary,
    gap: 8,
  },
  actionButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME_COLORS.primary,
    letterSpacing: -0.2,
  },

  // Optional Note
  optionalNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  optionalNoteText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
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
    marginRight: 8,
    letterSpacing: -0.2,
  },
});

export default WeeklyTrackingPhotoContent;
