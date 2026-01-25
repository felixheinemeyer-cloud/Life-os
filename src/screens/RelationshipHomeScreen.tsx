import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Image,
  TextInput,
  Platform,
  Dimensions,
  PanResponder,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NOTE_ACTION_WIDTH = 136; // Two 44px buttons + 16px gaps (16 + 44 + 16 + 44 + 16)

// Types
interface RelationshipHomeScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params?: {
      partnerName?: string;
      sinceDate?: string | Date;
      photoUri?: string | null;
    };
  };
}

interface DurationStats {
  years: number;
  months: number;
  weeks: number;
  days: number;
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

interface RelationshipTool {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface PartnerNote {
  id: string;
  text: string;
}

// Mock Data
const DATE_IDEAS: DateIdea[] = [
  {
    id: '1',
    title: 'Sunset walk by the river',
    subtitle: 'Golden hour magic',
    icon: 'sunny-outline',
    color: '#F59E0B',
    tagline: 'Watch the sky paint itself in shades of gold and pink',
    duration: '1-2 hours',
    difficulty: 'Easy',
    bestTime: 'Evening',
    description: 'There\'s something magical about watching the sunset together. The golden hour creates the perfect romantic atmosphere for deep conversations and quiet moments. Walking side by side as the day transitions to night reminds us to slow down and appreciate the beauty in simple things.',
    steps: [
      'Check sunset time and plan to arrive 30 minutes early',
      'Pick a scenic spot along the river with a good view',
      'Bring a blanket and some snacks or drinks',
      'Leave your phones on silent and be present with each other',
      'Share what you\'re grateful for as you watch the sunset',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Golden hour photos',
        description: 'Take at least 3 photos of each other in the golden light',
      },
      {
        id: 'c2',
        title: 'Gratitude sharing',
        description: 'Each share 3 things you\'re grateful for about your partner',
      },
      {
        id: 'c3',
        title: 'Star gazing',
        description: 'Stay until you see the first stars appear',
      },
    ],
  },
  {
    id: '2',
    title: 'Cook together',
    subtitle: 'Create & connect',
    icon: 'restaurant-outline',
    color: '#10B981',
    tagline: 'Turn your kitchen into a playground for two',
    duration: '2-3 hours',
    difficulty: 'Medium',
    bestTime: 'Evening',
    description: 'Cooking together is more than making a meal—it\'s about teamwork, creativity, and having fun. Whether you\'re following a recipe or improvising, the kitchen becomes a space where you create memories (and maybe a little mess). Plus, you get to enjoy the fruits of your labor together.',
    steps: [
      'Choose a recipe you\'ve both never tried before',
      'Shop for ingredients together',
      'Put on your favorite playlist',
      'Assign roles: one preps, one cooks, or work together on everything',
      'Set a beautiful table and enjoy your creation',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Mystery ingredient',
        description: 'Each person adds one surprise ingredient to the dish',
      },
      {
        id: 'c2',
        title: 'No recipe challenge',
        description: 'Try to recreate a favorite restaurant dish from memory',
      },
      {
        id: 'c3',
        title: 'Dessert surprise',
        description: 'One person makes a secret dessert while the other isn\'t looking',
      },
    ],
  },
  {
    id: '3',
    title: 'Movie night',
    subtitle: 'Cozy at home',
    icon: 'film-outline',
    color: '#8B5CF6',
    tagline: 'Transform your living room into a private cinema',
    duration: '2-3 hours',
    difficulty: 'Easy',
    bestTime: 'Evening',
    description: 'Sometimes the best dates are the simplest ones. A cozy movie night at home gives you the chance to relax, cuddle up, and enjoy each other\'s company without any distractions. It\'s intimate, comfortable, and totally stress-free.',
    steps: [
      'Each person picks a movie, then flip a coin to choose',
      'Make a cozy nest with blankets and pillows',
      'Prepare movie snacks: popcorn, candy, or your favorites',
      'Dim the lights and turn off all notifications',
      'Cuddle up and enjoy the show',
    ],
    challenges: [
      {
        id: 'c1',
        title: 'Genre roulette',
        description: 'Watch a movie from a genre neither of you usually picks',
      },
      {
        id: 'c2',
        title: 'Snack chef',
        description: 'Create a unique movie snack combo you\'ve never tried',
      },
      {
        id: 'c3',
        title: 'No phones rule',
        description: 'Put phones in another room for the entire movie',
      },
    ],
  },
];

const RELATIONSHIP_TOOLS: RelationshipTool[] = [
  {
    id: '2',
    title: 'Conflict resolution guide',
    description: 'Navigate disagreements with empathy and understanding',
    icon: 'people-outline',
  },
];

// Helper Functions
const calculateDuration = (sinceDate: Date): DurationStats => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - sinceDate.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const years = Math.floor(totalDays / 365);
  const remainingAfterYears = totalDays % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const remainingAfterMonths = remainingAfterYears % 30;
  const weeks = Math.floor(remainingAfterMonths / 7);
  const days = remainingAfterMonths % 7;

  return { years, months, weeks, days };
};

// Format duration as human-readable string (e.g., "3 years & 1 month" or "1,127 days together")
const formatDurationHuman = (sinceDate: Date): { primary: string; secondary: string } => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - sinceDate.getTime());
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);

  let primary = '';

  if (years > 0 && months > 0) {
    primary = `${years} ${years === 1 ? 'year' : 'years'} & ${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (years > 0) {
    primary = `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    primary = `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    primary = `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  }

  const secondary = `${totalDays.toLocaleString()} days of love`;

  return { primary, secondary };
};

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

// Subcomponents
const HeroSection: React.FC<{
  photoUri: string | null;
  partnerName: string;
  sinceDate: Date;
  duration: DurationStats;
}> = ({ photoUri, partnerName, sinceDate, duration }) => (
  <View style={styles.heroSection}>
    {/* Photo Container */}
    <View style={styles.heroPhotoContainer}>
      {/* Background Photo or Placeholder */}
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.heroPhoto} />
      ) : (
        <LinearGradient
          colors={['#FFF1F2', '#FECDD3', '#FDA4AF']}
          style={styles.heroPhotoPlaceholder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroPlaceholderIconContainer}>
            <Ionicons name="heart" size={64} color="rgba(225, 29, 72, 0.3)" />
          </View>
        </LinearGradient>
      )}

      {/* Gradient Overlay for better text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.03)', 'rgba(0, 0, 0, 0.15)']}
        style={styles.heroGradientOverlay}
        locations={[0, 0.5, 1]}
      />
    </View>

    {/* Info Card - positioned to overlap and extend beyond photo */}
    <View style={styles.heroInfoCard}>
      <View style={styles.heroInfoRow}>
        {/* Left: Name & Since Date */}
        <View style={styles.heroInfoLeft}>
          <Text style={styles.partnerName}>{partnerName}</Text>
          <View style={styles.sinceRow}>
            <Ionicons name="heart" size={10} color="#E11D48" />
            <Text style={styles.sinceText}>{formatDate(sinceDate)}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.heroInfoDivider} />

        {/* Right: Duration Stats */}
        <View style={styles.durationRow}>
          <View style={styles.durationItem}>
            <Text style={styles.durationNumber}>{duration.years}</Text>
            <Text style={styles.durationLabel}>years</Text>
          </View>
          <Text style={styles.durationDot}>•</Text>
          <View style={styles.durationItem}>
            <Text style={styles.durationNumber}>{duration.months}</Text>
            <Text style={styles.durationLabel}>months</Text>
          </View>
          <Text style={styles.durationDot}>•</Text>
          <View style={styles.durationItem}>
            <Text style={styles.durationNumber}>{duration.days}</Text>
            <Text style={styles.durationLabel}>days</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

const CARD_WIDTH = 220;
const CARD_HEIGHT = 220;
const SIDE_CARD_SCALE = 0.8;
const SIDE_CARD_OFFSET = 96;
const DRAG_THRESHOLD = 150;

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

  // Each card's position is determined by: cardIndex - animatedIndex
  // When animatedIndex = cardIndex, card is at center
  // When animatedIndex = cardIndex + 1, card is on the left
  // When animatedIndex = cardIndex - 1, card is on the right
  const getCardAnimatedStyle = (cardIndex: number) => {
    // TranslateX based on animated index position
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

    // Drag offset during swipe gesture (follows finger direction)
    const dragOffset = panX.interpolate({
      inputRange: [-DRAG_THRESHOLD, 0, DRAG_THRESHOLD],
      outputRange: [-SIDE_CARD_OFFSET, 0, SIDE_CARD_OFFSET],
      extrapolate: 'clamp',
    });

    const translateX = Animated.add(baseTranslateX, dragOffset);

    // Scale based on animated index
    const baseScale = animatedIndex.interpolate({
      inputRange: [cardIndex - 2, cardIndex - 1, cardIndex, cardIndex + 1, cardIndex + 2],
      outputRange: [0.7, SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE, 0.7],
      extrapolate: 'clamp',
    });

    // Scale adjustment during drag
    const dragScaleAdjust = panX.interpolate({
      inputRange: [-DRAG_THRESHOLD, 0, DRAG_THRESHOLD],
      outputRange: [0.1, 0, 0.1],
      extrapolate: 'clamp',
    });

    // For center card, scale down during drag; for side cards heading to center, scale up
    const scale = Animated.subtract(baseScale, Animated.multiply(
      dragScaleAdjust,
      animatedIndex.interpolate({
        inputRange: [cardIndex - 1, cardIndex, cardIndex + 1],
        outputRange: [-1, 1, -1], // -1 = scale up during drag, 1 = scale down
        extrapolate: 'clamp',
      })
    ));

    // Opacity - keep all cards fully opaque so they properly cover each other
    const opacity = 1;

    return {
      transform: [{ translateX }, { scale }],
      opacity,
    };
  };

  // Calculate zIndex based on distance from active index
  const getZIndex = (cardIndex: number) => {
    const distance = Math.abs(cardIndex - activeIndex);
    return 10 - distance;
  };

  // Render cards within range of active index
  const getVisibleCardIndices = () => {
    const indices: number[] = [];
    for (let i = 0; i < DATE_IDEAS.length; i++) {
      if (Math.abs(i - activeIndex) <= 2) {
        indices.push(i);
      }
    }
    // Sort by z-index (furthest cards first, active card last)
    return indices.sort((a, b) => {
      const distanceA = Math.abs(a - activeIndex);
      const distanceB = Math.abs(b - activeIndex);
      return distanceB - distanceA; // Furthest first
    });
  };

  return (
    <View style={[styles.section, styles.dateIdeasSection]}>
      <View style={styles.dateIdeasHeader}>
        <View style={styles.dateIdeasTitleRow}>
          <View style={styles.dateIdeasAccent} />
          <View>
            <Text style={styles.sectionTitle}>This Week's Spark</Text>
            <Text style={styles.dateIdeasSubtitle}>Curated moments for two</Text>
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
                  {/* Heart Save Button */}
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

// Helper function to calculate days until next Monday
const calculateDaysUntilMonday = (): number => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  // If today is Monday (1), return 7 (next Monday)
  // Otherwise calculate days until Monday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
  return daysUntilMonday;
};

const RelationshipToolsSection: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const daysUntilUpdate = calculateDaysUntilMonday();

  const handleToolPress = (tool: RelationshipTool) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (tool.id === '2') {
      // Conflict resolution guide
      navigation?.navigate('ConflictResolutionGuide');
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.toolsSectionHeader}>
        <View style={styles.toolsSectionTitleRow}>
          <View style={styles.toolsSectionAccent} />
          <View>
            <Text style={styles.sectionTitle}>Grow Together</Text>
            <Text style={styles.toolsSectionSubtitle}>Resources for your relationship</Text>
          </View>
        </View>
        <View style={styles.toolsTimerPill}>
          <Ionicons name="hourglass-outline" size={16} color="#E11D48" />
          <Text style={styles.toolsTimerText}>{daysUntilUpdate}d</Text>
        </View>
      </View>
      {RELATIONSHIP_TOOLS.map((tool) => (
        <TouchableOpacity
          key={tool.id}
          style={styles.toolCard}
          onPress={() => handleToolPress(tool)}
          activeOpacity={0.8}
        >
          <View style={styles.toolIconCircle}>
            <Ionicons name={tool.icon} size={22} color="#E11D48" />
          </View>
          <View style={styles.toolContent}>
            <Text style={styles.toolTitle}>{tool.title}</Text>
            <Text style={styles.toolDescription}>{tool.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6B7280" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Swipeable Note Card Component
const SwipeableNoteCard: React.FC<{
  note: PartnerNote;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
}> = ({ note, onEdit, onDelete, onSwipeStart, onSwipeEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const closeActions = useCallback(() => {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [translateX]);

  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

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

  const handleCardPress = () => {
    if (isOpen) {
      closeActions();
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
    <View style={styles.noteCardWrapper}>
      {/* Action buttons behind the card */}
      <View style={styles.noteActionsContainer}>
        <TouchableOpacity
          style={[styles.noteSwipeAction, styles.noteEditAction]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.noteSwipeAction, styles.noteDeleteAction]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[styles.noteCardAnimatedWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleCardPress}>
          <View style={styles.noteCard}>
            <View style={styles.noteAccent} />
            <Text style={styles.noteText}>{note.text}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const PartnerNotesSection: React.FC<{
  partnerName: string;
  notes: PartnerNote[];
  onAddNotePress: () => void;
  onEditNote: (note: PartnerNote) => void;
  onDeleteNote: (id: string) => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
}> = ({ partnerName, notes, onAddNotePress, onEditNote, onDeleteNote, onSwipeStart, onSwipeEnd }) => (
  <View style={styles.section}>
    <View style={styles.notesSectionHeader}>
      <View style={styles.notesSectionTitleRow}>
        <View style={styles.notesSectionAccent} />
        <View>
          <Text style={styles.sectionTitle}>Little Things About {partnerName}</Text>
          <Text style={styles.sectionSubtitle}>Memories you want to keep</Text>
        </View>
      </View>
    </View>

    {/* Add New Note Button */}
    <LinearGradient
      colors={['#FFFFFF', '#FFFBFB']}
      style={styles.addNoteCardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <TouchableOpacity
        style={styles.addNoteCardInner}
        onPress={onAddNotePress}
        activeOpacity={0.7}
      >
        <Text style={styles.addNotePlaceholder}>Add a note...</Text>
        <View style={styles.addNoteButton}>
          <Ionicons name="add" size={18} color="#E11D48" />
        </View>
      </TouchableOpacity>
    </LinearGradient>

    {/* Existing Notes */}
    {notes.map((note) => (
      <SwipeableNoteCard
        key={note.id}
        note={note}
        onEdit={() => onEditNote(note)}
        onDelete={() => onDeleteNote(note.id)}
        onSwipeStart={onSwipeStart}
        onSwipeEnd={onSwipeEnd}
      />
    ))}
  </View>
);

// Main Component
const RelationshipHomeScreen: React.FC<RelationshipHomeScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();

  // Extract params with defaults
  const partnerName = route.params?.partnerName || 'Your Partner';
  const photoUri = route.params?.photoUri || null;
  const sinceDateParam = route.params?.sinceDate;

  // Parse sinceDate
  const sinceDate = useMemo(() => {
    if (!sinceDateParam) return new Date();
    if (sinceDateParam instanceof Date) return sinceDateParam;
    return new Date(sinceDateParam);
  }, [sinceDateParam]);

  // Calculate duration
  const duration = useMemo(() => calculateDuration(sinceDate), [sinceDate]);

  // State
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [currentPhotoUri, setCurrentPhotoUri] = useState<string | null>(photoUri);
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<PartnerNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);

  // Photo handler
  const handleEditPhoto = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCurrentPhotoUri(result.assets[0].uri);
    }
  };

  // Note handlers
  const handleAddNotePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditingNote(null);
    setNoteContent('');
    setNoteModalVisible(true);
  };

  const handleDeleteNote = (id: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const handleEditNote = (note: PartnerNote) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingNote(note);
    setNoteContent(note.text);
    setNoteModalVisible(true);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (editingNote) {
      // Editing existing note
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id ? { ...n, text: noteContent.trim() } : n
        )
      );
    } else {
      // Adding new note
      const newNote: PartnerNote = {
        id: Date.now().toString(),
        text: noteContent.trim(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }

    setNoteModalVisible(false);
    setNoteContent('');
    setEditingNote(null);
  };


  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
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
        {/* Hero Section */}
        <HeroSection
          photoUri={currentPhotoUri}
          partnerName={partnerName}
          sinceDate={sinceDate}
          duration={duration}
        />

        {/* Date Ideas Section */}
        <DateIdeasSection
          navigation={navigation}
          onSwipeStart={() => setIsSwipingCard(true)}
          onSwipeEnd={() => setIsSwipingCard(false)}
        />

        {/* Relationship Tools Section */}
        <RelationshipToolsSection navigation={navigation} />

        {/* Partner Notes Section */}
        <PartnerNotesSection
          partnerName={partnerName}
          notes={notes}
          onAddNotePress={handleAddNotePress}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          onSwipeStart={() => setIsSwipingCard(true)}
          onSwipeEnd={() => setIsSwipingCard(false)}
        />
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
        <View style={styles.headerContent}>
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
        </View>
      </View>

      {/* Note Modal (Add/Edit) */}
      <Modal
        visible={noteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setNoteModalVisible(false)}
              style={styles.roundButton}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>
            <TouchableOpacity
              onPress={handleSaveNote}
              style={[styles.roundButton, !noteContent.trim() && styles.roundButtonDisabled]}
              disabled={!noteContent.trim()}
            >
              <Ionicons name="checkmark" size={20} color={noteContent.trim() ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalInputContainer}>
            <TextInput
              style={styles.modalTextInput}
              placeholder="Write something you want to remember..."
              placeholderTextColor="#9CA3AF"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
                  navigation.navigate('RelationshipSetup', {
                    isEditMode: true,
                    partnerName: partnerName,
                    sinceDate: sinceDate,
                    photoUri: currentPhotoUri,
                  });
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={18} color="#6B7280" />
                <Text style={styles.dropdownItemText}>Edit Info</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemWithDivider]}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSettingsMenuVisible(false);
                  // TODO: Switch to dating vault
                  console.log('Switch to dating pressed');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="sync-outline" size={18} color="#6B7280" />
                <Text style={styles.dropdownItemText}>Switch to Dating</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Hero Section
  heroSection: {
    marginBottom: 48,
    marginHorizontal: 8,
  },
  heroPhotoContainer: {
    height: 346,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlaceholderIconContainer: {
    position: 'absolute',
    top: '35%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  heroInfoCard: {
    marginTop: -38,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfoLeft: {
    flex: 1,
  },
  partnerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  sinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sinceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E11D48',
    letterSpacing: -0.2,
  },
  heroInfoDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: 14,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationItem: {
    alignItems: 'center',
  },
  durationNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.4,
  },
  durationLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'lowercase',
  },
  durationDot: {
    fontSize: 14,
    fontWeight: '400',
    color: '#D1D5DB',
    marginTop: -3,
  },

  // Quick Action Buttons
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  quickActionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },

  // Section Common
  section: {
    marginBottom: 28,
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
    marginBottom: 16,
  },

  // Date Ideas Section
  dateIdeasSection: {
    marginBottom: 40,
  },
  dateIdeasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateIdeasTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dateIdeasAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#E11D48',
    borderRadius: 2,
    marginTop: 2,
  },
  dateIdeasSubtitle: {
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

  // Relationship Tools Section
  toolsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  toolsSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  toolsSectionAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#E11D48',
    borderRadius: 2,
    marginTop: 2,
  },
  toolsSectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  toolsTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toolsTimerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  toolDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },
  toolChevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Partner Notes Section - Swipeable Cards
  noteCardWrapper: {
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  noteCardAnimatedWrapper: {
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
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
  },
  noteSwipeAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  noteAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#E11D48',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 24,
  },
  notesSectionHeader: {
    marginBottom: 0,
  },
  notesSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  notesSectionAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#E11D48',
    borderRadius: 2,
    marginTop: 2,
  },
  addNoteCardGradient: {
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addNoteCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 12,
    gap: 12,
  },
  addNoteIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addNotePlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  addNoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNoteButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalInputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 24,
    padding: 0,
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

export default RelationshipHomeScreen;
