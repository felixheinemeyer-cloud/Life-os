import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Platform,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface DatingHomeScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface DatingPerson {
  id: string;
  name: string;
  initials: string;
  stage: string;
  source: string;
  lastActivity?: string;
}

interface DateIdea {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface DatingAdvice {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Mock Data
const DATING_CRM_DATA: DatingPerson[] = [
  { id: '1', name: 'Sophie', initials: 'S', stage: 'Texting', source: 'Met on Hinge', lastActivity: '2 days ago' },
  { id: '2', name: 'Emma', initials: 'E', stage: 'First date', source: 'Met at a party', lastActivity: 'Yesterday' },
  { id: '3', name: 'Mia', initials: 'M', stage: 'Matched', source: 'Bumble', lastActivity: '5 hours ago' },
  { id: '4', name: 'Olivia', initials: 'O', stage: 'Texting', source: 'Coffee shop', lastActivity: '1 week ago' },
  { id: '5', name: 'Ava', initials: 'A', stage: 'Second date', source: 'Tinder', lastActivity: '3 days ago' },
];

const DATE_IDEAS: DateIdea[] = [
  { id: '1', title: 'Coffee walk', icon: 'cafe-outline', color: '#92400E' },
  { id: '2', title: 'Museum date', icon: 'color-palette-outline', color: '#7C3AED' },
  { id: '3', title: 'Board games at a bar', icon: 'game-controller-outline', color: '#059669' },
];

const DATING_ADVICE_DATA: DatingAdvice[] = [
  {
    id: '1',
    title: 'Green flags to look for',
    description: 'Signs that someone is emotionally available and ready for connection',
    icon: 'flag-outline',
  },
  {
    id: '2',
    title: 'Questions for deeper conversation',
    description: 'Move beyond small talk and discover what truly matters',
    icon: 'chatbubbles-outline',
  },
  {
    id: '3',
    title: 'Setting healthy boundaries',
    description: 'How to communicate your needs while staying open',
    icon: 'shield-checkmark-outline',
  },
];

// Stage badge colors
const getStageColor = (stage: string): { bg: string; text: string } => {
  switch (stage.toLowerCase()) {
    case 'matched':
      return { bg: '#DBEAFE', text: '#1D4ED8' };
    case 'texting':
      return { bg: '#FEF3C7', text: '#B45309' };
    case 'first date':
      return { bg: '#D1FAE5', text: '#047857' };
    case 'second date':
      return { bg: '#EDE9FE', text: '#6D28D9' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563' };
  }
};

// Carousel constants
const CARD_WIDTH = 180;
const CARD_HEIGHT = 180;
const SIDE_CARD_SCALE = 0.8;
const SIDE_CARD_OFFSET = 112;
const DRAG_THRESHOLD = 150;

// Subcomponents removed - hero section integrated into header

const CRMPreviewSection: React.FC<{
  people: DatingPerson[];
  onSeeAll: () => void;
  animatedStyle: any;
}> = ({ people, onSeeAll, animatedStyle }) => {
  const displayPeople = people.slice(0, 3);

  const handlePersonPress = (person: DatingPerson) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Person selected:', person.name);
  };

  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>People you're talking to</Text>
          <Text style={styles.sectionSubtitle}>Keep track of everyone in one place</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.crmPreviewContainer}>
        {displayPeople.map((person) => {
          const stageColors = getStageColor(person.stage);
          return (
            <TouchableOpacity
              key={person.id}
              style={styles.crmCard}
              onPress={() => handlePersonPress(person)}
              activeOpacity={0.8}
            >
              {/* Avatar */}
              <LinearGradient
                colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
                style={styles.crmAvatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.crmInitials}>{person.initials}</Text>
              </LinearGradient>

              {/* Content */}
              <View style={styles.crmCardContent}>
                <Text style={styles.crmName}>{person.name}</Text>
                <Text style={styles.crmSource}>{person.source}</Text>
              </View>

              {/* Stage Badge */}
              <View style={[styles.stageBadge, { backgroundColor: stageColors.bg }]}>
                <Text style={[styles.stageBadgeText, { color: stageColors.text }]}>{person.stage}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const DateIdeasSection: React.FC<{
  animatedStyle: any;
  navigation?: any;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}> = ({ animatedStyle, navigation, onSwipeStart, onSwipeEnd }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const animatedIndex = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;

  const handleIdeaPress = (idea: DateIdea) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Date idea selected:', idea.title);
  };

  const handleSeeAll = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation?.navigate('DateIdeasList');
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

    const opacity = animatedIndex.interpolate({
      inputRange: [cardIndex - 2, cardIndex - 1, cardIndex, cardIndex + 1, cardIndex + 2],
      outputRange: [0.3, 0.5, 1, 0.5, 0.3],
      extrapolate: 'clamp',
    });

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
    return indices;
  };

  return (
    <Animated.View style={[styles.section, styles.dateIdeasSection, animatedStyle]}>
      <View style={styles.dateIdeasHeader}>
        <View>
          <Text style={styles.sectionTitle}>Date Ideas</Text>
          <Text style={styles.dateIdeasSubtitle}>Low-pressure ideas for your next date</Text>
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
                activeOpacity={0.9}
              >
                <View style={[styles.dateIdeaIcon, { backgroundColor: `${idea.color}15` }]}>
                  <Ionicons name={idea.icon} size={36} color={idea.color} />
                </View>
                <Text style={styles.dateIdeaTitle}>{idea.title}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
};

const DatingAdviceSection: React.FC<{
  advice: DatingAdvice[];
  onAdvicePress: (advice: DatingAdvice) => void;
  animatedStyle: any;
}> = ({ advice, onAdvicePress, animatedStyle }) => {
  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      <View style={styles.adviceSectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Dating Advice</Text>
          <Text style={styles.sectionSubtitle}>Short insights to date more intentionally</Text>
        </View>
      </View>

      {advice.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.adviceCard}
          onPress={() => onAdvicePress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.adviceIconCircle}>
            <Ionicons name={item.icon} size={22} color="#E11D48" />
          </View>
          <View style={styles.adviceContent}>
            <Text style={styles.adviceTitle}>{item.title}</Text>
            <Text style={styles.adviceDescription}>{item.description}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

// Main Component
const DatingHomeScreen: React.FC<DatingHomeScreenProps> = ({ navigation }) => {
  const [isSwipingCard, setIsSwipingCard] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const section1Opacity = useRef(new Animated.Value(0)).current;
  const section1TranslateY = useRef(new Animated.Value(30)).current;
  const section2Opacity = useRef(new Animated.Value(0)).current;
  const section2TranslateY = useRef(new Animated.Value(30)).current;
  const section3Opacity = useRef(new Animated.Value(0)).current;
  const section3TranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
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
      ]),
      // Sections stagger
      Animated.stagger(100, [
        Animated.parallel([
          Animated.timing(section1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(section1TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(section2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(section2TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(section3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(section3TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleSeeAllCRM = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DatingCRM');
  };

  const handleAdvicePress = (advice: DatingAdvice) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DatingAdviceDetail', { advice });
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Dating</Text>
            <Text style={styles.subtitle}>Stay intentional while meeting new people</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!isSwipingCard}
        >
          {/* CRM Preview Section */}
          <CRMPreviewSection
            people={DATING_CRM_DATA}
            onSeeAll={handleSeeAllCRM}
            animatedStyle={{
              opacity: section1Opacity,
              transform: [{ translateY: section1TranslateY }],
            }}
          />

          {/* Date Ideas Section */}
          <DateIdeasSection
            navigation={navigation}
            onSwipeStart={() => setIsSwipingCard(true)}
            onSwipeEnd={() => setIsSwipingCard(false)}
            animatedStyle={{
              opacity: section2Opacity,
              transform: [{ translateY: section2TranslateY }],
            }}
          />

          {/* Dating Advice Section */}
          <DatingAdviceSection
            advice={DATING_ADVICE_DATA}
            onAdvicePress={handleAdvicePress}
            animatedStyle={{
              opacity: section3Opacity,
              transform: [{ translateY: section3TranslateY }],
            }}
          />
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerContent: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Section Common
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 3,
    letterSpacing: -0.1,
  },

  // CRM Preview Section
  crmPreviewContainer: {
    gap: 10,
  },
  crmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  crmAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  crmInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BE123C',
  },
  crmCardContent: {
    flex: 1,
  },
  crmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  crmSource: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Date Ideas Section
  dateIdeasSection: {
    marginBottom: 32,
  },
  dateIdeasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateIdeasSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  carouselContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  carouselCard: {
    position: 'absolute',
    width: 180,
    height: 180,
  },
  dateIdeaCardInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  dateIdeaIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateIdeaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },

  // Dating Advice Section
  adviceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  adviceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});

export default DatingHomeScreen;
