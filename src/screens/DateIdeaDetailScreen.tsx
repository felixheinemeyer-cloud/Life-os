import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Types
interface DateIdea {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  duration: string;
  budget: 'free' | 'low' | 'medium' | 'high';
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradientColors: [string, string, string];
}

interface DateIdeaDetailScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      idea?: DateIdea;
    };
  };
}

// Categories with gradient colors
const CATEGORIES: Category[] = [
  { id: 'romantic', name: 'Romantic', icon: 'heart-outline', color: '#E11D48', gradientColors: ['#FFF1F2', '#FFE4E6', '#FECDD3'] },
  { id: 'adventure', name: 'Adventure', icon: 'compass-outline', color: '#0891B2', gradientColors: ['#ECFEFF', '#CFFAFE', '#A5F3FC'] },
  { id: 'creative', name: 'Creative', icon: 'color-palette-outline', color: '#7C3AED', gradientColors: ['#F5F3FF', '#EDE9FE', '#DDD6FE'] },
  { id: 'food', name: 'Food & Drink', icon: 'restaurant-outline', color: '#F59E0B', gradientColors: ['#FFFBEB', '#FEF3C7', '#FDE68A'] },
  { id: 'outdoor', name: 'Outdoors', icon: 'leaf-outline', color: '#10B981', gradientColors: ['#ECFDF5', '#D1FAE5', '#A7F3D0'] },
  { id: 'entertainment', name: 'Fun', icon: 'film-outline', color: '#EC4899', gradientColors: ['#FDF2F8', '#FCE7F3', '#FBCFE8'] },
  { id: 'active', name: 'Active', icon: 'fitness-outline', color: '#3B82F6', gradientColors: ['#EFF6FF', '#DBEAFE', '#BFDBFE'] },
  { id: 'cozy', name: 'Cozy', icon: 'home-outline', color: '#92400E', gradientColors: ['#FEF3C7', '#FDE68A', '#FCD34D'] },
  { id: 'cultural', name: 'Cultural', icon: 'library-outline', color: '#6366F1', gradientColors: ['#EEF2FF', '#E0E7FF', '#C7D2FE'] },
];

// Extended content for each date idea
const getIdeaDetails = (ideaId: string): {
  extendedDescription: string;
  tips: string[];
  whatToBring: string[];
  bestTime: string;
  moodKeywords: string[];
} => {
  const defaultContent = {
    extendedDescription: 'Create a memorable experience together with this date idea. Take your time to enjoy each moment and focus on connecting with your partner.',
    tips: [
      'Put your phones away to be fully present',
      'Take photos to capture the memories',
      'Be open to spontaneous moments',
    ],
    whatToBring: ['Good vibes', 'Open mind', 'Comfortable clothing'],
    bestTime: 'Anytime works great',
    moodKeywords: ['fun', 'connection', 'quality time'],
  };

  const customContent: Record<string, typeof defaultContent> = {
    '1': {
      extendedDescription: 'Find a scenic spot with a beautiful view of the horizon. Arrive about an hour before sunset to set up your blanket, arrange your food and drinks, and settle in for the golden hour magic. Watch the sky transform through shades of orange, pink, and purple while sharing your favorite cheeses and wine.',
      tips: [
        'Check sunset time and arrive 45-60 minutes early',
        'Choose a west-facing location for the best view',
        'Bring a backup plan in case of clouds',
        'Layer up - it can get cool after sunset',
      ],
      whatToBring: ['Blanket', 'Wine & glasses', 'Cheese board', 'Candles', 'Speaker'],
      bestTime: 'Golden hour',
      moodKeywords: ['romantic', 'peaceful', 'intimate'],
    },
    '2': {
      extendedDescription: 'Escape the city lights and find a dark spot to marvel at the cosmos together. Lay on blankets, sip hot cocoa, and try to spot constellations. Download a stargazing app to help identify what you\'re seeing. This quiet, reflective activity naturally leads to deeper conversations about life, dreams, and the universe.',
      tips: [
        'Check the moon phase - new moons are best',
        'Download a star map app like SkyView',
        'Give your eyes 20 minutes to adjust to the dark',
        'Bring extra blankets - it gets cold at night',
      ],
      whatToBring: ['Warm blankets', 'Hot cocoa', 'Pillows', 'Bug spray', 'Star map app'],
      bestTime: 'Clear nights, new moon',
      moodKeywords: ['dreamy', 'peaceful', 'cosmic'],
    },
    '3': {
      extendedDescription: 'Transform your home into a romantic restaurant. Cook a special meal together - the process of preparing food side by side is just as meaningful as dining. Dim the lights, light candles throughout the space, and set the table with your best dishes. Create a playlist of your favorite songs to complete the ambiance.',
      tips: [
        'Plan the menu together a day before',
        'Prep ingredients in advance to reduce stress',
        'Set the mood with a curated playlist',
        'Dress up even though you\'re at home',
      ],
      whatToBring: ['Fresh ingredients', 'Candles', 'Nice wine', 'Flowers', 'Playlist'],
      bestTime: 'Weekend evening',
      moodKeywords: ['intimate', 'cozy', 'romantic'],
    },
    '6': {
      extendedDescription: 'Choose a trail that matches both your fitness levels and allows for conversation. The shared physical challenge creates bonding, while the natural beauty provides countless conversation starters. Pack snacks and find a scenic spot for a mid-hike break to rest and take in the views together.',
      tips: [
        'Research the trail difficulty beforehand',
        'Start early to avoid crowds and heat',
        'Take breaks to appreciate the views',
        'Capture photos at scenic viewpoints',
      ],
      whatToBring: ['Hiking shoes', 'Water bottles', 'Trail snacks', 'Sunscreen', 'Camera'],
      bestTime: 'Morning',
      moodKeywords: ['adventurous', 'active', 'refreshing'],
    },
    '11': {
      extendedDescription: 'Channel your inner artist and get your hands dirty together. There\'s something beautifully vulnerable about trying something new and potentially "failing" together. Whether you create masterpieces or misshapen blobs, the laughter and teamwork make this an unforgettable experience.',
      tips: [
        'Wear clothes you don\'t mind getting dirty',
        'Don\'t aim for perfection - embrace the mess',
        'Take photos of each other\'s creations',
        'Keep your creations as relationship mementos',
      ],
      whatToBring: ['Old clothes', 'Hair tie', 'Open mind', 'Sense of humor'],
      bestTime: 'Weekend afternoon',
      moodKeywords: ['creative', 'playful', 'intimate'],
    },
    '27': {
      extendedDescription: 'Create a cinema experience at home that\'s better than any theater. Build a cozy nest of blankets and pillows, prepare movie snacks together, and take turns picking films. Make it a series - have each person curate a film they love or want to share.',
      tips: [
        'Take turns choosing the movie',
        'Make it special with homemade popcorn',
        'Create a cozy blanket fort setup',
        'Put phones on silent to stay present',
      ],
      whatToBring: ['Cozy blankets', 'Popcorn', 'Favorite snacks', 'Movie picks'],
      bestTime: 'Friday or Saturday evening',
      moodKeywords: ['cozy', 'relaxed', 'comfortable'],
    },
    '29': {
      extendedDescription: 'Test your teamwork under pressure in a thrilling puzzle adventure. Escape rooms reveal how you communicate, problem-solve, and support each other when the clock is ticking. Choose a theme that excites you both and prepare for an adrenaline-filled hour of teamwork.',
      tips: [
        'Book in advance - popular rooms fill up',
        'Pick a theme that interests both of you',
        'Communicate everything you find',
        'Don\'t be afraid to ask for hints',
      ],
      whatToBring: ['Comfortable shoes', 'Problem-solving mindset', 'Teamwork spirit'],
      bestTime: 'Weekend afternoon',
      moodKeywords: ['exciting', 'challenging', 'thrilling'],
    },
    '39': {
      extendedDescription: 'Dust off the board games or card decks and let your competitive (or collaborative) spirits shine. From strategic games to silly party games, this is a perfect way to learn more about each other through play. Make it extra special with themed snacks and drinks.',
      tips: [
        'Mix competitive and cooperative games',
        'Keep snacks within reach',
        'Set a fun stakes for the winner',
        'Try games neither of you have played',
      ],
      whatToBring: ['Board games', 'Snacks and drinks', 'Comfortable seating', 'Fun attitude'],
      bestTime: 'Evening after dinner',
      moodKeywords: ['playful', 'fun', 'competitive'],
    },
    '41': {
      extendedDescription: 'Create a luxurious spa experience in the comfort of your home. Take turns giving massages, apply face masks together, and run a bubble bath with candles. This is the ultimate way to unwind and pamper each other while deepening your physical and emotional connection.',
      tips: [
        'Set the mood with candles and soft music',
        'Prepare all products beforehand',
        'Take turns pampering each other',
        'End with a relaxing cup of tea',
      ],
      whatToBring: ['Face masks', 'Massage oil', 'Bath bombs', 'Candles', 'Soft robes'],
      bestTime: 'Evening, after a long week',
      moodKeywords: ['relaxing', 'pampering', 'intimate'],
    },
  };

  return customContent[ideaId] || defaultContent;
};

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

const DateIdeaDetailScreen: React.FC<DateIdeaDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const idea = route.params?.idea;
  const category = CATEGORIES.find(c => c.id === idea?.category) || CATEGORIES[0];
  const details = idea ? getIdeaDetails(idea.id) : getIdeaDetails('');

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  if (!idea) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="heart-dislike-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Date idea not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 56 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Icon with gradient background */}
          <LinearGradient
            colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
            style={styles.heroIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.heroIconCircle, { shadowColor: '#E11D48' }]}>
              <Ionicons name={idea.icon} size={32} color="#E11D48" />
            </View>
          </LinearGradient>

          {/* Title */}
          <Text style={styles.heroTitle}>{idea.title}</Text>

          {/* Quick Info Chips - Horizontal layout */}
          <View style={styles.quickInfoRow}>
            <View style={styles.quickInfoChip}>
              <Ionicons name={category.icon} size={14} color="#E11D48" />
              <Text style={[styles.quickInfoText, { color: '#E11D48' }]}>{category.name}</Text>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoChip}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.quickInfoText}>{idea.duration}</Text>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoChip}>
              <Ionicons name="wallet-outline" size={14} color={idea.budget === 'free' ? '#10B981' : '#6B7280'} />
              <Text style={[styles.quickInfoText, idea.budget === 'free' && styles.quickInfoTextFree]}>
                {getBudgetDisplay(idea.budget)}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Date</Text>
            <View style={styles.sectionCard}>
              <Text style={styles.descriptionText}>{details.extendedDescription}</Text>
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips for Success</Text>
            <View style={styles.sectionCard}>
              {details.tips.map((tip, index) => (
                <View key={index} style={[styles.tipRow, index === details.tips.length - 1 && styles.tipRowLast]}>
                  <View style={[styles.tipBullet, { backgroundColor: '#FFF1F2' }]}>
                    <Text style={[styles.tipNumber, { color: '#E11D48' }]}>{index + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* What to Bring Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What to Bring</Text>
            <View style={styles.tagsContainer}>
              {details.whatToBring.map((item, index) => (
                <View key={index} style={styles.tag}>
                  <Ionicons name="checkmark-circle" size={14} color="#E11D48" />
                  <Text style={styles.tagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={{ height: 40 }} />
        </View>
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

        <View style={styles.header} pointerEvents="box-none">
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
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
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  heroIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Quick Info Row
  quickInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickInfoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  quickInfoTextFree: {
    color: '#10B981',
  },
  quickInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 14,
  },

  // Content Container
  contentContainer: {
    gap: 24,
  },

  // Sections
  section: {},
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  tipRowLast: {
    marginBottom: 0,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  tipNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 22,
  },

  // Tags (What to Bring)
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
});

export default DateIdeaDetailScreen;
