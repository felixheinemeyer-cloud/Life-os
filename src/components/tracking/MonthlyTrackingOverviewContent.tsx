import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const COLORS = {
  background: '#F7F5F2',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  green: '#059669',
  greenBg: '#ECFDF5',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  red: '#DC2626',
  redBg: '#FEF2F2',
};

interface MonthlyTrackingOverviewContentProps {
  onContinue: () => void;
}

type WealthArea = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  average: number;
  trend: number; // percentage change from last month
  weekScores: number[];
};

const generateMonthlyData = () => {
  const areas: WealthArea[] = [
    { key: 'physical', label: 'Physical', icon: 'fitness', color: '#059669', average: 0, trend: 0, weekScores: [] },
    { key: 'social', label: 'Social', icon: 'people', color: '#8B5CF6', average: 0, trend: 0, weekScores: [] },
    { key: 'mental', label: 'Mental', icon: 'bulb', color: '#3B82F6', average: 0, trend: 0, weekScores: [] },
    { key: 'financial', label: 'Financial', icon: 'wallet', color: '#D97706', average: 0, trend: 0, weekScores: [] },
    { key: 'time', label: 'Time', icon: 'time', color: '#EC4899', average: 0, trend: 0, weekScores: [] },
  ];

  const weeks = 4;

  areas.forEach(area => {
    for (let i = 0; i < weeks; i++) {
      area.weekScores.push(Math.round(40 + Math.random() * 55) / 10);
    }
    area.average = area.weekScores.reduce((a, b) => a + b, 0) / weeks;
    area.trend = Math.round((Math.random() - 0.4) * 30); // -12% to +18%
  });

  const overall = areas.reduce((sum, a) => sum + a.average, 0) / areas.length;
  const overallTrend = Math.round((Math.random() - 0.4) * 20);

  // Sort by average to find best and worst
  const sorted = [...areas].sort((a, b) => b.average - a.average);

  return { areas, overall, overallTrend, weeks, best: sorted[0], needsFocus: sorted[sorted.length - 1] };
};

const getMonthName = (): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[new Date().getMonth()];
};

// Week dots component
const WeekDots: React.FC<{ scores: number[] }> = ({ scores }) => (
  <View style={styles.weekDots}>
    {scores.map((score, i) => (
      <View
        key={i}
        style={[
          styles.weekDot,
          {
            backgroundColor: score >= 7 ? COLORS.green : score >= 5 ? COLORS.amber : COLORS.red,
            opacity: 0.2 + (score / 10) * 0.8,
          }
        ]}
      />
    ))}
  </View>
);

// Trend badge
const TrendBadge: React.FC<{ trend: number; size?: 'small' | 'normal' }> = ({ trend, size = 'normal' }) => {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  const color = isPositive ? COLORS.green : isNeutral ? COLORS.textMuted : COLORS.red;
  const bg = isPositive ? COLORS.greenBg : isNeutral ? '#F3F4F6' : COLORS.redBg;

  return (
    <View style={[styles.trendBadge, { backgroundColor: bg }, size === 'small' && styles.trendBadgeSmall]}>
      {!isNeutral && (
        <Ionicons
          name={isPositive ? 'arrow-up' : 'arrow-down'}
          size={size === 'small' ? 10 : 12}
          color={color}
        />
      )}
      <Text style={[styles.trendText, { color }, size === 'small' && styles.trendTextSmall]}>
        {isNeutral ? '—' : `${Math.abs(trend)}%`}
      </Text>
    </View>
  );
};

// Area row component
const AreaRow: React.FC<{ area: WealthArea; isLast: boolean }> = ({ area, isLast }) => (
  <View style={[styles.areaRow, !isLast && styles.areaRowBorder]}>
    <View style={[styles.areaIcon, { backgroundColor: area.color + '15' }]}>
      <Ionicons name={area.icon} size={18} color={area.color} />
    </View>
    <View style={styles.areaContent}>
      <Text style={styles.areaLabel}>{area.label}</Text>
      <WeekDots scores={area.weekScores} />
    </View>
    <View style={styles.areaStats}>
      <Text style={[styles.areaScore, { color: area.color }]}>{area.average.toFixed(1)}</Text>
      <TrendBadge trend={area.trend} size="small" />
    </View>
  </View>
);

const MonthlyTrackingOverviewContent: React.FC<MonthlyTrackingOverviewContentProps> = ({
  onContinue,
}) => {
  const monthName = getMonthName();
  const data = generateMonthlyData();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onContinue();
  };

  const scoreColor = data.overall >= 7 ? COLORS.green : data.overall >= 5 ? COLORS.amber : COLORS.red;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.monthName}>{monthName}</Text>
            <Text style={styles.subtitle}>{data.weeks} weeks tracked</Text>
          </View>

          {/* Overall Score Card */}
          <View style={styles.overallCard}>
            <View style={styles.overallMain}>
              <Text style={styles.overallLabel}>Monthly Score</Text>
              <View style={styles.overallScoreRow}>
                <Text style={[styles.overallScore, { color: scoreColor }]}>
                  {data.overall.toFixed(1)}
                </Text>
                <TrendBadge trend={data.overallTrend} />
              </View>
            </View>
            <View style={styles.overallHighlights}>
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>Best</Text>
                <View style={styles.highlightValue}>
                  <Ionicons name={data.best.icon} size={14} color={data.best.color} />
                  <Text style={[styles.highlightText, { color: data.best.color }]}>
                    {data.best.label}
                  </Text>
                </View>
              </View>
              <View style={styles.highlightDivider} />
              <View style={styles.highlightItem}>
                <Text style={styles.highlightLabel}>Focus</Text>
                <View style={styles.highlightValue}>
                  <Ionicons name={data.needsFocus.icon} size={14} color={data.needsFocus.color} />
                  <Text style={[styles.highlightText, { color: data.needsFocus.color }]}>
                    {data.needsFocus.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Areas Breakdown */}
          <View style={styles.areasCard}>
            <View style={styles.areasHeader}>
              <Text style={styles.areasTitle}>Wealth Areas</Text>
              <Text style={styles.areasHint}>vs last month</Text>
            </View>
            {data.areas.map((area, index) => (
              <AreaRow
                key={area.key}
                area={area}
                isLast={index === data.areas.length - 1}
              />
            ))}
          </View>
        </Animated.View>
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
    </View>
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
    paddingBottom: 16,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  monthName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
  },

  // Overall Card
  overallCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  overallMain: {
    marginBottom: 20,
  },
  overallLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  overallScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overallScore: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1,
  },

  // Highlights
  overallHighlights: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  highlightItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  highlightLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  highlightValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightText: {
    fontSize: 15,
    fontWeight: '600',
  },
  highlightDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },

  // Trend Badge
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 3,
  },
  trendBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  trendTextSmall: {
    fontSize: 11,
  },

  // Areas Card
  areasCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  areasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  areasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  areasHint: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Area Row
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  areaRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  areaIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  areaContent: {
    flex: 1,
    gap: 6,
  },
  areaLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  areaStats: {
    alignItems: 'flex-end',
    gap: 6,
  },
  areaScore: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Week Dots
  weekDots: {
    flexDirection: 'row',
    gap: 4,
  },
  weekDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },

  // Button
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: COLORS.background,
  },
  continueButton: {
    backgroundColor: COLORS.text,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MonthlyTrackingOverviewContent;
