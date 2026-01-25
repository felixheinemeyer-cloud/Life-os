import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PremiumStatsChart from '../components/PremiumStatsChart';
import TodaysPriorityCard from '../components/dashboard/TodaysPriorityCard';
import SwipeableCheckInCard from '../components/dashboard/SwipeableCheckInCard';
import NotificationBell from '../components/notifications/NotificationBell';
import NotificationSection from '../components/notifications/NotificationSection';
import { useStreak } from '../context/StreakContext';
import { useNotifications } from '../context/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

type ChartVariable = 'nutrition' | 'energy' | 'satisfaction' | null;

type PriorityStatus = 'pending' | 'completed' | 'not_completed';

interface DashboardScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
  route?: {
    params?: {
      morningCheckInJustCompleted?: boolean;
      eveningCheckInJustCompleted?: boolean;
      priorityCompleted?: boolean;
      morningPriority?: string;
    };
  };
}

const DashboardScreen = ({ navigation, route }: DashboardScreenProps = {}): React.JSX.Element => {
  // SafeArea insets for dynamic button positioning
  const insets = useSafeAreaInsets();

  // Get streak data from context
  const { streakData } = useStreak();

  // Get notification data from context
  const {
    notifications,
    bannerNotification,
    unreadCount,
    dismiss,
    snooze,
    markAsRead,
  } = useNotifications();

  // State for interactive chart legend - Nutrition is active by default
  const [activeVariable, setActiveVariable] = useState<ChartVariable>('nutrition');

  // State for expandable focus cards
  const [isWeekExpanded, setIsWeekExpanded] = useState(false);
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);

  // Animation values for card glow
  const weekGlowAnim = useRef(new Animated.Value(0)).current;
  const monthGlowAnim = useRef(new Animated.Value(0)).current;

  // Animation values for chevron rotation
  const weekChevronAnim = useRef(new Animated.Value(0)).current;
  const monthChevronAnim = useRef(new Animated.Value(0)).current;

  // Scroll tracking for blur/fade effect
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation values for check-in completion
  const morningAnimPlayed = useRef(false);
  const eveningAnimPlayed = useRef(false);
  const morningScale = useRef(new Animated.Value(1)).current;
  const eveningScale = useRef(new Animated.Value(1)).current;

  // Streak count from context (preview mode shows 14 for testing)
  const PREVIEW_STREAK_MODE = true;
  const streakCount = PREVIEW_STREAK_MODE ? 14 : streakData.currentStreak;

  // Check-in completion states
  // Start as false, will be set to true when returning from MorningTrackingCompleteScreen
  // Resets on app reload (no persistence)
  const [morningCheckInCompleted, setMorningCheckInCompleted] = useState(false);
  const [eveningCheckInCompleted, setEveningCheckInCompleted] = useState(false);

  // Today's priority state (from morning check-in)
  const [todaysPriority, setTodaysPriority] = useState<string | null>(null);
  const [priorityStatus, setPriorityStatus] = useState<PriorityStatus>('pending');

  // Dismissed check-in cards state
  const [dismissedCards, setDismissedCards] = useState<{
    weekly: boolean;
    monthly: boolean;
    bodyCheckIn: boolean;
  }>({ weekly: false, monthly: false, bodyCheckIn: false });

  // 24h timer state (hours since last 12:00 noon Europe/Berlin)
  const [timerHours, setTimerHours] = useState(0);

  // Mock insight data (Frontend only)
  const todaysInsight = {
    title: 'Small steps every day lead to remarkable transformations',
    preview: 'Building sustainable habits starts with consistency, not perfection. When you commit to showing up daily, even in small ways, you create momentum that compounds over time.',
    fullContent: 'Building sustainable habits starts with consistency, not perfection. When you commit to showing up daily, even in small ways, you create momentum that compounds over time.\n\nResearch shows that it takes an average of 66 days to form a new habit. But the real magic happens when you stop focusing on the end goal and start celebrating the process itself.\n\nEvery time you complete your morning routine, track your meals, or take a moment to reflect, you\'re not just checking off a box—you\'re reinforcing your identity as someone who values growth and self-improvement.\n\nRemember: transformation isn\'t about dramatic overnight changes. It\'s about the small, consistent actions that, when stacked together, create the life you want to live.',
    readTime: '3 min read',
    category: 'Mindset',
  };

  // Dynamic greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Check if evening check-in is available (after 5 PM / 17:00)
  const EVENING_CHECKIN_START_HOUR = 17; // 5 PM
  const TESTING_MODE = true; // TODO: Remove after testing
  const isEveningCheckInAvailable = (): boolean => {
    if (TESTING_MODE) return true; // Bypass time check for testing
    const hour = new Date().getHours();
    return hour >= EVENING_CHECKIN_START_HOUR;
  };

  const getHoursUntilEveningCheckIn = (): number => {
    const hour = new Date().getHours();
    if (hour >= EVENING_CHECKIN_START_HOUR) return 0;
    return EVENING_CHECKIN_START_HOUR - hour;
  };

  // Format current date
  const getCurrentDate = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Calculate hours since last 12:00 noon in Europe/Berlin timezone
  const calculateTimerHours = (): number => {
    try {
      const now = new Date();

      // Get all time parts in Berlin timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const berlinTime = {
        year: parseInt(parts.find(p => p.type === 'year')?.value || '0', 10),
        month: parseInt(parts.find(p => p.type === 'month')?.value || '1', 10),
        day: parseInt(parts.find(p => p.type === 'day')?.value || '1', 10),
        hour: parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10),
        minute: parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10),
        second: parseInt(parts.find(p => p.type === 'second')?.value || '0', 10),
      };

      // Calculate current time in Berlin as total minutes since midnight
      const currentMinutes = berlinTime.hour * 60 + berlinTime.minute;
      const midnightMinutes = 24 * 60; // 24:00 (next day's 00:00) = 1440 minutes

      // Calculate hours UNTIL next midnight (12am)
      const minutesUntilMidnight = midnightMinutes - currentMinutes;
      const hoursUntilMidnight = Math.floor(minutesUntilMidnight / 60);

      return hoursUntilMidnight >= 0 && hoursUntilMidnight <= 24 ? hoursUntilMidnight : 0;
    } catch (error) {
      console.error('Error calculating timer hours:', error);
      return 0;
    }
  };

  // Initialize and update timer every minute
  useEffect(() => {
    // Initial calculation
    setTimerHours(calculateTimerHours());

    // Update every minute (60000ms)
    const interval = setInterval(() => {
      setTimerHours(calculateTimerHours());
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Check for check-in completion from navigation params
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.morningCheckInJustCompleted) {
        setMorningCheckInCompleted(true);
        setTodaysPriority("Finish the project proposal and send it to the team"); // Mock priority
      }
      if (route?.params?.eveningCheckInJustCompleted) {
        setEveningCheckInCompleted(true);
        // Restore morning check-in state (since evening check-in implies morning was completed)
        setMorningCheckInCompleted(true);
        if (route?.params?.morningPriority) {
          setTodaysPriority(route.params.morningPriority);
        }
        // Update priority status based on evening check-in result
        if (route?.params?.priorityCompleted !== undefined) {
          setPriorityStatus(route.params.priorityCompleted ? 'completed' : 'not_completed');
        }
      }
    }, [route?.params?.morningCheckInJustCompleted, route?.params?.eveningCheckInJustCompleted, route?.params?.priorityCompleted, route?.params?.morningPriority])
  );

  // Animation trigger for Morning Check-in completion
  useEffect(() => {
    if (morningCheckInCompleted && !morningAnimPlayed.current) {
      morningAnimPlayed.current = true;

      // Start at smaller scale for more dramatic entrance
      morningScale.setValue(0.7);

      // Delay to ensure screen transition is fully complete
      const timer = setTimeout(() => {
        Animated.spring(morningScale, {
          toValue: 1,
          friction: 4, // Lower friction = more visible bounce
          tension: 35, // Low tension = slow, elegant animation
          useNativeDriver: true,
        }).start();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [morningCheckInCompleted]);

  // Animation trigger for Evening Check-in completion
  useEffect(() => {
    if (eveningCheckInCompleted && !eveningAnimPlayed.current) {
      eveningAnimPlayed.current = true;

      eveningScale.setValue(0.7);

      const timer = setTimeout(() => {
        Animated.spring(eveningScale, {
          toValue: 1,
          friction: 4, // Lower friction = more visible bounce
          tension: 35,
          useNativeDriver: true,
        }).start();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [eveningCheckInCompleted]);

  const handleMorningTracking = (): void => {
    if (navigation) {
      navigation.navigate('MorningTracking');
    } else {
      console.log('Navigate to Morning Tracking');
    }
  };

  const handleEveningTracking = (): void => {
    if (navigation) {
      navigation.navigate('EveningTracking');
    } else {
      console.log('Navigate to Evening Tracking');
    }
  };

  const handleWeeklyTracking = (): void => {
    if (navigation) {
      navigation.navigate('WeeklyTracking');
    } else {
      console.log('Navigate to Weekly Tracking');
    }
  };

  const handleMonthlyTracking = (): void => {
    if (navigation) {
      navigation.navigate('MonthlyTracking');
    } else {
      console.log('Navigate to Monthly Tracking');
    }
  };

  const handleMonthlyBodyTracking = (): void => {
    if (navigation) {
      navigation.navigate('MonthlyBodyTracking');
    } else {
      console.log('Navigate to Monthly Body Tracking');
    }
  };

  const handleProfile = (): void => {
    if (navigation) {
      navigation.navigate('ProfileSettings');
    } else {
      console.log('Navigate to Profile Settings');
    }
  };

  const handleStreak = (): void => {
    if (navigation) {
      navigation.navigate('StreakDetails');
    } else {
      console.log('Navigate to Streak Details');
    }
  };

  const handleOpenInsightDetail = (): void => {
    if (navigation) {
      navigation.navigate('InsightDetail');
    } else {
      console.log('Navigate to Insight Detail');
    }
  };

  const handleLegendPress = (variable: ChartVariable): void => {
    // Toggle behavior: tap same variable to return to all active
    if (activeVariable === variable) {
      setActiveVariable(null);
    } else {
      setActiveVariable(variable);
    }
  };

  // Toggle Week card with glow and chevron animation
  const toggleWeek = (): void => {
    const toValue = isWeekExpanded ? 0 : 1;

    Animated.parallel([
      Animated.timing(weekGlowAnim, {
        toValue,
        duration: isWeekExpanded ? 250 : 300,
        easing: isWeekExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
        delay: isWeekExpanded ? 0 : 50,
        useNativeDriver: false,
      }),
      Animated.timing(weekChevronAnim, {
        toValue,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    setIsWeekExpanded(!isWeekExpanded);
  };

  // Toggle Month card with glow and chevron animation
  const toggleMonth = (): void => {
    const toValue = isMonthExpanded ? 0 : 1;

    Animated.parallel([
      Animated.timing(monthGlowAnim, {
        toValue,
        duration: isMonthExpanded ? 250 : 300,
        easing: isMonthExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
        delay: isMonthExpanded ? 0 : 50,
        useNativeDriver: false,
      }),
      Animated.timing(monthChevronAnim, {
        toValue,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    setIsMonthExpanded(!isMonthExpanded);
  };

  // Interpolated rotation for chevrons
  const weekChevronRotation = weekChevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const monthChevronRotation = monthChevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Interpolated shadow values for Week card (Variation A: Soft & Subtle)
  const weekShadowOpacity = weekGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.10],
  });

  const weekShadowRadius = weekGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 12],
  });

  const weekShadowOffsetY = weekGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });

  // Interpolated shadow values for Month card (Variation A: Soft & Subtle)
  const monthShadowOpacity = monthGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.10],
  });

  const monthShadowRadius = monthGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 12],
  });

  const monthShadowOffsetY = monthGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });

  // Fixed button shadow interpolation
  const buttonShadowOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0.05, 0.12],
    extrapolate: 'clamp',
  });

  // Mock data for 7-day statistics (ready for API integration)
  const weekStatistics = {
    nutrition: [6, 7, 8, 7, 6, 8, 9],
    energy: [7, 6, 7, 8, 7, 8, 9],
    satisfaction: [5, 6, 4, 5, 6, 7, 5],
  };

  // Focus content texts
  const FOCUS_CONTENT = {
    week: "Complete all daily routines, maintain consistent sleep schedule, and hit gym targets 4x. Focus on deep work sessions and minimize evening screen time for better recovery.",
    month: "Establish sustainable habits, review and adjust quarterly goals, and build momentum in key focus areas. Prioritize long-term health metrics and professional development milestones.",
  };

  return (
    <View style={styles.container}>
      {/* LAYER 1: Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 }, // Safe area + header height + 24px gap
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Main Actions Section */}
        <View style={styles.actionsSection}>
          {/* Tracking Cards Row */}
          <View style={styles.trackingRow}>
            {/* Morning Tracking Card */}
            <TouchableOpacity
              style={styles.trackingCardTouchable}
              onPress={handleMorningTracking}
              activeOpacity={0.85}
            >
              <View style={styles.trackingCard}>
                {morningCheckInCompleted ? (
                  // Completed state - green ring with sun icon (success transformation)
                  <Animated.View style={[
                    styles.trackingIconCompletedRingWrapper,
                    { transform: [{ scale: morningScale }] }
                  ]}>
                    <LinearGradient
                      colors={['#34D399', '#10B981', '#059669']}
                      style={styles.trackingIconGradientRing}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.trackingIconInnerCircle}>
                        <Ionicons name="sunny" size={44} color="#059669" />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                ) : (
                  // Available state - orange gradient ring with sun
                  <LinearGradient
                    colors={['#FBBF24', '#F59E0B', '#D97706']}
                    style={styles.trackingIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.trackingIconInnerCircle}>
                      <Ionicons name="sunny" size={44} color="#D97706" />
                    </View>
                  </LinearGradient>
                )}
                <Text style={styles.lightCardTitle}>Morning{'\n'}Check-In</Text>
              </View>
            </TouchableOpacity>

            {/* Evening Tracking Card */}
            <TouchableOpacity
              style={styles.trackingCardTouchable}
              onPress={eveningCheckInCompleted || isEveningCheckInAvailable() ? handleEveningTracking : undefined}
              activeOpacity={eveningCheckInCompleted || isEveningCheckInAvailable() ? 0.85 : 1}
              disabled={!eveningCheckInCompleted && !isEveningCheckInAvailable()}
            >
              <View style={[
                styles.trackingCard,
                !eveningCheckInCompleted && !isEveningCheckInAvailable() && styles.trackingCardLocked
              ]}>
                {/* Icon with state-dependent appearance */}
                {eveningCheckInCompleted ? (
                  // Completed state - green ring with moon icon (success transformation)
                  <Animated.View style={[
                    styles.trackingIconCompletedRingWrapper,
                    { transform: [{ scale: eveningScale }] }
                  ]}>
                    <LinearGradient
                      colors={['#34D399', '#10B981', '#059669']}
                      style={styles.trackingIconGradientRing}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.trackingIconInnerCircle}>
                        <Ionicons name="moon" size={44} color="#059669" />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                ) : isEveningCheckInAvailable() ? (
                  // Available state - purple gradient
                  <LinearGradient
                    colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                    style={styles.trackingIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.trackingIconInnerCircle}>
                      <Ionicons name="moon" size={44} color="#7C3AED" />
                    </View>
                  </LinearGradient>
                ) : (
                  // Locked state - same ring structure as Morning, muted colors
                  <LinearGradient
                    colors={['#E9E5FF', '#DDD6FE', '#C4B5FD']}
                    style={styles.trackingIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.trackingIconInnerCircle}>
                      <Ionicons name="moon" size={44} color="#B4A7DE" />
                    </View>
                  </LinearGradient>
                )}
                {!eveningCheckInCompleted && !isEveningCheckInAvailable() ? (
                  <Text style={[styles.lightCardTitle, styles.lightCardTitleLocked]}>
                    Evening{'\n'}<Text style={styles.timeInTitle}>in {getHoursUntilEveningCheckIn()}h</Text>
                  </Text>
                ) : (
                  <Text style={styles.lightCardTitle}>Evening{'\n'}Check-In</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Today's Priority Card - Display Only */}
          {todaysPriority && (
            <TodaysPriorityCard
              priority={todaysPriority}
              morningCheckInCompleted={morningCheckInCompleted}
              status={priorityStatus}
            />
          )}

          {/* Weekly Check-In Card */}
          {!dismissedCards.weekly && (
            <SwipeableCheckInCard
              cardHeight={88}
              marginBottom={12}
              onDismiss={() => setDismissedCards(prev => ({ ...prev, weekly: true }))}
            >
              <TouchableOpacity
                style={styles.weeklyCardSwipeable}
                onPress={handleWeeklyTracking}
                activeOpacity={0.85}
              >
                <View style={styles.weeklyCard}>
                  {/* Icon with gradient ring */}
                  <LinearGradient
                    colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                    style={styles.weeklyIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.weeklyIconInnerCircle}>
                      <Ionicons name="calendar" size={28} color="#0D9488" />
                    </View>
                  </LinearGradient>
                  {/* Text content */}
                  <View style={styles.weeklyTextContainer}>
                    <Text style={styles.weeklyCardTitle}>Weekly Check-In</Text>
                    <Text style={styles.weeklyCardSubtitle}>Reflect on your week</Text>
                  </View>
                  {/* Chevron indicator */}
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.weeklyChevron} />
                </View>
              </TouchableOpacity>
            </SwipeableCheckInCard>
          )}

          {/* Monthly Check-In Card */}
          {!dismissedCards.monthly && (
            <SwipeableCheckInCard
              cardHeight={88}
              marginBottom={12}
              onDismiss={() => setDismissedCards(prev => ({ ...prev, monthly: true }))}
            >
              <TouchableOpacity
                style={styles.monthlyCardSwipeable}
                onPress={handleMonthlyTracking}
                activeOpacity={0.85}
              >
                <View style={styles.monthlyCard}>
                  {/* Icon with gradient ring */}
                  <LinearGradient
                    colors={['#FBCFE8', '#F472B6', '#DB2777']}
                    style={styles.monthlyIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.monthlyIconInnerCircle}>
                      <Ionicons name="calendar-outline" size={28} color="#DB2777" />
                    </View>
                  </LinearGradient>
                  {/* Text content */}
                  <View style={styles.monthlyTextContainer}>
                    <Text style={styles.monthlyCardTitle}>Monthly Check-In</Text>
                    <Text style={styles.monthlyCardSubtitle}>Review your month</Text>
                  </View>
                  {/* Chevron indicator */}
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.monthlyChevron} />
                </View>
              </TouchableOpacity>
            </SwipeableCheckInCard>
          )}

          {/* Monthly Body Check-In Card */}
          {!dismissedCards.bodyCheckIn && (
            <SwipeableCheckInCard
              cardHeight={88}
              marginBottom={24}
              onDismiss={() => setDismissedCards(prev => ({ ...prev, bodyCheckIn: true }))}
            >
              <TouchableOpacity
                style={styles.bodyCheckInCardSwipeable}
                onPress={handleMonthlyBodyTracking}
                activeOpacity={0.85}
              >
                <View style={styles.bodyCheckInCard}>
                  {/* Icon with gradient ring */}
                  <LinearGradient
                    colors={['#BAE6FD', '#38BDF8', '#0EA5E9']}
                    style={styles.bodyCheckInIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.bodyCheckInIconInnerCircle}>
                      <Ionicons name="body" size={28} color="#0EA5E9" />
                    </View>
                  </LinearGradient>
                  {/* Text content */}
                  <View style={styles.bodyCheckInTextContainer}>
                    <Text style={styles.bodyCheckInCardTitle}>Monthly Body Check-In</Text>
                    <Text style={styles.bodyCheckInCardSubtitle}>Track your physical progress</Text>
                  </View>
                  {/* Chevron indicator */}
                  <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.bodyCheckInChevron} />
                </View>
              </TouchableOpacity>
            </SwipeableCheckInCard>
          )}

          {/* Notifications Section */}
          <NotificationSection
            notifications={notifications}
            onNotificationPress={(notification) => {
              markAsRead(notification.id);
              // TODO: Navigate to contact detail
            }}
            onDismiss={(id) => dismiss(id)}
          />

          {/* Today's Insight Section */}
          <View style={styles.insightSection}>
            <LinearGradient
              colors={['#FFFBEB', '#FEF3C7', '#FECACA']}
              style={styles.insightSectionCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Header */}
              <View style={styles.insightSectionHeader}>
                <Text style={styles.insightSectionTitle}>Daily Insight</Text>
              </View>

              {/* Insight Preview Card */}
              <TouchableOpacity
                style={styles.insightPreview}
                onPress={handleOpenInsightDetail}
                activeOpacity={0.8}
              >
                <View style={styles.insightPreviewContent}>
                  {/* Category Badge */}
                  <View style={styles.insightCategoryBadge}>
                    <Ionicons name="diamond-outline" size={11} color="#D97706" />
                    <Text style={styles.insightCategoryText}>{todaysInsight.category.toUpperCase()}</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.insightPreviewTitle} numberOfLines={2}>
                    {todaysInsight.title}
                  </Text>

                  {/* Meta Row */}
                  <View style={styles.insightMetaRow}>
                    <View style={styles.insightMetaItem}>
                      <Ionicons name="time-outline" size={13} color="#D97706" />
                      <Text style={styles.insightMetaText}>{todaysInsight.readTime}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D97706" style={styles.insightArrow} />
              </TouchableOpacity>

              {/* Timer Indicator - Original Design (Bottom Right) */}
              <View style={styles.timerIndicator}>
                <Ionicons name="hourglass-outline" size={16} color="#92400E" />
                <Text style={styles.timerText}>{timerHours}h</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Statistics Preview Card - Light Mode */}
          <View style={styles.statisticsPreviewCard}>
            {/* Header Row */}
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Last 7 Days</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation?.navigate('Statistics')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllLink}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Interactive Legend Row */}
            <View style={styles.statsLegend}>
              {/* Nutrition Button */}
              <TouchableOpacity
                style={styles.legendButton}
                onPress={() => handleLegendPress('nutrition')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.legendItem,
                    activeVariable === 'nutrition' && {
                      backgroundColor: '#F0FDF4',
                      borderColor: '#86EFAC',
                    },
                  ]}
                >
                  <View style={[styles.gradientDot, { backgroundColor: '#10B981' }]} />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'nutrition' && { color: '#059669', fontWeight: '600' },
                    ]}
                  >
                    Nutrition
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Energy Button */}
              <TouchableOpacity
                style={styles.legendButton}
                onPress={() => handleLegendPress('energy')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.legendItem,
                    activeVariable === 'energy' && {
                      backgroundColor: '#FFFBEB',
                      borderColor: '#FCD34D',
                    },
                  ]}
                >
                  <View style={[styles.gradientDot, { backgroundColor: '#F59E0B' }]} />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'energy' && { color: '#D97706', fontWeight: '600' },
                    ]}
                  >
                    Energy
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Satisfaction Button */}
              <TouchableOpacity
                style={styles.legendButton}
                onPress={() => handleLegendPress('satisfaction')}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.legendItem,
                    activeVariable === 'satisfaction' && {
                      backgroundColor: '#EFF6FF',
                      borderColor: '#93C5FD',
                    },
                  ]}
                >
                  <View style={[styles.gradientDot, { backgroundColor: '#3B82F6' }]} />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'satisfaction' && { color: '#2563EB', fontWeight: '600' },
                    ]}
                  >
                    Satisfaction
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Premium Custom Chart */}
            <PremiumStatsChart
              data={weekStatistics}
              activeVariable={activeVariable}
            />
          </View>
        </View>

        {/* Focus Section - Clean Design */}
        <View style={styles.focusSection}>
          <View style={styles.focusCard}>
            {/* Section Header */}
            <Text style={styles.focusSectionTitle}>Focus</Text>

            {/* Week Focus Item */}
            <TouchableOpacity
              style={styles.focusItem}
              onPress={toggleWeek}
              activeOpacity={0.7}
            >
              <View style={styles.focusItemHeader}>
                <LinearGradient
                  colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                  style={styles.focusIconGradientRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.focusIconInner}>
                    <Ionicons name="calendar" size={16} color="#0D9488" />
                  </View>
                </LinearGradient>
                <Text style={styles.focusItemTitle}>This Week</Text>
                <Animated.View style={{ transform: [{ rotate: weekChevronRotation }] }}>
                  <Ionicons name="chevron-down" size={18} color="#D1D5DB" />
                </Animated.View>
              </View>

              {/* Content with Preview */}
              <View style={styles.focusItemBody}>
                <Text
                  style={styles.focusItemText}
                  numberOfLines={isWeekExpanded ? undefined : 2}
                >
                  {FOCUS_CONTENT.week}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.focusDivider} />

            {/* Month Focus Item */}
            <TouchableOpacity
              style={styles.focusItem}
              onPress={toggleMonth}
              activeOpacity={0.7}
            >
              <View style={styles.focusItemHeader}>
                <LinearGradient
                  colors={['#FBCFE8', '#F472B6', '#DB2777']}
                  style={styles.focusIconGradientRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.focusIconInner}>
                    <Ionicons name="calendar" size={16} color="#DB2777" />
                  </View>
                </LinearGradient>
                <Text style={styles.focusItemTitle}>This Month</Text>
                <Animated.View style={{ transform: [{ rotate: monthChevronRotation }] }}>
                  <Ionicons name="chevron-down" size={18} color="#D1D5DB" />
                </Animated.View>
              </View>

              {/* Content with Preview */}
              <View style={styles.focusItemBody}>
                <Text
                  style={styles.focusItemText}
                  numberOfLines={isMonthExpanded ? undefined : 2}
                >
                  {FOCUS_CONTENT.month}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Fixed Header with Blur Gradient */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background - light veil effect */}
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

        {/* Header Content - Single row with greeting centered between buttons */}
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            {/* Left: Streak Button */}
            <TouchableOpacity
              style={styles.streakButton}
              onPress={handleStreak}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={18} color="#F59E0B" />
              <Text style={styles.streakNumber}>{streakCount}</Text>
            </TouchableOpacity>

            {/* Right: Notification Bell + Profile Button */}
            <View style={styles.headerRightButtons}>
              <NotificationBell
                unreadCount={unreadCount}
                onPress={() => navigation?.navigate('Notifications')}
              />
              <TouchableOpacity
                style={styles.profileButton}
                onPress={handleProfile}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center: Greeting - Absolutely positioned for true center */}
          <Text style={styles.greeting} numberOfLines={1} pointerEvents="none">
            {getGreeting()}!
          </Text>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  fixedHeader: {
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
    height: 120,
  },
  headerInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'relative',
    height: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // LAYER 2: Fixed Button HUD Styles
  fixedButtonHUD: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  fixedButtonsRow: {
    position: 'absolute',
    // top is applied dynamically via inline style: insets.top + 8
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16, // 16px from screen edges (matches Dashboard cards and Knowledge Hub)
  },

  greeting: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    fontSize: 19,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.85,
  },
  streakButton: {
    minWidth: 64,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionsSection: {
    paddingHorizontal: 16, // Distance from screen edges to cards (matches Knowledge Hub)
  },
  trackingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  trackingCardTouchable: {
    flex: 1,
  },
  trackingCard: {
    aspectRatio: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  trackingIconGradientRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingIconInnerCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingIconCompletedRingWrapper: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  trackingIconInactiveRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  // Locked Evening Card Styles
  trackingCardLocked: {
    backgroundColor: '#FDFCFE',
  },
  lightCardTitleLocked: {
    color: '#A8A8B3',
  },
  timeInTitle: {
    color: '#9D8EC9',
    fontWeight: '500',
  },
  lightCardTitleInactive: {
    color: '#9CA3AF',
  },
  // Weekly Check-In Card Styles
  weeklyCardTouchable: {
    marginBottom: 12,
  },
  weeklyCardSwipeable: {
    flex: 1,
    height: '100%',
  },
  weeklyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  weeklyIconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyIconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  weeklyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  weeklyCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0D9488',
    opacity: 0.85,
  },
  weeklyChevron: {
    opacity: 0.6,
    marginLeft: 8,
  },
  // Monthly Check-In Card Styles
  monthlyCardTouchable: {
    marginBottom: 12,
  },
  monthlyCardSwipeable: {
    flex: 1,
    height: '100%',
  },
  monthlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  monthlyIconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthlyIconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthlyTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  monthlyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  monthlyCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DB2777',
    opacity: 0.85,
  },
  monthlyChevron: {
    opacity: 0.6,
    marginLeft: 8,
  },
  // Monthly Body Check-In Card Styles
  bodyCheckInCardTouchable: {
    marginBottom: 24,
  },
  bodyCheckInCardSwipeable: {
    flex: 1,
    height: '100%',
  },
  bodyCheckInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  bodyCheckInIconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyCheckInIconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyCheckInTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  bodyCheckInCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  bodyCheckInCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0EA5E9',
    opacity: 0.85,
  },
  bodyCheckInChevron: {
    opacity: 0.6,
    marginLeft: 8,
  },
  darkCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    textAlign: 'center',
    lineHeight: 20,
  },
  lightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 20,
  },
  morningCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E', // Deep amber-brown for contrast on warm gradient
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  eveningCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#581C87', // Deep purple for contrast on cool gradient
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  morningPill: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#D97706', // Dark amber
    backgroundColor: 'rgba(217, 119, 6, 0.08)', // 8% amber tint
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  morningPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706', // Dark amber
    textAlign: 'center',
  },
  eveningPill: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#6B21A8', // Deep purple
    backgroundColor: 'rgba(107, 33, 168, 0.08)', // 8% purple tint
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eveningPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B21A8', // Deep purple
    textAlign: 'center',
  },
  cardTouchable: {
    marginBottom: 16,
  },

  // Today's Insight Section Styles (Redesigned)
  insightSection: {
    marginBottom: 24,
  },
  insightSectionCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  insightSectionHeader: {
    marginBottom: 16,
  },
  insightSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  insightSectionDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  insightPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  insightPreviewContent: {
    flex: 1,
    marginRight: 12,
  },
  insightCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  insightCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.8,
  },
  insightPreviewTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.4,
    lineHeight: 22,
    marginBottom: 10,
  },
  insightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
    opacity: 0.85,
  },
  insightArrow: {
    opacity: 0.6,
  },
  insightPreviewBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 19,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  insightPreviewReadTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D97706',
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  timerIndicator: {
    position: 'absolute',
    top: 22,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: -0.2,
  },
  statisticsPreviewCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 2,
  },
  statsLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    gap: 6,
  },
  legendButton: {
    // Touchable wrapper for legend items
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  gradientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Focus Section - Clean Design
  focusSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  focusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  focusSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  focusItem: {
    paddingVertical: 4,
  },
  focusItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  focusIconGradientRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 0,
  },
  focusIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusIconWeek: {
    backgroundColor: '#F0FDFA',
  },
  focusIconMonth: {
    backgroundColor: '#F5F3FF',
  },
  focusItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  focusItemBody: {
    marginTop: 16,
  },
  focusItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  focusReadMore: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
    marginTop: 6,
  },
  focusDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default DashboardScreen;
