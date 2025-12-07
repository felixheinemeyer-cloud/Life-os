import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  TextInput,
  Linking,
  Modal,
  KeyboardAvoidingView,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Types
interface DatingDetailScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params?: {
      person?: DatingPerson;
      onDelete?: (personId: string) => void;
    };
  };
}

interface DatingPerson {
  id: string;
  name: string;
  initials: string;
  phoneNumber?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  rating?: number;
  createdAt: string;
  notes?: DatingNote[];
}

interface DatingNote {
  id: string;
  text: string;
  createdAt: string;
}

// Constants
const NOTE_ACTION_WIDTH = 136;

// Avatar colors - consistent dating theme
const AVATAR_GRADIENT: [string, string, string] = ['#FFF1F2', '#FFE4E6', '#FECDD3'];
const AVATAR_INITIALS_COLOR = '#BE123C';
const ACCENT_COLOR = '#BE123C';
const RATING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Helper functions
const formatBirthday = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

// Mock person data
const MOCK_PERSON: DatingPerson = {
  id: '1',
  name: 'Sophie',
  initials: 'S',
  phoneNumber: '+1 (555) 123-4567',
  instagram: 'sophie_h',
  location: 'Brooklyn, NY',
  dateOfBirth: '1998-06-15',
  rating: 9,
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  notes: [
    { id: '1', text: 'Loves Italian food and wine', createdAt: new Date().toISOString() },
    { id: '2', text: 'Works in marketing at a startup', createdAt: new Date().toISOString() },
  ],
};

// Rating Pill Component with animation
const RatingPill: React.FC<{
  value: number;
  isSelected: boolean;
  onPress: () => void;
}> = ({ value, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isSelected, bgAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F3F4F6', ACCENT_COLOR],
  });

  const textColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#6B7280', '#FFFFFF'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[styles.ratingPill, { backgroundColor }]}>
          <Animated.Text style={[styles.ratingPillText, { color: textColor }]}>
            {value}
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Swipeable Note Card Component
const SwipeableNoteCard: React.FC<{
  note: DatingNote;
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

// Info Row Component
const InfoRow: React.FC<{
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
const DatingDetailScreen: React.FC<DatingDetailScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  // Get person from params or use mock
  const person = route.params?.person || MOCK_PERSON;
  const onDelete = route.params?.onDelete;

  // State
  const [notes, setNotes] = useState<DatingNote[]>(person.notes || []);
  const [rating, setRating] = useState<number | null>(person.rating || null);
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<DatingNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Animation refs
  const moreButtonScale = useRef(new Animated.Value(1)).current;


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
    navigation.navigate('DatingEntry', { person: { ...person, rating } });
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

  const handleDeletePerson = () => {
    setShowMoreMenu(false);
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${person.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            onDelete?.(person.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (person.phoneNumber) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Linking.openURL(`tel:${person.phoneNumber.replace(/[^0-9+]/g, '')}`);
    }
  };

  const handleInstagram = () => {
    if (person.instagram) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Linking.openURL(`instagram://user?username=${person.instagram}`).catch(() => {
        Linking.openURL(`https://instagram.com/${person.instagram}`);
      });
    }
  };

  const handleOpenMaps = () => {
    if (person.location) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const encodedLocation = encodeURIComponent(person.location);
      Linking.openURL(`https://maps.apple.com/?q=${encodedLocation}`).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`);
      });
    }
  };

  // Rating handler
  const handleRatingPress = (value: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Toggle off if same rating is pressed
    if (rating === value) {
      setRating(null);
    } else {
      setRating(value);
    }
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

  const handleEditNote = (note: DatingNote) => {
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
      const newNote: DatingNote = {
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

  // Check if there's any info to display
  const hasInfo = person.phoneNumber || person.instagram || person.location || person.dateOfBirth;

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
              onPress={handleEdit}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={20} color="#1F2937" />
            </TouchableOpacity>
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
              colors={AVATAR_GRADIENT}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.avatarInitials, { color: AVATAR_INITIALS_COLOR }]}>
                {person.initials}
              </Text>
            </LinearGradient>

            {/* Name */}
            <Text style={styles.personName}>{person.name}</Text>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {person.phoneNumber && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="call-outline" size={20} color={ACCENT_COLOR} />
                  </View>
                  <Text style={styles.quickActionLabel}>Call</Text>
                </TouchableOpacity>
              )}
              {person.instagram && (
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={handleInstagram}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons name="logo-instagram" size={20} color={ACCENT_COLOR} />
                  </View>
                  <Text style={styles.quickActionLabel}>Instagram</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Rating Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.cardIconCircle}>
                  <Ionicons name="star-outline" size={18} color={ACCENT_COLOR} />
                </View>
                <Text style={styles.cardTitle}>Rating</Text>
              </View>
            </View>
            <View style={styles.ratingSelector}>
              {RATING_VALUES.map((value) => (
                <RatingPill
                  key={value}
                  value={value}
                  isSelected={rating === value}
                  onPress={() => handleRatingPress(value)}
                />
              ))}
            </View>
          </View>

          {/* Details Card */}
          {hasInfo && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.cardIconCircle}>
                    <Ionicons name="person" size={18} color={ACCENT_COLOR} />
                  </View>
                  <Text style={styles.cardTitle}>Details</Text>
                </View>
              </View>

              <View style={styles.infoList}>
                {(() => {
                  const infoItems: Array<{
                    key: string;
                    icon: keyof typeof Ionicons.glyphMap;
                    iconColor: string;
                    label: string;
                    value: string;
                    onPress?: () => void;
                  }> = [];

                  if (person.phoneNumber) {
                    infoItems.push({
                      key: 'phone',
                      icon: 'call-outline',
                      iconColor: ACCENT_COLOR,
                      label: 'Phone',
                      value: person.phoneNumber,
                      onPress: handleCall,
                    });
                  }
                  if (person.instagram) {
                    infoItems.push({
                      key: 'instagram',
                      icon: 'logo-instagram',
                      iconColor: ACCENT_COLOR,
                      label: 'Instagram',
                      value: `@${person.instagram}`,
                      onPress: handleInstagram,
                    });
                  }
                  if (person.location) {
                    infoItems.push({
                      key: 'location',
                      icon: 'location-outline',
                      iconColor: ACCENT_COLOR,
                      label: 'Location',
                      value: person.location,
                      onPress: handleOpenMaps,
                    });
                  }
                  if (person.dateOfBirth) {
                    infoItems.push({
                      key: 'birthday',
                      icon: 'gift-outline',
                      iconColor: ACCENT_COLOR,
                      label: 'Birthday',
                      value: formatBirthday(person.dateOfBirth),
                    });
                  }

                  return infoItems.map((item, index) => (
                    <InfoRow
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
                <Text style={styles.sectionSubtitle}>Things to remember about {person.name}</Text>
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
                <Ionicons name="add" size={20} color={ACCENT_COLOR} />
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
                  Add notes about {person.name} to remember important details
                </Text>
              </View>
            )}
          </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Header with Blur Background */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 0.85)',
              'rgba(247, 245, 242, 0.6)',
              'rgba(247, 245, 242, 0.3)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.headerGradient}
          />
        </View>
        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEdit}
            style={styles.editButton}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

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
                placeholder={`Write something about ${person.name}...`}
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
                onPress={handleDeletePerson}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Person</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    zIndex: 100,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },
  header: {
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
  personName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 20,
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
    backgroundColor: '#FFF1F2',
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
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },

  // Rating Selector
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  ratingPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Info List
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
    backgroundColor: '#FFF1F2',
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
    backgroundColor: '#FFF1F2',
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
    shadowColor: ACCENT_COLOR,
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
    backgroundColor: ACCENT_COLOR,
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

  // More Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    top: 100,
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
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuItemTextDanger: {
    color: '#DC2626',
  },
});

export default DatingDetailScreen;
