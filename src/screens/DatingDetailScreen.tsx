import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
  Linking,
  Modal,
  KeyboardAvoidingView,
  PanResponder,
  Alert,
  Dimensions,
  Easing,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

interface VibeRatings {
  attraction?: number;
  connection?: number;
  compatibility?: number;
}

interface DatingPerson {
  id: string;
  name: string;
  initials: string;
  phoneNumber?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  createdAt: string;
  notes?: DatingNote[];
  firstImpression?: FirstImpression;
  vibeRatings?: VibeRatings;
  flags?: Flag[];
  dateHistory?: DateEntry[];
}

interface DatingNote {
  id: string;
  text: string;
  createdAt: string;
}

interface FirstImpression {
  text: string;
  whenWeMet?: string;
}

interface Flag {
  id: string;
  text: string;
  type: 'green' | 'red';
  createdAt: string;
}

type DateVibeType = 'amazing' | 'good' | 'okay' | 'meh' | 'bad';

interface DateEntry {
  id: string;
  date: string;
  title: string;
  location?: string;
  vibe: DateVibeType;
  notes?: string;
  createdAt: string;
}

// Vibe configuration for the picker
const DATE_VIBES: { type: DateVibeType; emoji: string; label: string }[] = [
  { type: 'amazing', emoji: '🥰', label: 'Amazing' },
  { type: 'good', emoji: '😊', label: 'Good' },
  { type: 'okay', emoji: '😐', label: 'Okay' },
  { type: 'meh', emoji: '😕', label: 'Meh' },
  { type: 'bad', emoji: '😔', label: 'Bad' },
];

const getVibeEmoji = (type: DateVibeType): string => {
  return DATE_VIBES.find(v => v.type === type)?.emoji || '😐';
};

// Constants
const NOTE_ACTION_WIDTH = 136;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Avatar colors - consistent dating theme
const AVATAR_GRADIENT: [string, string, string] = ['#FFF1F2', '#FFE4E6', '#FECDD3'];
const AVATAR_INITIALS_COLOR = '#BE123C';
const ACCENT_COLOR = '#BE123C';

// Helper functions
const formatBirthday = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const formatWhenWeMet = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateEntryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  notes: [
    { id: '1', text: 'Loves Italian food and wine', createdAt: new Date().toISOString() },
    { id: '2', text: 'Works in marketing at a startup', createdAt: new Date().toISOString() },
  ],
  firstImpression: {
    text: 'She walked in with this incredible energy. We talked for 3 hours and it felt like 20 minutes. Her laugh is contagious.',
    whenWeMet: '2024-07-15',
  },
  vibeRatings: {
    attraction: 4,
    connection: 5,
    compatibility: 3,
  },
  flags: [
    { id: '1', text: 'Great listener', type: 'green', createdAt: new Date().toISOString() },
    { id: '2', text: 'Very ambitious', type: 'green', createdAt: new Date().toISOString() },
    { id: '3', text: 'Sometimes dismissive', type: 'red', createdAt: new Date().toISOString() },
  ],
  dateHistory: [
    {
      id: '1',
      date: '2024-08-10',
      title: 'Cooked dinner at her place',
      location: 'Her apartment, Brooklyn',
      vibe: 'amazing',
      notes: 'Made pasta together, watched the sunset from her balcony',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      date: '2024-08-03',
      title: 'Comedy show downtown',
      location: 'Comedy Cellar',
      vibe: 'good',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      date: '2024-07-28',
      title: 'First real date - dinner and walk',
      location: 'Osteria, West Village',
      vibe: 'amazing',
      notes: 'Talked for 4 hours, walked along the Hudson after',
      createdAt: new Date().toISOString(),
    },
  ],
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

// Vibe Rating Row Component
const VibeRatingRow: React.FC<{
  label: string;
  value: number | undefined;
  onRate: (rating: number) => void;
}> = ({ label, value, onRate }) => {
  const handleHeartPress = (rating: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Toggle off if same rating is pressed
    if (value === rating) {
      onRate(0);
    } else {
      onRate(rating);
    }
  };

  return (
    <View style={styles.vibeRatingRow}>
      <Text style={styles.vibeRatingLabel}>{label}</Text>
      <View style={styles.vibeRatingHearts}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            onPress={() => handleHeartPress(rating)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={value && rating <= value ? 'heart' : 'heart-outline'}
              size={20}
              color={value && rating <= value ? ACCENT_COLOR : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Flag Chip Component
const FlagChip: React.FC<{
  flag: Flag;
  onPress: () => void;
  onDelete: () => void;
}> = ({ flag, onPress, onDelete }) => {
  const isGreen = flag.type === 'green';

  return (
    <TouchableOpacity
      style={[
        styles.flagChip,
        isGreen ? styles.flagChipGreen : styles.flagChipRed,
      ]}
      onPress={onPress}
      onLongPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Alert.alert(
          'Delete Flag',
          `Remove "${flag.text}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isGreen ? 'checkmark-circle' : 'alert-circle'}
        size={14}
        color={isGreen ? '#15803D' : '#DC2626'}
      />
      <Text
        style={[
          styles.flagChipText,
          isGreen ? styles.flagChipTextGreen : styles.flagChipTextRed,
        ]}
        numberOfLines={1}
      >
        {flag.text}
      </Text>
    </TouchableOpacity>
  );
};

// Date Entry Row Component (Timeline Item)
const DateEntryRow: React.FC<{
  entry: DateEntry;
  isLast: boolean;
  onPress: () => void;
  onDelete: () => void;
}> = ({ entry, isLast, onPress, onDelete }) => {
  return (
    <TouchableOpacity
      style={styles.dateEntryRow}
      onPress={onPress}
      onLongPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Alert.alert(
          'Delete Date',
          `Remove "${entry.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      {/* Timeline */}
      <View style={styles.dateEntryTimeline}>
        <View style={styles.dateEntryDot} />
        {!isLast && <View style={styles.dateEntryLine} />}
      </View>

      {/* Content */}
      <View style={styles.dateEntryContent}>
        <View style={styles.dateEntryHeader}>
          <Text style={styles.dateEntryTitle} numberOfLines={2}>
            {entry.title}
          </Text>
          <Text style={styles.dateEntryVibe}>{getVibeEmoji(entry.vibe)}</Text>
        </View>
        {entry.location && (
          <View style={styles.dateEntryLocationRow}>
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text style={styles.dateEntryLocation} numberOfLines={1}>
              {entry.location}
            </Text>
          </View>
        )}
        <Text style={styles.dateEntryDate}>{formatDateEntryDate(entry.date)}</Text>
      </View>
    </TouchableOpacity>
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
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<DatingNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // First Impression state
  const [firstImpression, setFirstImpression] = useState<FirstImpression | null>(
    person.firstImpression || null
  );
  const [firstImpressionModalVisible, setFirstImpressionModalVisible] = useState(false);
  const [impressionText, setImpressionText] = useState('');
  const [whenWeMet, setWhenWeMet] = useState<Date | null>(null);
  const [showWhenWeMetPicker, setShowWhenWeMetPicker] = useState(false);

  // Vibe Ratings state
  const [vibeRatings, setVibeRatings] = useState<VibeRatings>(
    person.vibeRatings || {}
  );

  // Flags state
  const [flags, setFlags] = useState<Flag[]>(person.flags || []);
  const [flagModalVisible, setFlagModalVisible] = useState(false);
  const [flagType, setFlagType] = useState<'green' | 'red'>('green');
  const [flagText, setFlagText] = useState('');
  const [editingFlag, setEditingFlag] = useState<Flag | null>(null);

  // Date History state
  const [dateHistory, setDateHistory] = useState<DateEntry[]>(
    (person.dateHistory || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [editingDateEntry, setEditingDateEntry] = useState<DateEntry | null>(null);
  const [dateEntryDate, setDateEntryDate] = useState<Date>(new Date());
  const [dateEntryTitle, setDateEntryTitle] = useState('');
  const [dateEntryLocation, setDateEntryLocation] = useState('');
  const [dateEntryVibe, setDateEntryVibe] = useState<DateVibeType | null>(null);
  const [dateEntryNotes, setDateEntryNotes] = useState('');
  const [showDateEntryPicker, setShowDateEntryPicker] = useState(false);

  // Animation refs
  const moreButtonScale = useRef(new Animated.Value(1)).current;
  const whenWeMetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dateEntryPickerTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const detailsChevronRotation = useRef(new Animated.Value(0)).current;

  // Details expand/collapse handler
  const toggleDetailsExpanded = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const toValue = detailsExpanded ? 0 : 1;
    Animated.spring(detailsChevronRotation, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
    setDetailsExpanded(!detailsExpanded);
  };

  const detailsChevronStyle = {
    transform: [
      {
        rotate: detailsChevronRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

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
    navigation.navigate('DatingEntry', { person });
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

  // Vibe Rating handlers
  const handleVibeRating = (type: keyof VibeRatings, rating: number) => {
    setVibeRatings((prev) => ({
      ...prev,
      [type]: rating === 0 ? undefined : rating,
    }));
  };

  // Flag handlers
  const handleAddFlag = (type: 'green' | 'red') => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFlagType(type);
    setFlagText('');
    setEditingFlag(null);
    setFlagModalVisible(true);
  };

  const handleEditFlag = (flag: Flag) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFlagType(flag.type);
    setFlagText(flag.text);
    setEditingFlag(flag);
    setFlagModalVisible(true);
  };

  const handleSaveFlag = () => {
    if (!flagText.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (editingFlag) {
      setFlags((prev) =>
        prev.map((f) =>
          f.id === editingFlag.id ? { ...f, text: flagText.trim(), type: flagType } : f
        )
      );
    } else {
      const newFlag: Flag = {
        id: Date.now().toString(),
        text: flagText.trim(),
        type: flagType,
        createdAt: new Date().toISOString(),
      };
      setFlags((prev) => [...prev, newFlag]);
    }

    setFlagModalVisible(false);
    setFlagText('');
    setEditingFlag(null);
  };

  const handleDeleteFlag = (flagId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setFlags((prev) => prev.filter((f) => f.id !== flagId));
  };

  const handleCloseFlagModal = () => {
    setFlagModalVisible(false);
    setFlagText('');
    setEditingFlag(null);
  };

  // Date History handlers
  const handleAddDateEntry = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingDateEntry(null);
    setDateEntryDate(new Date());
    setDateEntryTitle('');
    setDateEntryLocation('');
    setDateEntryVibe(null);
    setDateEntryNotes('');
    setDateModalVisible(true);
  };

  const handleEditDateEntry = (entry: DateEntry) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingDateEntry(entry);
    setDateEntryDate(new Date(entry.date));
    setDateEntryTitle(entry.title);
    setDateEntryLocation(entry.location || '');
    setDateEntryVibe(entry.vibe);
    setDateEntryNotes(entry.notes || '');
    setDateModalVisible(true);
  };

  const handleSaveDateEntry = () => {
    if (!dateEntryTitle.trim() || !dateEntryVibe) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (editingDateEntry) {
      setDateHistory((prev) =>
        prev
          .map((d) =>
            d.id === editingDateEntry.id
              ? {
                  ...d,
                  date: dateEntryDate.toISOString(),
                  title: dateEntryTitle.trim(),
                  location: dateEntryLocation.trim() || undefined,
                  vibe: dateEntryVibe,
                  notes: dateEntryNotes.trim() || undefined,
                }
              : d
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    } else {
      const newEntry: DateEntry = {
        id: Date.now().toString(),
        date: dateEntryDate.toISOString(),
        title: dateEntryTitle.trim(),
        location: dateEntryLocation.trim() || undefined,
        vibe: dateEntryVibe,
        notes: dateEntryNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setDateHistory((prev) =>
        [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
    }

    handleCloseDateModal();
  };

  const handleDeleteDateEntry = (entryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setDateHistory((prev) => prev.filter((d) => d.id !== entryId));
  };

  const handleCloseDateModal = () => {
    setDateModalVisible(false);
    setEditingDateEntry(null);
    setDateEntryTitle('');
    setDateEntryLocation('');
    setDateEntryVibe(null);
    setDateEntryNotes('');
  };

  const openDateEntryPicker = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dateEntryPickerTranslateY.setValue(SCREEN_HEIGHT);
    setShowDateEntryPicker(true);
    Animated.timing(dateEntryPickerTranslateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDateEntryPicker = () => {
    Animated.timing(dateEntryPickerTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowDateEntryPicker(false);
    });
  };

  const handleDateEntryDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDateEntryPicker(false);
    }
    if (selectedDate) {
      setDateEntryDate(selectedDate);
    }
  };

  // First Impression handlers
  const handleFirstImpressionPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Initialize modal with existing data
    setImpressionText(firstImpression?.text || '');
    setWhenWeMet(firstImpression?.whenWeMet ? new Date(firstImpression.whenWeMet) : null);
    setFirstImpressionModalVisible(true);
  };

  const handleSaveFirstImpression = () => {
    if (!impressionText.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setFirstImpression({
      text: impressionText.trim(),
      whenWeMet: whenWeMet?.toISOString() || undefined,
    });

    setFirstImpressionModalVisible(false);
  };

  const handleCloseFirstImpressionModal = () => {
    setFirstImpressionModalVisible(false);
  };

  const handleClearFirstImpression = () => {
    Alert.alert(
      'Remove First Impression',
      'Are you sure you want to remove your first impression?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            setFirstImpression(null);
            setFirstImpressionModalVisible(false);
          },
        },
      ]
    );
  };

  // When We Met picker handlers
  const openWhenWeMetPicker = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    whenWeMetTranslateY.setValue(SCREEN_HEIGHT);
    setShowWhenWeMetPicker(true);
    Animated.timing(whenWeMetTranslateY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeWhenWeMetPicker = () => {
    Animated.timing(whenWeMetTranslateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowWhenWeMetPicker(false);
    });
  };

  const handleWhenWeMetChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowWhenWeMetPicker(false);
    }
    if (selectedDate) {
      setWhenWeMet(selectedDate);
    }
  };

  const clearWhenWeMet = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setWhenWeMet(null);
    closeWhenWeMetPicker();
  };

  // Check if there's any info to display
  const hasInfo = person.phoneNumber || person.instagram || person.location || person.dateOfBirth;

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60 },
        ]}
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

          {/* Details Card - Expandable */}
          {hasInfo && (
            <View style={styles.detailsCard}>
              <TouchableOpacity
                style={styles.detailsCardHeader}
                onPress={toggleDetailsExpanded}
                activeOpacity={0.7}
              >
                <View style={styles.detailsCardHeaderLeft}>
                  <View style={styles.detailsCardIconCircle}>
                    <Ionicons name="person" size={12} color={ACCENT_COLOR} />
                  </View>
                  <Text style={styles.detailsCardTitle}>Details</Text>
                </View>
                <Animated.View style={detailsChevronStyle}>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </Animated.View>
              </TouchableOpacity>

              {detailsExpanded && (
                <View style={styles.detailsCardContent}>
                  {(() => {
                    const detailItems: Array<{
                      key: string;
                      icon: keyof typeof Ionicons.glyphMap;
                      label: string;
                      value: string;
                      onPress?: () => void;
                    }> = [];

                    if (person.phoneNumber) {
                      detailItems.push({
                        key: 'phone',
                        icon: 'call-outline',
                        label: 'Phone',
                        value: person.phoneNumber,
                        onPress: handleCall,
                      });
                    }
                    if (person.instagram) {
                      detailItems.push({
                        key: 'instagram',
                        icon: 'logo-instagram',
                        label: 'Instagram',
                        value: `@${person.instagram}`,
                        onPress: handleInstagram,
                      });
                    }
                    if (person.location) {
                      detailItems.push({
                        key: 'location',
                        icon: 'location-outline',
                        label: 'Location',
                        value: person.location,
                        onPress: handleOpenMaps,
                      });
                    }
                    if (person.dateOfBirth) {
                      detailItems.push({
                        key: 'birthday',
                        icon: 'gift-outline',
                        label: 'Birthday',
                        value: formatBirthday(person.dateOfBirth),
                      });
                    }

                    return detailItems.map((item, index) => {
                      const isLast = index === detailItems.length - 1;
                      const Component = item.onPress ? TouchableOpacity : View;

                      return (
                        <Component
                          key={item.key}
                          style={[styles.detailsRow, isLast && styles.detailsRowLast]}
                          onPress={item.onPress}
                          activeOpacity={item.onPress ? 0.7 : 1}
                        >
                          <View style={styles.detailsRowIcon}>
                            <Ionicons name={item.icon} size={16} color={ACCENT_COLOR} />
                          </View>
                          <View style={styles.detailsRowContent}>
                            <Text style={styles.detailsRowLabel}>{item.label}</Text>
                            <Text style={styles.detailsRowValue}>{item.value}</Text>
                          </View>
                          {item.onPress && (
                            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                          )}
                        </Component>
                      );
                    });
                  })()}
                </View>
              )}
            </View>
          )}

          {/* First Impression Card */}
          <TouchableOpacity
            style={[
              styles.firstImpressionCard,
              !firstImpression && styles.firstImpressionCardEmpty,
            ]}
            onPress={handleFirstImpressionPress}
            activeOpacity={0.7}
          >
            {firstImpression ? (
              // Filled State
              <>
                <View style={styles.firstImpressionAccent} />
                <View style={styles.firstImpressionContent}>
                  <View style={styles.firstImpressionHeader}>
                    <View style={styles.firstImpressionIconCircle}>
                      <Ionicons name="sparkles" size={12} color={ACCENT_COLOR} />
                    </View>
                    <Text style={styles.firstImpressionLabel}>First Impression</Text>
                  </View>
                  <Text style={styles.firstImpressionText}>
                    "{firstImpression.text}"
                  </Text>
                  {firstImpression.whenWeMet && (
                    <View style={styles.firstImpressionMeta}>
                      <View style={styles.metaTag}>
                        <Ionicons name="calendar-outline" size={10} color="#6B7280" />
                        <Text style={styles.metaTagText}>
                          {formatWhenWeMet(firstImpression.whenWeMet)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                <View style={styles.firstImpressionEditHint}>
                  <Ionicons name="pencil" size={12} color="#C4C4C4" />
                </View>
              </>
            ) : (
              // Empty State
              <>
                <View style={styles.firstImpressionEmptyContent}>
                  <View style={styles.firstImpressionEmptyIconCircle}>
                    <Ionicons name="sparkles-outline" size={18} color={ACCENT_COLOR} />
                  </View>
                  <View style={styles.firstImpressionEmptyText}>
                    <Text style={styles.firstImpressionEmptyTitle}>First Impression</Text>
                    <Text style={styles.firstImpressionEmptySubtitle}>
                      What stood out when you first met?
                    </Text>
                  </View>
                </View>
                <View style={styles.firstImpressionAddButton}>
                  <Ionicons name="add" size={18} color={ACCENT_COLOR} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Vibe Ratings Card */}
          <View style={styles.vibeCard}>
            <View style={styles.vibeCardHeader}>
              <View style={styles.vibeCardIconCircle}>
                <Ionicons name="heart" size={12} color={ACCENT_COLOR} />
              </View>
              <Text style={styles.vibeCardTitle}>The Vibe</Text>
            </View>
            <View style={styles.vibeRatingsContainer}>
              <VibeRatingRow
                label="Attraction"
                value={vibeRatings.attraction}
                onRate={(rating) => handleVibeRating('attraction', rating)}
              />
              <VibeRatingRow
                label="Connection"
                value={vibeRatings.connection}
                onRate={(rating) => handleVibeRating('connection', rating)}
              />
              <VibeRatingRow
                label="Compatibility"
                value={vibeRatings.compatibility}
                onRate={(rating) => handleVibeRating('compatibility', rating)}
              />
            </View>
          </View>

          {/* Flags Card */}
          <View style={styles.flagsCard}>
            <View style={styles.flagsCardHeader}>
              <View style={styles.flagsCardIconCircle}>
                <Ionicons name="flag" size={12} color={ACCENT_COLOR} />
              </View>
              <Text style={styles.flagsCardTitle}>Flags</Text>
            </View>

            {flags.length > 0 ? (
              <View style={styles.flagsContainer}>
                {/* Green Flags */}
                {flags.filter((f) => f.type === 'green').length > 0 && (
                  <View style={styles.flagsSection}>
                    <Text style={styles.flagsSectionLabel}>Green</Text>
                    <View style={styles.flagsChipsRow}>
                      {flags
                        .filter((f) => f.type === 'green')
                        .map((flag) => (
                          <FlagChip
                            key={flag.id}
                            flag={flag}
                            onPress={() => handleEditFlag(flag)}
                            onDelete={() => handleDeleteFlag(flag.id)}
                          />
                        ))}
                    </View>
                  </View>
                )}

                {/* Red Flags */}
                {flags.filter((f) => f.type === 'red').length > 0 && (
                  <View style={styles.flagsSection}>
                    <Text style={styles.flagsSectionLabel}>Red</Text>
                    <View style={styles.flagsChipsRow}>
                      {flags
                        .filter((f) => f.type === 'red')
                        .map((flag) => (
                          <FlagChip
                            key={flag.id}
                            flag={flag}
                            onPress={() => handleEditFlag(flag)}
                            onDelete={() => handleDeleteFlag(flag.id)}
                          />
                        ))}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.flagsEmptyText}>
                No flags yet. Add green or red flags to track patterns.
              </Text>
            )}

            {/* Add Flag Buttons */}
            <View style={styles.flagsAddButtons}>
              <TouchableOpacity
                style={styles.flagsAddButtonGreen}
                onPress={() => handleAddFlag('green')}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#15803D" />
                <Text style={styles.flagsAddButtonGreenText}>Green</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.flagsAddButtonRed}
                onPress={() => handleAddFlag('red')}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#DC2626" />
                <Text style={styles.flagsAddButtonRedText}>Red</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date History Card */}
          <View style={styles.dateHistoryCard}>
            <View style={styles.dateHistoryHeader}>
              <View style={styles.dateHistoryHeaderLeft}>
                <View style={styles.dateHistoryIconCircle}>
                  <Ionicons name="calendar" size={12} color={ACCENT_COLOR} />
                </View>
                <Text style={styles.dateHistoryTitle}>Date History</Text>
              </View>
              <TouchableOpacity
                style={styles.dateHistoryAddButton}
                onPress={handleAddDateEntry}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={ACCENT_COLOR} />
              </TouchableOpacity>
            </View>

            {dateHistory.length > 0 ? (
              <View style={styles.dateHistoryTimeline}>
                {dateHistory.map((entry, index) => (
                  <DateEntryRow
                    key={entry.id}
                    entry={entry}
                    isLast={index === dateHistory.length - 1}
                    onPress={() => handleEditDateEntry(entry)}
                    onDelete={() => handleDeleteDateEntry(entry.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.dateHistoryEmpty}>
                <View style={styles.dateHistoryEmptyIcon}>
                  <Ionicons name="heart-outline" size={24} color="#D1D5DB" />
                </View>
                <Text style={styles.dateHistoryEmptyText}>No dates logged yet</Text>
                <Text style={styles.dateHistoryEmptySubtext}>
                  Start tracking your dating journey
                </Text>
                <TouchableOpacity
                  style={styles.dateHistoryEmptyButton}
                  onPress={handleAddDateEntry}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.dateHistoryEmptyButtonText}>Log First Date</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Details Card */}
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

      {/* Fixed Header with Gradient Fade */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(240, 238, 232, 0.95)',
              'rgba(240, 238, 232, 0.8)',
              'rgba(240, 238, 232, 0.4)',
              'rgba(240, 238, 232, 0)',
            ]}
            locations={[0, 0.4, 0.75, 1]}
            style={styles.headerGradient}
          />
        </View>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
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

        {/* First Impression Modal */}
        <Modal
          visible={firstImpressionModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseFirstImpressionModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.impressionModalContainer}
          >
            {/* Modal Header */}
            <View style={styles.impressionModalHeader}>
              <TouchableOpacity
                onPress={handleCloseFirstImpressionModal}
                style={styles.roundButton}
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.impressionModalTitle}>First Impression</Text>
              <TouchableOpacity
                onPress={handleSaveFirstImpression}
                style={[styles.roundButton, !impressionText.trim() && styles.roundButtonDisabled]}
                disabled={!impressionText.trim()}
              >
                <Ionicons name="checkmark" size={20} color={impressionText.trim() ? "#1F2937" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.impressionModalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Impression Text Input */}
              <View style={styles.impressionInputSection}>
                <Text style={styles.impressionInputLabel}>
                  What was your first impression of {person.name}?
                </Text>
                <View style={styles.impressionTextInputContainer}>
                  <TextInput
                    style={styles.impressionTextInput}
                    placeholder="She walked in with this incredible energy..."
                    placeholderTextColor="#9CA3AF"
                    value={impressionText}
                    onChangeText={setImpressionText}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                  />
                </View>
              </View>

              {/* When We Met Section */}
              <View style={styles.impressionMetaSection}>
                <Text style={styles.impressionMetaLabel}>When did you first meet?</Text>
                <TouchableOpacity
                  style={styles.impressionMetaButton}
                  onPress={openWhenWeMetPicker}
                  activeOpacity={0.7}
                >
                  {whenWeMet ? (
                    <View style={styles.impressionMetaSelected}>
                      <View style={styles.impressionMetaSelectedIcon}>
                        <Ionicons name="calendar" size={18} color={ACCENT_COLOR} />
                      </View>
                      <Text style={styles.impressionMetaSelectedText}>
                        {formatWhenWeMet(whenWeMet.toISOString())}
                      </Text>
                      <TouchableOpacity
                        onPress={clearWhenWeMet}
                        style={styles.impressionMetaClear}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#C4C4C4" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.impressionMetaPlaceholder}>
                      <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                      <Text style={styles.impressionMetaPlaceholderText}>Select when you met</Text>
                      <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Remove Button - only show when editing existing impression */}
              {firstImpression && (
                <View style={styles.impressionRemoveSection}>
                  <TouchableOpacity
                    style={styles.impressionRemoveButton}
                    onPress={handleClearFirstImpression}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    <Text style={styles.impressionRemoveText}>Remove First Impression</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* When We Met Date Picker (iOS) */}
          {showWhenWeMetPicker && Platform.OS === 'ios' && (
            <View style={styles.pickerOverlay}>
              <TouchableOpacity
                style={styles.pickerBackdrop}
                activeOpacity={1}
                onPress={closeWhenWeMetPicker}
              />
              <Animated.View
                style={[
                  styles.datePickerContainer,
                  { transform: [{ translateY: whenWeMetTranslateY }] },
                ]}
              >
                <View style={styles.pickerHandle}>
                  <View style={styles.pickerHandleBar} />
                </View>
                <Text style={styles.pickerTitle}>When did you first meet?</Text>

                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={whenWeMet || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={handleWhenWeMetChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(2000, 0, 1)}
                    style={styles.datePicker}
                  />
                </View>

                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    onPress={clearWhenWeMet}
                    style={styles.datePickerClearButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerClearText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeWhenWeMetPicker}
                    style={styles.datePickerDoneButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          )}
        </Modal>

        {/* Android Date Picker for When We Met */}
        {showWhenWeMetPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={whenWeMet || new Date()}
            mode="date"
            display="default"
            onChange={handleWhenWeMetChange}
            maximumDate={new Date()}
            minimumDate={new Date(2000, 0, 1)}
          />
        )}

        {/* Flag Modal */}
        <Modal
          visible={flagModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseFlagModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flagModalContainer}
          >
            {/* Modal Header */}
            <View style={styles.flagModalHeader}>
              <TouchableOpacity
                onPress={handleCloseFlagModal}
                style={styles.roundButton}
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.flagModalTitle}>
                {editingFlag ? 'Edit Flag' : 'Add Flag'}
              </Text>
              <TouchableOpacity
                onPress={handleSaveFlag}
                style={[styles.roundButton, !flagText.trim() && styles.roundButtonDisabled]}
                disabled={!flagText.trim()}
              >
                <Ionicons name="checkmark" size={20} color={flagText.trim() ? "#1F2937" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.flagModalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Flag Type Selector */}
              <View style={styles.flagTypeSection}>
                <Text style={styles.flagTypeSectionLabel}>Flag Type</Text>
                <View style={styles.flagTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.flagTypeButton,
                      flagType === 'green' && styles.flagTypeButtonGreenActive,
                    ]}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setFlagType('green');
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={flagType === 'green' ? '#15803D' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.flagTypeButtonText,
                        flagType === 'green' && styles.flagTypeButtonTextGreen,
                      ]}
                    >
                      Green Flag
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.flagTypeButton,
                      flagType === 'red' && styles.flagTypeButtonRedActive,
                    ]}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setFlagType('red');
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={flagType === 'red' ? '#DC2626' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.flagTypeButtonText,
                        flagType === 'red' && styles.flagTypeButtonTextRed,
                      ]}
                    >
                      Red Flag
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Flag Text Input */}
              <View style={styles.flagInputSection}>
                <Text style={styles.flagInputLabel}>
                  {flagType === 'green' ? 'What\'s the positive trait?' : 'What\'s the concern?'}
                </Text>
                <View style={[
                  styles.flagTextInputContainer,
                  flagType === 'green' ? styles.flagTextInputContainerGreen : styles.flagTextInputContainerRed,
                ]}>
                  <TextInput
                    style={styles.flagTextInput}
                    placeholder={flagType === 'green' ? 'e.g., Great listener, Very supportive...' : 'e.g., Often late, Dismissive...'}
                    placeholderTextColor="#9CA3AF"
                    value={flagText}
                    onChangeText={setFlagText}
                    autoFocus
                    maxLength={50}
                  />
                </View>
                <Text style={styles.flagCharCount}>{flagText.length}/50</Text>
              </View>

              {/* Delete Button - only show when editing */}
              {editingFlag && (
                <View style={styles.flagDeleteSection}>
                  <TouchableOpacity
                    style={styles.flagDeleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Flag',
                        `Remove "${editingFlag.text}"?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              handleDeleteFlag(editingFlag.id);
                              handleCloseFlagModal();
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    <Text style={styles.flagDeleteText}>Delete Flag</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Date Entry Modal */}
        <Modal
          visible={dateModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCloseDateModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.dateModalContainer}
          >
            {/* Modal Header */}
            <View style={styles.dateModalHeader}>
              <TouchableOpacity
                onPress={handleCloseDateModal}
                style={styles.roundButton}
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.dateModalTitle}>
                {editingDateEntry ? 'Edit Date' : 'Log Date'}
              </Text>
              <TouchableOpacity
                onPress={handleSaveDateEntry}
                style={[
                  styles.roundButton,
                  (!dateEntryTitle.trim() || !dateEntryVibe) && styles.roundButtonDisabled,
                ]}
                disabled={!dateEntryTitle.trim() || !dateEntryVibe}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={dateEntryTitle.trim() && dateEntryVibe ? '#1F2937' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.dateModalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* When Section */}
              <View style={styles.dateModalSection}>
                <Text style={styles.dateModalSectionLabel}>When?</Text>
                <TouchableOpacity
                  style={styles.dateModalDateButton}
                  onPress={openDateEntryPicker}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color={ACCENT_COLOR} />
                  <Text style={styles.dateModalDateText}>
                    {formatDateEntryDate(dateEntryDate.toISOString())}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
                </TouchableOpacity>
              </View>

              {/* What Section */}
              <View style={styles.dateModalSection}>
                <Text style={styles.dateModalSectionLabel}>What did you do?</Text>
                <View style={styles.dateModalInputContainer}>
                  <TextInput
                    style={styles.dateModalInput}
                    placeholder="e.g., Dinner and a walk by the river"
                    placeholderTextColor="#9CA3AF"
                    value={dateEntryTitle}
                    onChangeText={setDateEntryTitle}
                    maxLength={100}
                  />
                </View>
              </View>

              {/* Where Section */}
              <View style={styles.dateModalSection}>
                <Text style={styles.dateModalSectionLabel}>Where? (optional)</Text>
                <View style={styles.dateModalInputContainer}>
                  <TextInput
                    style={styles.dateModalInput}
                    placeholder="e.g., Blue Bottle Coffee, Brooklyn"
                    placeholderTextColor="#9CA3AF"
                    value={dateEntryLocation}
                    onChangeText={setDateEntryLocation}
                    maxLength={80}
                  />
                </View>
              </View>

              {/* Vibe Section */}
              <View style={styles.dateModalSection}>
                <Text style={styles.dateModalSectionLabel}>How did it go?</Text>
                <View style={styles.vibePickerContainer}>
                  {DATE_VIBES.map((vibe) => (
                    <TouchableOpacity
                      key={vibe.type}
                      style={[
                        styles.vibePickerItem,
                        dateEntryVibe === vibe.type && styles.vibePickerItemSelected,
                      ]}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setDateEntryVibe(vibe.type);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.vibePickerEmoji}>{vibe.emoji}</Text>
                      <Text
                        style={[
                          styles.vibePickerLabel,
                          dateEntryVibe === vibe.type && styles.vibePickerLabelSelected,
                        ]}
                      >
                        {vibe.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes Section */}
              <View style={styles.dateModalSection}>
                <Text style={styles.dateModalSectionLabel}>Notes (optional)</Text>
                <View style={styles.dateModalNotesContainer}>
                  <TextInput
                    style={styles.dateModalNotesInput}
                    placeholder="Any memorable moments..."
                    placeholderTextColor="#9CA3AF"
                    value={dateEntryNotes}
                    onChangeText={setDateEntryNotes}
                    multiline
                    textAlignVertical="top"
                    maxLength={300}
                  />
                </View>
              </View>

              {/* Delete Button - only show when editing */}
              {editingDateEntry && (
                <View style={styles.dateModalDeleteSection}>
                  <TouchableOpacity
                    style={styles.dateModalDeleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Date',
                        `Remove "${editingDateEntry.title}"?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              handleDeleteDateEntry(editingDateEntry.id);
                              handleCloseDateModal();
                            },
                          },
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    <Text style={styles.dateModalDeleteText}>Delete Date</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Date Picker (iOS) */}
          {showDateEntryPicker && Platform.OS === 'ios' && (
            <View style={styles.pickerOverlay}>
              <TouchableOpacity
                style={styles.pickerBackdrop}
                activeOpacity={1}
                onPress={closeDateEntryPicker}
              />
              <Animated.View
                style={[
                  styles.datePickerContainer,
                  { transform: [{ translateY: dateEntryPickerTranslateY }] },
                ]}
              >
                <View style={styles.pickerHandle}>
                  <View style={styles.pickerHandleBar} />
                </View>
                <Text style={styles.pickerTitle}>When was the date?</Text>

                <View style={styles.datePickerWrapper}>
                  <DateTimePicker
                    value={dateEntryDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateEntryDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(2000, 0, 1)}
                    style={styles.datePicker}
                  />
                </View>

                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setDateEntryDate(new Date());
                      closeDateEntryPicker();
                    }}
                    style={styles.datePickerClearButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerClearText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeDateEntryPicker}
                    style={styles.datePickerDoneButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          )}
        </Modal>

        {/* Android Date Picker for Date Entry */}
        {showDateEntryPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dateEntryDate}
            mode="date"
            display="default"
            onChange={handleDateEntryDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(2000, 0, 1)}
          />
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Fixed Header with Gradient
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerGradient: {
    flex: 1,
    height: 120,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
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
    paddingTop: 8, paddingBottom: 12,
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
    backgroundColor: '#FFE4E6',
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
    paddingTop: 8, paddingBottom: 12,
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

  // First Impression Card - Filled State
  firstImpressionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    paddingLeft: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  firstImpressionCardEmpty: {
    paddingLeft: 14,
  },
  firstImpressionAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: ACCENT_COLOR,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  firstImpressionContent: {
    flex: 1,
  },
  firstImpressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  firstImpressionIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstImpressionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  firstImpressionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  firstImpressionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  metaTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  firstImpressionEditHint: {
    marginLeft: 8,
    marginTop: 2,
  },

  // First Impression Card - Empty State
  firstImpressionEmptyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  firstImpressionEmptyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstImpressionEmptyText: {
    flex: 1,
  },
  firstImpressionEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  firstImpressionEmptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  firstImpressionAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Vibe Ratings Card
  vibeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  vibeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  vibeCardIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vibeRatingsContainer: {
    gap: 10,
  },
  vibeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vibeRatingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  vibeRatingHearts: {
    flexDirection: 'row',
    gap: 6,
  },

  // First Impression Modal
  impressionModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  impressionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  impressionModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  impressionModalScroll: {
    flex: 1,
  },
  impressionInputSection: {
    padding: 20,
  },
  impressionInputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  impressionTextInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 140,
  },
  impressionTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 24,
    padding: 16,
    minHeight: 140,
  },

  // Impression Meta Sections
  impressionMetaSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  impressionMetaLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
  },
  impressionMetaButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  impressionMetaPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  impressionMetaPlaceholderText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  impressionMetaSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  impressionMetaSelectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  impressionMetaSelectedText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  impressionMetaClear: {
    padding: 4,
  },

  // Remove First Impression
  impressionRemoveSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  impressionRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  impressionRemoveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Picker Overlay (shared)
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pickerHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  pickerHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // Date Picker (When We Met)
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
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

  // Flags Card
  flagsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  flagsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  flagsCardIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagsCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flagsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  flagsSection: {
    gap: 6,
  },
  flagsSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  flagsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flagsEmptyText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  flagsAddButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  flagsAddButtonGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  flagsAddButtonGreenText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  flagsAddButtonRed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  flagsAddButtonRedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Flag Chip
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  flagChipGreen: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  flagChipRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  flagChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  flagChipTextGreen: {
    color: '#15803D',
  },
  flagChipTextRed: {
    color: '#DC2626',
  },

  // Flag Modal
  flagModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flagModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  flagModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  flagModalScroll: {
    flex: 1,
  },
  flagTypeSection: {
    padding: 20,
  },
  flagTypeSectionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  flagTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  flagTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  flagTypeButtonGreenActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  flagTypeButtonRedActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  flagTypeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  flagTypeButtonTextGreen: {
    color: '#15803D',
  },
  flagTypeButtonTextRed: {
    color: '#DC2626',
  },
  flagInputSection: {
    paddingHorizontal: 20,
  },
  flagInputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
  },
  flagTextInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  flagTextInputContainerGreen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  flagTextInputContainerRed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  flagTextInput: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    padding: 0,
  },
  flagCharCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  flagDeleteSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  flagDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  flagDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Date History Card
  dateHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dateHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateHistoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateHistoryIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateHistoryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateHistoryAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateHistoryTimeline: {
    paddingLeft: 4,
  },

  // Date Entry Row (Timeline Item)
  dateEntryRow: {
    flexDirection: 'row',
    minHeight: 70,
  },
  dateEntryTimeline: {
    width: 24,
    alignItems: 'center',
  },
  dateEntryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT_COLOR,
    marginTop: 4,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  dateEntryLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    marginBottom: -4,
  },
  dateEntryContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  dateEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  dateEntryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
  dateEntryVibe: {
    fontSize: 18,
  },
  dateEntryLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  dateEntryLocation: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    flex: 1,
  },
  dateEntryDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Date History Empty State
  dateHistoryEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  dateHistoryEmptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateHistoryEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  dateHistoryEmptySubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginBottom: 14,
  },
  dateHistoryEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  dateHistoryEmptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Date Entry Modal
  dateModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  dateModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateModalScroll: {
    flex: 1,
  },
  dateModalSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dateModalSectionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 10,
  },
  dateModalDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 10,
  },
  dateModalDateText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  dateModalInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateModalInput: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    padding: 0,
  },
  dateModalNotesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  dateModalNotesInput: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    padding: 14,
    minHeight: 100,
  },
  dateModalDeleteSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  dateModalDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  dateModalDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Vibe Picker
  vibePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  vibePickerItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  vibePickerItemSelected: {
    backgroundColor: '#FFF1F2',
    borderColor: ACCENT_COLOR,
  },
  vibePickerEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  vibePickerLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  vibePickerLabelSelected: {
    color: ACCENT_COLOR,
    fontWeight: '600',
  },

  // Expandable Details Card
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  detailsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    paddingHorizontal: 16,
  },
  detailsCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsCardIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsRowLast: {
    borderBottomWidth: 0,
  },
  detailsRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsRowContent: {
    flex: 1,
  },
  detailsRowLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailsRowValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default DatingDetailScreen;
