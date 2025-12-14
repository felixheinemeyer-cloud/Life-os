import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  TextInput,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Types
interface DatingPerson {
  id: string;
  name: string;
  initials: string;
  source?: string;
  phoneNumber?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  rating?: number;
  createdAt: string;
}

// Rating values constant
const RATING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface DatingEntryScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route?: {
    params?: {
      person?: DatingPerson;
    };
  };
}

// Avatar colors - consistent dating theme
const AVATAR_GRADIENT: [string, string, string] = ['#FFF1F2', '#FFE4E6', '#FECDD3'];
const AVATAR_INITIALS_COLOR = '#BE123C';

// Helper function to generate initials from name
const generateInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Helper function to format date
const formatDate = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Custom animation config
const layoutAnimConfig = {
  duration: 250,
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

// Main Component
const DatingEntryScreen: React.FC<DatingEntryScreenProps> = ({ navigation, route }) => {
  // Get existing person if editing
  const existingPerson = route?.params?.person;
  const isEditMode = !!existingPerson;

  // Form state - initialize with existing data if editing
  const [name, setName] = useState(existingPerson?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(existingPerson?.phoneNumber || '');
  const [instagram, setInstagram] = useState(existingPerson?.instagram || '');
  const [location, setLocation] = useState(existingPerson?.location || '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    existingPerson?.dateOfBirth ? new Date(existingPerson.dateOfBirth) : null
  );
  const [rating, setRating] = useState<number | null>(existingPerson?.rating || null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Expanded states for optional fields - expand fields that have data
  const getInitialExpandedFields = (): Set<string> => {
    const fields = new Set<string>();
    if (existingPerson?.phoneNumber) fields.add('phone');
    if (existingPerson?.instagram) fields.add('instagram');
    if (existingPerson?.location) fields.add('location');
    if (existingPerson?.dateOfBirth) fields.add('birthday');
    return fields;
  };
  const [expandedFields, setExpandedFields] = useState<Set<string>>(getInitialExpandedFields());

  // Focus states
  const [isNameFocused, setIsNameFocused] = useState(false);


  // Refs
  const phoneInputRef = useRef<TextInput>(null);
  const instagramInputRef = useRef<TextInput>(null);
  const locationInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Date picker modal animation
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const datePickerTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const SWIPE_THRESHOLD = 100;

  // Animate modal in when it opens
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

  // Check if form is valid (only name required)
  const isFormValid = name.trim().length > 0;

  // Check if a field has data
  const hasFieldData = (field: string): boolean => {
    switch (field) {
      case 'phone': return phoneNumber.trim().length > 0;
      case 'instagram': return instagram.trim().length > 0;
      case 'location': return location.trim().length > 0;
      case 'birthday': return dateOfBirth !== null;
      default: return false;
    }
  };

  // Check if field should show expanded (either expanded or has data)
  const isFieldExpanded = (field: string): boolean => {
    return expandedFields.has(field) || hasFieldData(field);
  };


  const handleSave = () => {
    if (!isFormValid) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const personData = {
      id: isEditMode ? existingPerson.id : Date.now().toString(),
      name: name.trim(),
      initials: generateInitials(name),
      source: existingPerson?.source || 'Added manually',
      phoneNumber: phoneNumber.trim() || undefined,
      instagram: instagram.trim() || undefined,
      location: location.trim() || undefined,
      dateOfBirth: dateOfBirth?.toISOString() || undefined,
      rating: rating || undefined,
      createdAt: isEditMode ? existingPerson.createdAt : new Date().toISOString(),
      ...(isEditMode ? { updatedAt: new Date().toISOString() } : {}),
    };

    console.log(isEditMode ? 'Updated person:' : 'New person:', personData);
    navigation.goBack();
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const toggleFieldExpanded = (field: string, inputRef?: React.RefObject<TextInput | null>) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    LayoutAnimation.configureNext(layoutAnimConfig);

    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(field)) {
        // Only collapse if there's no data
        if (!hasFieldData(field)) {
          newSet.delete(field);
        }
      } else {
        newSet.add(field);
        // Focus the input after expansion
        setTimeout(() => {
          inputRef?.current?.focus();
        }, 150);
      }
      return newSet;
    });
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const handleDatePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();

    if (!isFieldExpanded('birthday')) {
      LayoutAnimation.configureNext(layoutAnimConfig);
      setExpandedFields(prev => new Set(prev).add('birthday'));
    }
    setShowDatePicker(true);
  };

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

  const handleClearDate = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(datePickerTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      LayoutAnimation.configureNext(layoutAnimConfig);
      setDateOfBirth(null);
      setExpandedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete('birthday');
        return newSet;
      });
      setShowDatePicker(false);
    });
  };

  const clearField = (field: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    LayoutAnimation.configureNext(layoutAnimConfig);

    switch (field) {
      case 'phone':
        setPhoneNumber('');
        break;
      case 'instagram':
        setInstagram('');
        break;
      case 'location':
        setLocation('');
        break;
    }

    setExpandedFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(field);
      return newSet;
    });
  };

  // Render an "Add" row for optional fields
  const renderAddRow = (
    field: string,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    isLast: boolean = false
  ) => {
    return (
      <View key={field}>
        <TouchableOpacity
          style={styles.addRow}
          onPress={() => {
            if (field === 'birthday') {
              handleDatePress();
            } else {
              const refs: { [key: string]: React.RefObject<TextInput | null> } = {
                phone: phoneInputRef,
                instagram: instagramInputRef,
                location: locationInputRef,
              };
              toggleFieldExpanded(field, refs[field]);
            }
          }}
          activeOpacity={0.6}
        >
          <View style={styles.addRowIconCircle}>
            <Ionicons name={icon} size={18} color="#BE123C" />
          </View>
          <Text style={styles.addRowText}>{label}</Text>
          <View style={styles.addRowRight}>
            <Ionicons name="add" size={20} color="#C4C4C4" />
          </View>
        </TouchableOpacity>
        {!isLast && <View style={styles.addRowDivider} />}
      </View>
    );
  };

  // Render an expanded input field
  const renderExpandedField = (
    field: string,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    value: string,
    setValue: (val: string) => void,
    inputRef: React.RefObject<TextInput | null>,
    placeholder: string,
    keyboardType: 'default' | 'phone-pad' | 'email-address' = 'default',
    isLast: boolean = false,
    prefix?: string
  ) => {
    return (
      <View key={field}>
        <View style={styles.expandedFieldContainer}>
          <View style={styles.expandedFieldHeader}>
            <View style={styles.fieldIconCircle}>
              <Ionicons name={icon} size={18} color="#BE123C" />
            </View>
            <Text style={styles.expandedFieldLabel}>{label}</Text>
            <TouchableOpacity
              onPress={() => clearField(field)}
              style={styles.clearFieldButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <View style={styles.expandedFieldInputRow}>
            {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
            <TextInput
              ref={inputRef}
              style={styles.expandedFieldInput}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              value={value}
              onChangeText={setValue}
              keyboardType={keyboardType}
              autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>
        {!isLast && <View style={styles.addRowDivider} />}
      </View>
    );
  };

  // Render birthday field (special case with date picker)
  const renderBirthdayField = (isLast: boolean = false) => {
    const expanded = isFieldExpanded('birthday');

    if (!expanded) {
      return renderAddRow('birthday', 'Birthday', 'calendar-outline', isLast);
    }

    return (
      <View key="birthday">
        <View style={styles.expandedFieldContainer}>
          <View style={styles.expandedFieldHeader}>
            <View style={styles.fieldIconCircle}>
              <Ionicons name="calendar-outline" size={18} color="#BE123C" />
            </View>
            <Text style={styles.expandedFieldLabel}>Birthday</Text>
            <TouchableOpacity
              onPress={handleClearDate}
              style={styles.clearFieldButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.dateSelectButton}
            onPress={handleDatePress}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateSelectText, !dateOfBirth && styles.dateSelectPlaceholder]}>
              {dateOfBirth ? formatDate(dateOfBirth) : 'Select date...'}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        {!isLast && <View style={styles.addRowDivider} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.roundButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditMode ? 'Edit' : 'New Person'}</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.roundButton, !isFormValid && styles.roundButtonDisabled]}
              activeOpacity={0.7}
              disabled={!isFormValid}
            >
              <Ionicons name="checkmark" size={20} color={isFormValid ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Avatar Preview */}
          <View style={styles.avatarPreviewContainer}>
            <LinearGradient
              colors={AVATAR_GRADIENT}
              style={styles.avatarPreview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {name.trim().length > 0 ? (
                <Text style={[styles.avatarInitials, { color: AVATAR_INITIALS_COLOR }]}>
                  {generateInitials(name)}
                </Text>
              ) : (
                <Ionicons name="heart" size={32} color={AVATAR_INITIALS_COLOR} />
              )}
            </LinearGradient>
            <Text style={styles.avatarPreviewName}>
              {name.trim().length > 0 ? name.trim() : 'New Person'}
            </Text>
          </View>

          {/* Name Card */}
          <View style={[styles.card, isNameFocused && styles.cardFocused]}>
            {/* Name Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={20} color="#BE123C" />
                </View>
                <Text style={styles.cardLabel}>Name</Text>
                <Text style={styles.requiredLabel}>required</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter name..."
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Rating Card */}
          <View style={styles.card}>
            <View style={styles.ratingHeader}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="star-outline" size={20} color="#BE123C" />
                </View>
                <Text style={styles.cardLabel}>Rating</Text>
              </View>
              {rating && (
                <View style={styles.currentRatingBadge}>
                  <Text style={styles.currentRatingText}>{rating}/10</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingSelector}>
              {RATING_VALUES.map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setRating(rating === value ? null : value);
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.ratingPill,
                    rating === value && styles.ratingPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.ratingPillText,
                      rating === value && styles.ratingPillTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Optional Details Card */}
          <View style={styles.optionalCard}>
            <View style={styles.optionalFieldsContainer}>
              {/* Phone */}
              {isFieldExpanded('phone') ? (
                renderExpandedField(
                  'phone',
                  'Phone',
                  'call-outline',
                  phoneNumber,
                  setPhoneNumber,
                  phoneInputRef,
                  'Enter phone number...',
                  'phone-pad',
                  false
                )
              ) : (
                renderAddRow('phone', 'Phone', 'call-outline', false)
              )}

              {/* Instagram */}
              {isFieldExpanded('instagram') ? (
                renderExpandedField(
                  'instagram',
                  'Instagram',
                  'logo-instagram',
                  instagram,
                  setInstagram,
                  instagramInputRef,
                  'username',
                  'default',
                  false,
                  '@'
                )
              ) : (
                renderAddRow('instagram', 'Instagram', 'logo-instagram', false)
              )}

              {/* Location */}
              {isFieldExpanded('location') ? (
                renderExpandedField(
                  'location',
                  'Location',
                  'location-outline',
                  location,
                  setLocation,
                  locationInputRef,
                  'City, Country...',
                  'default',
                  false
                )
              ) : (
                renderAddRow('location', 'Location', 'location-outline', false)
              )}

              {/* Birthday */}
              {renderBirthdayField(true)}
            </View>
          </View>

          {/* Spacer for bottom padding */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* iOS Date Picker Modal */}
        <Modal
          visible={showDatePicker && Platform.OS === 'ios'}
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
              <Text style={styles.datePickerTitle}>Select Birthday</Text>

              {/* Date Picker */}
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  style={styles.datePicker}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  onPress={handleClearDate}
                  style={styles.datePickerClearButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.datePickerClearText}>Clear</Text>
                </TouchableOpacity>
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

        {/* Android Date Picker */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dateOfBirth || new Date(2000, 0, 1)}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Avatar Preview
  avatarPreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
  },
  avatarPreviewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },

  // Card Styles
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardFocused: {
    borderColor: '#FECDD3',
    shadowOpacity: 0.1,
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
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  requiredLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#BE123C',
    marginLeft: 'auto',
  },

  // Input Section
  inputSection: {},

  // Rating Section
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentRatingBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BE123C',
    letterSpacing: -0.2,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  ratingPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  ratingPillSelected: {
    backgroundColor: '#BE123C',
  },
  ratingPillText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#6B7280',
  },
  ratingPillTextSelected: {
    color: '#FFFFFF',
  },

  // Text Input
  textInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  // Optional Card (no header)
  optionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Optional Fields Container
  optionalFieldsContainer: {},

  // Add Row (collapsed state)
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  addRowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  addRowRight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addRowDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 50,
  },

  // Expanded Field
  expandedFieldContainer: {
    paddingVertical: 14,
  },
  expandedFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fieldIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedFieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  clearFieldButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedFieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 50,
    marginTop: 8,
  },
  inputPrefix: {
    fontSize: 17,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 2,
  },
  expandedFieldInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 4,
  },

  // Date Select Button
  dateSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 50,
    marginTop: 8,
    paddingVertical: 4,
  },
  dateSelectText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
  },
  dateSelectPlaceholder: {
    color: '#9CA3AF',
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 60,
  },

  // Date Picker Overlay (iOS)
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
    paddingTop: 12,
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
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    gap: 10,
  },
  datePickerClearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerClearText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  datePickerDoneButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DatingEntryScreen;
