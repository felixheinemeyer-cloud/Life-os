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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

interface RelationshipSetupScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

const RelationshipSetupScreen: React.FC<RelationshipSetupScreenProps> = ({ navigation }) => {
  // Form state
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [togetherSince, setTogetherSince] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputCardRef = useRef<View>(null);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const photoCardOpacity = useRef(new Animated.Value(0)).current;
  const photoCardTranslateY = useRef(new Animated.Value(30)).current;
  const nameCardOpacity = useRef(new Animated.Value(0)).current;
  const nameCardTranslateY = useRef(new Animated.Value(30)).current;
  const dateCardOpacity = useRef(new Animated.Value(0)).current;
  const dateCardTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(photoCardOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(photoCardTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(nameCardOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(nameCardTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dateCardOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(dateCardTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

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
    navigation.navigate('RelationshipHome', {
      partnerName: partnerName.trim(),
      sinceDate: togetherSince ? togetherSince.toISOString() : new Date().toISOString(),
      photoUri: partnerPhoto,
    });
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
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Your Relationship</Text>
            <Text style={styles.subtitle}>Let's make this space feel like the two of you</Text>
          </View>
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
            {/* Photo Card */}
            <Animated.View
              style={[
                styles.sectionCard,
                {
                  opacity: photoCardOpacity,
                  transform: [{ translateY: photoCardTranslateY }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.photoCardTouchable}
                onPress={pickImage}
                activeOpacity={0.9}
              >
                {partnerPhoto ? (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: partnerPhoto }}
                      style={styles.photoImage}
                    />
                    <View style={styles.photoOverlay}>
                      <View style={styles.changePhotoButton}>
                        <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.changePhotoText}>Change</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
                    style={styles.photoPlaceholder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.photoIconCircle}>
                      <Ionicons name="people" size={28} color="#E11D48" />
                    </View>
                    <Text style={styles.photoPlaceholderTitle}>Add a photo</Text>
                    <Text style={styles.photoPlaceholderText}>
                      Choose a picture that makes you smile when you see it
                    </Text>
                    <View style={styles.addPhotoButton}>
                      <Ionicons name="add" size={18} color="#BE123C" />
                      <Text style={styles.addPhotoButtonText}>Choose photo</Text>
                    </View>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Partner Name Card */}
            <Animated.View
              ref={nameInputCardRef}
              style={[
                styles.sectionCard,
                styles.inputCard,
                isNameFocused && styles.inputCardFocused,
                {
                  opacity: nameCardOpacity,
                  transform: [{ translateY: nameCardTranslateY }],
                },
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
            </Animated.View>

            {/* Together Since Card */}
            <Animated.View
              style={[
                styles.sectionCard,
                styles.inputCard,
                {
                  opacity: dateCardOpacity,
                  transform: [{ translateY: dateCardTranslateY }],
                },
              ]}
            >
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
            </Animated.View>
          </ScrollView>

          {/* Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Together since</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={togetherSince || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    textColor="#1F2937"
                    style={styles.datePicker}
                  />
                </View>
                <TouchableOpacity
                  style={styles.modalDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalDoneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        {/* Continue Button */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
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
              Continue
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={isFormValid ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </Animated.View>
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
    paddingBottom: 24,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoCardTouchable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    padding: 20,
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
    marginBottom: 4,
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
    borderColor: '#FECDD3',
    shadowColor: '#E11D48',
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
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
  },
  datePickerPlaceholder: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  datePicker: {
    height: 216,
    width: '100%',
  },
  modalDoneButton: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
    paddingTop: 12,
    backgroundColor: '#F7F5F2',
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
});

export default RelationshipSetupScreen;
