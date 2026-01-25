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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_ASPECT_RATIO = 4 / 5; // Width to height ratio (matches relationship card)
const CROP_AREA_WIDTH = SCREEN_WIDTH - 48;
const CROP_AREA_HEIGHT = CROP_AREA_WIDTH / CROP_ASPECT_RATIO;
const MIN_SCALE = 1;
const MAX_SCALE = 3;

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

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [currentZoom, setCurrentZoom] = useState(1);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputCardRef = useRef<View>(null);

  // Date picker modal animation
  const datePickerTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const SWIPE_THRESHOLD = 100;

  // Crop modal animations
  const cropModalOpacity = useRef(new Animated.Value(0)).current;
  const cropScale = useRef(new Animated.Value(1)).current;
  const cropTranslateX = useRef(new Animated.Value(0)).current;
  const cropTranslateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const baseScale = useRef(1);
  const initialPinchDistance = useRef(0);
  const isPinching = useRef(false);

  // Calculate initial scale to fit image in crop area
  const getInitialScale = (imgWidth: number, imgHeight: number) => {
    const imageAspect = imgWidth / imgHeight;
    const cropAspect = CROP_ASPECT_RATIO;

    // Scale to cover the crop area
    if (imageAspect > cropAspect) {
      // Image is wider - scale based on height
      return CROP_AREA_HEIGHT / imgHeight;
    } else {
      // Image is taller - scale based on width
      return CROP_AREA_WIDTH / imgWidth;
    }
  };

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

  // Animate crop modal
  useEffect(() => {
    if (showCropModal) {
      cropModalOpacity.setValue(0);
      Animated.timing(cropModalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showCropModal]);

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

  // Calculate distance between two touch points
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Crop pan responder for dragging and pinch-to-zoom
  const cropPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          // Start pinch
          isPinching.current = true;
          initialPinchDistance.current = getDistance(touches);
        } else {
          // Start pan
          isPinching.current = false;
          cropTranslateX.setOffset(lastTranslateX.current);
          cropTranslateY.setOffset(lastTranslateY.current);
          cropTranslateX.setValue(0);
          cropTranslateY.setValue(0);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch-to-zoom
          if (!isPinching.current) {
            // Just started pinching
            isPinching.current = true;
            initialPinchDistance.current = getDistance(touches);
            return;
          }

          const currentDistance = getDistance(touches);
          if (initialPinchDistance.current > 0) {
            const pinchScale = currentDistance / initialPinchDistance.current;
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale.current * pinchScale));

            cropScale.setValue(newScale);
            setCurrentZoom(newScale);

            // Clamp translation with new scale
            const clampedValues = clampTranslation(lastTranslateX.current, lastTranslateY.current, newScale);
            cropTranslateX.setValue(clampedValues.x);
            cropTranslateY.setValue(clampedValues.y);
          }
        } else if (!isPinching.current) {
          // Single finger pan
          cropTranslateX.setValue(gestureState.dx);
          cropTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt) => {
        if (isPinching.current) {
          // End pinch - save the current scale
          const currentScale = (cropScale as any)._value || lastScale.current;
          lastScale.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, currentScale));

          // Clamp translation with final scale
          const clampedValues = clampTranslation(lastTranslateX.current, lastTranslateY.current, lastScale.current);
          lastTranslateX.current = clampedValues.x;
          lastTranslateY.current = clampedValues.y;

          cropTranslateX.setValue(clampedValues.x);
          cropTranslateY.setValue(clampedValues.y);

          isPinching.current = false;
          initialPinchDistance.current = 0;
        } else {
          // End pan
          cropTranslateX.flattenOffset();
          cropTranslateY.flattenOffset();

          // Get current values and clamp them
          const currentX = (cropTranslateX as any)._value || 0;
          const currentY = (cropTranslateY as any)._value || 0;

          const clampedValues = clampTranslation(currentX, currentY, lastScale.current);

          if (currentX !== clampedValues.x || currentY !== clampedValues.y) {
            Animated.spring(cropTranslateX, {
              toValue: clampedValues.x,
              useNativeDriver: true,
              friction: 8,
            }).start();
            Animated.spring(cropTranslateY, {
              toValue: clampedValues.y,
              useNativeDriver: true,
              friction: 8,
            }).start();
          }

          lastTranslateX.current = clampedValues.x;
          lastTranslateY.current = clampedValues.y;
        }
      },
    })
  ).current;

  // Clamp translation to keep image within bounds
  const clampTranslation = (x: number, y: number, scale: number) => {
    if (imageSize.width === 0 || imageSize.height === 0) return { x: 0, y: 0 };

    const scaledWidth = imageSize.width * baseScale.current * scale;
    const scaledHeight = imageSize.height * baseScale.current * scale;

    const maxX = Math.max(0, (scaledWidth - CROP_AREA_WIDTH) / 2);
    const maxY = Math.max(0, (scaledHeight - CROP_AREA_HEIGHT) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

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
      allowsEditing: false, // Disable system editing - we'll use our own
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;

      // Get image dimensions
      Image.getSize(uri, (width, height) => {
        setImageSize({ width, height });

        // Calculate initial scale
        const initialScale = getInitialScale(width, height);
        baseScale.current = initialScale;

        // Reset crop state
        cropScale.setValue(1);
        cropTranslateX.setValue(0);
        cropTranslateY.setValue(0);
        lastScale.current = 1;
        lastTranslateX.current = 0;
        lastTranslateY.current = 0;
        setCurrentZoom(1);

        setSelectedImageUri(uri);
        setShowCropModal(true);
      }, (error) => {
        console.error('Error getting image size:', error);
        // Fallback - just use the image without cropping
        setPartnerPhoto(uri);
      });
    }
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newZoom));
    setCurrentZoom(clampedZoom);
    cropScale.setValue(clampedZoom);
    lastScale.current = clampedZoom;

    // Clamp translation with new scale
    const clampedValues = clampTranslation(lastTranslateX.current, lastTranslateY.current, clampedZoom);
    cropTranslateX.setValue(clampedValues.x);
    cropTranslateY.setValue(clampedValues.y);
    lastTranslateX.current = clampedValues.x;
    lastTranslateY.current = clampedValues.y;
  };

  const handleCropDone = async () => {
    if (!selectedImageUri || imageSize.width === 0) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const scale = lastScale.current;
      const translateX = lastTranslateX.current;
      const translateY = lastTranslateY.current;

      // Calculate the scaled image dimensions
      const scaledWidth = imageSize.width * baseScale.current * scale;
      const scaledHeight = imageSize.height * baseScale.current * scale;

      // Calculate the crop region in original image coordinates
      const cropCenterX = scaledWidth / 2 - translateX;
      const cropCenterY = scaledHeight / 2 - translateY;

      // Convert from display coordinates to original image coordinates
      const displayToOriginalScale = imageSize.width / scaledWidth;

      const originX = (cropCenterX - CROP_AREA_WIDTH / 2) * displayToOriginalScale;
      const originY = (cropCenterY - CROP_AREA_HEIGHT / 2) * displayToOriginalScale;
      const cropWidth = CROP_AREA_WIDTH * displayToOriginalScale;
      const cropHeight = CROP_AREA_HEIGHT * displayToOriginalScale;

      // Clamp to valid bounds
      const finalOriginX = Math.max(0, Math.min(originX, imageSize.width - cropWidth));
      const finalOriginY = Math.max(0, Math.min(originY, imageSize.height - cropHeight));
      const finalWidth = Math.min(cropWidth, imageSize.width - finalOriginX);
      const finalHeight = Math.min(cropHeight, imageSize.height - finalOriginY);

      const manipResult = await ImageManipulator.manipulateAsync(
        selectedImageUri,
        [
          {
            crop: {
              originX: Math.round(finalOriginX),
              originY: Math.round(finalOriginY),
              width: Math.round(finalWidth),
              height: Math.round(finalHeight),
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setPartnerPhoto(manipResult.uri);
    } catch (error) {
      console.error('Crop error:', error);
      // Fallback - use original image
      setPartnerPhoto(selectedImageUri);
    }

    closeCropModal();
  };

  const handleCropCancel = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    closeCropModal();
  };

  const closeCropModal = () => {
    Animated.timing(cropModalOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowCropModal(false);
      setSelectedImageUri(null);
    });
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
  };

  // Handle keyboard show to scroll the name input into view
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        if (isNameFocused) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: 130,
              animated: true,
            });
          }, 50);
        }
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
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

  // Calculate image dimensions for crop preview
  const getImageDisplayDimensions = () => {
    if (imageSize.width === 0 || imageSize.height === 0) {
      return { width: CROP_AREA_WIDTH, height: CROP_AREA_HEIGHT };
    }
    return {
      width: imageSize.width * baseScale.current,
      height: imageSize.height * baseScale.current,
    };
  };

  const imageDimensions = getImageDisplayDimensions();

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
              <View style={styles.datePickerHandle}>
                <View style={styles.datePickerHandleBar} />
              </View>
              <Text style={styles.datePickerTitle}>Together since</Text>
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

        {/* Custom Crop Modal */}
        <Modal
          visible={showCropModal}
          transparent={true}
          animationType="none"
          onRequestClose={handleCropCancel}
        >
          <Animated.View style={[styles.cropModalContainer, { opacity: cropModalOpacity }]}>
            <SafeAreaView style={styles.cropModalSafeArea}>
              {/* Header */}
              <View style={styles.cropModalHeader}>
                <TouchableOpacity
                  onPress={handleCropCancel}
                  style={styles.cropModalHeaderButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cropModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.cropModalTitle}>Adjust Photo</Text>
                <TouchableOpacity
                  onPress={handleCropDone}
                  style={styles.cropModalHeaderButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cropModalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              {/* Crop Area */}
              <View style={styles.cropAreaWrapper}>
                <View style={styles.cropAreaContainer}>
                  {/* The crop area with rounded corners */}
                  <View style={styles.cropArea}>
                    <Animated.View
                      style={[
                        styles.cropImageContainer,
                        {
                          width: imageDimensions.width,
                          height: imageDimensions.height,
                          transform: [
                            { scale: cropScale },
                            { translateX: cropTranslateX },
                            { translateY: cropTranslateY },
                          ],
                        },
                      ]}
                      {...cropPanResponder.panHandlers}
                    >
                      {selectedImageUri && (
                        <Image
                          source={{ uri: selectedImageUri }}
                          style={styles.cropImage}
                          resizeMode="cover"
                        />
                      )}
                    </Animated.View>
                  </View>

                  {/* Corner indicators */}
                  <View style={[styles.cropCorner, styles.cropCornerTL]} />
                  <View style={[styles.cropCorner, styles.cropCornerTR]} />
                  <View style={[styles.cropCorner, styles.cropCornerBL]} />
                  <View style={[styles.cropCorner, styles.cropCornerBR]} />
                </View>
              </View>

              {/* Instructions */}
              <Text style={styles.cropInstructions}>Drag to reposition · Pinch to zoom</Text>

              {/* Zoom Slider */}
              <View style={styles.zoomContainer}>
                <TouchableOpacity
                  onPress={() => handleZoomChange(currentZoom - 0.25)}
                  style={styles.zoomButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.zoomSliderContainer}>
                  <View style={styles.zoomSliderTrack}>
                    <View
                      style={[
                        styles.zoomSliderFill,
                        { width: `${((currentZoom - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%` }
                      ]}
                    />
                    <View
                      style={[
                        styles.zoomSliderThumb,
                        { left: `${((currentZoom - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%` }
                      ]}
                    />
                  </View>
                  <View
                    style={styles.zoomSliderTouchArea}
                    onTouchStart={(e) => {
                      const touch = e.nativeEvent;
                      const trackWidth = SCREEN_WIDTH - 140;
                      const percentage = Math.max(0, Math.min(1, touch.locationX / trackWidth));
                      const newZoom = MIN_SCALE + percentage * (MAX_SCALE - MIN_SCALE);
                      handleZoomChange(newZoom);
                    }}
                    onTouchMove={(e) => {
                      const touch = e.nativeEvent;
                      const trackWidth = SCREEN_WIDTH - 140;
                      const percentage = Math.max(0, Math.min(1, touch.locationX / trackWidth));
                      const newZoom = MIN_SCALE + percentage * (MAX_SCALE - MIN_SCALE);
                      handleZoomChange(newZoom);
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => handleZoomChange(currentZoom + 0.25)}
                  style={styles.zoomButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Zoom percentage indicator */}
              <Text style={styles.zoomPercentage}>{Math.round(currentZoom * 100)}%</Text>
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
    aspectRatio: CROP_ASPECT_RATIO,
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
    paddingTop: 16,
    paddingBottom: 16,
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
    letterSpacing: -0.3,
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
  cropAreaWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropAreaContainer: {
    position: 'relative',
    width: CROP_AREA_WIDTH,
    height: CROP_AREA_HEIGHT,
  },
  cropArea: {
    width: CROP_AREA_WIDTH,
    height: CROP_AREA_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  cropImageContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -CROP_AREA_WIDTH / 2,
    marginTop: -CROP_AREA_HEIGHT / 2,
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  cropCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFFFFF',
  },
  cropCornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 20,
  },
  cropCornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 20,
  },
  cropCornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 20,
  },
  cropCornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 20,
  },
  cropInstructions: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomSliderContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  zoomSliderTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'visible',
  },
  zoomSliderFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  zoomSliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  zoomSliderTouchArea: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    bottom: -20,
  },
  zoomPercentage: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
});

export default RelationshipSetupScreen;
