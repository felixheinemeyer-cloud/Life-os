import React, { useEffect, useRef, useState } from 'react';
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
  Keyboard,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Types
interface KnowledgeVaultScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface KnowledgeTopic {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightColor: string;
  createdAt: string;
}

interface KnowledgeEntry {
  id: string;
  topicId: string;
  title: string;
  content: string;
  tags?: string[];
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock Topics
const MOCK_TOPICS: KnowledgeTopic[] = [
  { id: '1', name: 'Finance', icon: 'wallet-outline', color: '#10B981', lightColor: '#D1FAE5', createdAt: '2024-01-01' },
  { id: '2', name: 'Psychology', icon: 'body-outline', color: '#6366F1', lightColor: '#E0E7FF', createdAt: '2024-01-05' },
  { id: '3', name: 'Health', icon: 'heart-outline', color: '#EC4899', lightColor: '#FCE7F3', createdAt: '2024-01-10' },
  { id: '4', name: 'Productivity', icon: 'rocket-outline', color: '#8B5CF6', lightColor: '#EDE9FE', createdAt: '2024-01-15' },
  { id: '5', name: 'Technology', icon: 'hardware-chip-outline', color: '#3B82F6', lightColor: '#DBEAFE', createdAt: '2024-01-20' },
  { id: '6', name: 'Philosophy', icon: 'bulb-outline', color: '#F59E0B', lightColor: '#FEF3C7', createdAt: '2024-01-25' },
  { id: '7', name: 'Relationships', icon: 'people-outline', color: '#F43F5E', lightColor: '#FFE4E6', createdAt: '2024-02-01' },
  { id: '8', name: 'Business', icon: 'briefcase-outline', color: '#0EA5E9', lightColor: '#E0F2FE', createdAt: '2024-02-05' },
  { id: '9', name: 'Cooking', icon: 'restaurant-outline', color: '#F97316', lightColor: '#FFEDD5', createdAt: '2024-02-10' },
  { id: '10', name: 'Fitness', icon: 'fitness-outline', color: '#059669', lightColor: '#A7F3D0', createdAt: '2024-02-15' },
];

// Mock Entries
const MOCK_ENTRIES: KnowledgeEntry[] = [
  { id: '1', topicId: '1', title: 'Rule of 72', content: 'Divide 72 by interest rate to estimate doubling time.', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '2', topicId: '1', title: 'Dollar Cost Averaging', content: 'Invest fixed amounts regularly regardless of price.', createdAt: '2024-01-16', updatedAt: '2024-01-16' },
  { id: '3', topicId: '1', title: 'Emergency Fund', content: '3-6 months of expenses in liquid savings.', createdAt: '2024-01-17', updatedAt: '2024-01-17' },
  { id: '4', topicId: '2', title: 'Confirmation Bias', content: 'Tendency to seek info confirming existing beliefs.', createdAt: '2024-01-20', updatedAt: '2024-01-20' },
  { id: '5', topicId: '2', title: 'Dunning-Kruger Effect', content: 'Incompetent overestimate, experts underestimate ability.', createdAt: '2024-01-21', updatedAt: '2024-01-21' },
  { id: '6', topicId: '3', title: 'Sleep Hygiene', content: 'No screens 1hr before bed, consistent schedule.', createdAt: '2024-01-25', updatedAt: '2024-01-25' },
  { id: '7', topicId: '3', title: 'Hydration', content: '8 glasses of water daily, more with exercise.', createdAt: '2024-01-26', updatedAt: '2024-01-26' },
  { id: '8', topicId: '4', title: '80/20 Rule', content: '80% of results come from 20% of efforts.', createdAt: '2024-02-01', updatedAt: '2024-02-01' },
  { id: '9', topicId: '4', title: 'Time Blocking', content: 'Schedule specific tasks in dedicated time slots.', createdAt: '2024-02-02', updatedAt: '2024-02-02' },
  { id: '10', topicId: '5', title: 'API Design', content: 'REST principles: stateless, resource-based URLs.', createdAt: '2024-02-05', updatedAt: '2024-02-05' },
  { id: '11', topicId: '6', title: 'Stoic Dichotomy', content: 'Focus only on what you can control.', createdAt: '2024-02-10', updatedAt: '2024-02-10' },
  { id: '12', topicId: '7', title: 'Active Listening', content: 'Full attention, no interrupting, reflect back.', createdAt: '2024-02-15', updatedAt: '2024-02-15' },
  { id: '13', topicId: '8', title: 'Value Proposition', content: 'Clear statement of benefit to customer.', createdAt: '2024-02-20', updatedAt: '2024-02-20' },
  { id: '14', topicId: '9', title: 'Mise en Place', content: 'Prepare all ingredients before cooking starts.', createdAt: '2024-02-25', updatedAt: '2024-02-25' },
  { id: '15', topicId: '10', title: 'Progressive Overload', content: 'Gradually increase weight/reps over time.', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
];

// Consistent teal color for all topic card icons (matches KnowledgeHubScreen Knowledge card)
const TOPIC_ICON_COLOR = '#06B6D4';

// Icon categories for the picker
const ICON_CATEGORIES: { name: string; icons: (keyof typeof Ionicons.glyphMap)[] }[] = [
  {
    name: 'Popular',
    icons: [
      'bookmark-outline', 'book-outline', 'bulb-outline', 'star-outline',
      'folder-outline', 'document-text-outline', 'heart-outline', 'flag-outline',
    ],
  },
  {
    name: 'Learning',
    icons: [
      'school-outline', 'library-outline', 'reader-outline', 'newspaper-outline',
      'language-outline', 'pencil-outline', 'create-outline', 'glasses-outline',
    ],
  },
  {
    name: 'Mind & Growth',
    icons: [
      'body-outline', 'happy-outline', 'sparkles-outline', 'rocket-outline',
      'fitness-outline', 'leaf-outline', 'sunny-outline', 'rose-outline',
    ],
  },
  {
    name: 'Finance',
    icons: [
      'wallet-outline', 'cash-outline', 'card-outline', 'trending-up-outline',
      'stats-chart-outline', 'pie-chart-outline', 'calculator-outline', 'diamond-outline',
    ],
  },
  {
    name: 'Career',
    icons: [
      'briefcase-outline', 'business-outline', 'people-outline', 'podium-outline',
      'trophy-outline', 'ribbon-outline', 'megaphone-outline', 'chatbubbles-outline',
    ],
  },
  {
    name: 'Technology',
    icons: [
      'hardware-chip-outline', 'code-slash-outline', 'terminal-outline', 'laptop-outline',
      'cloud-outline', 'server-outline', 'globe-outline', 'analytics-outline',
    ],
  },
  {
    name: 'Science',
    icons: [
      'flask-outline', 'planet-outline', 'telescope-outline', 'nuclear-outline',
      'prism-outline', 'magnet-outline', 'thermometer-outline', 'earth-outline',
    ],
  },
  {
    name: 'Health',
    icons: [
      'medkit-outline', 'nutrition-outline', 'pulse-outline', 'medical-outline',
      'barbell-outline', 'bicycle-outline', 'walk-outline', 'water-outline',
    ],
  },
  {
    name: 'Creative',
    icons: [
      'brush-outline', 'color-palette-outline', 'camera-outline', 'musical-notes-outline',
      'film-outline', 'mic-outline', 'easel-outline', 'videocam-outline',
    ],
  },
  {
    name: 'Relationships',
    icons: [
      'person-outline', 'chatbubble-outline', 'mail-outline', 'call-outline',
      'home-outline', 'hand-left-outline', 'gift-outline', 'paw-outline',
    ],
  },
  {
    name: 'Planning',
    icons: [
      'calendar-outline', 'time-outline', 'alarm-outline', 'hourglass-outline',
      'timer-outline', 'checkbox-outline', 'list-outline', 'clipboard-outline',
    ],
  },
  {
    name: 'Travel & Culture',
    icons: [
      'airplane-outline', 'map-outline', 'compass-outline', 'location-outline',
      'restaurant-outline', 'cafe-outline', 'bed-outline', 'trail-sign-outline',
    ],
  },
  {
    name: 'Ideas & Concepts',
    icons: [
      'infinite-outline', 'extension-puzzle-outline', 'cube-outline', 'git-branch-outline',
      'layers-outline', 'options-outline', 'shuffle-outline', 'aperture-outline',
    ],
  },
  {
    name: 'Security & Legal',
    icons: [
      'shield-outline', 'lock-closed-outline', 'key-outline', 'finger-print-outline',
      'document-outline', 'receipt-outline', 'construct-outline', 'settings-outline',
    ],
  },
  {
    name: 'Food',
    icons: [
      'restaurant-outline', 'cafe-outline', 'wine-outline', 'pizza-outline',
      'fast-food-outline', 'beer-outline', 'ice-cream-outline', 'nutrition-outline',
    ],
  },
  {
    name: 'Sports',
    icons: [
      'basketball-outline', 'football-outline', 'golf-outline', 'game-controller-outline',
      'trophy-outline', 'medal-outline', 'tennisball-outline', 'american-football-outline',
    ],
  },
];

// Flatten all icons for search
const ALL_ICONS = ICON_CATEGORIES.flatMap(cat => cat.icons);
const UNIQUE_ICONS = [...new Set(ALL_ICONS)];

// Add Topic Modal Component with full icon picker
const AddTopicModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, icon: keyof typeof Ionicons.glyphMap) => void;
}> = ({ visible, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const [topicName, setTopicName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('bookmark-outline');
  const [iconSearch, setIconSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setTopicName('');
      setSelectedIcon('bookmark-outline');
      setIconSearch('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    if (topicName.trim()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSave(topicName.trim(), selectedIcon);
      Keyboard.dismiss();
    }
  };

  const handleIconSelect = (icon: keyof typeof Ionicons.glyphMap) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIcon(icon);
  };

  const isValid = topicName.trim().length > 0;

  // Filter icons based on search
  const filteredCategories = iconSearch.trim()
    ? [{
        name: 'Search Results',
        icons: UNIQUE_ICONS.filter(icon =>
          icon.toLowerCase().includes(iconSearch.toLowerCase().replace(/\s+/g, '-'))
        ),
      }]
    : ICON_CATEGORIES;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.addTopicContainer, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.addTopicHeader}>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.roundButton}>
            <Ionicons name="close" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Topic</Text>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={!isValid}
            style={[styles.roundButton, !isValid && styles.roundButtonDisabled]}
          >
            <Ionicons
              name="checkmark"
              size={20}
              color={isValid ? "#1F2937" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.addTopicScroll}
          contentContainerStyle={styles.addTopicScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <View style={styles.previewSection}>
            <View style={styles.previewCard}>
              <View style={styles.previewIconCircle}>
                <Ionicons name={selectedIcon} size={24} color={TOPIC_ICON_COLOR} />
              </View>
              <Text style={styles.previewName} numberOfLines={1}>
                {topicName.trim() || 'Topic name'}
              </Text>
              <Text style={styles.previewCount}>0 entries</Text>
            </View>
          </View>

          {/* Topic Name Input */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Topic Name</Text>
            <TextInput
              ref={inputRef}
              style={styles.topicNameInput}
              placeholder="Enter topic name..."
              placeholderTextColor="#9CA3AF"
              value={topicName}
              onChangeText={setTopicName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />
          </View>

          {/* Icon Picker */}
          <View style={styles.iconPickerCard}>
            <Text style={styles.inputLabel}>Choose Icon</Text>

            {/* Icon Search */}
            <View style={styles.iconSearchContainer}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.iconSearchInput}
                placeholder="Search icons..."
                placeholderTextColor="#9CA3AF"
                value={iconSearch}
                onChangeText={setIconSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {iconSearch.length > 0 && (
                <TouchableOpacity onPress={() => setIconSearch('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Icon Categories */}
            {filteredCategories.map((category) => (
              <View key={category.name} style={styles.iconCategory}>
                <Text style={styles.iconCategoryTitle}>{category.name}</Text>
                <View style={styles.iconGrid}>
                  {category.icons.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconItem,
                        selectedIcon === icon && styles.iconItemSelected,
                      ]}
                      onPress={() => handleIconSelect(icon)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icon}
                        size={24}
                        color={selectedIcon === icon ? TOPIC_ICON_COLOR : '#6B7280'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {filteredCategories[0]?.icons.length === 0 && (
              <View style={styles.noIconsFound}>
                <Ionicons name="search-outline" size={32} color="#D1D5DB" />
                <Text style={styles.noIconsText}>No icons found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Topic Card Component - Uses icons for visual identity
const TopicCard: React.FC<{
  topic: KnowledgeTopic;
  entryCount: number;
  onPress: () => void;
}> = ({ topic, entryCount, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.topicCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.topicIconCircle}>
          <Ionicons name={topic.icon} size={24} color={TOPIC_ICON_COLOR} />
        </View>
        <Text style={styles.topicName} numberOfLines={2}>{topic.name}</Text>
        <Text style={styles.topicEntryCount}>
          {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onAddPress: () => void }> = ({ onAddPress }) => {
  return (
    <View style={styles.emptyStateContainer}>
      <LinearGradient
        colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
        style={styles.emptyStateCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.emptyIconCircle}>
          <Ionicons name="bulb" size={48} color="#6366F1" />
        </View>
        <Text style={styles.emptyStateTitle}>No topics yet</Text>
        <Text style={styles.emptyStateText}>
          Create your first topic to start organizing your knowledge
        </Text>
      </LinearGradient>

      <TouchableOpacity
        style={styles.emptyAddButton}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyAddButtonText}>Create Topic</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Component
const KnowledgeVaultScreen: React.FC<KnowledgeVaultScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // State
  const [topics, setTopics] = useState<KnowledgeTopic[]>(MOCK_TOPICS);
  const [entries, setEntries] = useState<KnowledgeEntry[]>(MOCK_ENTRIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const addButtonScale = useRef(new Animated.Value(1)).current;

  // Computed values
  const entryCounts = topics.reduce((acc, topic) => {
    acc[topic.id] = entries.filter(e => e.topicId === topic.id).length;
    return acc;
  }, {} as Record<string, number>);

  const totalEntries = entries.length;

  // Sort topics alphabetically A-Z
  const sortedTopics = [...topics].sort((a, b) => a.name.localeCompare(b.name));

  // Filtered topics based on search
  const filteredTopics = searchQuery.trim()
    ? sortedTopics.filter(topic =>
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedTopics;

  // Animations
  useEffect(() => {
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

  // Handlers
  const handleAddTopic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsAddModalVisible(true);
  };

  const handleSaveNewTopic = (name: string, icon: keyof typeof Ionicons.glyphMap) => {
    const newTopic: KnowledgeTopic = {
      id: Date.now().toString(),
      name,
      icon,
      color: TOPIC_ICON_COLOR,
      lightColor: '#F3F4F6',
      createdAt: new Date().toISOString(),
    };
    setTopics(prev => [...prev, newTopic]);
    setIsAddModalVisible(false);
  };

  const handleTopicPress = (topic: KnowledgeTopic) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const topicEntries = entries.filter(e => e.topicId === topic.id);
    navigation.navigate('KnowledgeTopic', {
      topic,
      entries: topicEntries,
    });
  };

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

  return (
    <View style={styles.container}>
      {/* ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scrollable Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Knowledge Vault</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
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

        {topics.length > 0 ? (
          <>
            {/* Topics Section */}
            <View style={styles.topicsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Topics</Text>
              </View>

              {filteredTopics.length > 0 ? (
                <View style={styles.topicsGrid}>
                  {filteredTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      entryCount={entryCounts[topic.id] || 0}
                      onPress={() => handleTopicPress(topic)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.noResultsText}>No topics found</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <EmptyState onAddPress={handleAddTopic} />
        )}
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background */}
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
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleAddTopic}
              onPressIn={handleAddPressIn}
              onPressOut={handleAddPressOut}
            >
              <Animated.View style={[styles.headerButton, { transform: [{ scale: addButtonScale }] }]}>
                <Ionicons name="add" size={24} color="#1F2937" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Add Topic Modal */}
      <AddTopicModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSave={handleSaveNewTopic}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Header
  headerContainer: {
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
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    height: 120,
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

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Title Section
  titleSection: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Search Bar
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

  // Topics Section
  topicsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  topicCountBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topicCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Topics Grid
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  topicCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topicIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  topicEntryCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // No Results
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

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyStateCard: {
    width: '100%',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: TOPIC_ICON_COLOR,
  },
  modalSaveTextDisabled: {
    color: '#D1D5DB',
  },
  modalInputSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalInputSimple: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  previewCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  previewCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Add Topic Modal Styles
  addTopicContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  addTopicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addTopicHeaderBtn: {
    minWidth: 60,
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
  addTopicScroll: {
    flex: 1,
  },
  addTopicScrollContent: {
    paddingBottom: 40,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  topicNameInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  iconPickerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  iconSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    padding: 0,
  },
  iconCategory: {
    marginBottom: 20,
  },
  iconCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconItemSelected: {
    backgroundColor: '#CFFAFE',
    borderWidth: 2,
    borderColor: TOPIC_ICON_COLOR,
  },
  noIconsFound: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noIconsText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});

export default KnowledgeVaultScreen;
