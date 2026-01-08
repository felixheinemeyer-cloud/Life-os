import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Path,
  Circle,
  G,
  Line,
  Text as SvgText,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import LinkedSparklines30DayOverviewSection from '../components/statistics/LinkedSparklines30DayOverviewSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'daily' | 'weekly' | 'monthly';
type MetricType = 'nutrition' | 'energy' | 'satisfaction' | null;

interface StatisticsScreenProps {
  navigation?: {
    goBack: () => void;
  };
}

// ============================================
// MOCK DATA - Replace with real data later
// ============================================
const MOCK_DAILY_DATA = {
  // Last 7 days of data (Mon-Sun)
  sleep: [7.5, 6.5, 8, 7, 6, 8.5, 7.5], // hours
  nutrition: [7, 8, 6, 8, 7, 9, 8], // 1-10 scale
  energy: [6, 7, 5, 8, 6, 8, 7], // 1-10 scale
  satisfaction: [8, 7, 6, 8, 7, 9, 8], // 1-10 scale
  priorityCompletion: [80, 100, 60, 90, 70, 100, 85], // percentage
  journalEntries: [true, true, false, true, true, true, true], // boolean
};

// Priority completion data for past 30 days
// true = completed, false = missed, null = no priority set
type PriorityStatus = true | false | null;

interface PriorityDayData {
  date: Date;
  status: PriorityStatus;
  dayOfWeek: number;
}

const generateLast30DaysPriorityData = (): PriorityDayData[] => {
  const data: PriorityDayData[] = [];
  const today = new Date();

  // Mock status pattern (realistic completion rates)
  const mockStatuses: PriorityStatus[] = [
    true, true, false, true, true, true, null,  // Week 1
    true, false, true, true, true, true, true,  // Week 2
    null, true, true, false, true, true, true,  // Week 3
    true, true, true, true, false, null, true,  // Week 4
    true, true                                   // Last 2 days
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date,
      status: mockStatuses[29 - i],
      dayOfWeek: date.getDay(),
    });
  }

  return data;
};

const PRIORITY_30_DAYS = generateLast30DaysPriorityData();

// Calculate priority statistics
const calculatePriorityStats = (data: PriorityDayData[]) => {
  const daysWithPriority = data.filter(d => d.status !== null);
  const completed = daysWithPriority.filter(d => d.status === true).length;
  const missed = daysWithPriority.filter(d => d.status === false).length;
  const skipped = data.filter(d => d.status === null).length;
  const total = daysWithPriority.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Calculate current streak
  let currentStreak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].status === true) {
      currentStreak++;
    } else if (data[i].status === false) {
      break;
    }
    // null (skipped) doesn't break streak
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  for (const day of data) {
    if (day.status === true) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else if (day.status === false) {
      tempStreak = 0;
    }
  }

  return {
    completed,
    missed,
    skipped,
    total,
    completionRate,
    currentStreak,
    longestStreak,
  };
};

const PRIORITY_STATS = calculatePriorityStats(PRIORITY_30_DAYS);

// Sleep data for past 30 days (hours of sleep, null = no data)
interface SleepDayData {
  date: Date;
  hours: number | null;
}

const generateLast30DaysSleepData = (): SleepDayData[] => {
  const data: SleepDayData[] = [];
  const today = new Date();

  // Mock sleep hours (realistic pattern with some variation)
  const mockHours: (number | null)[] = [
    7.5, 6.5, 8.0, 7.0, 6.0, 8.5, 7.5,  // Week 1
    7.0, 6.5, 7.5, 8.0, 7.5, 9.0, 8.0,  // Week 2
    null, 7.0, 6.5, 5.5, 7.0, 7.5, 8.0, // Week 3
    7.5, 8.0, 7.0, 6.5, 7.0, null, 8.5, // Week 4
    7.5, 7.0                             // Last 2 days
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date,
      hours: mockHours[29 - i],
    });
  }

  return data;
};

const SLEEP_30_DAYS = generateLast30DaysSleepData();

// Calculate sleep statistics
const calculateSleepStats = (data: SleepDayData[]) => {
  const validDays = data.filter(d => d.hours !== null) as { date: Date; hours: number }[];
  const total = validDays.length;

  if (total === 0) {
    return { average: 0, min: 0, max: 0, total: 0, optimal: 0 };
  }

  const hours = validDays.map(d => d.hours);
  const sum = hours.reduce((a, b) => a + b, 0);
  const average = sum / total;
  const min = Math.min(...hours);
  const max = Math.max(...hours);
  const optimal = validDays.filter(d => d.hours >= 7 && d.hours <= 9).length;

  return {
    average: Math.round(average * 10) / 10,
    min,
    max,
    total,
    optimal,
  };
};

const SLEEP_STATS = calculateSleepStats(SLEEP_30_DAYS);

// Journal data for past 30 days (true = journaled, false = skipped)
interface JournalDayData {
  date: Date;
  journaled: boolean;
}

const generateLast30DaysJournalData = (): JournalDayData[] => {
  const data: JournalDayData[] = [];
  const today = new Date();

  // Mock journaling pattern (realistic - most days journaled)
  const mockJournaled: boolean[] = [
    true, true, false, true, true, true, true,   // Week 1
    true, false, true, true, true, true, true,   // Week 2
    false, true, true, false, true, true, true,  // Week 3
    true, true, true, true, false, true, true,   // Week 4
    true, true                                    // Last 2 days
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date,
      journaled: mockJournaled[29 - i],
    });
  }

  return data;
};

const JOURNAL_30_DAYS = generateLast30DaysJournalData();

// Calculate journal statistics
const calculateJournalStats = (data: JournalDayData[]) => {
  const journaledDays = data.filter(d => d.journaled).length;
  const total = data.length;

  // Calculate current streak
  let currentStreak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].journaled) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  for (const day of data) {
    if (day.journaled) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    journaledDays,
    total,
    currentStreak,
    longestStreak,
  };
};

const JOURNAL_STATS = calculateJournalStats(JOURNAL_30_DAYS);

// Nutrition data for past 30 days (1-10 rating scale)
interface NutritionDayData {
  date: Date;
  rating: number | null;
}

const generateLast30DaysNutritionData = (): NutritionDayData[] => {
  const data: NutritionDayData[] = [];
  const today = new Date();

  // Mock nutrition ratings (realistic pattern with variation)
  const mockRatings: (number | null)[] = [
    7, 8, 6, 7, 5, 8, 7,      // Week 1
    6, 7, 8, 7, 6, 9, 8,      // Week 2
    null, 7, 6, 5, 7, 8, 7,   // Week 3
    8, 7, 6, 7, 8, null, 9,   // Week 4
    7, 8                       // Last 2 days
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date,
      rating: mockRatings[29 - i],
    });
  }

  return data;
};

const NUTRITION_30_DAYS = generateLast30DaysNutritionData();

// Calculate nutrition statistics
const calculateNutritionStats = (data: NutritionDayData[]) => {
  const validDays = data.filter(d => d.rating !== null) as { date: Date; rating: number }[];
  const total = validDays.length;

  if (total === 0) {
    return { average: 0, min: 0, max: 0, total: 0 };
  }

  const ratings = validDays.map(d => d.rating);
  const sum = ratings.reduce((a, b) => a + b, 0);
  const average = sum / total;
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);

  return {
    average: Math.round(average * 10) / 10,
    min,
    max,
    total,
  };
};

const NUTRITION_STATS = calculateNutritionStats(NUTRITION_30_DAYS);

// Energy data for past 30 days (1-10 rating scale)
interface EnergyDayData {
  date: Date;
  rating: number | null;
}

const generateLast30DaysEnergyData = (): EnergyDayData[] => {
  const data: EnergyDayData[] = [];
  const today = new Date();

  // Mock energy ratings (realistic pattern - varies more than nutrition)
  const mockRatings: (number | null)[] = [
    6, 7, 5, 8, 6, 7, 8,      // Week 1
    5, 6, 7, 8, 7, 8, 7,      // Week 2
    null, 6, 5, 4, 6, 7, 8,   // Week 3
    7, 8, 6, 5, 7, null, 8,   // Week 4
    7, 7                       // Last 2 days
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date,
      rating: mockRatings[29 - i],
    });
  }

  return data;
};

const ENERGY_30_DAYS = generateLast30DaysEnergyData();

const calculateEnergyStats = (data: EnergyDayData[]) => {
  const validDays = data.filter(d => d.rating !== null) as { date: Date; rating: number }[];
  const total = validDays.length;

  if (total === 0) return { average: 0, min: 0, max: 0, total: 0 };

  const ratings = validDays.map(d => d.rating);
  const sum = ratings.reduce((a, b) => a + b, 0);

  return {
    average: Math.round((sum / total) * 10) / 10,
    min: Math.min(...ratings),
    max: Math.max(...ratings),
    total,
  };
};

const ENERGY_STATS = calculateEnergyStats(ENERGY_30_DAYS);

// Satisfaction data for past 30 days (1-10 rating scale)
interface SatisfactionDayData {
  date: Date;
  rating: number | null;
}

const generateLast30DaysSatisfactionData = (): SatisfactionDayData[] => {
  const data: SatisfactionDayData[] = [];
  const today = new Date();

  // Mock satisfaction ratings (generally more stable)
  const mockRatings: (number | null)[] = [
    7, 8, 7, 8, 6, 9, 8,      // Week 1
    7, 7, 8, 8, 7, 9, 8,      // Week 2
    null, 7, 7, 6, 7, 8, 8,   // Week 3
    8, 8, 7, 7, 8, null, 9,   // Week 4
    8, 8                       // Last 2 days
  ];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    data.push({
      date,
      rating: mockRatings[29 - i],
    });
  }

  return data;
};

const SATISFACTION_30_DAYS = generateLast30DaysSatisfactionData();

const calculateSatisfactionStats = (data: SatisfactionDayData[]) => {
  const validDays = data.filter(d => d.rating !== null) as { date: Date; rating: number }[];
  const total = validDays.length;

  if (total === 0) return { average: 0, min: 0, max: 0, total: 0 };

  const ratings = validDays.map(d => d.rating);
  const sum = ratings.reduce((a, b) => a + b, 0);

  return {
    average: Math.round((sum / total) * 10) / 10,
    min: Math.min(...ratings),
    max: Math.max(...ratings),
    total,
  };
};

const SATISFACTION_STATS = calculateSatisfactionStats(SATISFACTION_30_DAYS);

// Calculate averages
const calculateAverage = (arr: number[]) =>
  arr.reduce((a, b) => a + b, 0) / arr.length;

const AVERAGES = {
  sleep: calculateAverage(MOCK_DAILY_DATA.sleep),
  nutrition: calculateAverage(MOCK_DAILY_DATA.nutrition),
  energy: calculateAverage(MOCK_DAILY_DATA.energy),
  satisfaction: calculateAverage(MOCK_DAILY_DATA.satisfaction),
  priorityCompletion: calculateAverage(MOCK_DAILY_DATA.priorityCompletion),
  journalStreak: MOCK_DAILY_DATA.journalEntries.filter(Boolean).length,
};

// ============================================
// COLOR CONFIGURATION
// ============================================
const COLORS = {
  sleep: { main: '#8B5CF6', light: '#EDE9FE', glow: '#A78BFA' },
  nutrition: { main: '#10B981', light: '#D1FAE5', glow: '#34D399' },
  energy: { main: '#F59E0B', light: '#FEF3C7', glow: '#FBBF24' },
  satisfaction: { main: '#3B82F6', light: '#DBEAFE', glow: '#60A5FA' },
  priority: { main: '#14B8A6', light: '#CCFBF1', glow: '#2DD4BF' },
  journal: { main: '#EC4899', light: '#FCE7F3', glow: '#F472B6' },
};

// Tab configuration
const TAB_CONFIG = {
  daily: {
    label: 'Daily',
    icon: 'sunny-outline' as const,
    activeIcon: 'sunny' as const,
  },
  weekly: {
    label: 'Weekly',
    icon: 'calendar-outline' as const,
    activeIcon: 'calendar' as const,
  },
  monthly: {
    label: 'Monthly',
    icon: 'bar-chart-outline' as const,
    activeIcon: 'bar-chart' as const,
  },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ============================================
// MAIN COMPONENT
// ============================================
const StatisticsScreen = ({ navigation }: StatisticsScreenProps): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [activeMetric, setActiveMetric] = useState<MetricType>(null);

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleMetricPress = (metric: MetricType) => {
    setActiveMetric(activeMetric === metric ? null : metric);
  };

  // ============================================
  // RENDER DAILY CONTENT
  // ============================================
  const renderDailyContent = () => (
    <>
      {/* Sleep Stats Section */}
      <SleepStatsSection />

      {/* Priority Completion Section */}
      <PriorityCompletionSection />

      {/* 30-Day Overview with Linked Sparklines */}
      <LinkedSparklines30DayOverviewSection />

      {/* Journaling Section */}
      <JournalingSection />

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </>
  );

  // ============================================
  // RENDER PLACEHOLDER CONTENT (Weekly/Monthly)
  // ============================================
  const renderPlaceholderContent = (type: 'weekly' | 'monthly') => {
    const config = {
      weekly: {
        color: '#3B82F6',
        lightColor: '#EFF6FF',
        icon: 'calendar' as const,
        description: 'Review your weekly progress',
        features: [
          { icon: 'bar-chart-outline' as const, title: 'Weekly Averages', subtitle: 'Compare week-over-week performance' },
          { icon: 'trending-up-outline' as const, title: 'Progress Tracking', subtitle: 'See how your habits evolve' },
          { icon: 'journal-outline' as const, title: 'Weekly Reviews', subtitle: 'Reflections and learnings' },
        ],
      },
      monthly: {
        color: '#D97706',
        lightColor: '#FFFBEB',
        icon: 'moon' as const,
        description: 'Understand your long-term growth',
        features: [
          { icon: 'stats-chart-outline' as const, title: 'Monthly Overview', subtitle: 'Big picture view of your journey' },
          { icon: 'ribbon-outline' as const, title: 'Milestones', subtitle: 'Celebrate your achievements' },
          { icon: 'body-outline' as const, title: 'Body Check-ins', subtitle: 'Physical wellness tracking' },
        ],
      },
    };

    const currentConfig = config[type];

    return (
      <>
        {/* Hero Placeholder Card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroIconContainer, { backgroundColor: currentConfig.lightColor }]}>
            <Ionicons name={currentConfig.icon} size={32} color={currentConfig.color} />
          </View>
          <Text style={styles.heroTitle}>
            {type === 'weekly' ? 'Weekly' : 'Monthly'} Statistics
          </Text>
          <Text style={styles.heroSubtitle}>{currentConfig.description}</Text>
          <View style={styles.comingSoonBadge}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>

        {/* Feature Preview Cards */}
        <Text style={styles.sectionTitle}>What you'll see here</Text>
        {currentConfig.features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={[styles.featureIconContainer, { backgroundColor: currentConfig.lightColor }]}>
              <Ionicons name={feature.icon} size={20} color={currentConfig.color} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
            </View>
            <View style={styles.featurePlaceholder}>
              <View style={styles.placeholderBar} />
              <View style={[styles.placeholderBar, styles.placeholderBarShort]} />
            </View>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistics</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControl}>
          {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => {
            const config = TAB_CONFIG[tab];
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isActive ? config.activeIcon : config.icon}
                  size={16}
                  color={isActive ? '#FFFFFF' : '#9CA3AF'}
                  style={styles.segmentIcon}
                />
                <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'daily' && renderDailyContent()}
        {activeTab === 'weekly' && renderPlaceholderContent('weekly')}
        {activeTab === 'monthly' && renderPlaceholderContent('monthly')}
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

// Quick Stat Card
interface QuickStatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}

const QuickStatCard = ({ icon, label, value, color, bgColor }: QuickStatCardProps) => (
  <View style={styles.quickStatCard}>
    <View style={[styles.quickStatIcon, { backgroundColor: bgColor }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.quickStatValue}>{value}</Text>
    <Text style={styles.quickStatLabel}>{label}</Text>
  </View>
);

// Legend Button
interface LegendButtonProps {
  label: string;
  color: string;
  isActive: boolean;
  onPress: () => void;
}

const LegendButton = ({ label, color, isActive, onPress }: LegendButtonProps) => (
  <TouchableOpacity
    style={[
      styles.legendButton,
      { borderColor: isActive ? color : '#E5E7EB' },
      isActive && { backgroundColor: `${color}10` },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.legendDot, { backgroundColor: color, opacity: isActive ? 1 : 0.3 }]} />
    <Text style={[styles.legendLabel, { color: isActive ? '#1F2937' : '#9CA3AF' }]}>{label}</Text>
  </TouchableOpacity>
);

// Wellness Chart Component
interface WellnessChartProps {
  nutrition: number[];
  energy: number[];
  satisfaction: number[];
  activeMetric: MetricType;
}

const WellnessChart = ({ nutrition, energy, satisfaction, activeMetric }: WellnessChartProps) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 200;
  const padding = { top: 20, right: 16, bottom: 30, left: 28 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const minValue = 1;
  const maxValue = 10;
  const xStep = plotWidth / 6;
  const yScale = plotHeight / (maxValue - minValue);

  const getX = (index: number) => padding.left + index * xStep;
  const getY = (value: number) => {
    const normalizedValue = Math.max(minValue, Math.min(maxValue, value));
    return padding.top + plotHeight - (normalizedValue - minValue) * yScale;
  };

  const generatePath = (data: number[]) => {
    const points = data.map((value, index) => ({ x: getX(index), y: getY(value) }));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const cpX1 = current.x + (next.x - current.x) * 0.3;
      const cpY1 = current.y + (next.y - current.y) * 0.3;
      const cpX2 = current.x + (next.x - current.x) * 0.7;
      const cpY2 = current.y + (next.y - current.y) * 0.7;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const getOpacity = (metric: MetricType) => {
    if (activeMetric === null) return 1;
    return activeMetric === metric ? 1 : 0.15;
  };

  return (
    <Svg width={chartWidth} height={chartHeight}>
      {/* Grid Lines */}
      {[4, 7, 10].map((val) => (
        <Line
          key={val}
          x1={padding.left}
          y1={getY(val)}
          x2={chartWidth - padding.right}
          y2={getY(val)}
          stroke="#F3F4F6"
          strokeWidth="1"
        />
      ))}

      {/* Y-axis Labels */}
      {[1, 4, 7, 10].map((val) => (
        <SvgText
          key={val}
          x={padding.left - 8}
          y={getY(val) + 4}
          fontSize="10"
          fill="#9CA3AF"
          textAnchor="end"
        >
          {val}
        </SvgText>
      ))}

      {/* Lines */}
      <Path
        d={generatePath(nutrition)}
        stroke={COLORS.nutrition.main}
        strokeWidth="2.5"
        fill="none"
        opacity={getOpacity('nutrition')}
        strokeLinecap="round"
      />
      <Path
        d={generatePath(energy)}
        stroke={COLORS.energy.main}
        strokeWidth="2.5"
        fill="none"
        opacity={getOpacity('energy')}
        strokeLinecap="round"
      />
      <Path
        d={generatePath(satisfaction)}
        stroke={COLORS.satisfaction.main}
        strokeWidth="2.5"
        fill="none"
        opacity={getOpacity('satisfaction')}
        strokeLinecap="round"
      />

      {/* Data Points */}
      {nutrition.map((value, index) => (
        <Circle
          key={`n-${index}`}
          cx={getX(index)}
          cy={getY(value)}
          r="4"
          fill={COLORS.nutrition.main}
          stroke="#FFF"
          strokeWidth="2"
          opacity={getOpacity('nutrition')}
        />
      ))}
      {energy.map((value, index) => (
        <Circle
          key={`e-${index}`}
          cx={getX(index)}
          cy={getY(value)}
          r="4"
          fill={COLORS.energy.main}
          stroke="#FFF"
          strokeWidth="2"
          opacity={getOpacity('energy')}
        />
      ))}
      {satisfaction.map((value, index) => (
        <Circle
          key={`s-${index}`}
          cx={getX(index)}
          cy={getY(value)}
          r="4"
          fill={COLORS.satisfaction.main}
          stroke="#FFF"
          strokeWidth="2"
          opacity={getOpacity('satisfaction')}
        />
      ))}

      {/* X-axis Labels */}
      {DAY_LABELS.map((label, index) => (
        <SvgText
          key={label}
          x={getX(index)}
          y={chartHeight - 8}
          fontSize="10"
          fill="#9CA3AF"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  );
};

// Single-line 30-Day Heatmap with interactive highlighting
interface SingleLineHeatmapProps {
  data: PriorityDayData[];
  activeIndex: number | null;
}

const SingleLineHeatmap = ({ data, activeIndex }: SingleLineHeatmapProps) => {
  const getStatusColor = (status: PriorityStatus) => {
    if (status === true) return '#14B8A6';
    if (status === false) return '#F87171';
    return '#D1D5DB';
  };

  return (
    <View style={styles.singleLineHeatmap}>
      {data.map((day, index) => {
        const isActive = activeIndex === index;
        return (
          <View
            key={index}
            style={[
              styles.heatmapDot,
              {
                backgroundColor: getStatusColor(day.status),
                transform: isActive ? [{ scale: 1.5 }] : [{ scale: 1 }],
                opacity: activeIndex !== null ? (isActive ? 1 : 0.5) : 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Priority Completion Stats Section - Ultra Compact with Interactive Scrubbing
const PriorityCompletionSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartRef = useRef<View>(null);

  // Chart dimensions
  const chartWidth = Dimensions.get('window').width - 32 - 32; // screen - scroll padding - card padding

  // Format selected date
  const selectedDateStr = useMemo(() => {
    if (activeIndex === null) return null;
    const date = PRIORITY_30_DAYS[activeIndex].date;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [activeIndex]);

  // Get selected day's status
  const selectedDayStatus = activeIndex !== null ? PRIORITY_30_DAYS[activeIndex].status : null;

  // Get status text and color for selected day
  const getStatusDisplay = (status: PriorityStatus) => {
    if (status === true) return { text: 'Completed', color: '#14B8A6' };
    if (status === false) return { text: 'Missed', color: '#F87171' };
    return { text: 'No priority', color: '#9CA3AF' };
  };

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, chartWidth));
    const index = Math.round((clampedX / chartWidth) * 29);
    return Math.max(0, Math.min(29, index));
  }, [chartLayoutX, chartWidth]);

  // Handle layout
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

  const isActive = activeIndex !== null;
  const statusDisplay = isActive ? getStatusDisplay(selectedDayStatus) : null;

  return (
    <View style={styles.prioritySectionCard}>
      {/* Header Row */}
      <View style={styles.priorityHeader}>
        <View style={styles.priorityTitleRow}>
          <Ionicons name="flag" size={14} color="#14B8A6" />
          <Text style={styles.priorityTitle}>Priority Completion</Text>
        </View>
        {isActive && selectedDateStr ? (
          <Text style={styles.prioritySelectedDate}>{selectedDateStr}</Text>
        ) : (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={11} color="#F59E0B" />
            <Text style={styles.streakBadgeText}>{PRIORITY_STATS.currentStreak}</Text>
          </View>
        )}
      </View>

      {/* Hero Stats Row */}
      <View style={styles.priorityStatsRow}>
        {isActive && statusDisplay ? (
          <>
            <Text style={[styles.priorityStatusText, { color: statusDisplay.color }]}>
              {statusDisplay.text}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.priorityPercentage}>{PRIORITY_STATS.completionRate}%</Text>
            <View style={styles.priorityMeta}>
              <Text style={styles.priorityMetaText}>
                <Text style={styles.priorityMetaHighlight}>{PRIORITY_STATS.completed}</Text> completed
              </Text>
              <Text style={styles.priorityMetaDivider}>·</Text>
              <Text style={styles.priorityMetaText}>
                <Text style={styles.priorityMetaMissed}>{PRIORITY_STATS.missed}</Text> missed
              </Text>
            </View>
          </>
        )}
      </View>

      {/* 30-Day Heatmap */}
      <View style={styles.heatmapSection}>
        <View
          ref={chartRef}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          <SingleLineHeatmap data={PRIORITY_30_DAYS} activeIndex={activeIndex} />
        </View>
        <View style={styles.heatmapLabels}>
          <Text style={styles.heatmapLabel}>30d ago</Text>
          <Text style={styles.heatmapLabel}>today</Text>
        </View>
      </View>
    </View>
  );
};

// Sleep Mini Bar Chart (Sparkline) with interactive scrubbing
interface SleepSparklineProps {
  data: SleepDayData[];
  activeIndex: number | null;
}

const SleepSparkline = ({ data, activeIndex }: SleepSparklineProps) => {
  const maxHours = 10;
  const barMaxHeight = 52;
  const chartWidth = Dimensions.get('window').width - 32 - 32; // screen - scroll padding - card padding

  const getBarHeight = (hours: number | null) => {
    if (hours === null) return 3;
    return Math.max(3, (hours / maxHours) * barMaxHeight);
  };

  // Calculate y position for reference line (0h at bottom, 10h at top)
  const getRefLineY = (hours: number) => {
    return barMaxHeight - (hours / maxHours) * barMaxHeight;
  };

  return (
    <View style={styles.sleepSparkline}>
      {/* Reference lines */}
      <Svg
        width={chartWidth}
        height={barMaxHeight}
        style={StyleSheet.absoluteFill}
      >
        {[0, 5, 10].map((hours) => {
          const y = getRefLineY(hours);
          return (
            <Path
              key={hours}
              d={`M 0 ${y.toFixed(1)} L ${chartWidth} ${y.toFixed(1)}`}
              stroke="#D1D5DB"
              strokeWidth={1}
              strokeDasharray="2,6"
              opacity={0.5}
            />
          );
        })}
      </Svg>

      {/* Bars */}
      {data.map((day, index) => {
        const isActive = activeIndex === index;
        const hasData = day.hours !== null;

        return (
          <View
            key={index}
            style={[
              styles.sleepBar,
              {
                height: getBarHeight(day.hours),
                backgroundColor: hasData ? '#8B5CF6' : '#E5E7EB',
                opacity: hasData ? (isActive ? 1 : 0.85) : 0.4,
                transform: isActive ? [{ scaleX: 1.4 }] : [{ scaleX: 1 }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Sleep Stats Section - Clean & Focused with Interactive Scrubbing
const SleepStatsSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartRef = useRef<View>(null);

  // Chart dimensions
  const chartWidth = Dimensions.get('window').width - 32 - 32; // screen - scroll padding - card padding

  // Format selected date
  const selectedDateStr = useMemo(() => {
    if (activeIndex === null) return null;
    const date = SLEEP_30_DAYS[activeIndex].date;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [activeIndex]);

  // Get display value (selected day's hours or average)
  const displayValue = activeIndex !== null
    ? SLEEP_30_DAYS[activeIndex].hours
    : SLEEP_STATS.average;

  const displayLabel = activeIndex !== null ? selectedDateStr : 'average';

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, chartWidth));
    const index = Math.round((clampedX / chartWidth) * 29);
    return Math.max(0, Math.min(29, index));
  }, [chartLayoutX, chartWidth]);

  // Handle layout
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
    <View style={styles.sleepSectionCard}>
      {/* Header Row */}
      <View style={styles.sleepHeader}>
        <View style={styles.sleepTitleRow}>
          <Ionicons name="moon" size={14} color="#8B5CF6" />
          <Text style={styles.sleepTitle}>Sleep</Text>
        </View>
        <View style={styles.sleepRangeBadge}>
          <Text style={styles.sleepRangeBadgeText}>{SLEEP_STATS.min} - {SLEEP_STATS.max}h</Text>
        </View>
      </View>

      {/* Hero Stats Row */}
      <View style={styles.sleepStatsRow}>
        <Text style={styles.sleepAverage}>
          {displayValue !== null ? `${displayValue}h` : '—'}
        </Text>
        <View style={styles.sleepMeta}>
          <Text style={styles.sleepMetaLight}>{displayLabel}</Text>
        </View>
      </View>

      {/* 30-Day Sparkline with gesture handling */}
      <View
        ref={chartRef}
        style={styles.sleepChartSection}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <SleepSparkline data={SLEEP_30_DAYS} activeIndex={activeIndex} />
        <View style={styles.sleepChartLabels}>
          <Text style={styles.sleepChartLabel}>30d ago</Text>
          <Text style={styles.sleepChartLabel}>today</Text>
        </View>
      </View>
    </View>
  );
};

// Journal Heatmap (single line) with interactive highlighting
interface JournalHeatmapProps {
  data: JournalDayData[];
  activeIndex: number | null;
}

const JournalHeatmap = ({ data, activeIndex }: JournalHeatmapProps) => {
  return (
    <View style={styles.journalHeatmap}>
      {data.map((day, index) => {
        const isActive = activeIndex === index;
        return (
          <View
            key={index}
            style={[
              styles.journalDot,
              {
                backgroundColor: day.journaled ? '#8B5CF6' : '#E5E7EB',
                transform: isActive ? [{ scale: 1.5 }] : [{ scale: 1 }],
                opacity: activeIndex !== null ? (isActive ? 1 : 0.5) : 1,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Mini Sparkline for Wellness metrics (compact version)
interface WellnessMiniSparklineProps {
  data: { rating: number | null }[];
  color: string;
}

const WellnessMiniSparkline = ({ data, color }: WellnessMiniSparklineProps) => {
  const maxRating = 10;
  const barMaxHeight = 40;

  const getBarHeight = (rating: number | null) => {
    if (rating === null) return 3;
    return Math.max(4, (rating / maxRating) * barMaxHeight);
  };

  return (
    <View style={styles.wellnessMiniSparkline}>
      {data.map((day, index) => (
        <View
          key={index}
          style={[
            styles.wellnessMiniBar,
            {
              height: getBarHeight(day.rating),
              backgroundColor: day.rating === null ? '#E5E7EB' : color,
              opacity: day.rating === null ? 0.4 : 0.9,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Wellness Row Component
interface WellnessRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  data: { rating: number | null }[];
  average: number;
  color: string;
  isLast?: boolean;
}

const WellnessRow = ({ icon, label, data, average, color, isLast }: WellnessRowProps) => (
  <View style={[styles.wellnessRow, !isLast && styles.wellnessRowSpacing]}>
    <View style={styles.wellnessRowHeader}>
      <View style={styles.wellnessRowLabelGroup}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.wellnessRowLabel}>{label}</Text>
      </View>
      <Text style={styles.wellnessRowAverage}>{average}</Text>
    </View>
    <View style={styles.wellnessRowChart}>
      <WellnessMiniSparkline data={data} color={color} />
    </View>
  </View>
);

// Combined Wellness Section (Nutrition, Energy, Satisfaction)
const WellnessSection = () => {
  return (
    <View style={styles.wellnessSectionCard}>
      {/* Metric Rows */}
      <View style={styles.wellnessRows}>
        <WellnessRow
          icon="nutrition"
          label="Nutrition"
          data={NUTRITION_30_DAYS}
          average={NUTRITION_STATS.average}
          color="#10B981"
        />
        <WellnessRow
          icon="flash"
          label="Energy"
          data={ENERGY_30_DAYS}
          average={ENERGY_STATS.average}
          color="#F59E0B"
        />
        <WellnessRow
          icon="happy"
          label="Satisfaction"
          data={SATISFACTION_30_DAYS}
          average={SATISFACTION_STATS.average}
          color="#3B82F6"
          isLast
        />
      </View>

      {/* Time Labels */}
      <View style={styles.wellnessTimeLabels}>
        <Text style={styles.wellnessTimeLabel}>30d ago</Text>
        <Text style={styles.wellnessTimeLabel}>today</Text>
      </View>
    </View>
  );
};

// Compact Mini Sparkline (for inline layout)
const CompactSparkline = ({ data, color }: WellnessMiniSparklineProps) => {
  const maxRating = 10;
  const barMaxHeight = 44;

  const getBarHeight = (rating: number | null) => {
    if (rating === null) return 3;
    return Math.max(4, (rating / maxRating) * barMaxHeight);
  };

  return (
    <View style={styles.compactSparkline}>
      {data.map((day, index) => (
        <View
          key={index}
          style={[
            styles.compactBar,
            {
              height: getBarHeight(day.rating),
              backgroundColor: day.rating === null ? '#E5E7EB' : color,
              opacity: day.rating === null ? 0.4 : 0.9,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Compact Wellness Row (horizontal layout for comparison)
interface WellnessCompactRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  data: { rating: number | null }[];
  average: number;
  color: string;
  lightColor: string;
  isLast?: boolean;
}

const WellnessCompactRow = ({ icon, label, data, average, color, lightColor, isLast }: WellnessCompactRowProps) => (
  <View style={[styles.wellnessCompactRow, !isLast && styles.wellnessCompactRowBorder]}>
    <View style={styles.wellnessCompactMeta}>
      <View style={[styles.wellnessCompactIconBadge, { backgroundColor: lightColor }]}>
        <Ionicons name={icon} size={12} color={color} />
      </View>
      <Text style={styles.wellnessCompactLabel}>{label}</Text>
    </View>
    <View style={styles.wellnessCompactRight}>
      <View style={styles.wellnessCompactChart}>
        <CompactSparkline data={data} color={color} />
      </View>
      <View style={[styles.wellnessCompactScoreBadge, { backgroundColor: lightColor }]}>
        <Text style={[styles.wellnessCompactAverage, { color }]}>{average}</Text>
      </View>
    </View>
  </View>
);

// Compact Wellness Section - Redesigned
const WellnessCompactSection = () => {
  return (
    <View style={styles.wellnessCompactCard}>
      {/* Compact Metric Rows */}
      <WellnessCompactRow
        icon="nutrition"
        label="Nutrition"
        data={NUTRITION_30_DAYS}
        average={NUTRITION_STATS.average}
        color="#10B981"
        lightColor="#D1FAE5"
      />
      <WellnessCompactRow
        icon="flash"
        label="Energy"
        data={ENERGY_30_DAYS}
        average={ENERGY_STATS.average}
        color="#F59E0B"
        lightColor="#FEF3C7"
      />
      <WellnessCompactRow
        icon="happy"
        label="Mood"
        data={SATISFACTION_30_DAYS}
        average={SATISFACTION_STATS.average}
        color="#3B82F6"
        lightColor="#DBEAFE"
        isLast
      />

      {/* Time Labels */}
      <View style={styles.wellnessCompactBottomLabels}>
        <Text style={styles.wellnessCompactTimeLabel}>30d ago</Text>
        <Text style={styles.wellnessCompactTimeLabel}>today</Text>
      </View>
    </View>
  );
};

// ============================================
// WELLNESS METRIC CARD (Stacked Cards Approach)
// ============================================
interface WellnessMetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  average: number;
  data: { rating: number | null; date: Date }[];
  color: string;
  gradientId: string;
}

const WellnessMetricCard = ({ icon, label, average, data, color, gradientId }: WellnessMetricCardProps) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 48;
  const padding = { top: 4, right: 0, bottom: 4, left: 0 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate trend (this week vs last week)
  const thisWeekData = data.slice(-7).filter(d => d.rating !== null);
  const lastWeekData = data.slice(-14, -7).filter(d => d.rating !== null);

  const thisWeekAvg = thisWeekData.length > 0
    ? thisWeekData.reduce((sum, d) => sum + (d.rating || 0), 0) / thisWeekData.length
    : 0;
  const lastWeekAvg = lastWeekData.length > 0
    ? lastWeekData.reduce((sum, d) => sum + (d.rating || 0), 0) / lastWeekData.length
    : 0;

  const trendPercent = lastWeekAvg > 0
    ? Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100)
    : 0;

  const trendDirection = trendPercent > 2 ? 'up' : trendPercent < -2 ? 'down' : 'stable';
  const trendIcon = trendDirection === 'up' ? 'arrow-up' : trendDirection === 'down' ? 'arrow-down' : 'remove';
  const trendText = trendDirection === 'up'
    ? `${trendPercent}% vs last week`
    : trendDirection === 'down'
    ? `${Math.abs(trendPercent)}% vs last week`
    : 'stable vs last week';

  // Interpolate missing values for smoother visualization
  const interpolatedData = data.map((d, i) => {
    if (d.rating !== null) return d.rating;

    // Find previous valid value
    let prevVal: number | null = null;
    let prevIdx = i - 1;
    while (prevIdx >= 0 && prevVal === null) {
      prevVal = data[prevIdx].rating;
      prevIdx--;
    }

    // Find next valid value
    let nextVal: number | null = null;
    let nextIdx = i + 1;
    while (nextIdx < data.length && nextVal === null) {
      nextVal = data[nextIdx].rating;
      nextIdx++;
    }

    // Interpolate or use available value
    if (prevVal !== null && nextVal !== null) {
      const prevDist = i - (prevIdx + 1);
      const nextDist = (nextIdx - 1) - i;
      const totalDist = prevDist + nextDist;
      return prevVal + ((nextVal - prevVal) * prevDist) / totalDist;
    }
    if (prevVal !== null) return prevVal;
    if (nextVal !== null) return nextVal;
    return 5; // Default fallback
  });

  // Use dynamic range based on data
  const validRatings = data.filter(d => d.rating !== null).map(d => d.rating as number);
  const dataMin = validRatings.length > 0 ? Math.min(...validRatings) : 1;
  const dataMax = validRatings.length > 0 ? Math.max(...validRatings) : 10;
  const range = dataMax - dataMin || 1;
  const minValue = Math.max(1, dataMin - range * 0.3);
  const maxValue = Math.min(10, dataMax + range * 0.3);

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * plotWidth;
  const getY = (value: number) => {
    const normalizedValue = Math.max(minValue, Math.min(maxValue, value));
    return padding.top + plotHeight - ((normalizedValue - minValue) / (maxValue - minValue)) * plotHeight;
  };

  // Generate smooth path using interpolated data
  const generatePath = () => {
    if (interpolatedData.length === 0) return '';

    let path = `M ${getX(0)} ${getY(interpolatedData[0])}`;

    for (let i = 1; i < interpolatedData.length; i++) {
      const prevX = getX(i - 1);
      const prevY = getY(interpolatedData[i - 1]);
      const currX = getX(i);
      const currY = getY(interpolatedData[i]);

      const cpX1 = prevX + (currX - prevX) * 0.33;
      const cpY1 = prevY;
      const cpX2 = prevX + (currX - prevX) * 0.67;
      const cpY2 = currY;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${currX} ${currY}`;
    }

    return path;
  };

  // Generate area path
  const generateAreaPath = () => {
    const linePath = generatePath();
    if (!linePath) return '';

    const bottomY = chartHeight - padding.bottom;
    return `${linePath} L ${getX(data.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`;
  };

  return (
    <View style={styles.metricCard}>
      {/* Header Row */}
      <View style={styles.metricCardHeader}>
        <View style={styles.metricCardLeft}>
          <View style={[styles.metricCardIconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={16} color={color} />
          </View>
          <Text style={styles.metricCardLabel}>{label}</Text>
        </View>
        <View style={styles.metricCardRight}>
          <Text style={[styles.metricCardAverage, { color }]}>{average}</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.metricCardChart}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          <Path
            d={generateAreaPath()}
            fill={`url(#${gradientId})`}
          />

          {/* Line */}
          <Path
            d={generatePath()}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      {/* Trend Row */}
      <View style={styles.metricCardTrend}>
        <Ionicons
          name={trendIcon as keyof typeof Ionicons.glyphMap}
          size={12}
          color={trendDirection === 'up' ? '#10B981' : trendDirection === 'down' ? '#EF4444' : '#9CA3AF'}
        />
        <Text style={[
          styles.metricCardTrendText,
          {
            color: trendDirection === 'up' ? '#10B981' : trendDirection === 'down' ? '#EF4444' : '#9CA3AF'
          }
        ]}>
          {trendText}
        </Text>
      </View>
    </View>
  );
};

// Stacked Wellness Cards Section
const WellnessStackedCardsSection = () => {
  return (
    <View style={styles.stackedCardsContainer}>
      <WellnessMetricCard
        icon="nutrition"
        label="Nutrition"
        average={NUTRITION_STATS.average}
        data={NUTRITION_30_DAYS}
        color="#10B981"
        gradientId="nutritionCardGradient"
      />
      <WellnessMetricCard
        icon="flash"
        label="Energy"
        average={ENERGY_STATS.average}
        data={ENERGY_30_DAYS}
        color="#F59E0B"
        gradientId="energyCardGradient"
      />
      <WellnessMetricCard
        icon="happy"
        label="Mood"
        average={SATISFACTION_STATS.average}
        data={SATISFACTION_30_DAYS}
        color="#3B82F6"
        gradientId="moodCardGradient"
      />
    </View>
  );
};

// Journaling Stats Section with Interactive Scrubbing
const JournalingSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartRef = useRef<View>(null);

  // Chart dimensions
  const chartWidth = Dimensions.get('window').width - 32 - 32; // screen - scroll padding - card padding

  // Format selected date
  const selectedDateStr = useMemo(() => {
    if (activeIndex === null) return null;
    const date = JOURNAL_30_DAYS[activeIndex].date;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [activeIndex]);

  // Get selected day's status
  const selectedDayJournaled = activeIndex !== null ? JOURNAL_30_DAYS[activeIndex].journaled : null;

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, chartWidth));
    const index = Math.round((clampedX / chartWidth) * 29);
    return Math.max(0, Math.min(29, index));
  }, [chartLayoutX, chartWidth]);

  // Handle layout
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

  const isActive = activeIndex !== null;

  return (
    <View style={styles.journalSectionCard}>
      {/* Header Row */}
      <View style={styles.journalHeader}>
        <View style={styles.journalTitleRow}>
          <Ionicons name="book" size={14} color="#8B5CF6" />
          <Text style={styles.journalTitle}>Journaling</Text>
        </View>
        {isActive && selectedDateStr ? (
          <Text style={styles.journalSelectedDate}>{selectedDateStr}</Text>
        ) : (
          <View style={styles.journalStreakBadge}>
            <Ionicons name="flame" size={11} color="#F59E0B" />
            <Text style={styles.journalStreakText}>{JOURNAL_STATS.currentStreak}</Text>
          </View>
        )}
      </View>

      {/* Hero Stats Row */}
      <View style={styles.journalStatsRow}>
        {isActive ? (
          <Text style={[
            styles.journalStatusText,
            { color: selectedDayJournaled ? '#8B5CF6' : '#9CA3AF' }
          ]}>
            {selectedDayJournaled ? 'Journaled' : 'Not journaled'}
          </Text>
        ) : (
          <>
            <Text style={styles.journalDaysCount}>{JOURNAL_STATS.journaledDays}</Text>
            <View style={styles.journalMeta}>
              <Text style={styles.journalMetaLight}>of {JOURNAL_STATS.total} days</Text>
            </View>
          </>
        )}
      </View>

      {/* 30-Day Heatmap */}
      <View style={styles.journalChartSection}>
        <View
          ref={chartRef}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          <JournalHeatmap data={JOURNAL_30_DAYS} activeIndex={activeIndex} />
        </View>
        <View style={styles.journalChartLabels}>
          <Text style={styles.journalChartLabel}>30d ago</Text>
          <Text style={styles.journalChartLabel}>today</Text>
        </View>
      </View>
    </View>
  );
};

// Sleep Bar Chart
const SleepBarChart = ({ data }: { data: number[] }) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 120;
  const padding = { left: 8, right: 8, top: 16, bottom: 24 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const barWidth = (plotWidth / 7) - 8;
  const maxSleep = 10;

  return (
    <View style={styles.sleepChartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="sleepGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.sleep.main} />
            <Stop offset="100%" stopColor={COLORS.sleep.glow} />
          </LinearGradient>
        </Defs>

        {/* Target line at 8 hours */}
        <Line
          x1={padding.left}
          y1={padding.top + plotHeight * (1 - 8 / maxSleep)}
          x2={chartWidth - padding.right}
          y2={padding.top + plotHeight * (1 - 8 / maxSleep)}
          stroke={COLORS.sleep.main}
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity={0.3}
        />

        {/* Bars */}
        {data.map((hours, index) => {
          const barHeight = (hours / maxSleep) * plotHeight;
          const x = padding.left + (plotWidth / 7) * index + 4;
          const y = padding.top + plotHeight - barHeight;
          return (
            <G key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill="url(#sleepGradient)"
                opacity={0.85}
              />
              <SvgText
                x={x + barWidth / 2}
                y={y - 4}
                fontSize="9"
                fill={COLORS.sleep.main}
                textAnchor="middle"
                fontWeight="600"
              >
                {hours}h
              </SvgText>
            </G>
          );
        })}

        {/* X-axis Labels */}
        {DAY_LABELS.map((label, index) => (
          <SvgText
            key={label}
            x={padding.left + (plotWidth / 7) * index + 4 + barWidth / 2}
            y={chartHeight - 6}
            fontSize="9"
            fill="#9CA3AF"
            textAnchor="middle"
          >
            {label.substring(0, 1)}
          </SvgText>
        ))}
      </Svg>
      <View style={styles.sleepLegend}>
        <View style={styles.sleepLegendItem}>
          <View style={[styles.sleepLegendLine, { backgroundColor: COLORS.sleep.main }]} />
          <Text style={styles.sleepLegendText}>8h target</Text>
        </View>
      </View>
    </View>
  );
};

// Priority Chart (Mini bar chart)
const PriorityChart = ({ data }: { data: number[] }) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 80;
  const padding = { left: 8, right: 8, top: 8, bottom: 24 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const barWidth = (plotWidth / 7) - 8;

  return (
    <View style={styles.priorityChartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Bars */}
        {data.map((percent, index) => {
          const barHeight = (percent / 100) * plotHeight;
          const x = padding.left + (plotWidth / 7) * index + 4;
          const y = padding.top + plotHeight - barHeight;
          const isComplete = percent === 100;
          return (
            <G key={index}>
              {/* Background bar */}
              <Rect
                x={x}
                y={padding.top}
                width={barWidth}
                height={plotHeight}
                rx={4}
                fill="#F3F4F6"
              />
              {/* Fill bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={isComplete ? COLORS.priority.main : COLORS.priority.glow}
                opacity={isComplete ? 1 : 0.7}
              />
            </G>
          );
        })}

        {/* X-axis Labels */}
        {DAY_LABELS.map((label, index) => (
          <SvgText
            key={label}
            x={padding.left + (plotWidth / 7) * index + 4 + barWidth / 2}
            y={chartHeight - 6}
            fontSize="9"
            fill="#9CA3AF"
            textAnchor="middle"
          >
            {label.substring(0, 1)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

// Journal Tracker (Day indicators)
const JournalTracker = ({ data }: { data: boolean[] }) => (
  <View style={styles.journalTrackerContainer}>
    {data.map((hasEntry, index) => (
      <View key={index} style={styles.journalDayContainer}>
        <View
          style={[
            styles.journalDayCircle,
            {
              backgroundColor: hasEntry ? COLORS.journal.main : '#F3F4F6',
              borderColor: hasEntry ? COLORS.journal.main : '#E5E7EB',
            },
          ]}
        >
          {hasEntry && <Ionicons name="checkmark" size={14} color="#FFF" />}
        </View>
        <Text style={styles.journalDayLabel}>{DAY_LABELS[index].substring(0, 1)}</Text>
      </View>
    ))}
  </View>
);

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0EEE8',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Segmented Control
  segmentedControlContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#1F2937',
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Quick Stats
  quickStatsContainer: {
    paddingBottom: 16,
    paddingRight: 16,
  },
  quickStatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    width: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // Legend
  legendContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  legendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Metric Card
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  metricValue: {
    alignItems: 'flex-end',
  },
  metricValueText: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricValueLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: -2,
  },

  // Sleep Chart
  sleepChartContainer: {
    alignItems: 'center',
  },
  sleepLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  sleepLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepLegendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    marginRight: 6,
  },
  sleepLegendText: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Priority Chart
  priorityChartContainer: {
    alignItems: 'center',
  },

  // Journal Tracker
  journalTrackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  journalDayContainer: {
    alignItems: 'center',
  },
  journalDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  journalDayLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Hero Card (Placeholders)
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },

  // Section Title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Feature Cards
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  featurePlaceholder: {
    alignItems: 'flex-end',
  },
  placeholderBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  placeholderBarShort: {
    width: 24,
    marginBottom: 0,
  },

  // Bottom Spacing
  bottomSpacer: {
    height: 32,
  },

  // ============================================
  // PRIORITY COMPLETION SECTION STYLES - ULTRA COMPACT
  // ============================================
  prioritySectionCard: {
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
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 24,
  },
  priorityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  prioritySelectedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  priorityStatusText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  priorityStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
    minHeight: 44,
  },
  priorityPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginRight: 10,
  },
  priorityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  priorityMetaText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  priorityMetaHighlight: {
    fontWeight: '600',
    color: '#14B8A6',
  },
  priorityMetaMissed: {
    fontWeight: '600',
    color: '#F87171',
  },
  priorityMetaDivider: {
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  heatmapSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  singleLineHeatmap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heatmapDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  heatmapLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // ============================================
  // SLEEP SECTION STYLES - CLEAN & FOCUSED
  // ============================================
  sleepSectionCard: {
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
  sleepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sleepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sleepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  sleepRangeBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sleepRangeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  sleepStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sleepAverage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginRight: 10,
  },
  sleepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  sleepMetaText: {
    fontSize: 13,
  },
  sleepMetaHighlight: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
  sleepMetaLight: {
    fontWeight: '400',
    color: '#9CA3AF',
  },
  sleepMetaDivider: {
    color: '#D1D5DB',
  },
  sleepChartSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sleepSparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 52,
    marginBottom: 6,
  },
  sleepBar: {
    width: 7,
    borderRadius: 1.5,
    minHeight: 3,
  },
  sleepChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepChartLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // ============================================
  // JOURNALING SECTION STYLES
  // ============================================
  journalSectionCard: {
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
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 24,
  },
  journalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  journalStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  journalStreakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  journalSelectedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  journalStatusText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  journalStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    minHeight: 44,
  },
  journalDaysCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginRight: 10,
  },
  journalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  journalMetaLight: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  journalChartSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  journalHeatmap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  journalDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  journalChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  journalChartLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // ============================================
  // WELLNESS SECTION STYLES (Combined: Nutrition, Energy, Satisfaction)
  // ============================================
  wellnessSectionCard: {
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
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  wellnessTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wellnessTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  wellnessRows: {
    gap: 0,
  },
  wellnessRow: {
    flexDirection: 'column',
  },
  wellnessRowSpacing: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  wellnessRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  wellnessRowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wellnessRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  wellnessRowChart: {
    width: '100%',
  },
  wellnessMiniSparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 44,
  },
  wellnessMiniBar: {
    width: 7,
    borderRadius: 2,
    minHeight: 4,
  },
  wellnessRowAverage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  wellnessTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  wellnessTimeLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // Compact Wellness Section - Redesigned
  wellnessCompactCard: {
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
  wellnessCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  wellnessCompactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  wellnessCompactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 110,
  },
  wellnessCompactIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellnessCompactLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  wellnessCompactRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  wellnessCompactChart: {
    flex: 1,
    maxWidth: 150,
  },
  wellnessCompactScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  compactSparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 36,
  },
  compactBar: {
    width: 4,
    borderRadius: 1.5,
    minHeight: 3,
  },
  wellnessCompactAverage: {
    fontSize: 14,
    fontWeight: '700',
  },
  wellnessCompactBottomLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginLeft: 120,
    marginRight: 52,
  },
  wellnessCompactTimeLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // ============================================
  // GROUPED DAY VIEW STYLES
  // ============================================
  groupedDayCard: {
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
  groupedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupedDayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupedDayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  groupedDayBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  groupedDayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  groupedDaySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  groupedDayLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupedDayLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  groupedDayLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  groupedDayLegendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  groupedDayScrollContent: {
    paddingRight: 8,
    gap: 6,
  },
  groupedDayCluster: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  groupedDayClusterToday: {
    backgroundColor: '#F5F3FF',
  },
  groupedDayBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 56,
    gap: 2,
  },
  groupedDayBar: {
    width: 6,
    borderRadius: 2,
    minHeight: 4,
  },
  groupedDayLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 6,
  },
  groupedDayLabelToday: {
    color: '#6366F1',
    fontWeight: '700',
  },

  // ============================================
  // STACKED METRIC CARDS STYLES
  // ============================================
  stackedCardsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricCardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  metricCardRight: {
    alignItems: 'flex-end',
  },
  metricCardAverage: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricCardChart: {
    marginHorizontal: -16,
    marginBottom: 8,
  },
  metricCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricCardTrendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default StatisticsScreen;
