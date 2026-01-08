import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================
type DailyMetrics = {
  date: string;
  nutrition?: number;
  energy?: number;
  satisfaction?: number;
};

// ============================================
// CONFIGURATION
// ============================================
const CARD_PADDING = 16;
const SCROLL_PADDING = 16; // ScrollView horizontal padding from StatisticsScreen
const CHART_HEIGHT = 52;
// Chart width = screen - scroll padding (both sides) - card padding (both sides)
const CHART_WIDTH = SCREEN_WIDTH - (SCROLL_PADDING * 2) - (CARD_PADDING * 2);
const SECTION_GAP = 16;

// Muted, Apple-like colors
const COLORS = {
  nutrition: { main: '#10B981', light: '#D1FAE5' },
  energy: { main: '#F59E0B', light: '#FEF3C7' },
  satisfaction: { main: '#3B82F6', light: '#DBEAFE' },
};

// ============================================
// MOCK DATA GENERATION
// ============================================
const generateMockData = (): DailyMetrics[] => {
  const data: DailyMetrics[] = [];
  const today = new Date();

  // Smooth continuous patterns (some nulls for tracking gaps, but we'll interpolate visually)
  const nutritionPattern = [
    6.5, 7.2, 7.8, 7.1, 6.4, 5.9, 6.3, 6.8, 7.1, 7.8,
    8.2, 8.5, 7.9, 7.2, 6.9, 6.8, 6.1, 5.4, 5.9, 6.7,
    7.0, 7.4, 8.1, 7.6, 7.0, 6.8, 6.5, 7.2, 7.9, 8.1
  ];

  const energyPattern = [
    5.8, 6.2, 6.9, 6.3, 5.5, 5.1, 5.6, 6.0, 6.4, 7.0,
    7.5, 7.9, 7.2, 6.5, 6.2, 6.0, 5.3, 4.6, 5.2, 6.0,
    6.4, 6.8, 7.3, 6.8, 6.2, 5.9, 5.8, 6.5, 7.1, 6.8
  ];

  const satisfactionPattern = [
    7.2, 7.6, 8.1, 7.5, 6.8, 6.3, 6.8, 7.1, 7.4, 8.0,
    8.4, 8.8, 8.2, 7.5, 7.2, 7.0, 6.3, 5.6, 6.2, 7.0,
    7.4, 7.8, 8.4, 8.0, 7.3, 7.0, 6.8, 7.5, 8.2, 7.8
  ];

  // Mark some days as not tracked (for coverage calculation, not visual gaps)
  const untrackedDays = new Set([7, 14, 20, 25]);

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayIndex = 29 - i;

    if (untrackedDays.has(dayIndex)) {
      // Day not tracked - no values but we still have visual continuity
      data.push({ date: dateStr });
    } else {
      data.push({
        date: dateStr,
        nutrition: nutritionPattern[dayIndex],
        energy: energyPattern[dayIndex],
        satisfaction: satisfactionPattern[dayIndex],
      });
    }
  }

  return data;
};

// ============================================
// SVG PATH BUILDERS - SMOOTH CONTINUOUS LINES
// Uses Catmull-Rom to Bezier conversion for smooth curves
// ============================================
const buildSmoothPath = (
  values: number[],
  width: number,
  height: number
): string => {
  if (values.length < 2) return '';

  const padding = { top: 4, bottom: 4 };
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = width / (values.length - 1);

  const scaleY = (value: number): number => {
    const normalized = (value - 1) / (10 - 1);
    return padding.top + plotHeight * (1 - normalized);
  };

  const points = values.map((v, i) => ({
    x: i * xStep,
    y: scaleY(v),
  }));

  // Start path
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  // Use quadratic bezier curves for smoothness
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Control points for smooth curve
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
};

const buildSmoothAreaPath = (
  values: number[],
  width: number,
  height: number
): string => {
  const linePath = buildSmoothPath(values, width, height);
  if (!linePath) return '';

  const xStep = width / (values.length - 1);
  const lastX = (values.length - 1) * xStep;

  return `${linePath} L ${lastX.toFixed(2)} ${height} L 0 ${height} Z`;
};

const getXY = (
  index: number,
  values: number[],
  width: number,
  height: number
): { x: number; y: number } => {
  const padding = { top: 4, bottom: 4 };
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = width / (values.length - 1);
  const x = index * xStep;
  const normalized = (values[index] - 1) / (10 - 1);
  const y = padding.top + plotHeight * (1 - normalized);
  return { x, y };
};

// Calculate average
const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
};

// ============================================
// METRIC CHART SECTION
// ============================================
interface MetricChartProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  values: number[];
  color: { main: string; light: string };
  gradientId: string;
  activeIndex: number | null;
  isLast?: boolean;
  displayValue: number; // Either average or selected day's value
}

const MetricChart = React.memo(({
  icon,
  label,
  values,
  color,
  gradientId,
  activeIndex,
  isLast,
  displayValue,
}: MetricChartProps) => {
  const linePath = useMemo(() => buildSmoothPath(values, CHART_WIDTH, CHART_HEIGHT), [values]);
  const areaPath = useMemo(() => buildSmoothAreaPath(values, CHART_WIDTH, CHART_HEIGHT), [values]);

  const dot = activeIndex !== null
    ? getXY(activeIndex, values, CHART_WIDTH, CHART_HEIGHT)
    : null;

  const isActive = activeIndex !== null;

  return (
    <View style={[styles.metricSection, !isLast && styles.metricSectionBorder]}>
      {/* Header */}
      <View style={styles.metricHeader}>
        <View style={styles.metricLabelRow}>
          <Ionicons name={icon} size={18} color={color.main} />
          <Text style={[styles.metricLabel, { color: color.main }]}>{label}</Text>
        </View>
        <Text style={[styles.metricValue, { color: color.main }]}>{displayValue}</Text>
      </View>

      {/* Chart */}
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color.main} stopOpacity={isActive ? "0.22" : "0.15"} />
              <Stop offset="100%" stopColor={color.main} stopOpacity="0.01" />
            </LinearGradient>
          </Defs>

          {/* Subtle reference lines at values 1, 5, 10 */}
          {[1, 5, 10].map((value) => {
            const padding = { top: 4, bottom: 4 };
            const plotHeight = CHART_HEIGHT - padding.top - padding.bottom;
            const normalized = (value - 1) / (10 - 1);
            const y = padding.top + plotHeight * (1 - normalized);
            return (
              <Path
                key={value}
                d={`M 0 ${y.toFixed(1)} L ${CHART_WIDTH} ${y.toFixed(1)}`}
                stroke="#D1D5DB"
                strokeWidth={1}
                strokeDasharray="2,6"
                opacity={0.5}
              />
            );
          })}

          {/* Area fill */}
          <Path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line */}
          <Path
            d={linePath}
            stroke={color.main}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Active dot */}
          {dot && (
            <Circle
              cx={dot.x}
              cy={dot.y}
              r={5}
              fill={color.main}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
        </Svg>

        {/* Cursor line */}
        {activeIndex !== null && (
          <View
            style={[
              styles.cursorLine,
              { left: (activeIndex / 29) * CHART_WIDTH },
            ]}
          />
        )}
      </View>
    </View>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const LinkedSparklines30DayOverviewSection = (): React.JSX.Element => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartAreaRef = useRef<View>(null);

  const mockData = useMemo(() => generateMockData(), []);

  // Extract continuous value arrays (interpolating missing for smooth visual)
  const { nutritionValues, energyValues, satisfactionValues, trackedDays, dates } = useMemo(() => {
    // Use pattern values directly for smooth continuous chart
    const nutrition = [
      6.5, 7.2, 7.8, 7.1, 6.4, 5.9, 6.3, 6.8, 7.1, 7.8,
      8.2, 8.5, 7.9, 7.2, 6.9, 6.8, 6.1, 5.4, 5.9, 6.7,
      7.0, 7.4, 8.1, 7.6, 7.0, 6.8, 6.5, 7.2, 7.9, 8.1
    ];

    const energy = [
      5.8, 6.2, 6.9, 6.3, 5.5, 5.1, 5.6, 6.0, 6.4, 7.0,
      7.5, 7.9, 7.2, 6.5, 6.2, 6.0, 5.3, 4.6, 5.2, 6.0,
      6.4, 6.8, 7.3, 6.8, 6.2, 5.9, 5.8, 6.5, 7.1, 6.8
    ];

    const satisfaction = [
      7.2, 7.6, 8.1, 7.5, 6.8, 6.3, 6.8, 7.1, 7.4, 8.0,
      8.4, 8.8, 8.2, 7.5, 7.2, 7.0, 6.3, 5.6, 6.2, 7.0,
      7.4, 7.8, 8.4, 8.0, 7.3, 7.0, 6.8, 7.5, 8.2, 7.8
    ];

    // Generate dates for last 30 days
    const today = new Date();
    const dateArray: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateArray.push(date);
    }

    // Count tracked days from mockData
    let tracked = 0;
    mockData.forEach((day) => {
      if (day.nutrition !== undefined || day.energy !== undefined || day.satisfaction !== undefined) {
        tracked++;
      }
    });

    return {
      nutritionValues: nutrition,
      energyValues: energy,
      satisfactionValues: satisfaction,
      trackedDays: tracked,
      dates: dateArray,
    };
  }, [mockData]);

  // Calculate averages
  const nutritionAvg = useMemo(() => calculateAverage(nutritionValues), [nutritionValues]);
  const energyAvg = useMemo(() => calculateAverage(energyValues), [energyValues]);
  const satisfactionAvg = useMemo(() => calculateAverage(satisfactionValues), [satisfactionValues]);

  // Format selected date
  const selectedDateStr = useMemo(() => {
    if (activeIndex === null) return null;
    const date = dates[activeIndex];
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [activeIndex, dates]);

  // Get display values (selected day's value or average)
  const nutritionDisplay = activeIndex !== null ? nutritionValues[activeIndex] : nutritionAvg;
  const energyDisplay = activeIndex !== null ? energyValues[activeIndex] : energyAvg;
  const satisfactionDisplay = activeIndex !== null ? satisfactionValues[activeIndex] : satisfactionAvg;

  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, CHART_WIDTH));
    const index = Math.round((clampedX / CHART_WIDTH) * 29);
    return Math.max(0, Math.min(29, index));
  }, [chartLayoutX]);

  const handleLayout = useCallback(() => {
    chartAreaRef.current?.measureInWindow((x) => {
      setChartLayoutX(x);
    });
  }, []);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.pageX);
        setActiveIndex(index);
      },

      onPanResponderMove: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.pageX);
        setActiveIndex(index);
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
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="analytics" size={14} color="#6B7280" />
          <Text style={styles.title}>30-Day Overview</Text>
        </View>
        {selectedDateStr && (
          <Text style={styles.selectedDate}>{selectedDateStr}</Text>
        )}
      </View>

      {/* Charts - single gesture surface */}
      <View
        ref={chartAreaRef}
        style={styles.chartsContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <MetricChart
          icon="leaf"
          label="Nutrition"
          values={nutritionValues}
          color={COLORS.nutrition}
          gradientId="nutritionGrad"
          activeIndex={activeIndex}
          displayValue={nutritionDisplay}
        />

        <MetricChart
          icon="flash"
          label="Energy"
          values={energyValues}
          color={COLORS.energy}
          gradientId="energyGrad"
          activeIndex={activeIndex}
          displayValue={energyDisplay}
        />

        <MetricChart
          icon="sparkles"
          label="Satisfaction"
          values={satisfactionValues}
          color={COLORS.satisfaction}
          gradientId="satisfactionGrad"
          activeIndex={activeIndex}
          displayValue={satisfactionDisplay}
          isLast
        />
      </View>

      {/* Time labels */}
      <View style={styles.timeLabels}>
        <Text style={styles.timeLabel}>30d ago</Text>
        <Text style={styles.timeLabel}>Today</Text>
      </View>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          Tracked on {trackedDays} of 30 days
        </Text>
      </View>
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: CARD_PADDING,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },

  selectedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  chartsContainer: {
    gap: SECTION_GAP,
  },

  metricSection: {
    paddingBottom: SECTION_GAP,
  },

  metricSectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metricLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },

  metricValue: {
    fontSize: 17,
    fontWeight: '600',
  },

  chartWrapper: {
    position: 'relative',
  },

  cursorLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: CHART_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 1,
  },

  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },

  timeLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  captionContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  caption: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default LinkedSparklines30DayOverviewSection;
