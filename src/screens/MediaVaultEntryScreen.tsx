import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

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

interface MediaEntry {
  id: string;
  title: string;
  thumbnail?: string;
  format: 'video' | 'short-video' | 'audio' | 'article' | 'thread' | 'website';
  category: string;
  duration?: string;
  sourceUrl?: string;
  notes?: string;
  insights?: string[];
  isCompleted?: boolean;
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

// Platform detection helper
const getPlatformInfo = (sourceUrl?: string): { icon: keyof typeof Ionicons.glyphMap; name: string } | null => {
  if (!sourceUrl) return null;
  const url = sourceUrl.toLowerCase();

  if (url.includes('youtube.com') || url.includes('youtu.be')) return { icon: 'logo-youtube', name: 'YouTube' };
  if (url.includes('tiktok.com')) return { icon: 'logo-tiktok', name: 'TikTok' };
  if (url.includes('vimeo.com')) return { icon: 'logo-vimeo', name: 'Vimeo' };
  if (url.includes('twitch.tv')) return { icon: 'logo-twitch', name: 'Twitch' };
  if (url.includes('reddit.com') || url.includes('redd.it')) return { icon: 'logo-reddit', name: 'Reddit' };
  if (url.includes('twitter.com') || url.includes('x.com')) return { icon: 'logo-twitter', name: 'X' };
  if (url.includes('instagram.com')) return { icon: 'logo-instagram', name: 'Instagram' };
  if (url.includes('spotify.com')) return { icon: 'musical-notes', name: 'Spotify' };
  if (url.includes('soundcloud.com')) return { icon: 'logo-soundcloud', name: 'SoundCloud' };
  if (url.includes('podcasts.apple.com')) return { icon: 'logo-apple', name: 'Apple Podcasts' };
  if (url.includes('medium.com')) return { icon: 'logo-medium', name: 'Medium' };
  if (url.includes('linkedin.com')) return { icon: 'logo-linkedin', name: 'LinkedIn' };
  if (url.includes('github.com')) return { icon: 'logo-github', name: 'GitHub' };
  if (url.includes('dribbble.com')) return { icon: 'logo-dribbble', name: 'Dribbble' };
  if (url.includes('pinterest.com')) return { icon: 'logo-pinterest', name: 'Pinterest' };
  if (url.includes('facebook.com')) return { icon: 'logo-facebook', name: 'Facebook' };
  if (url.includes('threads.net')) return { icon: 'at-outline', name: 'Threads' };
  if (url.includes('substack.com')) return { icon: 'mail-outline', name: 'Substack' };

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
    case 'website': return 'Read';
    default: return 'Open';
  }
};

const MediaVaultEntryScreen: React.FC<MediaVaultEntryScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { entry } = route.params;

  // Derived data
  const category = CATEGORIES[entry.category] || DEFAULT_CATEGORY;
  const platformInfo = getPlatformInfo(entry.sourceUrl);
  const formatInfo = getFormatInfo(entry.format);
  const actionVerb = getActionVerb(entry.format);

  // State
  const [isCompleted, setIsCompleted] = useState(entry.isCompleted || false);
  const [notes, setNotes] = useState(entry.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [insights, setInsights] = useState<string[]>(entry.insights || []);

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
    Alert.alert(
      'Options',
      undefined,
      [
        { text: 'Edit Entry', onPress: () => console.log('Edit') },
        { text: 'Share', onPress: () => console.log('Share') },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete') },
        { text: 'Cancel', style: 'cancel' },
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
          onPress: (text) => {
            if (text && text.trim()) {
              setInsights([...insights, text.trim()]);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleSaveNotes = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEditingNotes(false);
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Card */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: heroScale }],
            },
          ]}
        >
          <LinearGradient
            colors={[category.lightColor, category.color + '25']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Platform/Format Icon */}
            <View style={[styles.heroIconCircle, { shadowColor: category.color }]}>
              <Ionicons
                name={platformInfo?.icon || formatInfo.icon}
                size={44}
                color={category.color}
              />
            </View>

            {/* Status Badge */}
            {isCompleted && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.statusBadgeText}>Completed</Text>
              </View>
            )}

            {/* Duration Badge */}
            {entry.duration && (
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={12} color="#6B7280" />
                <Text style={styles.durationBadgeText}>{entry.duration}</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

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
            {/* Platform Badge */}
            {platformInfo && (
              <View style={[styles.metaBadge, { backgroundColor: category.lightColor }]}>
                <Ionicons name={platformInfo.icon} size={13} color={category.color} />
                <Text style={[styles.metaBadgeText, { color: category.color }]}>
                  {platformInfo.name}
                </Text>
              </View>
            )}

            {/* Format Badge */}
            <View style={styles.metaBadge}>
              <Ionicons name={formatInfo.icon} size={13} color="#6B7280" />
              <Text style={styles.metaBadgeText}>{formatInfo.label}</Text>
            </View>

            {/* Category Badge */}
            <View style={[styles.metaBadge, { backgroundColor: category.lightColor }]}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={[styles.metaBadgeText, { color: category.color }]}>
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
              style={[styles.primaryButton, { backgroundColor: category.color }]}
              onPress={handleOpenSource}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>{actionVerb}</Text>
            </TouchableOpacity>
          )}

        </Animated.View>

        {/* Notes Section */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="create-outline" size={18} color="#374151" />
              <Text style={styles.cardTitle}>My Notes</Text>
            </View>
            <TouchableOpacity
              onPress={isEditingNotes ? handleSaveNotes : () => setIsEditingNotes(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardAction, { color: category.color }]}>
                {isEditingNotes ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditingNotes ? (
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Write your thoughts, key moments, or reminders..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text style={[styles.notesText, !notes && styles.emptyText]}>
              {notes || 'No notes yet. Tap Edit to add your thoughts.'}
            </Text>
          )}
        </Animated.View>


        {/* Meta Info Card */}
        <Animated.View
          style={[
            styles.metaCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaLabel}>Added</Text>
            <Text style={styles.metaValue}>{entry.dateAdded || 'Today'}</Text>
          </View>
          {entry.sourceUrl && (
            <View style={styles.metaInfoRow}>
              <Text style={styles.metaLabel}>Source</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {getDomain(entry.sourceUrl)}
              </Text>
            </View>
          )}
          <View style={styles.metaInfoRow}>
            <Text style={styles.metaLabel}>Format</Text>
            <Text style={styles.metaValue}>{formatInfo.label}</Text>
          </View>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

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
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  heroGradient: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    color: '#10B981',
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
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
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

  // Actions Section
  actionsSection: {
    marginBottom: 20,
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    backgroundColor: '#ECFDF5',
  },
  completedButtonText: {
    color: '#10B981',
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

  // Notes
  notesInput: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    minHeight: 100,
  },
  notesText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  emptyText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
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
