import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================
type DailyMetrics = {
  date: string; // ISO yyyy-mm-dd
  nutrition?: number;
  energy?: number;
  satisfaction?: number;
};

// ============================================
// MOCK DATA GENERATION
// Deterministic data with realistic patterns and intentional gaps.
// Includes 5 completely missing days + 2 partial days (one metric missing).
// Values follow natural patterns with some correlation between metrics.
// ============================================
const generateMockData = (): DailyMetrics[] => {
  const data: DailyMetrics[] = [];
  const today = new Date();

  // Predefined patterns: null = missing value for that metric
  // Creates realistic variation with energy/satisfaction loosely tracking nutrition
  const patterns: { n: number | null; e: number | null; s: number | null }[] = [
    { n: 7, e: 6, s: 7 },       // Day 1 (30 days ago)
    { n: 8, e: 7, s: 8 },
    { n: 6, e: 5, s: 6 },
    { n: 7, e: 7, s: 8 },
    { n: 5, e: 4, s: 5 },
    { n: 8, e: 8, s: 9 },
    { n: 7, e: 6, s: 7 },
    { n: null, e: null, s: null }, // Missing day 8
    { n: 6, e: 6, s: 7 },
    { n: 8, e: 7, s: 8 },
    { n: 9, e: 8, s: 9 },
    { n: 7, e: 6, s: 7 },
    { n: 6, e: 5, s: 6 },
    { n: 8, e: 7, s: 8 },
    { n: null, e: null, s: null }, // Missing day 15
    { n: 7, e: 7, s: 8 },
    { n: 5, e: 4, s: 5 },
    { n: 4, e: 3, s: 4 },
    { n: 6, e: 5, s: 6 },
    { n: 7, e: 7, s: 7 },
    { n: null, e: null, s: null }, // Missing day 21
    { n: 8, e: null, s: 8 },       // Partial: energy missing
    { n: 9, e: 8, s: 9 },
    { n: 7, e: 7, s: null },       // Partial: satisfaction missing
    { n: 6, e: 6, s: 7 },
    { n: null, e: null, s: null }, // Missing day 26
    { n: 8, e: 7, s: 8 },
    { n: 9, e: 9, s: 9 },
    { n: 8, e: 8, s: 8 },
    { n: null, e: null, s: null }, // Missing today (day 30)
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const pattern = patterns[29 - i];

    data.push({
      date: dateStr,
      nutrition: pattern.n ?? undefined,
      energy: pattern.e ?? undefined,
      satisfaction: pattern.s ?? undefined,
    });
  }

  return data;
};

// ============================================
// SVG PATH BUILDER WITH GAPS
// Creates path string that breaks (gaps) for missing values.
// Uses MoveTo (M) to start new line segments after gaps.
// Does NOT interpolate - missing days create visible breaks.
// ============================================
const buildSparklinePath = (
  values: (number | undefined)[],
  width: number,
  height: number,
  padding: { top: number; bottom: number }
): string => {
  const plotHeight = height - padding.top - padding.bottom;
  const pointCount = values.length;
  const xStep = width / (pointCount - 1);

  // Y-Scale: maps value (1-10) to pixel position
  // Inverted: value 10 at top (low y), value 1 at bottom (high y)
  const scaleY = (value: number): number => {
    const normalized = (value - 1) / (10 - 1); // 0 to 1
    return padding.top + plotHeight * (1 - normalized);
  };

  let path = '';
  let isDrawing = false;

  values.forEach((value, index) => {
    const x = index * xStep;

    if (value !== undefined) {
      const y = scaleY(value);

      if (!isDrawing) {
        // Start new segment with MoveTo (creates gap after missing values)
        path += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
        isDrawing = true;
      } else {
        // Continue current segment with LineTo
        path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    } else {
      // Missing value - mark that we need to start fresh next time
      isDrawing = false;
    }
  });

  return path;
};

// ============================================
// AREA PATH BUILDER (for subtle gradient fill)
// Creates closed path segments for each continuous line section
// ============================================
const buildAreaPath = (
  values: (number | undefined)[],
  width: number,
  height: number,
  padding: { top: number; bottom: number }
): string => {
  const plotHeight = height - padding.top - padding.bottom;
  const pointCount = values.length;
  const xStep = width / (pointCount - 1);
  const bottomY = padding.top + plotHeight;

  const scaleY = (value: number): number => {
    const normalized = (value - 1) / (10 - 1);
    return padding.top + plotHeight * (1 - normalized);
  };

  let areaPath = '';
  let segmentStart: { x: number; y: number } | null = null;
  let lastPoint: { x: number; y: number } | null = null;

  values.forEach((value, index) => {
    const x = index * xStep;

    if (value !== undefined) {
      const y = scaleY(value);

      if (segmentStart === null) {
        // Start new segment
        segmentStart = { x, y };
        areaPath += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      } else {
        areaPath += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
      lastPoint = { x, y };
    } else {
      // Close current segment if exists
      if (segmentStart !== null && lastPoint !== null) {
        areaPath += ` L ${lastPoint.x.toFixed(2)} ${bottomY.toFixed(2)}`;
        areaPath += ` L ${segmentStart.x.toFixed(2)} ${bottomY.toFixed(2)} Z`;
      }
      segmentStart = null;
      lastPoint = null;
    }
  });

  // Close final segment
  if (segmentStart !== null && lastPoint !== null) {
    areaPath += ` L ${lastPoint.x.toFixed(2)} ${bottomY.toFixed(2)}`;
    areaPath += ` L ${segmentStart.x.toFixed(2)} ${bottomY.toFixed(2)} Z`;
  }

  return areaPath;
};

// ============================================
// SPARKLINE ROW COMPONENT
// Renders label + SVG sparkline for one metric
// ============================================
interface SparklineRowProps {
  label: string;
  values: (number | undefined)[];
  color: string;
  gradientId: string;
}

const SPARKLINE_HEIGHT = 26;
const LABEL_WIDTH = 76;
const CHART_PADDING = { top: 3, bottom: 3 };

const SparklineRow = React.memo(({ label, values, color, gradientId }: SparklineRowProps) => {
  const chartWidth = SCREEN_WIDTH - 32 - LABEL_WIDTH - 8; // card padding - label - gap

  const linePath = useMemo(
    () => buildSparklinePath(values, chartWidth, SPARKLINE_HEIGHT, CHART_PADDING),
    [values, chartWidth]
  );

  const areaPath = useMemo(
    () => buildAreaPath(values, chartWidth, SPARKLINE_HEIGHT, CHART_PADDING),
    [values, chartWidth]
  );

  return (
    <View style={styles.sparklineRow}>
      <View style={styles.labelContainer}>
        <View style={[styles.labelDot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={SPARKLINE_HEIGHT}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.10" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </LinearGradient>
          </Defs>

          {/* Subtle area fill under the line */}
          {areaPath && (
            <Path
              d={areaPath}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Main sparkline */}
          <Path
            d={linePath}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const ThirtyDayOverviewSparklinesSection = (): React.JSX.Element => {
  const mockData = useMemo(() => generateMockData(), []);

  // Extract value arrays for each metric and calculate coverage
  const { nutritionValues, energyValues, satisfactionValues, trackedDays } = useMemo(() => {
    const nutrition: (number | undefined)[] = [];
    const energy: (number | undefined)[] = [];
    const satisfaction: (number | undefined)[] = [];
    let tracked = 0;

    mockData.forEach((day) => {
      nutrition.push(day.nutrition);
      energy.push(day.energy);
      satisfaction.push(day.satisfaction);

      // Coverage definition: a day is "tracked" if at least one metric is present.
      // This matches typical product logic where partial tracking still counts.
      if (day.nutrition !== undefined || day.energy !== undefined || day.satisfaction !== undefined) {
        tracked++;
      }
    });

    return {
      nutritionValues: nutrition,
      energyValues: energy,
      satisfactionValues: satisfaction,
      trackedDays: tracked,
    };
  }, [mockData]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>30-Day Overview</Text>
      </View>

      {/* Sparkline Rows - stacked for easy pattern comparison */}
      <View style={styles.sparklinesContainer}>
        <SparklineRow
          label="Nutrition"
          values={nutritionValues}
          color="#10B981"
          gradientId="nutritionGrad"
        />
        <SparklineRow
          label="Energy"
          values={energyValues}
          color="#F59E0B"
          gradientId="energyGrad"
        />
        <SparklineRow
          label="Satisfaction"
          values={satisfactionValues}
          color="#3B82F6"
          gradientId="satisfactionGrad"
        />
      </View>

      {/* Time reference labels */}
      <View style={styles.timeLabelsRow}>
        <View style={styles.labelContainer} />
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>30d ago</Text>
          <Text style={styles.timeLabel}>Today</Text>
        </View>
      </View>

      {/* Coverage caption */}
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },

  sparklinesContainer: {
    gap: 10,
  },

  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  labelContainer: {
    width: LABEL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  chartContainer: {
    flex: 1,
  },

  timeLabelsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },

  timeLabels: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
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

export default ThirtyDayOverviewSparklinesSection;
