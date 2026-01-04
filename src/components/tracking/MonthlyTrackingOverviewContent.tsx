import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// Consistent color palette matching weekly screen
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
  // Wealth area colors
  physical: '#059669',
  physicalBg: '#ECFDF5',
  social: '#8B5CF6',
  socialBg: '#F3E8FF',
  mental: '#3B82F6',
  mentalBg: '#EFF6FF',
  financial: '#D97706',
  financialBg: '#FEF3C7',
  time: '#EC4899',
  timeBg: '#FCE7F3',
};

interface MonthlyTrackingOverviewContentProps {
  onContinue: () => void;
}

type WealthArea = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  average: number;
  trend: number;
  weekScores: number[];
};

const generateMonthlyData = () => {
  const areas: WealthArea[] = [
    { key: 'physical', label: 'Physical', icon: 'fitness', color: COLORS.physical, bgColor: COLORS.physicalBg, average: 0, trend: 0, weekScores: [] },
    { key: 'social', label: 'Social', icon: 'people', color: COLORS.social, bgColor: COLORS.socialBg, average: 0, trend: 0, weekScores: [] },
    { key: 'mental', label: 'Mental', icon: 'bulb', color: COLORS.mental, bgColor: COLORS.mentalBg, average: 0, trend: 0, weekScores: [] },
    { key: 'financial', label: 'Financial', icon: 'wallet', color: COLORS.financial, bgColor: COLORS.financialBg, average: 0, trend: 0, weekScores: [] },
    { key: 'time', label: 'Time', icon: 'time', color: COLORS.time, bgColor: COLORS.timeBg, average: 0, trend: 0, weekScores: [] },
  ];

  const weeks = 4;

  areas.forEach(area => {
    for (let i = 0; i < weeks; i++) {
      area.weekScores.push(Math.round(40 + Math.random() * 55) / 10);
    }
    area.average = area.weekScores.reduce((a, b) => a + b, 0) / weeks;
    area.trend = Math.round((Math.random() - 0.4) * 30);
  });

  const overall = areas.reduce((sum, a) => sum + a.average, 0) / areas.length;
  const overallTrend = Math.round((Math.random() - 0.4) * 20);

  const sorted = [...areas].sort((a, b) => b.average - a.average);

  return { areas, overall, overallTrend, weeks, best: sorted[0], needsFocus: sorted[sorted.length - 1] };
};

const getMonthName = (): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[new Date().getMonth()];
};

// Get performance level with refined labels (matching weekly)
const getPerformanceLevel = (score: number): { label: string; color: string } => {
  if (score >= 8) return { label: 'Excellent', color: COLORS.excellent };
  if (score >= 6.5) return { label: 'Good', color: COLORS.good };
  if (score >= 5) return { label: 'Okay', color: COLORS.okay };
  return { label: 'Needs attention', color: COLORS.needsWork };
};

// Circular Progress Ring Component (matching weekly)
const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({
  score,
  color,
  size = 90
}) => {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 10) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="monthlyScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#monthlyScoreGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// Area row component with progress bar (matching weekly metric style)
const AreaRow: React.FC<{
  area: WealthArea;
  isLast: boolean;
  animDelay: number;
}> = ({ area, isLast, animDelay }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progress = Math.min(area.average / 10, 1);

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
    if (area.trend > 0) return COLORS.excellent;
    if (area.trend < 0) return COLORS.needsWork;
    return COLORS.textMuted;
  };

  const getTrendLabel = () => {
    if (area.trend === 0) return 'no change';
    const symbol = area.trend > 0 ? '↑' : '↓';
    return `${symbol} ${Math.abs(area.trend)}%`;
  };

  return (
    <View style={[styles.areaRow, isLast && styles.areaRowLast]}>
      <View style={[styles.areaIcon, { backgroundColor: area.bgColor }]}>
        <Ionicons name={area.icon} size={16} color={area.color} />
      </View>
      <View style={styles.areaContent}>
        <View style={styles.areaHeader}>
          <Text style={styles.areaLabel}>{area.label}</Text>
          <Text style={[styles.areaScore, { color: area.color }]}>
            {area.average.toFixed(1)}
          </Text>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: area.color, width: progressWidth }
              ]}
            />
          </View>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {getTrendLabel()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const MonthlyTrackingOverviewContent: React.FC<MonthlyTrackingOverviewContentProps> = ({
  onContinue,
}) => {
  const monthName = getMonthName();
  const data = generateMonthlyData();
  const performance = getPerformanceLevel(data.overall);

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
          <View style={styles.monthLabelContainer}>
            <Ionicons name="calendar" size={12} color="#DB2777" style={{ marginRight: 5 }} />
            <Text style={styles.monthLabel}>{monthName}</Text>
          </View>
          <Text style={styles.headerTitle}>Your Month in Review</Text>
          <Text style={styles.headerSubtitle}>Here's how you performed this month</Text>
        </View>

        {/* Overall Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreContainer}>
            {/* Score Ring */}
            <View style={styles.scoreRingWrapper}>
              <ScoreRing score={data.overall} color={performance.color} size={90} />
              <View style={styles.scoreTextOverlay}>
                <Text style={[styles.scoreValue, { color: performance.color }]}>
                  {data.overall.toFixed(1)}
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
                Average across all wealth areas
              </Text>
              {/* Overall trend */}
              <View style={styles.overallTrendRow}>
                {data.overallTrend !== 0 && (
                  <Ionicons
                    name={data.overallTrend > 0 ? 'trending-up' : 'trending-down'}
                    size={14}
                    color={data.overallTrend > 0 ? COLORS.excellent : COLORS.needsWork}
                  />
                )}
                <Text style={[
                  styles.overallTrendText,
                  { color: data.overallTrend > 0 ? COLORS.excellent : data.overallTrend < 0 ? COLORS.needsWork : COLORS.textMuted }
                ]}>
                  {data.overallTrend === 0 ? 'No change' : `${Math.abs(data.overallTrend)}% vs last month`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wealth Areas Card */}
        <View style={styles.areasCard}>
          <View style={styles.areasHeader}>
            <Text style={styles.areasTitle}>Wealth Areas</Text>
            <View style={styles.areasBadge}>
              <Ionicons name="analytics" size={10} color={COLORS.primary} />
              <Text style={styles.areasBadgeText}>4 weeks</Text>
            </View>
          </View>

          {data.areas.map((area, index) => (
            <AreaRow
              key={area.key}
              area={area}
              isLast={index === data.areas.length - 1}
              animDelay={400 + index * 100}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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

  // Header (matching weekly)
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  monthLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DB277712',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 14,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DB2777',
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

  // Score Card (matching weekly)
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
    fontSize: 11,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 6,
  },
  performanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  performanceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoreDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  overallTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallTrendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Areas Card (matching weekly metrics card)
  areasCard: {
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
  areasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  areasTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  areasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  areasBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Area Row (matching weekly MetricRow exactly)
  areaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
  },
  areaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  areaIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  areaContent: {
    flex: 1,
    height: 34,
    justifyContent: 'space-between',
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  areaScore: {
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
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500',
    minWidth: 45,
    textAlign: 'right',
  },

  // Button (matching weekly)
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

export default MonthlyTrackingOverviewContent;
