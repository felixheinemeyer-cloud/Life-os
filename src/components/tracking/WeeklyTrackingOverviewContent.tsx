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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Refined Theme with better color harmony
const COLORS = {
  background: '#F0EEE8',
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
  const maxBarHeight = 28;
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

// Enhanced Metric row with progress bar and trend
const MetricRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  numericValue: number;
  maxValue: number;
  color: string;
  bgColor: string;
  trend: number; // percentage change vs last week
  animDelay: number;
  isLast?: boolean;
}> = ({ icon, label, value, numericValue, maxValue, color, bgColor, trend, animDelay, isLast }) => {
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

  const getTrendColor = () => {
    if (trend > 0) return COLORS.excellent;
    if (trend < 0) return COLORS.needsWork;
    return COLORS.textMuted;
  };

  const getTrendLabel = () => {
    if (trend === 0) return 'no change';
    const symbol = trend > 0 ? '↑' : '↓';
    return `${symbol} ${Math.abs(trend)}%`;
  };

  return (
    <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: color, width: progressWidth }
              ]}
            />
          </View>
          <Text style={[styles.metricTrend, { color: getTrendColor() }]}>
            {getTrendLabel()}
          </Text>
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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    Keyboard.dismiss();
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
        <View style={styles.header}>
          <View style={styles.weekLabelContainer}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.weekLabel}>{weekRange}</Text>
          </View>
          <Text style={styles.headerTitle}>Your Week in Review</Text>
          <Text style={styles.headerSubtitle}>Here's how you performed this week</Text>
        </View>

        {/* Overall Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreContainer}>
            {/* Score Ring */}
            <View style={styles.scoreRingWrapper}>
              <ScoreRing score={averages.overall} color={performance.color} size={90} />
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
        </View>

        {/* Metrics Card */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsHeader}>
            <Text style={styles.metricsTitle}>Weekly Averages</Text>
            <View style={styles.metricsBadge}>
              <Ionicons name="analytics" size={10} color={COLORS.primary} />
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
            trend={8}
            animDelay={600}
          />

          <MetricRow
            icon="leaf"
            label="Nutrition"
            value={averages.nutrition.toFixed(1)}
            numericValue={averages.nutrition}
            maxValue={10}
            color={COLORS.nutrition}
            bgColor={COLORS.nutritionBg}
            trend={12}
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
            trend={-5}
            animDelay={800}
          />

          <MetricRow
            icon="sparkles"
            label="Satisfaction"
            value={averages.satisfaction.toFixed(1)}
            numericValue={averages.satisfaction}
            maxValue={10}
            color={COLORS.satisfaction}
            bgColor={COLORS.satisfactionBg}
            trend={3}
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
            trend={15}
            animDelay={1000}
            isLast
          />
        </View>

      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Begin</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },

  // Header - Refined
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreRingWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
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
    paddingTop: 12,
    paddingBottom: 2,
  },
  dailyBreakdownTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 10,
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
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  dayIndicatorLabelToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayIndicatorTrack: {
    width: 4,
    height: 28,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 4,
  },
  dayIndicatorBar: {
    width: '100%',
    borderRadius: 2,
  },
  dayIndicatorScore: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dayIndicatorScoreToday: {
    fontWeight: '700',
  },

  // Metrics Card - Enhanced
  metricsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  metricsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  metricsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  metricsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
  },
  metricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
    height: 34,
    justifyContent: 'space-between',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  metricTrend: {
    fontSize: 10,
    fontWeight: '500',
    minWidth: 45,
    textAlign: 'right',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // Button - Matching other screens
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
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
