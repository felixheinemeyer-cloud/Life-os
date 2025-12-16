import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Path,
  Circle,
  G,
  Line,
  Text as SvgText,
  Rect,
} from 'react-native-svg';

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

// Metric colors
const METRIC_COLORS = {
  sleep: { primary: '#8B5CF6', light: '#A78BFA', gradient: ['#A78BFA', '#8B5CF6', '#7C3AED'] as const },
  nutrition: { primary: '#059669', light: '#34D399', gradient: ['#6EE7B7', '#34D399', '#059669'] as const },
  energy: { primary: '#D97706', light: '#FBBF24', gradient: ['#FDE68A', '#FBBF24', '#D97706'] as const },
  satisfaction: { primary: '#3B82F6', light: '#60A5FA', gradient: ['#93C5FD', '#60A5FA', '#3B82F6'] as const },
};

type MetricType = 'sleep' | 'nutrition' | 'energy' | 'satisfaction' | null;

interface MonthlyBodyTrackingStatsContentProps {
  onContinue: () => void;
}

// Mock data for 30 days (will be replaced with real data from API)
const generateMockData = () => {
  const data = {
    sleep: [] as number[],
    nutrition: [] as number[],
    energy: [] as number[],
    satisfaction: [] as number[],
  };

  for (let i = 0; i < 30; i++) {
    data.sleep.push(5 + Math.random() * 4); // 5-9 hours
    data.nutrition.push(Math.round(4 + Math.random() * 6)); // 4-10
    data.energy.push(Math.round(4 + Math.random() * 6)); // 4-10
    data.satisfaction.push(Math.round(3 + Math.random() * 7)); // 3-10
  }

  return data;
};

interface StatCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  colors: { primary: string; light: string; gradient: readonly [string, string, string] };
  isActive: boolean;
  onPress: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  icon,
  value,
  unit,
  trend,
  trendValue,
  colors,
  isActive,
  onPress,
}) => {
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';
  const trendColor = trend === 'up' ? '#059669' : trend === 'down' ? '#DC2626' : '#6B7280';

  return (
    <TouchableOpacity
      style={[styles.statCard, isActive && { borderColor: colors.primary, borderWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={colors.gradient}
        style={styles.statIconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statIconInner}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      </LinearGradient>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
      <View style={styles.statTrendRow}>
        <Ionicons name={trendIcon} size={14} color={trendColor} />
        <Text style={[styles.statTrendText, { color: trendColor }]}>{trendValue}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Chart component for 30-day trend
interface TrendChartProps {
  data: {
    sleep: number[];
    nutrition: number[];
    energy: number[];
    satisfaction: number[];
  };
  activeMetric: MetricType;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, activeMetric }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const chartHeight = 180;
  const padding = { top: 20, right: 16, bottom: 30, left: 32 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // For sleep: scale 0-12 hours, for others: scale 1-10
  const getScale = (metric: MetricType) => {
    if (metric === 'sleep') {
      return { min: 0, max: 12 };
    }
    return { min: 1, max: 10 };
  };

  const getX = (index: number, dataLength: number): number => {
    return padding.left + (index / (dataLength - 1)) * plotWidth;
  };

  const getY = (value: number, scale: { min: number; max: number }): number => {
    const normalizedValue = Math.max(scale.min, Math.min(scale.max, value));
    return padding.top + plotHeight - ((normalizedValue - scale.min) / (scale.max - scale.min)) * plotHeight;
  };

  // Generate smooth bezier curve path
  const generatePath = (dataPoints: number[], scale: { min: number; max: number }): string => {
    if (dataPoints.length === 0) return '';

    const points = dataPoints.map((value, index) => ({
      x: getX(index, dataPoints.length),
      y: getY(value, scale),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      const controlPointX1 = current.x + (next.x - current.x) * 0.3;
      const controlPointY1 = current.y + (next.y - current.y) * 0.3;
      const controlPointX2 = current.x + (next.x - current.x) * 0.7;
      const controlPointY2 = current.y + (next.y - current.y) * 0.7;

      path += ` C ${controlPointX1} ${controlPointY1}, ${controlPointX2} ${controlPointY2}, ${next.x} ${next.y}`;
    }

    return path;
  };

  // Generate area fill path
  const generateAreaPath = (dataPoints: number[], scale: { min: number; max: number }): string => {
    if (dataPoints.length === 0) return '';

    const linePath = generatePath(dataPoints, scale);
    const baselineY = padding.top + plotHeight;
    const lastX = getX(dataPoints.length - 1, dataPoints.length);
    const firstX = getX(0, dataPoints.length);

    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  };

  const getOpacity = (metric: keyof typeof data) => {
    if (activeMetric === null) return { line: 1, area: 0.15, glow: 0.2 };
    return activeMetric === metric
      ? { line: 1, area: 0.2, glow: 0.25 }
      : { line: 0.2, area: 0, glow: 0 };
  };

  const metrics: Array<{ key: keyof typeof data; colors: typeof METRIC_COLORS.sleep }> = [
    { key: 'sleep', colors: METRIC_COLORS.sleep },
    { key: 'nutrition', colors: METRIC_COLORS.nutrition },
    { key: 'energy', colors: METRIC_COLORS.energy },
    { key: 'satisfaction', colors: METRIC_COLORS.satisfaction },
  ];

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          {metrics.map(({ key, colors }) => (
            <React.Fragment key={key}>
              <SvgLinearGradient id={`${key}LineGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor={colors.light} />
              </SvgLinearGradient>
              <SvgLinearGradient id={`${key}FillGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
              </SvgLinearGradient>
            </React.Fragment>
          ))}
        </Defs>

        {/* Background */}
        <Rect width={chartWidth} height={chartHeight} fill="#FFFFFF" />

        {/* Grid lines */}
        <Line
          x1={padding.left}
          y1={padding.top + plotHeight * 0.25}
          x2={chartWidth - padding.right}
          y2={padding.top + plotHeight * 0.25}
          stroke="#E5E7EB"
          strokeWidth="0.5"
          strokeDasharray="2,4"
        />
        <Line
          x1={padding.left}
          y1={padding.top + plotHeight * 0.5}
          x2={chartWidth - padding.right}
          y2={padding.top + plotHeight * 0.5}
          stroke="#E5E7EB"
          strokeWidth="0.5"
          strokeDasharray="2,4"
        />
        <Line
          x1={padding.left}
          y1={padding.top + plotHeight * 0.75}
          x2={chartWidth - padding.right}
          y2={padding.top + plotHeight * 0.75}
          stroke="#E5E7EB"
          strokeWidth="0.5"
          strokeDasharray="2,4"
        />

        {/* Axes */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={chartHeight - padding.bottom}
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        <Line
          x1={padding.left}
          y1={chartHeight - padding.bottom}
          x2={chartWidth - padding.right}
          y2={chartHeight - padding.bottom}
          stroke="#D1D5DB"
          strokeWidth="1"
        />

        {/* Render each metric */}
        {metrics.map(({ key, colors }) => {
          const scale = getScale(key);
          const opacity = getOpacity(key);

          return (
            <G key={key}>
              {/* Area fill */}
              {opacity.area > 0 && (
                <Path
                  d={generateAreaPath(data[key], scale)}
                  fill={`url(#${key}FillGrad)`}
                  opacity={opacity.area}
                />
              )}
              {/* Glow */}
              {opacity.glow > 0 && (
                <Path
                  d={generatePath(data[key], scale)}
                  stroke={colors.light}
                  strokeWidth="6"
                  fill="none"
                  opacity={opacity.glow}
                  strokeLinecap="round"
                />
              )}
              {/* Line */}
              <Path
                d={generatePath(data[key], scale)}
                stroke={`url(#${key}LineGrad)`}
                strokeWidth="2.5"
                fill="none"
                opacity={opacity.line}
                strokeLinecap="round"
              />
            </G>
          );
        })}

        {/* X-axis labels */}
        <SvgText x={padding.left} y={chartHeight - 10} fontSize="10" fill="#6B7280" textAnchor="start">
          Day 1
        </SvgText>
        <SvgText x={chartWidth / 2} y={chartHeight - 10} fontSize="10" fill="#6B7280" textAnchor="middle">
          Day 15
        </SvgText>
        <SvgText x={chartWidth - padding.right} y={chartHeight - 10} fontSize="10" fill="#6B7280" textAnchor="end">
          Day 30
        </SvgText>
      </Svg>
    </View>
  );
};

const MonthlyBodyTrackingStatsContent: React.FC<MonthlyBodyTrackingStatsContentProps> = ({
  onContinue,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>(null);
  const [mockData] = useState(generateMockData);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Calculate averages and trends
  const calculateStats = (data: number[]) => {
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const firstHalf = data.slice(0, 15).reduce((a, b) => a + b, 0) / 15;
    const secondHalf = data.slice(15).reduce((a, b) => a + b, 0) / 15;
    const trendPercent = ((secondHalf - firstHalf) / firstHalf) * 100;

    return {
      avg,
      trend: trendPercent > 2 ? 'up' : trendPercent < -2 ? 'down' : 'neutral',
      trendValue: `${Math.abs(trendPercent).toFixed(0)}%`,
    };
  };

  const sleepStats = calculateStats(mockData.sleep);
  const nutritionStats = calculateStats(mockData.nutrition);
  const energyStats = calculateStats(mockData.energy);
  const satisfactionStats = calculateStats(mockData.satisfaction);

  const handleMetricPress = (metric: MetricType) => {
    setActiveMetric(activeMetric === metric ? null : metric);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.headerIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerIconInner}>
              <Ionicons name="analytics" size={28} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Your 30-Day Overview</Text>
          <Text style={styles.headerSubtitle}>
            Review your physical and mental health trends
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Avg. Sleep"
              icon="moon"
              value={sleepStats.avg.toFixed(1)}
              unit="hrs"
              trend={sleepStats.trend as 'up' | 'down' | 'neutral'}
              trendValue={sleepStats.trendValue}
              colors={METRIC_COLORS.sleep}
              isActive={activeMetric === 'sleep'}
              onPress={() => handleMetricPress('sleep')}
            />
            <StatCard
              title="Nutrition"
              icon="nutrition"
              value={nutritionStats.avg.toFixed(1)}
              unit="/10"
              trend={nutritionStats.trend as 'up' | 'down' | 'neutral'}
              trendValue={nutritionStats.trendValue}
              colors={METRIC_COLORS.nutrition}
              isActive={activeMetric === 'nutrition'}
              onPress={() => handleMetricPress('nutrition')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Energy"
              icon="flash"
              value={energyStats.avg.toFixed(1)}
              unit="/10"
              trend={energyStats.trend as 'up' | 'down' | 'neutral'}
              trendValue={energyStats.trendValue}
              colors={METRIC_COLORS.energy}
              isActive={activeMetric === 'energy'}
              onPress={() => handleMetricPress('energy')}
            />
            <StatCard
              title="Satisfaction"
              icon="happy"
              value={satisfactionStats.avg.toFixed(1)}
              unit="/10"
              trend={satisfactionStats.trend as 'up' | 'down' | 'neutral'}
              trendValue={satisfactionStats.trendValue}
              colors={METRIC_COLORS.satisfaction}
              isActive={activeMetric === 'satisfaction'}
              onPress={() => handleMetricPress('satisfaction')}
            />
          </View>
        </View>

        {/* Trend Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>30-Day Trends</Text>
            <Text style={styles.chartHint}>Tap a stat to highlight</Text>
          </View>
          <TrendChart data={mockData} activeMetric={activeMetric} />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
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

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
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
    paddingHorizontal: 20,
  },

  // Stats Grid
  statsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 2,
  },
  statTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  chartHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  chartContainer: {
    alignItems: 'center',
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

export default MonthlyBodyTrackingStatsContent;
