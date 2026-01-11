import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Circle,
  G,
  Line,
  Text as SvgText,
  Rect,
  Defs,
  LinearGradient as SvgLinearGradient,
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

// ============================================
// WEEKLY CHECK-IN DATA (12 weeks of wealth ratings)
// ============================================
interface WeeklyCheckInData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  completed: boolean;
  overallScore: number | null;
  wealthRatings: {
    physical: number | null;
    social: number | null;
    mental: number | null;
    financial: number | null;
    time: number | null;
  };
  wentWell: string;
  improveNextWeek: string;
}

const generateLast12WeeksData = (): WeeklyCheckInData[] => {
  const data: WeeklyCheckInData[] = [];
  const today = new Date();

  // Find the Monday of current week
  const currentMonday = new Date(today);
  const dayOfWeek = currentMonday.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  currentMonday.setDate(currentMonday.getDate() - diff);

  // Mock wealth ratings for 12 weeks (with realistic patterns)
  const mockWeeklyData = [
    // Week 12 (oldest)
    { physical: 6, social: 7, mental: 6, financial: 7, time: 6, wentWell: 'Started new exercise routine', improveNextWeek: 'Better sleep schedule' },
    // Week 11
    { physical: 7, social: 6, mental: 7, financial: 6, time: 7, wentWell: 'Good focus on deep work', improveNextWeek: 'More social activities' },
    // Week 10
    { physical: 7, social: 8, mental: 7, financial: 7, time: 6, wentWell: 'Great catch-ups with friends', improveNextWeek: 'Time management' },
    // Week 9
    { physical: 6, social: 7, mental: 6, financial: 8, time: 7, wentWell: 'Stuck to budget', improveNextWeek: 'Exercise consistency' },
    // Week 8
    { physical: 8, social: 7, mental: 8, financial: 7, time: 7, wentWell: 'Strong workout week', improveNextWeek: 'Work-life balance' },
    // Week 7
    { physical: 7, social: 8, mental: 7, financial: 7, time: 8, wentWell: 'Quality family time', improveNextWeek: 'Mental focus' },
    // Week 6
    { physical: 8, social: 6, mental: 8, financial: 8, time: 7, wentWell: 'Productive work week', improveNextWeek: 'Reconnect with friends' },
    // Week 5
    { physical: 7, social: 7, mental: 7, financial: 7, time: 8, wentWell: 'Balanced week overall', improveNextWeek: 'Physical activity' },
    // Week 4 (skipped - null values)
    null,
    // Week 3
    { physical: 8, social: 8, mental: 7, financial: 7, time: 7, wentWell: 'Great social connections', improveNextWeek: 'Financial planning' },
    // Week 2
    { physical: 7, social: 7, mental: 8, financial: 8, time: 8, wentWell: 'Clear mind and good decisions', improveNextWeek: 'Keep momentum' },
    // Week 1 (most recent - current week)
    { physical: 8, social: 7, mental: 8, financial: 7, time: 8, wentWell: 'Consistent routine maintained', improveNextWeek: 'More creativity time' },
  ];

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() - (i * 7));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekNum = getISOWeekNumber(weekStart);
    const mockData = mockWeeklyData[11 - i];

    if (mockData === null) {
      // Skipped week
      data.push({
        weekNumber: weekNum,
        weekStart,
        weekEnd,
        completed: false,
        overallScore: null,
        wealthRatings: {
          physical: null,
          social: null,
          mental: null,
          financial: null,
          time: null,
        },
        wentWell: '',
        improveNextWeek: '',
      });
    } else {
      const ratings = mockData;
      const validRatings = [ratings.physical, ratings.social, ratings.mental, ratings.financial, ratings.time];
      const overallScore = Math.round((validRatings.reduce((a, b) => a + b, 0) / validRatings.length) * 10) / 10;

      data.push({
        weekNumber: weekNum,
        weekStart,
        weekEnd,
        completed: true,
        overallScore,
        wealthRatings: {
          physical: ratings.physical,
          social: ratings.social,
          mental: ratings.mental,
          financial: ratings.financial,
          time: ratings.time,
        },
        wentWell: ratings.wentWell,
        improveNextWeek: ratings.improveNextWeek,
      });
    }
  }

  return data;
};

// Helper to get ISO week number
const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const WEEKLY_12_WEEKS = generateLast12WeeksData();

// Calculate weekly statistics
const calculateWeeklyStats = (data: WeeklyCheckInData[]) => {
  const completedWeeks = data.filter(w => w.completed);
  const totalWeeks = data.length;
  const completionRate = Math.round((completedWeeks.length / totalWeeks) * 100);

  // Calculate averages for each wealth area
  const physicalRatings = completedWeeks.map(w => w.wealthRatings.physical).filter((r): r is number => r !== null);
  const socialRatings = completedWeeks.map(w => w.wealthRatings.social).filter((r): r is number => r !== null);
  const mentalRatings = completedWeeks.map(w => w.wealthRatings.mental).filter((r): r is number => r !== null);
  const financialRatings = completedWeeks.map(w => w.wealthRatings.financial).filter((r): r is number => r !== null);
  const timeRatings = completedWeeks.map(w => w.wealthRatings.time).filter((r): r is number => r !== null);

  const calcAvg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

  // Calculate overall score average
  const overallScores = completedWeeks.map(w => w.overallScore).filter((s): s is number => s !== null);
  const overallAverage = calcAvg(overallScores);

  // Calculate current streak
  let currentStreak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].completed) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  for (const week of data) {
    if (week.completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    completedWeeks: completedWeeks.length,
    totalWeeks,
    completionRate,
    averages: {
      physical: calcAvg(physicalRatings),
      social: calcAvg(socialRatings),
      mental: calcAvg(mentalRatings),
      financial: calcAvg(financialRatings),
      time: calcAvg(timeRatings),
      overall: overallAverage,
    },
    currentStreak,
    longestStreak,
  };
};

const WEEKLY_STATS = calculateWeeklyStats(WEEKLY_12_WEEKS);

// ============================================
// MONTHLY CHECK-IN DATA (12 months of weight tracking)
// ============================================
interface MonthlyWeightData {
  monthIndex: number;
  monthStart: Date;
  monthName: string;
  weight: number | null; // in kg
  weightUnit: 'kg' | 'lbs';
}

const generateLast12MonthsWeightData = (): MonthlyWeightData[] => {
  const data: MonthlyWeightData[] = [];
  const today = new Date();

  // Mock weight data (realistic pattern showing gradual change)
  const mockWeights: (number | null)[] = [
    78.5, 78.2, 77.8, 77.5, 77.0, 76.5,  // Months 12-7 (oldest to newer)
    76.2, 76.0, 75.5, 75.8, 75.2, 74.8   // Months 6-1 (most recent)
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      monthIndex: 11 - i,
      monthStart: date,
      monthName,
      weight: mockWeights[11 - i],
      weightUnit: 'kg',
    });
  }

  return data;
};

const MONTHLY_WEIGHT_12_MONTHS = generateLast12MonthsWeightData();

// Calculate monthly weight statistics
const calculateMonthlyWeightStats = (data: MonthlyWeightData[]) => {
  const validMonths = data.filter(m => m.weight !== null) as (MonthlyWeightData & { weight: number })[];
  const total = validMonths.length;

  if (total === 0) {
    return { current: null, starting: null, change: null, min: null, max: null, average: null, total: 0 };
  }

  const weights = validMonths.map(m => m.weight);
  const current = validMonths[validMonths.length - 1]?.weight ?? null;
  const starting = validMonths[0]?.weight ?? null;
  const change = current !== null && starting !== null ? current - starting : null;
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const average = Math.round((weights.reduce((a, b) => a + b, 0) / total) * 10) / 10;

  return {
    current,
    starting,
    change,
    min,
    max,
    average,
    total,
  };
};

const MONTHLY_WEIGHT_STATS = calculateMonthlyWeightStats(MONTHLY_WEIGHT_12_MONTHS);

// ============================================
// MONTHLY HEALTH RATINGS DATA (12 months)
// ============================================
interface MonthlyHealthRatingsData {
  monthIndex: number;
  monthStart: Date;
  monthName: string;
  overallHealth: number | null; // 1-10
  skinQuality: number | null; // 1-10
}

const generateLast12MonthsHealthData = (): MonthlyHealthRatingsData[] => {
  const data: MonthlyHealthRatingsData[] = [];
  const today = new Date();

  // Mock health ratings (realistic patterns)
  const mockOverallHealth: (number | null)[] = [
    6, 6, 7, 7, 7, 8, 7, 8, 8, 7, 8, 8  // Gradual improvement trend
  ];
  const mockSkinQuality: (number | null)[] = [
    5, 6, 5, 6, 7, 6, 7, 7, 8, 7, 7, 8  // More variable, slight improvement
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      monthIndex: 11 - i,
      monthStart: date,
      monthName,
      overallHealth: mockOverallHealth[11 - i],
      skinQuality: mockSkinQuality[11 - i],
    });
  }

  return data;
};

const MONTHLY_HEALTH_12_MONTHS = generateLast12MonthsHealthData();

// Calculate monthly health statistics
const calculateMonthlyHealthStats = (data: MonthlyHealthRatingsData[]) => {
  const validOverallHealth = data.filter(m => m.overallHealth !== null).map(m => m.overallHealth as number);
  const validSkinQuality = data.filter(m => m.skinQuality !== null).map(m => m.skinQuality as number);

  const calcStats = (values: number[]) => {
    if (values.length === 0) return { current: null, average: null, min: null, max: null };
    const current = values[values.length - 1];
    const average = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { current, average, min, max };
  };

  return {
    overallHealth: calcStats(validOverallHealth),
    skinQuality: calcStats(validSkinQuality),
  };
};

const MONTHLY_HEALTH_STATS = calculateMonthlyHealthStats(MONTHLY_HEALTH_12_MONTHS);

// ============================================
// MONTHLY PHYSICAL ACTIVITY DATA (12 months)
// ============================================
type ActivityLevelId = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

interface ActivityLevelInfo {
  id: ActivityLevelId;
  label: string;
  shortLabel: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  numericValue: number; // 1-5 for chart positioning
}

const ACTIVITY_LEVELS: ActivityLevelInfo[] = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    shortLabel: 'Sedentary',
    description: 'Mostly sitting, minimal movement',
    icon: 'desktop-outline',
    numericValue: 1,
  },
  {
    id: 'light',
    label: 'Lightly Active',
    shortLabel: 'Light',
    description: 'Some walking and light activities',
    icon: 'walk-outline',
    numericValue: 2,
  },
  {
    id: 'moderate',
    label: 'Moderately Active',
    shortLabel: 'Moderate',
    description: 'Regular movement throughout the day',
    icon: 'body-outline',
    numericValue: 3,
  },
  {
    id: 'active',
    label: 'Active',
    shortLabel: 'Active',
    description: 'Consistent exercise and movement',
    icon: 'bicycle-outline',
    numericValue: 4,
  },
  {
    id: 'very_active',
    label: 'Very Active',
    shortLabel: 'Very Active',
    description: 'High activity most days',
    icon: 'flame-outline',
    numericValue: 5,
  },
];

const getActivityLevelInfo = (id: ActivityLevelId | null): ActivityLevelInfo | null => {
  if (!id) return null;
  return ACTIVITY_LEVELS.find(level => level.id === id) || null;
};

interface MonthlyActivityData {
  monthIndex: number;
  monthStart: Date;
  monthName: string;
  activityLevel: ActivityLevelId | null;
}

const generateLast12MonthsActivityData = (): MonthlyActivityData[] => {
  const data: MonthlyActivityData[] = [];
  const today = new Date();

  // Mock activity levels (showing gradual improvement)
  const mockActivityLevels: (ActivityLevelId | null)[] = [
    'sedentary', 'light', 'light', 'moderate', 'moderate', 'moderate',
    'active', 'active', 'moderate', 'active', 'active', 'very_active'
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      monthIndex: 11 - i,
      monthStart: date,
      monthName,
      activityLevel: mockActivityLevels[11 - i],
    });
  }

  return data;
};

const MONTHLY_ACTIVITY_12_MONTHS = generateLast12MonthsActivityData();

// ============================================
// MONTHLY MENTAL WELLNESS DATA (12 months)
// ============================================
interface MonthlyMentalWellnessData {
  monthIndex: number;
  monthStart: Date;
  monthName: string;
  mentalClarity: number | null; // 1-10
  emotionalBalance: number | null; // 1-10
  motivation: number | null; // 1-10
}

const generateLast12MonthsMentalWellnessData = (): MonthlyMentalWellnessData[] => {
  const data: MonthlyMentalWellnessData[] = [];
  const today = new Date();

  // Mock mental wellness ratings (realistic patterns)
  const mockMentalClarity: (number | null)[] = [
    5, 6, 5, 6, 7, 6, 7, 7, 8, 7, 8, 7  // Variable with slight improvement
  ];
  const mockEmotionalBalance: (number | null)[] = [
    6, 5, 6, 7, 6, 7, 7, 8, 7, 8, 8, 8  // Gradual stabilization
  ];
  const mockMotivation: (number | null)[] = [
    7, 6, 5, 6, 7, 8, 7, 6, 7, 8, 8, 9  // More variable, recent high
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      monthIndex: 11 - i,
      monthStart: date,
      monthName,
      mentalClarity: mockMentalClarity[11 - i],
      emotionalBalance: mockEmotionalBalance[11 - i],
      motivation: mockMotivation[11 - i],
    });
  }

  return data;
};

const MONTHLY_MENTAL_WELLNESS_12_MONTHS = generateLast12MonthsMentalWellnessData();

// Calculate monthly mental wellness statistics
const calculateMonthlyMentalWellnessStats = (data: MonthlyMentalWellnessData[]) => {
  const validMentalClarity = data.filter(m => m.mentalClarity !== null).map(m => m.mentalClarity as number);
  const validEmotionalBalance = data.filter(m => m.emotionalBalance !== null).map(m => m.emotionalBalance as number);
  const validMotivation = data.filter(m => m.motivation !== null).map(m => m.motivation as number);

  const calcStats = (values: number[]) => {
    if (values.length === 0) return { current: null, average: null, min: null, max: null };
    const current = values[values.length - 1];
    const average = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { current, average, min, max };
  };

  return {
    mentalClarity: calcStats(validMentalClarity),
    emotionalBalance: calcStats(validEmotionalBalance),
    motivation: calcStats(validMotivation),
  };
};

const MONTHLY_MENTAL_WELLNESS_STATS = calculateMonthlyMentalWellnessStats(MONTHLY_MENTAL_WELLNESS_12_MONTHS);

// ============================================
// MONTHLY MENTAL LOAD DATA (12 months)
// ============================================
type MentalLoadLevelId = 'calm' | 'manageable' | 'overloaded' | 'stressed';

interface MentalLoadLevelInfo {
  id: MentalLoadLevelId;
  label: string;
  shortLabel: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  numericValue: number; // 1-4 for chart positioning (4=calm/best, 1=stressed/worst)
}

const MENTAL_LOAD_LEVELS: MentalLoadLevelInfo[] = [
  {
    id: 'stressed',
    label: 'Constantly Stressed',
    shortLabel: 'Stressed',
    description: 'Reactive and overwhelmed',
    icon: 'thunderstorm-outline',
    numericValue: 1,
  },
  {
    id: 'overloaded',
    label: 'Mentally Overloaded',
    shortLabel: 'Overloaded',
    description: 'Too much on my plate',
    icon: 'cloudy-outline',
    numericValue: 2,
  },
  {
    id: 'manageable',
    label: 'Busy but Manageable',
    shortLabel: 'Manageable',
    description: 'Full schedule, but coping well',
    icon: 'list-outline',
    numericValue: 3,
  },
  {
    id: 'calm',
    label: 'Mostly Calm',
    shortLabel: 'Calm',
    description: 'Plenty of mental space',
    icon: 'leaf-outline',
    numericValue: 4,
  },
];

const getMentalLoadLevelInfo = (id: MentalLoadLevelId | null): MentalLoadLevelInfo | null => {
  if (!id) return null;
  return MENTAL_LOAD_LEVELS.find(level => level.id === id) || null;
};

interface MonthlyMentalLoadData {
  monthIndex: number;
  monthStart: Date;
  monthName: string;
  mentalLoadLevel: MentalLoadLevelId | null;
}

const generateLast12MonthsMentalLoadData = (): MonthlyMentalLoadData[] => {
  const data: MonthlyMentalLoadData[] = [];
  const today = new Date();

  // Mock mental load levels (showing realistic fluctuation)
  const mockMentalLoadLevels: (MentalLoadLevelId | null)[] = [
    'overloaded', 'stressed', 'overloaded', 'manageable', 'manageable', 'calm',
    'manageable', 'overloaded', 'manageable', 'calm', 'manageable', 'calm'
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      monthIndex: 11 - i,
      monthStart: date,
      monthName,
      mentalLoadLevel: mockMentalLoadLevels[11 - i],
    });
  }

  return data;
};

const MONTHLY_MENTAL_LOAD_12_MONTHS = generateLast12MonthsMentalLoadData();

// ============================================
// MONTHLY ENERGY DRAINS DATA (12 months)
// ============================================
type EnergyDrainId =
  | 'work_pressure'
  | 'social_overload'
  | 'lack_of_structure'
  | 'constant_notifications'
  | 'uncertainty'
  | 'physical_exhaustion';

interface EnergyDrainInfo {
  id: EnergyDrainId;
  label: string;
  shortLabel: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ENERGY_DRAINS: EnergyDrainInfo[] = [
  {
    id: 'work_pressure',
    label: 'Work / Study Pressure',
    shortLabel: 'Work',
    description: 'Deadlines, demands, expectations',
    icon: 'briefcase-outline',
    color: '#3B82F6', // Blue
  },
  {
    id: 'social_overload',
    label: 'Social Overload',
    shortLabel: 'Social',
    description: 'Too many interactions or obligations',
    icon: 'people-outline',
    color: '#8B5CF6', // Purple
  },
  {
    id: 'lack_of_structure',
    label: 'Lack of Structure',
    shortLabel: 'Structure',
    description: 'No routine, feeling scattered',
    icon: 'grid-outline',
    color: '#EC4899', // Pink
  },
  {
    id: 'constant_notifications',
    label: 'Constant Notifications',
    shortLabel: 'Notifications',
    description: 'Digital interruptions and distractions',
    icon: 'notifications-outline',
    color: '#F59E0B', // Amber
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty / Worrying',
    shortLabel: 'Uncertainty',
    description: 'Anxious thoughts about the future',
    icon: 'help-circle-outline',
    color: '#10B981', // Green
  },
  {
    id: 'physical_exhaustion',
    label: 'Physical Exhaustion',
    shortLabel: 'Exhaustion',
    description: 'Body fatigue affecting the mind',
    icon: 'battery-dead-outline',
    color: '#EF4444', // Red
  },
];

const getEnergyDrainInfo = (id: EnergyDrainId | null): EnergyDrainInfo | null => {
  if (!id) return null;
  return ENERGY_DRAINS.find(drain => drain.id === id) || null;
};

interface MonthlyEnergyDrainData {
  monthIndex: number;
  monthStart: Date;
  monthName: string;
  primaryDrain: EnergyDrainId | null;
}

const generateLast12MonthsEnergyDrainData = (): MonthlyEnergyDrainData[] => {
  const data: MonthlyEnergyDrainData[] = [];
  const today = new Date();

  // Mock energy drains (showing realistic patterns)
  const mockDrains: (EnergyDrainId | null)[] = [
    'work_pressure', 'work_pressure', 'uncertainty', 'work_pressure', 'social_overload', 'physical_exhaustion',
    'work_pressure', 'constant_notifications', 'work_pressure', 'uncertainty', 'social_overload', 'physical_exhaustion'
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      monthIndex: 11 - i,
      monthStart: date,
      monthName,
      primaryDrain: mockDrains[11 - i],
    });
  }

  return data;
};

const MONTHLY_ENERGY_DRAINS_12_MONTHS = generateLast12MonthsEnergyDrainData();

// ============================================
// MIND HELPERS DATA (What Helped)
// ============================================

type MindHelperId =
  | 'good_sleep'
  | 'time_alone'
  | 'meaningful_conversations'
  | 'physical_movement'
  | 'nature'
  | 'creative_time'
  | 'digital_breaks';

interface MindHelperInfo {
  id: MindHelperId;
  label: string;
  shortLabel: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const MIND_HELPERS: MindHelperInfo[] = [
  {
    id: 'good_sleep',
    label: 'Good Sleep',
    shortLabel: 'Sleep',
    description: 'Quality rest and recovery',
    icon: 'moon-outline',
    color: '#6366F1', // Indigo
  },
  {
    id: 'time_alone',
    label: 'Time Alone',
    shortLabel: 'Solitude',
    description: 'Personal space and quiet time',
    icon: 'person-outline',
    color: '#3B82F6', // Blue
  },
  {
    id: 'meaningful_conversations',
    label: 'Meaningful Conversations',
    shortLabel: 'Conversations',
    description: 'Deep connections with others',
    icon: 'chatbubbles-outline',
    color: '#14B8A6', // Teal
  },
  {
    id: 'physical_movement',
    label: 'Physical Movement',
    shortLabel: 'Movement',
    description: 'Exercise and body activity',
    icon: 'fitness-outline',
    color: '#10B981', // Emerald
  },
  {
    id: 'nature',
    label: 'Time in Nature',
    shortLabel: 'Nature',
    description: 'Outdoor experiences',
    icon: 'leaf-outline',
    color: '#22C55E', // Green
  },
  {
    id: 'creative_time',
    label: 'Creative Time',
    shortLabel: 'Creativity',
    description: 'Artistic and creative pursuits',
    icon: 'color-palette-outline',
    color: '#EC4899', // Pink
  },
  {
    id: 'digital_breaks',
    label: 'Digital Breaks',
    shortLabel: 'Unplugging',
    description: 'Time away from screens',
    icon: 'phone-portrait-outline',
    color: '#F59E0B', // Amber
  },
];

const getMindHelperInfo = (id: MindHelperId | null): MindHelperInfo | null => {
  if (!id) return null;
  return MIND_HELPERS.find(helper => helper.id === id) || null;
};

interface MonthlyMindHelperData {
  monthIndex: number;
  monthStart: Date;
  monthName: string;
  selectedHelpers: MindHelperId[];
}

const generateLast12MonthsMindHelperData = (): MonthlyMindHelperData[] => {
  const data: MonthlyMindHelperData[] = [];
  const today = new Date();

  // Mock mind helpers data (realistic patterns - multiple selections per month)
  const mockHelpers: MindHelperId[][] = [
    ['good_sleep', 'physical_movement'],
    ['meaningful_conversations', 'nature'],
    ['good_sleep', 'time_alone', 'nature'],
    ['physical_movement', 'good_sleep'],
    ['creative_time', 'meaningful_conversations'],
    ['good_sleep', 'digital_breaks'],
    ['nature', 'physical_movement', 'good_sleep'],
    ['time_alone', 'creative_time'],
    ['good_sleep', 'meaningful_conversations', 'physical_movement'],
    ['physical_movement', 'nature'],
    ['good_sleep', 'time_alone'],
    ['good_sleep', 'physical_movement', 'meaningful_conversations'],
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    data.push({
      monthIndex: 11 - i,
      monthStart: date,
      monthName,
      selectedHelpers: mockHelpers[11 - i],
    });
  }

  return data;
};

const MONTHLY_MIND_HELPERS_12_MONTHS = generateLast12MonthsMindHelperData();

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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [activeMetric, setActiveMetric] = useState<MetricType>(null);

  // Scroll tracking for title fade
  const scrollY = useRef(new Animated.Value(0)).current;

  // Title fade out on scroll
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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
  // RENDER WEEKLY CONTENT
  // ============================================
  const renderWeeklyContent = () => (
    <>
      {/* Weekly Check-in Streak Section */}
      <WeeklyCheckInStreakSection />

      {/* Overall Score Section */}
      <WeeklyOverallScoreSection />

      {/* Wealth Areas Section */}
      <WeeklyWealthTrendsSection />

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </>
  );

  // ============================================
  // RENDER MONTHLY CONTENT
  // ============================================
  const renderMonthlyContent = () => (
    <>
      {/* Monthly Weight Section */}
      <MonthlyWeightSection />

      {/* Monthly Health Ratings Section */}
      <MonthlyHealthRatingsSection />

      {/* Monthly Physical Activity Section */}
      <MonthlyPhysicalActivitySection />

      {/* Monthly Mental Wellness Section */}
      <MonthlyMentalWellnessSection />

      {/* Monthly Mental Load Section */}
      <MonthlyMentalLoadSection />

      {/* Monthly Energy Drains Section */}
      <MonthlyEnergyDrainsSection />

      {/* Monthly Top Helpers Section (Top 3 Focus) */}
      <MonthlyTopHelpersSection />

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </>
  );

  // ============================================
  // RENDER PLACEHOLDER CONTENT (Monthly)
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
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 132 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {activeTab === 'daily' && renderDailyContent()}
        {activeTab === 'weekly' && renderWeeklyContent()}
        {activeTab === 'monthly' && renderMonthlyContent()}
      </Animated.ScrollView>

      {/* Fixed Header with Gradient Fade */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(240, 238, 232, 0.95)',
              'rgba(240, 238, 232, 0.8)',
              'rgba(240, 238, 232, 0.4)',
              'rgba(240, 238, 232, 0)',
            ]}
            locations={[0, 0.4, 0.75, 1]}
            style={styles.headerGradient}
          />
        </View>
        <View style={styles.headerContent} pointerEvents="box-none">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
            </TouchableOpacity>
            <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity }]}>Statistics</Animated.Text>
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
                      size={18}
                      color={isActive ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
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
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </SvgLinearGradient>
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

// ============================================
// WEEKLY STATISTICS SECTIONS
// ============================================

// Weekly Overall Score Section - Shows 12-week trend with interactive scrubbing
const WeeklyOverallScoreSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartRef = useRef<View>(null);

  // Chart dimensions
  const chartWidth = Dimensions.get('window').width - 32 - 32;
  const chartHeight = 60;

  // Get completed weeks data for the chart
  const chartData = WEEKLY_12_WEEKS.map(w => w.overallScore);

  // Format selected week date
  const selectedWeekStr = useMemo(() => {
    if (activeIndex === null) return null;
    const week = WEEKLY_12_WEEKS[activeIndex];
    const startMonth = week.weekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = week.weekStart.getDate();
    const endDay = week.weekEnd.getDate();
    return `${startMonth} ${startDay}-${endDay}`;
  }, [activeIndex]);

  // Get display value
  const displayValue = activeIndex !== null
    ? WEEKLY_12_WEEKS[activeIndex].overallScore
    : WEEKLY_STATS.averages.overall;

  const displayLabel = activeIndex !== null ? selectedWeekStr : 'average';

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, chartWidth));
    const index = Math.round((clampedX / chartWidth) * 11);
    return Math.max(0, Math.min(11, index));
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

  // Build smooth SVG path for scores
  const buildScorePath = () => {
    const padding = { top: 4, bottom: 4 };
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const xStep = chartWidth / 11;

    // Interpolate null values
    const interpolatedData = chartData.map((score, i) => {
      if (score !== null) return score;
      // Find nearest valid values
      let prevVal: number | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (chartData[j] !== null) { prevVal = chartData[j]; break; }
      }
      let nextVal: number | null = null;
      for (let j = i + 1; j < chartData.length; j++) {
        if (chartData[j] !== null) { nextVal = chartData[j]; break; }
      }
      if (prevVal !== null && nextVal !== null) return (prevVal + nextVal) / 2;
      if (prevVal !== null) return prevVal;
      if (nextVal !== null) return nextVal;
      return 7; // Default fallback
    });

    const scaleY = (value: number): number => {
      const normalized = (value - 1) / (10 - 1);
      return padding.top + plotHeight * (1 - normalized);
    };

    const points = interpolatedData.map((v, i) => ({
      x: i * xStep,
      y: scaleY(v),
    }));

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 8;
      const cp1y = p1.y + (p2.y - p0.y) / 8;
      const cp2x = p2.x - (p3.x - p1.x) / 8;
      const cp2y = p2.y - (p3.y - p1.y) / 8;

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return path;
  };

  const getXY = (index: number) => {
    const padding = { top: 4, bottom: 4 };
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const xStep = chartWidth / 11;
    const score = chartData[index] ?? WEEKLY_STATS.averages.overall;
    const normalized = (score - 1) / (10 - 1);
    return {
      x: index * xStep,
      y: padding.top + plotHeight * (1 - normalized),
    };
  };

  const linePath = buildScorePath();
  const dot = activeIndex !== null ? getXY(activeIndex) : null;

  return (
    <View style={styles.weeklySectionCard}>
      {/* Header Row */}
      <View style={styles.weeklyHeader}>
        <View style={styles.weeklyTitleRow}>
          <Ionicons name="trophy" size={14} color="#3B82F6" />
          <Text style={styles.weeklyTitle}>Overall Score</Text>
        </View>
        {activeIndex !== null && selectedWeekStr ? (
          <Text style={styles.weeklySelectedDate}>{selectedWeekStr}</Text>
        ) : (
          <View style={styles.weeklyRangeBadge}>
            <Text style={styles.weeklyRangeBadgeText}>12 weeks</Text>
          </View>
        )}
      </View>

      {/* Hero Stats Row */}
      <View style={styles.weeklyStatsRow}>
        <Text style={styles.weeklyScoreValue}>
          {displayValue !== null ? displayValue.toFixed(1) : '—'}
        </Text>
        <View style={styles.weeklyMeta}>
          <Text style={styles.weeklyMetaLight}>{displayLabel}</Text>
        </View>
      </View>

      {/* 12-Week Chart */}
      <View
        ref={chartRef}
        style={styles.weeklyChartSection}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id="weeklyScoreGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
            </SvgLinearGradient>
          </Defs>

          {/* Reference lines */}
          {[1, 5, 10].map((value) => {
            const padding = { top: 4, bottom: 4 };
            const plotHeight = chartHeight - padding.top - padding.bottom;
            const normalized = (value - 1) / (10 - 1);
            const y = padding.top + plotHeight * (1 - normalized);
            return (
              <Path
                key={value}
                d={`M 0 ${y.toFixed(1)} L ${chartWidth} ${y.toFixed(1)}`}
                stroke="#D1D5DB"
                strokeWidth={1}
                strokeDasharray="2,6"
                opacity={0.5}
              />
            );
          })}

          {/* Area fill */}
          <Path
            d={`${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
            fill="url(#weeklyScoreGrad)"
          />

          {/* Line */}
          <Path
            d={linePath}
            stroke="#3B82F6"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Week dots - show missed weeks */}
          {WEEKLY_12_WEEKS.map((week, index) => {
            if (!week.completed) {
              const xStep = chartWidth / 11;
              return (
                <Circle
                  key={index}
                  cx={index * xStep}
                  cy={chartHeight / 2}
                  r={3}
                  fill="#E5E7EB"
                />
              );
            }
            return null;
          })}

          {/* Active dot */}
          {dot && (
            <Circle
              cx={dot.x}
              cy={dot.y}
              r={5}
              fill="#3B82F6"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
        </Svg>

        {/* Cursor line */}
        {activeIndex !== null && (
          <View
            style={[
              styles.weeklyCursorLine,
              { left: (activeIndex / 11) * chartWidth },
            ]}
          />
        )}

        <View style={styles.weeklyChartLabels}>
          <Text style={styles.weeklyChartLabel}>12w ago</Text>
          <Text style={styles.weeklyChartLabel}>this week</Text>
        </View>
      </View>
    </View>
  );
};

// Weekly Check-in Streak Section
const WeeklyCheckInStreakSection = () => {
  return (
    <View style={styles.weeklySectionCard}>
      {/* Header Row */}
      <View style={styles.weeklyHeader}>
        <View style={styles.weeklyTitleRow}>
          <Ionicons name="calendar-outline" size={14} color="#0D9488" />
          <Text style={styles.weeklyTitle}>Weekly Check-ins</Text>
        </View>
        <View style={styles.weeklyStreakBadge}>
          <Ionicons name="flame" size={11} color="#F59E0B" />
          <Text style={styles.weeklyStreakText}>{WEEKLY_STATS.currentStreak}</Text>
        </View>
      </View>

      {/* Hero Stats Row */}
      <View style={styles.weeklyStatsRow}>
        <Text style={styles.weeklyScoreValue}>{WEEKLY_STATS.completedWeeks}</Text>
        <View style={styles.weeklyMeta}>
          <Text style={styles.weeklyMetaLight}>of {WEEKLY_STATS.totalWeeks} weeks</Text>
        </View>
      </View>

      {/* 12-Week Heatmap */}
      <View style={styles.weeklyHeatmapSection}>
        <View style={styles.weeklyHeatmap}>
          {WEEKLY_12_WEEKS.map((week, index) => (
            <View
              key={index}
              style={[
                styles.weeklyHeatmapDot,
                {
                  backgroundColor: week.completed ? '#0D9488' : '#E5E7EB',
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.weeklyChartLabels}>
          <Text style={styles.weeklyChartLabel}>12w ago</Text>
          <Text style={styles.weeklyChartLabel}>this week</Text>
        </View>
      </View>
    </View>
  );
};

// ============================================
// WEEKLY WEALTH TRENDS SECTION - Linked Sparklines (like 30-Day Overview)
// ============================================
const WEALTH_CHART_HEIGHT = 48;
const WEALTH_CHART_WIDTH = SCREEN_WIDTH - 64; // scroll padding (32) + card padding (32)
const WEALTH_SECTION_GAP = 10;

// Wealth Area Color Configuration
const WEALTH_COLORS = {
  physical: { main: '#10B981', light: '#D1FAE5' },
  social: { main: '#8B5CF6', light: '#EDE9FE' },
  mental: { main: '#3B82F6', light: '#DBEAFE' },
  financial: { main: '#F59E0B', light: '#FEF3C7' },
  time: { main: '#EC4899', light: '#FCE7F3' },
};

const WEALTH_ICONS: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  physical: 'body',
  social: 'people',
  mental: 'bulb',
  financial: 'wallet',
  time: 'time',
};

const WEALTH_LABELS: { [key: string]: string } = {
  physical: 'Physical',
  social: 'Social',
  mental: 'Mental',
  financial: 'Financial',
  time: 'Time',
};

// Build smooth SVG path for wealth data
const buildWealthSmoothPath = (
  values: (number | null)[],
  width: number,
  height: number
): string => {
  // Interpolate null values for smooth visualization
  const interpolatedValues = values.map((v, i) => {
    if (v !== null) return v;
    // Find nearest valid values
    let prevVal: number | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (values[j] !== null) { prevVal = values[j]; break; }
    }
    let nextVal: number | null = null;
    for (let j = i + 1; j < values.length; j++) {
      if (values[j] !== null) { nextVal = values[j]; break; }
    }
    if (prevVal !== null && nextVal !== null) return (prevVal + nextVal) / 2;
    if (prevVal !== null) return prevVal;
    if (nextVal !== null) return nextVal;
    return 7; // Default fallback
  });

  if (interpolatedValues.length < 2) return '';

  const padding = { top: 4, bottom: 4 };
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = width / (interpolatedValues.length - 1);

  const scaleY = (value: number): number => {
    const normalized = (value - 1) / (10 - 1);
    return padding.top + plotHeight * (1 - normalized);
  };

  const points = interpolatedValues.map((v, i) => ({
    x: i * xStep,
    y: scaleY(v),
  }));

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 8;
    const cp1y = p1.y + (p2.y - p0.y) / 8;
    const cp2x = p2.x - (p3.x - p1.x) / 8;
    const cp2y = p2.y - (p3.y - p1.y) / 8;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
};

const buildWealthAreaPath = (
  values: (number | null)[],
  width: number,
  height: number
): string => {
  const linePath = buildWealthSmoothPath(values, width, height);
  if (!linePath) return '';

  const xStep = width / (values.length - 1);
  const lastX = (values.length - 1) * xStep;

  return `${linePath} L ${lastX.toFixed(2)} ${height} L 0 ${height} Z`;
};

const getWealthXY = (
  index: number,
  values: (number | null)[],
  width: number,
  height: number
): { x: number; y: number } => {
  const padding = { top: 4, bottom: 4 };
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = width / (values.length - 1);
  const x = index * xStep;

  // Get interpolated value for this index
  let value = values[index];
  if (value === null) {
    let prevVal: number | null = null;
    for (let j = index - 1; j >= 0; j--) {
      if (values[j] !== null) { prevVal = values[j]; break; }
    }
    let nextVal: number | null = null;
    for (let j = index + 1; j < values.length; j++) {
      if (values[j] !== null) { nextVal = values[j]; break; }
    }
    if (prevVal !== null && nextVal !== null) value = (prevVal + nextVal) / 2;
    else if (prevVal !== null) value = prevVal;
    else if (nextVal !== null) value = nextVal;
    else value = 7;
  }

  const normalized = (value - 1) / (10 - 1);
  const y = padding.top + plotHeight * (1 - normalized);
  return { x, y };
};

// Individual Wealth Metric Chart (similar to MetricChart in 30-Day Overview)
interface WealthMetricChartProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  values: (number | null)[];
  color: { main: string; light: string };
  gradientId: string;
  activeIndex: number | null;
  isLast?: boolean;
  displayValue: number;
}

const WealthMetricChart = React.memo(({
  icon,
  label,
  values,
  color,
  gradientId,
  activeIndex,
  isLast,
  displayValue,
}: WealthMetricChartProps) => {
  const linePath = useMemo(() => buildWealthSmoothPath(values, WEALTH_CHART_WIDTH, WEALTH_CHART_HEIGHT), [values]);
  const areaPath = useMemo(() => buildWealthAreaPath(values, WEALTH_CHART_WIDTH, WEALTH_CHART_HEIGHT), [values]);

  const dot = activeIndex !== null
    ? getWealthXY(activeIndex, values, WEALTH_CHART_WIDTH, WEALTH_CHART_HEIGHT)
    : null;

  const isActive = activeIndex !== null;

  return (
    <View style={[styles.wealthMetricSection, !isLast && styles.wealthMetricSectionBorder]}>
      {/* Header */}
      <View style={styles.wealthMetricHeader}>
        <View style={styles.wealthMetricLabelRow}>
          <Ionicons name={icon} size={18} color={color.main} />
          <Text style={[styles.wealthMetricLabel, { color: color.main }]}>{label}</Text>
        </View>
        <Text style={[styles.wealthMetricValue, { color: color.main }]}>{displayValue}</Text>
      </View>

      {/* Chart */}
      <View style={styles.wealthChartWrapper}>
        <Svg width={WEALTH_CHART_WIDTH} height={WEALTH_CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color.main} stopOpacity={isActive ? "0.22" : "0.15"} />
              <Stop offset="100%" stopColor={color.main} stopOpacity="0.01" />
            </SvgLinearGradient>
          </Defs>

          {/* Subtle reference lines at values 1, 5, 10 */}
          {[1, 5, 10].map((value) => {
            const padding = { top: 4, bottom: 4 };
            const plotHeight = WEALTH_CHART_HEIGHT - padding.top - padding.bottom;
            const normalized = (value - 1) / (10 - 1);
            const y = padding.top + plotHeight * (1 - normalized);
            return (
              <Path
                key={value}
                d={`M 0 ${y.toFixed(1)} L ${WEALTH_CHART_WIDTH} ${y.toFixed(1)}`}
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
              styles.wealthCursorLine,
              { left: (activeIndex / 11) * WEALTH_CHART_WIDTH },
            ]}
          />
        )}
      </View>
    </View>
  );
});

// Weekly Wealth Trends Section - All 5 wealth areas with linked sparklines
const WeeklyWealthTrendsSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartAreaRef = useRef<View>(null);

  // Extract data arrays for each wealth type
  const physicalData = useMemo(() => WEEKLY_12_WEEKS.map(w => w.wealthRatings.physical), []);
  const socialData = useMemo(() => WEEKLY_12_WEEKS.map(w => w.wealthRatings.social), []);
  const mentalData = useMemo(() => WEEKLY_12_WEEKS.map(w => w.wealthRatings.mental), []);
  const financialData = useMemo(() => WEEKLY_12_WEEKS.map(w => w.wealthRatings.financial), []);
  const timeData = useMemo(() => WEEKLY_12_WEEKS.map(w => w.wealthRatings.time), []);

  // Format selected week date
  const selectedWeekStr = useMemo(() => {
    if (activeIndex === null) return null;
    const week = WEEKLY_12_WEEKS[activeIndex];
    const startMonth = week.weekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = week.weekStart.getDate();
    const endDay = week.weekEnd.getDate();
    return `${startMonth} ${startDay}-${endDay}`;
  }, [activeIndex]);

  // Get display values (selected week's value or average)
  const getDisplayValue = (data: (number | null)[], average: number): number => {
    if (activeIndex === null) return average;
    const value = data[activeIndex];
    return value !== null ? value : average;
  };

  const physicalDisplay = getDisplayValue(physicalData, WEEKLY_STATS.averages.physical);
  const socialDisplay = getDisplayValue(socialData, WEEKLY_STATS.averages.social);
  const mentalDisplay = getDisplayValue(mentalData, WEEKLY_STATS.averages.mental);
  const financialDisplay = getDisplayValue(financialData, WEEKLY_STATS.averages.financial);
  const timeDisplay = getDisplayValue(timeData, WEEKLY_STATS.averages.time);

  // Count completed weeks
  const completedWeeks = WEEKLY_12_WEEKS.filter(w => w.completed).length;

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, WEALTH_CHART_WIDTH));
    const index = Math.round((clampedX / WEALTH_CHART_WIDTH) * 11);
    return Math.max(0, Math.min(11, index));
  }, [chartLayoutX]);

  // Handle layout
  const handleLayout = useCallback(() => {
    chartAreaRef.current?.measureInWindow((x) => {
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
    <View style={styles.wealthCard}>
      {/* Header */}
      <View style={styles.wealthCardHeader}>
        <View style={styles.wealthCardTitleRow}>
          <Ionicons name="analytics" size={14} color="#6B7280" />
          <Text style={styles.wealthCardTitle}>12-Week Overview</Text>
        </View>
        {selectedWeekStr && (
          <Text style={styles.wealthSelectedDate}>{selectedWeekStr}</Text>
        )}
      </View>

      {/* Charts - single gesture surface */}
      <View
        ref={chartAreaRef}
        style={styles.wealthChartsContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <WealthMetricChart
          icon="body"
          label="Physical"
          values={physicalData}
          color={WEALTH_COLORS.physical}
          gradientId="wealthPhysicalGrad"
          activeIndex={activeIndex}
          displayValue={physicalDisplay}
        />

        <WealthMetricChart
          icon="people"
          label="Social"
          values={socialData}
          color={WEALTH_COLORS.social}
          gradientId="wealthSocialGrad"
          activeIndex={activeIndex}
          displayValue={socialDisplay}
        />

        <WealthMetricChart
          icon="bulb"
          label="Mental"
          values={mentalData}
          color={WEALTH_COLORS.mental}
          gradientId="wealthMentalGrad"
          activeIndex={activeIndex}
          displayValue={mentalDisplay}
        />

        <WealthMetricChart
          icon="wallet"
          label="Financial"
          values={financialData}
          color={WEALTH_COLORS.financial}
          gradientId="wealthFinancialGrad"
          activeIndex={activeIndex}
          displayValue={financialDisplay}
        />

        <WealthMetricChart
          icon="time"
          label="Time"
          values={timeData}
          color={WEALTH_COLORS.time}
          gradientId="wealthTimeGrad"
          activeIndex={activeIndex}
          displayValue={timeDisplay}
          isLast
        />
      </View>

      {/* Time labels */}
      <View style={styles.wealthTimeLabels}>
        <Text style={styles.wealthTimeLabel}>12w ago</Text>
        <Text style={styles.wealthTimeLabel}>This week</Text>
      </View>

      {/* Caption */}
      <View style={styles.wealthCaptionContainer}>
        <Text style={styles.wealthCaption}>
          Checked in {completedWeeks} of 12 weeks
        </Text>
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
          <SvgLinearGradient id="sleepGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.sleep.main} />
            <Stop offset="100%" stopColor={COLORS.sleep.glow} />
          </SvgLinearGradient>
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
// MONTHLY WEIGHT SECTION
// ============================================
const MonthlyWeightSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartRef = useRef<View>(null);

  // Chart dimensions - leave space on left for y-axis labels
  const yAxisWidth = 32;
  const chartWidth = Dimensions.get('window').width - 32 - 32 - yAxisWidth;
  const chartHeight = 80;
  const padding = { top: 8, bottom: 8 };
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Chart data
  const chartData = MONTHLY_WEIGHT_12_MONTHS.map(m => m.weight);

  // Calculate chart scaling values (memoized)
  const chartScale = useMemo(() => {
    const validWeights = chartData.filter((w): w is number => w !== null);
    const dataMin = Math.min(...validWeights);
    const dataMax = Math.max(...validWeights);
    // Round to nice values for display
    const minWeight = Math.floor(dataMin) - 1;
    const maxWeight = Math.ceil(dataMax) + 1;
    // Use exact midpoint for visual centering (don't round)
    const midWeight = (minWeight + maxWeight) / 2;
    const range = maxWeight - minWeight;

    return { minWeight, maxWeight, midWeight, range };
  }, [chartData]);

  // Format selected month
  const selectedMonthStr = useMemo(() => {
    if (activeIndex === null) return null;
    const month = MONTHLY_WEIGHT_12_MONTHS[activeIndex];
    return month.monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [activeIndex]);

  // Get display value
  const displayValue = activeIndex !== null
    ? MONTHLY_WEIGHT_12_MONTHS[activeIndex].weight
    : MONTHLY_WEIGHT_STATS.current;

  const displayLabel = activeIndex !== null ? selectedMonthStr : 'current';

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, chartWidth));
    const index = Math.round((clampedX / chartWidth) * 11);
    return Math.max(0, Math.min(11, index));
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

  // Scale Y helper function
  const scaleY = useCallback((value: number): number => {
    const normalized = (value - chartScale.minWeight) / chartScale.range;
    return padding.top + plotHeight * (1 - normalized);
  }, [chartScale, plotHeight]);

  // Build smooth SVG path for weights
  const buildWeightPath = () => {
    const xStep = chartWidth / 11;

    // Interpolate null values
    const interpolatedData = chartData.map((weight, i) => {
      if (weight !== null) return weight;
      let prevVal: number | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (chartData[j] !== null) { prevVal = chartData[j]; break; }
      }
      let nextVal: number | null = null;
      for (let j = i + 1; j < chartData.length; j++) {
        if (chartData[j] !== null) { nextVal = chartData[j]; break; }
      }
      if (prevVal !== null && nextVal !== null) return (prevVal + nextVal) / 2;
      if (prevVal !== null) return prevVal;
      if (nextVal !== null) return nextVal;
      return MONTHLY_WEIGHT_STATS.average ?? 75;
    });

    const points = interpolatedData.map((v, i) => ({
      x: i * xStep,
      y: scaleY(v),
    }));

    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 8;
      const cp1y = p1.y + (p2.y - p0.y) / 8;
      const cp2x = p2.x - (p3.x - p1.x) / 8;
      const cp2y = p2.y - (p3.y - p1.y) / 8;

      path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }

    return path;
  };

  const getXY = (index: number) => {
    const xStep = chartWidth / 11;
    const weight = chartData[index] ?? MONTHLY_WEIGHT_STATS.average ?? 75;
    return {
      x: index * xStep,
      y: scaleY(weight),
    };
  };

  // Build area path for gradient fill
  const buildAreaPath = () => {
    const linePath = buildWeightPath();
    const xStep = chartWidth / 11;
    return `${linePath} L ${(11 * xStep).toFixed(2)} ${chartHeight} L 0 ${chartHeight} Z`;
  };

  const linePath = buildWeightPath();
  const areaPath = buildAreaPath();
  const dot = activeIndex !== null ? getXY(activeIndex) : null;

  // Calculate change indicator
  const changeValue = MONTHLY_WEIGHT_STATS.change;
  const changeText = changeValue !== null
    ? `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(1)} kg`
    : null;
  const isPositiveChange = changeValue !== null && changeValue > 0;

  return (
    <View style={styles.monthlySectionCard}>
      {/* Header Row */}
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleRow}>
          <Ionicons name="scale-outline" size={14} color="#0EA5E9" />
          <Text style={styles.monthlyTitle}>Weight</Text>
        </View>
        {activeIndex !== null && selectedMonthStr ? (
          <Text style={styles.monthlySelectedDate}>{selectedMonthStr}</Text>
        ) : changeText ? (
          <View style={[
            styles.monthlyChangeHeaderBadge,
            { backgroundColor: isPositiveChange ? '#FEF2F2' : '#ECFDF5' }
          ]}>
            <Ionicons
              name={isPositiveChange ? 'arrow-up' : 'arrow-down'}
              size={11}
              color={isPositiveChange ? '#EF4444' : '#10B981'}
            />
            <Text style={[
              styles.monthlyChangeHeaderText,
              { color: isPositiveChange ? '#EF4444' : '#10B981' }
            ]}>
              {changeText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Hero Stats Row */}
      <View style={styles.monthlyStatsRow}>
        <Text style={styles.monthlyWeightValue}>
          {displayValue !== null ? `${displayValue.toFixed(1)}` : '—'}
        </Text>
        <Text style={styles.monthlyWeightUnit}>kg</Text>
        <View style={styles.monthlyMeta}>
          <Text style={styles.monthlyMetaLight}>{displayLabel}</Text>
        </View>
      </View>

      {/* 12-Month Chart with Y-Axis */}
      <View style={styles.monthlyChartSection}>
        <View style={styles.monthlyChartRow}>
          {/* Y-Axis Labels (left side) - absolutely positioned for precise alignment */}
          <View style={styles.monthlyYAxis}>
            {[chartScale.maxWeight, chartScale.midWeight, chartScale.minWeight].map((value) => (
              <Text
                key={value}
                style={[
                  styles.monthlyYAxisLabel,
                  { position: 'absolute', top: scaleY(value) - 6, right: 8 }
                ]}
              >
                {value}
              </Text>
            ))}
          </View>

          {/* Chart Area */}
          <View
            ref={chartRef}
            style={styles.monthlyChartArea}
            onLayout={handleLayout}
            {...panResponder.panHandlers}
          >
            <Svg width={chartWidth} height={chartHeight}>
              <Defs>
                <SvgLinearGradient id="monthlyWeightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.15" />
                  <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.01" />
                </SvgLinearGradient>
              </Defs>

              {/* Reference lines */}
              {[chartScale.maxWeight, chartScale.midWeight, chartScale.minWeight].map((value) => {
                const y = scaleY(value);
                return (
                  <Line
                    key={value}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                );
              })}

              {/* Area fill */}
              <Path d={areaPath} fill="url(#monthlyWeightGrad)" />

              {/* Line */}
              <Path
                d={linePath}
                stroke="#0EA5E9"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active dot */}
              {dot && (
                <>
                  <Circle cx={dot.x} cy={dot.y} r={6} fill="#FFFFFF" />
                  <Circle cx={dot.x} cy={dot.y} r={4} fill="#0EA5E9" />
                </>
              )}
            </Svg>
          </View>
        </View>

        {/* X-Axis Labels */}
        <View style={styles.monthlyChartLabels}>
          <Text style={styles.monthlyChartLabel}>
            {MONTHLY_WEIGHT_12_MONTHS[0].monthName}
          </Text>
          <Text style={styles.monthlyChartLabel}>
            {MONTHLY_WEIGHT_12_MONTHS[11].monthName}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============================================
// MONTHLY HEALTH RATINGS SECTION (Like 12-Week Overview)
// ============================================
const HEALTH_CHART_WIDTH = Dimensions.get('window').width - 32 - 32;
const HEALTH_CHART_HEIGHT = 52;

// Health Ratings Color Configuration (matching Weekly view pattern)
const HEALTH_RATING_COLORS = {
  overallHealth: { main: '#10B981', light: '#D1FAE5' }, // Emerald green - vitality
  skinQuality: { main: '#F472B6', light: '#FCE7F3' },   // Pink - glow/radiance
};

// Mental Wellness Color Configuration
const MENTAL_WELLNESS_COLORS = {
  mentalClarity: { main: '#3B82F6', light: '#DBEAFE' },    // Blue - clarity/focus
  emotionalBalance: { main: '#8B5CF6', light: '#EDE9FE' }, // Purple - emotional depth
  motivation: { main: '#F59E0B', light: '#FEF3C7' },       // Amber - energy/drive
};

// Helper functions for health charts
const buildHealthSmoothPath = (values: (number | null)[], width: number, height: number): string => {
  const padding = { top: 4, bottom: 4 };
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = width / 11;

  const interpolatedData = values.map((val, i) => {
    if (val !== null) return val;
    let prevVal: number | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (values[j] !== null) { prevVal = values[j]; break; }
    }
    let nextVal: number | null = null;
    for (let j = i + 1; j < values.length; j++) {
      if (values[j] !== null) { nextVal = values[j]; break; }
    }
    if (prevVal !== null && nextVal !== null) return (prevVal + nextVal) / 2;
    if (prevVal !== null) return prevVal;
    if (nextVal !== null) return nextVal;
    return 5;
  });

  const scaleY = (value: number): number => {
    const normalized = (value - 1) / 9;
    return padding.top + plotHeight * (1 - normalized);
  };

  const points = interpolatedData.map((v, i) => ({
    x: i * xStep,
    y: scaleY(v),
  }));

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 8;
    const cp1y = p1.y + (p2.y - p0.y) / 8;
    const cp2x = p2.x - (p3.x - p1.x) / 8;
    const cp2y = p2.y - (p3.y - p1.y) / 8;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
};

const buildHealthAreaPath = (values: (number | null)[], width: number, height: number): string => {
  const linePath = buildHealthSmoothPath(values, width, height);
  const xStep = width / 11;
  return `${linePath} L ${(11 * xStep).toFixed(2)} ${height} L 0 ${height} Z`;
};

const getHealthXY = (index: number, values: (number | null)[], width: number, height: number) => {
  const padding = { top: 4, bottom: 4 };
  const plotHeight = height - padding.top - padding.bottom;
  const xStep = width / 11;
  const value = values[index] ?? 5;
  const normalized = (value - 1) / 9;
  return {
    x: index * xStep,
    y: padding.top + plotHeight * (1 - normalized),
  };
};

// Health Metric Chart Row Component
interface HealthMetricChartProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  values: (number | null)[];
  color: { main: string; light: string };
  gradientId: string;
  activeIndex: number | null;
  isLast?: boolean;
  displayValue: number | null;
}

const HealthMetricChart = React.memo(({
  icon,
  label,
  values,
  color,
  gradientId,
  activeIndex,
  isLast,
  displayValue,
}: HealthMetricChartProps) => {
  const linePath = useMemo(() => buildHealthSmoothPath(values, HEALTH_CHART_WIDTH, HEALTH_CHART_HEIGHT), [values]);
  const areaPath = useMemo(() => buildHealthAreaPath(values, HEALTH_CHART_WIDTH, HEALTH_CHART_HEIGHT), [values]);

  const dot = activeIndex !== null
    ? getHealthXY(activeIndex, values, HEALTH_CHART_WIDTH, HEALTH_CHART_HEIGHT)
    : null;

  const isActive = activeIndex !== null;

  return (
    <View style={[styles.healthMetricSection, !isLast && styles.healthMetricSectionBorder]}>
      {/* Header */}
      <View style={styles.healthMetricHeader}>
        <View style={styles.healthMetricLabelRow}>
          <Ionicons name={icon} size={18} color={color.main} />
          <Text style={[styles.healthMetricLabel, { color: color.main }]}>{label}</Text>
        </View>
        <Text style={[styles.healthMetricValue, { color: color.main }]}>
          {displayValue !== null ? displayValue : '—'}
        </Text>
      </View>

      {/* Chart */}
      <View style={styles.healthChartWrapper}>
        <Svg width={HEALTH_CHART_WIDTH} height={HEALTH_CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color.main} stopOpacity={isActive ? "0.22" : "0.15"} />
              <Stop offset="100%" stopColor={color.main} stopOpacity="0.01" />
            </SvgLinearGradient>
          </Defs>

          {/* Subtle reference lines at values 1, 5, 10 */}
          {[1, 5, 10].map((value) => {
            const padding = { top: 4, bottom: 4 };
            const plotHeight = HEALTH_CHART_HEIGHT - padding.top - padding.bottom;
            const normalized = (value - 1) / 9;
            const y = padding.top + plotHeight * (1 - normalized);
            return (
              <Path
                key={value}
                d={`M 0 ${y.toFixed(1)} L ${HEALTH_CHART_WIDTH} ${y.toFixed(1)}`}
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
              styles.healthCursorLine,
              { left: (activeIndex / 11) * HEALTH_CHART_WIDTH },
            ]}
          />
        )}
      </View>
    </View>
  );
});

const MonthlyHealthRatingsSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartAreaRef = useRef<View>(null);

  // Chart data
  const overallHealthData = useMemo(() => MONTHLY_HEALTH_12_MONTHS.map(m => m.overallHealth), []);
  const skinQualityData = useMemo(() => MONTHLY_HEALTH_12_MONTHS.map(m => m.skinQuality), []);

  // Format selected month
  const selectedMonthStr = useMemo(() => {
    if (activeIndex === null) return null;
    const month = MONTHLY_HEALTH_12_MONTHS[activeIndex];
    return month.monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [activeIndex]);

  // Get display values
  const getDisplayValue = (data: (number | null)[], fallback: number | null): number | null => {
    if (activeIndex === null) return fallback;
    return data[activeIndex];
  };

  const overallHealthDisplay = getDisplayValue(overallHealthData, MONTHLY_HEALTH_STATS.overallHealth.current);
  const skinQualityDisplay = getDisplayValue(skinQualityData, MONTHLY_HEALTH_STATS.skinQuality.current);

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, HEALTH_CHART_WIDTH));
    const index = Math.round((clampedX / HEALTH_CHART_WIDTH) * 11);
    return Math.max(0, Math.min(11, index));
  }, [chartLayoutX]);

  // Handle layout
  const handleLayout = useCallback(() => {
    chartAreaRef.current?.measureInWindow((x) => {
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
        setActiveIndex(getIndexFromX(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        setActiveIndex(getIndexFromX(evt.nativeEvent.pageX));
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
    <View style={styles.monthlySectionCard}>
      {/* Header */}
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleRow}>
          <Ionicons name="analytics" size={14} color="#0EA5E9" />
          <Text style={styles.monthlyTitle}>Health Ratings</Text>
        </View>
        {selectedMonthStr && (
          <Text style={styles.monthlySelectedDate}>{selectedMonthStr}</Text>
        )}
      </View>

      {/* Charts - single gesture surface */}
      <View
        ref={chartAreaRef}
        style={styles.healthChartsContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <HealthMetricChart
          icon="fitness"
          label="Overall Health"
          values={overallHealthData}
          color={HEALTH_RATING_COLORS.overallHealth}
          gradientId="healthOverallGrad"
          activeIndex={activeIndex}
          displayValue={overallHealthDisplay}
        />

        <HealthMetricChart
          icon="sparkles"
          label="Skin Quality"
          values={skinQualityData}
          color={HEALTH_RATING_COLORS.skinQuality}
          gradientId="healthSkinGrad"
          activeIndex={activeIndex}
          displayValue={skinQualityDisplay}
          isLast
        />
      </View>

      {/* Time Labels */}
      <View style={styles.healthTimeLabels}>
        <Text style={styles.healthTimeLabel}>{MONTHLY_HEALTH_12_MONTHS[0].monthName}</Text>
        <Text style={styles.healthTimeLabel}>{MONTHLY_HEALTH_12_MONTHS[11].monthName}</Text>
      </View>
    </View>
  );
};

// ============================================
// MONTHLY PHYSICAL ACTIVITY SECTION (Stepped Chart)
// ============================================
const ACTIVITY_CHART_WIDTH = Dimensions.get('window').width - 32 - 32;
const ACTIVITY_CHART_HEIGHT = 100;
const ACTIVITY_Y_AXIS_WIDTH = 60;

const MonthlyPhysicalActivitySection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartRef = useRef<View>(null);

  // Chart dimensions (accounting for y-axis)
  const chartWidth = ACTIVITY_CHART_WIDTH - ACTIVITY_Y_AXIS_WIDTH;

  // Get activity data as numeric values for the chart
  const activityNumericData = useMemo(() =>
    MONTHLY_ACTIVITY_12_MONTHS.map(m => {
      const level = getActivityLevelInfo(m.activityLevel);
      return level ? level.numericValue : null;
    }), []);

  // Format selected month
  const selectedMonthStr = useMemo(() => {
    if (activeIndex === null) return null;
    const month = MONTHLY_ACTIVITY_12_MONTHS[activeIndex];
    return month.monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [activeIndex]);

  // Get display activity level
  const displayActivityLevel = useMemo(() => {
    const levelId = activeIndex !== null
      ? MONTHLY_ACTIVITY_12_MONTHS[activeIndex].activityLevel
      : MONTHLY_ACTIVITY_12_MONTHS[11].activityLevel; // Current (most recent)
    return getActivityLevelInfo(levelId);
  }, [activeIndex]);

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX - ACTIVITY_Y_AXIS_WIDTH;
    const clampedX = Math.max(0, Math.min(relativeX, chartWidth));
    const index = Math.round((clampedX / chartWidth) * 11);
    return Math.max(0, Math.min(11, index));
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
        setActiveIndex(getIndexFromX(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        setActiveIndex(getIndexFromX(evt.nativeEvent.pageX));
      },
      onPanResponderRelease: () => {
        setActiveIndex(null);
      },
      onPanResponderTerminate: () => {
        setActiveIndex(null);
      },
    });
  }, [getIndexFromX]);

  // Scale Y for 1-5 range (activity levels)
  const scaleY = useCallback((value: number): number => {
    const padding = { top: 8, bottom: 8 };
    const plotHeight = ACTIVITY_CHART_HEIGHT - padding.top - padding.bottom;
    const normalized = (value - 1) / 4; // 1-5 scale (4 steps)
    return padding.top + plotHeight * (1 - normalized);
  }, []);

  // Build stepped path for activity levels
  const buildSteppedPath = () => {
    const xStep = chartWidth / 11;

    // Interpolate null values
    const interpolatedData = activityNumericData.map((val, i) => {
      if (val !== null) return val;
      let prevVal: number | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (activityNumericData[j] !== null) { prevVal = activityNumericData[j]; break; }
      }
      let nextVal: number | null = null;
      for (let j = i + 1; j < activityNumericData.length; j++) {
        if (activityNumericData[j] !== null) { nextVal = activityNumericData[j]; break; }
      }
      if (prevVal !== null) return prevVal;
      if (nextVal !== null) return nextVal;
      return 3; // Default to moderate
    });

    const points = interpolatedData.map((v, i) => ({
      x: i * xStep,
      y: scaleY(v),
    }));

    // Build stepped path (horizontal then vertical)
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      // Horizontal line to next x position at current y
      path += ` L ${next.x.toFixed(2)} ${current.y.toFixed(2)}`;
      // Vertical line to next y position
      path += ` L ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    }

    return path;
  };

  // Build area path for gradient fill
  const buildAreaPath = () => {
    const steppedPath = buildSteppedPath();
    const xStep = chartWidth / 11;
    return `${steppedPath} L ${(11 * xStep).toFixed(2)} ${ACTIVITY_CHART_HEIGHT} L 0 ${ACTIVITY_CHART_HEIGHT} Z`;
  };

  const getXY = (index: number) => {
    const xStep = chartWidth / 11;
    const value = activityNumericData[index] ?? 3;
    return {
      x: index * xStep,
      y: scaleY(value),
    };
  };

  const steppedPath = buildSteppedPath();
  const areaPath = buildAreaPath();
  const dot = activeIndex !== null ? getXY(activeIndex) : null;

  return (
    <View style={styles.monthlySectionCard}>
      {/* Header */}
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleRow}>
          <Ionicons name="body" size={14} color="#0EA5E9" />
          <Text style={styles.monthlyTitle}>Physical Activity</Text>
        </View>
        {selectedMonthStr && (
          <Text style={styles.monthlySelectedDate}>{selectedMonthStr}</Text>
        )}
      </View>

      {/* Current Activity Level Display */}
      {displayActivityLevel && (
        <View style={styles.activityLevelDisplay}>
          <View style={styles.activityLevelIconContainer}>
            <Ionicons name={displayActivityLevel.icon} size={20} color="#0EA5E9" />
          </View>
          <View style={styles.activityLevelTextContainer}>
            <Text style={styles.activityLevelLabel}>{displayActivityLevel.label}</Text>
            <Text style={styles.activityLevelDescription}>{displayActivityLevel.description}</Text>
          </View>
        </View>
      )}

      {/* Stepped Chart */}
      <View
        ref={chartRef}
        style={styles.activityChartSection}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.activityChartRow}>
          {/* Y-Axis Labels */}
          <View style={styles.activityYAxis}>
            {ACTIVITY_LEVELS.slice().reverse().map((level) => (
              <Text
                key={level.id}
                style={[
                  styles.activityYAxisLabel,
                  { top: scaleY(level.numericValue) - 6 }
                ]}
              >
                {level.shortLabel}
              </Text>
            ))}
          </View>

          {/* Chart */}
          <View style={styles.activityChartArea}>
            <Svg width={chartWidth} height={ACTIVITY_CHART_HEIGHT}>
              <Defs>
                <SvgLinearGradient id="activityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.02" />
                </SvgLinearGradient>
              </Defs>

              {/* Reference lines for each level */}
              {ACTIVITY_LEVELS.map((level) => {
                const y = scaleY(level.numericValue);
                return (
                  <Line
                    key={level.id}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeDasharray="3,6"
                  />
                );
              })}

              {/* Area fill */}
              <Path d={areaPath} fill="url(#activityGrad)" />

              {/* Stepped line */}
              <Path
                d={steppedPath}
                stroke="#0EA5E9"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Active dot */}
              {dot && (
                <>
                  <Circle cx={dot.x} cy={dot.y} r={6} fill="#FFFFFF" />
                  <Circle cx={dot.x} cy={dot.y} r={4} fill="#0EA5E9" />
                </>
              )}
            </Svg>

            {/* Cursor line */}
            {activeIndex !== null && (
              <View
                style={[
                  styles.activityCursorLine,
                  { left: (activeIndex / 11) * chartWidth },
                ]}
              />
            )}
          </View>
        </View>

        {/* X-Axis Labels */}
        <View style={[styles.activityTimeLabels, { marginLeft: ACTIVITY_Y_AXIS_WIDTH }]}>
          <Text style={styles.activityTimeLabel}>{MONTHLY_ACTIVITY_12_MONTHS[0].monthName}</Text>
          <Text style={styles.activityTimeLabel}>{MONTHLY_ACTIVITY_12_MONTHS[11].monthName}</Text>
        </View>
      </View>
    </View>
  );
};

// ============================================
// MONTHLY MENTAL WELLNESS SECTION (Like Health Ratings)
// ============================================
const MonthlyMentalWellnessSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartLayoutX, setChartLayoutX] = useState<number>(0);
  const chartAreaRef = useRef<View>(null);

  // Chart data
  const mentalClarityData = useMemo(() => MONTHLY_MENTAL_WELLNESS_12_MONTHS.map(m => m.mentalClarity), []);
  const emotionalBalanceData = useMemo(() => MONTHLY_MENTAL_WELLNESS_12_MONTHS.map(m => m.emotionalBalance), []);
  const motivationData = useMemo(() => MONTHLY_MENTAL_WELLNESS_12_MONTHS.map(m => m.motivation), []);

  // Format selected month
  const selectedMonthStr = useMemo(() => {
    if (activeIndex === null) return null;
    const month = MONTHLY_MENTAL_WELLNESS_12_MONTHS[activeIndex];
    return month.monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [activeIndex]);

  // Get display values
  const getDisplayValue = (data: (number | null)[], fallback: number | null): number | null => {
    if (activeIndex === null) return fallback;
    return data[activeIndex];
  };

  const mentalClarityDisplay = getDisplayValue(mentalClarityData, MONTHLY_MENTAL_WELLNESS_STATS.mentalClarity.current);
  const emotionalBalanceDisplay = getDisplayValue(emotionalBalanceData, MONTHLY_MENTAL_WELLNESS_STATS.emotionalBalance.current);
  const motivationDisplay = getDisplayValue(motivationData, MONTHLY_MENTAL_WELLNESS_STATS.motivation.current);

  // Calculate index from x position
  const getIndexFromX = useCallback((pageX: number): number => {
    const relativeX = pageX - chartLayoutX;
    const clampedX = Math.max(0, Math.min(relativeX, HEALTH_CHART_WIDTH));
    const index = Math.round((clampedX / HEALTH_CHART_WIDTH) * 11);
    return Math.max(0, Math.min(11, index));
  }, [chartLayoutX]);

  // Handle layout
  const handleLayout = useCallback(() => {
    chartAreaRef.current?.measureInWindow((x) => {
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
        setActiveIndex(getIndexFromX(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        setActiveIndex(getIndexFromX(evt.nativeEvent.pageX));
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
    <View style={styles.monthlySectionCard}>
      {/* Header */}
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleRow}>
          <Ionicons name="sparkles-outline" size={14} color="#0EA5E9" />
          <Text style={styles.monthlyTitle}>Mental Wellness</Text>
        </View>
        {selectedMonthStr && (
          <Text style={styles.monthlySelectedDate}>{selectedMonthStr}</Text>
        )}
      </View>

      {/* Charts - single gesture surface */}
      <View
        ref={chartAreaRef}
        style={styles.healthChartsContainer}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <HealthMetricChart
          icon="bulb-outline"
          label="Mental Clarity"
          values={mentalClarityData}
          color={MENTAL_WELLNESS_COLORS.mentalClarity}
          gradientId="mentalClarityGrad"
          activeIndex={activeIndex}
          displayValue={mentalClarityDisplay}
        />

        <HealthMetricChart
          icon="heart-half-outline"
          label="Emotional Balance"
          values={emotionalBalanceData}
          color={MENTAL_WELLNESS_COLORS.emotionalBalance}
          gradientId="emotionalBalanceGrad"
          activeIndex={activeIndex}
          displayValue={emotionalBalanceDisplay}
        />

        <HealthMetricChart
          icon="flash-outline"
          label="Motivation"
          values={motivationData}
          color={MENTAL_WELLNESS_COLORS.motivation}
          gradientId="motivationGrad"
          activeIndex={activeIndex}
          displayValue={motivationDisplay}
          isLast
        />
      </View>

      {/* Time Labels */}
      <View style={styles.healthTimeLabels}>
        <Text style={styles.healthTimeLabel}>{MONTHLY_MENTAL_WELLNESS_12_MONTHS[0].monthName}</Text>
        <Text style={styles.healthTimeLabel}>{MONTHLY_MENTAL_WELLNESS_12_MONTHS[11].monthName}</Text>
      </View>
    </View>
  );
};

// ============================================
// MONTHLY MENTAL LOAD SECTION (Positioned Dot Chart)
// ============================================

// Mental Load level colors (semantic)
const MENTAL_LOAD_LEVEL_COLORS: Record<MentalLoadLevelId, string> = {
  calm: '#10B981',       // Green - peaceful
  manageable: '#3B82F6', // Blue - active but controlled
  overloaded: '#F59E0B', // Amber - warning
  stressed: '#DC2626',   // Deep red - danger
};

// Y-axis config with icons
const MENTAL_LOAD_Y_CONFIG: { id: MentalLoadLevelId; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'calm', icon: 'leaf-outline' },
  { id: 'manageable', icon: 'list-outline' },
  { id: 'overloaded', icon: 'cloudy-outline' },
  { id: 'stressed', icon: 'thunderstorm-outline' },
];

const ML_CHART_HEIGHT = 100;
const ML_ROW_HEIGHT = 25;
const ML_Y_AXIS_WIDTH = 32;
const ML_DOT_PADDING = 12; // Padding on left/right so dots don't clip

const MonthlyMentalLoadSection = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Current/selected month data
  const displayIndex = selectedIndex !== null ? selectedIndex : 11;
  const displayMonth = MONTHLY_MENTAL_LOAD_12_MONTHS[displayIndex];
  const displayLevel = getMentalLoadLevelInfo(displayMonth.mentalLoadLevel);
  const displayColor = displayMonth.mentalLoadLevel
    ? MENTAL_LOAD_LEVEL_COLORS[displayMonth.mentalLoadLevel]
    : '#6B7280';


  // Get Y position for a level (calm=0, manageable=1, overloaded=2, stressed=3)
  const getYRow = (levelId: MentalLoadLevelId | null): number => {
    if (!levelId) return 1;
    const order: Record<MentalLoadLevelId, number> = { calm: 0, manageable: 1, overloaded: 2, stressed: 3 };
    return order[levelId];
  };

  // Calculate chart width (with padding for dots)
  const chartWidth = Dimensions.get('window').width - 32 - 32 - ML_Y_AXIS_WIDTH;
  const plotWidth = chartWidth - ML_DOT_PADDING * 2;

  // Get X position for a dot (with padding)
  const getX = (index: number) => ML_DOT_PADDING + (index / 11) * plotWidth;

  // Build connecting path between dots
  const buildPath = useMemo(() => {
    const points = MONTHLY_MENTAL_LOAD_12_MONTHS.map((month, index) => {
      const yRow = getYRow(month.mentalLoadLevel);
      const x = getX(index);
      const y = yRow * ML_ROW_HEIGHT + ML_ROW_HEIGHT / 2;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  }, [plotWidth]);

  return (
    <View style={styles.monthlySectionCard}>
      {/* Header */}
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleRow}>
          <Ionicons name="pulse-outline" size={14} color="#0EA5E9" />
          <Text style={styles.monthlyTitle}>Mental Load</Text>
        </View>
        {selectedIndex !== null && (
          <Text style={mlStyles.headerMonth}>
            {displayMonth.monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        )}
      </View>

      {/* Current State Row */}
      <View style={mlStyles.stateRow}>
        <View style={[mlStyles.stateIconBg, { backgroundColor: displayColor + '15' }]}>
          <Ionicons name={displayLevel?.icon || 'help'} size={18} color={displayColor} />
        </View>
        <View style={mlStyles.stateTextContainer}>
          <Text style={[mlStyles.stateLabel, { color: displayColor }]}>
            {displayLevel?.label || 'Unknown'}
          </Text>
          <Text style={mlStyles.stateDescription}>{displayLevel?.description || ''}</Text>
        </View>
      </View>

      {/* Dot Chart */}
      <View style={mlStyles.chartWrapper}>
        {/* Y-Axis Icons */}
        <View style={mlStyles.yAxisIcons}>
          {MENTAL_LOAD_Y_CONFIG.map((config) => (
            <View key={config.id} style={mlStyles.yAxisIconRow}>
              <Ionicons
                name={config.icon}
                size={14}
                color={MENTAL_LOAD_LEVEL_COLORS[config.id]}
              />
            </View>
          ))}
        </View>

        {/* Chart Area with SVG */}
        <View style={[mlStyles.chartSvgArea, { width: chartWidth }]}>
          <Svg width={chartWidth} height={ML_CHART_HEIGHT}>
            {/* Subtle connecting path */}
            <Path
              d={buildPath}
              stroke="#E5E7EB"
              strokeWidth={1.5}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Dots */}
            {MONTHLY_MENTAL_LOAD_12_MONTHS.map((month, index) => {
              const levelId = month.mentalLoadLevel;
              const color = levelId ? MENTAL_LOAD_LEVEL_COLORS[levelId] : '#D1D5DB';
              const yRow = getYRow(levelId);
              const cx = getX(index);
              const cy = yRow * ML_ROW_HEIGHT + ML_ROW_HEIGHT / 2;
              const isSelected = selectedIndex === index;
              const isCurrent = index === 11 && selectedIndex === null;
              const isHighlighted = isSelected || isCurrent;

              return (
                <G key={month.monthIndex}>
                  {/* Highlight ring */}
                  {isHighlighted && (
                    <Circle cx={cx} cy={cy} r={11} fill={color} opacity={0.2} />
                  )}
                  {/* White border */}
                  <Circle cx={cx} cy={cy} r={isHighlighted ? 7 : 5.5} fill="#FFFFFF" />
                  {/* Colored dot */}
                  <Circle cx={cx} cy={cy} r={isHighlighted ? 5 : 4} fill={color} />
                </G>
              );
            })}
          </Svg>

          {/* Touch targets (invisible, on top) */}
          {MONTHLY_MENTAL_LOAD_12_MONTHS.map((month, index) => {
            const yRow = getYRow(month.mentalLoadLevel);
            const left = getX(index) - 16;
            const top = yRow * ML_ROW_HEIGHT + ML_ROW_HEIGHT / 2 - 16;

            return (
              <TouchableOpacity
                key={`touch-${month.monthIndex}`}
                onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
                style={[mlStyles.touchTarget, { left, top }]}
                activeOpacity={0.7}
              />
            );
          })}
        </View>
      </View>

      {/* X-Axis Labels */}
      <View style={[mlStyles.xAxisRow, { marginLeft: ML_Y_AXIS_WIDTH, paddingHorizontal: ML_DOT_PADDING }]}>
        {MONTHLY_MENTAL_LOAD_12_MONTHS.map((month, index) => {
          const isActive = selectedIndex === index || (index === 11 && selectedIndex === null);
          return (
            <Text
              key={month.monthIndex}
              style={[mlStyles.xLabel, isActive && mlStyles.xLabelActive]}
            >
              {month.monthName.charAt(0)}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

// Mental Load styles
const mlStyles = StyleSheet.create({
  headerMonth: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8, paddingBottom: 12,
    gap: 10,
  },
  stateIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateTextContainer: {
    flex: 1,
  },
  stateLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  stateDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  chartWrapper: {
    flexDirection: 'row',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  yAxisIcons: {
    width: ML_Y_AXIS_WIDTH,
    height: ML_CHART_HEIGHT,
  },
  yAxisIconRow: {
    height: ML_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartSvgArea: {
    height: ML_CHART_HEIGHT,
    position: 'relative',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  touchTarget: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  xLabelActive: {
    color: '#374151',
    fontWeight: '600',
  },
});

// ============================================
// MONTHLY ENERGY DRAINS SECTION (Frequency Bars)
// ============================================

const MonthlyEnergyDrainsSection = () => {
  // Calculate frequency of each drain
  const drainFrequency = useMemo(() => {
    const frequency: Record<EnergyDrainId, number> = {
      work_pressure: 0,
      social_overload: 0,
      lack_of_structure: 0,
      constant_notifications: 0,
      uncertainty: 0,
      physical_exhaustion: 0,
    };

    MONTHLY_ENERGY_DRAINS_12_MONTHS.forEach(month => {
      if (month.primaryDrain) {
        frequency[month.primaryDrain]++;
      }
    });

    return frequency;
  }, []);

  // Sort drains by frequency (most common first), filter out zeros
  const sortedDrains = useMemo(() => {
    return [...ENERGY_DRAINS]
      .filter(drain => drainFrequency[drain.id] > 0)
      .sort((a, b) => drainFrequency[b.id] - drainFrequency[a.id]);
  }, [drainFrequency]);

  // Get max frequency for scaling bars
  const maxFrequency = useMemo(() => {
    return Math.max(...Object.values(drainFrequency), 1);
  }, [drainFrequency]);

  // Generate insight message (context line for top drain)
  const insightMessage = useMemo(() => {
    if (sortedDrains.length === 0) return null;

    const topDrain = sortedDrains[0];
    const topCount = drainFrequency[topDrain.id];

    return `Top drain in ${topCount} of 12 months`;
  }, [sortedDrains, drainFrequency]);

  return (
    <View style={styles.monthlySectionCard}>
      {/* Header */}
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleRow}>
          <Ionicons name="battery-dead-outline" size={14} color="#0EA5E9" />
          <Text style={styles.monthlyTitle}>Energy Drains</Text>
        </View>
      </View>

      {/* Top Drain Display */}
      {sortedDrains.length > 0 && (
        <View style={edStyles.topDrainDisplay}>
          <View style={[edStyles.topDrainIcon, { backgroundColor: sortedDrains[0].color + '20' }]}>
            <Ionicons name={sortedDrains[0].icon} size={20} color={sortedDrains[0].color} />
          </View>
          <View style={edStyles.topDrainTextContainer}>
            <Text style={edStyles.topDrainLabel}>{sortedDrains[0].label}</Text>
            <Text style={edStyles.topDrainDescription}>{sortedDrains[0].description}</Text>
            <Text style={edStyles.topDrainContext}>{insightMessage}</Text>
          </View>
        </View>
      )}

      {/* Ranked list with bars */}
      <View style={edStyles.listContainer}>
        {sortedDrains.map((drain, index) => {
          const count = drainFrequency[drain.id];
          const barWidth = (count / maxFrequency) * 100;

          return (
            <View
              key={drain.id}
              style={[
                edStyles.listItem,
                index === sortedDrains.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={[edStyles.listIcon, { backgroundColor: drain.color + '12' }]}>
                <Ionicons name={drain.icon} size={14} color={drain.color} />
              </View>
              <Text style={edStyles.listLabel}>
                {drain.shortLabel}
              </Text>
              <View style={edStyles.barTrack}>
                <View
                  style={[
                    edStyles.barFill,
                    { width: `${barWidth}%`, backgroundColor: drain.color },
                  ]}
                />
              </View>
              <Text style={edStyles.listCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Energy Drains styles
const edStyles = StyleSheet.create({
  listContainer: {
    marginTop: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  listIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listLabel: {
    width: 85,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  listCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: 20,
    textAlign: 'right',
  },
  topDrainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  topDrainIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topDrainTextContainer: {
    flex: 1,
  },
  topDrainLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  topDrainDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  topDrainContext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
  },
});

// ============================================
// MONTHLY TOP HELPERS SECTION (Top 3 Focus - Option E)
// ============================================

const MonthlyTopHelpersSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate frequency of each helper
  const helperFrequency = useMemo(() => {
    const frequency: Record<MindHelperId, number> = {
      good_sleep: 0,
      time_alone: 0,
      meaningful_conversations: 0,
      physical_movement: 0,
      nature: 0,
      creative_time: 0,
      digital_breaks: 0,
    };

    MONTHLY_MIND_HELPERS_12_MONTHS.forEach(month => {
      month.selectedHelpers.forEach(helperId => {
        frequency[helperId]++;
      });
    });

    return frequency;
  }, []);

  // Sort helpers by frequency (most common first), filter out zeros
  const sortedHelpers = useMemo(() => {
    return [...MIND_HELPERS]
      .filter(helper => helperFrequency[helper.id] > 0)
      .sort((a, b) => helperFrequency[b.id] - helperFrequency[a.id]);
  }, [helperFrequency]);

  // Get top 3 and remaining helpers
  const top3 = sortedHelpers.slice(0, 3);
  const remainingHelpers = sortedHelpers.slice(3);
  const remainingCount = remainingHelpers.length;

  return (
    <View style={styles.monthlySectionCard}>
      {/* Header */}
      <View style={styles.monthlyHeader}>
        <View style={styles.monthlyTitleRow}>
          <Ionicons name="trophy-outline" size={14} color="#0EA5E9" />
          <Text style={styles.monthlyTitle}>What Helped Most</Text>
        </View>
      </View>

      {/* Horizontal Cards - Top 3 */}
      <View style={thStyles.cardsRow}>
        {top3.map((helper, index) => {
          const count = helperFrequency[helper.id];
          const isFirst = index === 0;
          const isSecond = index === 1;
          const rank = index + 1;

          // Medal colors: Gold, Silver, Bronze
          const badgeColor = isFirst ? '#F59E0B' : isSecond ? '#94A3B8' : '#CD7F32';

          return (
            <View
              key={helper.id}
              style={[
                thStyles.card,
                isFirst && thStyles.cardFirst,
              ]}
            >
              {/* Rank Badge */}
              <View style={[
                thStyles.rankBadge,
                { backgroundColor: badgeColor },
                isFirst && thStyles.rankBadgeFirst,
              ]}>
                <Text style={thStyles.rankText}>
                  {rank}
                </Text>
              </View>

              {/* Icon */}
              <View style={[
                thStyles.iconCircle,
                { backgroundColor: helper.color + '18' },
                isFirst && { backgroundColor: helper.color + '25' },
              ]}>
                <Ionicons
                  name={helper.icon}
                  size={24}
                  color={helper.color}
                />
              </View>

              {/* Label */}
              <Text style={[
                thStyles.cardLabel,
                isFirst && thStyles.cardLabelFirst,
              ]} numberOfLines={2}>
                {helper.shortLabel}
              </Text>

              {/* Count */}
              <Text style={thStyles.cardCount}>
                {count} of 12
              </Text>
            </View>
          );
        })}
      </View>

      {/* Expanded List */}
      {isExpanded && remainingHelpers.length > 0 && (
        <View style={thStyles.expandedList}>
          {remainingHelpers.map((helper, index) => {
            const count = helperFrequency[helper.id];
            const rank = index + 4; // Start from 4

            return (
              <View key={helper.id} style={thStyles.expandedRow}>
                <View style={thStyles.expandedRank}>
                  <Text style={thStyles.expandedRankText}>{rank}</Text>
                </View>
                <View style={[
                  thStyles.expandedIcon,
                  { backgroundColor: helper.color + '15' },
                ]}>
                  <Ionicons name={helper.icon} size={16} color={helper.color} />
                </View>
                <Text style={thStyles.expandedLabel}>{helper.shortLabel}</Text>
                <Text style={thStyles.expandedCount}>{count} of 12</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Footer - Clickable to expand/collapse */}
      {remainingCount > 0 && (
        <TouchableOpacity
          style={thStyles.footerButton}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <Text style={thStyles.footerText}>
            {isExpanded ? 'Show less' : `+${remainingCount} more`}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#9CA3AF"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Top Helpers styles
const thStyles = StyleSheet.create({
  cardsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFirst: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rankBadgeFirst: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 32,
  },
  cardLabelFirst: {
    color: '#1F2937',
    fontWeight: '700',
  },
  cardCount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  expandedList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandedRank: {
    width: 20,
    alignItems: 'center',
  },
  expandedRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  expandedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  expandedCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Fixed Header with Gradient
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerGradient: {
    flex: 1,
    height: 120,
  },
  headerContent: {
    // Content container for header elements
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#1F2937',
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentLabel: {
    fontSize: 13,
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
    paddingTop: 8, paddingBottom: 12,
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
  stackedMetricCard: {
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

  // ============================================
  // WEEKLY STATISTICS STYLES
  // ============================================
  weeklySectionCard: {
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
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 24,
  },
  weeklyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  weeklyRangeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  weeklyRangeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  weeklyStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  weeklyStreakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  weeklySelectedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  weeklyScoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginRight: 10,
  },
  weeklyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  weeklyMetaLight: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  weeklyChartSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  weeklyChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  weeklyChartLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },
  weeklyCursorLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 1,
  },
  weeklyHeatmapSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  weeklyHeatmap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weeklyHeatmapDot: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },

  // ============================================
  // WEALTH TRENDS SECTION (Linked Sparklines Style)
  // ============================================
  wealthCard: {
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

  wealthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  wealthCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  wealthCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },

  wealthSelectedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  wealthChartsContainer: {
    gap: 8,
  },

  wealthMetricSection: {
    paddingBottom: 8,
  },

  wealthMetricSectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  wealthMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  wealthMetricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  wealthMetricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  wealthMetricValue: {
    fontSize: 15,
    fontWeight: '600',
  },

  wealthChartWrapper: {
    position: 'relative',
  },

  wealthCursorLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 1,
  },

  wealthTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },

  wealthTimeLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  wealthCaptionContainer: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  wealthCaption: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // ============================================
  // MONTHLY STATISTICS STYLES
  // ============================================
  monthlySectionCard: {
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
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 24,
  },
  monthlyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthlyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  monthlySelectedDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  monthlyStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  monthlyWeightValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  monthlyWeightUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 4,
    marginRight: 10,
  },
  monthlyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
  },
  monthlyMetaLight: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  monthlyChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  monthlyChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  monthlyChangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthlyChangeLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  monthlyChangeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  monthlyChangeHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthlyChartSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  monthlyChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyChartArea: {
    flex: 1,
  },
  monthlyYAxis: {
    position: 'relative',
    width: 32,
    height: 80,
  },
  monthlyYAxisLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  monthlyChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginLeft: 32,
  },
  monthlyChartLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // Health Ratings Section Styles (like 12-Week Overview)
  healthChartsContainer: {
    gap: 8,
  },
  healthMetricSection: {
    paddingBottom: 8,
  },
  healthMetricSectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  healthMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  healthMetricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthMetricLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  healthMetricValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  healthChartWrapper: {
    position: 'relative',
  },
  healthCursorLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 52,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 1,
  },
  healthTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  healthTimeLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },

  // ============================================
  // PHYSICAL ACTIVITY SECTION STYLES
  // ============================================
  activityLevelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  activityLevelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityLevelTextContainer: {
    flex: 1,
  },
  activityLevelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityLevelDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  activityChartSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  activityChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityYAxis: {
    position: 'relative',
    width: 60,
    height: 100,
  },
  activityYAxisLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '400',
    color: '#9CA3AF',
    right: 8,
  },
  activityChartArea: {
    flex: 1,
    position: 'relative',
  },
  activityCursorLine: {
    position: 'absolute',
    top: 0,
    width: 1.5,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 1,
  },
  activityTimeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  activityTimeLabel: {
    fontSize: 10,
    color: '#C9CDD3',
    fontWeight: '500',
  },
});

export default StatisticsScreen;
