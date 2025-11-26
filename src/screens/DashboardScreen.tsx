import React, { useState, useRef, useEffect } from 'react';
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

type ChartVariable = 'nutrition' | 'energy' | 'satisfaction' | null;

interface DashboardScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
}

const DashboardScreen = ({ navigation }: DashboardScreenProps = {}): React.JSX.Element => {
  // SafeArea insets for dynamic button positioning
  const insets = useSafeAreaInsets();

  // State for interactive chart legend - Nutrition is active by default
  const [activeVariable, setActiveVariable] = useState<ChartVariable>('nutrition');

  // State for expandable focus cards
  const [isWeekExpanded, setIsWeekExpanded] = useState(false);
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);

  // Animation values for card glow
  const weekGlowAnim = useRef(new Animated.Value(0)).current;
  const monthGlowAnim = useRef(new Animated.Value(0)).current;

  // Scroll tracking for blur/fade effect
  const scrollY = useRef(new Animated.Value(0)).current;

  // Streak count (placeholder - will be dynamic later)
  const [streakCount] = useState(0);

  // 24h timer state (hours since last 12:00 noon Europe/Berlin)
  const [timerHours, setTimerHours] = useState(0);

  // Mock messages data (Frontend only - no backend integration)
  const mockMessages = [
    {
      id: 1,
      subject: 'Weekly Progress Summary',
      body: 'Great work this week! You completed 5 out of 7 daily check-ins and maintained a consistent sleep schedule.',
      sender: 'Life OS',
      date: '2 hours ago',
      isRead: false,
      type: 'summary',
    },
    {
      id: 2,
      subject: 'Reflection Reminder',
      body: "Don't forget to complete your weekly reflection. It's a great way to track your progress!",
      sender: 'Life OS',
      date: '5 hours ago',
      isRead: false,
      type: 'reminder',
    },
    {
      id: 3,
      subject: 'New Insight Available',
      body: 'Based on your tracking patterns, we noticed you perform best when you exercise in the morning.',
      sender: 'Life OS',
      date: 'Yesterday',
      isRead: true,
      type: 'insight',
    },
    {
      id: 4,
      subject: 'Streak Milestone',
      body: 'Congratulations on maintaining your daily tracking streak for 7 days!',
      sender: 'Life OS',
      date: '2 days ago',
      isRead: true,
      type: 'achievement',
    },
  ];

  const unreadCount = mockMessages.filter(m => !m.isRead).length;
  const newestMessage = mockMessages[0];

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

  const handleMorningTracking = (): void => {
    if (navigation) {
      navigation.navigate('MorningTracking');
    } else {
      console.log('Navigate to Morning Tracking');
    }
  };

  const handleEveningTracking = (): void => {
    if (navigation) {
      navigation.navigate('EveningTrackingPriority');
    } else {
      console.log('Navigate to Evening Tracking');
    }
  };

  const handleStatistics = (): void => {
    // TODO: Navigate to statistics screen
    console.log('Navigate to Statistics');
  };

  const handleProfile = (): void => {
    // TODO: Navigate to profile/settings screen
    console.log('Navigate to Profile');
  };

  const handleStreak = (): void => {
    // TODO: Navigate to streak details/history screen
    console.log('Navigate to Streak Details');
  };

  const handleOpenInbox = (): void => {
    if (navigation) {
      navigation.navigate('Inbox');
    } else {
      console.log('Navigate to Inbox');
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

  // Toggle Week card with glow animation
  const toggleWeek = (): void => {
    const toValue = isWeekExpanded ? 0 : 1;

    Animated.timing(weekGlowAnim, {
      toValue,
      duration: isWeekExpanded ? 250 : 300,
      easing: isWeekExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
      delay: isWeekExpanded ? 0 : 50,
      useNativeDriver: false,
    }).start();

    setIsWeekExpanded(!isWeekExpanded);
  };

  // Toggle Month card with glow animation
  const toggleMonth = (): void => {
    const toValue = isMonthExpanded ? 0 : 1;

    Animated.timing(monthGlowAnim, {
      toValue,
      duration: isMonthExpanded ? 250 : 300,
      easing: isMonthExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
      delay: isMonthExpanded ? 0 : 50,
      useNativeDriver: false,
    }).start();

    setIsMonthExpanded(!isMonthExpanded);
  };

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
    <SafeAreaView style={styles.safeArea}>
      {/* LAYER 1: Scrollable Content */}
      <Animated.ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Header Section (SCROLLABLE) */}
        <View style={styles.header}>
          {/* Button row */}
          <View style={styles.headerContent}>
            {/* Left: Streak Button */}
            <TouchableOpacity
              style={styles.streakButton}
              onPress={handleStreak}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={18} color="#F59E0B" />
              <Text style={styles.streakNumber}>{streakCount}</Text>
            </TouchableOpacity>

            {/* Right: Profile Button */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfile}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Greeting (centered, as in original) */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting} numberOfLines={1}>
              {getGreeting()}!
            </Text>
            <Text style={styles.date}>{getCurrentDate()}</Text>
          </View>
        </View>

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
                {/* Glowing icon circle with gradient ring */}
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
                <Text style={styles.lightCardTitle}>Morning{'\n'}Check-In</Text>
              </View>
            </TouchableOpacity>

            {/* Evening Tracking Card */}
            <TouchableOpacity
              style={styles.trackingCardTouchable}
              onPress={handleEveningTracking}
              activeOpacity={0.85}
            >
              <View style={styles.trackingCard}>
                {/* Glowing icon circle with gradient ring */}
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
                <Text style={styles.lightCardTitle}>Evening{'\n'}Check-In</Text>
              </View>
            </TouchableOpacity>
          </View>

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
              <TouchableOpacity onPress={handleStatistics} style={styles.seeAllButton}>
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
                <Animated.View
                  style={[
                    styles.legendItem,
                    {
                      transform: [{ scale: activeVariable === 'nutrition' ? 1.05 : 1.0 }],
                      backgroundColor: activeVariable === 'nutrition'
                        ? '#EEF2FF'
                        : 'transparent',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#059669', '#34D399']}
                    style={styles.gradientDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'nutrition' && styles.legendLabelActive,
                    ]}
                  >
                    Nutrition
                  </Text>
                </Animated.View>
              </TouchableOpacity>

              {/* Energy Button */}
              <TouchableOpacity
                style={styles.legendButton}
                onPress={() => handleLegendPress('energy')}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.legendItem,
                    {
                      transform: [{ scale: activeVariable === 'energy' ? 1.05 : 1.0 }],
                      backgroundColor: activeVariable === 'energy'
                        ? '#EEF2FF'
                        : 'transparent',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#D97706', '#FBBF24']}
                    style={styles.gradientDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'energy' && styles.legendLabelActive,
                    ]}
                  >
                    Energy
                  </Text>
                </Animated.View>
              </TouchableOpacity>

              {/* Satisfaction Button */}
              <TouchableOpacity
                style={styles.legendButton}
                onPress={() => handleLegendPress('satisfaction')}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.legendItem,
                    {
                      transform: [{ scale: activeVariable === 'satisfaction' ? 1.05 : 1.0 }],
                      backgroundColor: activeVariable === 'satisfaction'
                        ? '#EEF2FF'
                        : 'transparent',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#60A5FA']}
                    style={styles.gradientDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'satisfaction' && styles.legendLabelActive,
                    ]}
                  >
                    Satisfaction
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Premium Custom Chart */}
            <PremiumStatsChart
              data={weekStatistics}
              activeVariable={activeVariable}
            />
          </View>
        </View>

        {/* Focus Section - Premium Design */}
        <View style={styles.recapSection}>
          <View style={styles.recapOuterCard}>
            {/* Section Header */}
            <Text style={styles.recapTitle}>Focus</Text>

            {/* Week Container - Premium Gradient Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleWeek}
            style={styles.recapCardTouchable}
          >
            <Animated.View
              style={[
                styles.recapCardShadow,
                {
                  shadowOpacity: weekShadowOpacity,
                  shadowRadius: weekShadowRadius,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: weekShadowOffsetY },
                },
              ]}
            >
              <View
                style={[styles.recapCard, { backgroundColor: '#EEF2FF' }]}
              >
                {/* Status Chip */}
                <View style={styles.recapStatusChip}>
                  <Text style={styles.weekLabel}>Week</Text>
                </View>

                {/* Body Text */}
                <Text
                  style={styles.recapText}
                  numberOfLines={isWeekExpanded ? undefined : 2}
                >
                  {FOCUS_CONTENT.week}
                </Text>

                {/* View More Button - Minimal Text Style */}
                <View style={styles.viewMoreButton}>
                  <Text style={[styles.viewMoreButtonText, styles.weekButtonText]}>
                    {isWeekExpanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Ionicons
                    name={isWeekExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#6366F1"
                    style={styles.viewMoreArrow}
                  />
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Month Container - Premium Gradient Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleMonth}
            style={styles.recapCardTouchable}
          >
            <Animated.View
              style={[
                styles.recapCardShadow,
                {
                  shadowOpacity: monthShadowOpacity,
                  shadowRadius: monthShadowRadius,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: monthShadowOffsetY },
                },
              ]}
            >
              <View
                style={[styles.recapCard, { backgroundColor: '#EEF2FF' }]}
              >
                {/* Status Chip */}
                <View style={styles.recapStatusChip}>
                  <Text style={styles.monthLabel}>Month</Text>
                </View>

                {/* Body Text */}
                <Text
                  style={styles.recapText}
                  numberOfLines={isMonthExpanded ? undefined : 2}
                >
                  {FOCUS_CONTENT.month}
                </Text>

                {/* View More Button - Minimal Text Style */}
                <View style={styles.viewMoreButton}>
                  <Text style={[styles.viewMoreButtonText, styles.monthButtonText]}>
                    {isMonthExpanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Ionicons
                    name={isMonthExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#6366F1"
                    style={styles.viewMoreArrow}
                  />
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
          </View>
        </View>

        {/* Messages Section */}
        <View style={styles.messagesSection}>
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF', '#DDD6FE']}
            style={styles.messagesCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.messagesHeader}>
              <Text style={styles.messagesTitle}>Messages</Text>
              <Text style={styles.messagesSubtitle}>Stay updated with insights</Text>
            </View>

            {/* Newest Message Preview */}
            <TouchableOpacity
              style={styles.messagePreview}
              onPress={handleOpenInbox}
              activeOpacity={0.8}
            >
              <View style={styles.messagePreviewContent}>
                <View style={styles.messagePreviewHeader}>
                  <Text style={styles.messagePreviewSubject} numberOfLines={1}>
                    {newestMessage.subject}
                  </Text>
                  {!newestMessage.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.messagePreviewBody} numberOfLines={2}>
                  {newestMessage.body}
                </Text>
                <Text style={styles.messagePreviewDate}>{newestMessage.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6366F1" />
            </TouchableOpacity>

            {/* Unread Counter or Empty State */}
            {unreadCount > 1 ? (
              <View style={styles.unreadCounter}>
                <Ionicons name="mail-unread-outline" size={16} color="#6366F1" />
                <Text style={styles.unreadCounterText}>
                  +{unreadCount - 1} more unread {unreadCount - 1 === 1 ? 'message' : 'messages'}
                </Text>
              </View>
            ) : unreadCount === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>You're all caught up ✨</Text>
              </View>
            ) : null}

            {/* Open Inbox Button */}
            <TouchableOpacity
              style={styles.inboxButton}
              onPress={handleOpenInbox}
              activeOpacity={0.7}
            >
              <Text style={styles.inboxButtonText}>Open Inbox</Text>
              <Ionicons name="arrow-forward" size={16} color="#6366F1" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
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

  // LAYER 1: Scrollable Header (matches original layout exactly)
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
    marginTop: -8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingContainer: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  greeting: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 24,
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
    marginTop: 16,
  },
  trackingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  trackingCardTouchable: {
    flex: 1,
  },
  trackingCard: {
    aspectRatio: 1,
    borderRadius: 16,
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
    marginBottom: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
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
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 3,
    letterSpacing: -0.1,
  },
  statsLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
    paddingHorizontal: 8,
  },
  legendButton: {
    // Touchable wrapper for legend items
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    // Active state styling applied inline via Animated.View
  },
  gradientDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  legendLabelActive: {
    fontWeight: '700',
    // Color set inline per variable
  },
  // Recap Section - Premium Design
  recapSection: {
    paddingHorizontal: 16, // Distance from screen edges to recap cards (matches Knowledge Hub)
    marginTop: 16,
  },
  recapOuterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  recapTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 18, // Adjusted spacing after removing subheader
    letterSpacing: -0.3,
  },
  recapCardTouchable: {
    marginBottom: 14,
  },
  recapCardShadow: {
    // Shadow wrapper for animated shadow effects
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  recapCard: {
    // Gradient card container
    borderRadius: 18,
    padding: 20,
    minHeight: 100,
    overflow: 'hidden',
  },
  recapStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  recapIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  weekIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  monthIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  focusNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  recapText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  viewMoreButtonText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  viewMoreArrow: {
    marginLeft: 4,
  },
  weekButtonText: {
    color: '#6366F1',
  },
  monthButtonText: {
    color: '#6366F1',
  },
  bottomSpacer: {
    height: 40,
  },

  // Messages Section Styles
  messagesSection: {
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 20,
  },
  messagesCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  messagesHeader: {
    marginBottom: 16,
  },
  messagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4C1D95',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  messagesSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
    opacity: 0.7,
  },
  messagePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  messagePreviewContent: {
    flex: 1,
    marginRight: 12,
  },
  messagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messagePreviewSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4C1D95',
    flex: 1,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginLeft: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  messagePreviewBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#5B21B6',
    lineHeight: 18,
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  messagePreviewDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    opacity: 0.65,
  },
  unreadCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  unreadCounterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  emptyState: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    opacity: 0.8,
  },
  inboxButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inboxButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    letterSpacing: -0.1,
  },
});

export default DashboardScreen;
