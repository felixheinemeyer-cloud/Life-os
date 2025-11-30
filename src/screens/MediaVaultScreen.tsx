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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// Mock Data - Newest entries first (appear at top of "All Videos")
const MOCK_MEDIA_ENTRIES: MediaEntry[] = [
  // Recent additions (mixed wildly)
  { id: '1', title: '5 Morning Habits for Energy', thumbnail: undefined, format: 'video', category: 'health', duration: '8:21' },
  { id: '2', title: 'Compound Interest Explained', thumbnail: undefined, format: 'short-video', category: 'finance', duration: '0:58' },
  { id: '3', title: 'Miyazaki on Creativity', thumbnail: undefined, format: 'audio', category: 'design', duration: '42:15' },
  { id: '4', title: 'Why You Self-Sabotage', thumbnail: undefined, format: 'thread', category: 'psychology' },
  { id: '5', title: 'Pierogi Recipe from Krakow', thumbnail: undefined, format: 'article', category: 'cooking' },
  { id: '6', title: 'The Art of Saying No', thumbnail: undefined, format: 'short-video', category: 'work', duration: '1:12' },
  { id: '7', title: 'Chopin Nocturne Tutorial', thumbnail: undefined, format: 'video', category: 'piano', duration: '24:30' },
  { id: '8', title: 'Huberman on Sleep', thumbnail: undefined, format: 'audio', category: 'health', duration: '2:15:00' },
  { id: '9', title: 'How NATO Actually Works', thumbnail: undefined, format: 'video', category: 'politics', duration: '18:44' },
  { id: '10', title: 'Japanese Travel Guide 2024', thumbnail: undefined, format: 'website', category: 'travel' },
  { id: '11', title: 'Anxious Attachment Deep Dive', thumbnail: undefined, format: 'video', category: 'love', duration: '32:10' },
  { id: '12', title: 'Polish Cases Simplified', thumbnail: undefined, format: 'article', category: 'polish' },
  { id: '13', title: 'Reframe Your Inner Critic', thumbnail: undefined, format: 'short-video', category: 'mindset', duration: '0:45' },
  { id: '14', title: 'Home Workout No Equipment', thumbnail: undefined, format: 'video', category: 'fitness', duration: '28:00' },
  { id: '15', title: 'Claude vs GPT-4 Comparison', thumbnail: undefined, format: 'thread', category: 'tech' },
  { id: '16', title: 'Viral Hook Frameworks', thumbnail: undefined, format: 'short-video', category: 'marketing', duration: '0:32' },
  { id: '17', title: 'Breath of Fire Technique', thumbnail: undefined, format: 'video', category: 'meditation', duration: '8:15' },
  { id: '18', title: 'How to Read a Contract', thumbnail: undefined, format: 'article', category: 'common-knowledge' },
  { id: '19', title: 'Second Brain with Notion', thumbnail: undefined, format: 'video', category: 'productivity', duration: '45:22' },
  { id: '20', title: 'Dzień dobry! Basic Greetings', thumbnail: undefined, format: 'short-video', category: 'polish', duration: '2:10' },
  { id: '21', title: 'Stock Market for Beginners', thumbnail: undefined, format: 'video', category: 'finance', duration: '22:15' },
  { id: '22', title: 'Alex Hormozi on Offers', thumbnail: undefined, format: 'audio', category: 'marketing', duration: '1:32:00' },
  { id: '23', title: 'Secure Attachment Habits', thumbnail: undefined, format: 'thread', category: 'love' },
  { id: '24', title: 'Cold Plunge Protocol', thumbnail: undefined, format: 'short-video', category: 'health', duration: '1:45' },
  { id: '25', title: 'Left Hand Independence Piano', thumbnail: undefined, format: 'video', category: 'piano', duration: '15:30' },
  { id: '26', title: 'Cognitive Biases Cheat Sheet', thumbnail: undefined, format: 'website', category: 'psychology' },
  { id: '27', title: 'One Pan Salmon Recipe', thumbnail: undefined, format: 'short-video', category: 'cooking', duration: '0:55' },
  { id: '28', title: 'Remote Work Best Practices', thumbnail: undefined, format: 'article', category: 'work' },
  { id: '29', title: 'Figma Auto Layout Mastery', thumbnail: undefined, format: 'video', category: 'design', duration: '34:18' },
  { id: '30', title: 'EU Elections Explained', thumbnail: undefined, format: 'video', category: 'politics', duration: '12:33' },
  { id: '31', title: 'Dopamine Detox Guide', thumbnail: undefined, format: 'thread', category: 'mindset' },
  { id: '32', title: 'HIIT vs Steady State Cardio', thumbnail: undefined, format: 'video', category: 'fitness', duration: '11:20' },
  { id: '33', title: 'Backpacking Southeast Asia', thumbnail: undefined, format: 'video', category: 'travel', duration: '25:44' },
  { id: '34', title: 'Body Scan Meditation', thumbnail: undefined, format: 'audio', category: 'meditation', duration: '15:00' },
  { id: '35', title: 'Tax Basics Everyone Needs', thumbnail: undefined, format: 'video', category: 'common-knowledge', duration: '19:08' },
  { id: '36', title: 'React vs Vue in 2024', thumbnail: undefined, format: 'article', category: 'tech' },
  { id: '37', title: 'Deep Work Summary', thumbnail: undefined, format: 'short-video', category: 'productivity', duration: '3:22' },
  { id: '38', title: 'Pasta Aglio e Olio', thumbnail: undefined, format: 'video', category: 'cooking', duration: '7:45' },
  { id: '39', title: 'Money Psychology Explained', thumbnail: undefined, format: 'video', category: 'finance', duration: '16:40' },
  { id: '40', title: 'Setting Healthy Boundaries', thumbnail: undefined, format: 'audio', category: 'love', duration: '28:15' },
  { id: '41', title: 'Typography Fundamentals', thumbnail: undefined, format: 'website', category: 'design' },
  { id: '42', title: 'Pull-Up Progression Guide', thumbnail: undefined, format: 'video', category: 'fitness', duration: '9:33' },
  { id: '43', title: 'Imposter Syndrome Thread', thumbnail: undefined, format: 'thread', category: 'psychology' },
  { id: '44', title: 'Polish Verb Conjugation', thumbnail: undefined, format: 'video', category: 'polish', duration: '18:22' },
  { id: '45', title: 'Salary Negotiation Script', thumbnail: undefined, format: 'article', category: 'work' },
  { id: '46', title: 'Jazz Piano Voicings', thumbnail: undefined, format: 'video', category: 'piano', duration: '21:10' },
  { id: '47', title: 'Loving Kindness Meditation', thumbnail: undefined, format: 'audio', category: 'meditation', duration: '12:00' },
  { id: '48', title: 'Content Repurposing Strategy', thumbnail: undefined, format: 'short-video', category: 'marketing', duration: '1:58' },
  { id: '49', title: 'Atomic Habits Key Takeaways', thumbnail: undefined, format: 'thread', category: 'mindset' },
  { id: '50', title: 'Budget Travel Europe Tips', thumbnail: undefined, format: 'website', category: 'travel' },
  { id: '51', title: 'Zone 2 Cardio Explained', thumbnail: undefined, format: 'video', category: 'health', duration: '14:12' },
  { id: '52', title: 'First Principles Thinking', thumbnail: undefined, format: 'article', category: 'productivity' },
  { id: '53', title: 'German Politics Overview', thumbnail: undefined, format: 'video', category: 'politics', duration: '22:05' },
  { id: '54', title: 'ETF Portfolio Strategy', thumbnail: undefined, format: 'video', category: 'finance', duration: '28:30' },
  { id: '55', title: 'Wrist Pain Prevention', thumbnail: undefined, format: 'short-video', category: 'common-knowledge', duration: '2:15' },
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

// Helper to get thumbnail icon based on format
// Play = media to watch/listen, Glasses = content to read
const getThumbnailIcon = (format: MediaEntry['format']): keyof typeof Ionicons.glyphMap => {
  switch (format) {
    case 'video':
    case 'short-video':
    case 'audio':
      return 'play';
    case 'article':
    case 'thread':
    case 'website':
      return 'glasses-outline';
    default:
      return 'play';
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
  const thumbnailIcon = getThumbnailIcon(entry.format);

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
            <Ionicons name={thumbnailIcon} size={20} color={category.color} />
          </LinearGradient>
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

  // State
  const [categories, setCategories] = useState<MediaCategory[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    acc[cat.id] = MOCK_MEDIA_ENTRIES.filter((entry) => entry.category === cat.id);
    return acc;
  }, {} as Record<string, MediaEntry[]>);

  // Entry counts per category
  const entryCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = entriesByCategory[cat.id].length;
    return acc;
  }, {} as Record<string, number>);

  // Check if there are any entries
  const hasEntries = MOCK_MEDIA_ENTRIES.length > 0;

  // Categories with entries (for rendering)
  const categoriesWithEntries = categories.filter(
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
    console.log('Entry pressed:', entry.title);
  };

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 }, // Safe area + header height + spacing
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scrollable Title */}
        {!isSearching && (
          <View style={styles.scrollableTitle}>
            <Text style={styles.title}>Media Vault</Text>
          </View>
        )}

        {hasEntries ? (
          <>
            {/* Category Overview - hidden during search */}
            {!isSearching && (
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
                <Text style={styles.videosSectionTitle}>
                  {searchQuery.trim()
                    ? `Results for "${searchQuery}"`
                    : selectedCategory
                      ? categories.find(c => c.id === selectedCategory)?.name
                      : 'All Videos'}
                </Text>
                <Text style={styles.videosSectionCount}>
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'video' : 'videos'}
                </Text>
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
              'rgba(247, 245, 242, 0.95)',
              'rgba(247, 245, 242, 0.85)',
              'rgba(247, 245, 242, 0.6)',
              'rgba(247, 245, 242, 0.3)',
              'rgba(247, 245, 242, 0.1)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.25, 0.5, 0.7, 0.85, 1]}
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
    paddingBottom: 65,
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
