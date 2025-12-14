import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

// Types
interface DateIdeasListScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
}

interface DateIdea {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  duration: string;
  budget: 'free' | 'low' | 'medium' | 'high';
  isCustom?: boolean;
  createdAt?: string;
}

const CUSTOM_IDEAS_STORAGE_KEY = '@custom_date_ideas';

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

// Categories
const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: 'sparkles-outline', color: '#6B7280' },
  { id: 'my-ideas', name: 'My Ideas', icon: 'person-outline', color: '#BE123C' },
  { id: 'romantic', name: 'Romantic', icon: 'heart-outline', color: '#E11D48' },
  { id: 'adventure', name: 'Adventure', icon: 'compass-outline', color: '#0891B2' },
  { id: 'creative', name: 'Creative', icon: 'color-palette-outline', color: '#7C3AED' },
  { id: 'food', name: 'Food & Drink', icon: 'restaurant-outline', color: '#F59E0B' },
  { id: 'outdoor', name: 'Outdoors', icon: 'leaf-outline', color: '#10B981' },
  { id: 'entertainment', name: 'Fun', icon: 'film-outline', color: '#EC4899' },
  { id: 'active', name: 'Active', icon: 'fitness-outline', color: '#3B82F6' },
  { id: 'cozy', name: 'Cozy', icon: 'home-outline', color: '#92400E' },
  { id: 'cultural', name: 'Cultural', icon: 'library-outline', color: '#6366F1' },
];

// Date Ideas Data
const DATE_IDEAS: DateIdea[] = [
  // Romantic
  { id: '1', title: 'Sunset Picnic', description: 'Wine, cheese, and a beautiful view', icon: 'sunny-outline', category: 'romantic', duration: '2-3h', budget: 'low' },
  { id: '2', title: 'Stargazing', description: 'Blankets, hot cocoa, and stars', icon: 'moon-outline', category: 'romantic', duration: '2-4h', budget: 'free' },
  { id: '3', title: 'Candlelit Dinner', description: 'Cook together at home', icon: 'flame-outline', category: 'romantic', duration: '3h', budget: 'medium' },
  { id: '4', title: 'Love Letters', description: 'Write and exchange heartfelt notes', icon: 'mail-outline', category: 'romantic', duration: '1-2h', budget: 'free' },
  { id: '5', title: 'Sunrise Breakfast', description: 'Early morning magic', icon: 'partly-sunny-outline', category: 'romantic', duration: '2h', budget: 'low' },

  // Adventure
  { id: '6', title: 'Hiking Trail', description: 'Explore nature together', icon: 'walk-outline', category: 'adventure', duration: '3-5h', budget: 'free' },
  { id: '7', title: 'Kayaking', description: 'Paddle on calm waters', icon: 'boat-outline', category: 'adventure', duration: '2-3h', budget: 'medium' },
  { id: '8', title: 'Rock Climbing', description: 'Indoor climbing adventure', icon: 'trending-up-outline', category: 'adventure', duration: '2-3h', budget: 'medium' },
  { id: '9', title: 'Hot Air Balloon', description: 'Float above the world', icon: 'airplane-outline', category: 'adventure', duration: '3-4h', budget: 'high' },
  { id: '10', title: 'Road Trip', description: 'Spontaneous adventure', icon: 'car-outline', category: 'adventure', duration: 'Full day', budget: 'medium' },

  // Creative
  { id: '11', title: 'Pottery Class', description: 'Get your hands dirty', icon: 'color-filter-outline', category: 'creative', duration: '2-3h', budget: 'medium' },
  { id: '12', title: 'Paint & Sip', description: 'Art with wine', icon: 'brush-outline', category: 'creative', duration: '2-3h', budget: 'medium' },
  { id: '13', title: 'Photo Walk', description: 'Capture moments together', icon: 'camera-outline', category: 'creative', duration: '2-3h', budget: 'free' },
  { id: '14', title: 'DIY Crafts', description: 'Make something together', icon: 'construct-outline', category: 'creative', duration: '2-3h', budget: 'low' },
  { id: '15', title: 'Music Jam', description: 'Play and sing together', icon: 'musical-notes-outline', category: 'creative', duration: '1-2h', budget: 'free' },

  // Food & Drink
  { id: '16', title: 'Cooking Class', description: 'Learn a new cuisine', icon: 'restaurant-outline', category: 'food', duration: '2-3h', budget: 'medium' },
  { id: '17', title: 'Wine Tasting', description: 'Sample and savor', icon: 'wine-outline', category: 'food', duration: '2-3h', budget: 'medium' },
  { id: '18', title: 'Food Tour', description: 'Taste the city', icon: 'fast-food-outline', category: 'food', duration: '3-4h', budget: 'medium' },
  { id: '19', title: 'Farmers Market', description: 'Fresh finds and good vibes', icon: 'nutrition-outline', category: 'food', duration: '2h', budget: 'low' },
  { id: '20', title: 'Coffee Hopping', description: 'Find your favorite spot', icon: 'cafe-outline', category: 'food', duration: '2-3h', budget: 'low' },
  { id: '21', title: 'Baking Together', description: 'Sweet treats from scratch', icon: 'heart-outline', category: 'food', duration: '2-3h', budget: 'low' },

  // Outdoor
  { id: '22', title: 'Beach Day', description: 'Sun, sand, and waves', icon: 'sunny-outline', category: 'outdoor', duration: 'Full day', budget: 'free' },
  { id: '23', title: 'Botanical Garden', description: 'Wander through blooms', icon: 'flower-outline', category: 'outdoor', duration: '2-3h', budget: 'low' },
  { id: '24', title: 'Bike Ride', description: 'Explore on two wheels', icon: 'bicycle-outline', category: 'outdoor', duration: '2-3h', budget: 'low' },
  { id: '25', title: 'Camping', description: 'Under the stars', icon: 'bonfire-outline', category: 'outdoor', duration: 'Overnight', budget: 'low' },
  { id: '26', title: 'Park Picnic', description: 'Simple and sweet', icon: 'leaf-outline', category: 'outdoor', duration: '2h', budget: 'free' },

  // Entertainment
  { id: '27', title: 'Movie Night', description: 'Cozy cinema at home', icon: 'film-outline', category: 'entertainment', duration: '3h', budget: 'low' },
  { id: '28', title: 'Comedy Show', description: 'Laugh together', icon: 'happy-outline', category: 'entertainment', duration: '2-3h', budget: 'medium' },
  { id: '29', title: 'Escape Room', description: 'Solve puzzles together', icon: 'key-outline', category: 'entertainment', duration: '1-2h', budget: 'medium' },
  { id: '30', title: 'Live Concert', description: 'Music and memories', icon: 'musical-note-outline', category: 'entertainment', duration: '3-4h', budget: 'high' },
  { id: '31', title: 'Karaoke', description: 'Sing your hearts out', icon: 'mic-outline', category: 'entertainment', duration: '2-3h', budget: 'low' },
  { id: '32', title: 'Drive-In Movie', description: 'Nostalgic vibes', icon: 'car-sport-outline', category: 'entertainment', duration: '2-3h', budget: 'low' },

  // Active
  { id: '33', title: 'Dance Class', description: 'Learn to move together', icon: 'body-outline', category: 'active', duration: '1-2h', budget: 'medium' },
  { id: '34', title: 'Mini Golf', description: 'Playful competition', icon: 'golf-outline', category: 'active', duration: '1-2h', budget: 'low' },
  { id: '35', title: 'Bowling', description: 'Strikes and spares', icon: 'bowling-ball-outline', category: 'active', duration: '2h', budget: 'low' },
  { id: '36', title: 'Tennis', description: 'Friendly match', icon: 'tennisball-outline', category: 'active', duration: '1-2h', budget: 'free' },
  { id: '37', title: 'Ice Skating', description: 'Glide hand in hand', icon: 'snow-outline', category: 'active', duration: '2h', budget: 'low' },
  { id: '38', title: 'Yoga Together', description: 'Stretch and breathe', icon: 'fitness-outline', category: 'active', duration: '1h', budget: 'free' },

  // Cozy
  { id: '39', title: 'Game Night', description: 'Board games and fun', icon: 'game-controller-outline', category: 'cozy', duration: '2-3h', budget: 'free' },
  { id: '40', title: 'Book Club', description: 'Read and discuss', icon: 'book-outline', category: 'cozy', duration: 'Ongoing', budget: 'low' },
  { id: '41', title: 'Spa Night', description: 'Pamper at home', icon: 'sparkles-outline', category: 'cozy', duration: '2-3h', budget: 'low' },
  { id: '42', title: 'Puzzle Night', description: 'Piece by piece', icon: 'extension-puzzle-outline', category: 'cozy', duration: '2-3h', budget: 'low' },
  { id: '43', title: 'Blanket Fort', description: 'Childhood magic', icon: 'bed-outline', category: 'cozy', duration: '3h', budget: 'free' },
  { id: '44', title: 'Cook Together', description: 'New recipe adventure', icon: 'flame-outline', category: 'cozy', duration: '2h', budget: 'low' },

  // Cultural
  { id: '45', title: 'Museum Visit', description: 'Art and history', icon: 'business-outline', category: 'cultural', duration: '2-3h', budget: 'low' },
  { id: '46', title: 'Art Gallery', description: 'Discover new artists', icon: 'image-outline', category: 'cultural', duration: '1-2h', budget: 'free' },
  { id: '47', title: 'Theater Show', description: 'Live performance magic', icon: 'ticket-outline', category: 'cultural', duration: '3h', budget: 'high' },
  { id: '48', title: 'History Tour', description: 'Explore your city', icon: 'map-outline', category: 'cultural', duration: '2-3h', budget: 'low' },
  { id: '49', title: 'Language Date', description: 'Learn together', icon: 'language-outline', category: 'cultural', duration: '1-2h', budget: 'free' },
  { id: '50', title: 'Festival', description: 'Culture and celebration', icon: 'globe-outline', category: 'cultural', duration: '3-4h', budget: 'low' },
];

// Budget display helper
const getBudgetDisplay = (budget: DateIdea['budget']): string => {
  switch (budget) {
    case 'free': return 'Free';
    case 'low': return '$';
    case 'medium': return '$$';
    case 'high': return '$$$';
    default: return '$';
  }
};

// Category Chip Component
const CategoryChip: React.FC<{
  category: Category;
  isSelected: boolean;
  onPress: () => void;
}> = ({ category, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        isSelected && styles.categoryChipSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.categoryChipText,
          isSelected && styles.categoryChipTextSelected,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

// Date Idea Card Component - Clean grid card
const DateIdeaCard: React.FC<{
  idea: DateIdea;
  onPress: () => void;
}> = ({ idea, onPress }) => {
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
      style={styles.cardTouchable}
    >
      <Animated.View style={[styles.ideaCard, { transform: [{ scale: scaleAnim }] }]}>
        {/* Icon */}
        <View style={[styles.ideaIconContainer, { backgroundColor: '#FFF1F2' }]}>
          <Ionicons
            name={idea.icon}
            size={20}
            color="#E11D48"
          />
        </View>

        {/* Content wrapper for flex layout */}
        <View style={styles.ideaCardContent}>
          {/* Title */}
          <Text style={styles.ideaTitle} numberOfLines={2}>
            {idea.title}
          </Text>

          {/* Bottom row: Duration & Budget */}
          <View style={styles.ideaFooter}>
            <Text style={styles.ideaDuration}>{idea.duration}</Text>
            <Text style={[
              styles.ideaBudget,
              idea.budget === 'free' && styles.ideaBudgetFree
            ]}>
              {getBudgetDisplay(idea.budget)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Main Component
const DateIdeasListScreen: React.FC<DateIdeasListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customIdeas, setCustomIdeas] = useState<DateIdea[]>([]);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  // Load custom ideas from AsyncStorage
  const loadCustomIdeas = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_IDEAS_STORAGE_KEY);
      if (stored) {
        setCustomIdeas(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom ideas:', error);
    }
  };

  // Reload custom ideas when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCustomIdeas();
    }, [])
  );

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

  const handleBack = (): void => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.goBack();
  };

  const handleCategorySelect = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId);
  };

  const handleIdeaPress = (idea: DateIdea) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.navigate('DateIdeaDetail', { idea });
  };

  const handleAddIdea = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.navigate('DateIdeaEntry');
  };

  // Combine default and custom ideas, with custom ideas first
  const allIdeas = [...customIdeas, ...DATE_IDEAS];

  // Filter ideas based on category and search
  const filteredIdeas = allIdeas.filter(idea => {
    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'my-ideas') {
      matchesCategory = idea.isCustom === true;
    } else {
      matchesCategory = idea.category === selectedCategory;
    }
    const matchesSearch = searchQuery.trim() === '' ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 56 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scrollable Title */}
        <View style={styles.scrollableTitle}>
          <Text style={styles.title}>Date Ideas</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search date ideas..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          style={styles.categoriesContainer}
        >
          {CATEGORIES.map(category => (
            <CategoryChip
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onPress={() => handleCategorySelect(category.id)}
            />
          ))}
        </ScrollView>

        {/* Ideas Grid */}
        {filteredIdeas.length > 0 ? (
          <View style={styles.ideasGrid}>
            {filteredIdeas.map(idea => (
              <DateIdeaCard
                key={idea.id}
                idea={idea}
                onPress={() => handleIdeaPress(idea)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.noResults}>
            <View style={styles.noResultsIcon}>
              <Ionicons name="search-outline" size={32} color="#D1D5DB" />
            </View>
            <Text style={styles.noResultsTitle}>No ideas found</Text>
            <Text style={styles.noResultsText}>
              Try a different search or category
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 1)',
              'rgba(247, 245, 242, 0.98)',
              'rgba(247, 245, 242, 0.9)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.5, 0.8, 1]}
            style={styles.headerGradient}
          />
        </View>

        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerSpacer} />

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddIdea}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
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
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerSpacer: {
    flex: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // Scrollable Title
  scrollableTitle: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // Search
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 0,
  },

  // Categories
  categoriesContainer: {
    marginBottom: 16,
    marginHorizontal: -16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#1F2937',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },

  // Ideas Grid
  ideasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardTouchable: {
    width: CARD_WIDTH,
  },
  ideaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  ideaCardContent: {
    flex: 1,
  },
  ideaIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  ideaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  ideaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  ideaDuration: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  ideaBudget: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  ideaBudgetFree: {
    color: '#10B981',
  },

  // No Results
  noResults: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default DateIdeasListScreen;
