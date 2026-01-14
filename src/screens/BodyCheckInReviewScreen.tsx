import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Image,
  Modal,
  Dimensions,
  Platform,
  PanResponder,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BodyCheckInReviewScreenProps {
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

interface OtherBodyStat {
  label: string;
  value: string;
}

interface BodyCheckInData {
  completed: boolean;
  monthName: string;
  date: string;
  photoUri?: string;
  // Body metrics
  weight: { value: number; unit: string; change: number };
  otherStats?: OtherBodyStat[];
  // Monthly averages
  averages: {
    energy: { value: number; trend: number };
    sleep: { value: number; trend: number };
    satisfaction: { value: number; trend: number };
    nutrition: { value: number; trend: number };
  };
  // Reflections - Single Choice
  physicalActivity: {
    level: string;
    description: string;
    icon: string;
  };
  // Reflections - Slider Ratings
  overallHealth: number;
  skinQuality: number;
  satisfaction: number;
  // Mental Wellness - Slider Ratings
  mentalClarity: number;
  emotionalBalance: number;
  motivation: number;
  // Reflections - Text
  healthNotes: string;
  // Multi-select - What Helped
  whatHelped: Array<{
    label: string;
    icon: string;
  }>;
  // Single Choice - Mental Load
  mentalLoad: {
    level: string;
    description: string;
    icon: string;
  };
  // Single Choice - Energy Drains
  energyDrains: {
    level: string;
    description: string;
    icon: string;
  };
  focus: string;
}

// Mock data
const mockBodyCheckInData: { [key: string]: BodyCheckInData } = {
  '2025-11': {
    completed: true,
    monthName: 'November',
    date: 'November 30, 2025',
    photoUri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop',
    weight: { value: 75.2, unit: 'kg', change: -1.3 },
    otherStats: [
      { label: 'Body fat', value: '18%' },
      { label: 'Waist', value: '32in' },
      { label: 'Chest', value: '40in' },
    ],
    averages: {
      energy: { value: 7.8, trend: 5 },
      sleep: { value: 7.2, trend: -3 },
      satisfaction: { value: 8.5, trend: 12 },
      nutrition: { value: 7.0, trend: 2 },
    },
    // Single Choice
    physicalActivity: {
      level: 'Very Active',
      description: 'High activity most days',
      icon: 'fitness',
    },
    // Slider Ratings
    overallHealth: 8,
    skinQuality: 7,
    satisfaction: 8,
    // Mental Wellness Ratings
    mentalClarity: 8,
    emotionalBalance: 7,
    motivation: 8,
    // Text Reflections
    healthNotes: 'Overall feeling healthy and strong. Minor lower back tightness from sitting too much.',
    // Multi-select - What Helped
    whatHelped: [
      { label: 'Good Sleep', icon: 'moon' },
      { label: 'Movement', icon: 'walk' },
      { label: 'Nature', icon: 'leaf' },
    ],
    // Single Choice - Mental Load
    mentalLoad: {
      level: 'Busy but Manageable',
      description: 'Full schedule, but coping well',
      icon: 'layers',
    },
    // Single Choice - Energy Drains
    energyDrains: {
      level: 'Work / Study Pressure',
      description: 'Deadlines, demands, expectations',
      icon: 'briefcase',
    },
    focus: 'Want to improve sleep quality and be more consistent with nutrition on weekends.',
  },
};

const getBodyCheckInData = (year: number, month: number): BodyCheckInData | null => {
  return mockBodyCheckInData[`${year}-${month}`] || null;
};

const getMonthName = (year: number, month: number): string => {
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });
};

// Chart metric colors
const CHART_METRIC_COLORS = {
  sleep: { primary: '#8B5CF6', light: '#C4B5FD', name: 'Sleep' },
  energy: { primary: '#F59E0B', light: '#FDE68A', name: 'Energy' },
  nutrition: { primary: '#10B981', light: '#A7F3D0', name: 'Nutrition' },
};

type ChartMetricType = 'sleep' | 'energy' | 'nutrition';

interface ChartInsightsData {
  sleep: number[];
  energy: number[];
  nutrition: number[];
}

// Generate mock chart data with realistic correlations
const generateChartMockData = (): ChartInsightsData => {
  const data: ChartInsightsData = {
    sleep: [],
    energy: [],
    nutrition: [],
  };

  for (let i = 0; i < 30; i++) {
    const baseSleep = 6.5 + Math.sin(i * 0.3) * 1.5 + (Math.random() - 0.5) * 1.5;
    data.sleep.push(Math.max(4, Math.min(10, baseSleep)));

    const baseNutrition = 6 + Math.sin(i * 0.2 + 1) * 2 + (Math.random() - 0.5) * 2;
    data.nutrition.push(Math.round(Math.max(3, Math.min(10, baseNutrition))));

    const sleepFactor = i > 0 ? data.sleep[i - 1] : data.sleep[0];
    const nutritionFactor = data.nutrition[i];
    const baseEnergy = (sleepFactor * 0.5 + nutritionFactor * 0.3 + 2) + (Math.random() - 0.5) * 1.5;
    data.energy.push(Math.round(Math.max(3, Math.min(10, baseEnergy))));
  }

  return data;
};

// Combined Chart Component for 30-Day Patterns
interface CombinedChartProps {
  data: ChartInsightsData;
  activeMetrics: Set<ChartMetricType>;
  onToggleMetric: (metric: ChartMetricType) => void;
}

const CombinedChart: React.FC<CombinedChartProps> = ({ data, activeMetrics, onToggleMetric }) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 180;
  const padding = { top: 16, right: 12, bottom: 32, left: 32 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const scale = { min: 1, max: 10 };

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const dates = useMemo(() => {
    const today = new Date();
    const dateArray: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateArray.push(date);
    }
    return dateArray;
  }, []);

  const selectedDateStr = useMemo(() => {
    if (activeIndex === null) return null;
    const date = dates[activeIndex];
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [activeIndex, dates]);

  const getX = (index: number): number => {
    return padding.left + (index / 29) * plotWidth;
  };

  const getY = (value: number): number => {
    const normalizedValue = Math.max(scale.min, Math.min(scale.max, value));
    return padding.top + plotHeight - ((normalizedValue - scale.min) / (scale.max - scale.min)) * plotHeight;
  };

  const generatePath = (values: number[]): string => {
    if (values.length === 0) return '';

    const points = values.map((value, index) => ({
      x: getX(index),
      y: getY(value),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 8;
      const cp1y = p1.y + (p2.y - p0.y) / 8;
      const cp2x = p2.x - (p3.x - p1.x) / 8;
      const cp2y = p2.y - (p3.y - p1.y) / 8;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  const getIndexFromX = useCallback((locationX: number): number => {
    const relativeX = locationX - padding.left;
    const clampedX = Math.max(0, Math.min(relativeX, plotWidth));
    const index = Math.round((clampedX / plotWidth) * 29);
    return Math.max(0, Math.min(29, index));
  }, [plotWidth, padding.left]);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex(index);
        if (Platform.OS === 'ios') {
          Haptics.selectionAsync();
        }
      },

      onPanResponderMove: (evt) => {
        const index = getIndexFromX(evt.nativeEvent.locationX);
        setActiveIndex((prev) => {
          if (prev !== index && Platform.OS === 'ios') {
            Haptics.selectionAsync();
          }
          return index;
        });
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
    <View style={styles.patternsChartSection}>
      <View style={styles.patternsHeader}>
        <Text style={styles.patternsTitle}>30-Day Patterns</Text>
      </View>

      {/* Legend / Toggle */}
      <View style={styles.chartLegendRow}>
        {activeIndex === null ? (
          <>
            {(Object.keys(CHART_METRIC_COLORS) as ChartMetricType[]).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  styles.chartLegendItem,
                  !activeMetrics.has(metric) && styles.chartLegendItemInactive,
                ]}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.selectionAsync();
                  }
                  onToggleMetric(metric);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.chartLegendDot,
                    { backgroundColor: activeMetrics.has(metric) ? CHART_METRIC_COLORS[metric].primary : '#D1D5DB' },
                  ]}
                />
                <Text
                  style={[
                    styles.chartLegendText,
                    { color: activeMetrics.has(metric) ? '#374151' : '#9CA3AF' },
                  ]}
                >
                  {CHART_METRIC_COLORS[metric].name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.chartScrubbingContent}>
            <Text style={styles.chartScrubbingDate}>{selectedDateStr}</Text>
            <View style={styles.chartScrubbingValues}>
              {activeMetrics.has('sleep') && (
                <Text style={styles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.sleep.primary, fontWeight: '600' }}>
                    {data.sleep[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}> hrs</Text>
                </Text>
              )}
              {activeMetrics.has('energy') && (
                <Text style={styles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.energy.primary, fontWeight: '600' }}>
                    {data.energy[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
              {activeMetrics.has('nutrition') && (
                <Text style={styles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.nutrition.primary, fontWeight: '600' }}>
                    {data.nutrition[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Chart */}
      <View
        style={styles.chartContainer}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={chartHeight}>
          {/* Horizontal grid lines */}
          {[10, 5, 1].map((value) => {
            const normalized = (value - scale.min) / (scale.max - scale.min);
            const y = padding.top + plotHeight * (1 - normalized);
            return (
              <Line
                key={value}
                x1={padding.left}
                y1={y}
                x2={chartWidth - padding.right}
                y2={y}
                stroke="#D1D5DB"
                strokeWidth="1"
                strokeDasharray="2,6"
                opacity={0.5}
              />
            );
          })}

          {/* Y-axis labels */}
          {[10, 5, 1].map((value) => {
            const normalized = (value - scale.min) / (scale.max - scale.min);
            const y = padding.top + plotHeight * (1 - normalized) + 4;
            return (
              <SvgText key={value} x={padding.left - 8} y={y} fontSize="10" fill="#9CA3AF" textAnchor="end">
                {value}
              </SvgText>
            );
          })}

          {/* Metric lines */}
          {activeMetrics.has('sleep') && (
            <Path
              d={generatePath(data.sleep)}
              stroke={CHART_METRIC_COLORS.sleep.primary}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeMetrics.has('nutrition') && (
            <Path
              d={generatePath(data.nutrition)}
              stroke={CHART_METRIC_COLORS.nutrition.primary}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activeMetrics.has('energy') && (
            <Path
              d={generatePath(data.energy)}
              stroke={CHART_METRIC_COLORS.energy.primary}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Cursor line when scrubbing */}
          {activeIndex !== null && (
            <Line
              x1={getX(activeIndex)}
              y1={padding.top}
              x2={getX(activeIndex)}
              y2={padding.top + plotHeight}
              stroke="rgba(0, 0, 0, 0.12)"
              strokeWidth={1.5}
            />
          )}

          {/* Dots on active metrics when scrubbing */}
          {activeIndex !== null && activeMetrics.has('sleep') && (
            <Circle
              cx={getX(activeIndex)}
              cy={getY(data.sleep[activeIndex])}
              r={5}
              fill={CHART_METRIC_COLORS.sleep.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
          {activeIndex !== null && activeMetrics.has('nutrition') && (
            <Circle
              cx={getX(activeIndex)}
              cy={getY(data.nutrition[activeIndex])}
              r={5}
              fill={CHART_METRIC_COLORS.nutrition.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}
          {activeIndex !== null && activeMetrics.has('energy') && (
            <Circle
              cx={getX(activeIndex)}
              cy={getY(data.energy[activeIndex])}
              r={5}
              fill={CHART_METRIC_COLORS.energy.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}

          {/* X-axis labels */}
          <SvgText x={padding.left} y={chartHeight - 8} fontSize="10" fill="#C9CDD3" textAnchor="start" fontWeight="500">
            30d ago
          </SvgText>
          <SvgText x={chartWidth - padding.right} y={chartHeight - 8} fontSize="10" fill="#C9CDD3" textAnchor="end" fontWeight="500">
            Today
          </SvgText>
        </Svg>
      </View>

      <Text style={styles.chartHint}>Tap metrics to show/hide</Text>
    </View>
  );
};

// Metric Row Component (matching Weekly Averages design)
interface MetricRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  numericValue: number;
  maxValue: number;
  color: string;
  bgColor: string;
  trend: number;
  isLast?: boolean;
}

const MetricRow: React.FC<MetricRowProps> = ({
  icon,
  label,
  value,
  numericValue,
  maxValue,
  color,
  bgColor,
  trend,
  isLast,
}) => {
  const progress = Math.min(numericValue / maxValue, 1);

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
    <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
      <View style={[styles.metricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.metricContent}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={[styles.metricValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.metricProgressRow}>
          <View style={styles.metricProgressBg}>
            <View
              style={[
                styles.metricProgressFill,
                { backgroundColor: color, width: `${progress * 100}%` }
              ]}
            />
          </View>
          <Text style={[styles.metricTrend, { color: getTrendColor() }]}>
            {getTrendLabel()}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Slider Rating Bar Component (for Body Reflection slider ratings)
interface SliderRatingBarProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  isLast?: boolean;
}

const SliderRatingBar: React.FC<SliderRatingBarProps> = ({
  icon,
  label,
  value,
  color,
  isLast,
}) => {
  const percentage = (value / 10) * 100;

  return (
    <View style={[styles.sliderRatingRow, isLast && styles.sliderRatingRowLast]}>
      <View style={[styles.sliderRatingIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.sliderRatingContent}>
        <View style={styles.sliderRatingHeader}>
          <Text style={styles.sliderRatingLabel}>{label}</Text>
          <Text style={[styles.sliderRatingValue, { color }]}>{value}/10</Text>
        </View>
        <View style={styles.sliderRatingProgressBg}>
          <View
            style={[
              styles.sliderRatingProgressFill,
              { backgroundColor: color, width: `${percentage}%` }
            ]}
          />
        </View>
      </View>
    </View>
  );
};

// Single Choice Section Component (for Body Reflection single choice answers)
interface SingleChoiceSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  selectedLabel: string;
  selectedDescription: string;
  color: string;
}

const SingleChoiceSection: React.FC<SingleChoiceSectionProps> = ({
  title,
  icon,
  selectedLabel,
  selectedDescription,
  color,
}) => {
  return (
    <View style={styles.singleChoiceSection}>
      <Text style={styles.singleChoiceSectionTitle}>{title}</Text>
      <View style={styles.singleChoiceSelectedCard}>
        <View style={[styles.singleChoiceSelectedIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.singleChoiceSelectedContent}>
          <Text style={styles.singleChoiceSelectedLabel}>{selectedLabel}</Text>
          <Text style={styles.singleChoiceSelectedDescription}>{selectedDescription}</Text>
        </View>
      </View>
    </View>
  );
};

const BodyCheckInReviewScreen = ({ navigation, route }: BodyCheckInReviewScreenProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const initialMonth = route?.params?.month || 11;
  const initialYear = route?.params?.year || 2025;

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);

  const monthName = getMonthName(currentYear, currentMonth);
  const bodyData = getBodyCheckInData(currentYear, currentMonth);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Photo viewer state
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  // Chart state
  const [activeChartMetrics, setActiveChartMetrics] = useState<Set<ChartMetricType>>(new Set(['sleep', 'energy', 'nutrition']));
  const chartData = useMemo(() => generateChartMockData(), []);

  const handleToggleChartMetric = useCallback((metric: ChartMetricType) => {
    setActiveChartMetrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(metric)) {
        if (newSet.size > 1) {
          newSet.delete(metric);
        }
      } else {
        newSet.add(metric);
      }
      return newSet;
    });
  }, []);

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

  const now = new Date();
  const isCurrentMonth = currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();

  const openPhotoViewer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoViewerVisible(true);
  };

  const closePhotoViewer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoViewerVisible(false);
  };

  // Empty state
  if (!bodyData) {
    return (
      <View style={styles.container}>
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 72 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#BAE6FD', '#38BDF8', '#0EA5E9']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="body" size={22} color="#0EA5E9" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Body Check-In</Text>
              </View>
            </View>
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyStateTitle}>No check-in recorded</Text>
              <Text style={styles.emptyStateSubtitle}>
                Complete a body check-in this month to see your progress here.
              </Text>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Fixed Header */}
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
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
            </TouchableOpacity>
            <View style={styles.headerDatePicker}>
              <View style={styles.headerDatePill}>
                <Pressable
                  style={({ pressed }) => [styles.headerDatePillSide, pressed && styles.headerDatePillSidePressed]}
                  onPress={handlePreviousMonth}
                >
                  <Ionicons name="chevron-back" size={16} color="#6B7280" />
                </Pressable>
                <View style={styles.headerDatePillCenter}>
                  <Ionicons name="calendar-outline" size={14} color="#0EA5E9" />
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
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Body Summary Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#BAE6FD', '#38BDF8', '#0EA5E9']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="body" size={22} color="#0EA5E9" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Body Summary</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* 30-Day Patterns Chart */}
              <CombinedChart
                data={chartData}
                activeMetrics={activeChartMetrics}
                onToggleMetric={handleToggleChartMetric}
              />

              {/* Monthly Averages Section */}
              <View style={styles.averagesSection}>
                <View style={styles.averagesHeader}>
                  <Text style={styles.averagesTitle}>Monthly Averages</Text>
                </View>

                <MetricRow
                  icon="flash"
                  label="Energy"
                  value={bodyData.averages.energy.value.toFixed(1)}
                  numericValue={bodyData.averages.energy.value}
                  maxValue={10}
                  color="#F59E0B"
                  bgColor="#FEF3C7"
                  trend={bodyData.averages.energy.trend}
                />
                <MetricRow
                  icon="moon"
                  label="Sleep"
                  value={`${bodyData.averages.sleep.value.toFixed(1)}h`}
                  numericValue={bodyData.averages.sleep.value}
                  maxValue={9}
                  color="#8B5CF6"
                  bgColor="#F3E8FF"
                  trend={bodyData.averages.sleep.trend}
                />
                <MetricRow
                  icon="sparkles"
                  label="Satisfaction"
                  value={bodyData.averages.satisfaction.value.toFixed(1)}
                  numericValue={bodyData.averages.satisfaction.value}
                  maxValue={10}
                  color="#3B82F6"
                  bgColor="#DBEAFE"
                  trend={bodyData.averages.satisfaction.trend}
                />
                <MetricRow
                  icon="leaf"
                  label="Nutrition"
                  value={bodyData.averages.nutrition.value.toFixed(1)}
                  numericValue={bodyData.averages.nutrition.value}
                  maxValue={10}
                  color="#059669"
                  bgColor="#ECFDF5"
                  trend={bodyData.averages.nutrition.trend}
                  isLast
                />
              </View>
            </View>
          </View>

          {/* Body Reflection Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#BAE6FD', '#38BDF8', '#0EA5E9']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="body" size={22} color="#0EA5E9" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Body Reflection</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Photo + Metrics Row */}
              <View style={styles.summaryTopSection}>
                {/* Photo Preview */}
                {bodyData.photoUri && (
                  <TouchableOpacity
                    style={styles.photoPreview}
                    onPress={openPhotoViewer}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: bodyData.photoUri }} style={styles.photoPreviewImage} />
                    <View style={styles.photoExpandIcon}>
                      <Ionicons name="expand" size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Weight */}
                <View style={styles.bodyMetricCard}>
                  <Text style={styles.bodyMetricLabel}>Weight</Text>
                  <View style={styles.bodyMetricValueRow}>
                    <Text style={styles.bodyMetricValue}>{bodyData.weight.value}</Text>
                    <Text style={styles.bodyMetricUnit}>{bodyData.weight.unit}</Text>
                  </View>
                  <View style={[
                    styles.bodyMetricChange,
                    { backgroundColor: bodyData.weight.change < 0 ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Ionicons
                      name={bodyData.weight.change < 0 ? 'arrow-down' : 'arrow-up'}
                      size={10}
                      color={bodyData.weight.change < 0 ? '#059669' : '#EF4444'}
                    />
                    <Text style={[
                      styles.bodyMetricChangeText,
                      { color: bodyData.weight.change < 0 ? '#059669' : '#EF4444' }
                    ]}>
                      {Math.abs(bodyData.weight.change)} {bodyData.weight.unit}
                    </Text>
                  </View>
                </View>

                {/* Other Stats */}
                {bodyData.otherStats && bodyData.otherStats.length > 0 && (
                  <View style={styles.bodyMetricCardOtherStats}>
                    <Text style={styles.bodyMetricLabelOtherStats}>Other Stats</Text>
                    <ScrollView
                      style={styles.bodyStatsTextField}
                      contentContainerStyle={styles.bodyStatsTextFieldContent}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      scrollEnabled={true}
                    >
                      <Text style={styles.bodyStatsTextFieldText}>
                        {bodyData.otherStats.map(stat => `${stat.label}: ${stat.value}`).join(', ')}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Slider Ratings Section */}
              <View style={styles.sliderRatingsSection}>
                <Text style={styles.sliderRatingsSectionTitle}>Health Ratings</Text>
                <SliderRatingBar
                  icon="medkit"
                  label="Overall Health"
                  value={bodyData.overallHealth}
                  color="#0EA5E9"
                />
                <SliderRatingBar
                  icon="sparkles"
                  label="Skin Quality"
                  value={bodyData.skinQuality}
                  color="#8B5CF6"
                  isLast
                />
              </View>

              {/* Single Choice - Physical Activity */}
              <SingleChoiceSection
                title="Physical Activity"
                icon={bodyData.physicalActivity.icon as keyof typeof Ionicons.glyphMap}
                selectedLabel={bodyData.physicalActivity.level}
                selectedDescription={bodyData.physicalActivity.description}
                color="#0EA5E9"
              />

              {/* Health Notes Section */}
              {bodyData.healthNotes && (
                <View style={styles.healthNotesSection}>
                  <View style={styles.healthNotesTitleRow}>
                    <Ionicons name="document-text" size={16} color="#0EA5E9" />
                    <Text style={styles.healthNotesTitle}>Health Notes</Text>
                  </View>
                  <Text style={styles.healthNotesText}>{bodyData.healthNotes}</Text>
                </View>
              )}

              {/* One Small Promise Section */}
              {bodyData.focus && (
                <View style={styles.healthNotesSection}>
                  <View style={styles.healthNotesTitleRow}>
                    <Ionicons name="heart" size={16} color="#0EA5E9" />
                    <Text style={styles.healthNotesTitle}>One small promise</Text>
                  </View>
                  <Text style={styles.healthNotesText}>{bodyData.focus}</Text>
                </View>
              )}

              {/* Mental Wellness Ratings Section */}
              <View style={styles.sliderRatingsSection}>
                <Text style={styles.sliderRatingsSectionTitle}>Mental Wellness</Text>
                <SliderRatingBar
                  icon="bulb"
                  label="Mental Clarity"
                  value={bodyData.mentalClarity}
                  color="#0EA5E9"
                />
                <SliderRatingBar
                  icon="swap-horizontal"
                  label="Emotional Balance"
                  value={bodyData.emotionalBalance}
                  color="#8B5CF6"
                />
                <SliderRatingBar
                  icon="flash"
                  label="Motivation"
                  value={bodyData.motivation}
                  color="#F59E0B"
                  isLast
                />
              </View>

              {/* Single Choice - Mental Load */}
              <SingleChoiceSection
                title="Mental Load"
                icon={bodyData.mentalLoad.icon as keyof typeof Ionicons.glyphMap}
                selectedLabel={bodyData.mentalLoad.level}
                selectedDescription={bodyData.mentalLoad.description}
                color="#0EA5E9"
              />

              {/* Single Choice - Energy Drains */}
              <SingleChoiceSection
                title="Energy Drains"
                icon={bodyData.energyDrains.icon as keyof typeof Ionicons.glyphMap}
                selectedLabel={bodyData.energyDrains.level}
                selectedDescription={bodyData.energyDrains.description}
                color="#0EA5E9"
              />

              {/* What Helped - Multi-select Cards */}
              {bodyData.whatHelped && bodyData.whatHelped.length > 0 && (
                <View style={styles.whatHelpedSection}>
                  <Text style={styles.whatHelpedTitle}>What Helped</Text>
                  <View style={styles.whatHelpedCardsContainer}>
                    {bodyData.whatHelped.map((helper, index) => (
                      <View key={index} style={styles.whatHelpedCard}>
                        <View style={styles.whatHelpedCardIcon}>
                          <Ionicons
                            name={helper.icon as keyof typeof Ionicons.glyphMap}
                            size={18}
                            color="#0EA5E9"
                          />
                        </View>
                        <Text style={styles.whatHelpedCardLabel}>{helper.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Fixed Header */}
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.headerDatePicker}>
            <View style={styles.headerDatePill}>
              <Pressable
                style={({ pressed }) => [styles.headerDatePillSide, pressed && styles.headerDatePillSidePressed]}
                onPress={handlePreviousMonth}
              >
                <Ionicons name="chevron-back" size={16} color="#6B7280" />
              </Pressable>
              <View style={styles.headerDatePillCenter}>
                <Ionicons name="calendar-outline" size={14} color="#0EA5E9" />
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

      {/* Photo Viewer Modal */}
      <Modal
        visible={photoViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={closePhotoViewer}
      >
        <View style={styles.photoViewerOverlay}>
          <View style={[styles.photoViewerHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.photoViewerButton} onPress={closePhotoViewer}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.photoViewerTitle}>Progress Photo</Text>
            <View style={styles.photoViewerButtonPlaceholder} />
          </View>
          <View style={styles.photoViewerContent}>
            {bodyData.photoUri && (
              <Image
                source={{ uri: bodyData.photoUri }}
                style={styles.photoViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
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

  // Fixed Header
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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

  // Summary Top Section
  summaryTopSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  photoPreview: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  photoExpandIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyMetrics: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    height: 130,
  },
  bodyMetricsFull: {
    justifyContent: 'flex-start',
  },
  bodyMetricCard: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyMetricCardOtherStats: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  bodyMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  bodyMetricLabelOtherStats: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  bodyMetricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  bodyMetricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  bodyMetricUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  bodyMetricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    marginTop: 6,
  },
  bodyMetricChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Body Stats Text Field (inside card)
  bodyStatsTextField: {
    width: '100%',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  bodyStatsTextFieldContent: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexGrow: 1,
  },
  bodyStatsTextFieldText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },

  // Averages Section
  averagesSection: {
    paddingTop: 0,
  },
  averagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  averagesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  averagesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  averagesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0EA5E9',
  },

  // 30-Day Patterns Chart
  patternsChartSection: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patternsHeader: {
    marginBottom: 12,
  },
  patternsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    minHeight: 36,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  chartLegendItemInactive: {
    opacity: 0.6,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartLegendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  chartScrubbingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartScrubbingDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  chartScrubbingValues: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  chartScrubbingValueText: {
    fontSize: 13,
  },

  // Metric Row
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB60',
  },
  metricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  metricProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricProgressBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  metricTrend: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },

  // Slider Rating Bar (for slider-based reflection ratings)
  sliderRatingsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sliderRatingsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  sliderRatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB60',
  },
  sliderRatingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  sliderRatingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sliderRatingContent: {
    flex: 1,
    gap: 6,
  },
  sliderRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderRatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sliderRatingValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sliderRatingProgressBg: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  sliderRatingProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // Single Choice Section (for single-choice reflection answers)
  singleChoiceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  singleChoiceSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  singleChoiceSelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  singleChoiceSelectedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  singleChoiceSelectedContent: {
    flex: 1,
  },
  singleChoiceSelectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  singleChoiceSelectedDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 16,
  },

  // Health Notes Section
  healthNotesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  healthNotesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  healthNotesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  healthNotesText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },

  // What Helped Section
  whatHelpedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  whatHelpedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  whatHelpedCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  whatHelpedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
  },
  whatHelpedCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatHelpedCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Reflections
  reflectionsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: -16,
  },
  reflectionItem: {
    paddingVertical: 16,
  },
  reflectionItemLast: {
    paddingBottom: 0,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  reflectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  reflectionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },
  reflectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  satisfactionPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  satisfactionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },

  // Empty State
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  // Photo Viewer
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  photoViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  photoViewerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  photoViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  photoViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.7,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default BodyCheckInReviewScreen;
