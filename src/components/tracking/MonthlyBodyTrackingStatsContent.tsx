import React, { useState, useEffect, useRef } from 'react';
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
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

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

type MetricType = 'sleep' | 'nutrition' | 'energy' | 'satisfaction';

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
      style={[
        styles.statCard,
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

// Metric Graph Component
interface MetricGraphProps {
  data: number[];
  metric: MetricType;
  colors: { primary: string; light: string };
}

const MetricGraph: React.FC<MetricGraphProps> = ({ data, metric, colors }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const chartHeight = 160;
  const padding = { top: 20, right: 12, bottom: 28, left: 36 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Scale based on metric type
  const getScale = () => {
    if (metric === 'sleep') {
      return { min: 4, max: 10 };
    }
    return { min: 1, max: 10 };
  };

  const scale = getScale();

  const getX = (index: number): number => {
    return padding.left + (index / (data.length - 1)) * plotWidth;
  };

  const getY = (value: number): number => {
    const normalizedValue = Math.max(scale.min, Math.min(scale.max, value));
    return padding.top + plotHeight - ((normalizedValue - scale.min) / (scale.max - scale.min)) * plotHeight;
  };

  // Generate smooth path
  const generatePath = (): string => {
    if (data.length === 0) return '';

    const points = data.map((value, index) => ({
      x: getX(index),
      y: getY(value),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const tension = 0.3;

      const cp1x = current.x + (next.x - current.x) * tension;
      const cp1y = current.y;
      const cp2x = next.x - (next.x - current.x) * tension;
      const cp2y = next.y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  // Generate area fill path
  const generateAreaPath = (): string => {
    const linePath = generatePath();
    if (!linePath) return '';

    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    const baseY = padding.top + plotHeight;

    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const metricLabels: Record<MetricType, string> = {
    sleep: 'Sleep (hours)',
    nutrition: 'Nutrition Score',
    energy: 'Energy Level',
    satisfaction: 'Satisfaction',
  };

  // Find min and max values for display
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const avgVal = data.reduce((a, b) => a + b, 0) / data.length;

  return (
    <View style={styles.graphCard}>
      <View style={styles.graphHeader}>
        <Text style={[styles.graphTitle, { color: colors.primary }]}>{metricLabels[metric]}</Text>
        <View style={styles.graphStats}>
          <Text style={styles.graphStatText}>
            Min: <Text style={{ fontWeight: '600', color: colors.primary }}>{minVal.toFixed(1)}</Text>
          </Text>
          <Text style={styles.graphStatText}>
            Max: <Text style={{ fontWeight: '600', color: colors.primary }}>{maxVal.toFixed(1)}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.05" />
            </SvgLinearGradient>
          </Defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <Line
              key={ratio}
              x1={padding.left}
              y1={padding.top + plotHeight * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + plotHeight * ratio}
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

          {/* Area fill */}
          <Path
            d={generateAreaPath()}
            fill="url(#areaGradient)"
          />

          {/* Line */}
          <Path
            d={generatePath()}
            stroke={colors.primary}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points - show every 5th point to avoid clutter */}
          {data.map((value, index) => {
            if (index % 5 !== 0 && index !== data.length - 1) return null;
            return (
              <Circle
                key={index}
                cx={getX(index)}
                cy={getY(value)}
                r={4}
                fill="#FFFFFF"
                stroke={colors.primary}
                strokeWidth="2"
              />
            );
          })}

          {/* Y-axis labels */}
          <SvgText
            x={padding.left - 8}
            y={padding.top + 4}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="end"
          >
            {scale.max}
          </SvgText>
          <SvgText
            x={padding.left - 8}
            y={padding.top + plotHeight + 4}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="end"
          >
            {scale.min}
          </SvgText>

          {/* X-axis labels */}
          <SvgText
            x={padding.left}
            y={chartHeight - 8}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="start"
          >
            Day 1
          </SvgText>
          <SvgText
            x={chartWidth / 2}
            y={chartHeight - 8}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="middle"
          >
            Day 15
          </SvgText>
          <SvgText
            x={chartWidth - padding.right}
            y={chartHeight - 8}
            fontSize="10"
            fill="#9CA3AF"
            textAnchor="end"
          >
            Day 30
          </SvgText>
        </Svg>
      </View>

      <Text style={styles.graphHint}>Tap another stat to compare</Text>
    </View>
  );
};

const MonthlyBodyTrackingStatsContent: React.FC<MonthlyBodyTrackingStatsContentProps> = ({
  onContinue,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricType | null>(null);
  const [displayedMetric, setDisplayedMetric] = useState<MetricType | null>(null);
  const [mockData] = useState(generateMockData);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const graphFadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (activeMetric) {
      // Show the graph: set displayed metric immediately, then fade in
      setDisplayedMetric(activeMetric);
      graphFadeAnim.setValue(0);
      Animated.timing(graphFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Auto-scroll to show the graph after layout updates
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } else if (displayedMetric) {
      // Hide the graph: scroll up smoothly while fading out, then remove
      // Start scrolling up immediately
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });

      // Fade out the graph simultaneously
      Animated.timing(graphFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Remove the graph after scroll animation has completed
      // This prevents the jarring jump when content height changes
      setTimeout(() => {
        setDisplayedMetric(null);
      }, 350);
    }
  }, [activeMetric]);

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
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setActiveMetric(activeMetric === metric ? null : metric);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            Tap a stat to see your 30-day trend
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

        {/* Metric Graph - appears when a stat is selected */}
        {displayedMetric && (
          <Animated.View style={{ opacity: graphFadeAnim }}>
            <MetricGraph
              data={mockData[displayedMetric]}
              metric={displayedMetric}
              colors={METRIC_COLORS[displayedMetric]}
            />
          </Animated.View>
        )}

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
    paddingBottom: 88,
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
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9AA0A6',
    textAlign: 'center',
  },

  // Stats Grid
  statsGrid: {
    gap: 12,
    marginBottom: 16,
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

  // Graph Card
  graphCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  graphStats: {
    flexDirection: 'row',
    gap: 12,
  },
  graphStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartContainer: {
    alignItems: 'center',
  },
  graphHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Button Container
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

export default MonthlyBodyTrackingStatsContent;
