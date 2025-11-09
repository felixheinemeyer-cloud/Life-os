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

type ChartVariable = 'sleep' | 'nutrition' | 'wellbeing' | null;

const DashboardScreen = (): React.JSX.Element => {
  // SafeArea insets for dynamic button positioning
  const insets = useSafeAreaInsets();

  // State for interactive chart legend - Sleep is active by default
  const [activeVariable, setActiveVariable] = useState<ChartVariable>('sleep');

  // State for expandable recap cards
  const [isGoodExpanded, setIsGoodExpanded] = useState(false);
  const [isImprovableExpanded, setIsImprovableExpanded] = useState(false);

  // Animation values for card glow
  const goodGlowAnim = useRef(new Animated.Value(0)).current;
  const improvableGlowAnim = useRef(new Animated.Value(0)).current;

  // Scroll tracking for blur/fade effect
  const scrollY = useRef(new Animated.Value(0)).current;

  // Streak count (placeholder - will be dynamic later)
  const [streakCount] = useState(0);

  // Flippable insight card state
  const [isInsightFlipped, setIsInsightFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [hasNewMessages] = useState(true); // TODO: Make this dynamic based on actual messages

  // 24h timer state (hours since last 12:00 noon Europe/Berlin)
  const [timerHours, setTimerHours] = useState(0);

  // Message navigation state
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Mock messages data (TODO: Replace with real data from API)
  const messages = [
    {
      id: 1,
      subject: 'Weekly Progress Summary',
      body: 'Great work this week! You completed 5 out of 7 daily check-ins and maintained a consistent sleep schedule. Keep up the momentum!',
      date: '2 hours ago',
      isRead: false,
      type: 'summary',
    },
    {
      id: 2,
      subject: 'Hydration Reminder',
      body: "You've been doing well with your water intake, but today's goal hasn't been met yet. Remember to drink more water throughout the day!",
      date: '5 hours ago',
      isRead: true,
      type: 'reminder',
    },
    {
      id: 3,
      subject: 'New Insight Available',
      body: 'Based on your tracking patterns, we noticed you perform best when you exercise in the morning. Consider scheduling workouts earlier in the day.',
      date: 'Yesterday',
      isRead: true,
      type: 'insight',
    },
  ];

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
    // TODO: Navigate to morning tracking screen
    console.log('Navigate to Morning Tracking');
  };

  const handleEveningTracking = (): void => {
    // TODO: Navigate to evening tracking screen
    console.log('Navigate to Evening Tracking');
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

  const handleLegendPress = (variable: ChartVariable): void => {
    // Toggle behavior: tap same variable to return to all active
    if (activeVariable === variable) {
      setActiveVariable(null);
    } else {
      setActiveVariable(variable);
    }
  };

  const handleFlipInsightCard = (): void => {
    const toValue = isInsightFlipped ? 0 : 1;

    Animated.spring(flipAnimation, {
      toValue,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setIsInsightFlipped(!isInsightFlipped);

    // Reset message selection when flipping back to front
    if (isInsightFlipped) {
      setSelectedMessage(null);
    }
  };

  // Toggle Good card with glow animation
  const toggleGood = (): void => {
    const toValue = isGoodExpanded ? 0 : 1;

    Animated.timing(goodGlowAnim, {
      toValue,
      duration: isGoodExpanded ? 250 : 300,
      easing: isGoodExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
      delay: isGoodExpanded ? 0 : 50,
      useNativeDriver: false,
    }).start();

    setIsGoodExpanded(!isGoodExpanded);
  };

  // Toggle Improvable card with glow animation
  const toggleImprovable = (): void => {
    const toValue = isImprovableExpanded ? 0 : 1;

    Animated.timing(improvableGlowAnim, {
      toValue,
      duration: isImprovableExpanded ? 250 : 300,
      easing: isImprovableExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
      delay: isImprovableExpanded ? 0 : 50,
      useNativeDriver: false,
    }).start();

    setIsImprovableExpanded(!isImprovableExpanded);
  };

  // Interpolated shadow values for Good card (Variation A: Soft & Subtle)
  const goodShadowOpacity = goodGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.18],
  });

  const goodShadowRadius = goodGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 20],
  });

  const goodShadowOffsetY = goodGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });

  // Interpolated shadow values for Improvable card (Variation A: Soft & Subtle)
  const improvableShadowOpacity = improvableGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.18],
  });

  const improvableShadowRadius = improvableGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 20],
  });

  const improvableShadowOffsetY = improvableGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });

  // Fixed button shadow interpolation
  const buttonShadowOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0.05, 0.12],
    extrapolate: 'clamp',
  });

  // Flip animation interpolations
  const frontRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotation = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 0.5],
    outputRange: [1, 1, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0.5, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  // Get daily insight - placeholder for now, can be dynamic from API
  const getDailyInsight = (): string => {
    const insights = [
      'Small steps every day lead to remarkable transformations.',
      'Your consistency is building the future you desire.',
      'Progress, not perfection, is the goal.',
      'Every moment is a fresh beginning.',
      'The best time to start was yesterday. The next best time is now.',
    ];
    // For now, return a fixed insight. Later: rotate daily or fetch from API
    return insights[0];
  };

  // Mock data for 7-day statistics (ready for API integration)
  const weekStatistics = {
    sleep: [5, 6, 4, 5, 6, 7, 5], // Range 3-7 for realistic sleep variation
    nutrition: [6, 7, 8, 7, 6, 8, 9],
    wellbeing: [7, 6, 7, 8, 7, 8, 9],
  };

  // Recap content texts
  const RECAP_CONTENT = {
    good: "I did all my routines. If I didn't have time for the full one, I at least did the most important part of my routine. I went to the gym 4 days a week and drank enough water. All in all great week.",
    improvable: "The week went really well but I should have performed better. On some days I scrolled a little too much in the evening. This badly influenced my sleep and my performance during the day. Next week will be dominated.",
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
          {/* Button row (will be overlapped by fixed buttons) */}
          <View style={styles.headerContent}>
            {/* Spacer for streak button */}
            <View style={{ width: 64, height: 40 }} />
            {/* Spacer for profile button */}
            <View style={{ width: 40, height: 40 }} />
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
                <Text style={styles.lightCardTitle}>Morning{'\n'}Tracking</Text>
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
                <Text style={styles.lightCardTitle}>Evening{'\n'}Tracking</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Daily Insight Card - Flippable Design */}
          <View style={styles.insightContainer}>
            {/* Front Side - Insight */}
            <Animated.View
              style={[
                styles.flipCardSide,
                {
                  transform: [{ rotateY: frontRotation }],
                  opacity: frontOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={['#FFFBEB', '#FEF3C7', '#FECACA']}
                style={styles.insightCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Mail Icon Button - Top Right */}
                <TouchableOpacity
                  style={styles.mailIconButton}
                  onPress={handleFlipInsightCard}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mail-outline" size={22} color="#92400E" />
                  {/* Blue notification dot */}
                  {hasNewMessages && <View style={styles.newMessageDot} />}
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>TODAY'S INSIGHT</Text>
                  <Text style={styles.insightQuote}>{getDailyInsight()}</Text>
                </View>

                {/* 24h Timer - Bottom Right */}
                <View style={styles.timerIndicator}>
                  <Ionicons name="hourglass-outline" size={16} color="#92400E" />
                  <Text style={styles.timerText}>{timerHours}h</Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Back Side - Messages */}
            <Animated.View
              style={[
                styles.flipCardSide,
                styles.flipCardBack,
                {
                  transform: [{ rotateY: backRotation }],
                  opacity: backOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF', '#DDD6FE']}
                style={styles.insightCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Flip Back Button - Top Right (always visible) */}
                <TouchableOpacity
                  style={styles.flipBackButton}
                  onPress={handleFlipInsightCard}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={22} color="#4C1D95" />
                </TouchableOpacity>

                {selectedMessage === null ? (
                  /* LEVEL 1: Message List View */
                  <View style={styles.messageListContainer}>
                    {/* Header Row */}
                    <View style={styles.messageListHeader}>
                      <Text style={styles.messageListTitle}>Messages</Text>
                      <View style={styles.messageCount}>
                        <Text style={styles.messageCountText}>{messages.length}</Text>
                      </View>
                    </View>

                    {/* Scrollable Message List */}
                    <ScrollView
                      style={styles.messageScrollView}
                      contentContainerStyle={styles.messageScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {messages.map((message) => (
                        <TouchableOpacity
                          key={message.id}
                          style={styles.messageListItem}
                          onPress={() => setSelectedMessage(message)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.messageItemContent}>
                            <View style={styles.messageItemHeader}>
                              <Text
                                style={[
                                  styles.messageSubject,
                                  !message.isRead && styles.messageSubjectUnread,
                                ]}
                                numberOfLines={1}
                              >
                                {message.subject}
                              </Text>
                              {!message.isRead && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.messageDate} numberOfLines={1}>
                              {message.date}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#A78BFA" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  /* LEVEL 2: Individual Message View */
                  <View style={styles.messageDetailContainer}>
                    {/* Back to List Button - Top Left */}
                    <TouchableOpacity
                      style={styles.backToListButton}
                      onPress={() => setSelectedMessage(null)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-back" size={20} color="#4C1D95" />
                      <Text style={styles.backToListText}>Back</Text>
                    </TouchableOpacity>

                    {/* Message Content */}
                    <ScrollView
                      style={styles.messageDetailScrollView}
                      showsVerticalScrollIndicator={false}
                    >
                      <Text style={styles.messageDetailSubject}>
                        {selectedMessage.subject}
                      </Text>
                      <Text style={styles.messageDetailDate}>
                        {selectedMessage.date}
                      </Text>
                      <Text style={styles.messageDetailBody}>
                        {selectedMessage.body}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Statistics Preview Card - Light Mode */}
          <View style={styles.statisticsPreviewCard}>
            {/* Header Row */}
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Last 7 Days</Text>
              <TouchableOpacity onPress={handleStatistics} style={styles.seeAllButton}>
                <Text style={styles.seeAllLink}>See All</Text>
                <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {/* Interactive Legend Row */}
            <View style={styles.statsLegend}>
              {/* Sleep Button */}
              <TouchableOpacity
                style={styles.legendButton}
                onPress={() => handleLegendPress('sleep')}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.legendItem,
                    {
                      transform: [{ scale: activeVariable === 'sleep' ? 1.05 : 1.0 }],
                      backgroundColor: activeVariable === 'sleep'
                        ? 'rgba(147, 51, 234, 0.08)'
                        : 'transparent',
                      borderBottomWidth: activeVariable === 'sleep' ? 2 : 0,
                      borderBottomColor: activeVariable === 'sleep' ? '#C084FC' : 'transparent',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#9333EA', '#C084FC']}
                    style={styles.gradientDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'sleep' && styles.legendLabelActive,
                      activeVariable === 'sleep' && { color: '#C084FC' },
                    ]}
                  >
                    Sleep
                  </Text>
                </Animated.View>
              </TouchableOpacity>

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
                        ? 'rgba(5, 150, 105, 0.08)'
                        : 'transparent',
                      borderBottomWidth: activeVariable === 'nutrition' ? 2 : 0,
                      borderBottomColor: activeVariable === 'nutrition' ? '#34D399' : 'transparent',
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
                      activeVariable === 'nutrition' && { color: '#34D399' },
                    ]}
                  >
                    Nutrition
                  </Text>
                </Animated.View>
              </TouchableOpacity>

              {/* Wellbeing Button */}
              <TouchableOpacity
                style={styles.legendButton}
                onPress={() => handleLegendPress('wellbeing')}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.legendItem,
                    {
                      transform: [{ scale: activeVariable === 'wellbeing' ? 1.05 : 1.0 }],
                      backgroundColor: activeVariable === 'wellbeing'
                        ? 'rgba(234, 88, 12, 0.08)'
                        : 'transparent',
                      borderBottomWidth: activeVariable === 'wellbeing' ? 2 : 0,
                      borderBottomColor: activeVariable === 'wellbeing' ? '#FB923C' : 'transparent',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#EA580C', '#FB923C']}
                    style={styles.gradientDot}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text
                    style={[
                      styles.legendLabel,
                      activeVariable === 'wellbeing' && styles.legendLabelActive,
                      activeVariable === 'wellbeing' && { color: '#FB923C' },
                    ]}
                  >
                    Wellbeing
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

        {/* Last Week's Recap Section - Premium Design */}
        <View style={styles.recapSection}>
          {/* Section Header */}
          <Text style={styles.recapTitle}>Last week's recap</Text>

          {/* Good Container - Premium Gradient Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleGood}
            style={styles.recapCardTouchable}
          >
            <Animated.View
              style={[
                styles.recapCardShadow,
                {
                  shadowOpacity: goodShadowOpacity,
                  shadowRadius: goodShadowRadius,
                  shadowColor: isGoodExpanded ? '#10B981' : '#000',
                  shadowOffset: { width: 0, height: goodShadowOffsetY },
                },
              ]}
            >
              <LinearGradient
                colors={['#ECFDF5', 'rgba(236, 253, 245, 0.4)', '#FFFFFF']} // Gradient fades from green (left) to white (right)
                locations={[0, 0.5, 1]}
                style={styles.recapCard}
                start={{ x: 0, y: 0.5 }} // Horizontal gradient (left to right)
                end={{ x: 1, y: 0.5 }}
              >
                {/* Status Chip */}
                <View style={styles.recapStatusChip}>
                  <View style={[styles.recapIconCircle, styles.goodIconCircle]}>
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  </View>
                  <Text style={styles.goodLabel}>Good</Text>
                </View>

                {/* Body Text */}
                <Text
                  style={styles.recapText}
                  numberOfLines={isGoodExpanded ? undefined : 2}
                >
                  {RECAP_CONTENT.good}
                </Text>

                {/* View More Button - Styled Chip */}
                <View style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreButtonText}>
                    {isGoodExpanded ? 'View Less' : 'View More'}
                  </Text>
                  <Ionicons
                    name={isGoodExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#3B82F6" // Use same blue as "See All" button
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Improvable Container - Premium Gradient Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={toggleImprovable}
            style={styles.recapCardTouchable}
          >
            <Animated.View
              style={[
                styles.recapCardShadow,
                {
                  shadowOpacity: improvableShadowOpacity,
                  shadowRadius: improvableShadowRadius,
                  shadowColor: isImprovableExpanded ? '#F59E0B' : '#000',
                  shadowOffset: { width: 0, height: improvableShadowOffsetY },
                },
              ]}
            >
              <LinearGradient
                colors={['#FFFBEB', 'rgba(255, 251, 235, 0.4)', '#FFFFFF']} // Gradient fades from amber (left) to white (right)
                locations={[0, 0.5, 1]}
                style={styles.recapCard}
                start={{ x: 0, y: 0.5 }} // Horizontal gradient (left to right)
                end={{ x: 1, y: 0.5 }}
              >
                {/* Status Chip */}
                <View style={styles.recapStatusChip}>
                  <View style={[styles.recapIconCircle, styles.improvableIconCircle]}>
                    <Ionicons name="arrow-up-circle" size={18} color="#D97706" />
                  </View>
                  <Text style={styles.improvableLabel}>Improvable</Text>
                </View>

                {/* Body Text */}
                <Text
                  style={styles.recapText}
                  numberOfLines={isImprovableExpanded ? undefined : 2}
                >
                  {RECAP_CONTENT.improvable}
                </Text>

                {/* View More Button - Styled Chip */}
                <View style={styles.viewMoreButton}>
                  <Text style={styles.viewMoreButtonText}>
                    {isImprovableExpanded ? 'View Less' : 'View More'}
                  </Text>
                  <Ionicons
                    name={isImprovableExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#3B82F6" // Use same blue as "See All" button
                  />
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* LAYER 2: Fixed Button HUD (rendered on top) */}
      <Animated.View
        style={[
          styles.fixedButtonHUD,
          {
            shadowOpacity: buttonShadowOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Fixed Buttons - Dynamic positioning based on SafeArea */}
        <View
          style={[
            styles.fixedButtonsRow,
            { top: insets.top + 8 } // 8px below SafeArea top (status bar)
          ]}
          pointerEvents="box-none"
        >
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
      </Animated.View>
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
    backgroundColor: '#F1EEE0',
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
    paddingTop: 16,
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
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 27,
  },
  date: {
    fontSize: 13,
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
    marginTop: 24,
  },
  trackingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  trackingCardTouchable: {
    flex: 1,
  },
  trackingCard: {
    height: 190,
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
    shadowColor: '#FCD34D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
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
  insightContainer: {
    marginBottom: 20,
    height: 260,
  },
  flipCardSide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
    overflow: 'hidden',
  },
  flipCardBack: {
    position: 'absolute',
  },
  insightCard: {
    height: 260,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  mailIconButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  newMessageDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timerIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
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
  flipBackButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },

  // Message List View Styles (Level 1)
  messageListContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  messageListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: -16,
    height: 44,
    marginBottom: 12,
    gap: 8,
  },
  messageListTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4C1D95',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  messageCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 28,
    alignItems: 'center',
  },
  messageCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  messageScrollView: {
    flex: 1,
  },
  messageScrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  messageListItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
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
  messageItemContent: {
    flex: 1,
    marginRight: 12,
  },
  messageItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageSubject: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3730A3',
    flex: 1,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  messageSubjectUnread: {
    fontWeight: '700',
    color: '#4C1D95',
  },
  messageDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B5CF6',
    opacity: 0.65,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#6366F1',
    marginLeft: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },

  // Message Detail View Styles (Level 2)
  messageDetailContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
  },
  backToListText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C1D95',
    marginLeft: 2,
  },
  messageDetailScrollView: {
    flex: 1,
  },
  messageDetailSubject: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4C1D95',
    marginBottom: 8,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  messageDetailDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
    opacity: 0.7,
    marginBottom: 10,
  },
  messageDetailBody: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5B21B6',
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  insightContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 16,
    textAlign: 'center',
  },
  insightQuote: {
    fontSize: 19,
    fontWeight: '400',
    color: '#78350F',
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: '90%',
  },
  statisticsPreviewCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
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
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 2,
  },
  statsLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
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
    marginTop: 32,
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
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
  goodIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  improvableIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  goodLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: -0.2,
  },
  improvableLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
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
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  viewMoreButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6', // Use same blue as "See All" button
    marginRight: 4,
    letterSpacing: -0.1,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default DashboardScreen;
