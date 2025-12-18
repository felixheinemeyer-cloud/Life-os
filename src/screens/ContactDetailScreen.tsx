import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  Linking,
  Modal,
  KeyboardAvoidingView,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

// Types
interface ContactDetailScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params?: {
      contact?: Contact;
      onDelete?: (contactId: string) => void;
    };
  };
}

interface Contact {
  id: string;
  name: string;
  initials: string;
  category: string;
  phoneNumber?: string;
  email?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  contactAgainDate?: string;
  notes?: ContactNote[];
}

interface ContactNote {
  id: string;
  text: string;
  createdAt: string;
}

// Constants
const NOTE_ACTION_WIDTH = 136;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

// Category styling
const getCategoryStyle = (category: string): { colors: [string, string, string]; textColor: string; badgeColor: string } => {
  switch (category.toLowerCase()) {
    case 'family':
      return {
        colors: ['#FCE7F3', '#FBCFE8', '#F9A8D4'],
        textColor: '#BE185D',
        badgeColor: '#FCE7F3',
      };
    case 'close friend':
      return {
        colors: ['#DBEAFE', '#BFDBFE', '#93C5FD'],
        textColor: '#1D4ED8',
        badgeColor: '#DBEAFE',
      };
    case 'friend':
      return {
        colors: ['#EDE9FE', '#DDD6FE', '#C4B5FD'],
        textColor: '#7C3AED',
        badgeColor: '#EDE9FE',
      };
    case 'work':
      return {
        colors: ['#D1FAE5', '#A7F3D0', '#6EE7B7'],
        textColor: '#047857',
        badgeColor: '#D1FAE5',
      };
    case 'acquaintance':
    default:
      return {
        colors: ['#F3F4F6', '#E5E7EB', '#D1D5DB'],
        textColor: '#6B7280',
        badgeColor: '#F3F4F6',
      };
  }
};

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatBirthday = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const getRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(dateString);
};

const isOverdue = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

const isDueSoon = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 3;
};

// Mock contact data (replace with actual data passing)
const MOCK_CONTACT: Contact = {
  id: '1',
  name: 'Alex Thompson',
  initials: 'AT',
  category: 'Close Friend',
  phoneNumber: '+1 (555) 123-4567',
  email: 'alex.thompson@email.com',
  instagram: 'alexthompson',
  location: 'San Francisco, CA',
  dateOfBirth: '1995-03-15',
  contactAgainDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  notes: [
    { id: '1', text: 'Loves hiking and outdoor activities', createdAt: new Date().toISOString() },
    { id: '2', text: 'Works at a tech startup as a designer', createdAt: new Date().toISOString() },
  ],
};

// Swipeable Note Card Component
const SwipeableNoteCard: React.FC<{
  note: ContactNote;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
}> = ({ note, onEdit, onDelete, onSwipeStart, onSwipeEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const currentTranslateX = useRef(0);

  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    });
    return () => {
      translateX.removeListener(listenerId);
    };
  }, [translateX]);

  const closeActions = useCallback(() => {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [translateX]);

  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe && Math.abs(gestureState.dx) > 5;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        onSwipeStart();
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newValue;
        if (isOpenRef.current) {
          newValue = -NOTE_ACTION_WIDTH + gestureState.dx;
        } else {
          newValue = gestureState.dx;
        }
        newValue = Math.max(-NOTE_ACTION_WIDTH, Math.min(0, newValue));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPos = currentTranslateX.current;
        const velocity = gestureState.vx;
        onSwipeEnd();

        if (velocity < -0.3) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -NOTE_ACTION_WIDTH,
            useNativeDriver: true,
            velocity: velocity,
            friction: 7,
            tension: 80,
          }).start();
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return;
        }
        if (velocity > 0.3) {
          setIsOpen(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            velocity: velocity,
            friction: 7,
            tension: 80,
          }).start();
          return;
        }

        if (currentPos < -NOTE_ACTION_WIDTH / 3) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -NOTE_ACTION_WIDTH,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          setIsOpen(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        const currentPos = currentTranslateX.current;
        onSwipeEnd();
        if (currentPos < -NOTE_ACTION_WIDTH / 2) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -NOTE_ACTION_WIDTH,
            useNativeDriver: true,
          }).start();
        } else {
          setIsOpen(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  [translateX, onSwipeStart, onSwipeEnd]);

  const handleCardPress = () => {
    if (isOpen) {
      closeActions();
    }
  };

  const handleEdit = () => {
    closeActions();
    setTimeout(() => onEdit(), 200);
  };

  const handleDelete = () => {
    closeActions();
    setTimeout(() => onDelete(), 200);
  };

  return (
    <View style={styles.noteCardWrapper}>
      <View style={styles.noteActionsContainer}>
        <TouchableOpacity
          style={[styles.noteSwipeAction, styles.noteEditAction]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.noteSwipeAction, styles.noteDeleteAction]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.noteCardAnimatedWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleCardPress}>
          <View style={styles.noteCard}>
            <View style={styles.noteAccent} />
            <Text style={styles.noteText}>{note.text}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Contact Info Row Component
const ContactInfoRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
}> = ({ icon, iconColor, label, value, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.infoRow, isLast && styles.infoRowLast, onPress && styles.infoRowTappable]}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress}
  >
    <View style={styles.infoIconCircle}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </TouchableOpacity>
);

// Main Component
const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({ navigation, route }) => {
  // Get contact from params or use mock
  const contact = route.params?.contact || MOCK_CONTACT;
  const onDelete = route.params?.onDelete;
  const categoryStyle = getCategoryStyle(contact.category);

  // State
  const [notes, setNotes] = useState<ContactNote[]>(contact.notes || []);
  const [contactAgainDate, setContactAgainDate] = useState<Date | null>(
    contact.contactAgainDate ? new Date(contact.contactAgainDate) : null
  );
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<ContactNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Animation refs
  const moreButtonScale = useRef(new Animated.Value(1)).current;

  // Date picker modal animation
  const datePickerTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
  }, [showDatePicker, datePickerTranslateY]);

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

  // Handlers
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleEdit = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('PeopleEntry', { contact });
  };

  const handleMorePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowMoreMenu(true);
  };

  const handleMoreButtonPressIn = () => {
    Animated.spring(moreButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleMoreButtonPressOut = () => {
    Animated.spring(moreButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleDeleteContact = () => {
    setShowMoreMenu(false);
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            onDelete?.(contact.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (contact.phoneNumber) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Linking.openURL(`tel:${contact.phoneNumber.replace(/[^0-9+]/g, '')}`);
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleInstagram = () => {
    if (contact.instagram) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Linking.openURL(`instagram://user?username=${contact.instagram}`).catch(() => {
        Linking.openURL(`https://instagram.com/${contact.instagram}`);
      });
    }
  };

  const handleOpenMaps = () => {
    if (contact.location) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const encodedLocation = encodeURIComponent(contact.location);
      Linking.openURL(`https://maps.apple.com/?q=${encodedLocation}`).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`);
      });
    }
  };

  // Date picker handlers
  const handleDatePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setContactAgainDate(selectedDate);
    }
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
      setContactAgainDate(null);
      setShowDatePicker(false);
    });
  };

  const handleMarkContacted = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setContactAgainDate(null);
  };

  // Note handlers
  const handleAddNotePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditingNote(null);
    setNoteContent('');
    setNoteModalVisible(true);
  };

  const handleEditNote = (note: ContactNote) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingNote(note);
    setNoteContent(note.text);
    setNoteModalVisible(true);
  };

  const handleDeleteNote = (id: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id ? { ...n, text: noteContent.trim() } : n
        )
      );
    } else {
      const newNote: ContactNote = {
        id: Date.now().toString(),
        text: noteContent.trim(),
        createdAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }

    setNoteModalVisible(false);
    setNoteContent('');
    setEditingNote(null);
  };

  // Check if there's any contact info to display
  const hasContactInfo = contact.phoneNumber || contact.email || contact.instagram || contact.location || contact.dateOfBirth;

  // Get reminder status styling
  const getReminderStatus = () => {
    if (!contactAgainDate) return null;
    const dateStr = contactAgainDate.toISOString();
    if (isOverdue(dateStr)) return { color: '#EF4444', bgColor: '#FEE2E2', label: 'Overdue' };
    if (isDueSoon(dateStr)) return { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Due soon' };
    return { color: '#10B981', bgColor: '#D1FAE5', label: 'Scheduled' };
  };

  const reminderStatus = getReminderStatus();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleMorePress}
              onPressIn={handleMoreButtonPressIn}
              onPressOut={handleMoreButtonPressOut}
            >
              <Animated.View style={[styles.editButton, { transform: [{ scale: moreButtonScale }] }]}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#1F2937" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isSwipingCard}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            {/* Avatar */}
            <LinearGradient
              colors={categoryStyle.colors}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.avatarInitials, { color: categoryStyle.textColor }]}>
                {contact.initials}
              </Text>
            </LinearGradient>

            {/* Name */}
            <Text style={styles.contactName}>{contact.name}</Text>

            {/* Category Badge */}
            <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.badgeColor }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryStyle.textColor }]}>
                {contact.category}
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {contact.phoneNumber && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="call-outline" size={20} color="#6B7280" />
                  </View>
                  <Text style={styles.quickActionLabel}>Call</Text>
                </TouchableOpacity>
              )}
              {contact.email && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={handleEmail}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="mail" size={20} color="#6B7280" />
                  </View>
                  <Text style={styles.quickActionLabel}>Email</Text>
                </TouchableOpacity>
              )}
              {contact.instagram && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={handleInstagram}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="logo-instagram" size={20} color="#6B7280" />
                  </View>
                  <Text style={styles.quickActionLabel}>Instagram</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contact Reminder Card */}
          <View style={styles.card}>
            {contactAgainDate ? (
              <View style={styles.activeReminderContainer}>
                {/* Header Row */}
                <View style={styles.activeReminderHeader}>
                  <View style={[
                    styles.activeReminderIconSmall,
                    { backgroundColor: reminderStatus?.bgColor || '#F3F4F6' }
                  ]}>
                    <Ionicons
                      name="notifications"
                      size={16}
                      color={reminderStatus?.color || '#9CA3AF'}
                    />
                  </View>
                  <View style={styles.activeReminderTextContainer}>
                    <Text style={styles.activeReminderRelative}>
                      {getRelativeDate(contactAgainDate.toISOString())}
                    </Text>
                    <Text style={styles.activeReminderFullDate}>
                      {formatDate(contactAgainDate.toISOString())}
                    </Text>
                  </View>
                  {reminderStatus && (
                    <View style={[styles.activeReminderBadge, { backgroundColor: reminderStatus.bgColor }]}>
                      <View style={[styles.activeReminderBadgeDot, { backgroundColor: reminderStatus.color }]} />
                      <Text style={[styles.activeReminderBadgeText, { color: reminderStatus.color }]}>
                        {reminderStatus.label}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons Row */}
                <View style={styles.activeReminderActions}>
                  <TouchableOpacity
                    style={styles.activeReminderDoneButton}
                    onPress={handleMarkContacted}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    <Text style={styles.activeReminderDoneText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.activeReminderChangeButton}
                    onPress={handleDatePress}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#4B5563" />
                    <Text style={styles.activeReminderChangeText}>Change date</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyReminderContainer}>
                {/* Header Row with Icon and Text */}
                <View style={styles.emptyReminderHeader}>
                  <View style={styles.emptyReminderIconSmall}>
                    <Ionicons name="notifications" size={16} color="#1D4ED8" />
                  </View>
                  <View style={styles.emptyReminderTextContainer}>
                    <Text style={styles.emptyReminderTitle}>Stay in touch</Text>
                    <Text style={styles.emptyReminderSubtitle}>
                      Remind me to reach out to {contact.name.split(' ')[0]}
                    </Text>
                  </View>
                </View>

                {/* Quick Options Row */}
                <View style={styles.quickReminderOptions}>
                  <TouchableOpacity
                    style={styles.quickReminderChip}
                    onPress={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setContactAgainDate(nextWeek);
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickReminderChipText}>1 week</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickReminderChip}
                    onPress={() => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setContactAgainDate(nextMonth);
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickReminderChipText}>1 month</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickReminderChipCustom}
                    onPress={handleDatePress}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#4B5563" />
                    <Text style={styles.quickReminderChipText}>Custom</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Contact Info Card */}
          {hasContactInfo && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.cardIconCircle}>
                    <Ionicons name="person" size={18} color="#1D4ED8" />
                  </View>
                  <Text style={styles.cardTitle}>Contact Info</Text>
                </View>
              </View>

              <View style={styles.infoList}>
                {(() => {
                  // Build array of contact info items
                  const infoItems: Array<{
                    key: string;
                    icon: keyof typeof Ionicons.glyphMap;
                    iconColor: string;
                    label: string;
                    value: string;
                    onPress?: () => void;
                  }> = [];

                  if (contact.phoneNumber) {
                    infoItems.push({
                      key: 'phone',
                      icon: 'call-outline',
                      iconColor: '#1D4ED8',
                      label: 'Phone',
                      value: contact.phoneNumber,
                      onPress: handleCall,
                    });
                  }
                  if (contact.email) {
                    infoItems.push({
                      key: 'email',
                      icon: 'mail-outline',
                      iconColor: '#1D4ED8',
                      label: 'Email',
                      value: contact.email,
                      onPress: handleEmail,
                    });
                  }
                  if (contact.instagram) {
                    infoItems.push({
                      key: 'instagram',
                      icon: 'logo-instagram',
                      iconColor: '#1D4ED8',
                      label: 'Instagram',
                      value: `@${contact.instagram}`,
                      onPress: handleInstagram,
                    });
                  }
                  if (contact.location) {
                    infoItems.push({
                      key: 'location',
                      icon: 'location-outline',
                      iconColor: '#1D4ED8',
                      label: 'Location',
                      value: contact.location,
                      onPress: handleOpenMaps,
                    });
                  }
                  if (contact.dateOfBirth) {
                    infoItems.push({
                      key: 'birthday',
                      icon: 'gift-outline',
                      iconColor: '#1D4ED8',
                      label: 'Birthday',
                      value: formatBirthday(contact.dateOfBirth),
                    });
                  }

                  return infoItems.map((item, index) => (
                    <ContactInfoRow
                      key={item.key}
                      icon={item.icon}
                      iconColor={item.iconColor}
                      label={item.label}
                      value={item.value}
                      onPress={item.onPress}
                      isLast={index === infoItems.length - 1}
                    />
                  ));
                })()}
              </View>
            </View>
          )}

          {/* Notes Section */}
          <View style={styles.notesSection}>
            <View style={styles.notesSectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.sectionSubtitle}>Things you want to remember</Text>
              </View>
            </View>

            {/* Add Note Button */}
            <TouchableOpacity
              style={styles.addNoteCard}
              onPress={handleAddNotePress}
              activeOpacity={0.7}
            >
              <Text style={styles.addNotePlaceholder}>Add a note...</Text>
              <View style={styles.addNoteButton}>
                <Ionicons name="add" size={20} color="#1D4ED8" />
              </View>
            </TouchableOpacity>

            {/* Notes List */}
            {notes.map((note) => (
              <SwipeableNoteCard
                key={note.id}
                note={note}
                onEdit={() => handleEditNote(note)}
                onDelete={() => handleDeleteNote(note.id)}
                onSwipeStart={() => setIsSwipingCard(true)}
                onSwipeEnd={() => setIsSwipingCard(false)}
              />
            ))}

            {notes.length === 0 && (
              <View style={styles.emptyNotesContainer}>
                <View style={styles.emptyNotesIcon}>
                  <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyNotesText}>No notes yet</Text>
                <Text style={styles.emptyNotesSubtext}>
                  Add notes about {contact.name.split(' ')[0]} to remember important details
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Note Modal */}
        <Modal
          visible={noteModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setNoteModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setNoteModalVisible(false)}
                style={styles.roundButton}
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingNote ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity
                onPress={handleSaveNote}
                style={[styles.roundButton, !noteContent.trim() && styles.roundButtonDisabled]}
                disabled={!noteContent.trim()}
              >
                <Ionicons name="checkmark" size={20} color={noteContent.trim() ? "#1F2937" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputContainer}>
              <TextInput
                style={styles.modalTextInput}
                placeholder={`Write something about ${contact.name.split(' ')[0]}...`}
                placeholderTextColor="#9CA3AF"
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
              <View style={styles.datePickerHandle}>
                <View style={styles.datePickerHandleBar} />
              </View>

              <Text style={styles.datePickerTitle}>Contact Again Date</Text>

              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={contactAgainDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={styles.datePicker}
                />
              </View>

              <View style={styles.datePickerQuickOptions}>
                <TouchableOpacity
                  style={styles.quickDateOption}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setContactAgainDate(tomorrow);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDateText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateOption}
                  onPress={() => {
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setContactAgainDate(nextWeek);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDateText}>In a week</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickDateOption}
                  onPress={() => {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setContactAgainDate(nextMonth);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickDateText}>In a month</Text>
                </TouchableOpacity>
              </View>

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
            value={contactAgainDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* More Menu Modal */}
        <Modal
          visible={showMoreMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMoreMenu(false)}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowMoreMenu(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMoreMenu(false);
                  handleEdit();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={20} color="#1F2937" />
                <Text style={styles.menuItemText}>Edit Contact</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteContact}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Contact</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
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
  editButton: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
  },
  contactName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 24,
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Cards
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Reminder Content
  reminderContent: {},
  reminderDateRow: {
    marginBottom: 14,
  },
  reminderDate: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  reminderFullDate: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reminderActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Active Reminder State - Compact Design
  activeReminderContainer: {
    paddingVertical: 4,
  },
  activeReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeReminderIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeReminderTextContainer: {
    flex: 1,
  },
  activeReminderRelative: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  activeReminderFullDate: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 1,
  },
  activeReminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  activeReminderBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeReminderBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeReminderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  activeReminderDoneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 12,
  },
  activeReminderDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeReminderChangeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeReminderChangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },

  // Empty Reminder State - Compact Design
  emptyReminderContainer: {
    paddingVertical: 4,
  },
  emptyReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyReminderIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyReminderTextContainer: {
    flex: 1,
  },
  emptyReminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  emptyReminderSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 1,
  },
  quickReminderOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickReminderChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickReminderChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  quickReminderChipCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Contact Info
  infoList: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  infoValueTappable: {
    color: '#1D4ED8',
  },
  infoRowTappable: {},

  // Notes Section
  notesSection: {
    marginTop: 8,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  addNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addNotePlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  addNoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyNotesContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyNotesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyNotesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyNotesSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Swipeable Note Card
  noteCardWrapper: {
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  noteCardAnimatedWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  noteActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
  },
  noteSwipeAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  noteEditAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#6B7280',
  },
  noteDeleteAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  noteAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1D4ED8',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 24,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 60,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalInputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 24,
    padding: 0,
  },

  // Date Picker Modal
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
  datePickerQuickOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  quickDateOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickDateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  datePickerActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
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

  // More Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    top: 116,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuItemTextDanger: {
    color: '#DC2626',
  },
});

export default ContactDetailScreen;
