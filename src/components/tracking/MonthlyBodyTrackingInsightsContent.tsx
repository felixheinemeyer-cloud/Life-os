import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
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

  const scale = { min: 3, max: 10 };

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

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const tension = 0.25;

      const cp1x = current.x + (next.x - current.x) * tension;
      const cp1y = current.y;
      const cp2x = next.x - (next.x - current.x) * tension;
      const cp2y = next.y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  return (
    <View style={styles.chartCard}>
      {/* Legend / Toggle */}
      <View style={styles.legendRow}>
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
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            {(Object.keys(METRIC_COLORS) as MetricType[]).map((metric) => (
              <SvgLinearGradient key={metric} id={`gradient-${metric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={METRIC_COLORS[metric].primary} stopOpacity="0.2" />
                <Stop offset="100%" stopColor={METRIC_COLORS[metric].primary} stopOpacity="0" />
              </SvgLinearGradient>
            ))}
          </Defs>

          {/* Horizontal grid lines */}
          {[0, 0.33, 0.67, 1].map((ratio, i) => (
            <Line
              key={ratio}
              x1={padding.left}
              y1={padding.top + plotHeight * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + plotHeight * ratio}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray={i === 3 ? undefined : '3,3'}
            />
          ))}

          {/* Y-axis labels */}
          <SvgText x={padding.left - 8} y={padding.top + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {scale.max}
          </SvgText>
          <SvgText x={padding.left - 8} y={padding.top + plotHeight / 2 + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {Math.round((scale.max + scale.min) / 2)}
          </SvgText>
          <SvgText x={padding.left - 8} y={padding.top + plotHeight + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">
            {scale.min}
          </SvgText>

          {/* Metric lines */}
          {activeMetrics.has('sleep') && (
            <Path
              d={generatePath(data.sleep)}
              stroke={METRIC_COLORS.sleep.primary}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          )}
          {activeMetrics.has('nutrition') && (
            <Path
              d={generatePath(data.nutrition)}
              stroke={METRIC_COLORS.nutrition.primary}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          )}
          {activeMetrics.has('energy') && (
            <Path
              d={generatePath(data.energy)}
              stroke={METRIC_COLORS.energy.primary}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          )}

          {/* X-axis labels */}
          <SvgText x={padding.left} y={chartHeight - 8} fontSize="10" fill="#9CA3AF" textAnchor="start">
            Day 1
          </SvgText>
          <SvgText x={chartWidth / 2} y={chartHeight - 8} fontSize="10" fill="#9CA3AF" textAnchor="middle">
            Day 15
          </SvgText>
          <SvgText x={chartWidth - padding.right} y={chartHeight - 8} fontSize="10" fill="#9CA3AF" textAnchor="end">
            Day 30
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
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={styles.summaryValueRow}>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={styles.summaryUnit}>{unit}</Text>
      </View>
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
            label="Avg Sleep"
            value={sleepStats.avg.toFixed(1)}
            unit="hrs"
            trend={sleepStats.trend as 'up' | 'down' | 'neutral'}
            trendValue={sleepStats.trendValue}
            color={METRIC_COLORS.sleep.primary}
          />
          <View style={styles.summaryDivider} />
          <SummaryStat
            label="Avg Energy"
            value={energyStats.avg.toFixed(1)}
            unit="/10"
            trend={energyStats.trend as 'up' | 'down' | 'neutral'}
            trendValue={energyStats.trendValue}
            color={METRIC_COLORS.energy.primary}
          />
          <View style={styles.summaryDivider} />
          <SummaryStat
            label="Avg Nutrition"
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
    backgroundColor: '#F7F5F2',
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
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

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    gap: 2,
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
