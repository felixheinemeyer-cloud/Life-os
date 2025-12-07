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
  Image,
  TextInput,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMedia, MediaEntry } from '../context/MediaContext';

// Types
interface MediaVaultScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

// MediaEntry is imported from context

interface MediaCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightColor: string;
}

// Default Categories
const DEFAULT_CATEGORIES: MediaCategory[] = [
  { id: 'health', name: 'Health', icon: 'heart-outline', color: '#10B981', lightColor: '#D1FAE5' },
  { id: 'finance', name: 'Finance', icon: 'wallet-outline', color: '#F59E0B', lightColor: '#FEF3C7' },
  { id: 'love', name: 'Love', icon: 'rose-outline', color: '#EC4899', lightColor: '#FCE7F3' },
  { id: 'mindset', name: 'Mindset', icon: 'bulb-outline', color: '#8B5CF6', lightColor: '#EDE9FE' },
  { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#3B82F6', lightColor: '#DBEAFE' },
  { id: 'psychology', name: 'Psychology', icon: 'body-outline', color: '#6366F1', lightColor: '#E0E7FF' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone-outline', color: '#F97316', lightColor: '#FFEDD5' },
  { id: 'politics', name: 'Politics', icon: 'globe-outline', color: '#64748B', lightColor: '#F1F5F9' },
  { id: 'common-knowledge', name: 'Common Knowledge', icon: 'library-outline', color: '#0EA5E9', lightColor: '#E0F2FE' },
  { id: 'piano', name: 'Piano', icon: 'musical-note-outline', color: '#1F2937', lightColor: '#F3F4F6' },
  { id: 'polish', name: 'Polish', icon: 'language-outline', color: '#DC2626', lightColor: '#FEE2E2' },
  { id: 'cooking', name: 'Cooking', icon: 'restaurant-outline', color: '#EA580C', lightColor: '#FED7AA' },
  { id: 'fitness', name: 'Fitness', icon: 'barbell-outline', color: '#059669', lightColor: '#A7F3D0' },
  { id: 'meditation', name: 'Meditation', icon: 'leaf-outline', color: '#14B8A6', lightColor: '#CCFBF1' },
  { id: 'productivity', name: 'Productivity', icon: 'rocket-outline', color: '#7C3AED', lightColor: '#DDD6FE' },
  { id: 'tech', name: 'Tech', icon: 'hardware-chip-outline', color: '#2563EB', lightColor: '#BFDBFE' },
  { id: 'design', name: 'Design', icon: 'color-palette-outline', color: '#DB2777', lightColor: '#FBCFE8' },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#0891B2', lightColor: '#CFFAFE' },
];

// Colors for categories
const CATEGORY_COLORS = [
  '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6',
  '#6366F1', '#F97316', '#64748B', '#0EA5E9', '#DC2626',
  '#EA580C', '#059669', '#14B8A6', '#7C3AED', '#2563EB',
  '#DB2777', '#4B5563', '#0891B2', '#92400E', '#4F46E5',
];

// Neutral category for uncategorized entries (when category is deleted)
const UNCATEGORIZED_CATEGORY: MediaCategory = {
  id: 'uncategorized',
  name: 'Uncategorized',
  icon: 'folder-outline',
  color: '#9CA3AF',
  lightColor: '#F3F4F6',
};

// Media entries are now managed via MediaContext

// Helper to get format info
const getFormatInfo = (format: MediaEntry['format']): { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; bgColor: string } => {
  const neutralColor = '#6B7280';
  const neutralBg = '#F3F4F6';

  switch (format) {
    case 'video':
      return { icon: 'play-circle-outline', label: 'Video', color: neutralColor, bgColor: neutralBg };
    case 'short-video':
      return { icon: 'phone-portrait-outline', label: 'Short', color: neutralColor, bgColor: neutralBg };
    case 'audio':
      return { icon: 'headset-outline', label: 'Audio', color: neutralColor, bgColor: neutralBg };
    case 'article':
      return { icon: 'document-text-outline', label: 'Article', color: neutralColor, bgColor: neutralBg };
    case 'thread':
      return { icon: 'chatbubbles-outline', label: 'Thread', color: neutralColor, bgColor: neutralBg };
    case 'website':
      return { icon: 'globe-outline', label: 'Website', color: neutralColor, bgColor: neutralBg };
    default:
      return { icon: 'play-circle-outline', label: 'Video', color: neutralColor, bgColor: neutralBg };
  }
};

// Platform detection from URL - returns platform icon info or null if unknown
const getPlatformIcon = (sourceUrl?: string): { icon: string; iconLibrary?: 'entypo' } | null => {
  if (!sourceUrl) return null;

  const url = sourceUrl.toLowerCase();

  // Video platforms
  if (url.includes('youtube.com') || url.includes('youtu.be')) return { icon: 'logo-youtube' };
  if (url.includes('tiktok.com')) return { icon: 'logo-tiktok' };
  if (url.includes('vimeo.com')) return { icon: 'logo-vimeo' };
  if (url.includes('twitch.tv') || url.includes('twitch.com')) return { icon: 'logo-twitch' };

  // Social platforms
  if (url.includes('reddit.com') || url.includes('redd.it')) return { icon: 'logo-reddit' };
  if (url.includes('twitter.com') || url.includes('x.com')) return { icon: 'logo-twitter' };
  if (url.includes('instagram.com')) return { icon: 'logo-instagram' };
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) return { icon: 'logo-facebook' };
  if (url.includes('linkedin.com')) return { icon: 'logo-linkedin' };
  if (url.includes('threads.net')) return { icon: 'at-outline' }; // Meta Threads

  // Audio platforms
  if (url.includes('spotify.com') || url.includes('open.spotify.com')) return { icon: 'spotify', iconLibrary: 'entypo' };
  if (url.includes('soundcloud.com')) return { icon: 'logo-soundcloud' };
  if (url.includes('podcasts.apple.com') || url.includes('music.apple.com')) return { icon: 'logo-apple' };

  // Content platforms
  if (url.includes('medium.com')) return { icon: 'logo-medium' };
  if (url.includes('substack.com')) return { icon: 'mail-outline' };
  if (url.includes('notion.so') || url.includes('notion.site')) return { icon: 'document-text-outline' };

  // Dev/Design platforms
  if (url.includes('github.com')) return { icon: 'logo-github' };
  if (url.includes('dribbble.com')) return { icon: 'logo-dribbble' };
  if (url.includes('behance.net')) return { icon: 'logo-behance' };
  if (url.includes('figma.com')) return { icon: 'color-palette-outline' };

  // Other platforms
  if (url.includes('discord.com') || url.includes('discord.gg')) return { icon: 'logo-discord' };
  if (url.includes('pinterest.com') || url.includes('pin.it')) return { icon: 'logo-pinterest' };
  if (url.includes('snapchat.com')) return { icon: 'logo-snapchat' };
  if (url.includes('whatsapp.com')) return { icon: 'logo-whatsapp' };
  if (url.includes('telegram.org') || url.includes('t.me')) return { icon: 'paper-plane-outline' };

  // News/Media
  if (url.includes('nytimes.com') || url.includes('washingtonpost.com') || url.includes('theguardian.com')) return { icon: 'newspaper-outline' };

  return null; // Unknown platform
};

// Helper to get thumbnail icon based on format (fallback when no platform detected)
const getFormatIcon = (format: MediaEntry['format']): keyof typeof Ionicons.glyphMap => {
  switch (format) {
    case 'video':
    case 'short-video':
    case 'audio':
      return 'play';
    case 'article':
    case 'thread':
    case 'website':
      return 'reader-outline';
    default:
      return 'play';
  }
};

// Get thumbnail icon info - prioritizes platform icon, falls back to format icon
const getThumbnailIconInfo = (format: MediaEntry['format'], sourceUrl?: string): { icon: string; iconLibrary?: 'entypo' } => {
  const platformIcon = getPlatformIcon(sourceUrl);
  if (platformIcon) return platformIcon;
  return { icon: getFormatIcon(format) };
};

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
};

// Get YouTube thumbnail URL from video ID
const getYouTubeThumbnail = (url?: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  // Use hqdefault for good quality without requiring the video to have HD
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// Media Card Component - Horizontal card style like CRM cards
const MediaCard: React.FC<{
  entry: MediaEntry;
  category: MediaCategory;
  onPress: () => void;
  showCategoryBadge?: boolean;
  showWatchlistBadge?: boolean;
}> = ({ entry, category, onPress, showCategoryBadge = true, showWatchlistBadge = true }) => {
  const formatInfo = getFormatInfo(entry.format);
  const thumbnailIconInfo = getThumbnailIconInfo(entry.format, entry.sourceUrl);
  const youtubeThumbnail = getYouTubeThumbnail(entry.sourceUrl);
  const thumbnailUrl = entry.thumbnail || youtubeThumbnail;

  return (
    <TouchableOpacity style={styles.mediaCard} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: category.lightColor }]}>
            {thumbnailIconInfo.iconLibrary === 'entypo' ? (
              <Entypo name={thumbnailIconInfo.icon as keyof typeof Entypo.glyphMap} size={20} color={category.color} />
            ) : (
              <Ionicons name={thumbnailIconInfo.icon as keyof typeof Ionicons.glyphMap} size={20} color={category.color} />
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.mediaCardContent}>
        <Text style={styles.mediaTitle} numberOfLines={2}>
          {entry.title}
        </Text>
        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {/* Watchlist Badge */}
          {entry.isWatchLater && showWatchlistBadge && (
            <View style={styles.watchlistBadge}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
            </View>
          )}
          {/* Source Badge */}
          <View style={[styles.sourceBadge, { backgroundColor: formatInfo.bgColor }]}>
            <Ionicons name={formatInfo.icon} size={12} color={formatInfo.color} />
            <Text style={[styles.sourceBadgeText, { color: formatInfo.color }]}>{formatInfo.label}</Text>
          </View>
          {/* Category Badge - only shown when not filtering by category */}
          {showCategoryBadge && (
            <View style={styles.categoryBadge}>
              <View style={[styles.categoryBadgeDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryBadgeText}>{category.name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
};

// Category Section Component
const CategorySection: React.FC<{
  category: MediaCategory;
  entries: MediaEntry[];
  onSeeAll: () => void;
  onEntryPress: (entry: MediaEntry) => void;
  animatedStyle: any;
}> = ({ category, entries, onSeeAll, onEntryPress, animatedStyle }) => {
  if (entries.length === 0) return null;

  const displayEntries = entries.slice(0, 3);

  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{category.name}</Text>
          <View style={[styles.countBadge, { backgroundColor: category.lightColor }]}>
            <Text style={[styles.countText, { color: category.color }]}>{entries.length}</Text>
          </View>
        </View>
        {entries.length > 3 && (
          <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Media Cards */}
      <View style={styles.cardsContainer}>
        {displayEntries.map((entry) => (
          <MediaCard
            key={entry.id}
            entry={entry}
            category={category}
            onPress={() => onEntryPress(entry)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

// Category Overview Component - Collapsible grid with "Show more" option
const INITIAL_CATEGORIES_SHOWN = 8;

const CategoryOverview: React.FC<{
  categories: MediaCategory[];
  entryCounts: Record<string, number>;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onEditCategory: (category: MediaCategory) => void;
}> = ({ categories, entryCounts, selectedCategory, onSelectCategory, onEditCategory }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoriesWithEntries = categories.filter(cat => entryCounts[cat.id] > 0);

  const displayedCategories = isExpanded
    ? categoriesWithEntries
    : categoriesWithEntries.slice(0, INITIAL_CATEGORIES_SHOWN);

  const hiddenCount = categoriesWithEntries.length - INITIAL_CATEGORIES_SHOWN;
  const showExpandButton = categoriesWithEntries.length > INITIAL_CATEGORIES_SHOWN;

  const handleToggleExpand = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsExpanded(!isExpanded);
  };

  const handleChipPress = (categoryId: string) => {
    // If already selected, clear the filter; otherwise select this category
    if (selectedCategory === categoryId) {
      onSelectCategory(null);
    } else {
      onSelectCategory(categoryId);
    }
  };

  return (
    <View style={styles.categoryOverview}>
      <View style={styles.categoryOverviewHeader}>
        <Text style={styles.categoryOverviewTitle}>Categories</Text>
        {/* Clear filter button - prominent when filter is active */}
        {selectedCategory && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => onSelectCategory(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.clearFilterText}>Clear filter</Text>
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.categoryChipsContainer}>
        {displayedCategories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                isSelected && styles.categoryChipSelected,
              ]}
              onPress={() => handleChipPress(category.id)}
              onLongPress={() => onEditCategory(category)}
              delayLongPress={400}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryChipDot, { backgroundColor: category.color }]} />
              <Text
                style={[
                  styles.categoryChipName,
                  isSelected && styles.categoryChipNameSelected,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Show More / Show Less Button */}
        {showExpandButton && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={handleToggleExpand}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={14}
              color="#6B7280"
            />
            <Text style={styles.showMoreText}>
              {isExpanded ? 'Less' : `+${hiddenCount} more`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onAddPress: () => void }> = ({ onAddPress }) => {
  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="play-circle-outline" size={56} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyStateTitle}>No media saved yet</Text>
      <Text style={styles.emptyStateText}>
        Save videos, reels, and shorts that inspire you. They'll be organized by category automatically.
      </Text>
      <TouchableOpacity style={styles.emptyAddButton} onPress={onAddPress} activeOpacity={0.8}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyAddButtonText}>Add Media</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Component
const MediaVaultScreen: React.FC<MediaVaultScreenProps> = ({ navigation }) => {
  // Safe area insets for proper positioning
  const insets = useSafeAreaInsets();

  // Get media entries from context
  const { entries: mediaEntries } = useMedia();

  // State
  const [categories, setCategories] = useState<MediaCategory[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWatchlistFilter, setIsWatchlistFilter] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Category Modal state
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [previewColor, setPreviewColor] = useState(CATEGORY_COLORS[0]);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;

  // Group entries by category
  const entriesByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = mediaEntries.filter((entry) => entry.category === cat.id);
    return acc;
  }, {} as Record<string, MediaEntry[]>);

  // Entry counts per category
  const entryCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = entriesByCategory[cat.id].length;
    return acc;
  }, {} as Record<string, number>);

  // Check if there are any entries
  const hasEntries = mediaEntries.length > 0;

  // Categories with entries (for rendering)
  const categoriesWithEntries = categories.filter(
    (cat) => entriesByCategory[cat.id].length > 0
  );

  // Filtered entries based on selected category, search query, and watchlist filter
  const filteredEntries = mediaEntries.filter((entry) => {
    // Filter by watchlist if active
    if (isWatchlistFilter && !entry.isWatchLater) {
      return false;
    }
    // Filter by search query if searching
    if (searchQuery.trim()) {
      return entry.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // Filter by category if selected
    if (selectedCategory) {
      return entry.category === selectedCategory;
    }
    // Show all entries
    return true;
  });

  // Count of watchlist items
  const watchlistCount = mediaEntries.filter(entry => entry.isWatchLater).length;

  // Handler for category selection
  const handleSelectCategory = (categoryId: string | null) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
  };

  // Handler for watchlist filter toggle
  const handleWatchlistToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsWatchlistFilter(!isWatchlistFilter);
  };

  // Category edit handlers
  const handleEditCategory = (category: MediaCategory) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCategoryName(category.name);
    setPreviewColor(category.color);
    setIsEditMode(true);
    setEditingCategoryId(category.id);
    setIsCategoryModalVisible(true);
  };

  const handleSaveCategory = () => {
    const trimmedName = categoryName.trim();
    if (trimmedName.length === 0) return;

    if (isEditMode && editingCategoryId) {
      // Update existing category
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategoryId
            ? { ...cat, name: trimmedName, color: previewColor }
            : cat
        )
      );
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }

    setIsCategoryModalVisible(false);
    setCategoryName('');
    setIsEditMode(false);
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = () => {
    if (!editingCategoryId) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Remove category
    setCategories((prev) => prev.filter((cat) => cat.id !== editingCategoryId));

    // Deselect if this category was selected
    if (selectedCategory === editingCategoryId) {
      setSelectedCategory(null);
    }

    setIsCategoryModalVisible(false);
    setCategoryName('');
    setIsEditMode(false);
    setEditingCategoryId(null);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalVisible(false);
    setCategoryName('');
    setIsEditMode(false);
    setEditingCategoryId(null);
  };

  const handleChangePreviewColor = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Pick a random different color
    let newColor = previewColor;
    while (newColor === previewColor) {
      newColor = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
    }
    setPreviewColor(newColor);
  };

  // Search handlers
  const handleSearchPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSearching(true);
    setSelectedCategory(null); // Clear category filter when opening search
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      setSelectedCategory(null); // Clear category filter when typing
    }
  };

  const handleCloseSearch = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSearching(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleSearchPressIn = () => {
    Animated.spring(searchButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleSearchPressOut = () => {
    Animated.spring(searchButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  useEffect(() => {
    // Header animation
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
    ]).start();
  }, []);

  const handleAddPressIn = () => {
    Animated.spring(addButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleAddPressOut = () => {
    Animated.spring(addButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleAddEntry = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('MediaVaultNewEntry');
  };


  const handleEntryPress = (entry: MediaEntry) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('MediaVaultEntry', { entry });
  };

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64 }, // Safe area + header height + 16px spacing
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scrollable Title */}
        {!isSearching && (
          <View style={styles.scrollableTitle}>
            <Text style={styles.title}>Media Vault</Text>
          </View>
        )}

        {/* Search Bar - People Vault Style */}
        {!isSearching && (
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="#C4C4C4" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {hasEntries ? (
          <>
            {/* Category Overview - hidden during search */}
            {!isSearching && !searchQuery.trim() && (
              <CategoryOverview
                categories={categories}
                entryCounts={entryCounts}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                onEditCategory={handleEditCategory}
              />
            )}

            {/* Videos List */}
            <View style={styles.videosSection}>
              <View style={styles.videosSectionHeader}>
                <View style={styles.videosSectionTitleRow}>
                  <Text style={styles.videosSectionTitle}>
                    {searchQuery.trim()
                      ? `Results for "${searchQuery}"`
                      : selectedCategory
                        ? categories.find(c => c.id === selectedCategory)?.name
                        : isWatchlistFilter
                          ? 'Watchlist'
                          : 'All Videos'}
                  </Text>
                </View>
                {/* Watchlist Button */}
                {!searchQuery.trim() && (
                  <TouchableOpacity
                    style={[
                      styles.watchlistButton,
                      isWatchlistFilter && styles.watchlistButtonActive,
                    ]}
                    onPress={handleWatchlistToggle}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isWatchlistFilter ? 'time' : 'time-outline'}
                      size={15}
                      color={isWatchlistFilter ? '#FFFFFF' : '#1F2937'}
                    />
                    <Text
                      style={[
                        styles.watchlistButtonText,
                        isWatchlistFilter && styles.watchlistButtonTextActive,
                      ]}
                    >
                      Watchlist
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {filteredEntries.length > 0 ? (
                <View style={styles.cardsContainer}>
                  {filteredEntries.map((entry) => {
                    const category = categories.find(cat => cat.id === entry.category);
                    const displayCategory = category || UNCATEGORIZED_CATEGORY;
                    const showCategoryBadge = category && (!selectedCategory || searchQuery.trim().length > 0);
                    return (
                      <MediaCard
                        key={entry.id}
                        entry={entry}
                        category={displayCategory}
                        onPress={() => handleEntryPress(entry)}
                        showCategoryBadge={showCategoryBadge}
                        showWatchlistBadge={!isWatchlistFilter}
                      />
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.noResultsText}>No videos found</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <EmptyState onAddPress={handleAddEntry} />
        )}
      </ScrollView>

      {/* Fixed Header with Blur Background */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background - light veil effect */}
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

        {/* Header Content */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          {isSearching ? (
            /* Search Mode Header */
            <View style={styles.searchHeader}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={handleCloseSearch}
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Normal Header */
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleAddEntry}
                onPressIn={handleAddPressIn}
                onPressOut={handleAddPressOut}
              >
                <Animated.View style={[styles.headerButton, { transform: [{ scale: addButtonScale }] }]}>
                  <Ionicons name="add" size={24} color="#1F2937" />
                </Animated.View>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Category Edit Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseCategoryModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseCategoryModal}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={16}
              style={styles.modalKeyboardAvoid}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalContent}>
                  {/* Header with icon */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderRow}>
                      <View style={styles.modalIconCircle}>
                        <Ionicons name="folder-outline" size={22} color="#EC4899" />
                      </View>
                      <Text style={styles.modalTitle}>Edit Category</Text>
                      <TouchableOpacity
                        style={styles.modalDeleteButton}
                        onPress={handleDeleteCategory}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSubtitle}>Update the category name or color</Text>
                  </View>

                  {/* Input with color preview */}
                  <View style={styles.modalInputContainer}>
                    <TouchableOpacity
                      onPress={handleChangePreviewColor}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.modalColorDotTouchable}
                    >
                      <View style={[styles.modalColorDot, { backgroundColor: previewColor }]} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter category name"
                      placeholderTextColor="#9CA3AF"
                      value={categoryName}
                      onChangeText={setCategoryName}
                      autoFocus
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleSaveCategory}
                    />
                  </View>

                  {/* Buttons */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={handleCloseCategoryModal}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalButtonCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButtonSave,
                        categoryName.trim().length === 0 && styles.modalButtonSaveDisabled,
                      ]}
                      onPress={handleSaveCategory}
                      activeOpacity={0.7}
                      disabled={categoryName.trim().length === 0}
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={categoryName.trim().length === 0 ? '#9CA3AF' : '#FFFFFF'}
                        style={styles.modalButtonIcon}
                      />
                      <Text
                        style={[
                          styles.modalButtonSaveText,
                          categoryName.trim().length === 0 && styles.modalButtonSaveTextDisabled,
                        ]}
                      >
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
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
  headerButton: {
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
  // Search Mode Styles
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  searchResults: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  searchResultCategory: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  headerContent: {
    paddingHorizontal: 4,
  },
  scrollableTitle: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  // Search Bar - People Vault Style
  searchBarContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Category Overview
  categoryOverview: {
    marginBottom: 24,
  },
  categoryOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    minHeight: 28,
  },
  categoryOverviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  categoryChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryChipName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryChipNameSelected: {
    color: '#FFFFFF',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    gap: 6,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Videos Section
  videosSection: {
    marginBottom: 32,
  },
  videosSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  videosSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  videosSectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  videosSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  watchlistButtonActive: {
    backgroundColor: '#1F2937',
  },
  watchlistButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  watchlistButtonTextActive: {
    color: '#FFFFFF',
  },

  // Section
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 2,
  },

  // Cards Container
  cardsContainer: {
    gap: 10,
  },

  // Media Card
  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnailContainer: {
    width: 72,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaCardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  mediaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  watchlistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  watchlistBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  categoryBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  chevronContainer: {
    padding: 4,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EC4899',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 28,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '88%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalDeleteButton: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalColorDotTouchable: {
    padding: 6,
    marginLeft: -6,
    marginRight: 4,
  },
  modalColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalButtonDelete: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonSave: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSaveDisabled: {
    backgroundColor: '#E5E7EB',
  },
  modalButtonIcon: {
    marginRight: 4,
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonSaveTextDisabled: {
    color: '#9CA3AF',
  },
});

export default MediaVaultScreen;
