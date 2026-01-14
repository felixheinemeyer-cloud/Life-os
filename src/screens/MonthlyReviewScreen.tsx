import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

// Score rating helper
const getScoreRating = (score: number): { label: string; color: string } => {
  if (score >= 8) return { label: 'Excellent', color: '#059669' };
  if (score >= 6.5) return { label: 'Good', color: '#10B981' };
  if (score >= 5) return { label: 'Okay', color: '#F59E0B' };
  return { label: 'Needs Work', color: '#EF4444' };
};

// Circular Progress Ring Component
const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({
  score,
  color,
  size = 90
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 10) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgLinearGradient id="monthlyScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8EAED"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#monthlyScoreGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

interface MonthlyReviewScreenProps {
  navigation?: {
    goBack: () => void;
  };
  route?: {
    params?: {
      month: number;
      year: number;
      monthName: string;
    };
  };
}

interface MonthlyData {
  completed: boolean;
  monthName: string;
  overallScore: number;
  overallTrend: number;
  weeksTracked: number;
  wealthAverages: {
    physical: { score: number; trend: number };
    social: { score: number; trend: number };
    mental: { score: number; trend: number };
    financial: { score: number; trend: number };
    time: { score: number; trend: number };
  };
  keyLearning: string;
  lostSightOf: string;
  proudMoment: string;
  messageToSelf: string;
}

// Mock data for monthly check-ins
const mockMonthlyData: { [key: string]: MonthlyData } = {
  '2025-11': {
    completed: true,
    monthName: 'November',
    overallScore: 7.1,
    overallTrend: 5,
    weeksTracked: 4,
    wealthAverages: {
      physical: { score: 7.2, trend: 5 },
      social: { score: 7.0, trend: -3 },
      mental: { score: 6.8, trend: 8 },
      financial: { score: 7.5, trend: 2 },
      time: { score: 7.0, trend: -1 },
    },
    keyLearning: 'Consistency in small daily habits leads to big results over time.',
    lostSightOf: 'Regular exercise routine slipped during the busy work weeks.',
    proudMoment: 'Successfully completed the 30-day meditation challenge.',
    messageToSelf: 'Remember to take breaks and not sacrifice health for productivity.',
  },
  '2025-12': {
    completed: true,
    monthName: 'December',
    overallScore: 7.6,
    overallTrend: 7,
    weeksTracked: 4,
    wealthAverages: {
      physical: { score: 7.5, trend: 4 },
      social: { score: 8.2, trend: 17 },
      mental: { score: 7.2, trend: 6 },
      financial: { score: 7.0, trend: -7 },
      time: { score: 8.0, trend: 14 },
    },
    keyLearning: 'Quality time with family is more valuable than any material gift.',
    lostSightOf: 'Budget discipline during the holiday shopping season.',
    proudMoment: 'Created meaningful memories during the holiday season.',
    messageToSelf: 'Start the new year with intention and focus on what truly matters.',
  },
};

const getMonthlyData = (year: number, month: number): MonthlyData | null => {
  return mockMonthlyData[`${year}-${month}`] || null;
};

const getMonthName = (year: number, month: number): string => {
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });
};

const MonthlyReviewScreen = ({ navigation, route }: MonthlyReviewScreenProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const initialMonth = route?.params?.month || new Date().getMonth() + 1;
  const initialYear = route?.params?.year || new Date().getFullYear();

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);

  const monthName = getMonthName(currentYear, currentMonth);
  const monthlyData = getMonthlyData(currentYear, currentMonth);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  const handlePreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check if we're at the current month (can't go forward)
  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  if (!monthlyData) {
    return (
      <View style={styles.container}>
        {/* Scrollable Content */}
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 72 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Monthly Check-in Card - Empty State */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#FBCFE8', '#F472B6', '#DB2777']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#DB2777" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Monthly Check-in</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Empty State Content */}
              <View style={styles.emptyCardContent}>
                <View style={styles.emptyCardIcon}>
                  <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyCardTitle}>No review data</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Complete your monthly check-in to see your review here
                </Text>
                <TouchableOpacity
                  style={styles.emptyCardButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // TODO: Navigate to monthly check-in flow
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyCardButtonText}>Complete Check-in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
            </TouchableOpacity>
            <View style={styles.headerDatePicker}>
              <View style={styles.headerDatePill}>
                <Pressable
                  style={({ pressed }) => [
                    styles.headerDatePillSide,
                    pressed && styles.headerDatePillSidePressed,
                  ]}
                  onPress={handlePreviousMonth}
                >
                  <Ionicons name="chevron-back" size={16} color="#6B7280" />
                </Pressable>
                <View style={styles.headerDatePillCenter}>
                  <Ionicons name="calendar-outline" size={14} color="#DB2777" />
                  <Text style={styles.headerDateText}>{monthName} {currentYear}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.headerDatePillSide,
                    isCurrentMonth && styles.headerDatePillSideDisabled,
                    pressed && !isCurrentMonth && styles.headerDatePillSidePressed,
                  ]}
                  onPress={handleNextMonth}
                  disabled={isCurrentMonth}
                >
                  <Ionicons name="chevron-forward" size={16} color={isCurrentMonth ? '#D1D5DB' : '#6B7280'} />
                </Pressable>
              </View>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Monthly Summary Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#FBCFE8', '#F472B6', '#DB2777']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#DB2777" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Monthly Summary</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Score Section */}
              <View style={styles.scoreSection}>
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreRingWrapper}>
                    <ScoreRing score={monthlyData.overallScore} color={getScoreRating(monthlyData.overallScore).color} size={90} />
                    <View style={styles.scoreTextOverlay}>
                      <Text style={[styles.scoreValue, { color: getScoreRating(monthlyData.overallScore).color }]}>
                        {monthlyData.overallScore.toFixed(1)}
                      </Text>
                      <Text style={styles.scoreOutOf}>/ 10</Text>
                    </View>
                  </View>

                  <View style={styles.scoreInfo}>
                    <View style={[styles.performanceBadge, { backgroundColor: getScoreRating(monthlyData.overallScore).color + '15' }]}>
                      <View style={[styles.performanceDot, { backgroundColor: getScoreRating(monthlyData.overallScore).color }]} />
                      <Text style={[styles.performanceLabel, { color: getScoreRating(monthlyData.overallScore).color }]}>
                        {getScoreRating(monthlyData.overallScore).label}
                      </Text>
                    </View>
                    <Text style={styles.scoreDescription}>
                      Average across all wealth areas
                    </Text>
                    <View style={styles.overallTrendRow}>
                      {monthlyData.overallTrend !== 0 && (
                        <Ionicons
                          name={monthlyData.overallTrend > 0 ? 'trending-up' : 'trending-down'}
                          size={14}
                          color={monthlyData.overallTrend > 0 ? '#059669' : '#EF4444'}
                        />
                      )}
                      <Text style={[
                        styles.overallTrendText,
                        { color: monthlyData.overallTrend > 0 ? '#059669' : monthlyData.overallTrend < 0 ? '#EF4444' : '#9AA0A6' }
                      ]}>
                        {monthlyData.overallTrend === 0 ? 'No change' : `${Math.abs(monthlyData.overallTrend)}% vs last month`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Wealth Areas Section */}
              <View style={styles.wealthAreasSection}>
                <View style={styles.wealthAreasHeader}>
                  <Text style={styles.wealthAreasTitle}>Wealth Areas</Text>
                </View>

                <WealthAreaRow
                  icon="fitness"
                  label="Physical"
                  value={monthlyData.wealthAverages.physical.score}
                  color="#059669"
                  trend={monthlyData.wealthAverages.physical.trend}
                />
                <WealthAreaRow
                  icon="people"
                  label="Social"
                  value={monthlyData.wealthAverages.social.score}
                  color="#8B5CF6"
                  trend={monthlyData.wealthAverages.social.trend}
                />
                <WealthAreaRow
                  icon="bulb"
                  label="Mental"
                  value={monthlyData.wealthAverages.mental.score}
                  color="#3B82F6"
                  trend={monthlyData.wealthAverages.mental.trend}
                />
                <WealthAreaRow
                  icon="bar-chart"
                  label="Financial"
                  value={monthlyData.wealthAverages.financial.score}
                  color="#EAB308"
                  trend={monthlyData.wealthAverages.financial.trend}
                />
                <WealthAreaRow
                  icon="time"
                  label="Time"
                  value={monthlyData.wealthAverages.time.score}
                  color="#FB923C"
                  trend={monthlyData.wealthAverages.time.trend}
                  isLast
                />
              </View>
            </View>
          </View>

          {/* Monthly Reflection Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#FBCFE8', '#F472B6', '#DB2777']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#DB2777" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Monthly Reflection</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              <View style={styles.monthlyReflectionsContainer}>
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="bulb" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Key learning</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.keyLearning}</Text>
                </View>
                <View style={styles.monthlyReflectionDivider} />
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="eye-off" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Lost sight of</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.lostSightOf}</Text>
                </View>
                <View style={styles.monthlyReflectionDivider} />
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="trophy" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Proud moment</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.proudMoment}</Text>
                </View>
                <View style={styles.monthlyReflectionDivider} />
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="mail" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Message to self</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.messageToSelf}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
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
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.headerDatePicker}>
            <View style={styles.headerDatePill}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerDatePillSide,
                  pressed && styles.headerDatePillSidePressed,
                ]}
                onPress={handlePreviousMonth}
              >
                <Ionicons name="chevron-back" size={16} color="#6B7280" />
              </Pressable>
              <View style={styles.headerDatePillCenter}>
                <Ionicons name="calendar-outline" size={14} color="#DB2777" />
                <Text style={styles.headerDateText}>{monthName} {currentYear}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.headerDatePillSide,
                  isCurrentMonth && styles.headerDatePillSideDisabled,
                  pressed && !isCurrentMonth && styles.headerDatePillSidePressed,
                ]}
                onPress={handleNextMonth}
                disabled={isCurrentMonth}
              >
                <Ionicons name="chevron-forward" size={16} color={isCurrentMonth ? '#D1D5DB' : '#6B7280'} />
              </Pressable>
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>
    </View>
  );
};

// Wealth Area Row Component (matching Weekly Averages style)
interface WealthAreaRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  trend: number;
  isLast?: boolean;
}

const WealthAreaRow: React.FC<WealthAreaRowProps> = ({
  icon,
  label,
  value,
  color,
  trend,
  isLast,
}) => {
  const progress = Math.min(value / 10, 1);

  const getBgColor = (c: string) => {
    if (c === '#059669') return '#D1FAE5';
    if (c === '#8B5CF6') return '#EDE9FE';
    if (c === '#3B82F6') return '#DBEAFE';
    if (c === '#EAB308') return '#FEF9C3';
    if (c === '#FB923C') return '#FFEDD5';
    return '#E5E7EB';
  };

  const getTrendColor = () => {
    if (trend > 0) return '#059669';
    if (trend < 0) return '#EF4444';
    return '#9CA3AF';
  };

  const getTrendLabel = () => {
    if (trend === 0) return 'no change';
    const symbol = trend > 0 ? '↑' : '↓';
    return `${symbol} ${Math.abs(trend)}%`;
  };

  return (
    <View style={[styles.wealthAreaRow, isLast && styles.wealthAreaRowLast]}>
      <LinearGradient
        colors={['#FFFFFF', '#F5F5F5']}
        style={[styles.wealthAreaIconContainer, { borderColor: color }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={16} color={color} />
      </LinearGradient>
      <View style={styles.wealthAreaContent}>
        <View style={styles.wealthAreaHeader}>
          <Text style={styles.wealthAreaLabel}>{label}</Text>
          <Text style={[styles.wealthAreaValue, { color }]}>{value.toFixed(1)}</Text>
        </View>
        <View style={styles.wealthAreaProgressRow}>
          <View style={styles.wealthAreaProgressBg}>
            <View
              style={[
                styles.wealthAreaProgressFill,
                { backgroundColor: color, width: `${progress * 100}%` }
              ]}
            />
          </View>
          <Text style={[styles.wealthAreaTrend, { color: getTrendColor() }]}>
            {getTrendLabel()}
          </Text>
        </View>
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
    paddingHorizontal: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerDatePicker: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerDatePillSide: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  headerDatePillSidePressed: {
    backgroundColor: '#F3F4F6',
  },
  headerDatePillSideDisabled: {
    opacity: 0.4,
  },
  headerDatePillCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyDateSection: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  emptyCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  emptyCardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  emptyCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyCardButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Month Navigation
  monthNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconInner: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  sectionContent: {
    gap: 0,
  },

  // Score Section (matching Weekly)
  scoreSection: {
    paddingBottom: 16,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreRingWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreOutOf: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9AA0A6',
    marginTop: -2,
  },
  scoreInfo: {
    flex: 1,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  performanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreDescription: {
    fontSize: 13,
    color: '#9AA0A6',
    lineHeight: 18,
    marginBottom: 6,
  },
  overallTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overallTrendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Wealth Areas Section (matching Weekly Averages)
  wealthAreasSection: {
    paddingTop: 16,
    paddingBottom: 0,
    marginBottom: 0,
  },
  wealthAreasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wealthAreasTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  wealthAreasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  wealthAreasBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DB2777',
  },
  wealthAreaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED60',
  },
  wealthAreaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  wealthAreaIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  wealthAreaContent: {
    flex: 1,
    height: 34,
    justifyContent: 'space-between',
  },
  wealthAreaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wealthAreaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  wealthAreaValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  wealthAreaProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wealthAreaProgressBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#E8EAED',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  wealthAreaProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  wealthAreaTrend: {
    fontSize: 10,
    fontWeight: '500',
    minWidth: 45,
    textAlign: 'right',
  },

  // Info Block
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    letterSpacing: -0.1,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },

  // Monthly Hero
  monthlyHeroSection: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 24,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthlyDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  monthlyDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DB2777',
  },
  monthlyScoreCircle: {
    alignItems: 'center',
  },
  monthlyScoreNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: '#DB2777',
    letterSpacing: -1,
  },
  monthlyScoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -2,
  },

  // Monthly Ratings
  monthlyRatingsBlock: {
    gap: 18,
    paddingTop: 24,
    paddingBottom: 24,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthlyRatingBarItem: {
    gap: 6,
  },
  monthlyRatingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyRatingBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  monthlyRatingBarValue: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  monthlyRatingBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  monthlyRatingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Monthly Reflections
  monthlyReflectionsContainer: {
    borderTopWidth: 0,
    borderTopColor: '#E5E7EB',
    marginTop: -16,
    marginBottom: -16,
  },
  monthlyReflectionItem: {
    paddingVertical: 16,
  },
  monthlyReflectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  bottomSpacer: {
    height: 20,
  },
});

export default MonthlyReviewScreen;
