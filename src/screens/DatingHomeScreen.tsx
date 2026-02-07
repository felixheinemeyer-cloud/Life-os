import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
  Animated, Easing, Dimensions, Modal, TouchableWithoutFeedback,
  Linking, TextInput, KeyboardAvoidingView, PanResponder, Alert,
  LayoutAnimation, UIManager,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── Types ───────────────────────────────────────────────────────────────────
interface DatingHomeScreenProps {
  navigation: { goBack: () => void; navigate: (screen: string, params?: any) => void };
}

interface VibeRatings { attraction?: number; connection?: number; compatibility?: number; }

interface Flag { id: string; text: string; type: 'green' | 'red'; createdAt: string; }

type DateVibeType = 'amazing' | 'good' | 'okay' | 'meh' | 'bad';

interface DateEntry {
  id: string; date: string; title: string; location?: string;
  vibe: DateVibeType; notes?: string; createdAt: string;
}

interface DatingNote { id: string; text: string; createdAt: string; }

interface FirstImpression { text: string; whenWeMet?: string; }

interface DatingPerson {
  id: string; name: string; initials: string; createdAt: string;
  phoneNumber?: string; instagram?: string; location?: string; dateOfBirth?: string;
  rating?: number; notes?: DatingNote[]; firstImpression?: FirstImpression;
  vibeRatings?: VibeRatings; flags?: Flag[]; dateHistory?: DateEntry[];
}

interface PersonState {
  notes: DatingNote[]; firstImpression: FirstImpression | null;
  vibeRatings: VibeRatings; flags: Flag[]; dateHistory: DateEntry[];
}

interface DateIdea {
  id: string; title: string; subtitle: string;
  icon: keyof typeof Ionicons.glyphMap; color: string;
  duration: string; tagline: string; difficulty: string; bestTime: string;
  description: string; steps: string[];
  challenges: Array<{ id: string; title: string; description: string }>;
}

interface DatingAdvice {
  id: string; title: string; description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT_COLOR = '#E11D48';
const NOTE_ACTION_WIDTH = 136;

const SECTION_COLORS: Record<string, { icon: string; bg: string; border: string }> = {
  vibe: { icon: '#E11D48', bg: '#FFF1F2', border: '#F9A8B8' },
  firstImpression: { icon: '#D946EF', bg: '#FDF4FF', border: '#E8A8F5' },
  flags: { icon: '#F59E0B', bg: '#FFFBEB', border: '#FCD377' },
  dateHistory: { icon: '#3B82F6', bg: '#EFF6FF', border: '#93BBFD' },
  notes: { icon: '#10B981', bg: '#ECFDF5', border: '#6EE7B7' },
  details: { icon: '#6366F1', bg: '#EEF2FF', border: '#A5B4FC' },
};

const VIBE_CATEGORIES = {
  attraction: { icon: 'flame' as const, color: '#F97316', label: 'Attraction',
    labels: ['', 'Minimal', 'Some spark', 'Good chemistry', 'Strong pull', 'Magnetic'] },
  connection: { icon: 'heart' as const, color: '#EC4899', label: 'Connection',
    labels: ['', 'Surface level', 'Building', 'Meaningful', 'Deep bond', 'Soulful'] },
  compatibility: { icon: 'sparkles' as const, color: '#8B5CF6', label: 'Compatibility',
    labels: ['', 'Different paths', 'Some overlap', 'Good fit', 'Great match', 'Perfect sync'] },
};

const DATE_VIBES: { type: DateVibeType; label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'amazing', label: 'Amazing', color: '#15803D', bg: '#F0FDF4', icon: 'heart' },
  { type: 'good', label: 'Good', color: '#3B82F6', bg: '#EFF6FF', icon: 'thumbs-up' },
  { type: 'okay', label: 'Okay', color: '#F59E0B', bg: '#FFFBEB', icon: 'remove' },
  { type: 'meh', label: 'Meh', color: '#9CA3AF', bg: '#F3F4F6', icon: 'thumbs-down' },
  { type: 'bad', label: 'Bad', color: '#DC2626', bg: '#FEF2F2', icon: 'close' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getVibeInfo = (type: DateVibeType) =>
  DATE_VIBES.find(v => v.type === type) || DATE_VIBES[2];

const getTimeAgo = (dateString: string): string => {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const formatBirthday = (d: string): string => {
  const date = new Date(d);
  const m = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${m[date.getMonth()]} ${date.getDate()}`;
};

const formatWhenWeMet = (d: string): string => {
  const date = new Date(d);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${m[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateEntryDate = (d: string): string => {
  const date = new Date(d);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${m[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const initPersonState = (p: DatingPerson): PersonState => ({
  notes: p.notes || [],
  firstImpression: p.firstImpression || null,
  vibeRatings: p.vibeRatings || {},
  flags: p.flags || [],
  dateHistory: (p.dateHistory || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
});

// ─── Mock Data ───────────────────────────────────────────────────────────────
const DATING_CRM_DATA: DatingPerson[] = [
  {
    id: '1', name: 'Sophie', initials: 'S', createdAt: '2024-03-01',
    phoneNumber: '+1 (555) 123-4567', instagram: 'sophie_h', location: 'Brooklyn, NY',
    dateOfBirth: '1998-06-15',
    firstImpression: {
      text: 'She walked in with this incredible energy. We talked for 3 hours and it felt like 20 minutes. Her laugh is contagious.',
      whenWeMet: '2024-07-15',
    },
    vibeRatings: { attraction: 4, connection: 5, compatibility: 3 },
    flags: [
      { id: 'f1', text: 'Great listener', type: 'green', createdAt: '2024-03-02' },
      { id: 'f2', text: 'Shares my values', type: 'green', createdAt: '2024-03-03' },
      { id: 'f3', text: 'Often cancels last minute', type: 'red', createdAt: '2024-03-05' },
    ],
    notes: [
      { id: 'n1', text: 'Loves Italian food and wine', createdAt: new Date().toISOString() },
      { id: 'n2', text: 'Works in marketing at a startup', createdAt: new Date().toISOString() },
    ],
    dateHistory: [
      { id: 'd1', date: new Date(Date.now() - 2*86400000).toISOString(), title: 'Coffee at Blue Bottle', location: 'Williamsburg', vibe: 'amazing', createdAt: new Date(Date.now() - 2*86400000).toISOString() },
      { id: 'd2', date: new Date(Date.now() - 9*86400000).toISOString(), title: 'Walk in Prospect Park', location: 'Park Slope', vibe: 'good', createdAt: new Date(Date.now() - 9*86400000).toISOString() },
      { id: 'd3', date: '2024-07-28', title: 'First real date - dinner and walk', location: 'Osteria, West Village', vibe: 'amazing', notes: 'Talked for 4 hours, walked along the Hudson after', createdAt: '2024-07-28' },
    ],
  },
  {
    id: '2', name: 'Emma', initials: 'E', createdAt: '2024-02-28',
    phoneNumber: '+1 (555) 987-6543',
    vibeRatings: { attraction: 3, connection: 3 },
    flags: [{ id: 'f1', text: 'Really funny', type: 'green', createdAt: '2024-02-28' }],
    notes: [{ id: 'n1', text: 'Met at the bookstore on 5th Ave', createdAt: new Date().toISOString() }],
    dateHistory: [
      { id: 'd1', date: new Date(Date.now() - 5*86400000).toISOString(), title: 'Dinner at Lilia', location: 'Williamsburg', vibe: 'good', createdAt: new Date(Date.now() - 5*86400000).toISOString() },
    ],
  },
  {
    id: '3', name: 'Mia', initials: 'M', createdAt: '2024-02-25',
    instagram: 'mia.travels', location: 'Manhattan, NY',
  },
];

const DATE_IDEAS: DateIdea[] = [
  { id: '1', title: 'Coffee & conversation', subtitle: 'Classic first date', icon: 'cafe-outline', color: '#92400E', tagline: 'Keep it simple', duration: '1-2 hours', difficulty: 'Easy', bestTime: 'Morning', description: '', steps: [], challenges: [] },
  { id: '2', title: 'Walk in the park', subtitle: 'Fresh air & easy talk', icon: 'walk-outline', color: '#059669', tagline: 'Stroll and chat', duration: '1-2 hours', difficulty: 'Easy', bestTime: 'Afternoon', description: '', steps: [], challenges: [] },
  { id: '3', title: 'Museum visit', subtitle: 'Art & deep talk', icon: 'color-palette-outline', color: '#7C3AED', tagline: 'Let art spark conversation', duration: '2-3 hours', difficulty: 'Easy', bestTime: 'Afternoon', description: '', steps: [], challenges: [] },
  { id: '4', title: 'Drinks & appetizers', subtitle: 'Relaxed evening vibe', icon: 'wine-outline', color: '#DC2626', tagline: 'Unwind together', duration: '2-3 hours', difficulty: 'Easy', bestTime: 'Evening', description: '', steps: [], challenges: [] },
  { id: '5', title: 'Farmers market', subtitle: 'Casual & colorful', icon: 'basket-outline', color: '#EA580C', tagline: 'Browse and sample', duration: '1-2 hours', difficulty: 'Easy', bestTime: 'Weekend', description: '', steps: [], challenges: [] },
  { id: '6', title: 'Bookstore browsing', subtitle: 'For book lovers', icon: 'book-outline', color: '#0891B2', tagline: 'Share favorites', duration: '1-2 hours', difficulty: 'Easy', bestTime: 'Afternoon', description: '', steps: [], challenges: [] },
  { id: '7', title: 'Ice cream walk', subtitle: 'Sweet & simple', icon: 'ice-cream-outline', color: '#EC4899', tagline: 'Keep it light', duration: '1 hour', difficulty: 'Easy', bestTime: 'Evening', description: '', steps: [], challenges: [] },
  { id: '8', title: 'Mini golf', subtitle: 'Playful competition', icon: 'golf-outline', color: '#10B981', tagline: 'Friendly competition', duration: '1-2 hours', difficulty: 'Easy', bestTime: 'Afternoon', description: '', steps: [], challenges: [] },
];

const DATING_ADVICE_DATA: DatingAdvice[] = [
  { id: '1', title: 'Green flags to look for', description: 'Signs that someone is emotionally available', icon: 'flag-outline' },
  { id: '2', title: 'Questions for deeper conversation', description: 'Move beyond small talk', icon: 'chatbubbles-outline' },
  { id: '3', title: 'Setting healthy boundaries', description: 'How to communicate your needs', icon: 'shield-checkmark-outline' },
];

// ─── Vibe Rating Row Component ───────────────────────────────────────────────
const VibeRatingRow: React.FC<{
  label: string; type: 'attraction' | 'connection' | 'compatibility';
  value: number | undefined; onRate: (rating: number) => void;
}> = ({ label, type, value, onRate }) => {
  const config = VIBE_CATEGORIES[type];
  const animatedValues = useRef([1,2,3,4,5].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    animatedValues.forEach((anim, index) => {
      const isFilled = value && index + 1 <= value;
      Animated.timing(anim, {
        toValue: isFilled ? 1 : 0,
        duration: isFilled ? 200 : 150,
        easing: isFilled ? Easing.out(Easing.back(1.5)) : Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
  }, [value, animatedValues]);

  return (
    <View style={styles.vibeMetricRow}>
      <View style={styles.vibeMetricLeft}>
        <View style={[styles.vibeMetricIcon, { backgroundColor: `${config.color}12` }]}>
          <Ionicons name={config.icon} size={11} color={config.color} />
        </View>
        <Text style={styles.vibeMetricLabel}>{label}</Text>
      </View>
      <View style={styles.vibeSegmentsRow}>
        {[1,2,3,4,5].map((rating) => {
          const fillWidth = animatedValues[rating-1].interpolate({
            inputRange: [0, 1], outputRange: ['0%', '100%'],
          });
          return (
            <TouchableOpacity key={rating} onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRate(value === rating ? 0 : rating);
            }} activeOpacity={0.7} style={styles.vibeSegmentTouch}
              hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}>
              <View style={styles.vibeSegmentBg}>
                <Animated.View style={[styles.vibeSegmentFill, { width: fillWidth, backgroundColor: config.color }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── Flag Chip Component ─────────────────────────────────────────────────────
const FlagChip: React.FC<{
  flag: Flag; onPress: () => void; onDelete: () => void;
}> = ({ flag, onPress, onDelete }) => {
  const isGreen = flag.type === 'green';
  return (
    <TouchableOpacity
      style={[styles.flagChip, isGreen ? styles.flagChipGreen : styles.flagChipRed]}
      onPress={onPress}
      onLongPress={() => {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Delete Flag', `Remove "${flag.text}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]);
      }}
      activeOpacity={0.7}>
      <View style={[styles.flagDot, { backgroundColor: isGreen ? '#22C55E' : '#EF4444' }]} />
      <Text style={[styles.flagChipText, { color: isGreen ? '#15803D' : '#DC2626' }]}
        numberOfLines={1}>{flag.text}</Text>
    </TouchableOpacity>
  );
};

// ─── Date Entry Row (Timeline Item) ──────────────────────────────────────────
const DateEntryRow: React.FC<{
  entry: DateEntry; isLast: boolean; onPress: () => void; onDelete: () => void;
}> = ({ entry, isLast, onPress, onDelete }) => (
  <TouchableOpacity style={styles.dateEntryRow} onPress={onPress}
    onLongPress={() => {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert('Delete Date', `Remove "${entry.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]);
    }} activeOpacity={0.7}>
    <View style={styles.dateEntryTimeline}>
      <View style={styles.dateEntryDot} />
      {!isLast && <View style={styles.dateEntryLine} />}
    </View>
    <View style={styles.dateEntryContent}>
      <Text style={styles.dateEntryTitle} numberOfLines={2}>{entry.title}</Text>
      <View style={styles.dateEntryMeta}>
        <Text style={styles.dateEntryDate}>{formatDateEntryDate(entry.date)}</Text>
        {entry.location && (
          <>
            <Text style={styles.dateEntryMetaDot}>·</Text>
            <Ionicons name="location-outline" size={11} color="#9CA3AF" />
            <Text style={styles.dateEntryLocation} numberOfLines={1}>{entry.location}</Text>
          </>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Swipeable Note Card ─────────────────────────────────────────────────────
const SwipeableNoteCard: React.FC<{
  note: DatingNote; onEdit: () => void; onDelete: () => void;
  onSwipeStart: () => void; onSwipeEnd: () => void;
}> = ({ note, onEdit, onDelete, onSwipeStart, onSwipeEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const currentTranslateX = useRef(0);
  const isOpenRef = useRef(false);

  useEffect(() => {
    const id = translateX.addListener(({ value }) => { currentTranslateX.current = value; });
    return () => translateX.removeListener(id);
  }, [translateX]);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const closeActions = useCallback(() => {
    setIsOpen(false);
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 8, tension: 100 }).start();
  }, [translateX]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 5,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5 && Math.abs(gs.dx) > 10,
    onPanResponderGrant: () => { translateX.stopAnimation(); onSwipeStart(); },
    onPanResponderTerminationRequest: () => false,
    onPanResponderMove: (_, gs) => {
      let v = isOpenRef.current ? -NOTE_ACTION_WIDTH + gs.dx : gs.dx;
      translateX.setValue(Math.max(-NOTE_ACTION_WIDTH, Math.min(0, v)));
    },
    onPanResponderRelease: (_, gs) => {
      onSwipeEnd();
      if (gs.vx < -0.3) {
        setIsOpen(true);
        Animated.spring(translateX, { toValue: -NOTE_ACTION_WIDTH, useNativeDriver: true, velocity: gs.vx, friction: 7, tension: 80 }).start();
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (gs.vx > 0.3 || currentTranslateX.current > -NOTE_ACTION_WIDTH / 3) {
        setIsOpen(false);
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7, tension: 80 }).start();
      } else {
        setIsOpen(true);
        Animated.spring(translateX, { toValue: -NOTE_ACTION_WIDTH, useNativeDriver: true, friction: 7, tension: 80 }).start();
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onPanResponderTerminate: () => {
      onSwipeEnd();
      if (currentTranslateX.current < -NOTE_ACTION_WIDTH / 2) {
        setIsOpen(true);
        Animated.spring(translateX, { toValue: -NOTE_ACTION_WIDTH, useNativeDriver: true }).start();
      } else {
        setIsOpen(false);
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  }), [translateX, onSwipeStart, onSwipeEnd]);

  return (
    <View style={styles.noteCardWrapper}>
      <View style={styles.noteActionsContainer}>
        <TouchableOpacity style={[styles.noteSwipeAction, styles.noteEditAction]}
          onPress={() => { closeActions(); setTimeout(onEdit, 200); }} activeOpacity={0.8}>
          <Ionicons name="pencil-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.noteSwipeAction, styles.noteDeleteAction]}
          onPress={() => { closeActions(); setTimeout(onDelete, 200); }} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <Animated.View style={[styles.noteCardAnimatedWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}>
        <TouchableOpacity activeOpacity={1} onPress={() => isOpen && closeActions()}>
          <View style={styles.noteCard}>
            <View style={styles.noteAccent} />
            <Text style={styles.noteText}>{note.text}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const DatingHomeScreen: React.FC<DatingHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activePersonIndex, setActivePersonIndex] = useState(0);
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ vibe: true });
  const chevronAnims = useRef<Record<string, Animated.Value>>({
    vibe: new Animated.Value(1), firstImpression: new Animated.Value(0),
    flags: new Animated.Value(0), dateHistory: new Animated.Value(0),
    notes: new Animated.Value(0), details: new Animated.Value(0),
  }).current;

  // Per-person mutable data
  const [allPersonData, setAllPersonData] = useState<Record<string, PersonState>>(() => {
    const init: Record<string, PersonState> = {};
    DATING_CRM_DATA.forEach(p => { init[p.id] = initPersonState(p); });
    return init;
  });

  const currentPerson = DATING_CRM_DATA[activePersonIndex];
  const currentData = allPersonData[currentPerson.id];

  const updateCurrentPerson = useCallback((updates: Partial<PersonState>) => {
    setAllPersonData(prev => ({
      ...prev,
      [currentPerson.id]: { ...prev[currentPerson.id], ...updates },
    }));
  }, [currentPerson.id]);

  // Modal state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<DatingNote | null>(null);
  const [noteContent, setNoteContent] = useState('');

  const [firstImpressionModalVisible, setFirstImpressionModalVisible] = useState(false);
  const [impressionText, setImpressionText] = useState('');
  const [whenWeMet, setWhenWeMet] = useState<Date | null>(null);
  const [showWhenWeMetPicker, setShowWhenWeMetPicker] = useState(false);
  const whenWeMetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const [flagModalVisible, setFlagModalVisible] = useState(false);
  const [flagType, setFlagType] = useState<'green' | 'red'>('green');
  const [flagText, setFlagText] = useState('');
  const [editingFlag, setEditingFlag] = useState<Flag | null>(null);

  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [editingDateEntry, setEditingDateEntry] = useState<DateEntry | null>(null);
  const [dateEntryDate, setDateEntryDate] = useState<Date>(new Date());
  const [dateEntryTitle, setDateEntryTitle] = useState('');
  const [dateEntryLocation, setDateEntryLocation] = useState('');
  const [dateEntryVibe, setDateEntryVibe] = useState<DateVibeType | null>(null);
  const [dateEntryNotes, setDateEntryNotes] = useState('');
  const [showDateEntryPicker, setShowDateEntryPicker] = useState(false);
  const dateEntryPickerTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  // ─── Section Toggle ──────────────────────────────────────────────────────
  const toggleSection = useCallback((key: string) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !expandedSections[key];
    setExpandedSections(prev => ({ ...prev, [key]: newVal }));
    Animated.timing(chevronAnims[key], {
      toValue: newVal ? 1 : 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start();
  }, [expandedSections, chevronAnims]);

  const getChevronStyle = (key: string) => ({
    transform: [{ rotate: chevronAnims[key].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
  });

  // ─── Person Switching ────────────────────────────────────────────────────
  const personSelectorRef = useRef<ScrollView>(null);
  const switchPerson = useCallback((index: number) => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePersonIndex(index);
  }, []);

  // ─── Contact Handlers ────────────────────────────────────────────────────
  const handleCall = useCallback(() => {
    if (currentPerson.phoneNumber) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${currentPerson.phoneNumber.replace(/[^0-9+]/g, '')}`);
    }
  }, [currentPerson]);

  const handleInstagram = useCallback(() => {
    if (currentPerson.instagram) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`https://instagram.com/${currentPerson.instagram}`);
    }
  }, [currentPerson]);

  const handleOpenMaps = useCallback(() => {
    if (currentPerson.location) {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(currentPerson.location)}`);
    }
  }, [currentPerson]);

  // ─── Vibe Handlers ───────────────────────────────────────────────────────
  const handleVibeRating = useCallback((type: keyof VibeRatings, rating: number) => {
    updateCurrentPerson({
      vibeRatings: { ...currentData.vibeRatings, [type]: rating === 0 ? undefined : rating },
    });
  }, [currentData.vibeRatings, updateCurrentPerson]);

  // ─── Note Handlers ───────────────────────────────────────────────────────
  const handleAddNote = useCallback(() => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingNote(null); setNoteContent(''); setNoteModalVisible(true);
  }, []);

  const handleEditNote = useCallback((note: DatingNote) => {
    setEditingNote(note); setNoteContent(note.text); setNoteModalVisible(true);
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    updateCurrentPerson({ notes: currentData.notes.filter(n => n.id !== id) });
  }, [currentData.notes, updateCurrentPerson]);

  const handleSaveNote = useCallback(() => {
    if (!noteContent.trim()) return;
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingNote) {
      updateCurrentPerson({ notes: currentData.notes.map(n => n.id === editingNote.id ? { ...n, text: noteContent.trim() } : n) });
    } else {
      updateCurrentPerson({ notes: [{ id: Date.now().toString(), text: noteContent.trim(), createdAt: new Date().toISOString() }, ...currentData.notes] });
    }
    setNoteModalVisible(false); setNoteContent(''); setEditingNote(null);
  }, [noteContent, editingNote, currentData.notes, updateCurrentPerson]);

  // ─── First Impression Handlers ───────────────────────────────────────────
  const handleFirstImpressionPress = useCallback(() => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImpressionText(currentData.firstImpression?.text || '');
    setWhenWeMet(currentData.firstImpression?.whenWeMet ? new Date(currentData.firstImpression.whenWeMet) : null);
    setFirstImpressionModalVisible(true);
  }, [currentData.firstImpression]);

  const handleSaveFirstImpression = useCallback(() => {
    if (!impressionText.trim()) return;
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCurrentPerson({ firstImpression: { text: impressionText.trim(), whenWeMet: whenWeMet?.toISOString() } });
    setFirstImpressionModalVisible(false);
  }, [impressionText, whenWeMet, updateCurrentPerson]);

  const handleClearFirstImpression = useCallback(() => {
    Alert.alert('Remove First Impression', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        updateCurrentPerson({ firstImpression: null });
        setFirstImpressionModalVisible(false);
      }},
    ]);
  }, [updateCurrentPerson]);

  const openWhenWeMetPicker = useCallback(() => {
    whenWeMetTranslateY.setValue(SCREEN_HEIGHT);
    setShowWhenWeMetPicker(true);
    Animated.timing(whenWeMetTranslateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [whenWeMetTranslateY]);

  const closeWhenWeMetPicker = useCallback(() => {
    Animated.timing(whenWeMetTranslateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => setShowWhenWeMetPicker(false));
  }, [whenWeMetTranslateY]);

  // ─── Flag Handlers ───────────────────────────────────────────────────────
  const handleAddFlag = useCallback((type: 'green' | 'red') => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlagType(type); setFlagText(''); setEditingFlag(null); setFlagModalVisible(true);
  }, []);

  const handleEditFlag = useCallback((flag: Flag) => {
    setFlagType(flag.type); setFlagText(flag.text); setEditingFlag(flag); setFlagModalVisible(true);
  }, []);

  const handleSaveFlag = useCallback(() => {
    if (!flagText.trim()) return;
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingFlag) {
      updateCurrentPerson({ flags: currentData.flags.map(f => f.id === editingFlag.id ? { ...f, text: flagText.trim(), type: flagType } : f) });
    } else {
      updateCurrentPerson({ flags: [...currentData.flags, { id: Date.now().toString(), text: flagText.trim(), type: flagType, createdAt: new Date().toISOString() }] });
    }
    setFlagModalVisible(false); setFlagText(''); setEditingFlag(null);
  }, [flagText, flagType, editingFlag, currentData.flags, updateCurrentPerson]);

  const handleDeleteFlag = useCallback((id: string) => {
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    updateCurrentPerson({ flags: currentData.flags.filter(f => f.id !== id) });
  }, [currentData.flags, updateCurrentPerson]);

  // ─── Date History Handlers ───────────────────────────────────────────────
  const handleAddDateEntry = useCallback(() => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingDateEntry(null); setDateEntryDate(new Date()); setDateEntryTitle('');
    setDateEntryLocation(''); setDateEntryVibe(null); setDateEntryNotes(''); setDateModalVisible(true);
  }, []);

  const handleEditDateEntry = useCallback((entry: DateEntry) => {
    setEditingDateEntry(entry); setDateEntryDate(new Date(entry.date));
    setDateEntryTitle(entry.title); setDateEntryLocation(entry.location || '');
    setDateEntryVibe(entry.vibe); setDateEntryNotes(entry.notes || ''); setDateModalVisible(true);
  }, []);

  const handleSaveDateEntry = useCallback(() => {
    if (!dateEntryTitle.trim()) return;
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const entry = {
      id: editingDateEntry?.id || Date.now().toString(),
      date: dateEntryDate.toISOString(), title: dateEntryTitle.trim(),
      location: dateEntryLocation.trim() || undefined, vibe: dateEntryVibe || 'okay',
      notes: dateEntryNotes.trim() || undefined, createdAt: editingDateEntry?.createdAt || new Date().toISOString(),
    };
    const newHistory = editingDateEntry
      ? currentData.dateHistory.map(d => d.id === editingDateEntry.id ? entry : d)
      : [...currentData.dateHistory, entry];
    updateCurrentPerson({ dateHistory: newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
    setDateModalVisible(false); setEditingDateEntry(null);
  }, [dateEntryTitle, dateEntryVibe, dateEntryDate, dateEntryLocation, dateEntryNotes, editingDateEntry, currentData.dateHistory, updateCurrentPerson]);

  const handleDeleteDateEntry = useCallback((id: string) => {
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    updateCurrentPerson({ dateHistory: currentData.dateHistory.filter(d => d.id !== id) });
  }, [currentData.dateHistory, updateCurrentPerson]);

  const openDateEntryPicker = useCallback(() => {
    dateEntryPickerTranslateY.setValue(SCREEN_HEIGHT);
    setShowDateEntryPicker(true);
    Animated.timing(dateEntryPickerTranslateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [dateEntryPickerTranslateY]);

  const closeDateEntryPicker = useCallback(() => {
    Animated.timing(dateEntryPickerTranslateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => setShowDateEntryPicker(false));
  }, [dateEntryPickerTranslateY]);

  const handleDeletePerson = useCallback(() => {
    setShowMoreMenu(false);
    Alert.alert('Delete Person', `Are you sure you want to delete ${currentPerson.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        // In production, would remove from data source
        navigation.goBack();
      }},
    ]);
  }, [currentPerson, navigation]);

  // ─── Computed Values ─────────────────────────────────────────────────────
  const greenFlags = currentData.flags.filter(f => f.type === 'green');
  const redFlags = currentData.flags.filter(f => f.type === 'red');
  const hasContact = currentPerson.phoneNumber || currentPerson.instagram || currentPerson.location;
  const hasInfo = currentPerson.phoneNumber || currentPerson.instagram || currentPerson.location || currentPerson.dateOfBirth;

  // ─── Section Header Component ────────────────────────────────────────────
  const SectionHeader: React.FC<{
    sectionKey: string; icon: keyof typeof Ionicons.glyphMap; label: string;
    preview?: string; rightAction?: React.ReactNode;
  }> = ({ sectionKey, icon, label, preview, rightAction }) => {
    const colors = SECTION_COLORS[sectionKey] || { icon: ACCENT_COLOR, bg: '#FFF1F2' };
    return (
      <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(sectionKey)} activeOpacity={0.7}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={18} color={colors.icon} />
          <Text style={styles.sectionLabel}>{label}</Text>
        </View>
        <View style={styles.sectionHeaderRight}>
          {preview ? <Text style={styles.sectionPreview}>{preview}</Text> : null}
          {rightAction}
          <Animated.View style={getChevronStyle(sectionKey)}>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 72 }]}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        scrollEnabled={!isSwipingCard}>

        {/* ── Person Selector ─────────────────────────────────── */}
        <ScrollView ref={personSelectorRef} horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.personSelectorContent} style={styles.personSelector}>
          <TouchableOpacity style={styles.addPersonChip}
            onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('DatingEntry'); }}
            activeOpacity={0.7}>
            <Ionicons name="add" size={18} color={ACCENT_COLOR} />
          </TouchableOpacity>
          {DATING_CRM_DATA.map((person, index) => (
            <TouchableOpacity key={person.id}
              style={[styles.personChip, index === activePersonIndex && styles.personChipActive]}
              onPress={() => switchPerson(index)} activeOpacity={0.7}>
              <LinearGradient
                colors={index === activePersonIndex ? ['#FFFFFF', '#FFFFFF'] : ['#FFF1F2', '#FFE4E6']}
                style={styles.personChipAvatar}>
                <Text style={[styles.personChipInitials,
                  index === activePersonIndex && styles.personChipInitialsActive]}>
                  {person.initials}
                </Text>
              </LinearGradient>
              <Text style={[styles.personChipName,
                index === activePersonIndex && styles.personChipNameActive]}>
                {person.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Person Header Card ──────────────────────────────── */}
        <View style={styles.personHeaderCard}>
          <View style={styles.personAvatarRing}>
            <LinearGradient colors={['#FFF1F2', '#FFE4E6', '#FECDD3']} style={styles.personAvatar}>
              <Text style={styles.personAvatarInitials}>{currentPerson.initials}</Text>
            </LinearGradient>
          </View>
          <View style={styles.personHeaderCenter}>
            <Text style={styles.personName} numberOfLines={1}>{currentPerson.name}</Text>
          </View>
          <View style={styles.personHeaderActions}>
            {currentPerson.phoneNumber && (
              <TouchableOpacity style={styles.quickActionBtn} onPress={handleCall} activeOpacity={0.7}>
                <Ionicons name="call-outline" size={17} color="#6B7280" />
              </TouchableOpacity>
            )}
            {currentPerson.instagram && (
              <TouchableOpacity style={styles.quickActionBtn} onPress={handleInstagram} activeOpacity={0.7}>
                <Ionicons name="logo-instagram" size={17} color="#6B7280" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.personHeaderEditBtn}
              onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('DatingEntry', { person: currentPerson }); }}
              activeOpacity={0.7}>
              <Ionicons name="pencil" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Expandable Sections ─────────────────────────────── */}
        <View style={styles.sectionsContainer}>

          {/* The Vibe */}
          <View style={[styles.expandableCard, { borderLeftWidth: 3, borderLeftColor: SECTION_COLORS.vibe.border }]}>
            <SectionHeader sectionKey="vibe" icon="heart" label="The Vibe" />
            {expandedSections.vibe && (
              <View style={styles.expandableContent}>
                <VibeRatingRow label="Attraction" type="attraction" value={currentData.vibeRatings.attraction}
                  onRate={(r) => handleVibeRating('attraction', r)} />
                <VibeRatingRow label="Connection" type="connection" value={currentData.vibeRatings.connection}
                  onRate={(r) => handleVibeRating('connection', r)} />
                <VibeRatingRow label="Compatibility" type="compatibility" value={currentData.vibeRatings.compatibility}
                  onRate={(r) => handleVibeRating('compatibility', r)} />
              </View>
            )}
          </View>

          {/* First Impression */}
          <View style={[styles.expandableCard, { borderLeftWidth: 3, borderLeftColor: SECTION_COLORS.firstImpression.border }]}>
            <SectionHeader sectionKey="firstImpression" icon="sparkles" label="First Impression"
              preview={currentData.firstImpression ? '' : 'Tap to add'} />
            {expandedSections.firstImpression && (
              <View style={styles.expandableContent}>
                <TouchableOpacity onPress={handleFirstImpressionPress} activeOpacity={0.7}
                  style={styles.firstImpressionTouchable}>
                  {currentData.firstImpression ? (
                    <View>
                      <Text style={styles.firstImpressionText}>"{currentData.firstImpression.text}"</Text>
                      {currentData.firstImpression.whenWeMet && (
                        <View style={styles.firstImpressionMeta}>
                          <View style={styles.metaTag}>
                            <Ionicons name="calendar-outline" size={10} color="#6B7280" />
                            <Text style={styles.metaTagText}>{formatWhenWeMet(currentData.firstImpression.whenWeMet)}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.firstImpressionEmpty}>
                      <Ionicons name="sparkles-outline" size={18} color="#9CA3AF" />
                      <Text style={styles.firstImpressionEmptyText}>What stood out when you first met?</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Flags */}
          <View style={[styles.expandableCard, { borderLeftWidth: 3, borderLeftColor: SECTION_COLORS.flags.border }]}>
            <SectionHeader sectionKey="flags" icon="flag" label="Flags"
              preview={currentData.flags.length > 0 ? `${greenFlags.length} green · ${redFlags.length} red` : 'None yet'} />
            {expandedSections.flags && (
              <View style={styles.expandableContent}>
                {currentData.flags.length > 0 ? (
                  <View style={styles.flagsChipsRow}>
                    {currentData.flags.map(flag => (
                      <FlagChip key={flag.id} flag={flag} onPress={() => handleEditFlag(flag)}
                        onDelete={() => handleDeleteFlag(flag.id)} />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.flagsEmptyText}>No flags yet</Text>
                )}
                <View style={styles.flagsAddRow}>
                  <TouchableOpacity style={styles.flagsAddLink} onPress={() => handleAddFlag('green')} activeOpacity={0.7}>
                    <Ionicons name="add-circle-outline" size={15} color="#22C55E" />
                    <Text style={styles.flagsAddLinkGreenText}>Add green</Text>
                  </TouchableOpacity>
                  <View style={styles.flagsAddDivider} />
                  <TouchableOpacity style={styles.flagsAddLink} onPress={() => handleAddFlag('red')} activeOpacity={0.7}>
                    <Ionicons name="add-circle-outline" size={15} color="#EF4444" />
                    <Text style={styles.flagsAddLinkRedText}>Add red</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Date History */}
          <View style={[styles.expandableCard, { borderLeftWidth: 3, borderLeftColor: SECTION_COLORS.dateHistory.border }]}>
            <SectionHeader sectionKey="dateHistory" icon="calendar" label="Date History"
              preview={currentData.dateHistory.length > 0
                ? `${currentData.dateHistory.length} date${currentData.dateHistory.length > 1 ? 's' : ''}`
                : 'None yet'} />
            {expandedSections.dateHistory && (
              <View style={styles.expandableContent}>
                {currentData.dateHistory.length > 0 ? (
                  <View style={styles.dateHistoryTimeline}>
                    {currentData.dateHistory.map((entry, index) => (
                      <DateEntryRow key={entry.id} entry={entry}
                        isLast={index === currentData.dateHistory.length - 1}
                        onPress={() => handleEditDateEntry(entry)}
                        onDelete={() => handleDeleteDateEntry(entry.id)} />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.dateHistoryEmptyText}>No dates logged yet</Text>
                )}
                <TouchableOpacity style={styles.dateHistoryAddLink} onPress={handleAddDateEntry} activeOpacity={0.7}>
                  <Ionicons name="add-circle-outline" size={15} color="#3B82F6" />
                  <Text style={styles.dateHistoryAddLinkText}>Add date</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={[styles.expandableCard, { borderLeftWidth: 3, borderLeftColor: SECTION_COLORS.notes.border }]}>
            <SectionHeader sectionKey="notes" icon="document-text" label="Notes"
              preview={currentData.notes.length > 0 ? `${currentData.notes.length} note${currentData.notes.length > 1 ? 's' : ''}` : 'None yet'} />
            {expandedSections.notes && (
              <View style={styles.expandableContent}>
                <TouchableOpacity style={styles.addNoteCard} onPress={handleAddNote} activeOpacity={0.7}>
                  <Text style={styles.addNotePlaceholder}>Add a note...</Text>
                  <Ionicons name="add-circle-outline" size={20} color="#10B981" />
                </TouchableOpacity>
                {currentData.notes.map(note => (
                  <SwipeableNoteCard key={note.id} note={note}
                    onEdit={() => handleEditNote(note)} onDelete={() => handleDeleteNote(note.id)}
                    onSwipeStart={() => setIsSwipingCard(true)} onSwipeEnd={() => setIsSwipingCard(false)} />
                ))}
              </View>
            )}
          </View>

          {/* Details */}
          {hasInfo && (
            <View style={[styles.expandableCard, { borderLeftWidth: 3, borderLeftColor: SECTION_COLORS.details.border }]}>
              <SectionHeader sectionKey="details" icon="person" label="Details" />
              {expandedSections.details && (
                <View style={styles.expandableContent}>
                  {currentPerson.phoneNumber && (
                    <TouchableOpacity style={styles.detailsRow} onPress={handleCall} activeOpacity={0.7}>
                      <View style={styles.detailsRowIcon}><Ionicons name="call-outline" size={16} color={ACCENT_COLOR} /></View>
                      <View style={styles.detailsRowContent}>
                        <Text style={styles.detailsRowLabel}>PHONE</Text>
                        <Text style={styles.detailsRowValue}>{currentPerson.phoneNumber}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                    </TouchableOpacity>
                  )}
                  {currentPerson.instagram && (
                    <TouchableOpacity style={styles.detailsRow} onPress={handleInstagram} activeOpacity={0.7}>
                      <View style={styles.detailsRowIcon}><Ionicons name="logo-instagram" size={16} color={ACCENT_COLOR} /></View>
                      <View style={styles.detailsRowContent}>
                        <Text style={styles.detailsRowLabel}>INSTAGRAM</Text>
                        <Text style={styles.detailsRowValue}>@{currentPerson.instagram}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                    </TouchableOpacity>
                  )}
                  {currentPerson.location && (
                    <TouchableOpacity style={styles.detailsRow} onPress={handleOpenMaps} activeOpacity={0.7}>
                      <View style={styles.detailsRowIcon}><Ionicons name="location-outline" size={16} color={ACCENT_COLOR} /></View>
                      <View style={styles.detailsRowContent}>
                        <Text style={styles.detailsRowLabel}>LOCATION</Text>
                        <Text style={styles.detailsRowValue}>{currentPerson.location}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                    </TouchableOpacity>
                  )}
                  {currentPerson.dateOfBirth && (
                    <View style={[styles.detailsRow, { borderBottomWidth: 0 }]}>
                      <View style={styles.detailsRowIcon}><Ionicons name="gift-outline" size={16} color={ACCENT_COLOR} /></View>
                      <View style={styles.detailsRowContent}>
                        <Text style={styles.detailsRowLabel}>BIRTHDAY</Text>
                        <Text style={styles.detailsRowValue}>{formatBirthday(currentPerson.dateOfBirth)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Date Ideas ──────────────────────────────────────── */}
        <View style={styles.dateIdeasSection}>
          <View style={styles.dateIdeasHeader}>
            <View style={styles.dateIdeasTitleRow}>
              <View style={styles.sectionAccent} />
              <View>
                <Text style={styles.bigSectionTitle}>Date Ideas</Text>
                <Text style={styles.bigSectionSubtitle}>First date inspiration</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.seeAllButton}
              onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('DateIdeasList'); }}
              activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All</Text>
              <Ionicons name="chevron-forward" size={14} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateIdeasScroll}>
            {DATE_IDEAS.map(idea => (
              <TouchableOpacity key={idea.id} style={styles.dateIdeaCard}
                onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('DateIdeaDetail', { idea }); }}
                activeOpacity={0.8}>
                <TouchableOpacity style={styles.dateIdeaHeart}
                  onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSavedIdeas(prev => { const s = new Set(prev); s.has(idea.id) ? s.delete(idea.id) : s.add(idea.id); return s; });
                  }} activeOpacity={0.7}>
                  <Ionicons name={savedIdeas.has(idea.id) ? 'heart' : 'heart-outline'} size={16}
                    color={savedIdeas.has(idea.id) ? '#E11D48' : '#9CA3AF'} />
                </TouchableOpacity>
                <View style={[styles.dateIdeaIconCircle, { shadowColor: idea.color }]}>
                  <Ionicons name={idea.icon} size={28} color={idea.color} />
                </View>
                <Text style={styles.dateIdeaTitle} numberOfLines={2}>{idea.title}</Text>
                <Text style={styles.dateIdeaSubtitle} numberOfLines={1}>{idea.subtitle}</Text>
                <View style={[styles.dateIdeaDuration, { backgroundColor: `${idea.color}10`, borderColor: `${idea.color}20` }]}>
                  <Ionicons name="time-outline" size={10} color={idea.color} />
                  <Text style={[styles.dateIdeaDurationText, { color: idea.color }]}>{idea.duration}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Dating Wisdom ───────────────────────────────────── */}
        <View style={styles.wisdomSection}>
          <View style={styles.wisdomHeader}>
            <View style={styles.dateIdeasTitleRow}>
              <View style={styles.sectionAccent} />
              <View>
                <Text style={styles.bigSectionTitle}>Dating Wisdom</Text>
                <Text style={styles.bigSectionSubtitle}>Tips for meaningful connections</Text>
              </View>
            </View>
          </View>
          <View style={styles.wisdomList}>
            {DATING_ADVICE_DATA.map(item => (
              <TouchableOpacity key={item.id} style={styles.wisdomCard}
                onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('DatingAdviceDetail', { advice: item }); }}
                activeOpacity={0.8}>
                <View style={styles.wisdomIconCircle}>
                  <Ionicons name={item.icon} size={20} color="#E11D48" />
                </View>
                <View style={styles.wisdomContent}>
                  <Text style={styles.wisdomTitle}>{item.title}</Text>
                  <Text style={styles.wisdomDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed Header ──────────────────────────────────────── */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur} pointerEvents="none">
          <LinearGradient colors={['rgba(240,238,232,0.95)','rgba(240,238,232,0.8)','rgba(240,238,232,0.4)','rgba(240,238,232,0)']}
            locations={[0,0.4,0.75,1]} style={styles.headerGradient} />
        </View>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowMoreMenu(true); }}
            style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={22} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── More Menu Modal ───────────────────────────────────── */}
      <Modal visible={showMoreMenu} transparent animationType="fade" onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableWithoutFeedback onPress={() => setShowMoreMenu(false)}>
          <View style={styles.menuOverlay}>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMoreMenu(false); navigation.navigate('RelationshipSetup'); }} activeOpacity={0.7}>
                <Ionicons name="sync-outline" size={18} color="#6B7280" />
                <Text style={styles.menuItemText}>Switch to Relationship</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}
                onPress={handleDeletePerson} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
                <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Delete {currentPerson.name}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Settings Menu (legacy compat) ─────────────────────── */}
      <Modal visible={settingsMenuVisible} transparent animationType="fade" onRequestClose={() => setSettingsMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setSettingsMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setSettingsMenuVisible(false); navigation.navigate('RelationshipSetup'); }} activeOpacity={0.7}>
                <Ionicons name="sync-outline" size={18} color="#6B7280" />
                <Text style={styles.menuItemText}>Switch to Relationship</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Note Modal ────────────────────────────────────────── */}
      <Modal visible={noteModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNoteModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNoteModalVisible(false)} style={styles.roundButton}>
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
            <TouchableOpacity onPress={handleSaveNote} style={[styles.roundButton, !noteContent.trim() && styles.roundButtonDisabled]} disabled={!noteContent.trim()}>
              <Ionicons name="checkmark" size={20} color={noteContent.trim() ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalInputContainer}>
            <TextInput style={styles.modalTextInput} placeholder={`Write something about ${currentPerson.name}...`}
              placeholderTextColor="#9CA3AF" value={noteContent} onChangeText={setNoteContent}
              multiline textAlignVertical="top" autoFocus />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── First Impression Modal ────────────────────────────── */}
      <Modal visible={firstImpressionModalVisible} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => setFirstImpressionModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setFirstImpressionModalVisible(false)} style={styles.roundButton}>
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>First Impression</Text>
            <TouchableOpacity onPress={handleSaveFirstImpression}
              style={[styles.roundButton, !impressionText.trim() && styles.roundButtonDisabled]} disabled={!impressionText.trim()}>
              <Ionicons name="checkmark" size={20} color={impressionText.trim() ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>What was your first impression of {currentPerson.name}?</Text>
              <View style={styles.modalTextAreaContainer}>
                <TextInput style={styles.modalTextArea} placeholder="She walked in with this incredible energy..."
                  placeholderTextColor="#9CA3AF" value={impressionText} onChangeText={setImpressionText}
                  multiline textAlignVertical="top" autoFocus />
              </View>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>When did you first meet?</Text>
              <TouchableOpacity style={styles.modalMetaButton} onPress={openWhenWeMetPicker} activeOpacity={0.7}>
                {whenWeMet ? (
                  <View style={styles.modalMetaSelected}>
                    <Ionicons name="calendar" size={18} color={ACCENT_COLOR} />
                    <Text style={styles.modalMetaSelectedText}>{formatWhenWeMet(whenWeMet.toISOString())}</Text>
                    <TouchableOpacity onPress={() => { setWhenWeMet(null); closeWhenWeMetPicker(); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close-circle" size={18} color="#C4C4C4" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.modalMetaPlaceholder}>
                    <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
                    <Text style={styles.modalMetaPlaceholderText}>Select when you met</Text>
                    <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {currentData.firstImpression && (
              <View style={styles.modalSection}>
                <TouchableOpacity style={styles.dangerButton} onPress={handleClearFirstImpression} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.dangerButtonText}>Remove First Impression</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        {showWhenWeMetPicker && Platform.OS === 'ios' && (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={closeWhenWeMetPicker} />
            <Animated.View style={[styles.datePickerContainer, { transform: [{ translateY: whenWeMetTranslateY }] }]}>
              <View style={styles.pickerHandle}><View style={styles.pickerHandleBar} /></View>
              <Text style={styles.pickerTitle}>When did you first meet?</Text>
              <View style={styles.datePickerWrapper}>
                <DateTimePicker value={whenWeMet || new Date()} mode="date" display="spinner"
                  onChange={(_, d) => { if (d) setWhenWeMet(d); }} maximumDate={new Date()}
                  minimumDate={new Date(2000, 0, 1)} style={styles.datePicker} />
              </View>
              <View style={styles.datePickerActions}>
                <TouchableOpacity onPress={() => { setWhenWeMet(null); closeWhenWeMetPicker(); }}
                  style={styles.datePickerClearButton} activeOpacity={0.7}>
                  <Text style={styles.datePickerClearText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeWhenWeMetPicker} style={styles.datePickerDoneButton} activeOpacity={0.7}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}
      </Modal>

      {/* ── Flag Modal ────────────────────────────────────────── */}
      <Modal visible={flagModalVisible} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => { setFlagModalVisible(false); setEditingFlag(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setFlagModalVisible(false); setEditingFlag(null); }} style={styles.roundButton}>
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={handleSaveFlag}
              style={[styles.roundButton, !flagText.trim() && styles.roundButtonDisabled]} disabled={!flagText.trim()}>
              <Ionicons name="checkmark" size={20} color={flagText.trim() ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalSection}>
              <View style={styles.flagTypeToggle}>
                <TouchableOpacity style={[styles.flagTypeOption, flagType === 'green' && styles.flagTypeOptionGreenActive]}
                  onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFlagType('green'); }} activeOpacity={0.7}>
                  <View style={[styles.flagTypeDot, { backgroundColor: flagType === 'green' ? '#22C55E' : '#D1D5DB' }]} />
                  <Text style={[styles.flagTypeOptionText, flagType === 'green' && { color: '#15803D' }]}>Green</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.flagTypeOption, flagType === 'red' && styles.flagTypeOptionRedActive]}
                  onPress={() => { if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFlagType('red'); }} activeOpacity={0.7}>
                  <View style={[styles.flagTypeDot, { backgroundColor: flagType === 'red' ? '#EF4444' : '#D1D5DB' }]} />
                  <Text style={[styles.flagTypeOptionText, flagType === 'red' && { color: '#DC2626' }]}>Red</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>{flagType === 'green' ? "What's the positive trait?" : "What's the concern?"}</Text>
              <View style={styles.flagTextInputContainer}>
                <TextInput style={styles.flagTextInput}
                  placeholder={flagType === 'green' ? 'e.g., Great listener...' : 'e.g., Often late...'}
                  placeholderTextColor="#C4C4C4" value={flagText} onChangeText={setFlagText} autoFocus maxLength={50} />
              </View>
              <Text style={styles.flagCharCount}>{flagText.length}/50</Text>
            </View>
            {editingFlag && (
              <View style={styles.modalSection}>
                <TouchableOpacity style={styles.dangerButton} onPress={() => {
                  Alert.alert('Delete Flag', `Remove "${editingFlag.text}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { handleDeleteFlag(editingFlag.id); setFlagModalVisible(false); setEditingFlag(null); }},
                  ]);
                }} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.dangerButtonText}>Delete Flag</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Date Entry Modal ──────────────────────────────────── */}
      <Modal visible={dateModalVisible} animationType="slide" presentationStyle="pageSheet"
        onRequestClose={() => { setDateModalVisible(false); setEditingDateEntry(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setDateModalVisible(false); setEditingDateEntry(null); }} style={styles.roundButton}>
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingDateEntry ? 'Edit Date' : 'Log Date'}</Text>
            <TouchableOpacity onPress={handleSaveDateEntry}
              style={[styles.roundButton, !dateEntryTitle.trim() && styles.roundButtonDisabled]}
              disabled={!dateEntryTitle.trim()}>
              <Ionicons name="checkmark" size={20} color={dateEntryTitle.trim() ? '#1F2937' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>When?</Text>
              <TouchableOpacity style={styles.modalMetaButton} onPress={openDateEntryPicker} activeOpacity={0.7}>
                <View style={styles.modalMetaPlaceholder}>
                  <Ionicons name="calendar-outline" size={18} color={ACCENT_COLOR} />
                  <Text style={[styles.modalMetaPlaceholderText, { color: '#1F2937', fontWeight: '500' }]}>{formatDateEntryDate(dateEntryDate.toISOString())}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Title</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput style={styles.modalInput} placeholder="e.g., Coffee at Blue Bottle"
                  placeholderTextColor="#9CA3AF" value={dateEntryTitle} onChangeText={setDateEntryTitle} maxLength={100} />
              </View>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Where? (optional)</Text>
              <View style={styles.modalInputWrapper}>
                <TextInput style={styles.modalInput} placeholder="e.g., Blue Bottle Coffee, Brooklyn"
                  placeholderTextColor="#9CA3AF" value={dateEntryLocation} onChangeText={setDateEntryLocation} maxLength={80} />
              </View>
            </View>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>Notes (optional)</Text>
              <View style={styles.modalTextAreaContainer}>
                <TextInput style={[styles.modalTextArea, { minHeight: 80 }]} placeholder="Any memorable moments..."
                  placeholderTextColor="#9CA3AF" value={dateEntryNotes} onChangeText={setDateEntryNotes}
                  multiline textAlignVertical="top" maxLength={300} />
              </View>
            </View>
            {editingDateEntry && (
              <View style={styles.modalSection}>
                <TouchableOpacity style={styles.dangerButton} onPress={() => {
                  Alert.alert('Delete Date', `Remove "${editingDateEntry.title}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => { handleDeleteDateEntry(editingDateEntry.id); setDateModalVisible(false); setEditingDateEntry(null); }},
                  ]);
                }} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.dangerButtonText}>Delete Date</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        {showDateEntryPicker && Platform.OS === 'ios' && (
          <View style={styles.pickerOverlay}>
            <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={closeDateEntryPicker} />
            <Animated.View style={[styles.datePickerContainer, { transform: [{ translateY: dateEntryPickerTranslateY }] }]}>
              <View style={styles.pickerHandle}><View style={styles.pickerHandleBar} /></View>
              <Text style={styles.pickerTitle}>When was the date?</Text>
              <View style={styles.datePickerWrapper}>
                <DateTimePicker value={dateEntryDate} mode="date" display="spinner"
                  onChange={(_, d) => { if (Platform.OS === 'android') setShowDateEntryPicker(false); if (d) setDateEntryDate(d); }}
                  maximumDate={new Date()} minimumDate={new Date(2000, 0, 1)} style={styles.datePicker} />
              </View>
              <View style={styles.datePickerActions}>
                <TouchableOpacity onPress={() => { setDateEntryDate(new Date()); closeDateEntryPicker(); }}
                  style={styles.datePickerClearButton} activeOpacity={0.7}>
                  <Text style={styles.datePickerClearText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeDateEntryPicker} style={styles.datePickerDoneButton} activeOpacity={0.7}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        )}
      </Modal>

      {/* Android Date Pickers */}
      {showWhenWeMetPicker && Platform.OS === 'android' && (
        <DateTimePicker value={whenWeMet || new Date()} mode="date" display="default"
          onChange={(_, d) => { setShowWhenWeMetPicker(false); if (d) setWhenWeMet(d); }}
          maximumDate={new Date()} minimumDate={new Date(2000, 0, 1)} />
      )}
      {showDateEntryPicker && Platform.OS === 'android' && (
        <DateTimePicker value={dateEntryDate} mode="date" display="default"
          onChange={(_, d) => { setShowDateEntryPicker(false); if (d) setDateEntryDate(d); }}
          maximumDate={new Date()} minimumDate={new Date(2000, 0, 1)} />
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0EEE8' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Fixed Header
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBlur: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerGradient: { flex: 1, height: 120 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.10)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },

  // Person Selector
  personSelector: { marginBottom: 16, maxHeight: 48 },
  personSelectorContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  personChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingLeft: 4, paddingRight: 14, paddingVertical: 4, borderRadius: 24, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  personChipActive: { backgroundColor: ACCENT_COLOR },
  personChipAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  personChipInitials: { fontSize: 13, fontWeight: '700', color: ACCENT_COLOR },
  personChipInitialsActive: { color: ACCENT_COLOR },
  personChipName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  personChipNameActive: { color: '#FFFFFF' },
  addPersonChip: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1.5, borderColor: '#F9D1D5',
  },

  // Person Header Card
  personHeaderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, marginHorizontal: 16, marginBottom: 12,
    paddingVertical: 14, paddingLeft: 20, paddingRight: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  personCardAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
    backgroundColor: ACCENT_COLOR, borderTopLeftRadius: 20, borderBottomLeftRadius: 20,
  },
  personAvatarRing: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'rgba(225, 29, 72, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  personAvatar: {
    width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center',
  },
  personAvatarInitials: { fontSize: 19, fontWeight: '700', color: '#E11D48' },
  personHeaderCenter: { flex: 1 },
  personHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickActionBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  personHeaderEditBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  personName: { fontSize: 26, fontWeight: '700', color: '#1F2937', letterSpacing: -0.4 },

  // Expandable Sections
  sectionsContainer: { paddingHorizontal: 16, marginBottom: 24 },
  expandableCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  sectionPreview: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  expandableContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },

  // Vibe Rating
  vibeMetricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vibeMetricLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  vibeMetricIcon: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  vibeMetricLabel: { fontSize: 14, fontWeight: '500', color: '#374151' },
  vibeSegmentsRow: { flexDirection: 'row', gap: 4, width: 130 },
  vibeSegmentTouch: { flex: 1 },
  vibeSegmentBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  vibeSegmentFill: { height: '100%', borderRadius: 3 },

  // First Impression
  firstImpressionTouchable: { paddingVertical: 4 },
  firstImpressionText: { fontSize: 15, fontWeight: '500', color: '#374151', lineHeight: 22, fontStyle: 'italic' },
  firstImpressionMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  metaTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  metaTagText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  firstImpressionEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  firstImpressionEmptyText: { fontSize: 14, fontWeight: '400', color: '#9CA3AF' },

  // Flags
  flagsChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 6 },
  flagChipGreen: { backgroundColor: '#F0FDF4' },
  flagChipRed: { backgroundColor: '#FEF2F2' },
  flagDot: { width: 6, height: 6, borderRadius: 3 },
  flagChipText: { fontSize: 13, fontWeight: '500' },
  flagsEmptyText: { fontSize: 13, fontWeight: '400', color: '#9CA3AF', textAlign: 'center', paddingVertical: 4 },
  flagsAddRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  flagsAddLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  flagsAddDivider: { width: 1, height: 14, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  flagsAddLinkGreenText: { fontSize: 13, fontWeight: '500', color: '#15803D' },
  flagsAddLinkRedText: { fontSize: 13, fontWeight: '500', color: '#DC2626' },

  // Date History
  dateHistoryTimeline: { paddingLeft: 4 },
  dateEntryRow: { flexDirection: 'row', minHeight: 56 },
  dateEntryTimeline: { width: 20, alignItems: 'center' },
  dateEntryDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginTop: 6,
  },
  dateEntryLine: { flex: 1, width: 1.5, backgroundColor: '#DBEAFE', marginTop: 4, marginBottom: -4 },
  dateEntryContent: { flex: 1, paddingLeft: 12, paddingBottom: 14 },
  dateEntryHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dateEntryTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937', lineHeight: 19 },
  dateEntryVibePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 1,
  },
  dateEntryVibeText: { fontSize: 11, fontWeight: '600' },
  dateEntryMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 },
  dateEntryMetaDot: { fontSize: 11, color: '#C4C4C4' },
  dateEntryLocation: { fontSize: 12, fontWeight: '400', color: '#9CA3AF' },
  dateEntryDate: { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  dateHistoryEmptyText: { fontSize: 13, fontWeight: '400', color: '#9CA3AF', textAlign: 'center', paddingVertical: 4 },
  dateHistoryAddLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 4, marginTop: 2,
  },
  dateHistoryAddLinkText: { fontSize: 13, fontWeight: '500', color: '#3B82F6' },

  // Notes
  addNoteCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 12, paddingLeft: 16, paddingRight: 12, paddingVertical: 10, marginBottom: 6,
  },
  addNotePlaceholder: { flex: 1, fontSize: 14, fontWeight: '400', color: '#9CA3AF' },
  noteCardWrapper: { marginBottom: 6, position: 'relative', overflow: 'hidden', borderRadius: 12 },
  noteCardAnimatedWrapper: { backgroundColor: '#F9FAFB', borderRadius: 12 },
  noteActionsContainer: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 16, gap: 16,
  },
  noteSwipeAction: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  noteEditAction: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', shadowColor: '#6B7280' },
  noteDeleteAction: { backgroundColor: '#FFFFFF', borderColor: '#FECACA', shadowColor: '#EF4444' },
  noteCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 12, padding: 12, paddingLeft: 16,
    overflow: 'hidden',
  },
  noteAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
    backgroundColor: '#10B981', borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
  },
  noteText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#374151', lineHeight: 20 },

  // Details
  detailsRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  detailsRowIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF1F2',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  detailsRowContent: { flex: 1 },
  detailsRowLabel: { fontSize: 11, fontWeight: '500', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  detailsRowValue: { fontSize: 15, fontWeight: '500', color: '#1F2937' },

  // Date Ideas Section
  dateIdeasSection: { marginBottom: 24 },
  dateIdeasHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, marginBottom: 14,
  },
  dateIdeasTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionAccent: { width: 4, height: 36, backgroundColor: '#D1D5DB', borderRadius: 2, marginTop: 2 },
  bigSectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', letterSpacing: -0.3, marginBottom: 3 },
  bigSectionSubtitle: { fontSize: 13, fontWeight: '400', color: '#6B7280' },
  seeAllButton: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  seeAllText: { fontSize: 13, fontWeight: '500', color: '#6B7280', marginRight: 2 },
  dateIdeasScroll: { paddingLeft: 16, paddingRight: 8, gap: 10 },
  dateIdeaCard: {
    width: 152, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  dateIdeaHeart: {
    position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  dateIdeaIconCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  dateIdeaTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', textAlign: 'center', letterSpacing: -0.2, marginBottom: 2, lineHeight: 18 },
  dateIdeaSubtitle: { fontSize: 11, fontWeight: '500', color: '#6B7280', textAlign: 'center', marginBottom: 8 },
  dateIdeaDuration: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  dateIdeaDurationText: { fontSize: 10, fontWeight: '600' },

  // Dating Wisdom
  wisdomSection: { paddingHorizontal: 16, marginBottom: 24 },
  wisdomHeader: { marginBottom: 14 },
  wisdomList: { gap: 8 },
  wisdomCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  wisdomIconCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF1F2',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  wisdomContent: { flex: 1 },
  wisdomTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', letterSpacing: -0.2, marginBottom: 2 },
  wisdomDescription: { fontSize: 12, fontWeight: '400', color: '#6B7280', lineHeight: 16 },

  // Menu Overlay
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  menuContainer: {
    position: 'absolute', top: 116, right: 16, backgroundColor: '#FFFFFF',
    borderRadius: 18, paddingVertical: 6, minWidth: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, gap: 12 },
  menuItemText: { fontSize: 15, fontWeight: '500', color: '#374151' },

  // Modals (shared)
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F3F5',
  },
  roundButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  roundButtonDisabled: { opacity: 0.5 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937' },
  modalInputContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  modalTextInput: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1F2937', lineHeight: 24, padding: 0 },
  modalSection: { paddingHorizontal: 20, paddingTop: 20 },
  modalSectionLabel: { fontSize: 15, fontWeight: '500', color: '#6B7280', marginBottom: 10 },
  modalTextAreaContainer: {
    backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 120,
  },
  modalTextArea: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1F2937', lineHeight: 24, padding: 16, minHeight: 120 },
  modalMetaButton: {
    backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  modalMetaPlaceholder: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  modalMetaPlaceholderText: { flex: 1, fontSize: 15, fontWeight: '400', color: '#9CA3AF' },
  modalMetaSelected: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  modalMetaSelectedText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1F2937' },
  modalInputWrapper: {
    backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  modalInput: { fontSize: 16, fontWeight: '500', color: '#1F2937', padding: 0 },
  dangerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', gap: 8,
  },
  dangerButtonText: { fontSize: 15, fontWeight: '600', color: '#DC2626' },

  // Flag Modal specific
  flagTypeToggle: {
    flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 3,
  },
  flagTypeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  flagTypeOptionGreenActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  flagTypeOptionRedActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  flagTypeDot: { width: 8, height: 8, borderRadius: 4 },
  flagTypeOptionText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
  flagTextInputContainer: {
    backgroundColor: '#F9FAFB', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  flagTextInput: { fontSize: 16, fontWeight: '500', color: '#1F2937', padding: 0 },
  flagCharCount: { fontSize: 12, fontWeight: '500', color: '#C4C4C4', textAlign: 'right', marginTop: 8 },

  // Vibe Picker (in date modal)
  vibePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  vibePickerItem: {
    flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2,
    borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  vibePickerLabel: { fontSize: 10, fontWeight: '500', color: '#6B7280', marginTop: 3 },

  // Date Picker
  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end' },
  pickerBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerHandle: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  pickerHandleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 16, letterSpacing: -0.3 },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  datePickerWrapper: { alignItems: 'center', justifyContent: 'center', marginHorizontal: -10 },
  datePicker: { width: '100%', height: 200 },
  datePickerActions: { flexDirection: 'row', marginHorizontal: 20, marginTop: 12, gap: 10 },
  datePickerClearButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
  },
  datePickerClearText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  datePickerDoneButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1F2937',
    alignItems: 'center', justifyContent: 'center',
  },
  datePickerDoneText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});

export default DatingHomeScreen;
