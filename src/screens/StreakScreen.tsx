import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStreak } from '../context/StreakContext';
import StreakHero from '../components/StreakHero';

// Calculate dynamic padding for today's streak background based on screen size
const { width: screenWidth } = Dimensions.get('window');
const CALENDAR_HORIZONTAL_MARGIN = 16 * 2; // marginHorizontal: 16 on each side
const CALENDAR_PADDING = 20 * 2; // padding: 20 inside calendar card
const calendarContentWidth = screenWidth - CALENDAR_HORIZONTAL_MARGIN - CALENDAR_PADDING;
const cellWidth = calendarContentWidth / 7;
const CIRCLE_SIZE = 34;
// Calculate padding so streak background stops just before the circle
const TODAY_STREAK_PADDING = Math.round((cellWidth - CIRCLE_SIZE) / 2);

interface StreakScreenProps {
  navigation?: {
    goBack: () => void;
  };
}

// Preview mode - set to true to show mock 14-day streak
const PREVIEW_MODE = true;
const PREVIEW_STREAK_DAYS = 14;

const StreakScreen: React.FC<StreakScreenProps> = ({ navigation }) => {
  const { streakData, isLoading } = useStreak();

  // Safe access to streak data with fallbacks
  const realStreakDates = streakData?.streakDates ?? [];
  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const totalCheckIns = streakData?.totalCheckIns ?? 0;

  // Get current date info
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // State for displayed month (can be navigated)
  const [displayMonth, setDisplayMonth] = useState(todayMonth);
  const [displayYear, setDisplayYear] = useState(todayYear);

  // Navigation handlers
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  // Generate mock current streak dates for preview
  // Set to true to end streak yesterday (for testing), false to include today
  const STREAK_ENDS_YESTERDAY = false;

  const mockCurrentStreakDates = useMemo(() => {
    if (!PREVIEW_MODE) return [];
    const dates: string[] = [];
    const streakEndOffset = STREAK_ENDS_YESTERDAY ? 1 : 0; // 1 = ends yesterday, 0 = ends today
    for (let i = PREVIEW_STREAK_DAYS - 1; i >= 0; i--) {
      const d = new Date(todayYear, todayMonth, todayDate - i - streakEndOffset);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
  }, [todayYear, todayMonth, todayDate]);

  // Generate mock past streak dates (a 5-day streak that ended 3 days before current streak started)
  const mockPastStreakDates = useMemo(() => {
    if (!PREVIEW_MODE) return [];
    const dates: string[] = [];
    // Past streak: 5 days, ending 3 days before current streak started
    const currentStreakStart = new Date(todayYear, todayMonth, todayDate - (PREVIEW_STREAK_DAYS - 1));
    const pastStreakEnd = new Date(currentStreakStart);
    pastStreakEnd.setDate(pastStreakEnd.getDate() - 3); // 3 day gap

    for (let i = 4; i >= 0; i--) { // 5 days
      const d = new Date(pastStreakEnd);
      d.setDate(d.getDate() - i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
  }, [todayYear, todayMonth, todayDate]);

  // Use mock or real streak dates based on preview mode
  const currentStreakDates = PREVIEW_MODE ? mockCurrentStreakDates : realStreakDates;
  const pastStreakDates = PREVIEW_MODE ? mockPastStreakDates : []; // In real mode, you'd calculate this from history
  const allStreakDates = [...currentStreakDates, ...pastStreakDates];

  // Generate calendar days for displayed month (starting with Sunday)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Sunday = 0, which is the first day of the week
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      day: number | null;
      date: string | null;
      isToday: boolean;
      hasStreak: boolean;
      isCurrentStreak: boolean;
      isPastStreak: boolean;
    }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null, isToday: false, hasStreak: false, isCurrentStreak: false, isPastStreak: false });
    }

    // Check if we're viewing the current month
    const isCurrentMonth = displayMonth === todayMonth && displayYear === todayYear;

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = isCurrentMonth && day === todayDate;
      const isCurrentStreak = currentStreakDates.includes(dateStr);
      const isPastStreak = pastStreakDates.includes(dateStr);
      const hasStreak = isCurrentStreak || isPastStreak;
      days.push({ day, date: dateStr, isToday, hasStreak, isCurrentStreak, isPastStreak });
    }

    return days;
  }, [displayYear, displayMonth, currentStreakDates, pastStreakDates, todayMonth, todayYear, todayDate]);

  const monthName = new Date(displayYear, displayMonth).toLocaleString('default', { month: 'long' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to determine streak position for connecting backgrounds
  const getStreakPosition = (index: number, streakType: 'current' | 'past') => {
    const dayData = calendarDays[index];
    if (!dayData?.hasStreak) return null;

    const isRowStart = index % 7 === 0;
    const isRowEnd = index % 7 === 6;

    // Check adjacent cells for same streak type
    const prevSameStreak = !isRowStart && (
      streakType === 'current'
        ? calendarDays[index - 1]?.isCurrentStreak
        : calendarDays[index - 1]?.isPastStreak
    );
    const nextSameStreak = !isRowEnd && (
      streakType === 'current'
        ? calendarDays[index + 1]?.isCurrentStreak
        : calendarDays[index + 1]?.isPastStreak
    );

    return {
      isStart: !prevSameStreak,
      isEnd: !nextSameStreak,
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Streak</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Streak Hero */}
        <StreakHero currentStreak={PREVIEW_MODE ? PREVIEW_STREAK_DAYS : currentStreak} longestStreak={longestStreak} />

        {/* Calendar */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.monthYearContainer}>
              <Text style={styles.monthText}>{monthName}</Text>
              <Text style={styles.yearText}>{displayYear}</Text>
            </View>

            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
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
            {calendarDays.map((dayData, index) => {
              const streakType = dayData.isCurrentStreak ? 'current' : 'past';
              const streakPos = dayData.hasStreak ? getStreakPosition(index, streakType) : null;

              return (
                <View key={index} style={styles.dayCell}>
                  {/* Connecting streak background with gradient - Current streak (fiery) */}
                  {dayData.isCurrentStreak && (
                    <LinearGradient
                      colors={['#FFD19A', '#FFAB6B', '#FF9248']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.streakBackground,
                        streakPos?.isStart && (dayData.isToday ? styles.streakBackgroundStartToday : styles.streakBackgroundStart),
                        streakPos?.isEnd && (dayData.isToday ? styles.streakBackgroundEndToday : styles.streakBackgroundEnd),
                      ]}
                    />
                  )}

                  {/* Connecting streak background with gradient - Past streak (lighter/muted) */}
                  {dayData.isPastStreak && (
                    <LinearGradient
                      colors={['#FFE8D4', '#FFDCC4', '#FFD0B5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.streakBackground,
                        styles.pastStreakBackground,
                        streakPos?.isStart && styles.streakBackgroundStart,
                        streakPos?.isEnd && styles.streakBackgroundEnd,
                      ]}
                    />
                  )}

                  {dayData.day !== null && (
                    <View
                      style={[
                        styles.dayCellContent,
                        dayData.isToday && dayData.hasStreak && styles.todayInStreak,
                        dayData.isToday && !dayData.hasStreak && styles.todayNoStreak,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          dayData.isCurrentStreak && !dayData.isToday && styles.streakDayText,
                          dayData.isPastStreak && styles.pastStreakDayText,
                          dayData.isToday && dayData.hasStreak && styles.todayInStreakText,
                          dayData.isToday && !dayData.hasStreak && styles.todayNoStreakText,
                        ]}
                      >
                        {dayData.day}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <Text style={styles.badgesSectionTitle}>Achievements</Text>
          <View style={styles.badgesGrid}>
            {/* 7 Day Badge */}
            <View style={[styles.badgeCard, styles.badgeUnlocked]}>
              <View style={[styles.badgeIconContainer, styles.badgeIconUnlocked]}>
                <Ionicons name="flame" size={28} color="#FF9F43" />
              </View>
              <Text style={styles.badgeName}>First Spark</Text>
              <Text style={styles.badgeDays}>7 days</Text>
              <View style={styles.badgeCheckmark}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            </View>

            {/* 14 Day Badge */}
            <View style={[styles.badgeCard, styles.badgeUnlocked]}>
              <View style={[styles.badgeIconContainer, styles.badgeIconUnlocked]}>
                <Ionicons name="bonfire" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.badgeName}>On Fire</Text>
              <Text style={styles.badgeDays}>14 days</Text>
              <View style={styles.badgeCheckmark}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              </View>
            </View>

            {/* 30 Day Badge */}
            <View style={[styles.badgeCard, styles.badgeLocked]}>
              <View style={[styles.badgeIconContainer, styles.badgeIconLocked]}>
                <Ionicons name="star" size={28} color="#9CA3AF" />
              </View>
              <Text style={[styles.badgeName, styles.badgeNameLocked]}>Monthly Star</Text>
              <Text style={[styles.badgeDays, styles.badgeDaysLocked]}>30 days</Text>
              <View style={styles.badgeProgress}>
                <View style={[styles.badgeProgressBar, { width: '47%' }]} />
              </View>
            </View>

            {/* 60 Day Badge */}
            <View style={[styles.badgeCard, styles.badgeLocked]}>
              <View style={[styles.badgeIconContainer, styles.badgeIconLocked]}>
                <Ionicons name="trophy" size={28} color="#9CA3AF" />
              </View>
              <Text style={[styles.badgeName, styles.badgeNameLocked]}>Champion</Text>
              <Text style={[styles.badgeDays, styles.badgeDaysLocked]}>60 days</Text>
              <View style={styles.badgeLockIcon}>
                <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
              </View>
            </View>

            {/* 90 Day Badge */}
            <View style={[styles.badgeCard, styles.badgeLocked]}>
              <View style={[styles.badgeIconContainer, styles.badgeIconLocked]}>
                <Ionicons name="ribbon" size={28} color="#9CA3AF" />
              </View>
              <Text style={[styles.badgeName, styles.badgeNameLocked]}>Flow State</Text>
              <Text style={[styles.badgeDays, styles.badgeDaysLocked]}>90 days</Text>
              <View style={styles.badgeLockIcon}>
                <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
              </View>
            </View>

            {/* 365 Day Badge */}
            <View style={[styles.badgeCard, styles.badgeLocked]}>
              <View style={[styles.badgeIconContainer, styles.badgeIconLocked]}>
                <Ionicons name="diamond" size={28} color="#9CA3AF" />
              </View>
              <Text style={[styles.badgeName, styles.badgeNameLocked]}>Legend</Text>
              <Text style={[styles.badgeDays, styles.badgeDaysLocked]}>365 days</Text>
              <View style={styles.badgeLockIcon}>
                <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBackground: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 0,
    right: 0,
    shadowColor: '#E88A5A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  streakBackgroundStart: {
    left: 3,
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  streakBackgroundEnd: {
    right: 3,
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  streakBackgroundStartToday: {
    left: TODAY_STREAK_PADDING,
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  streakBackgroundEndToday: {
    right: TODAY_STREAK_PADDING,
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  pastStreakBackground: {
    shadowColor: '#B8A090',
    shadowOpacity: 0.15,
  },
  dayCellContent: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    zIndex: 1,
  },
  todayInStreak: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#FF9F43',
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  todayNoStreak: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  streakDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pastStreakDayText: {
    color: '#9C7B65',
    fontWeight: '600',
  },
  todayInStreakText: {
    color: '#E67E22',
    fontWeight: '700',
  },
  todayNoStreakText: {
    color: '#374151',
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
  // Badges Section
  badgesSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  badgesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  badgeUnlocked: {
    shadowColor: '#FF9F43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeLocked: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeIconUnlocked: {
    backgroundColor: '#FFF7ED',
  },
  badgeIconLocked: {
    backgroundColor: '#F3F4F6',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeDays: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  badgeDaysLocked: {
    color: '#D1D5DB',
  },
  badgeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badgeLockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badgeProgress: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  badgeProgressBar: {
    height: '100%',
    backgroundColor: '#FF9F43',
    borderRadius: 2,
  },
});

export default StreakScreen;
