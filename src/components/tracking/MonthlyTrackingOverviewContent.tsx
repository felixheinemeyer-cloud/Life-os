import React, { useEffect, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// Rose/Pink color scheme for Monthly Check-In (consistent with monthly tracking theme)
const THEME_COLORS = {
  primary: '#DB2777',
  primaryLight: '#F472B6',
  primaryLighter: '#FBCFE8',
  gradient: ['#FBCFE8', '#F472B6', '#DB2777'] as const,
};

// Wealth dimension colors - distinct, harmonious palette
const WEALTH_COLORS = {
  physical: {
    primary: '#059669',
    light: '#34D399',
    gradient: ['#6EE7B7', '#34D399', '#059669'] as const,
    icon: 'fitness' as const,
    label: 'Physical'
  },
  social: {
    primary: '#8B5CF6',
    light: '#A78BFA',
    gradient: ['#C4B5FD', '#A78BFA', '#8B5CF6'] as const,
    icon: 'people' as const,
    label: 'Social'
  },
  mental: {
    primary: '#3B82F6',
    light: '#60A5FA',
    gradient: ['#93C5FD', '#60A5FA', '#3B82F6'] as const,
    icon: 'bulb' as const,
    label: 'Mental'
  },
  financial: {
    primary: '#D97706',
    light: '#FBBF24',
    gradient: ['#FDE68A', '#FBBF24', '#D97706'] as const,
    icon: 'wallet' as const,
    label: 'Financial'
  },
  time: {
    primary: '#EC4899',
    light: '#F472B6',
    gradient: ['#FBCFE8', '#F472B6', '#EC4899'] as const,
    icon: 'time' as const,
    label: 'Time'
  },
};

type WealthType = 'physical' | 'social' | 'mental' | 'financial' | 'time';

interface MonthlyTrackingOverviewContentProps {
  onContinue: () => void;
}

// Mock weekly data for the month (4-5 weeks of data)
// In production, this would come from stored weekly tracking data
const generateMockWeeklyData = () => {
  const weeks = 4; // Typical month has 4 weeks of tracking
  const data: Record<WealthType, number[]> = {
    physical: [],
    social: [],
    mental: [],
    financial: [],
    time: [],
  };

  for (let i = 0; i < weeks; i++) {
    data.physical.push(Math.round(4 + Math.random() * 6)); // 4-10
    data.social.push(Math.round(3 + Math.random() * 7)); // 3-10
    data.mental.push(Math.round(4 + Math.random() * 6)); // 4-10
    data.financial.push(Math.round(3 + Math.random() * 7)); // 3-10
    data.time.push(Math.round(4 + Math.random() * 6)); // 4-10
  }

  return data;
};

// Get current month and year for display
const getMonthDisplay = (): { month: string; year: string; fullDate: string } => {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear().toString().slice(-2); // Get last 2 digits

  return {
    month,
    year,
    fullDate: `${month} '${year}`,
  };
};

interface WealthStatCardProps {
  wealthType: WealthType;
  average: number;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  isActive: boolean;
  onPress: () => void;
}

const WealthStatCard: React.FC<WealthStatCardProps> = ({
  wealthType,
  average,
  trend,
  trendValue,
  isActive,
  onPress,
}) => {
  const colors = WEALTH_COLORS[wealthType];
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';
  const trendColor = trend === 'up' ? '#059669' : trend === 'down' ? '#DC2626' : '#6B7280';

  return (
    <TouchableOpacity
      style={[
        styles.wealthCard,
        {
          borderColor: isActive ? colors.primary : 'transparent',
          borderWidth: isActive ? 2.5 : 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={colors.gradient}
        style={styles.wealthIconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.wealthIconInner}>
          <Ionicons name={colors.icon} size={16} color={colors.primary} />
        </View>
      </LinearGradient>

      <View style={styles.wealthCardContent}>
        <Text style={styles.wealthCardTitle}>{colors.label}</Text>
        <View style={styles.wealthCardValueRow}>
          <Text style={[styles.wealthCardValue, { color: colors.primary }]}>
            {average.toFixed(1)}
          </Text>
          <Text style={styles.wealthCardUnit}>/10</Text>
        </View>
      </View>

      <View style={styles.wealthCardTrend}>
        <Ionicons name={trendIcon} size={14} color={trendColor} />
        <Text style={[styles.wealthCardTrendText, { color: trendColor }]}>
          {trendValue}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Mini trend chart for weekly data
interface WeeklyTrendChartProps {
  data: Record<WealthType, number[]>;
  activeWealth: WealthType | null;
}

const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ data, activeWealth }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const chartHeight = 180;
  const padding = { top: 20, right: 16, bottom: 32, left: 36 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const weeks = data.physical.length;
  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  const getX = (index: number): number => {
    return padding.left + (index / (weeks - 1)) * plotWidth;
  };

  const getY = (value: number): number => {
    const minValue = 1;
    const maxValue = 10;
    const normalizedValue = Math.max(minValue, Math.min(maxValue, value));
    return padding.top + plotHeight - ((normalizedValue - minValue) / (maxValue - minValue)) * plotHeight;
  };

  // Generate smooth bezier path
  const generatePath = (values: number[]): string => {
    if (values.length === 0) return '';

    const points = values.map((value, index) => ({
      x: getX(index),
      y: getY(value),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const tension = 0.35;

      const cp1x = current.x + (next.x - current.x) * tension;
      const cp1y = current.y;
      const cp2x = next.x - (next.x - current.x) * tension;
      const cp2y = next.y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  // Get opacity based on active state
  const getOpacity = (wealthType: WealthType) => {
    if (activeWealth === null) return 0.85;
    return activeWealth === wealthType ? 1 : 0.15;
  };

  const wealthTypes: WealthType[] = ['physical', 'social', 'mental', 'financial', 'time'];

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Weekly Progress</Text>
        <Text style={styles.chartSubtitle}>Tap a card to highlight</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          {wealthTypes.map((type) => (
            <SvgLinearGradient key={`${type}-grad`} id={`${type}Gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={WEALTH_COLORS[type].light} />
              <Stop offset="100%" stopColor={WEALTH_COLORS[type].primary} />
            </SvgLinearGradient>
          ))}
        </Defs>

        {/* Horizontal grid lines */}
        {[2.5, 5, 7.5].map((value) => (
          <Line
            key={value}
            x1={padding.left}
            y1={getY(value)}
            x2={chartWidth - padding.right}
            y2={getY(value)}
            stroke="#E5E7EB"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Baseline */}
        <Line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={chartWidth - padding.right}
          y2={padding.top + plotHeight}
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Y-axis */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        <SvgText x={padding.left - 8} y={getY(10) + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">10</SvgText>
        <SvgText x={padding.left - 8} y={getY(5) + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">5</SvgText>
        <SvgText x={padding.left - 8} y={getY(1) + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">1</SvgText>

        {/* Lines for each wealth type */}
        {wealthTypes.map((type) => (
          <G key={type} opacity={getOpacity(type)}>
            {/* Glow effect */}
            <Path
              d={generatePath(data[type])}
              stroke={WEALTH_COLORS[type].light}
              strokeWidth="6"
              fill="none"
              opacity={0.3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main line */}
            <Path
              d={generatePath(data[type])}
              stroke={`url(#${type}Gradient)`}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            {data[type].map((value, index) => (
              <Circle
                key={index}
                cx={getX(index)}
                cy={getY(value)}
                r={4}
                fill="#FFFFFF"
                stroke={WEALTH_COLORS[type].primary}
                strokeWidth="2"
              />
            ))}
          </G>
        ))}

        {/* X-axis labels */}
        {weekLabels.slice(0, weeks).map((label, index) => (
          <SvgText
            key={label}
            x={getX(index)}
            y={chartHeight - 10}
            fontSize="10"
            fill="#6B7280"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.chartLegend}>
        {wealthTypes.map((type) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: WEALTH_COLORS[type].primary }]} />
            <Text style={styles.legendText}>{WEALTH_COLORS[type].label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const MonthlyTrackingOverviewContent: React.FC<MonthlyTrackingOverviewContentProps> = ({
  onContinue,
}) => {
  const [activeWealth, setActiveWealth] = useState<WealthType | null>(null);
  const [weeklyData] = useState(generateMockWeeklyData);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const monthDisplay = getMonthDisplay();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Calculate averages and trends for each wealth type
  const calculateStats = (data: number[]) => {
    if (data.length === 0) return { avg: 0, trend: 'neutral' as const, trendValue: '0%' };

    const avg = data.reduce((a, b) => a + b, 0) / data.length;

    if (data.length < 2) return { avg, trend: 'neutral' as const, trendValue: '0%' };

    const firstHalf = data.slice(0, Math.ceil(data.length / 2));
    const secondHalf = data.slice(Math.ceil(data.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const trendPercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return {
      avg,
      trend: trendPercent > 3 ? 'up' : trendPercent < -3 ? 'down' : 'neutral',
      trendValue: `${Math.abs(trendPercent).toFixed(0)}%`,
    };
  };

  const wealthStats: Record<WealthType, ReturnType<typeof calculateStats>> = {
    physical: calculateStats(weeklyData.physical),
    social: calculateStats(weeklyData.social),
    mental: calculateStats(weeklyData.mental),
    financial: calculateStats(weeklyData.financial),
    time: calculateStats(weeklyData.time),
  };

  const handleWealthPress = (wealthType: WealthType) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveWealth(activeWealth === wealthType ? null : wealthType);
  };

  // Calculate overall month score
  const overallScore = (
    wealthStats.physical.avg +
    wealthStats.social.avg +
    wealthStats.mental.avg +
    wealthStats.financial.avg +
    wealthStats.time.avg
  ) / 5;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Header Section */}
        <View style={styles.monthHeader}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.monthBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="calendar" size={16} color="#FFFFFF" />
            <Text style={styles.monthBadgeText}>{monthDisplay.fullDate}</Text>
          </LinearGradient>

          <Text style={styles.headerTitle}>Monthly Check-in</Text>
          <Text style={styles.headerSubtitle}>
            Here's how your weeks shaped this month
          </Text>
        </View>

        {/* Overall Score Card */}
        <View style={styles.overallCard}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.overallGradientBorder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.overallCardInner}>
              <View style={styles.overallScoreSection}>
                <Text style={styles.overallLabel}>Monthly Wellness Score</Text>
                <View style={styles.overallScoreRow}>
                  <Text style={styles.overallScoreValue}>{overallScore.toFixed(1)}</Text>
                  <Text style={styles.overallScoreMax}>/10</Text>
                </View>
              </View>
              <View style={styles.overallIconSection}>
                <LinearGradient
                  colors={THEME_COLORS.gradient}
                  style={styles.overallIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.overallIconInner}>
                    <Ionicons name="sparkles" size={24} color={THEME_COLORS.primary} />
                  </View>
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Wealth Stats Section */}
        <Text style={styles.sectionTitle}>Your 5 Wealth Areas</Text>

        <View style={styles.wealthGrid}>
          {(['physical', 'social', 'mental', 'financial', 'time'] as WealthType[]).map((type) => (
            <WealthStatCard
              key={type}
              wealthType={type}
              average={wealthStats[type].avg}
              trend={wealthStats[type].trend as 'up' | 'down' | 'neutral'}
              trendValue={wealthStats[type].trendValue}
              isActive={activeWealth === type}
              onPress={() => handleWealthPress(type)}
            />
          ))}
        </View>

        {/* Weekly Trend Chart */}
        <WeeklyTrendChart data={weeklyData} activeWealth={activeWealth} />

        {/* Insights Section */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons name="bulb-outline" size={20} color={THEME_COLORS.primary} />
            <Text style={styles.insightsTitle}>Quick Insights</Text>
          </View>
          <Text style={styles.insightsText}>
            Based on your weekly check-ins, your strongest area was{' '}
            <Text style={styles.insightsHighlight}>
              {Object.entries(wealthStats).reduce((a, b) =>
                wealthStats[a[0] as WealthType].avg > wealthStats[b[0] as WealthType].avg ? a : b
              )[0]}
            </Text>
            {' '}with an average of{' '}
            <Text style={styles.insightsHighlight}>
              {Math.max(...Object.values(wealthStats).map(s => s.avg)).toFixed(1)}
            </Text>.
          </Text>
        </View>

      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Begin Reflection</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Month Header
  monthHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  monthBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Overall Score Card
  overallCard: {
    marginBottom: 24,
  },
  overallGradientBorder: {
    borderRadius: 20,
    padding: 2.5,
  },
  overallCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallScoreSection: {
    flex: 1,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  overallScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overallScoreValue: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -1.5,
  },
  overallScoreMax: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  overallIconSection: {},
  overallIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overallIconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // Wealth Grid
  wealthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  wealthCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  wealthIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  wealthIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wealthCardContent: {
    flex: 1,
  },
  wealthCardTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wealthCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wealthCardValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  wealthCardUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 2,
  },
  wealthCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  wealthCardTrendText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Insights Card
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: -0.2,
  },
  insightsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  insightsHighlight: {
    color: THEME_COLORS.primary,
    fontWeight: '600',
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    letterSpacing: -0.2,
  },
});

export default MonthlyTrackingOverviewContent;
