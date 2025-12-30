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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Theme
const COLORS = {
  background: '#F7F5F2',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealBg: '#F0FDFA',
  // Metric colors
  sleep: '#8B5CF6',
  priority: '#10B981',
  priorityNo: '#EF4444',
  nutrition: '#059669',
  energy: '#F59E0B',
  satisfaction: '#3B82F6',
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

// Get performance level
const getPerformanceLevel = (score: number): { label: string; color: string; emoji: string } => {
  if (score >= 8) return { label: 'Excellent', color: '#059669', emoji: '🔥' };
  if (score >= 6.5) return { label: 'Good', color: '#0D9488', emoji: '👍' };
  if (score >= 5) return { label: 'Okay', color: '#F59E0B', emoji: '👌' };
  return { label: 'Needs work', color: '#EF4444', emoji: '💪' };
};

// Day indicator dot
const DayDot: React.FC<{ day: DayData }> = ({ day }) => {
  const getColor = () => {
    if (!day.tracked) return '#E5E7EB';
    if (day.overallScore >= 7) return COLORS.priority;
    if (day.overallScore >= 5) return COLORS.energy;
    return '#EF4444';
  };

  return (
    <View style={styles.dayDotContainer}>
      <View style={[
        styles.dayDot,
        { backgroundColor: getColor() },
        day.isToday && styles.dayDotToday,
      ]}>
        {day.isToday && <View style={styles.dayDotInner} />}
      </View>
      <Text style={[styles.dayDotLabel, day.isToday && styles.dayDotLabelToday]}>
        {day.dayLetter}
      </Text>
    </View>
  );
};

// Metric row
const MetricRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}> = ({ icon, label, value, color, subtitle }) => (
  <View style={styles.metricRow}>
    <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <View style={styles.metricContent}>
      <Text style={styles.metricLabel}>{label}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

const WeeklyTrackingOverviewContent: React.FC<WeeklyTrackingOverviewContentProps> = ({
  onContinue,
}) => {
  const { weekRange, days } = generateWeekData();
  const averages = calculateAverages(days);
  const performance = getPerformanceLevel(averages.overall);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onContinue();
  };

  const trackedCount = days.filter(d => d.tracked).length;
  const completedPriorities = days.filter(d => d.priorityCompleted).length;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.weekLabel}>{weekRange}</Text>
          <Text style={styles.headerTitle}>Your Week in Review</Text>
          <Text style={styles.headerSubtitle}>
            {trackedCount} days tracked · {completedPriorities} priorities completed
          </Text>
        </Animated.View>

        {/* Overall Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreLabel}>Overall Score</Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreValue, { color: performance.color }]}>
                  {averages.overall.toFixed(1)}
                </Text>
                <Text style={styles.scoreMax}>/10</Text>
              </View>
            </View>
          </View>

          {/* Week dots */}
          <View style={styles.weekDots}>
            {days.map((day) => (
              <DayDot key={day.dayShort} day={day} />
            ))}
          </View>
        </View>

        {/* Metrics Card */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Weekly Averages</Text>

          <MetricRow
            icon="moon"
            label="Sleep"
            value={`${averages.sleep.toFixed(1)}h`}
            color={COLORS.sleep}
            subtitle="per night"
          />

          <View style={styles.metricDivider} />

          <MetricRow
            icon="nutrition"
            label="Nutrition"
            value={averages.nutrition.toFixed(1)}
            color={COLORS.nutrition}
            subtitle="out of 10"
          />

          <View style={styles.metricDivider} />

          <MetricRow
            icon="flash"
            label="Energy"
            value={averages.energy.toFixed(1)}
            color={COLORS.energy}
            subtitle="out of 10"
          />

          <View style={styles.metricDivider} />

          <MetricRow
            icon="happy"
            label="Satisfaction"
            value={averages.satisfaction.toFixed(1)}
            color={COLORS.satisfaction}
            subtitle="out of 10"
          />

          <View style={styles.metricDivider} />

          <MetricRow
            icon="flag"
            label="Priorities"
            value={`${Math.round(averages.priorityRate)}%`}
            color={COLORS.priority}
            subtitle="completion rate"
          />
        </View>

      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
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
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
    marginBottom: 8,
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
    color: COLORS.textSecondary,
  },

  // Score Card
  scoreCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreMax: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginLeft: 2,
  },

  // Week dots
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayDotContainer: {
    alignItems: 'center',
    gap: 4,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: COLORS.teal,
  },
  dayDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  dayDotLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  dayDotLabelToday: {
    color: COLORS.teal,
    fontWeight: '600',
  },

  // Metrics Card
  metricsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    paddingBottom: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  metricSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 48,
  },

  // Button
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: COLORS.background,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WeeklyTrackingOverviewContent;
