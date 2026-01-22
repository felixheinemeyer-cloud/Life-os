import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
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
      <View style={[styles.statIconContainer, { backgroundColor: colors.light + '30' }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
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

// Metric Graph Component with Scrubbing
interface MetricGraphProps {
  data: number[];
  metric: MetricType;
  colors: { primary: string; light: string };
}

const MetricGraph: React.FC<MetricGraphProps> = ({ data, metric, colors }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartRef = useRef<View>(null);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64;
  const chartHeight = 140;
  const padding = { top: 16, right: 12, bottom: 28, left: 32 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Scale based on metric type
  const scale = useMemo(() => {
    if (metric === 'sleep') {
      return { min: 4, max: 10 };
    }
    return { min: 1, max: 10 };
  }, [metric]);

  // Get reference line values based on scale (top, middle, bottom)
  const referenceValues = useMemo(() => {
    if (metric === 'sleep') {
      return [4, 7, 10]; // For sleep (4-10 range): bottom, middle, top
    }
    return [1, 5, 10]; // For 1-10 range: bottom, middle, top
  }, [metric]);

  const getX = useCallback((index: number): number => {
    return padding.left + (index / (data.length - 1)) * plotWidth;
  }, [data.length, plotWidth]);

  const getY = useCallback((value: number): number => {
    const normalizedValue = Math.max(scale.min, Math.min(scale.max, value));
    return padding.top + plotHeight - ((normalizedValue - scale.min) / (scale.max - scale.min)) * plotHeight;
  }, [scale, plotHeight]);

  // Generate smooth path using Catmull-Rom to Bezier conversion
  const linePath = useMemo(() => {
    if (data.length === 0) return '';

    const points = data.map((value, index) => ({
      x: getX(index),
      y: getY(value),
    }));

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Control points for smooth curve
      const cp1x = p1.x + (p2.x - p0.x) / 8;
      const cp1y = p1.y + (p2.y - p0.y) / 8;
      const cp2x = p2.x - (p3.x - p1.x) / 8;
      const cp2y = p2.y - (p3.y - p1.y) / 8;

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return path;
  }, [data, getX, getY]);

  // Generate area fill path
  const areaPath = useMemo(() => {
    if (!linePath) return '';

    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    const baseY = padding.top + plotHeight;

    return `${linePath} L ${lastX.toFixed(2)} ${baseY} L ${firstX.toFixed(2)} ${baseY} Z`;
  }, [linePath, data.length, getX, plotHeight]);

  const metricLabels: Record<MetricType, string> = {
    sleep: 'Sleep (hours)',
    nutrition: 'Nutrition Score',
    energy: 'Energy Level',
    satisfaction: 'Satisfaction',
  };

  // Find min and max values for display
  const minVal = useMemo(() => Math.min(...data), [data]);
  const maxVal = useMemo(() => Math.max(...data), [data]);

  // Generate dates for the 30-day period (last 30 days)
  const dates = useMemo(() => {
    const today = new Date();
    const dateArray: Date[] = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateArray.push(date);
    }
    return dateArray;
  }, [data.length]);

  // Get display value (selected day's value or show min/max)
  const displayValue = activeIndex !== null ? data[activeIndex] : null;

  // Format selected date (e.g., "Jan 5")
  const selectedDayLabel = useMemo(() => {
    if (activeIndex === null) return null;
    const date = dates[activeIndex];
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [activeIndex, dates]);

  // Calculate index from x position (relative to plot area)
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX - padding.left;
    const clampedX = Math.max(0, Math.min(relativeX, plotWidth));
    const index = Math.round((clampedX / plotWidth) * (data.length - 1));
    return Math.max(0, Math.min(data.length - 1, index));
  }, [chartLayoutX, plotWidth, data.length]);

  // Handle layout measurement
  const handleLayout = useCallback(() => {
    chartRef.current?.measureInWindow((x) => {
      setChartLayoutX(x);
    });
  }, []);

  // PanResponder for scrubbing
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        const index = getIndexFromX(evt.nativeEvent.pageX);
        setActiveIndex(index);
      },

      onPanResponderMove: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.pageX);
        setActiveIndex((prevIndex) => {
          if (prevIndex !== index && Platform.OS === 'ios') {
            Haptics.selectionAsync();
          }
          return index;
        });
      },

      onPanResponderRelease: () => {
        setActiveIndex(null);
      },

      onPanResponderTerminate: () => {
        setActiveIndex(null);
      },
    });
  }, [getIndexFromX]);

  // Get active dot position
  const activeDot = activeIndex !== null ? {
    x: getX(activeIndex),
    y: getY(data[activeIndex]),
  } : null;

  // Cursor line position (relative to chart container, not SVG)
  const cursorLineLeft = activeIndex !== null
    ? getX(activeIndex)
    : 0;

  return (
    <View style={styles.graphCard}>
      <View style={styles.graphHeader}>
        <Text style={[styles.graphTitle, { color: colors.primary }]}>{metricLabels[metric]}</Text>
        <View style={styles.graphStats}>
          {displayValue !== null ? (
            <View style={styles.graphActiveStats}>
              <Text style={styles.graphSelectedDay}>{selectedDayLabel}</Text>
              <Text style={[styles.graphDisplayValue, { color: colors.primary }]}>
                {displayValue.toFixed(1)}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.graphStatText}>
                Min: <Text style={{ fontWeight: '600', color: colors.primary }}>{minVal.toFixed(1)}</Text>
              </Text>
              <Text style={styles.graphStatText}>
                Max: <Text style={{ fontWeight: '600', color: colors.primary }}>{maxVal.toFixed(1)}</Text>
              </Text>
            </>
          )}
        </View>
      </View>

      <View
        ref={chartRef}
        style={styles.chartContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id={`areaGradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={activeIndex !== null ? "0.22" : "0.15"} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.01" />
            </SvgLinearGradient>
          </Defs>

          {/* Subtle reference lines */}
          {referenceValues.map((value) => {
            const y = getY(value);
            return (
              <Path
                key={value}
                d={`M ${padding.left} ${y.toFixed(1)} L ${chartWidth - padding.right} ${y.toFixed(1)}`}
                stroke="#D1D5DB"
                strokeWidth={1}
                strokeDasharray="2,6"
                opacity={0.5}
              />
            );
          })}

          {/* Area fill */}
          <Path
            d={areaPath}
            fill={`url(#areaGradient-${metric})`}
          />

          {/* Line */}
          <Path
            d={linePath}
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active dot */}
          {activeDot && (
            <Circle
              cx={activeDot.x}
              cy={activeDot.y}
              r={5}
              fill={colors.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}

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
            fill="#C9CDD3"
            textAnchor="start"
          >
            30d ago
          </SvgText>
          <SvgText
            x={chartWidth - padding.right}
            y={chartHeight - 8}
            fontSize="10"
            fill="#C9CDD3"
            textAnchor="end"
          >
            Today
          </SvgText>
        </Svg>

        {/* Cursor line */}
        {activeIndex !== null && (
          <View
            style={[
              styles.cursorLine,
              { left: cursorLineLeft, height: chartHeight - padding.bottom },
            ]}
          />
        )}
      </View>

      <Text style={styles.graphHint}>
        {activeIndex !== null ? 'Slide to explore' : 'Tap another stat to compare'}
      </Text>
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
              icon="leaf"
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
              icon="sparkles"
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
          onPress={() => { Keyboard.dismiss(); onContinue(); }}
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
    backgroundColor: '#F0EEE8',
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
    marginBottom: 20,
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
  statIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  graphTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  graphStats: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 20,
  },
  graphActiveStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  graphSelectedDay: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  graphStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  graphDisplayValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  cursorLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 1,
  },
  graphHint: {
    fontSize: 12,
    color: '#C9CDD3',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
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
