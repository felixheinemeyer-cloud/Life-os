import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Theme
const COLORS = {
  background: '#F7F5F2',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  // Metric colors
  sleep: '#8B5CF6',
  priority: '#10B981',
  priorityNo: '#EF4444',
  nutrition: '#059669',
  energy: '#F59E0B',
  satisfaction: '#3B82F6',
};

interface DayData {
  dayName: string;
  dayShort: string;
  date: number;
  isToday: boolean;
  tracked: boolean;
  sleep: number; // hours (e.g., 7.5)
  priorityCompleted: boolean;
  nutrition: number; // 1-10
  energy: number; // 1-10
  satisfaction: number; // 1-10
}

interface WeeklyTrackingOverviewContentProps {
  onContinue: () => void;
}

// Generate week data
const generateWeekData = (): { weekRange: string; days: DayData[] } => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const days: DayData[] = [];
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const isTracked = i <= todayIndex;

    days.push({
      dayName: dayNames[i],
      dayShort: dayShorts[i],
      date: date.getDate(),
      isToday: i === todayIndex,
      tracked: isTracked,
      sleep: isTracked ? Math.round((5.5 + Math.random() * 3.5) * 10) / 10 : 0, // 5.5-9 hours
      priorityCompleted: isTracked ? Math.random() > 0.3 : false,
      nutrition: isTracked ? Math.round(4 + Math.random() * 6) : 0,
      energy: isTracked ? Math.round(3 + Math.random() * 7) : 0,
      satisfaction: isTracked ? Math.round(4 + Math.random() * 6) : 0,
    });
  }

  const weekRange = `${monthNames[monday.getMonth()]} ${monday.getDate()} – ${monthNames[sunday.getMonth()]} ${sunday.getDate()}`;

  return { weekRange, days };
};

// Calculate averages
const calculateAverages = (days: DayData[]) => {
  const tracked = days.filter(d => d.tracked);
  if (tracked.length === 0) return { sleep: 0, nutrition: 0, energy: 0, satisfaction: 0, priorityRate: 0 };

  return {
    sleep: tracked.reduce((sum, d) => sum + d.sleep, 0) / tracked.length,
    nutrition: tracked.reduce((sum, d) => sum + d.nutrition, 0) / tracked.length,
    energy: tracked.reduce((sum, d) => sum + d.energy, 0) / tracked.length,
    satisfaction: tracked.reduce((sum, d) => sum + d.satisfaction, 0) / tracked.length,
    priorityRate: (tracked.filter(d => d.priorityCompleted).length / tracked.length) * 100,
  };
};

// Metric Value Cell
const MetricCell: React.FC<{ value: number; type: 'rating' | 'sleep'; color: string }> = ({ value, type, color }) => {
  if (value === 0) {
    return <Text style={styles.cellEmpty}>–</Text>;
  }

  const displayValue = type === 'sleep' ? value.toFixed(1) : value.toString();
  const isGood = type === 'sleep' ? value >= 7 : value >= 7;
  const isBad = type === 'sleep' ? value < 6 : value <= 4;

  return (
    <Text style={[
      styles.cellValue,
      { color: isBad ? '#EF4444' : isGood ? color : COLORS.text }
    ]}>
      {displayValue}
    </Text>
  );
};

// Priority Cell
const PriorityCell: React.FC<{ completed: boolean; tracked: boolean }> = ({ completed, tracked }) => {
  if (!tracked) {
    return <Text style={styles.cellEmpty}>–</Text>;
  }

  return (
    <View style={[styles.priorityBadge, { backgroundColor: completed ? '#D1FAE5' : '#FEE2E2' }]}>
      <Ionicons
        name={completed ? 'checkmark' : 'close'}
        size={14}
        color={completed ? COLORS.priority : COLORS.priorityNo}
      />
    </View>
  );
};

// Summary Card
const SummaryCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}> = ({ icon, label, value, subValue, color }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    {subValue && <Text style={styles.summarySubValue}>{subValue}</Text>}
  </View>
);

const WeeklyTrackingOverviewContent: React.FC<WeeklyTrackingOverviewContentProps> = ({
  onContinue,
}) => {
  const { weekRange, days } = generateWeekData();
  const averages = calculateAverages(days);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onContinue();
  };

  const trackedCount = days.filter(d => d.tracked).length;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weekly Check-in</Text>
          <View style={styles.weekBadge}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.teal} />
            <Text style={styles.weekBadgeText}>{weekRange}</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Week Overview</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard
              icon="moon"
              label="Avg Sleep"
              value={`${averages.sleep.toFixed(1)}h`}
              color={COLORS.sleep}
            />
            <SummaryCard
              icon="flag"
              label="Priorities"
              value={`${Math.round(averages.priorityRate)}%`}
              subValue="completed"
              color={COLORS.priority}
            />
            <SummaryCard
              icon="nutrition"
              label="Nutrition"
              value={averages.nutrition.toFixed(1)}
              subValue="/10"
              color={COLORS.nutrition}
            />
            <SummaryCard
              icon="flash"
              label="Energy"
              value={averages.energy.toFixed(1)}
              subValue="/10"
              color={COLORS.energy}
            />
          </View>
        </View>

        {/* Day-by-Day Table */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.tableDayColumn}>
                <Text style={styles.tableHeaderText}>Day</Text>
              </View>
              <View style={styles.tableMetricColumn}>
                <Ionicons name="moon" size={14} color={COLORS.sleep} />
              </View>
              <View style={styles.tableMetricColumn}>
                <Ionicons name="flag" size={14} color={COLORS.priority} />
              </View>
              <View style={styles.tableMetricColumn}>
                <Ionicons name="nutrition" size={14} color={COLORS.nutrition} />
              </View>
              <View style={styles.tableMetricColumn}>
                <Ionicons name="flash" size={14} color={COLORS.energy} />
              </View>
              <View style={styles.tableMetricColumn}>
                <Ionicons name="happy" size={14} color={COLORS.satisfaction} />
              </View>
            </View>

            {/* Table Rows */}
            {days.map((day, index) => (
              <View
                key={day.dayShort}
                style={[
                  styles.tableRow,
                  day.isToday && styles.tableRowToday,
                  index === days.length - 1 && styles.tableRowLast,
                ]}
              >
                <View style={styles.tableDayColumn}>
                  <Text style={[styles.tableDayText, day.isToday && styles.tableDayTextToday]}>
                    {day.dayShort}
                  </Text>
                  <Text style={[styles.tableDateText, day.isToday && styles.tableDateTextToday]}>
                    {day.date}
                  </Text>
                </View>
                <View style={styles.tableMetricColumn}>
                  <MetricCell value={day.sleep} type="sleep" color={COLORS.sleep} />
                </View>
                <View style={styles.tableMetricColumn}>
                  <PriorityCell completed={day.priorityCompleted} tracked={day.tracked} />
                </View>
                <View style={styles.tableMetricColumn}>
                  <MetricCell value={day.nutrition} type="rating" color={COLORS.nutrition} />
                </View>
                <View style={styles.tableMetricColumn}>
                  <MetricCell value={day.energy} type="rating" color={COLORS.energy} />
                </View>
                <View style={styles.tableMetricColumn}>
                  <MetricCell value={day.satisfaction} type="rating" color={COLORS.satisfaction} />
                </View>
              </View>
            ))}

            {/* Table Footer - Averages */}
            <View style={styles.tableFooter}>
              <View style={styles.tableDayColumn}>
                <Text style={styles.tableFooterLabel}>Avg</Text>
              </View>
              <View style={styles.tableMetricColumn}>
                <Text style={[styles.tableFooterValue, { color: COLORS.sleep }]}>
                  {averages.sleep.toFixed(1)}
                </Text>
              </View>
              <View style={styles.tableMetricColumn}>
                <Text style={[styles.tableFooterValue, { color: COLORS.priority }]}>
                  {Math.round(averages.priorityRate)}%
                </Text>
              </View>
              <View style={styles.tableMetricColumn}>
                <Text style={[styles.tableFooterValue, { color: COLORS.nutrition }]}>
                  {averages.nutrition.toFixed(1)}
                </Text>
              </View>
              <View style={styles.tableMetricColumn}>
                <Text style={[styles.tableFooterValue, { color: COLORS.energy }]}>
                  {averages.energy.toFixed(1)}
                </Text>
              </View>
              <View style={styles.tableMetricColumn}>
                <Text style={[styles.tableFooterValue, { color: COLORS.satisfaction }]}>
                  {averages.satisfaction.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.tableHint}>
            {trackedCount} of 7 days tracked
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal + '12',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  weekBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.teal,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Summary Section
  summarySection: {
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 60) / 2 - 5,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summarySubValue: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -2,
  },

  // Table Section
  tableSection: {
    marginBottom: 16,
  },
  tableCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableDayColumn: {
    width: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableMetricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowToday: {
    backgroundColor: COLORS.teal + '08',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  tableDayTextToday: {
    color: COLORS.teal,
  },
  tableDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tableDateTextToday: {
    color: COLORS.tealLight,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cellEmpty: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableFooterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  tableFooterValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },

  // Button
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: COLORS.background,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WeeklyTrackingOverviewContent;
