import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface CalendarScreenProps {
  navigation?: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

interface TrackingStatus {
  morning: boolean;
  evening: boolean;
  weekly: boolean;
  monthly: boolean;
}

interface DayData {
  date: number;
  tracking: TrackingStatus;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface WeekData {
  weekNumber: number;
  startDay: number;
  endDay: number;
  dateRange: string;
  completed: boolean;
  score: number | null;
  isAvailable: boolean;
  daysUntilAvailable: number;
}

interface MonthlyCheckInData {
  completed: boolean;
  score: number | null;
  isAvailable: boolean;
  daysUntilAvailable: number;
}

// Mock data for monthly check-ins
const mockMonthlyCheckIns: { [key: string]: { completed: boolean; score: number } } = {
  '2025-11': { completed: true, score: 7.4 },
};

// Mock data for body check-ins
const mockBodyCheckIns: { [key: string]: { completed: boolean } } = {
  '2025-11': { completed: true },
};

// Mock data for weekly check-ins (using ISO week numbers 1-52)
const mockWeeklyCheckIns: { [key: string]: { completed: boolean; score: number } } = {
  // December 2025 - ISO weeks 49-51 (week 52 not completed)
  '2025-12-week49': { completed: true, score: 7.2 },
  '2025-12-week50': { completed: true, score: 6.8 },
  '2025-12-week51': { completed: true, score: 7.4 },
  // November 2025 - ISO weeks 44-47
  '2025-11-week44': { completed: true, score: 7.0 },
  '2025-11-week45': { completed: true, score: 6.5 },
  '2025-11-week46': { completed: true, score: 7.2 },
  '2025-11-week47': { completed: true, score: 7.1 },
};

const CalendarScreen = ({ navigation }: CalendarScreenProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock data for tracking status
  const mockTrackingData: { [key: string]: TrackingStatus } = {
    // November 2024
    '2024-11-1': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-2': { morning: true, evening: false, weekly: false, monthly: false },
    '2024-11-3': { morning: false, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2024-11-4': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-5': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-6': { morning: false, evening: false, weekly: false, monthly: false },
    '2024-11-7': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-8': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-9': { morning: true, evening: false, weekly: false, monthly: false },
    '2024-11-10': { morning: false, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2024-11-11': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-12': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-13': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-14': { morning: false, evening: true, weekly: false, monthly: false },
    '2024-11-15': { morning: true, evening: false, weekly: false, monthly: false },
    '2024-11-16': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-17': { morning: true, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2024-11-18': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-19': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-20': { morning: true, evening: false, weekly: false, monthly: false },
    '2024-11-21': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-22': { morning: true, evening: true, weekly: false, monthly: false },
    '2024-11-23': { morning: false, evening: true, weekly: false, monthly: false },
    '2024-11-24': { morning: true, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2024-11-30': { morning: true, evening: true, weekly: false, monthly: true }, // Last day - monthly
    // November 2025
    '2025-11-1': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-2': { morning: true, evening: false, weekly: true, monthly: false }, // Sunday - weekly
    '2025-11-3': { morning: false, evening: true, weekly: false, monthly: false },
    '2025-11-4': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-5': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-6': { morning: false, evening: false, weekly: false, monthly: false },
    '2025-11-7': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-8': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-9': { morning: true, evening: false, weekly: true, monthly: false }, // Sunday - weekly
    '2025-11-10': { morning: false, evening: true, weekly: false, monthly: false },
    '2025-11-11': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-12': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-13': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-14': { morning: false, evening: true, weekly: false, monthly: false },
    '2025-11-15': { morning: true, evening: false, weekly: false, monthly: false },
    '2025-11-16': { morning: true, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2025-11-17': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-18': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-19': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-20': { morning: true, evening: false, weekly: false, monthly: false },
    '2025-11-21': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-22': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-23': { morning: false, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2025-11-24': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-11-30': { morning: true, evening: true, weekly: true, monthly: true }, // Sunday & Last day - weekly & monthly
    // December 2025
    '2025-12-1': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-2': { morning: true, evening: false, weekly: false, monthly: false },
    '2025-12-3': { morning: false, evening: true, weekly: false, monthly: false },
    '2025-12-4': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-5': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-6': { morning: false, evening: false, weekly: false, monthly: false },
    '2025-12-7': { morning: true, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2025-12-8': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-9': { morning: true, evening: false, weekly: false, monthly: false },
    '2025-12-10': { morning: false, evening: true, weekly: false, monthly: false },
    '2025-12-11': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-12': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-13': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-14': { morning: false, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2025-12-15': { morning: true, evening: false, weekly: false, monthly: false },
    '2025-12-16': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-17': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-18': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-19': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-20': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-21': { morning: true, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2025-12-22': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-23': { morning: false, evening: true, weekly: false, monthly: false },
    '2025-12-24': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-25': { morning: true, evening: true, weekly: false, monthly: false },
    '2025-12-28': { morning: true, evening: true, weekly: true, monthly: false }, // Sunday - weekly
    '2025-12-31': { morning: true, evening: true, weekly: false, monthly: true }, // Last day - monthly
    // January 2026
    '2026-1-1': { morning: true, evening: true, weekly: false, monthly: false },
    '2026-1-2': { morning: true, evening: false, weekly: false, monthly: false },
    '2026-1-3': { morning: false, evening: true, weekly: false, monthly: false },
    '2026-1-4': { morning: true, evening: true, weekly: false, monthly: false },
    '2026-1-5': { morning: true, evening: true, weekly: true, monthly: false }, // Sunday - weekly
  };

  // Helper functions
  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'long' });
  };

  const getYear = (date: Date): number => {
    return date.getFullYear();
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    // Get the day (0 = Sunday, 1 = Monday, etc.)
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert to Monday-first (0 = Monday, 6 = Sunday)
    return day === 0 ? 6 : day - 1;
  };

  const isToday = (date: Date, day: number): boolean => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const getTrackingStatus = (date: Date, day: number): TrackingStatus => {
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
    return mockTrackingData[key] || { morning: false, evening: false, weekly: false, monthly: false };
  };

  const generateCalendarDays = (): DayData[] => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: DayData[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: 0,
        tracking: { morning: false, evening: false, weekly: false, monthly: false },
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        tracking: getTrackingStatus(currentDate, day),
        isCurrentMonth: true,
        isToday: isToday(currentDate, day),
      });
    }

    return days;
  };

  const goToPreviousMonth = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = (): void => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDayPress = (day: number): void => {
    if (day === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Create date key for the selected day
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;

    // Format display date
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateDisplay = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    navigation?.navigate('DailyOverview', {
      date: dateKey,
      dateDisplay: dateDisplay,
    });
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get ISO week number for a date
  const getISOWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Generate weeks for the current month (weeks are assigned to the month where they END)
  const weeksOfMonth = useMemo((): WeekData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks: WeekData[] = [];

    // Find the first Sunday of the current month
    const firstOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstOfMonth.getDay(); // 0 = Sunday
    // Days until first Sunday
    const daysToSunday = firstDayOfWeek === 0 ? 0 : 7 - firstDayOfWeek;
    const firstSunday = new Date(year, month, 1 + daysToSunday);

    // Start from the first Sunday in this month
    let currentSunday = new Date(firstSunday);

    // Generate weeks where Sunday falls in this month
    while (currentSunday.getMonth() === month) {
      // Calculate Monday (start of this week)
      const weekStart = new Date(currentSunday);
      weekStart.setDate(weekStart.getDate() - 6);

      // Get ISO week number based on the Thursday of this week
      const thursday = new Date(weekStart);
      thursday.setDate(thursday.getDate() + 3);
      const weekNumber = getISOWeekNumber(thursday);

      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = currentSunday.toLocaleDateString('en-US', { month: 'short' });
      const startDay = weekStart.getDate();
      const endDay = currentSunday.getDate();

      // Format date range
      let dateRange: string;
      if (startMonth === endMonth) {
        dateRange = `${startMonth} ${startDay} – ${endDay}`;
      } else {
        dateRange = `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
      }

      // Check if the week is available (Sunday has passed)
      const sundayEnd = new Date(currentSunday);
      sundayEnd.setHours(23, 59, 59, 999);
      const isAvailable = today > sundayEnd;

      // Calculate days until available
      const timeDiff = sundayEnd.getTime() - today.getTime();
      const daysUntilAvailable = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

      const weekKey = `${year}-${month + 1}-week${weekNumber}`;
      const weekData = mockWeeklyCheckIns[weekKey];

      weeks.push({
        weekNumber,
        startDay,
        endDay,
        dateRange,
        completed: weekData?.completed || false,
        score: weekData?.score || null,
        isAvailable,
        daysUntilAvailable,
      });

      // Move to next Sunday
      currentSunday.setDate(currentSunday.getDate() + 7);
    }

    return weeks;
  }, [currentDate]);

  // Get monthly check-in availability
  const monthlyCheckIn = useMemo((): MonthlyCheckInData => {
    const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
    const mockData = mockMonthlyCheckIns[key];

    // Monthly check-in is available after the month ends
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const isAvailable = today > lastDayOfMonth;
    const timeDiff = lastDayOfMonth.getTime() - today.getTime();
    const daysUntilAvailable = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    return {
      completed: mockData?.completed || false,
      score: mockData?.score || null,
      isAvailable,
      daysUntilAvailable,
    };
  }, [currentDate]);

  // Get body check-in availability
  const bodyCheckIn = useMemo((): MonthlyCheckInData => {
    const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
    const mockData = mockBodyCheckIns[key];

    // Body check-in is available after the month ends
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);

    const isAvailable = today > lastDayOfMonth;
    const timeDiff = lastDayOfMonth.getTime() - today.getTime();
    const daysUntilAvailable = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    return {
      completed: mockData?.completed || false,
      score: null,
      isAvailable,
      daysUntilAvailable,
    };
  }, [currentDate]);

  const handleWeekPress = (week: WeekData): void => {
    if (!week.isAvailable) return; // Don't navigate if timer hasn't run out
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (week.completed) {
      // Navigate to review screen if completed
      navigation?.navigate('WeeklyReview', {
        weekNumber: week.weekNumber,
        dateRange: week.dateRange,
      });
    } else {
      // Navigate to tracking flow if not completed
      navigation?.navigate('WeeklyTracking');
    }
  };

  const handleMonthlyPress = (): void => {
    if (!monthlyCheckIn.isAvailable) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (monthlyCheckIn.completed) {
      // Navigate to review screen if completed
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
      navigation?.navigate('MonthlyReview', {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        monthName: monthName,
      });
    } else {
      // Navigate to tracking flow if not completed
      navigation?.navigate('MonthlyTracking');
    }
  };

  const handleBodyCheckInPress = (): void => {
    if (!bodyCheckIn.isAvailable) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (bodyCheckIn.completed) {
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
      navigation?.navigate('BodyCheckInReview', {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        monthName: monthName,
      });
    } else {
      // Navigate to tracking flow if not completed
      navigation?.navigate('MonthlyBodyTracking');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 14 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scrollable Title */}
        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={goToPreviousMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.monthYearContainer}>
              <Text style={styles.monthText}>{getMonthName(currentDate)}</Text>
              <Text style={styles.yearText}>{getYear(currentDate)}</Text>
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={goToNextMonth}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((dayData, index) => (
              <View key={index} style={styles.dayCell}>
                {dayData.isCurrentMonth ? (
                  <TouchableOpacity
                    style={[
                      styles.dayCellContent,
                      dayData.isToday && styles.todayCell,
                    ]}
                    onPress={() => handleDayPress(dayData.date)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        dayData.isToday && styles.todayNumber,
                      ]}
                    >
                      {dayData.date}
                    </Text>
                    <View style={styles.trackingIndicators}>
                      {dayData.tracking.morning && (
                        <View style={styles.morningDot} />
                      )}
                      {dayData.tracking.evening && (
                        <View style={styles.eveningDot} />
                      )}
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>

        </View>

        {/* Weekly Reviews Section */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewSectionHeader}>
            <LinearGradient
              colors={['#5EEAD4', '#14B8A6', '#0D9488']}
              style={styles.reviewSectionIconRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.reviewSectionIconInner}>
                <Ionicons name="calendar" size={16} color="#0D9488" />
              </View>
            </LinearGradient>
            <Text style={styles.reviewSectionTitle}>Weekly Reviews</Text>
          </View>

          <View style={styles.weeklyGrid}>
            {weeksOfMonth.map((week) => {
              const isReadyToComplete = !week.completed && week.isAvailable;
              const isPending = !week.completed && !week.isAvailable;

              return (
                <TouchableOpacity
                  key={week.weekNumber}
                  style={[
                    styles.weekButton,
                    isReadyToComplete && styles.weekButtonReady,
                    isPending && styles.weekButtonPending,
                  ]}
                  onPress={() => handleWeekPress(week)}
                  activeOpacity={0.7}
                >
                  <View style={styles.weekButtonContent}>
                    <View style={styles.weekButtonHeader}>
                      <Text style={[
                        styles.weekButtonTitle,
                        isReadyToComplete && styles.weekButtonTitleReady,
                        isPending && styles.weekButtonTitlePending,
                      ]}>Week {week.weekNumber}</Text>
                      {week.completed && (
                        <View style={styles.weekCompletedBadge}>
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.weekButtonDateRange,
                      isPending && styles.weekButtonDateRangePending,
                    ]}>{week.dateRange}</Text>
                    {week.completed && week.score !== null && (
                      <View style={styles.weekScoreContainer}>
                        <Text style={styles.weekScoreValue}>{week.score.toFixed(1)}</Text>
                        <Text style={styles.weekScoreLabel}>score</Text>
                      </View>
                    )}
                    {isReadyToComplete && (
                      <View style={styles.weekReadyContainer}>
                        <Text style={styles.weekReadyText}>Start review</Text>
                      </View>
                    )}
                    {isPending && (
                      <View style={styles.weekTimerContainer}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.weekTimerText}>
                          {week.daysUntilAvailable === 1 ? '1 day' : `${week.daysUntilAvailable} days`}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.weekButtonArrow}>
                    <Ionicons name="chevron-forward" size={16} color={isPending ? '#D1D5DB' : '#9CA3AF'} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Monthly Reviews Section */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewSectionHeader}>
            <LinearGradient
              colors={['#FBCFE8', '#F472B6', '#DB2777']}
              style={styles.reviewSectionIconRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.reviewSectionIconInner}>
                <Ionicons name="stats-chart" size={16} color="#DB2777" />
              </View>
            </LinearGradient>
            <Text style={styles.reviewSectionTitle}>Monthly Reviews</Text>
          </View>

          {/* Monthly Check-in Button */}
          <TouchableOpacity
            style={styles.monthlyCardTouchable}
            onPress={handleMonthlyPress}
            activeOpacity={0.85}
          >
            <View style={[styles.monthlyCard, !monthlyCheckIn.isAvailable && styles.monthlyCardPending]}>
              <View style={styles.monthlyIconWrapper}>
                <LinearGradient
                  colors={monthlyCheckIn.isAvailable ? ['#FBCFE8', '#F472B6', '#DB2777'] : ['#E5E7EB', '#D1D5DB', '#9CA3AF']}
                  style={styles.monthlyIconGradientRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.monthlyIconInnerCircle}>
                    <Ionicons name="calendar-outline" size={28} color={monthlyCheckIn.isAvailable ? '#DB2777' : '#9CA3AF'} />
                  </View>
                </LinearGradient>
                {monthlyCheckIn.completed && (
                  <View style={styles.monthlyCompletedBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.monthlyTextContainer}>
                <Text style={[styles.monthlyCardTitle, !monthlyCheckIn.isAvailable && styles.monthlyCardTitlePending]}>Monthly Check-In</Text>
                {monthlyCheckIn.completed && monthlyCheckIn.score !== null ? (
                  <View style={styles.monthlyScoreRow}>
                    <Text style={styles.monthlyScoreValue}>{monthlyCheckIn.score.toFixed(1)}</Text>
                    <Text style={styles.monthlyScoreLabel}>score</Text>
                  </View>
                ) : monthlyCheckIn.isAvailable ? (
                  <Text style={styles.monthlyCardSubtitle}>Review your month</Text>
                ) : (
                  <View style={styles.monthlyTimerRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.monthlyTimerText}>
                      {monthlyCheckIn.daysUntilAvailable === 1 ? '1 day' : `${monthlyCheckIn.daysUntilAvailable} days`}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={monthlyCheckIn.isAvailable ? '#6B7280' : '#D1D5DB'} style={styles.monthlyChevron} />
            </View>
          </TouchableOpacity>

          {/* Body Check-in Button */}
          <TouchableOpacity
            style={styles.bodyCheckInCardTouchable}
            onPress={handleBodyCheckInPress}
            activeOpacity={0.85}
          >
            <View style={[styles.bodyCheckInCard, !bodyCheckIn.isAvailable && styles.bodyCheckInCardPending]}>
              <View style={styles.bodyCheckInIconWrapper}>
                <LinearGradient
                  colors={bodyCheckIn.isAvailable ? ['#BAE6FD', '#38BDF8', '#0EA5E9'] : ['#E5E7EB', '#D1D5DB', '#9CA3AF']}
                  style={styles.bodyCheckInIconGradientRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.bodyCheckInIconInnerCircle}>
                    <Ionicons name="body" size={28} color={bodyCheckIn.isAvailable ? '#0EA5E9' : '#9CA3AF'} />
                  </View>
                </LinearGradient>
                {bodyCheckIn.completed && (
                  <View style={styles.bodyCompletedBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.bodyCheckInTextContainer}>
                <Text style={[styles.bodyCheckInCardTitle, !bodyCheckIn.isAvailable && styles.bodyCheckInCardTitlePending]}>Monthly Body Check-In</Text>
                {bodyCheckIn.completed ? (
                  <Text style={styles.bodyCompletedText}>Completed</Text>
                ) : bodyCheckIn.isAvailable ? (
                  <Text style={styles.bodyCheckInCardSubtitle}>Track your physical progress</Text>
                ) : (
                  <View style={styles.monthlyTimerRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.monthlyTimerText}>
                      {bodyCheckIn.daysUntilAvailable === 1 ? '1 day' : `${bodyCheckIn.daysUntilAvailable} days`}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={bodyCheckIn.isAvailable ? '#6B7280' : '#D1D5DB'} style={styles.bodyCheckInChevron} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Header with Gradient Fade */}
      <View style={styles.fixedHeader} pointerEvents="none">
        <LinearGradient
          colors={[
            'rgba(240, 238, 232, 0.95)',
            'rgba(240, 238, 232, 0.8)',
            'rgba(240, 238, 232, 0.4)',
            'rgba(240, 238, 232, 0)',
          ]}
          locations={[0, 0.4, 0.75, 1]}
          style={[styles.headerGradient, { height: insets.top + 20 }]}
        />
      </View>
    </View>
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
    paddingBottom: 20,
  },

  // Fixed Header with Gradient
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    // height set dynamically based on insets
  },

  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  yearText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    paddingHorizontal: 2,
    paddingTop: 8, paddingBottom: 12,
  },
  dayCellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  todayCell: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: -6,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  todayNumber: {
    fontWeight: '700',
    color: '#D97706',
  },
  trackingIndicators: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    minHeight: 5,
  },
  morningDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  eveningDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#8B5CF6',
  },
  bottomSpacer: {
    height: 40,
  },

  // Review Sections
  reviewSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewSectionIconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewSectionIconInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 10,
    letterSpacing: -0.2,
  },

  // Weekly Grid
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  weekButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  weekButtonReady: {
    backgroundColor: '#FFFFFF',
  },
  weekButtonPending: {
    backgroundColor: '#F9FAFB',
  },
  weekButtonTitlePending: {
    color: '#9CA3AF',
  },
  weekButtonDateRangePending: {
    color: '#D1D5DB',
  },
  weekButtonContent: {
    flex: 1,
  },
  weekButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  weekButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  weekButtonTitleReady: {
    color: '#1F2937',
  },
  weekCompletedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekButtonDateRange: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  weekScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weekScoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D9488',
  },
  weekScoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  weekPendingContainer: {
    marginTop: 2,
  },
  weekPendingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  weekReadyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  weekReadyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
  },
  weekTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  weekTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  weekButtonArrow: {
    marginLeft: 8,
  },

  // Monthly Check-In Card Styles
  monthlyCardTouchable: {
    marginBottom: 12,
  },
  monthlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  monthlyCardPending: {
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
  },
  monthlyIconWrapper: {
    position: 'relative',
  },
  monthlyIconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthlyIconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthlyCompletedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DB2777',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  monthlyTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  monthlyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  monthlyCardTitlePending: {
    color: '#9CA3AF',
  },
  monthlyScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  monthlyScoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DB2777',
  },
  monthlyScoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  monthlyCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DB2777',
    opacity: 0.85,
  },
  monthlyTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthlyTimerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  monthlyChevron: {
    opacity: 0.6,
    marginLeft: 8,
  },

  // Body Check-In Card Styles
  bodyCheckInCardTouchable: {
    marginBottom: 12,
  },
  bodyCheckInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  bodyCheckInCardPending: {
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
  },
  bodyCheckInIconWrapper: {
    position: 'relative',
  },
  bodyCheckInIconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyCheckInIconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyCompletedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bodyCheckInTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  bodyCheckInCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  bodyCheckInCardTitlePending: {
    color: '#9CA3AF',
  },
  bodyCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bodyCompletedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  bodyCheckInCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0EA5E9',
    opacity: 0.85,
  },
  bodyCheckInChevron: {
    opacity: 0.6,
    marginLeft: 8,
  },
});

export default CalendarScreen;
