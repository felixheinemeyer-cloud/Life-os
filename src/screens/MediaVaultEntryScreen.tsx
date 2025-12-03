import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Linking,
  TextInput,
  Platform,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { useMedia } from '../context/MediaContext';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Media Vault accent color (matches the Media Vault icon)
const MEDIA_VAULT_COLOR = '#EC4899';
const MEDIA_VAULT_LIGHT_COLOR = '#FCE7F3';
const NOTE_ACTION_WIDTH = 140;

// Types
interface MediaVaultEntryScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params: {
      entry: MediaEntry;
    };
  };
}

interface MediaNote {
  id: string;
  content: string;
  createdAt: string;
}

interface MediaEntry {
  id: string;
  title: string;
  thumbnail?: string;
  format: 'video' | 'short-video' | 'audio' | 'article' | 'thread' | 'website';
  category: string;
  duration?: string;
  sourceUrl?: string;
  notes?: string; // Legacy single note
  mediaNotes?: MediaNote[]; // New multiple notes array
  insights?: string[];
  isCompleted?: boolean;
  isWatchLater?: boolean;
  dateAdded?: string;
}

interface MediaCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightColor: string;
}

// Categories (matching MediaVaultScreen)
const CATEGORIES: Record<string, MediaCategory> = {
  'health': { id: 'health', name: 'Health', icon: 'heart-outline', color: '#10B981', lightColor: '#D1FAE5' },
  'finance': { id: 'finance', name: 'Finance', icon: 'wallet-outline', color: '#F59E0B', lightColor: '#FEF3C7' },
  'love': { id: 'love', name: 'Love', icon: 'rose-outline', color: '#EC4899', lightColor: '#FCE7F3' },
  'mindset': { id: 'mindset', name: 'Mindset', icon: 'bulb-outline', color: '#8B5CF6', lightColor: '#EDE9FE' },
  'work': { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#3B82F6', lightColor: '#DBEAFE' },
  'psychology': { id: 'psychology', name: 'Psychology', icon: 'body-outline', color: '#6366F1', lightColor: '#E0E7FF' },
  'marketing': { id: 'marketing', name: 'Marketing', icon: 'megaphone-outline', color: '#F97316', lightColor: '#FFEDD5' },
  'politics': { id: 'politics', name: 'Politics', icon: 'globe-outline', color: '#64748B', lightColor: '#F1F5F9' },
  'common-knowledge': { id: 'common-knowledge', name: 'Common Knowledge', icon: 'library-outline', color: '#0EA5E9', lightColor: '#E0F2FE' },
  'piano': { id: 'piano', name: 'Piano', icon: 'musical-note-outline', color: '#1F2937', lightColor: '#F3F4F6' },
  'polish': { id: 'polish', name: 'Polish', icon: 'language-outline', color: '#DC2626', lightColor: '#FEE2E2' },
  'cooking': { id: 'cooking', name: 'Cooking', icon: 'restaurant-outline', color: '#EA580C', lightColor: '#FED7AA' },
  'fitness': { id: 'fitness', name: 'Fitness', icon: 'barbell-outline', color: '#059669', lightColor: '#A7F3D0' },
  'meditation': { id: 'meditation', name: 'Meditation', icon: 'leaf-outline', color: '#14B8A6', lightColor: '#CCFBF1' },
  'productivity': { id: 'productivity', name: 'Productivity', icon: 'rocket-outline', color: '#7C3AED', lightColor: '#DDD6FE' },
  'tech': { id: 'tech', name: 'Tech', icon: 'hardware-chip-outline', color: '#2563EB', lightColor: '#BFDBFE' },
  'design': { id: 'design', name: 'Design', icon: 'color-palette-outline', color: '#DB2777', lightColor: '#FBCFE8' },
  'travel': { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#0891B2', lightColor: '#CFFAFE' },
};

const DEFAULT_CATEGORY: MediaCategory = {
  id: 'uncategorized',
  name: 'Uncategorized',
  icon: 'folder-outline',
  color: '#9CA3AF',
  lightColor: '#F3F4F6',
};

// Platform detection helper with brand colors
const getPlatformInfo = (sourceUrl?: string): { icon: string; name: string; color: string; iconLibrary?: 'entypo' } | null => {
  if (!sourceUrl) return null;
  const url = sourceUrl.toLowerCase();

  if (url.includes('youtube.com') || url.includes('youtu.be')) return { icon: 'logo-youtube', name: 'YouTube', color: '#FF0000' };
  if (url.includes('tiktok.com')) return { icon: 'logo-tiktok', name: 'TikTok', color: '#000000' };
  if (url.includes('vimeo.com')) return { icon: 'logo-vimeo', name: 'Vimeo', color: '#1AB7EA' };
  if (url.includes('twitch.tv')) return { icon: 'logo-twitch', name: 'Twitch', color: '#9146FF' };
  if (url.includes('reddit.com') || url.includes('redd.it')) return { icon: 'logo-reddit', name: 'Reddit', color: '#FF4500' };
  if (url.includes('twitter.com') || url.includes('x.com')) return { icon: 'logo-twitter', name: 'X', color: '#000000' };
  if (url.includes('instagram.com')) return { icon: 'logo-instagram', name: 'Instagram', color: '#E4405F' };
  if (url.includes('spotify.com')) return { icon: 'spotify', name: 'Spotify', color: '#1DB954', iconLibrary: 'entypo' };
  if (url.includes('soundcloud.com')) return { icon: 'logo-soundcloud', name: 'SoundCloud', color: '#FF5500' };
  if (url.includes('podcasts.apple.com')) return { icon: 'logo-apple', name: 'Apple Podcasts', color: '#9933CC' };
  if (url.includes('medium.com')) return { icon: 'logo-medium', name: 'Medium', color: '#000000' };
  if (url.includes('linkedin.com')) return { icon: 'logo-linkedin', name: 'LinkedIn', color: '#0A66C2' };
  if (url.includes('github.com')) return { icon: 'logo-github', name: 'GitHub', color: '#181717' };
  if (url.includes('dribbble.com')) return { icon: 'logo-dribbble', name: 'Dribbble', color: '#EA4C89' };
  if (url.includes('pinterest.com')) return { icon: 'logo-pinterest', name: 'Pinterest', color: '#BD081C' };
  if (url.includes('facebook.com')) return { icon: 'logo-facebook', name: 'Facebook', color: '#1877F2' };
  if (url.includes('threads.net')) return { icon: 'at-outline', name: 'Threads', color: '#000000' };
  if (url.includes('substack.com')) return { icon: 'mail-outline', name: 'Substack', color: '#FF6719' };

  return null;
};

// Format info helper
const getFormatInfo = (format: MediaEntry['format']): { icon: keyof typeof Ionicons.glyphMap; label: string } => {
  switch (format) {
    case 'video': return { icon: 'play-circle-outline', label: 'Video' };
    case 'short-video': return { icon: 'phone-portrait-outline', label: 'Short' };
    case 'audio': return { icon: 'headset-outline', label: 'Audio' };
    case 'article': return { icon: 'document-text-outline', label: 'Article' };
    case 'thread': return { icon: 'chatbubbles-outline', label: 'Thread' };
    case 'website': return { icon: 'globe-outline', label: 'Website' };
    default: return { icon: 'play-circle-outline', label: 'Media' };
  }
};

// Get action verb based on format
const getActionVerb = (format: MediaEntry['format']): string => {
  switch (format) {
    case 'video':
    case 'short-video': return 'Watch';
    case 'audio': return 'Listen';
    case 'article':
    case 'thread':
    case 'website': return 'Open';
    default: return 'Open';
  }
};

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;

  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];

  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
};

// Get YouTube thumbnail URL from video ID
const getYouTubeThumbnail = (url?: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// Swipeable Note Card Component
const SwipeableNoteCard: React.FC<{
  noteText: string;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
}> = ({ noteText, onEdit, onDelete, onSwipeStart, onSwipeEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [measured, setMeasured] = useState(false);
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

  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const closeActions = useCallback(() => {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [translateX]);

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

  const handleTextLayout = (e: any) => {
    if (!measured) {
      const { lines } = e.nativeEvent;
      if (lines.length > 3) {
        setNeedsExpansion(true);
      }
      setMeasured(true);
    }
  };

  const handleCardPress = () => {
    if (isOpen) {
      closeActions();
    } else if (needsExpansion) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setExpanded(!expanded);
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
    <View style={swipeableNoteStyles.noteCardWrapper}>
      {/* Action buttons behind the card */}
      <View style={swipeableNoteStyles.noteActionsContainer}>
        <TouchableOpacity
          style={[swipeableNoteStyles.noteSwipeAction, swipeableNoteStyles.noteEditAction]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[swipeableNoteStyles.noteSwipeAction, swipeableNoteStyles.noteDeleteAction]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[swipeableNoteStyles.noteCardAnimated, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleCardPress}>
          <View style={swipeableNoteStyles.noteCard}>
            <View style={[swipeableNoteStyles.noteAccentBar, { backgroundColor: MEDIA_VAULT_COLOR }]} />
            <View style={swipeableNoteStyles.noteContent}>
              <Text
                style={swipeableNoteStyles.noteText}
                numberOfLines={!measured ? undefined : (expanded ? undefined : 3)}
                onTextLayout={handleTextLayout}
              >
                {noteText}
              </Text>
              {needsExpansion && (
                <TouchableOpacity onPress={handleCardPress} style={swipeableNoteStyles.noteExpandButton}>
                  <Text style={swipeableNoteStyles.noteExpandButtonText}>
                    {expanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// Swipeable note card styles
const swipeableNoteStyles = StyleSheet.create({
  noteCardWrapper: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  noteCardAnimated: {
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
    paddingRight: 0,
    gap: 12,
  },
  noteSwipeAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginRight: 16,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: MEDIA_VAULT_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  noteAccentBar: {
    width: 4,
  },
  noteContent: {
    flex: 1,
    padding: 16,
  },
  noteText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 22,
  },
  noteExpandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  noteExpandButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

const MediaVaultEntryScreen: React.FC<MediaVaultEntryScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { entry } = route.params;
  const { updateEntry } = useMedia();

  // Derived data
  const category = CATEGORIES[entry.category] || DEFAULT_CATEGORY;
  const platformInfo = getPlatformInfo(entry.sourceUrl);
  const youtubeThumbnail = getYouTubeThumbnail(entry.sourceUrl);
  const thumbnailUrl = entry.thumbnail || youtubeThumbnail;

  // State
  const [isCompleted, setIsCompleted] = useState(entry.isCompleted || false);
  const [isWatchLater, setIsWatchLater] = useState(entry.isWatchLater || false);
  const [mediaNotes, setMediaNotes] = useState<MediaNote[]>(entry.mediaNotes || []);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<MediaNote | null>(null);
  const [insights, setInsights] = useState<string[]>(entry.insights || []);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<MediaEntry['format']>(entry.format);
  const [formatBadgeLayout, setFormatBadgeLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isSwipingNote, setIsSwipingNote] = useState(false);

  // Derived from current format (updated when format changes)
  const formatInfo = getFormatInfo(currentFormat);
  const actionVerb = getActionVerb(currentFormat);

  // Refs
  const formatBadgeRef = useRef<View>(null);
  const noteInputRef = useRef<TextInput>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Mount animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handlers
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleOpenSource = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (entry.sourceUrl) {
      try {
        await Linking.openURL(entry.sourceUrl);
      } catch (error) {
        Alert.alert('Error', 'Could not open the link');
      }
    }
  };

  const handleToggleComplete = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(
        isCompleted
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
    }
    setIsCompleted(!isCompleted);
  };

  const handleMoreOptions = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDropdown(!showDropdown);
  };

  const handleRemoveWatchlist = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDropdown(false);
    if (isWatchLater) {
      setIsWatchLater(false);
      updateEntry(entry.id, { isWatchLater: false });
    }
  };

  const handleAddWatchlist = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDropdown(false);
    if (!isWatchLater) {
      setIsWatchLater(true);
      updateEntry(entry.id, { isWatchLater: true });
    }
  };

  const handleDeleteEntry = () => {
    setShowDropdown(false);
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleFormatPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (formatBadgeRef.current) {
      formatBadgeRef.current.measureInWindow((x, y, width, height) => {
        setFormatBadgeLayout({ x, y, width, height });
        setShowFormatDropdown(!showFormatDropdown);
      });
    } else {
      setShowFormatDropdown(!showFormatDropdown);
    }
  };

  const handleFormatSelect = (format: MediaEntry['format']) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowFormatDropdown(false);
    setCurrentFormat(format);
    updateEntry(entry.id, { format });
  };

  const handleWatchlistToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newValue = !isWatchLater;
    setIsWatchLater(newValue);
    updateEntry(entry.id, { isWatchLater: newValue });
  };

  const handleOpenNotesModal = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingNote(null);
    setNoteContent('');
    setShowNotesModal(true);
    setTimeout(() => noteInputRef.current?.focus(), 100);
  };

  const handleEditNote = (note: MediaNote) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingNote(note);
    setNoteContent(note.content);
    setShowNotesModal(true);
    setTimeout(() => noteInputRef.current?.focus(), 100);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (editingNote) {
      // Editing existing note
      const updatedNotes = mediaNotes.map(n =>
        n.id === editingNote.id
          ? { ...n, content: noteContent.trim() }
          : n
      );
      setMediaNotes(updatedNotes);
      updateEntry(entry.id, { mediaNotes: updatedNotes });
    } else {
      // Creating new note
      const newNote: MediaNote = {
        id: Date.now().toString(),
        content: noteContent.trim(),
        createdAt: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...mediaNotes];
      setMediaNotes(updatedNotes);
      updateEntry(entry.id, { mediaNotes: updatedNotes });
    }

    setShowNotesModal(false);
    setNoteContent('');
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            const updatedNotes = mediaNotes.filter(n => n.id !== noteId);
            setMediaNotes(updatedNotes);
            updateEntry(entry.id, { mediaNotes: updatedNotes });
          },
        },
      ]
    );
  };

  const handleAddInsight = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.prompt(
      'Add Insight',
      'What did you learn from this?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (text?: string) => {
            if (text && text.trim()) {
              setInsights([...insights, text.trim()]);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Extract domain from URL
  const getDomain = (url?: string): string => {
    if (!url) return '';
    try {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 64 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSwipingNote}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={entry.sourceUrl ? handleOpenSource : undefined}
          disabled={!entry.sourceUrl}
        >
          <Animated.View
            style={[
              styles.heroCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: heroScale }],
              },
            ]}
          >
            {thumbnailUrl ? (
              <View style={styles.heroThumbnailContainer}>
                <Image source={{ uri: thumbnailUrl }} style={styles.heroThumbnail} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)']}
                  style={styles.heroThumbnailOverlay}
                />
                {/* Play Icon Overlay */}
                <View style={styles.heroPlayButton}>
                  <Ionicons name="play" size={32} color="#FFFFFF" />
                </View>

                {/* Status Badge */}
                {isCompleted && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={MEDIA_VAULT_COLOR} />
                    <Text style={styles.statusBadgeText}>Completed</Text>
                  </View>
                )}

              </View>
            ) : (
              <LinearGradient
                colors={[MEDIA_VAULT_LIGHT_COLOR, MEDIA_VAULT_COLOR + '25']}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Platform/Format Icon */}
                <View style={[styles.heroIconCircle, { shadowColor: MEDIA_VAULT_COLOR }]}>
                  {platformInfo?.iconLibrary === 'entypo' ? (
                    <Entypo
                      name={platformInfo.icon as keyof typeof Entypo.glyphMap}
                      size={44}
                      color={MEDIA_VAULT_COLOR}
                    />
                  ) : (
                    <Ionicons
                      name={(platformInfo?.icon || formatInfo.icon) as keyof typeof Ionicons.glyphMap}
                      size={44}
                      color={MEDIA_VAULT_COLOR}
                    />
                  )}
                </View>

                {/* Status Badge */}
                {isCompleted && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={MEDIA_VAULT_COLOR} />
                    <Text style={styles.statusBadgeText}>Completed</Text>
                  </View>
                )}

              </LinearGradient>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Title & Meta Section */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{entry.title}</Text>

          {/* Meta Badges */}
          <View style={styles.metaRow}>
            {/* Watchlist Badge - Tappable */}
            <TouchableOpacity
              style={[styles.watchlistBadge, !isWatchLater && styles.watchlistBadgeInactive]}
              onPress={handleWatchlistToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name="time-outline"
                size={12}
                color={isWatchLater ? '#6B7280' : '#FFFFFF'}
              />
              <Text style={[styles.watchlistBadgeText, !isWatchLater && styles.watchlistBadgeTextInactive]}>
                {isWatchLater ? 'Watchlist' : 'Add to Watchlist'}
              </Text>
            </TouchableOpacity>

            {/* Platform Badge */}
            {platformInfo && (
              <View style={styles.metaBadge}>
                {platformInfo.iconLibrary === 'entypo' ? (
                  <Entypo name={platformInfo.icon as keyof typeof Entypo.glyphMap} size={12} color={platformInfo.color} />
                ) : (
                  <Ionicons name={platformInfo.icon as keyof typeof Ionicons.glyphMap} size={12} color={platformInfo.color} />
                )}
                <Text style={styles.metaBadgeText}>
                  {platformInfo.name}
                </Text>
              </View>
            )}

            {/* Format Badge */}
            <View ref={formatBadgeRef} style={styles.formatBadgeContainer}>
              <TouchableOpacity
                style={styles.metaBadge}
                onPress={handleFormatPress}
                activeOpacity={0.7}
              >
                <Ionicons name={formatInfo.icon} size={12} color="#6B7280" />
                <Text style={styles.metaBadgeText}>{formatInfo.label}</Text>
                <Ionicons name="chevron-down" size={12} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Category Badge */}
            <View style={styles.metaBadge}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={styles.metaBadgeText}>
                {category.name}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Primary Action - Open Source */}
          {entry.sourceUrl && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenSource}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{getActionVerb(entry.format)}</Text>
            </TouchableOpacity>
          )}

        </Animated.View>

        {/* Notes Section */}
        <Animated.View
          style={[
            styles.notesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Notes Header */}
          <View style={styles.notesSectionHeader}>
            <Text style={styles.notesSectionTitle}>Notes</Text>
            <Text style={styles.notesSectionSubtitle}>Key takeaways and thoughts</Text>
          </View>

          {/* Add Note Card */}
          <TouchableOpacity
            style={styles.addNoteCard}
            onPress={handleOpenNotesModal}
            activeOpacity={0.7}
          >
            <Text style={styles.addNotePlaceholder}>Add a note...</Text>
            <View style={styles.addNoteButton}>
              <Ionicons name="add" size={20} color={MEDIA_VAULT_COLOR} />
            </View>
          </TouchableOpacity>

          {/* Note Cards */}
          {mediaNotes.map((note) => (
            <SwipeableNoteCard
              key={note.id}
              noteText={note.content}
              onEdit={() => handleEditNote(note)}
              onDelete={() => handleDeleteNote(note.id)}
              onSwipeStart={() => setIsSwipingNote(true)}
              onSwipeEnd={() => setIsSwipingNote(false)}
            />
          ))}
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Options Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownModalOverlay}>
            <View style={[styles.dropdownMenu, { top: insets.top + 56, right: 16 }]}>
              {isWatchLater ? (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleRemoveWatchlist}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={18} color="#6B7280" />
                  <Text style={styles.dropdownItemText}>Remove from Watchlist</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleAddWatchlist}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time" size={18} color={MEDIA_VAULT_COLOR} />
                  <Text style={styles.dropdownItemText}>Add to Watchlist</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemDestructive]}
                onPress={handleDeleteEntry}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.dropdownItemTextDestructive}>Delete Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Format Dropdown Modal */}
      <Modal
        visible={showFormatDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormatDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFormatDropdown(false)}>
          <View style={styles.formatModalOverlay}>
            <View
              style={[
                styles.formatDropdownMenu,
                {
                  position: 'absolute',
                  top: formatBadgeLayout.y + formatBadgeLayout.height + 6,
                  left: formatBadgeLayout.x + formatBadgeLayout.width - 140,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('video')}
                activeOpacity={0.6}
              >
                <Ionicons name="play-circle-outline" size={16} color={currentFormat === 'video' ? MEDIA_VAULT_COLOR : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'video' && styles.formatDropdownItemTextActive]}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('short-video')}
                activeOpacity={0.6}
              >
                <Ionicons name="phone-portrait-outline" size={16} color={currentFormat === 'short-video' ? MEDIA_VAULT_COLOR : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'short-video' && styles.formatDropdownItemTextActive]}>Short</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('audio')}
                activeOpacity={0.6}
              >
                <Ionicons name="headset-outline" size={16} color={currentFormat === 'audio' ? MEDIA_VAULT_COLOR : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'audio' && styles.formatDropdownItemTextActive]}>Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('article')}
                activeOpacity={0.6}
              >
                <Ionicons name="document-text-outline" size={16} color={currentFormat === 'article' ? MEDIA_VAULT_COLOR : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'article' && styles.formatDropdownItemTextActive]}>Article</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('thread')}
                activeOpacity={0.6}
              >
                <Ionicons name="chatbubbles-outline" size={16} color={currentFormat === 'thread' ? MEDIA_VAULT_COLOR : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'thread' && styles.formatDropdownItemTextActive]}>Thread</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('website')}
                activeOpacity={0.6}
              >
                <Ionicons name="globe-outline" size={16} color={currentFormat === 'website' ? MEDIA_VAULT_COLOR : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'website' && styles.formatDropdownItemTextActive]}>Website</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Notes Edit Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowNotesModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
            <TouchableOpacity
              onPress={handleSaveNote}
              style={styles.modalCloseButton}
              disabled={!noteContent.trim()}
            >
              <Ionicons name="checkmark" size={20} color={noteContent.trim() ? '#1F2937' : '#D1D5DB'} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              ref={noteInputRef}
              style={styles.modalTextInput}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Write your thoughts, key moments, or reminders..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top }]} pointerEvents="box-none">
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

        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMoreOptions}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 16,
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Hero Card
  heroCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  heroGradient: {
    aspectRatio: 16 / 9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroThumbnailContainer: {
    aspectRatio: 16 / 9,
    width: '100%',
    position: 'relative',
  },
  heroThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroThumbnailOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  heroPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -28,
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  heroIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EC4899',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Title Section
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  watchlistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  watchlistBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  watchlistBadgeInactive: {
    backgroundColor: '#1F2937',
  },
  watchlistBadgeTextInactive: {
    color: '#FFFFFF',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Format Badge & Dropdown
  formatBadgeContainer: {
    position: 'relative',
  },
  // Options Dropdown Menu
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownItemDestructive: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  dropdownItemTextDestructive: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },

  // Format Dropdown
  formatModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  formatDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  formatDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  formatDropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formatDropdownItemTextActive: {
    color: '#EC4899',
    fontWeight: '600',
  },

  // Actions Section
  actionsSection: {
    marginBottom: 22,
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  completedButton: {
    backgroundColor: '#FCE7F3',
  },
  completedButtonText: {
    color: '#EC4899',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: -0.3,
  },
  cardAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  addInsightButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Notes Section
  notesSection: {
    marginTop: 10,
    marginBottom: 14,
  },
  notesSectionHeader: {
    marginBottom: 16,
  },
  notesSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesSectionSubtitle: {
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
    marginBottom: 12,
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
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  noteAccentBar: {
    width: 4,
    backgroundColor: '#3B82F6',
  },
  noteContent: {
    flex: 1,
    padding: 16,
  },
  noteText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 22,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCloseButton: {
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalTextInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    flex: 1,
    padding: 0,
  },

  // Insights
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyInsights: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyInsightsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Meta Card
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  metaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    maxWidth: '60%',
    textAlign: 'right',
  },
});

export default MediaVaultEntryScreen;
