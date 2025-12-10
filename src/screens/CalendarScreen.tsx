import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrackingStatus {
  morning: boolean;
  evening: boolean;
}

interface DayData {
  date: number;
  tracking: TrackingStatus;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const CalendarScreen = (): React.JSX.Element => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock data for tracking status (November 2024)
  const mockTrackingData: { [key: string]: TrackingStatus } = {
    // November 2024
    '2024-11-1': { morning: true, evening: true },
    '2024-11-2': { morning: true, evening: false },
    '2024-11-3': { morning: false, evening: true },
    '2024-11-4': { morning: true, evening: true },
    '2024-11-5': { morning: true, evening: true },
    '2024-11-6': { morning: false, evening: false },
    '2024-11-7': { morning: true, evening: true },
    '2024-11-8': { morning: true, evening: true },
    '2024-11-9': { morning: true, evening: false },
    '2024-11-10': { morning: false, evening: true },
    '2024-11-11': { morning: true, evening: true },
    '2024-11-12': { morning: true, evening: true },
    '2024-11-13': { morning: true, evening: true },
    '2024-11-14': { morning: false, evening: true },
    '2024-11-15': { morning: true, evening: false },
    '2024-11-16': { morning: true, evening: true },
    '2024-11-17': { morning: true, evening: true },
    '2024-11-18': { morning: true, evening: true },
    '2024-11-19': { morning: true, evening: true },
    '2024-11-20': { morning: true, evening: false },
    '2024-11-21': { morning: true, evening: true },
    '2024-11-22': { morning: true, evening: true },
    '2024-11-23': { morning: false, evening: true },
    '2024-11-24': { morning: true, evening: true },
    // November 2025
    '2025-11-1': { morning: true, evening: true },
    '2025-11-2': { morning: true, evening: false },
    '2025-11-3': { morning: false, evening: true },
    '2025-11-4': { morning: true, evening: true },
    '2025-11-5': { morning: true, evening: true },
    '2025-11-6': { morning: false, evening: false },
    '2025-11-7': { morning: true, evening: true },
    '2025-11-8': { morning: true, evening: true },
    '2025-11-9': { morning: true, evening: false },
    '2025-11-10': { morning: false, evening: true },
    '2025-11-11': { morning: true, evening: true },
    '2025-11-12': { morning: true, evening: true },
    '2025-11-13': { morning: true, evening: true },
    '2025-11-14': { morning: false, evening: true },
    '2025-11-15': { morning: true, evening: false },
    '2025-11-16': { morning: true, evening: true },
    '2025-11-17': { morning: true, evening: true },
    '2025-11-18': { morning: true, evening: true },
    '2025-11-19': { morning: true, evening: true },
    '2025-11-20': { morning: true, evening: false },
    '2025-11-21': { morning: true, evening: true },
    '2025-11-22': { morning: true, evening: true },
    '2025-11-23': { morning: false, evening: true },
    '2025-11-24': { morning: true, evening: true },
    // December 2025
    '2025-12-1': { morning: true, evening: true },
    '2025-12-2': { morning: true, evening: false },
    '2025-12-3': { morning: false, evening: true },
    '2025-12-4': { morning: true, evening: true },
    '2025-12-5': { morning: true, evening: true },
    '2025-12-6': { morning: false, evening: false },
    '2025-12-7': { morning: true, evening: true },
    '2025-12-8': { morning: true, evening: true },
    '2025-12-9': { morning: true, evening: false },
    '2025-12-10': { morning: false, evening: true },
    '2025-12-11': { morning: true, evening: true },
    '2025-12-12': { morning: true, evening: true },
    '2025-12-13': { morning: true, evening: true },
    '2025-12-14': { morning: false, evening: true },
    '2025-12-15': { morning: true, evening: false },
    '2025-12-16': { morning: true, evening: true },
    '2025-12-17': { morning: true, evening: true },
    '2025-12-18': { morning: true, evening: true },
    '2025-12-19': { morning: true, evening: true },
    '2025-12-20': { morning: true, evening: false },
    '2025-12-21': { morning: true, evening: true },
    '2025-12-22': { morning: true, evening: true },
    '2025-12-23': { morning: false, evening: true },
    '2025-12-24': { morning: true, evening: true },
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
    return mockTrackingData[key] || { morning: false, evening: false };
  };

  const generateCalendarDays = (): DayData[] => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: DayData[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: 0,
        tracking: { morning: false, evening: false },
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

  const calendarDays = generateCalendarDays();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
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
                  <View
                    style={[
                      styles.dayCellContent,
                      dayData.isToday && styles.todayCell,
                    ]}
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
                  </View>
                ) : null}
              </View>
            ))}
          </View>

        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  header: {
    backgroundColor: '#F0EEE8',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
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
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
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
    paddingVertical: 12,
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
});

export default CalendarScreen;
