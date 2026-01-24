import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Animated,
  Easing,
  Alert,
  Modal,
  Keyboard,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';

interface RelationshipSetupScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params?: {
      isEditMode?: boolean;
      partnerName?: string;
      sinceDate?: string | Date;
      photoUri?: string | null;
    };
  };
}

const RelationshipSetupScreen: React.FC<RelationshipSetupScreenProps> = ({ navigation, route }) => {
  const isEditMode = route.params?.isEditMode || false;

  // Form state - initialize with existing data if in edit mode
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(route.params?.photoUri || null);
  const [partnerName, setPartnerName] = useState(route.params?.partnerName || '');
  const [togetherSince, setTogetherSince] = useState<Date | null>(
    route.params?.sinceDate
      ? (route.params.sinceDate instanceof Date ? route.params.sinceDate : new Date(route.params.sinceDate))
      : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputCardRef = useRef<View>(null);


  // Date picker modal animation
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const datePickerTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const SWIPE_THRESHOLD = 100;

  // Crop modal state
  const cropModalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const cropScale = useRef(new Animated.Value(1)).current;
  const cropTranslateX = useRef(new Animated.Value(0)).current;
  const cropTranslateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const cropImageSize = useRef({ width: 0, height: 0 });

  // Animate date picker modal in when it opens
  useEffect(() => {
    if (showDatePicker) {
      datePickerTranslateY.setValue(SCREEN_HEIGHT);
      Animated.timing(datePickerTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [showDatePicker]);

  const datePickerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          datePickerTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) {
          Animated.timing(datePickerTranslateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowDatePicker(false);
          });
        } else {
          Animated.spring(datePickerTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handleDatePickerDone = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(datePickerTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowDatePicker(false);
    });
  };

  // Animate crop modal in when it opens
  useEffect(() => {
    if (showCropModal) {
      // Reset transforms
      cropScale.setValue(1);
      cropTranslateX.setValue(0);
      cropTranslateY.setValue(0);
      lastScale.current = 1;
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;

      cropModalTranslateY.setValue(SCREEN_HEIGHT);
      Animated.timing(cropModalTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [showCropModal]);

  const handleCropModalDone = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Calculate crop region based on current scale and translation
    if (originalImageUri && cropImageSize.current.width > 0) {
      const scale = lastScale.current;
      const translateX = lastTranslateX.current;
      const translateY = lastTranslateY.current;

      // The visible crop area is a square in the center
      const cropAreaSize = SCREEN_WIDTH - 48; // Crop area with padding
      const imageDisplaySize = cropAreaSize; // Image fills the crop area initially

      // Calculate the crop region in image coordinates
      const imageWidth = cropImageSize.current.width;
      const imageHeight = cropImageSize.current.height;
      const aspectRatio = imageWidth / imageHeight;

      // Since we're cropping square, use the smaller dimension
      const displayedImageWidth = aspectRatio >= 1 ? imageDisplaySize : imageDisplaySize * aspectRatio;
      const displayedImageHeight = aspectRatio >= 1 ? imageDisplaySize / aspectRatio : imageDisplaySize;

      // Scale factor from display to actual image
      const scaleFactorX = imageWidth / (displayedImageWidth * scale);
      const scaleFactorY = imageHeight / (displayedImageHeight * scale);

      // Center of the crop area in display coordinates
      const cropCenterX = cropAreaSize / 2 - translateX;
      const cropCenterY = cropAreaSize / 2 - translateY;

      // Crop dimensions in actual image coordinates
      const cropWidth = Math.min(cropAreaSize * scaleFactorX, imageWidth);
      const cropHeight = Math.min(cropAreaSize * scaleFactorY, imageHeight);

      // Crop origin in actual image coordinates
      let originX = (cropCenterX - cropAreaSize / 2) * scaleFactorX + (imageWidth - displayedImageWidth * scale * scaleFactorX) / 2;
      let originY = (cropCenterY - cropAreaSize / 2) * scaleFactorY + (imageHeight - displayedImageHeight * scale * scaleFactorY) / 2;

      // Clamp values
      originX = Math.max(0, Math.min(originX, imageWidth - cropWidth));
      originY = Math.max(0, Math.min(originY, imageHeight - cropHeight));

      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          originalImageUri,
          [
            {
              crop: {
                originX: Math.round(originX),
                originY: Math.round(originY),
                width: Math.round(cropWidth),
                height: Math.round(cropHeight),
              },
            },
          ],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        setPartnerPhoto(manipResult.uri);
      } catch (error) {
        console.error('Crop error:', error);
      }
    }

    Animated.timing(cropModalTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowCropModal(false);
    });
  };

  const handleCropModalCancel = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(cropModalTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowCropModal(false);
    });
  };

  const openCropModal = () => {
    if (partnerPhoto) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      // Store the current photo as the original for cropping
      if (!originalImageUri) {
        setOriginalImageUri(partnerPhoto);
      }
      // Get image dimensions
      Image.getSize(originalImageUri || partnerPhoto, (width, height) => {
        cropImageSize.current = { width, height };
        setShowCropModal(true);
      });
    }
  };

  const cropPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        cropTranslateX.setOffset(lastTranslateX.current);
        cropTranslateY.setOffset(lastTranslateY.current);
        cropTranslateX.setValue(0);
        cropTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        cropTranslateX.setValue(gestureState.dx);
        cropTranslateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: () => {
        cropTranslateX.flattenOffset();
        cropTranslateY.flattenOffset();
        lastTranslateX.current = (cropTranslateX as any)._value || 0;
        lastTranslateY.current = (cropTranslateY as any)._value || 0;
      },
    })
  ).current;

  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need access to your photos to add a picture of you two.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPartnerPhoto(result.assets[0].uri);
      setOriginalImageUri(result.assets[0].uri); // Store for future cropping
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Only allow dates up to today
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate <= today) {
        setTogetherSince(selectedDate);
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    }
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isEditMode) {
      // When in edit mode, just go back
      navigation.goBack();
    } else {
      // When not in edit mode, navigate to RelationshipHome
      navigation.navigate('RelationshipHome', {
        partnerName: partnerName.trim(),
        sinceDate: togetherSince ? togetherSince.toISOString() : new Date().toISOString(),
        photoUri: partnerPhoto,
      });
    }
  };

  const isFormValid = partnerName.trim().length > 0;

  const handleNameFocus = () => {
    setIsNameFocused(true);
    // Use keyboard show event to scroll properly
  };

  // Handle keyboard show to scroll the name input into view
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        if (isNameFocused) {
          // Scroll so the input card is 16px above the keyboard
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: 130, // Scroll enough to position input above keyboard with 16px gap
              animated: true,
            });
          }, 50);
        }
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Scroll back to top when keyboard hides
        scrollViewRef.current?.scrollTo({
          y: 0,
          animated: true,
        });
      }
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [isNameFocused]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Your Relationship</Text>
            <Text style={styles.subtitle}>Let's make this space feel like the two of you</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
            {/* Photo Card */}
            <View style={[styles.sectionCard, styles.photoCard]}>
              {partnerPhoto ? (
                <View style={styles.photoCardTouchable}>
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: partnerPhoto }}
                      style={styles.photoImage}
                    />
                    <View style={styles.photoOverlay}>
                      <View style={styles.photoButtonsRow}>
                        <TouchableOpacity
                          style={styles.changePhotoButton}
                          onPress={openCropModal}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="crop-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.changePhotoText}>Crop</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.changePhotoButton}
                          onPress={pickImage}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                          <Text style={styles.changePhotoText}>Change</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoCardTouchable}
                  onPress={pickImage}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
                    style={styles.photoPlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.photoIconCircle}>
                      <Ionicons name="people" size={28} color="#E11D48" />
                    </View>
                    <Text style={styles.photoPlaceholderTitle}>A photo of you two</Text>
                    <View style={styles.addPhotoButton}>
                      <Ionicons name="add" size={18} color="#BE123C" />
                      <Text style={styles.addPhotoButtonText}>Choose photo</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Partner Name Card */}
            <View
              ref={nameInputCardRef}
              style={[
                styles.sectionCard,
                styles.inputCard,
                isNameFocused && styles.inputCardFocused,
              ]}
            >
              <View style={styles.inputLabelRow}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="heart-outline" size={20} color="#E11D48" />
                </View>
                <Text style={styles.inputLabel}>Your partner's name</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Alex"
                placeholderTextColor="#9CA3AF"
                value={partnerName}
                onChangeText={setPartnerName}
                onFocus={handleNameFocus}
                onBlur={() => setIsNameFocused(false)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Together Since Card */}
            <View style={[styles.sectionCard, styles.inputCard]}>
              <View style={styles.inputLabelRow}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="calendar-outline" size={20} color="#E11D48" />
                </View>
                <Text style={styles.inputLabel}>Together since</Text>
              </View>

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowDatePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.datePickerText,
                  !togetherSince && styles.datePickerPlaceholder
                ]}>
                  {togetherSince ? formatDate(togetherSince) : 'Choose date'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="none"
            onRequestClose={handleDatePickerDone}
          >
            <View style={styles.datePickerOverlay}>
              <TouchableOpacity
                style={styles.datePickerBackdrop}
                activeOpacity={1}
                onPress={handleDatePickerDone}
              />
              <Animated.View
                style={[
                  styles.datePickerContainer,
                  { transform: [{ translateY: datePickerTranslateY }] },
                ]}
                {...datePickerPanResponder.panHandlers}
              >
                {/* Drag Handle */}
                <View style={styles.datePickerHandle}>
                  <View style={styles.datePickerHandleBar} />
                </View>

                {/* Title */}
                <Text style={styles.datePickerTitle}>Together since</Text>

                {/* Date Picker */}
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={togetherSince || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    style={styles.datePicker}
                    textColor="#1F2937"
                    themeVariant="light"
                  />
                </View>

                {/* Action Button */}
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    onPress={handleDatePickerDone}
                    style={styles.datePickerDoneButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerDoneText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </Modal>

          {/* Crop Modal */}
          <Modal
            visible={showCropModal}
            transparent={true}
            animationType="none"
            onRequestClose={handleCropModalCancel}
          >
            <Animated.View
              style={[
                styles.cropModalContainer,
                { transform: [{ translateY: cropModalTranslateY }] },
              ]}
            >
              <SafeAreaView style={styles.cropModalSafeArea}>
                {/* Header */}
                <View style={styles.cropModalHeader}>
                  <TouchableOpacity
                    onPress={handleCropModalCancel}
                    style={styles.cropModalHeaderButton}
                  >
                    <Text style={styles.cropModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.cropModalTitle}>Crop Photo</Text>
                  <TouchableOpacity
                    onPress={handleCropModalDone}
                    style={styles.cropModalHeaderButton}
                  >
                    <Text style={styles.cropModalDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Crop Area */}
                <View style={styles.cropAreaContainer}>
                  <View style={styles.cropArea}>
                    <Animated.View
                      style={[
                        styles.cropImageContainer,
                        {
                          transform: [
                            { scale: cropScale },
                            { translateX: cropTranslateX },
                            { translateY: cropTranslateY },
                          ],
                        },
                      ]}
                      {...cropPanResponder.panHandlers}
                    >
                      {(originalImageUri || partnerPhoto) && (
                        <Image
                          source={{ uri: originalImageUri || partnerPhoto || '' }}
                          style={styles.cropImage}
                          resizeMode="cover"
                        />
                      )}
                    </Animated.View>
                  </View>
                  {/* Corner overlays to indicate crop area */}
                  <View style={styles.cropCornerTL} />
                  <View style={styles.cropCornerTR} />
                  <View style={styles.cropCornerBL} />
                  <View style={styles.cropCornerBR} />
                </View>

                {/* Instructions */}
                <Text style={styles.cropInstructions}>Drag to reposition</Text>

                {/* Zoom Slider */}
                <View style={styles.zoomContainer}>
                  <Ionicons name="remove" size={20} color="#9CA3AF" />
                  <View style={styles.zoomSlider}>
                    <TouchableOpacity
                      style={styles.zoomSliderTrack}
                      onPress={(e) => {
                        const { locationX } = e.nativeEvent;
                        const trackWidth = SCREEN_WIDTH - 120;
                        const percentage = locationX / trackWidth;
                        const newScale = 1 + percentage * 2; // Scale from 1x to 3x
                        cropScale.setValue(newScale);
                        lastScale.current = newScale;
                      }}
                    >
                      <Animated.View
                        style={[
                          styles.zoomSliderFill,
                          {
                            width: cropScale.interpolate({
                              inputRange: [1, 3],
                              outputRange: ['0%', '100%'],
                            }),
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  </View>
                  <Ionicons name="add" size={20} color="#9CA3AF" />
                </View>
              </SafeAreaView>
            </Animated.View>
          </Modal>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={!isFormValid}
          >
            <Text style={[
              styles.continueButtonText,
              !isFormValid && styles.continueButtonTextDisabled
            ]}>
              {isEditMode ? 'Finish' : 'Continue'}
            </Text>
            <Ionicons
              name={isEditMode ? 'checkmark' : 'chevron-forward'}
              size={18}
              color={isFormValid ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#F7F5F2',
  },
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerContent: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoCard: {
    marginHorizontal: 0,
  },
  photoCardTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 20,
  },
  photoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  photoPlaceholderTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#BE123C',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  photoPlaceholderText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
    marginBottom: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  addPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BE123C',
  },
  photoContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'center',
  },
  photoButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputCardFocused: {
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  inputIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  textInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  datePickerText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
  },
  datePickerPlaceholder: {
    color: '#9CA3AF',
  },
  // Date Picker Modal Styles
  datePickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  datePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  datePickerHandle: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  datePickerHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  datePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -10,
  },
  datePicker: {
    width: '100%',
    height: 200,
  },
  datePickerActions: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  datePickerDoneButton: {
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
  // Crop Modal Styles
  cropModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cropModalSafeArea: {
    flex: 1,
  },
  cropModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    paddingBottom: 12,
  },
  cropModalHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  cropModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cropModalCancelText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  cropModalDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  cropAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cropArea: {
    width: Dimensions.get('window').width - 48,
    height: Dimensions.get('window').width - 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  cropImageContainer: {
    width: '100%',
    height: '100%',
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  cropCornerTL: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2 - (Dimensions.get('window').width - 48) / 2 - 60,
    left: 24,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  cropCornerTR: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2 - (Dimensions.get('window').width - 48) / 2 - 60,
    right: 24,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderTopRightRadius: 4,
  },
  cropCornerBL: {
    position: 'absolute',
    bottom: Dimensions.get('window').height / 2 - (Dimensions.get('window').width - 48) / 2 - 60,
    left: 24,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  cropCornerBR: {
    position: 'absolute',
    bottom: Dimensions.get('window').height / 2 - (Dimensions.get('window').width - 48) / 2 - 60,
    right: 24,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomRightRadius: 4,
  },
  cropInstructions: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  zoomSlider: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  zoomSliderTrack: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  zoomSliderFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});

export default RelationshipSetupScreen;
