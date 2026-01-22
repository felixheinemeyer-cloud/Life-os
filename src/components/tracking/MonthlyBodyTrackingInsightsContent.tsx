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
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

// Metric colors - distinct and accessible
const METRIC_COLORS = {
  sleep: { primary: '#8B5CF6', light: '#C4B5FD', name: 'Sleep' },
  energy: { primary: '#F59E0B', light: '#FDE68A', name: 'Energy' },
  nutrition: { primary: '#10B981', light: '#A7F3D0', name: 'Nutrition' },
};

type MetricType = 'sleep' | 'energy' | 'nutrition';

interface InsightsData {
  sleep: number[];
  energy: number[];
  nutrition: number[];
}

interface MonthlyBodyTrackingInsightsContentProps {
  onContinue: () => void;
  data?: InsightsData;
}

// Generate mock data with realistic correlations
const generateMockData = (): InsightsData => {
  const data: InsightsData = {
    sleep: [],
    energy: [],
    nutrition: [],
  };

  for (let i = 0; i < 30; i++) {
    // Sleep: 5-9 hours with some variation
    const baseSleep = 6.5 + Math.sin(i * 0.3) * 1.5 + (Math.random() - 0.5) * 1.5;
    data.sleep.push(Math.max(4, Math.min(10, baseSleep)));

    // Nutrition: somewhat independent, 4-9
    const baseNutrition = 6 + Math.sin(i * 0.2 + 1) * 2 + (Math.random() - 0.5) * 2;
    data.nutrition.push(Math.round(Math.max(3, Math.min(10, baseNutrition))));

    // Energy: correlated with sleep (lagged by 1 day) and nutrition
    const sleepFactor = i > 0 ? data.sleep[i - 1] : data.sleep[0];
    const nutritionFactor = data.nutrition[i];
    const baseEnergy = (sleepFactor * 0.5 + nutritionFactor * 0.3 + 2) + (Math.random() - 0.5) * 1.5;
    data.energy.push(Math.round(Math.max(3, Math.min(10, baseEnergy))));
  }

  return data;
};

// Calculate statistics for a metric
const calculateStats = (data: number[]) => {
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const firstHalf = data.slice(0, 15).reduce((a, b) => a + b, 0) / 15;
  const secondHalf = data.slice(15).reduce((a, b) => a + b, 0) / 15;
  const trendPercent = ((secondHalf - firstHalf) / firstHalf) * 100;

  return {
    avg,
    min,
    max,
    trend: trendPercent > 3 ? 'up' : trendPercent < -3 ? 'down' : 'neutral',
    trendValue: Math.abs(trendPercent).toFixed(0),
  };
};

// Combined Chart Component
interface CombinedChartProps {
  data: InsightsData;
  activeMetrics: Set<MetricType>;
  onToggleMetric: (metric: MetricType) => void;
}

const CombinedChart: React.FC<CombinedChartProps> = ({ data, activeMetrics, onToggleMetric }) => {
  const chartWidth = SCREEN_WIDTH - 48;
  const chartHeight = 180;
  const padding = { top: 16, right: 12, bottom: 32, left: 32 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const scale = { min: 1, max: 10 };

  // Scrubbing state
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Generate dates for the last 30 days
  const dates = useMemo(() => {
    const today = new Date();
    const dateArray: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateArray.push(date);
    }
    return dateArray;
  }, []);

  // Format selected date
  const selectedDateStr = useMemo(() => {
    if (activeIndex === null) return null;
    const date = dates[activeIndex];
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [activeIndex, dates]);

  const getX = (index: number): number => {
    return padding.left + (index / 29) * plotWidth;
  };

  const getY = (value: number): number => {
    const normalizedValue = Math.max(scale.min, Math.min(scale.max, value));
    return padding.top + plotHeight - ((normalizedValue - scale.min) / (scale.max - scale.min)) * plotHeight;
  };

  const generatePath = (values: number[]): string => {
    if (values.length === 0) return '';

    const points = values.map((value, index) => ({
      x: getX(index),
      y: getY(value),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    // Use smoother bezier curves (matching Overview screen style)
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

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  // Convert touch X position (relative to view) to data index
  const getIndexFromX = useCallback((locationX: number): number => {
    // locationX is relative to the chart container view
    // Subtract padding.left to get position relative to the plot area
    const relativeX = locationX - padding.left;
    const clampedX = Math.max(0, Math.min(relativeX, plotWidth));
    const index = Math.round((clampedX / plotWidth) * 29);
    return Math.max(0, Math.min(29, index));
  }, [plotWidth, padding.left]);

  // PanResponder for scrubbing
  // Using locationX (relative to view) instead of pageX (absolute) for better device compatibility
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex(index);
        if (Platform.OS === 'ios') {
          Haptics.selectionAsync();
        }
      },

      onPanResponderMove: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex((prev) => {
          if (prev !== index && Platform.OS === 'ios') {
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

  return (
    <View style={styles.chartCard}>
      {/* Legend / Toggle OR Scrubbing Info - same space, no layout shift */}
      <View style={styles.legendRow}>
        {activeIndex === null ? (
          // Show legend toggles when not scrubbing
          <>
            {(Object.keys(METRIC_COLORS) as MetricType[]).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.legendItem,
                  !activeMetrics.has(metric) && styles.legendItemInactive,
                ]}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.selectionAsync();
                  }
                  onToggleMetric(metric);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: activeMetrics.has(metric) ? METRIC_COLORS[metric].primary : '#D1D5DB' },
                  ]}
                />
                <Text
                  style={[
                    styles.legendText,
                    { color: activeMetrics.has(metric) ? '#374151' : '#9CA3AF' },
                  ]}
                >
                  {METRIC_COLORS[metric].name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          // Show date and values when scrubbing
          <View style={styles.scrubbingContent}>
            <Text style={styles.scrubbingDate}>{selectedDateStr}</Text>
            <View style={styles.scrubbingValues}>
              {activeMetrics.has('sleep') && (
                <Text style={styles.scrubbingValueText}>
                  <Text style={{ color: METRIC_COLORS.sleep.primary, fontWeight: '600' }}>
                    {data.sleep[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}> hrs</Text>
                </Text>
              )}
              {activeMetrics.has('energy') && (
                <Text style={styles.scrubbingValueText}>
                  <Text style={{ color: METRIC_COLORS.energy.primary, fontWeight: '600' }}>
                    {data.energy[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
              {activeMetrics.has('nutrition') && (
                <Text style={styles.scrubbingValueText}>
                  <Text style={{ color: METRIC_COLORS.nutrition.primary, fontWeight: '600' }}>
                    {data.nutrition[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Chart */}
      <View
        style={styles.chartContainer}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={chartHeight}>
          {/* Horizontal grid lines at values 10, 5, 1 - matching Overview */}
          {[10, 5, 1].map((value) => {
            const normalized = (value - scale.min) / (scale.max - scale.min);
            const y = padding.top + plotHeight * (1 - normalized);
            return (
              <Line
                key={value}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#D1D5DB"
                strokeWidth="1"
                strokeDasharray="2,6"
                opacity={0.5}
              />
            );
          })}

          {/* Y-axis labels at values 10, 5, 1 */}
          {[10, 5, 1].map((value) => {
            const normalized = (value - scale.min) / (scale.max - scale.min);
            const y = padding.top + plotHeight * (1 - normalized) + 4;
            return (
              <SvgText key={value} x={padding.left - 8} y={y} fontSize="10" fill="#9CA3AF" textAnchor="end">
                {value}
              </SvgText>
            );
          })}

          {/* Metric lines */}
          {activeMetrics.has('sleep') && (
            <Path
              d={generatePath(data.sleep)}
              stroke={METRIC_COLORS.sleep.primary}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeMetrics.has('nutrition') && (
            <Path
              d={generatePath(data.nutrition)}
              stroke={METRIC_COLORS.nutrition.primary}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeMetrics.has('energy') && (
            <Path
              d={generatePath(data.energy)}
              stroke={METRIC_COLORS.energy.primary}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Cursor line when scrubbing */}
          {activeIndex !== null && (
            <Line
              x1={getX(activeIndex)}
              y1={padding.top}
              x2={getX(activeIndex)}
              y2={padding.top + plotHeight}
              stroke="rgba(0, 0, 0, 0.12)"
              strokeWidth={1.5}
            />
          )}

          {/* Dots on active metrics when scrubbing */}
          {activeIndex !== null && activeMetrics.has('sleep') && (
            <Circle
              cx={getX(activeIndex)}
              cy={getY(data.sleep[activeIndex])}
              r={5}
              fill={METRIC_COLORS.sleep.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
          {activeIndex !== null && activeMetrics.has('nutrition') && (
            <Circle
              cx={getX(activeIndex)}
              cy={getY(data.nutrition[activeIndex])}
              r={5}
              fill={METRIC_COLORS.nutrition.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
          {activeIndex !== null && activeMetrics.has('energy') && (
            <Circle
              cx={getX(activeIndex)}
              cy={getY(data.energy[activeIndex])}
              r={5}
              fill={METRIC_COLORS.energy.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}

          {/* X-axis labels - matching Overview style */}
          <SvgText x={padding.left} y={chartHeight - 8} fontSize="10" fill="#C9CDD3" textAnchor="start" fontWeight="500">
            30d ago
          </SvgText>
          <SvgText x={chartWidth - padding.right} y={chartHeight - 8} fontSize="10" fill="#C9CDD3" textAnchor="end" fontWeight="500">
            Today
          </SvgText>
        </Svg>
      </View>

      <Text style={styles.chartHint}>Tap metrics to show/hide</Text>
    </View>
  );
};

// Summary Stat Item
interface SummaryStatProps {
  label: string;
  value: string;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: string;
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, unit, trend, trendValue, color }) => {
  const trendIcon = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'remove';
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF';

  return (
    <View style={styles.summaryStat}>
      {/* Label */}
      <Text style={styles.summaryLabel}>{label}</Text>
      {/* Value */}
      <View style={styles.summaryValueRow}>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={styles.summaryUnit}>{unit}</Text>
      </View>
      {/* Trend */}
      <View style={styles.summaryTrendRow}>
        <Ionicons name={trendIcon} size={12} color={trendColor} />
        <Text style={[styles.summaryTrendText, { color: trendColor }]}>{trendValue}%</Text>
      </View>
    </View>
  );
};

const MonthlyBodyTrackingInsightsContent: React.FC<MonthlyBodyTrackingInsightsContentProps> = ({
  onContinue,
  data: propData,
}) => {
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricType>>(new Set(['sleep', 'energy', 'nutrition']));
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const mockData = useMemo(() => propData || generateMockData(), [propData]);

  const sleepStats = useMemo(() => calculateStats(mockData.sleep), [mockData.sleep]);
  const energyStats = useMemo(() => calculateStats(mockData.energy), [mockData.energy]);
  const nutritionStats = useMemo(() => calculateStats(mockData.nutrition), [mockData.nutrition]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleToggleMetric = (metric: MetricType) => {
    setActiveMetrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(metric)) {
        // Don't allow deselecting all metrics
        if (newSet.size > 1) {
          newSet.delete(metric);
        }
      } else {
        newSet.add(metric);
      }
      return newSet;
    });
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
              <Ionicons name="bulb" size={28} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Your 30-Day Patterns</Text>
          <Text style={styles.headerSubtitle}>
            See how sleep, energy, and nutrition connect
          </Text>
        </View>

        {/* Combined Chart */}
        <CombinedChart
          data={mockData}
          activeMetrics={activeMetrics}
          onToggleMetric={handleToggleMetric}
        />

        {/* Summary Stats Row */}
        <View style={styles.summaryRow}>
          <SummaryStat
            label="Sleep"
            value={sleepStats.avg.toFixed(1)}
            unit="hrs"
            trend={sleepStats.trend as 'up' | 'down' | 'neutral'}
            trendValue={sleepStats.trendValue}
            color={METRIC_COLORS.sleep.primary}
          />
          <View style={styles.summaryDivider} />
          <SummaryStat
            label="Energy"
            value={energyStats.avg.toFixed(1)}
            unit="/10"
            trend={energyStats.trend as 'up' | 'down' | 'neutral'}
            trendValue={energyStats.trendValue}
            color={METRIC_COLORS.energy.primary}
          />
          <View style={styles.summaryDivider} />
          <SummaryStat
            label="Nutrition"
            value={nutritionStats.avg.toFixed(1)}
            unit="/10"
            trend={nutritionStats.trend as 'up' | 'down' | 'neutral'}
            trendValue={nutritionStats.trendValue}
            color={METRIC_COLORS.nutrition.primary}
          />
        </View>

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
    paddingBottom: 80,
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
    marginBottom: 20,
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
    fontSize: 23,
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

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    minHeight: 36,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  legendItemInactive: {
    opacity: 0.6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Scrubbing Info (replaces legend when scrubbing)
  scrubbingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrubbingDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  scrubbingValues: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  scrubbingValueText: {
    fontSize: 13,
  },

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 2,
  },
  summaryTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginTop: 4,
  },
  summaryTrendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
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

export default MonthlyBodyTrackingInsightsContent;
