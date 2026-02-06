import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
  Modal,
  TouchableWithoutFeedback,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface DatingHomeScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface VibeRatings {
  attraction?: number;
  connection?: number;
  compatibility?: number;
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

interface DatingPerson {
  id: string;
  name: string;
  initials: string;
  createdAt: string;
  phoneNumber?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  rating?: number;
  notes?: { id: string; text: string; createdAt: string }[];
  vibeRatings?: VibeRatings;
  flags?: Flag[];
  dateHistory?: DateEntry[];
}

interface DateIdea {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tagline: string;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bestTime: string;
  description: string;
  steps: string[];
  challenges: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

interface DatingAdvice {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Vibe category configurations (matching DatingDetailScreen)
const VIBE_CATEGORIES = {
  attraction: {
    icon: 'flame' as const,
    color: '#F97316',
    label: 'Attraction',
  },
  connection: {
    icon: 'heart' as const,
    color: '#EC4899',
    label: 'Connection',
  },
  compatibility: {
    icon: 'sparkles' as const,
    color: '#8B5CF6',
    label: 'Compatibility',
  },
};

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

const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  return `${Math.floor(diffDays / 30)} months ago`;
};

// Mock Data
const DATING_CRM_DATA: DatingPerson[] = [
  {
    id: '1',
    name: 'Sophie',
    initials: 'S',
    createdAt: '2024-03-01',
    phoneNumber: '+1 (555) 123-4567',
    instagram: 'sophie_h',
    location: 'Brooklyn, NY',
    vibeRatings: { attraction: 4, connection: 5, compatibility: 3 },
    flags: [
      { id: 'f1', text: 'Great listener', type: 'green', createdAt: '2024-03-02' },
      { id: 'f2', text: 'Shares my values', type: 'green', createdAt: '2024-03-03' },
      { id: 'f3', text: 'Often cancels last minute', type: 'red', createdAt: '2024-03-05' },
    ],
    dateHistory: [
      { id: 'd1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), title: 'Coffee at Blue Bottle', location: 'Williamsburg', vibe: 'amazing', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'd2', date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), title: 'Walk in Prospect Park', location: 'Park Slope', vibe: 'good', createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '2',
    name: 'Emma',
    initials: 'E',
    createdAt: '2024-02-28',
    phoneNumber: '+1 (555) 987-6543',
    vibeRatings: { attraction: 3, connection: 3 },
    flags: [
      { id: 'f1', text: 'Really funny', type: 'green', createdAt: '2024-02-28' },
    ],
    dateHistory: [
      { id: 'd1', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), title: 'Dinner at Lilia', location: 'Williamsburg', vibe: 'good', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '3',
    name: 'Mia',
    initials: 'M',
    createdAt: '2024-02-25',
    instagram: 'mia.travels',
    location: 'Manhattan, NY',
  },
];

const DATE_IDEAS: DateIdea[] = [
  {
    id: '1',
    title: 'Coffee & conversation',
    subtitle: 'Classic first date',
    icon: 'cafe-outline',
    color: '#92400E',
    tagline: 'Keep it simple with a cozy coffee date',
    duration: '1-2 hours',
    difficulty: 'Easy',
    bestTime: 'Morning or afternoon',
    description: 'A coffee date is the perfect low-pressure way to get to know someone. It\'s casual, comfortable, and easy to extend if things are going well—or wrap up gracefully if they\'re not. The relaxed atmosphere makes it easier to have genuine conversations.',
    steps: [
      'Pick a cozy coffee shop with comfortable seating',
      'Arrive a few minutes early to settle in',
      'Order your favorite drink and maybe a pastry to share',
      'Find a quiet corner where you can actually hear each other',
      'Ask open-ended questions and actively listen',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'No phone zone',
        description: 'Keep your phone in your pocket for the entire date',
      },
      {
        id: 'c2',
        title: 'Share something real',
        description: 'Tell them about a passion or hobby you genuinely care about',
      },
      {
        id: 'c3',
        title: 'Make them laugh',
        description: 'Share a funny story or memory that makes them smile',
      },
    ],
  },
  {
    id: '2',
    title: 'Walk in the park',
    subtitle: 'Fresh air & easy talk',
    icon: 'walk-outline',
    color: '#059669',
    tagline: 'Stroll, talk, and see where the path leads',
    duration: '1-2 hours',
    difficulty: 'Easy',
    bestTime: 'Afternoon or early evening',
    description: 'Walking dates are underrated. The side-by-side nature makes conversation feel less intense than sitting face-to-face, and the changing scenery gives you natural things to comment on if the conversation lulls. Plus, the activity makes it feel more dynamic than just sitting.',
    steps: [
      'Choose a scenic park or waterfront path',
      'Check the weather and dress appropriately',
      'Start walking at a comfortable pace',
      'Point out interesting things you notice along the way',
      'Consider grabbing ice cream or a drink midway through',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'People watching',
        description: 'Make up funny backstories for people you pass',
      },
      {
        id: 'c2',
        title: 'Photo moment',
        description: 'Offer to take a photo of them in a pretty spot',
      },
      {
        id: 'c3',
        title: 'Find a bench',
        description: 'Sit down somewhere with a nice view and just talk',
      },
    ],
  },
  {
    id: '3',
    title: 'Museum visit',
    subtitle: 'Art & interesting talk',
    icon: 'color-palette-outline',
    color: '#7C3AED',
    tagline: 'Let art spark meaningful conversations',
    duration: '2-3 hours',
    difficulty: 'Easy',
    bestTime: 'Afternoon',
    description: 'Museums provide the perfect balance of activity and conversation. You get to see how someone interacts with art, what catches their attention, and what they have to say about it. It\'s a window into how they think and what they value.',
    steps: [
      'Pick a museum that interests both of you',
      'Don\'t try to see everything—let yourselves wander',
      'Ask them what pieces stand out to them and why',
      'Share your own reactions and interpretations',
      'End with coffee or a drink at the museum café',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Favorite piece',
        description: 'Each pick your favorite piece and explain why',
      },
      {
        id: 'c2',
        title: 'Make up titles',
        description: 'Find an untitled piece and come up with names for it together',
      },
      {
        id: 'c3',
        title: 'Gift shop browse',
        description: 'Pick out something silly you\'d buy for each other',
      },
    ],
  },
  {
    id: '4',
    title: 'Drinks & appetizers',
    subtitle: 'Relaxed evening vibe',
    icon: 'wine-outline',
    color: '#DC2626',
    tagline: 'Unwind with good drinks and easy conversation',
    duration: '2-3 hours',
    difficulty: 'Easy',
    bestTime: 'Evening',
    description: 'Meeting for drinks is a classic for a reason. It\'s more relaxed than dinner (less commitment, easier to extend or end naturally) but still feels like a proper date. Sharing appetizers also gives you something to do with your hands and talk about.',
    steps: [
      'Choose a bar or lounge with a good atmosphere',
      'Arrive on time and text if you\'re running late',
      'Order a drink you actually enjoy, not what you think you should',
      'Share a few appetizers to keep it casual',
      'Pay attention to body language and engagement',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Try something new',
        description: 'Order a drink or food you\'ve never had before',
      },
      {
        id: 'c2',
        title: 'Ask deeper questions',
        description: 'Move beyond small talk—ask what they\'re passionate about',
      },
      {
        id: 'c3',
        title: 'Share the bill',
        description: 'Handle the payment smoothly, whatever you both decide',
      },
    ],
  },
  {
    id: '5',
    title: 'Farmers market stroll',
    subtitle: 'Casual & colorful',
    icon: 'basket-outline',
    color: '#EA580C',
    tagline: 'Browse, sample, and see what catches your eye',
    duration: '1-2 hours',
    difficulty: 'Easy',
    bestTime: 'Weekend morning',
    description: 'Farmers markets are perfect for first dates. They\'re public and casual, there\'s always something to look at or talk about, and you can easily extend the date by cooking something together with what you buy or grabbing lunch nearby.',
    steps: [
      'Meet at the market entrance around mid-morning',
      'Wander through the stalls together',
      'Try free samples and share your thoughts',
      'Pick up ingredients for a future cooking date (subtle hint)',
      'End with coffee from a vendor or brunch nearby',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Sample everything',
        description: 'Try at least 3 new foods or drinks together',
      },
      {
        id: 'c2',
        title: 'Mystery ingredient',
        description: 'Each buy one unusual ingredient to challenge the other with',
      },
      {
        id: 'c3',
        title: 'Bouquet gift',
        description: 'Buy them a small bouquet from a flower stand',
      },
    ],
  },
  {
    id: '6',
    title: 'Bookstore browsing',
    subtitle: 'For book lovers',
    icon: 'book-outline',
    color: '#0891B2',
    tagline: 'Share your favorite books and discover theirs',
    duration: '1-2 hours',
    difficulty: 'Easy',
    bestTime: 'Afternoon',
    description: 'Bookstores are intimate without being intense. You learn so much about someone by seeing what books they gravitate toward, what they recommend, and how they talk about what they love to read. It\'s perfect for people who value depth and curiosity.',
    steps: [
      'Pick a bookstore with cozy seating areas',
      'Split up for 10 minutes to find a book for each other',
      'Share your picks and explain why you chose them',
      'Browse your favorite sections together',
      'End with coffee at the café if there is one',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Book recommendations',
        description: 'Each pick a book the other person should read',
      },
      {
        id: 'c2',
        title: 'Childhood favorite',
        description: 'Find a book from your childhood and share the memory',
      },
      {
        id: 'c3',
        title: 'Random page',
        description: 'Open a random book, read a line, and discuss what you think',
      },
    ],
  },
  {
    id: '7',
    title: 'Ice cream walk',
    subtitle: 'Sweet & simple',
    icon: 'ice-cream-outline',
    color: '#EC4899',
    tagline: 'Keep it light and enjoy the moment',
    duration: '1 hour',
    difficulty: 'Easy',
    bestTime: 'Afternoon or evening',
    description: 'Sometimes the best first dates are the simplest. Getting ice cream and walking around is low-pressure, fun, and gives you a natural activity while you chat. It\'s also easy to keep going if you\'re enjoying yourself or wrap up naturally when you finish.',
    steps: [
      'Pick a good ice cream spot in a walkable area',
      'Take your time choosing flavors—it\'s a conversation starter',
      'Walk somewhere scenic or interesting nearby',
      'Focus on light, fun conversation',
      'See where the evening naturally leads',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Flavor swap',
        description: 'Try each other\'s flavors and give honest reviews',
      },
      {
        id: 'c2',
        title: 'Photo swap',
        description: 'Take a candid photo of them enjoying their ice cream',
      },
      {
        id: 'c3',
        title: 'Sunset timing',
        description: 'Time your walk to catch the golden hour light',
      },
    ],
  },
  {
    id: '8',
    title: 'Mini golf',
    subtitle: 'Playful competition',
    icon: 'golf-outline',
    color: '#10B981',
    tagline: 'A little friendly competition never hurt anyone',
    duration: '1-2 hours',
    difficulty: 'Easy',
    bestTime: 'Afternoon or evening',
    description: 'Mini golf is perfect because it gives you something fun to do while getting to know each other. The lighthearted competition breaks the ice, and you\'ll learn a lot about someone by seeing how they handle winning, losing, and the inevitable silly moments.',
    steps: [
      'Choose a mini golf place with a fun, quirky theme',
      'Keep score but don\'t take it too seriously',
      'Celebrate good shots and laugh at the bad ones',
      'Grab drinks or food afterward to keep talking',
      'Suggest a rematch if things are going well',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Trick shot',
        description: 'Each attempt one ridiculous trick shot',
      },
      {
        id: 'c2',
        title: 'Victory prize',
        description: 'Winner gets to pick the next date activity',
      },
      {
        id: 'c3',
        title: 'Photo finish',
        description: 'Take a photo at the last hole, regardless of who won',
      },
    ],
  },
];

const DATING_ADVICE_DATA: DatingAdvice[] = [
  {
    id: '1',
    title: 'Green flags to look for',
    description: 'Signs that someone is emotionally available',
    icon: 'flag-outline',
  },
  {
    id: '2',
    title: 'Questions for deeper conversation',
    description: 'Move beyond small talk',
    icon: 'chatbubbles-outline',
  },
  {
    id: '3',
    title: 'Setting healthy boundaries',
    description: 'How to communicate your needs',
    icon: 'shield-checkmark-outline',
  },
];

// Carousel Constants
const CARD_WIDTH = 220;
const CARD_HEIGHT = 220;
const SIDE_CARD_SCALE = 0.8;
const SIDE_CARD_OFFSET = 96;
const DRAG_THRESHOLD = 150;

// Card width for pager (screen width minus horizontal padding)
const PAGER_CARD_WIDTH = SCREEN_WIDTH - 32;

// Person Card (single page in the pager)
const PersonCard: React.FC<{
  person: DatingPerson;
  onViewProfile: () => void;
  onCall: () => void;
  onInstagram: () => void;
  onOpenMaps: () => void;
}> = ({ person, onViewProfile, onCall, onInstagram, onOpenMaps }) => {
  const greenFlags = person.flags?.filter(f => f.type === 'green').length || 0;
  const redFlags = person.flags?.filter(f => f.type === 'red').length || 0;
  const lastDate = person.dateHistory?.[0];
  const hasVibes = person.vibeRatings && (
    person.vibeRatings.attraction || person.vibeRatings.connection || person.vibeRatings.compatibility
  );
  const hasFlags = (person.flags?.length || 0) > 0;
  const hasContact = person.phoneNumber || person.instagram || person.location;

  return (
    <View style={[styles.dashboardCard, { width: PAGER_CARD_WIDTH }]}>
      {/* Header: Avatar + Name */}
      <View style={styles.dashboardHeader}>
        <LinearGradient
          colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
          style={styles.dashboardAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.dashboardAvatarInitials}>{person.initials}</Text>
        </LinearGradient>
        <View style={styles.dashboardHeaderInfo}>
          <Text style={styles.dashboardName}>{person.name}</Text>
          {hasContact && (
            <View style={styles.dashboardContactRow}>
              {person.phoneNumber && (
                <TouchableOpacity onPress={onCall} style={styles.dashboardContactIcon} activeOpacity={0.7}>
                  <Ionicons name="call-outline" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
              {person.instagram && (
                <TouchableOpacity onPress={onInstagram} style={styles.dashboardContactIcon} activeOpacity={0.7}>
                  <Ionicons name="logo-instagram" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
              {person.location && (
                <TouchableOpacity onPress={onOpenMaps} style={styles.dashboardContactIcon} activeOpacity={0.7}>
                  <Ionicons name="location-outline" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Vibe Bars */}
      {hasVibes && (
        <View style={styles.dashboardVibes}>
          {(['attraction', 'connection', 'compatibility'] as const).map((type) => {
            const value = person.vibeRatings?.[type];
            if (!value) return null;
            const config = VIBE_CATEGORIES[type];
            return (
              <View key={type} style={styles.vibeBarRow}>
                <Ionicons name={config.icon} size={14} color={config.color} style={styles.vibeBarIcon} />
                <Text style={styles.vibeBarLabel}>{config.label}</Text>
                <View style={styles.vibeBarTrack}>
                  {[1, 2, 3, 4, 5].map((seg) => (
                    <View
                      key={seg}
                      style={[
                        styles.vibeBarSegment,
                        {
                          backgroundColor: seg <= value ? config.color : '#F3F4F6',
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Flag Summary */}
      {hasFlags && (
        <View style={styles.dashboardFlags}>
          {greenFlags > 0 && (
            <View style={styles.flagBadge}>
              <Text style={styles.flagBadgeText}>🟢 {greenFlags} green</Text>
            </View>
          )}
          {redFlags > 0 && (
            <View style={styles.flagBadge}>
              <Text style={styles.flagBadgeText}>🔴 {redFlags} red</Text>
            </View>
          )}
        </View>
      )}

      {/* Last Date */}
      {lastDate && (
        <View style={styles.dashboardLastDate}>
          <Text style={styles.lastDateEmoji}>{getVibeEmoji(lastDate.vibe)}</Text>
          <View style={styles.lastDateInfo}>
            <Text style={styles.lastDateTitle} numberOfLines={1}>{lastDate.title}</Text>
            <Text style={styles.lastDateMeta}>
              {lastDate.location ? `${lastDate.location} · ` : ''}{getTimeAgo(lastDate.date)}
            </Text>
          </View>
        </View>
      )}

      {/* View Profile CTA */}
      <TouchableOpacity
        style={styles.viewProfileButton}
        onPress={onViewProfile}
        activeOpacity={0.8}
      >
        <Text style={styles.viewProfileText}>View Full Profile</Text>
        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

// Person Pager — horizontal snap-scrolling cards with dot indicators
const PersonPager: React.FC<{
  people: DatingPerson[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  navigation: any;
}> = ({ people, activeIndex, onIndexChange, navigation }) => {
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);

  const handleScroll = useCallback((event: any) => {
    if (!isUserScrolling.current) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < people.length) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onIndexChange(newIndex);
    }
  }, [activeIndex, onIndexChange, people.length]);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
  }, []);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    isUserScrolling.current = false;
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex >= 0 && newIndex < people.length) {
      onIndexChange(newIndex);
    }
  }, [onIndexChange, people.length]);

  const handleViewProfile = useCallback((person: DatingPerson) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DatingDetail', { person });
  }, [navigation]);

  const handleCall = useCallback((person: DatingPerson) => {
    if (person.phoneNumber) {
      const cleaned = person.phoneNumber.replace(/[^+\d]/g, '');
      Linking.openURL(`tel:${cleaned}`);
    }
  }, []);

  const handleInstagram = useCallback((person: DatingPerson) => {
    if (person.instagram) {
      Linking.openURL(`https://instagram.com/${person.instagram}`);
    }
  }, []);

  const handleOpenMaps = useCallback((person: DatingPerson) => {
    if (person.location) {
      const query = encodeURIComponent(person.location);
      Linking.openURL(`https://maps.apple.com/?q=${query}`);
    }
  }, []);

  return (
    <View style={styles.pagerSection}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        contentContainerStyle={styles.pagerContent}
      >
        {people.map((person) => (
          <View key={person.id} style={styles.pagerPage}>
            <PersonCard
              person={person}
              onViewProfile={() => handleViewProfile(person)}
              onCall={() => handleCall(person)}
              onInstagram={() => handleInstagram(person)}
              onOpenMaps={() => handleOpenMaps(person)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Dot Indicators */}
      {people.length > 1 && (
        <View style={styles.pagerDots}>
          {people.map((_, index) => (
            <View
              key={index}
              style={[
                styles.pagerDot,
                index === activeIndex && styles.pagerDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Date Ideas Section Component
const DateIdeasSection: React.FC<{ navigation?: any; onSwipeStart?: () => void; onSwipeEnd?: () => void }> = ({ navigation, onSwipeStart, onSwipeEnd }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [savedIdeas, setSavedIdeas] = useState<Set<string>>(new Set());
  const animatedIndex = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;

  const handleIdeaPress = (idea: DateIdea) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.navigate('DateIdeaDetail', { idea });
  };

  const handleSeeAll = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.navigate('DateIdeasList');
  };

  const handleToggleSave = (ideaId: string, event: any) => {
    event.stopPropagation();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSavedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
      } else {
        newSet.add(ideaId);
      }
      return newSet;
    });
  };

  const goToIndex = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(DATE_IDEAS.length - 1, newIndex));
    setActiveIndex(clampedIndex);
    Animated.spring(animatedIndex, {
      toValue: clampedIndex,
      useNativeDriver: true,
      friction: 7,
      tension: 50,
    }).start();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [animatedIndex]);

  const carouselPanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onPanResponderGrant: () => {
        panX.setValue(0);
        onSwipeStart?.();
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        panX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        onSwipeEnd?.();
        const threshold = 50;
        if (gestureState.dx < -threshold && activeIndex < DATE_IDEAS.length - 1) {
          goToIndex(activeIndex + 1);
        } else if (gestureState.dx > threshold && activeIndex > 0) {
          goToIndex(activeIndex - 1);
        }
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
        }).start();
      },
      onPanResponderTerminate: () => {
        onSwipeEnd?.();
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
        }).start();
      },
    }),
  [activeIndex, goToIndex, panX, onSwipeStart, onSwipeEnd]);

  const getCardAnimatedStyle = (cardIndex: number) => {
    const baseTranslateX = animatedIndex.interpolate({
      inputRange: [cardIndex - 2, cardIndex - 1, cardIndex, cardIndex + 1, cardIndex + 2],
      outputRange: [
        2 * SIDE_CARD_OFFSET,
        SIDE_CARD_OFFSET,
        0,
        -SIDE_CARD_OFFSET,
        -2 * SIDE_CARD_OFFSET,
      ],
      extrapolate: 'clamp',
    });

    const dragOffset = panX.interpolate({
      inputRange: [-DRAG_THRESHOLD, 0, DRAG_THRESHOLD],
      outputRange: [-SIDE_CARD_OFFSET, 0, SIDE_CARD_OFFSET],
      extrapolate: 'clamp',
    });

    const translateX = Animated.add(baseTranslateX, dragOffset);

    const baseScale = animatedIndex.interpolate({
      inputRange: [cardIndex - 2, cardIndex - 1, cardIndex, cardIndex + 1, cardIndex + 2],
      outputRange: [0.7, SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE, 0.7],
      extrapolate: 'clamp',
    });

    const dragScaleAdjust = panX.interpolate({
      inputRange: [-DRAG_THRESHOLD, 0, DRAG_THRESHOLD],
      outputRange: [0.1, 0, 0.1],
      extrapolate: 'clamp',
    });

    const scale = Animated.subtract(baseScale, Animated.multiply(
      dragScaleAdjust,
      animatedIndex.interpolate({
        inputRange: [cardIndex - 1, cardIndex, cardIndex + 1],
        outputRange: [-1, 1, -1],
        extrapolate: 'clamp',
      })
    ));

    const opacity = 1;

    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  };

  const getZIndex = (cardIndex: number) => {
    const distance = Math.abs(cardIndex - activeIndex);
    return 10 - distance;
  };

  const getVisibleCardIndices = () => {
    const indices: number[] = [];
    for (let i = 0; i < DATE_IDEAS.length; i++) {
      if (Math.abs(i - activeIndex) <= 2) {
        indices.push(i);
      }
    }
    return indices.sort((a, b) => {
      const distanceA = Math.abs(a - activeIndex);
      const distanceB = Math.abs(b - activeIndex);
      return distanceB - distanceA;
    });
  };

  return (
    <View style={[styles.section, styles.dateIdeasSection]}>
      <View style={styles.dateIdeasHeader}>
        <View style={styles.dateIdeasTitleRow}>
          <View style={styles.sectionAccent} />
          <View>
            <Text style={styles.sectionTitle}>Date Ideas</Text>
            <Text style={styles.dateIdeasSubtitle}>First date inspiration</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.carouselContainer} {...carouselPanResponder.panHandlers}>
        {getVisibleCardIndices().map((cardIndex) => {
          const idea = DATE_IDEAS[cardIndex];
          const cardAnimatedStyle = getCardAnimatedStyle(cardIndex);
          return (
            <Animated.View
              key={idea.id}
              style={[
                styles.carouselCard,
                {
                  transform: cardAnimatedStyle.transform,
                  opacity: cardAnimatedStyle.opacity,
                  zIndex: getZIndex(cardIndex),
                },
              ]}
            >
              <TouchableOpacity
                style={styles.dateIdeaCardInner}
                onPress={() => handleIdeaPress(idea)}
                activeOpacity={1}
              >
                <View style={styles.dateIdeaGradient}>
                  <TouchableOpacity
                    style={styles.dateIdeaHeartButton}
                    onPress={(e) => handleToggleSave(idea.id, e)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={savedIdeas.has(idea.id) ? 'heart' : 'heart-outline'}
                      size={20}
                      color={savedIdeas.has(idea.id) ? '#E11D48' : '#9CA3AF'}
                    />
                  </TouchableOpacity>

                  <View style={styles.dateIdeaMainContent}>
                    <View style={[styles.dateIdeaIconContainer]}>
                      <View style={[styles.dateIdeaIcon, {
                        backgroundColor: '#FFFFFF',
                        shadowColor: idea.color,
                      }]}>
                        <Ionicons name={idea.icon} size={36} color={idea.color} />
                      </View>
                    </View>

                    <View style={styles.dateIdeaTextContent}>
                      <Text style={styles.dateIdeaTitle} numberOfLines={2}>
                        {idea.title}
                      </Text>
                      <Text style={styles.dateIdeaSubtitle} numberOfLines={1}>
                        {idea.subtitle}
                      </Text>
                    </View>

                    <View style={styles.dateIdeaFooter}>
                      <View style={[styles.dateIdeaDurationBadge, {
                        backgroundColor: `${idea.color}10`,
                        borderColor: `${idea.color}20`,
                      }]}>
                        <Ionicons name="time-outline" size={11} color={idea.color} />
                        <Text style={[styles.dateIdeaDurationText, { color: idea.color }]}>
                          {idea.duration}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

// Main Component
const DatingHomeScreen: React.FC<DatingHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);
  const [activePersonIndex, setActivePersonIndex] = useState(0);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

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

  const handleAdvicePress = (advice: DatingAdvice) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DatingAdviceDetail', { advice });
  };

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isSwipingCard}
      >
          {/* Person Pager */}
          <PersonPager
            people={DATING_CRM_DATA}
            activeIndex={activePersonIndex}
            onIndexChange={setActivePersonIndex}
            navigation={navigation}
          />

          {/* Date Ideas Section */}
          <DateIdeasSection
            navigation={navigation}
            onSwipeStart={() => setIsSwipingCard(true)}
            onSwipeEnd={() => setIsSwipingCard(false)}
          />

          {/* Dating Advice Section */}
          <View style={styles.section}>
            <View style={styles.adviceSectionHeader}>
              <View style={styles.adviceTitleRow}>
                <View style={styles.sectionAccent} />
                <View>
                  <Text style={styles.sectionTitle}>Dating Wisdom</Text>
                  <Text style={styles.sectionSubtitle}>Tips for meaningful connections</Text>
                </View>
              </View>
            </View>

            <View style={styles.adviceList}>
              {DATING_ADVICE_DATA.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.adviceCard}
                  onPress={() => handleAdvicePress(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.adviceIconCircle}>
                    <Ionicons name={item.icon} size={22} color="#E11D48" />
                  </View>
                  <View style={styles.adviceContent}>
                    <Text style={styles.adviceTitle}>{item.title}</Text>
                    <Text style={styles.adviceDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSettingsMenuVisible(true);
            }}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Settings Menu Modal */}
      <Modal
        visible={settingsMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSettingsMenuVisible(false)}>
          <View style={styles.dropdownModalOverlay}>
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSettingsMenuVisible(false);
                  navigation.navigate('RelationshipSetup');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="sync-outline" size={18} color="#6B7280" />
                <Text style={styles.dropdownItemText}>Switch to Relationship</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  settingsButton: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Section Common
  section: {
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  sectionAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#E11D48',
    borderRadius: 2,
    marginTop: 2,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 2,
  },

  // Person Pager
  pagerSection: {
    marginBottom: 28,
  },
  pagerContent: {
    // no extra padding — each page is full screen width
  },
  pagerPage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
  },
  pagerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  pagerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  pagerDotActive: {
    backgroundColor: '#E11D48',
    width: 20,
    borderRadius: 4,
  },

  // Person Dashboard Card
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dashboardAvatarInitials: {
    fontSize: 28,
    fontWeight: '600',
    color: '#E11D48',
  },
  dashboardHeaderInfo: {
    flex: 1,
  },
  dashboardName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  dashboardContactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dashboardContactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardVibes: {
    marginBottom: 14,
    gap: 8,
  },
  vibeBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeBarIcon: {
    width: 18,
    marginRight: 6,
  },
  vibeBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
  },
  vibeBarTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  vibeBarSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  dashboardFlags: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  flagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  flagBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  dashboardLastDate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  lastDateEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  lastDateInfo: {
    flex: 1,
  },
  lastDateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  lastDateMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    borderRadius: 14,
    paddingVertical: 13,
    gap: 6,
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Date Ideas Section - Carousel
  dateIdeasSection: {
    marginBottom: 40,
    paddingHorizontal: 0,
  },
  dateIdeasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateIdeasTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateIdeasSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  carouselContainer: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  carouselCard: {
    position: 'absolute',
    width: 220,
    height: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dateIdeaCardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  dateIdeaGradient: {
    width: '100%',
    height: '100%',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  dateIdeaMainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateIdeaHeartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  dateIdeaIconContainer: {
    marginBottom: 4,
  },
  dateIdeaIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dateIdeaTextContent: {
    alignItems: 'center',
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: 'center',
  },
  dateIdeaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
    lineHeight: 20,
  },
  dateIdeaSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.1,
    lineHeight: 16,
  },
  dateIdeaFooter: {
    alignItems: 'center',
  },
  dateIdeaDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateIdeaDurationText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Advice Section
  adviceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  adviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  adviceList: {
    gap: 12,
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  adviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  adviceContent: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  adviceDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },

  // Dropdown Modal
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 116,
    right: 16,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownItemWithDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
});

export default DatingHomeScreen;
