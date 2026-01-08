import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================
interface DayData {
  date: Date;
  dateKey: string;
  nutrition: number | null;
  energy: number | null;
  satisfaction: number | null;
}

// ============================================
// MOCK DATA GENERATION
// Generates 30 days with realistic patterns and some missing data
// ============================================
const generateMockData = (): Map<string, DayData> => {
  const dataMap = new Map<string, DayData>();
  const today = new Date();

  // Predefined values with variation and missing days
  // null = entire day missing, -1 = specific metric missing
  const patterns: { n: number | null; e: number | null; s: number | null }[] = [
    { n: 7, e: 6, s: 7 },
    { n: 8, e: 7, s: 8 },
    { n: 6, e: 5, s: 6 },
    { n: 7, e: 7, s: 8 },
    { n: 5, e: 4, s: 5 },
    { n: 8, e: 8, s: 9 },
    { n: 7, e: 6, s: 7 },
    { n: null, e: null, s: null }, // Missing day
    { n: 6, e: 6, s: 7 },
    { n: 8, e: 7, s: 8 },
    { n: 9, e: 8, s: 9 },
    { n: 7, e: 6, s: 7 },
    { n: 6, e: 5, s: 6 },
    { n: 8, e: 7, s: 8 },
    { n: null, e: null, s: null }, // Missing day
    { n: 7, e: 7, s: 8 },
    { n: 5, e: 4, s: 5 },
    { n: 4, e: 3, s: 4 },
    { n: 6, e: 5, s: 6 },
    { n: 7, e: 7, s: 7 },
    { n: null, e: null, s: null }, // Missing day
    { n: 8, e: null, s: 8 }, // Energy missing
    { n: 9, e: 8, s: 9 },
    { n: 7, e: 7, s: null }, // Satisfaction missing
    { n: 6, e: 6, s: 7 },
    { n: null, e: null, s: null }, // Missing day
    { n: 8, e: 7, s: 8 },
    { n: 9, e: 9, s: 9 },
    { n: 8, e: 8, s: 8 },
    { n: null, e: null, s: null }, // Today - not tracked yet
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const pattern = patterns[29 - i];

    dataMap.set(dateKey, {
      date,
      dateKey,
      nutrition: pattern.n,
      energy: pattern.e,
      satisfaction: pattern.s,
    });
  }

  return dataMap;
};

// ============================================
// COLOR SYSTEM
// Single hue (teal) with controlled opacity/lightness
// Premium feel: subtle low values, confident high values
// ============================================
const ACCENT_HUE = { h: 168, s: 76 }; // Teal

const getCellStyle = (value: number | null): {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  opacity: number;
} => {
  // Missing value - intentional neutral appearance
  if (value === null) {
    return {
      backgroundColor: '#F8F9FA',
      borderColor: '#E9ECEF',
      borderWidth: 1,
      opacity: 1,
    };
  }

  // Map 1-10 to lightness values (high value = darker/more saturated)
  // Using HSL for controlled progression
  const clampedValue = Math.max(1, Math.min(10, Math.round(value)));

  // Lightness: 95% (value 1) -> 35% (value 10)
  const lightness = 95 - (clampedValue - 1) * 6.5;

  // Saturation increases slightly with value for richness
  const saturation = ACCENT_HUE.s + (clampedValue - 1) * 2;

  return {
    backgroundColor: `hsl(${ACCENT_HUE.h}, ${saturation}%, ${lightness}%)`,
    borderColor: 'transparent',
    borderWidth: 0,
    opacity: 1,
  };
};

// ============================================
// MINI LEGEND COMPONENT
// Shows low-to-high gradient in 5 steps
// ============================================
const MicroLegend = React.memo(() => {
  const steps = [2, 4, 6, 8, 10];

  return (
    <View style={styles.legendContainer}>
      <Text style={styles.legendLabel}>Low</Text>
      <View style={styles.legendCells}>
        {steps.map((value) => {
          const cellStyle = getCellStyle(value);
          return (
            <View
              key={value}
              style={[
                styles.legendCell,
                { backgroundColor: cellStyle.backgroundColor },
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.legendLabel}>High</Text>
    </View>
  );
});

// ============================================
// WEEK BLOCK COMPONENT
// Renders a group of days (typically 7, or fewer for partial weeks)
// ============================================
interface WeekBlockProps {
  days: (number | null)[];
  weekLabel: string;
}

const WeekBlock = React.memo(({ days, weekLabel }: WeekBlockProps) => {
  return (
    <View style={styles.weekBlock}>
      <View style={styles.weekCells}>
        {days.map((value, index) => {
          const cellStyle = getCellStyle(value);
          return (
            <View
              key={index}
              style={[
                styles.cell,
                {
                  backgroundColor: cellStyle.backgroundColor,
                  borderColor: cellStyle.borderColor,
                  borderWidth: cellStyle.borderWidth,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
});

// ============================================
// METRIC ROW COMPONENT
// One row for a single metric, divided into week blocks
// ============================================
interface MetricRowProps {
  label: string;
  color: string;
  weekBlocks: (number | null)[][];
}

const MetricRow = React.memo(({ label, color, weekBlocks }: MetricRowProps) => {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLabelContainer}>
        <View style={[styles.metricDot, { backgroundColor: color }]} />
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricBlocks}>
        {weekBlocks.map((days, weekIndex) => (
          <WeekBlock
            key={weekIndex}
            days={days}
            weekLabel={`W${weekIndex + 1}`}
          />
        ))}
      </View>
    </View>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
const ThirtyDayOverviewHeatmapSection = (): React.JSX.Element => {
  // Generate and process mock data
  const { weekBlocks, trackedDays } = useMemo(() => {
    const mockData = generateMockData();
    const today = new Date();

    // Build array of last 30 dates
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Extract values for each metric
    const nutritionValues: (number | null)[] = [];
    const energyValues: (number | null)[] = [];
    const satisfactionValues: (number | null)[] = [];
    let tracked = 0;

    dates.forEach((dateKey) => {
      const dayData = mockData.get(dateKey);
      if (dayData) {
        nutritionValues.push(dayData.nutrition);
        energyValues.push(dayData.energy);
        satisfactionValues.push(dayData.satisfaction);

        if (dayData.nutrition !== null || dayData.energy !== null || dayData.satisfaction !== null) {
          tracked++;
        }
      } else {
        nutritionValues.push(null);
        energyValues.push(null);
        satisfactionValues.push(null);
      }
    });

    // Split into week blocks (7, 7, 7, 7, 2)
    const splitIntoWeeks = (values: (number | null)[]): (number | null)[][] => {
      const weeks: (number | null)[][] = [];
      for (let i = 0; i < values.length; i += 7) {
        weeks.push(values.slice(i, Math.min(i + 7, values.length)));
      }
      return weeks;
    };

    return {
      weekBlocks: {
        nutrition: splitIntoWeeks(nutritionValues),
        energy: splitIntoWeeks(energyValues),
        satisfaction: splitIntoWeeks(satisfactionValues),
      },
      trackedDays: tracked,
    };
  }, []);

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.header}>
        <Text style={styles.title}>30-Day Overview</Text>
        <MicroLegend />
      </View>

      {/* Week Labels */}
      <View style={styles.weekLabelsRow}>
        <View style={styles.metricLabelContainer} />
        <View style={styles.weekLabelsContainer}>
          {['W1', 'W2', 'W3', 'W4', 'W5'].map((label, index) => (
            <View
              key={label}
              style={[
                styles.weekLabelWrapper,
                index === 4 && styles.weekLabelWrapperLast,
              ]}
            >
              <Text style={styles.weekLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Heatmap Grid */}
      <View style={styles.heatmapContainer}>
        <MetricRow
          label="Nutrition"
          color="#10B981"
          weekBlocks={weekBlocks.nutrition}
        />
        <MetricRow
          label="Energy"
          color="#F59E0B"
          weekBlocks={weekBlocks.energy}
        />
        <MetricRow
          label="Mood"
          color="#3B82F6"
          weekBlocks={weekBlocks.satisfaction}
        />
      </View>

      {/* Time Reference */}
      <View style={styles.timeRow}>
        <View style={styles.metricLabelContainer} />
        <View style={styles.timeLabels}>
          <Text style={styles.timeLabel}>30d ago</Text>
          <Text style={styles.timeLabel}>Today</Text>
        </View>
      </View>

      {/* Coverage Caption */}
      <View style={styles.captionRow}>
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
const CARD_PADDING = 16;
const LABEL_WIDTH = 64;
const WEEK_GAP = 8;
const CELL_GAP = 2;
const CELLS_PER_WEEK = 7;
const NUM_WEEKS = 5;

// Calculate cell size based on available width
const availableWidth = SCREEN_WIDTH - (CARD_PADDING * 2) - LABEL_WIDTH - (WEEK_GAP * (NUM_WEEKS - 1));
const totalCellsWidth = availableWidth - (CELL_GAP * (30 - NUM_WEEKS)); // gaps within weeks
const CELL_SIZE = Math.floor(totalCellsWidth / 30);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: CARD_PADDING,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },

  // Micro Legend
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  legendCells: {
    flexDirection: 'row',
    gap: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  // Week Labels Row
  weekLabelsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabelsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  weekLabelWrapper: {
    width: CELLS_PER_WEEK * (CELL_SIZE + CELL_GAP) - CELL_GAP,
    marginRight: WEEK_GAP,
  },
  weekLabelWrapperLast: {
    width: 2 * (CELL_SIZE + CELL_GAP) - CELL_GAP, // Last week has 2 days
    marginRight: 0,
  },
  weekLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // Heatmap Container
  heatmapContainer: {
    gap: 8,
  },

  // Metric Row
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabelContainer: {
    width: LABEL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  metricBlocks: {
    flexDirection: 'row',
    flex: 1,
    gap: WEEK_GAP,
  },

  // Week Block
  weekBlock: {
    flexDirection: 'column',
  },
  weekCells: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },

  // Individual Cell
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },

  // Time Row
  timeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  timeLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // Caption
  captionRow: {
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

export default ThirtyDayOverviewHeatmapSection;
