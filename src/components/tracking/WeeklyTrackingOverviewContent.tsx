import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Refined Theme with better color harmony
const COLORS = {
  background: '#F7F5F2',
  card: '#FFFFFF',
  text: '#1A1D21',
  textSecondary: '#5F6368',
  textMuted: '#9AA0A6',
  border: '#E8EAED',
  // Primary accent
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryBg: '#E6F7F5',
  // Score colors
  excellent: '#059669',
  good: '#10B981',
  okay: '#F59E0B',
  needsWork: '#EF4444',
  // Metric colors - harmonized palette
  sleep: '#7C3AED',
  sleepBg: '#F3E8FF',
  nutrition: '#059669',
  nutritionBg: '#ECFDF5',
  energy: '#F59E0B',
  energyBg: '#FEF3C7',
  satisfaction: '#3B82F6',
  satisfactionBg: '#EFF6FF',
  priority: '#10B981',
  priorityBg: '#D1FAE5',
  // Day indicator colors
  dayHigh: '#10B981',
  dayMedium: '#F59E0B',
  dayLow: '#EF4444',
  dayEmpty: '#E8EAED',
};

interface DayData {
  dayName: string;
  dayShort: string;
  dayLetter: string;
  date: number;
  isToday: boolean;
  tracked: boolean;
  sleep: number;
  priorityCompleted: boolean;
  nutrition: number;
  energy: number;
  satisfaction: number;
  overallScore: number; // Average of nutrition, energy, satisfaction
}

interface WeeklyTrackingOverviewContentProps {
  onContinue: () => void;
}

// Generate week data
const generateWeekData = (): { weekRange: string; days: DayData[] } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const days: DayData[] = [];
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const isTracked = i <= todayIndex;

    const nutrition = isTracked ? Math.round(4 + Math.random() * 6) : 0;
    const energy = isTracked ? Math.round(3 + Math.random() * 7) : 0;
    const satisfaction = isTracked ? Math.round(4 + Math.random() * 6) : 0;
    const overallScore = isTracked ? Math.round((nutrition + energy + satisfaction) / 3) : 0;

    days.push({
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      dayLetter: dayLetters[i],
      date: date.getDate(),
      isToday: i === todayIndex,
      tracked: isTracked,
      sleep: isTracked ? Math.round((5.5 + Math.random() * 3.5) * 10) / 10 : 0,
      priorityCompleted: isTracked ? Math.random() > 0.3 : false,
      nutrition,
      energy,
      satisfaction,
      overallScore,
    });
  }

  const weekRange = `${monthNames[monday.getMonth()]} ${monday.getDate()} – ${sunday.getDate()}`;

  return { weekRange, days };
};

// Calculate averages
const calculateAverages = (days: DayData[]) => {
  const tracked = days.filter(d => d.tracked);
  if (tracked.length === 0) return { sleep: 0, nutrition: 0, energy: 0, satisfaction: 0, priorityRate: 0, overall: 0 };

  const nutrition = tracked.reduce((sum, d) => sum + d.nutrition, 0) / tracked.length;
  const energy = tracked.reduce((sum, d) => sum + d.energy, 0) / tracked.length;
  const satisfaction = tracked.reduce((sum, d) => sum + d.satisfaction, 0) / tracked.length;

  return {
    sleep: tracked.reduce((sum, d) => sum + d.sleep, 0) / tracked.length,
    nutrition,
    energy,
    satisfaction,
    priorityRate: (tracked.filter(d => d.priorityCompleted).length / tracked.length) * 100,
    overall: (nutrition + energy + satisfaction) / 3,
  };
};

// Get performance level with refined labels
const getPerformanceLevel = (score: number): { label: string; color: string; gradient: string[] } => {
  if (score >= 8) return { label: 'Excellent', color: COLORS.excellent, gradient: ['#059669', '#10B981'] };
  if (score >= 6.5) return { label: 'Good', color: COLORS.good, gradient: ['#10B981', '#34D399'] };
  if (score >= 5) return { label: 'Okay', color: COLORS.okay, gradient: ['#F59E0B', '#FBBF24'] };
  return { label: 'Needs attention', color: COLORS.needsWork, gradient: ['#EF4444', '#F87171'] };
};

// Circular Progress Ring Component
const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({
  score,
  color,
  size = 100
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 10) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// Minimal day indicator - slim bar with score text
const DayIndicator: React.FC<{ day: DayData; index: number; animDelay: number }> = ({ day, index, animDelay }) => {
  const heightAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const maxBarHeight = 36;
  const barHeight = day.tracked ? Math.max(8, (day.overallScore / 10) * maxBarHeight) : 0;

  const getColor = () => {
    if (!day.tracked) return COLORS.dayEmpty;
    if (day.overallScore >= 7) return COLORS.dayHigh;
    if (day.overallScore >= 5) return COLORS.dayMedium;
    return COLORS.dayLow;
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: barHeight,
        duration: 500,
        delay: animDelay + index * 60,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay: animDelay + index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const color = getColor();

  return (
    <Animated.View style={[styles.dayIndicatorContainer, { opacity: opacityAnim }]}>
      {/* Day letter */}
      <Text style={[styles.dayIndicatorLabel, day.isToday && styles.dayIndicatorLabelToday]}>
        {day.dayLetter}
      </Text>

      {/* Bar track with fill */}
      <View style={styles.dayIndicatorTrack}>
        <Animated.View
          style={[
            styles.dayIndicatorBar,
            { backgroundColor: color, height: heightAnim },
          ]}
        />
      </View>

      {/* Score number - no circle */}
      <Text style={[
        styles.dayIndicatorScore,
        { color: day.tracked ? color : COLORS.dayEmpty },
        day.isToday && styles.dayIndicatorScoreToday,
      ]}>
        {day.tracked ? day.overallScore : '–'}
      </Text>
    </Animated.View>
  );
};

// Enhanced Metric row with progress bar
const MetricRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  numericValue: number;
  maxValue: number;
  color: string;
  bgColor: string;
  subtitle?: string;
  animDelay: number;
  isLast?: boolean;
}> = ({ icon, label, value, numericValue, maxValue, color, bgColor, subtitle, animDelay, isLast }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progress = Math.min(numericValue / maxValue, 1);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      delay: animDelay,
      useNativeDriver: false,
    }).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: color, width: progressWidth }
              ]}
            />
          </View>
          {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
};

const WeeklyTrackingOverviewContent: React.FC<WeeklyTrackingOverviewContentProps> = ({
  onContinue,
}) => {
  const { weekRange, days } = generateWeekData();
  const averages = calculateAverages(days);
  const performance = getPerformanceLevel(averages.overall);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scoreScaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardSlideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scoreScaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onContinue();
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.weekLabelContainer}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.weekLabel}>{weekRange}</Text>
          </View>
          <Text style={styles.headerTitle}>Your Week in Review</Text>
          <Text style={styles.headerSubtitle}>Here's how you performed this week</Text>
        </Animated.View>

        {/* Overall Score Card - Redesigned */}
        <Animated.View style={[
          styles.scoreCard,
          { transform: [{ scale: scoreScaleAnim }] }
        ]}>
          <View style={styles.scoreContainer}>
            {/* Score Ring */}
            <View style={styles.scoreRingWrapper}>
              <ScoreRing score={averages.overall} color={performance.color} size={110} />
              <View style={styles.scoreTextOverlay}>
                <Text style={[styles.scoreValue, { color: performance.color }]}>
                  {averages.overall.toFixed(1)}
                </Text>
                <Text style={styles.scoreOutOf}>/ 10</Text>
              </View>
            </View>

            {/* Score Info */}
            <View style={styles.scoreInfo}>
              <View style={[styles.performanceBadge, { backgroundColor: performance.color + '15' }]}>
                <View style={[styles.performanceDot, { backgroundColor: performance.color }]} />
                <Text style={[styles.performanceLabel, { color: performance.color }]}>
                  {performance.label}
                </Text>
              </View>
              <Text style={styles.scoreDescription}>
                Based on nutrition, energy & satisfaction
              </Text>
            </View>
          </View>

          {/* Daily Breakdown - Refined */}
          <View style={styles.dailyBreakdown}>
            <Text style={styles.dailyBreakdownTitle}>Daily Breakdown</Text>
            <View style={styles.dayIndicatorsRow}>
              {days.map((day, index) => (
                <DayIndicator key={day.dayShort} day={day} index={index} animDelay={400} />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Metrics Card - Enhanced */}
        <Animated.View style={[
          styles.metricsCard,
          { transform: [{ translateY: cardSlideAnim }] }
        ]}>
          <View style={styles.metricsHeader}>
            <Text style={styles.metricsTitle}>Weekly Averages</Text>
            <View style={styles.metricsBadge}>
              <Ionicons name="analytics" size={12} color={COLORS.primary} />
              <Text style={styles.metricsBadgeText}>{days.filter(d => d.tracked).length} days</Text>
            </View>
          </View>

          <MetricRow
            icon="moon"
            label="Sleep"
            value={`${averages.sleep.toFixed(1)}h`}
            numericValue={averages.sleep}
            maxValue={9}
            color={COLORS.sleep}
            bgColor={COLORS.sleepBg}
            subtitle="avg per night"
            animDelay={600}
          />

          <MetricRow
            icon="nutrition"
            label="Nutrition"
            value={averages.nutrition.toFixed(1)}
            numericValue={averages.nutrition}
            maxValue={10}
            color={COLORS.nutrition}
            bgColor={COLORS.nutritionBg}
            subtitle="quality score"
            animDelay={700}
          />

          <MetricRow
            icon="flash"
            label="Energy"
            value={averages.energy.toFixed(1)}
            numericValue={averages.energy}
            maxValue={10}
            color={COLORS.energy}
            bgColor={COLORS.energyBg}
            subtitle="daily average"
            animDelay={800}
          />

          <MetricRow
            icon="happy"
            label="Satisfaction"
            value={averages.satisfaction.toFixed(1)}
            numericValue={averages.satisfaction}
            maxValue={10}
            color={COLORS.satisfaction}
            bgColor={COLORS.satisfactionBg}
            subtitle="mood score"
            animDelay={900}
          />

          <MetricRow
            icon="checkmark-circle"
            label="Priorities"
            value={`${Math.round(averages.priorityRate)}%`}
            numericValue={averages.priorityRate}
            maxValue={100}
            color={COLORS.priority}
            bgColor={COLORS.priorityBg}
            subtitle="completion rate"
            animDelay={1000}
            isLast
          />
        </Animated.View>

      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Continue to Reflection</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },

  // Header - Refined
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  weekLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 14,
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textMuted,
  },

  // Score Card - Completely Redesigned
  scoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreRingWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreOutOf: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: -2,
  },
  scoreInfo: {
    flex: 1,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  performanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },

  // Daily Breakdown - Refined slim design
  dailyBreakdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    paddingBottom: 4,
  },
  dailyBreakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dayIndicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  dayIndicatorContainer: {
    alignItems: 'center',
    width: 32,
  },
  dayIndicatorLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  dayIndicatorLabelToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayIndicatorTrack: {
    width: 4,
    height: 36,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  dayIndicatorBar: {
    width: '100%',
    borderRadius: 2,
  },
  dayIndicatorScore: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayIndicatorScoreToday: {
    fontWeight: '700',
  },

  // Metrics Card - Enhanced
  metricsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  metricsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  metricsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
  },
  metricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  metricContent: {
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Button - Matching other screens
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: COLORS.background,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default WeeklyTrackingOverviewContent;
