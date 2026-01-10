import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_PHOTO_HEIGHT = SCREEN_HEIGHT * 0.45; // Max 45% of screen height

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
    Keyboard.dismiss();
    triggerHaptic();
    onContinue();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Question Section - matches reflection screen */}
        <View style={styles.questionSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.iconGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconInnerCircle}>
              <Ionicons name="camera" size={28} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.questionText}>
            Capture Your Week
          </Text>
          <Text style={styles.questionSubtext}>
            Your photo will be saved to your calendar
          </Text>
        </View>

        {/* Photo Card - matches input card style from reflection */}
        <View style={[styles.photoCard, photoUri && styles.photoCardWithImage]}>
          {photoUri ? (
            <View style={styles.photoPreviewWrapper}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemovePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoPlaceholder}
              onPress={handleTakeSelfie}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <View style={styles.placeholderIcon}>
                <Ionicons name="camera-outline" size={32} color={THEME_COLORS.primary} />
              </View>
              <Text style={styles.placeholderText}>Tap to take a selfie</Text>
              <Text style={styles.placeholderSubtext}>or use the options below</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons - simplified, consistent styling */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakeSelfie}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="camera" size={20} color={THEME_COLORS.primary} />
            <Text style={styles.actionButtonText}>Take Selfie</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleChooseFromGallery}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="images-outline" size={20} color={THEME_COLORS.primary} />
            <Text style={styles.actionButtonText}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Optional Note */}
        <Text style={styles.optionalNote}>
          This step is optional
        </Text>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Finish</Text>
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
    paddingBottom: 80,
  },

  // Question Section - matches reflection screen exactly
  questionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 3,
  },
  iconInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
    marginBottom: 6,
  },
  questionSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9AA0A6',
    textAlign: 'center',
  },

  // Photo Card - matches input card from reflection screen
  photoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoCardWithImage: {
    padding: 0,
    overflow: 'hidden',
  },

  // Placeholder - tappable, themed
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME_COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },

  // Photo Preview
  photoPreviewWrapper: {
    position: 'relative',
    maxHeight: MAX_PHOTO_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: MAX_PHOTO_HEIGHT,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Action Row - simple text buttons
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME_COLORS.primary,
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },

  // Optional Note
  optionalNote: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Button Container
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
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
});

export default WeeklyTrackingPhotoContent;
