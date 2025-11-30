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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Types
interface MediaVaultScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface MediaEntry {
  id: string;
  title: string;
  thumbnail?: string;
  format: 'video' | 'short-video' | 'audio' | 'article' | 'thread' | 'website';
  category: string;
  duration?: string;
}

interface MediaCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightColor: string;
}

// Categories
const MEDIA_CATEGORIES: MediaCategory[] = [
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
  { id: 'photography', name: 'Photography', icon: 'camera-outline', color: '#4B5563', lightColor: '#E5E7EB' },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#0891B2', lightColor: '#CFFAFE' },
  { id: 'history', name: 'History', icon: 'time-outline', color: '#92400E', lightColor: '#FDE68A' },
  { id: 'science', name: 'Science', icon: 'flask-outline', color: '#4F46E5', lightColor: '#C7D2FE' },
  { id: 'philosophy', name: 'Philosophy', icon: 'school-outline', color: '#7C2D12', lightColor: '#FFEDD5' },
  { id: 'art', name: 'Art', icon: 'brush-outline', color: '#BE185D', lightColor: '#FCE7F3' },
  { id: 'music', name: 'Music', icon: 'musical-notes-outline', color: '#9333EA', lightColor: '#F3E8FF' },
  { id: 'sports', name: 'Sports', icon: 'football-outline', color: '#16A34A', lightColor: '#BBF7D0' },
  { id: 'gaming', name: 'Gaming', icon: 'game-controller-outline', color: '#7C3AED', lightColor: '#EDE9FE' },
  { id: 'crypto', name: 'Crypto', icon: 'logo-bitcoin', color: '#F59E0B', lightColor: '#FEF3C7' },
  { id: 'real-estate', name: 'Real Estate', icon: 'home-outline', color: '#0D9488', lightColor: '#CCFBF1' },
  { id: 'parenting', name: 'Parenting', icon: 'people-outline', color: '#EC4899', lightColor: '#FCE7F3' },
  { id: 'spirituality', name: 'Spirituality', icon: 'sparkles-outline', color: '#8B5CF6', lightColor: '#EDE9FE' },
  { id: 'languages', name: 'Languages', icon: 'chatbubbles-outline', color: '#0EA5E9', lightColor: '#E0F2FE' },
  { id: 'writing', name: 'Writing', icon: 'pencil-outline', color: '#64748B', lightColor: '#F1F5F9' },
  { id: 'podcasts', name: 'Podcasts', icon: 'mic-outline', color: '#DC2626', lightColor: '#FEE2E2' },
  { id: 'interviews', name: 'Interviews', icon: 'people-circle-outline', color: '#2563EB', lightColor: '#DBEAFE' },
  { id: 'documentaries', name: 'Documentaries', icon: 'film-outline', color: '#1F2937', lightColor: '#F3F4F6' },
];

// Mock Data
const MOCK_MEDIA_ENTRIES: MediaEntry[] = [
  // Health
  { id: '1', title: '5 Morning Habits for Energy', thumbnail: undefined, format: 'video', category: 'health', duration: '8:21' },
  { id: '2', title: 'Meal Prep for Busy People', thumbnail: undefined, format: 'short-video', category: 'health', duration: '5:30' },
  { id: '3', title: 'Zone 2 Cardio Explained', thumbnail: undefined, format: 'video', category: 'health', duration: '14:12' },
  { id: '50', title: 'Sleep Optimization Guide', thumbnail: undefined, format: 'video', category: 'health', duration: '18:45' },
  { id: '51', title: 'Cold Plunge Benefits', thumbnail: undefined, format: 'short-video', category: 'health', duration: '3:22' },
  { id: '52', title: 'Intermittent Fasting 101', thumbnail: undefined, format: 'video', category: 'health', duration: '21:08' },
  { id: '53', title: 'Stretching Routine for Desk Workers', thumbnail: undefined, format: 'short-video', category: 'health', duration: '7:15' },
  { id: '54', title: 'Gut Health Explained', thumbnail: undefined, format: 'video', category: 'health', duration: '16:33' },
  { id: '55', title: 'Breathwork for Stress Relief', thumbnail: undefined, format: 'short-video', category: 'health', duration: '4:50' },
  // Finance
  { id: '4', title: 'How to Build Wealth in Your 20s', thumbnail: undefined, format: 'video', category: 'finance', duration: '12:34' },
  { id: '5', title: 'Investing 101', thumbnail: undefined, format: 'video', category: 'finance', duration: '22:15' },
  { id: '6', title: 'ETF vs Index Funds', thumbnail: undefined, format: 'short-video', category: 'finance', duration: '2:45' },
  // Love
  { id: '7', title: 'Attachment Styles Explained', thumbnail: undefined, format: 'short-video', category: 'love', duration: '3:45' },
  { id: '8', title: 'Setting Boundaries in Relationships', thumbnail: undefined, format: 'video', category: 'love', duration: '11:48' },
  // Mindset
  { id: '9', title: 'Stoic Mindset for Success', thumbnail: undefined, format: 'video', category: 'mindset', duration: '15:02' },
  { id: '10', title: 'How to Stay Disciplined', thumbnail: undefined, format: 'video', category: 'mindset', duration: '9:33' },
  // Work
  { id: '11', title: 'Networking Tips That Actually Work', thumbnail: undefined, format: 'short-video', category: 'work', duration: '4:12' },
  { id: '12', title: 'How to Negotiate Your Salary', thumbnail: undefined, format: 'video', category: 'work', duration: '18:45' },
  // Psychology
  { id: '13', title: 'Understanding Cognitive Biases', thumbnail: undefined, format: 'video', category: 'psychology', duration: '21:30' },
  { id: '14', title: 'The Psychology of Habits', thumbnail: undefined, format: 'video', category: 'psychology', duration: '16:22' },
  { id: '15', title: 'Dark Psychology Tactics to Avoid', thumbnail: undefined, format: 'short-video', category: 'psychology', duration: '4:55' },
  // Marketing
  { id: '16', title: 'Copywriting Fundamentals', thumbnail: undefined, format: 'video', category: 'marketing', duration: '25:10' },
  { id: '17', title: 'Hook Your Audience in 3 Seconds', thumbnail: undefined, format: 'short-video', category: 'marketing', duration: '1:30' },
  // Politics
  { id: '18', title: 'How the EU Actually Works', thumbnail: undefined, format: 'video', category: 'politics', duration: '32:15' },
  { id: '19', title: 'Geopolitics of Energy Explained', thumbnail: undefined, format: 'video', category: 'politics', duration: '28:44' },
  // Common Knowledge
  { id: '20', title: 'How Credit Scores Work', thumbnail: undefined, format: 'video', category: 'common-knowledge', duration: '10:22' },
  { id: '21', title: 'Basic Car Maintenance Everyone Should Know', thumbnail: undefined, format: 'video', category: 'common-knowledge', duration: '15:30' },
  // Piano
  { id: '22', title: 'Piano Chord Progressions for Beginners', thumbnail: undefined, format: 'video', category: 'piano', duration: '12:45' },
  { id: '23', title: 'How to Play River Flows in You', thumbnail: undefined, format: 'video', category: 'piano', duration: '18:20' },
  // Polish
  { id: '24', title: 'Polish Pronunciation Guide', thumbnail: undefined, format: 'video', category: 'polish', duration: '14:33' },
  { id: '25', title: '50 Most Common Polish Phrases', thumbnail: undefined, format: 'video', category: 'polish', duration: '22:10' },
  // Cooking
  { id: '26', title: 'Gordon Ramsay Knife Skills', thumbnail: undefined, format: 'video', category: 'cooking', duration: '8:45' },
  // Fitness
  { id: '27', title: 'Perfect Push-Up Form', thumbnail: undefined, format: 'video', category: 'fitness', duration: '6:12' },
  // Meditation
  { id: '28', title: '10-Minute Morning Meditation', thumbnail: undefined, format: 'video', category: 'meditation', duration: '10:00' },
  // Productivity
  { id: '29', title: 'Time Blocking Method', thumbnail: undefined, format: 'video', category: 'productivity', duration: '11:23' },
  // Tech
  { id: '30', title: 'AI Tools You Need to Know', thumbnail: undefined, format: 'video', category: 'tech', duration: '15:44' },
  // Design
  { id: '31', title: 'UI Design Principles', thumbnail: undefined, format: 'video', category: 'design', duration: '18:30' },
  // Photography
  { id: '32', title: 'iPhone Photography Tips', thumbnail: undefined, format: 'short-video', category: 'photography', duration: '2:15' },
  // Travel
  { id: '33', title: 'How to Travel Hack', thumbnail: undefined, format: 'video', category: 'travel', duration: '20:10' },
  // History
  { id: '34', title: 'Rise and Fall of Rome', thumbnail: undefined, format: 'video', category: 'history', duration: '45:22' },
  // Science
  { id: '35', title: 'Quantum Physics Explained Simply', thumbnail: undefined, format: 'video', category: 'science', duration: '12:08' },
  // Philosophy
  { id: '36', title: 'Intro to Stoicism', thumbnail: undefined, format: 'video', category: 'philosophy', duration: '16:45' },
  // Art
  { id: '37', title: 'Art History in 10 Minutes', thumbnail: undefined, format: 'video', category: 'art', duration: '10:33' },
  // Music
  { id: '38', title: 'Music Theory Basics', thumbnail: undefined, format: 'video', category: 'music', duration: '14:20' },
  // Sports
  { id: '39', title: 'Basketball Fundamentals', thumbnail: undefined, format: 'video', category: 'sports', duration: '9:15' },
  // Gaming
  { id: '40', title: 'Pro Gaming Setup Guide', thumbnail: undefined, format: 'video', category: 'gaming', duration: '13:40' },
  // Crypto
  { id: '41', title: 'Bitcoin Explained', thumbnail: undefined, format: 'video', category: 'crypto', duration: '18:55' },
  // Real Estate
  { id: '42', title: 'First Home Buying Guide', thumbnail: undefined, format: 'video', category: 'real-estate', duration: '22:30' },
  // Parenting
  { id: '43', title: 'Positive Parenting Tips', thumbnail: undefined, format: 'video', category: 'parenting', duration: '11:15' },
  // Spirituality
  { id: '44', title: 'Finding Inner Peace', thumbnail: undefined, format: 'video', category: 'spirituality', duration: '19:00' },
  // Languages
  { id: '45', title: 'Learn Spanish Fast', thumbnail: undefined, format: 'video', category: 'languages', duration: '25:10' },
  // Writing
  { id: '46', title: 'Copywriting That Converts', thumbnail: undefined, format: 'video', category: 'writing', duration: '17:22' },
  // Podcasts
  { id: '47', title: 'Best Podcasts of 2024', thumbnail: undefined, format: 'video', category: 'podcasts', duration: '8:45' },
  // Interviews
  { id: '48', title: 'Elon Musk Interview Highlights', thumbnail: undefined, format: 'video', category: 'interviews', duration: '32:00' },
  // Documentaries
  { id: '49', title: 'The Social Dilemma Summary', thumbnail: undefined, format: 'video', category: 'documentaries', duration: '15:30' },
];

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

// Media Card Component - Horizontal card style like CRM cards
const MediaCard: React.FC<{
  entry: MediaEntry;
  category: MediaCategory;
  onPress: () => void;
  showCategoryBadge?: boolean;
}> = ({ entry, category, onPress, showCategoryBadge = true }) => {
  const formatInfo = getFormatInfo(entry.format);

  return (
    <TouchableOpacity style={styles.mediaCard} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {entry.thumbnail ? (
          <Image source={{ uri: entry.thumbnail }} style={styles.thumbnail} />
        ) : (
          <LinearGradient
            colors={[category.lightColor, category.color + '20']}
            style={styles.thumbnailPlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="play" size={20} color={category.color} />
          </LinearGradient>
        )}
        {/* Duration badge */}
        {entry.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{entry.duration}</Text>
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
}> = ({ categories, entryCounts, selectedCategory, onSelectCategory }) => {
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
            style={styles.showMoreChip}
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
  // State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const addButtonScale = useRef(new Animated.Value(1)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;

  // Group entries by category
  const entriesByCategory = MEDIA_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = MOCK_MEDIA_ENTRIES.filter((entry) => entry.category === cat.id);
    return acc;
  }, {} as Record<string, MediaEntry[]>);

  // Entry counts per category
  const entryCounts = MEDIA_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = entriesByCategory[cat.id].length;
    return acc;
  }, {} as Record<string, number>);

  // Check if there are any entries
  const hasEntries = MOCK_MEDIA_ENTRIES.length > 0;

  // Categories with entries (for rendering)
  const categoriesWithEntries = MEDIA_CATEGORIES.filter(
    (cat) => entriesByCategory[cat.id].length > 0
  );

  // Filtered entries based on selected category and search query
  const filteredEntries = MOCK_MEDIA_ENTRIES.filter((entry) => {
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

  // Handler for category selection
  const handleSelectCategory = (categoryId: string | null) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
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
    console.log('Entry pressed:', entry.title);
  };

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
          {isSearching ? (
            /* Search Mode Header */
            <View style={styles.searchHeader}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Search videos..."
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
            <>
              <View style={styles.headerTop}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleSearchPress}
                    onPressIn={handleSearchPressIn}
                    onPressOut={handleSearchPressOut}
                  >
                    <Animated.View style={[styles.headerButton, { transform: [{ scale: searchButtonScale }] }]}>
                      <Ionicons name="search" size={22} color="#1F2937" />
                    </Animated.View>
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
              </View>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Media Vault</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {hasEntries ? (
            <>
              {/* Category Overview - hidden during search */}
              {!isSearching && (
                <CategoryOverview
                  categories={MEDIA_CATEGORIES}
                  entryCounts={entryCounts}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                />
              )}

              {/* Videos List */}
              <View style={styles.videosSection}>
                <View style={styles.videosSectionHeader}>
                  <Text style={styles.videosSectionTitle}>
                    {searchQuery.trim()
                      ? `Results for "${searchQuery}"`
                      : selectedCategory
                        ? MEDIA_CATEGORIES.find(c => c.id === selectedCategory)?.name
                        : 'All Videos'}
                  </Text>
                  <Text style={styles.videosSectionCount}>
                    {filteredEntries.length} {filteredEntries.length === 1 ? 'video' : 'videos'}
                  </Text>
                </View>
                {filteredEntries.length > 0 ? (
                  <View style={styles.cardsContainer}>
                    {filteredEntries.map((entry) => {
                      const category = MEDIA_CATEGORIES.find(cat => cat.id === entry.category);
                      if (!category) return null;
                      // Show category badge only when viewing all videos or searching
                      const showCategoryBadge = !selectedCategory || searchQuery.trim().length > 0;
                      return (
                        <MediaCard
                          key={entry.id}
                          entry={entry}
                          category={category}
                          onPress={() => handleEntryPress(entry)}
                          showCategoryBadge={showCategoryBadge}
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
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#1F2937',
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
  showMoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
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
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
});

export default MediaVaultScreen;
