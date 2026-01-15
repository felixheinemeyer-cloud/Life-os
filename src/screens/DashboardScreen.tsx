import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import TodaysPriorityCard from '../components/dashboard/TodaysPriorityCard';
import { useStreak } from '../context/StreakContext';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Chart metric colors matching Body Overview
const CHART_METRIC_COLORS = {
  nutrition: { primary: '#10B981', light: '#A7F3D0', name: 'Nutrition' },
  energy: { primary: '#F59E0B', light: '#FDE68A', name: 'Energy' },
  satisfaction: { primary: '#3B82F6', light: '#93C5FD', name: 'Satisfaction' },
};

type ChartMetricType = 'nutrition' | 'energy' | 'satisfaction';

interface ChartData {
  nutrition: number[];
  energy: number[];
  satisfaction: number[];
}

// Weekly Chart Component (matching Body Overview style)
interface WeeklyChartProps {
  data: ChartData;
  activeMetrics: Set<ChartMetricType>;
  onToggleMetric: (metric: ChartMetricType) => void;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, activeMetrics, onToggleMetric }) => {
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 180;
  const padding = { top: 16, right: 12, bottom: 32, left: 32 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const scale = { min: 1, max: 10 };
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const getX = (index: number): number => {
    return padding.left + (index / 6) * plotWidth;
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
    const index = Math.round((clampedX / plotWidth) * 6);
    return Math.max(0, Math.min(6, index));
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
    <View>
      {/* Legend / Toggle */}
      <View style={weeklyChartStyles.chartLegendRow}>
        {activeIndex === null ? (
          <>
            {(Object.keys(CHART_METRIC_COLORS) as ChartMetricType[]).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[
                  weeklyChartStyles.chartLegendItem,
                  !activeMetrics.has(metric) && weeklyChartStyles.chartLegendItemInactive,
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
                    weeklyChartStyles.chartLegendDot,
                    { backgroundColor: activeMetrics.has(metric) ? CHART_METRIC_COLORS[metric].primary : '#D1D5DB' },
                  ]}
                />
                <Text
                  style={[
                    weeklyChartStyles.chartLegendText,
                    { color: activeMetrics.has(metric) ? '#374151' : '#9CA3AF' },
                  ]}
                >
                  {CHART_METRIC_COLORS[metric].name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={weeklyChartStyles.chartScrubbingContent}>
            <Text style={weeklyChartStyles.chartScrubbingDate}>{dayLabels[activeIndex]}</Text>
            <View style={weeklyChartStyles.chartScrubbingValues}>
              {activeMetrics.has('nutrition') && (
                <Text style={weeklyChartStyles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.nutrition.primary, fontWeight: '600' }}>
                    {data.nutrition[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
              {activeMetrics.has('energy') && (
                <Text style={weeklyChartStyles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.energy.primary, fontWeight: '600' }}>
                    {data.energy[activeIndex].toFixed(1)}
                  </Text>
                  <Text style={{ color: '#9CA3AF' }}>/10</Text>
                </Text>
              )}
              {activeMetrics.has('satisfaction') && (
                <Text style={weeklyChartStyles.chartScrubbingValueText}>
                  <Text style={{ color: CHART_METRIC_COLORS.satisfaction.primary, fontWeight: '600' }}>
                    {data.satisfaction[activeIndex].toFixed(1)}
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
        style={weeklyChartStyles.chartContainer}
        {...panResponder.panHandlers}
      >
        <Svg width={chartWidth} height={chartHeight}>
          {/* Horizontal grid lines */}
          {[10, 7, 4, 1].map((value) => {
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
          {[10, 7, 4, 1].map((value) => {
            const normalized = (value - scale.min) / (scale.max - scale.min);
            const y = padding.top + plotHeight * (1 - normalized) + 4;
            return (
              <SvgText key={value} x={padding.left - 8} y={y} fontSize="10" fill="#9CA3AF" textAnchor="end">
                {value}
              </SvgText>
            );
          })}

          {/* Metric lines */}
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
          {activeMetrics.has('satisfaction') && (
            <Path
              d={generatePath(data.satisfaction)}
              stroke={CHART_METRIC_COLORS.satisfaction.primary}
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
          {activeIndex !== null && activeMetrics.has('satisfaction') && (
            <Circle
              cx={getX(activeIndex)}
              cy={getY(data.satisfaction[activeIndex])}
              r={5}
              fill={CHART_METRIC_COLORS.satisfaction.primary}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          )}

          {/* X-axis day labels */}
          {dayLabels.map((day, index) => (
            <SvgText
              key={day}
              x={getX(index)}
              y={chartHeight - 8}
              fontSize="10"
              fill="#C9CDD3"
              textAnchor="middle"
              fontWeight="500"
            >
              {day}
            </SvgText>
          ))}
        </Svg>
      </View>

      <Text style={weeklyChartStyles.chartHint}>Tap metrics to show/hide</Text>
    </View>
  );
};

// Styles for WeeklyChart component
const weeklyChartStyles = StyleSheet.create({
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    minHeight: 36,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  chartLegendItemInactive: {
    opacity: 0.6,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chartScrubbingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartScrubbingDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chartScrubbingValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartScrubbingValueText: {
    fontSize: 13,
  },
  chartContainer: {
    alignItems: 'center',
    marginLeft: -10, // Offset to visually center the plot area (left padding 32 > right padding 12)
  },
  chartHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

type PriorityStatus = 'pending' | 'completed' | 'not_completed';

interface DashboardScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
  };
  route?: {
    params?: {
      morningCheckInJustCompleted?: boolean;
      eveningCheckInJustCompleted?: boolean;
      priorityCompleted?: boolean;
      morningPriority?: string;
    };
  };
}

const DashboardScreen = ({ navigation, route }: DashboardScreenProps = {}): React.JSX.Element => {
  // SafeArea insets for dynamic button positioning
  const insets = useSafeAreaInsets();

  // Get streak data from context
  const { streakData } = useStreak();

  // State for interactive chart - all metrics active by default
  const [activeChartMetrics, setActiveChartMetrics] = useState<Set<ChartMetricType>>(new Set(['nutrition', 'energy', 'satisfaction']));

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

  // State for expandable focus cards
  const [isWeekExpanded, setIsWeekExpanded] = useState(false);
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);
  const [weekNeedsExpansion, setWeekNeedsExpansion] = useState<boolean | null>(null);
  const [monthNeedsExpansion, setMonthNeedsExpansion] = useState<boolean | null>(null);

  // Animation values for card glow
  const weekGlowAnim = useRef(new Animated.Value(0)).current;
  const monthGlowAnim = useRef(new Animated.Value(0)).current;

  // Animation values for chevron rotation
  const weekChevronAnim = useRef(new Animated.Value(0)).current;
  const monthChevronAnim = useRef(new Animated.Value(0)).current;

  // Scroll tracking for blur/fade effect
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation values for check-in completion
  const morningAnimPlayed = useRef(false);
  const eveningAnimPlayed = useRef(false);
  const morningScale = useRef(new Animated.Value(1)).current;
  const eveningScale = useRef(new Animated.Value(1)).current;

  // Streak count from context (preview mode shows 14 for testing)
  const PREVIEW_STREAK_MODE = true;
  const streakCount = PREVIEW_STREAK_MODE ? 14 : streakData.currentStreak;

  // Check-in completion states
  // Start as false, will be set to true when returning from MorningTrackingCompleteScreen
  // Resets on app reload (no persistence)
  const [morningCheckInCompleted, setMorningCheckInCompleted] = useState(false);
  const [eveningCheckInCompleted, setEveningCheckInCompleted] = useState(false);

  // Today's priority state (from morning check-in)
  const [todaysPriority, setTodaysPriority] = useState<string | null>(null);
  const [priorityStatus, setPriorityStatus] = useState<PriorityStatus>('pending');

  // 24h timer state (hours since last 12:00 noon Europe/Berlin)
  const [timerHours, setTimerHours] = useState(0);

  // Mock messages data (Frontend only - no backend integration)
  const mockMessages = [
    {
      id: 1,
      subject: 'Weekly Progress Summary',
      body: 'Great work this week! You completed 5 out of 7 daily check-ins and maintained a consistent sleep schedule.',
      sender: 'Life OS',
      date: '2 hours ago',
      isRead: false,
      type: 'summary',
    },
    {
      id: 2,
      subject: 'Reflection Reminder',
      body: "Don't forget to complete your weekly reflection. It's a great way to track your progress!",
      sender: 'Life OS',
      date: '5 hours ago',
      isRead: false,
      type: 'reminder',
    },
    {
      id: 3,
      subject: 'New Insight Available',
      body: 'Based on your tracking patterns, we noticed you perform best when you exercise in the morning.',
      sender: 'Life OS',
      date: 'Yesterday',
      isRead: true,
      type: 'insight',
    },
    {
      id: 4,
      subject: 'Streak Milestone',
      body: 'Congratulations on maintaining your daily tracking streak for 7 days!',
      sender: 'Life OS',
      date: '2 days ago',
      isRead: true,
      type: 'achievement',
    },
  ];

  const unreadCount = mockMessages.filter(m => !m.isRead).length;
  const newestMessage = mockMessages[0];

  // Mock insight data (Frontend only)
  const todaysInsight = {
    title: 'Small steps every day lead to remarkable transformations',
    preview: 'Building sustainable habits starts with consistency, not perfection. When you commit to showing up daily, even in small ways, you create momentum that compounds over time.',
    fullContent: 'Building sustainable habits starts with consistency, not perfection. When you commit to showing up daily, even in small ways, you create momentum that compounds over time.\n\nResearch shows that it takes an average of 66 days to form a new habit. But the real magic happens when you stop focusing on the end goal and start celebrating the process itself.\n\nEvery time you complete your morning routine, track your meals, or take a moment to reflect, you\'re not just checking off a box—you\'re reinforcing your identity as someone who values growth and self-improvement.\n\nRemember: transformation isn\'t about dramatic overnight changes. It\'s about the small, consistent actions that, when stacked together, create the life you want to live.',
    readTime: '3 min read',
    category: 'Mindset',
  };

  // Dynamic greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Check if evening check-in is available (after 5 PM / 17:00)
  const EVENING_CHECKIN_START_HOUR = 17; // 5 PM
  const TESTING_MODE = true; // TODO: Remove after testing
  const isEveningCheckInAvailable = (): boolean => {
    if (TESTING_MODE) return true; // Bypass time check for testing
    const hour = new Date().getHours();
    return hour >= EVENING_CHECKIN_START_HOUR;
  };

  const getHoursUntilEveningCheckIn = (): number => {
    const hour = new Date().getHours();
    if (hour >= EVENING_CHECKIN_START_HOUR) return 0;
    return EVENING_CHECKIN_START_HOUR - hour;
  };

  // Format current date
  const getCurrentDate = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Calculate hours since last 12:00 noon in Europe/Berlin timezone
  const calculateTimerHours = (): number => {
    try {
      const now = new Date();

      // Get all time parts in Berlin timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Berlin',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const parts = formatter.formatToParts(now);
      const berlinTime = {
        year: parseInt(parts.find(p => p.type === 'year')?.value || '0', 10),
        month: parseInt(parts.find(p => p.type === 'month')?.value || '1', 10),
        day: parseInt(parts.find(p => p.type === 'day')?.value || '1', 10),
        hour: parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10),
        minute: parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10),
        second: parseInt(parts.find(p => p.type === 'second')?.value || '0', 10),
      };

      // Calculate current time in Berlin as total minutes since midnight
      const currentMinutes = berlinTime.hour * 60 + berlinTime.minute;
      const midnightMinutes = 24 * 60; // 24:00 (next day's 00:00) = 1440 minutes

      // Calculate hours UNTIL next midnight (12am)
      const minutesUntilMidnight = midnightMinutes - currentMinutes;
      const hoursUntilMidnight = Math.floor(minutesUntilMidnight / 60);

      return hoursUntilMidnight >= 0 && hoursUntilMidnight <= 24 ? hoursUntilMidnight : 0;
    } catch (error) {
      console.error('Error calculating timer hours:', error);
      return 0;
    }
  };

  // Initialize and update timer every minute
  useEffect(() => {
    // Initial calculation
    setTimerHours(calculateTimerHours());

    // Update every minute (60000ms)
    const interval = setInterval(() => {
      setTimerHours(calculateTimerHours());
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Check for check-in completion from navigation params
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.morningCheckInJustCompleted) {
        setMorningCheckInCompleted(true);
        setTodaysPriority("Finish the project proposal and send it to the team"); // Mock priority
      }
      if (route?.params?.eveningCheckInJustCompleted) {
        setEveningCheckInCompleted(true);
        // Restore morning check-in state (since evening check-in implies morning was completed)
        setMorningCheckInCompleted(true);
        if (route?.params?.morningPriority) {
          setTodaysPriority(route.params.morningPriority);
        }
        // Update priority status based on evening check-in result
        if (route?.params?.priorityCompleted !== undefined) {
          setPriorityStatus(route.params.priorityCompleted ? 'completed' : 'not_completed');
        }
      }
    }, [route?.params?.morningCheckInJustCompleted, route?.params?.eveningCheckInJustCompleted, route?.params?.priorityCompleted, route?.params?.morningPriority])
  );

  // Animation trigger for Morning Check-in completion
  useEffect(() => {
    if (morningCheckInCompleted && !morningAnimPlayed.current) {
      morningAnimPlayed.current = true;

      // Start at smaller scale for more dramatic entrance
      morningScale.setValue(0.7);

      // Delay to ensure screen transition is fully complete
      const timer = setTimeout(() => {
        Animated.spring(morningScale, {
          toValue: 1,
          friction: 4, // Lower friction = more visible bounce
          tension: 35, // Low tension = slow, elegant animation
          useNativeDriver: true,
        }).start();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [morningCheckInCompleted]);

  // Animation trigger for Evening Check-in completion
  useEffect(() => {
    if (eveningCheckInCompleted && !eveningAnimPlayed.current) {
      eveningAnimPlayed.current = true;

      eveningScale.setValue(0.7);

      const timer = setTimeout(() => {
        Animated.spring(eveningScale, {
          toValue: 1,
          friction: 4, // Lower friction = more visible bounce
          tension: 35,
          useNativeDriver: true,
        }).start();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [eveningCheckInCompleted]);

  const handleMorningTracking = (): void => {
    if (navigation) {
      navigation.navigate('MorningTracking');
    } else {
      console.log('Navigate to Morning Tracking');
    }
  };

  const handleEveningTracking = (): void => {
    if (navigation) {
      navigation.navigate('EveningTracking');
    } else {
      console.log('Navigate to Evening Tracking');
    }
  };

  const handleWeeklyTracking = (): void => {
    if (navigation) {
      navigation.navigate('WeeklyTracking');
    } else {
      console.log('Navigate to Weekly Tracking');
    }
  };

  const handleMonthlyTracking = (): void => {
    if (navigation) {
      navigation.navigate('MonthlyTracking');
    } else {
      console.log('Navigate to Monthly Tracking');
    }
  };

  const handleMonthlyBodyTracking = (): void => {
    if (navigation) {
      navigation.navigate('MonthlyBodyTracking');
    } else {
      console.log('Navigate to Monthly Body Tracking');
    }
  };

  const handleProfile = (): void => {
    if (navigation) {
      navigation.navigate('ProfileSettings');
    } else {
      console.log('Navigate to Profile Settings');
    }
  };

  const handleStreak = (): void => {
    if (navigation) {
      navigation.navigate('StreakDetails');
    } else {
      console.log('Navigate to Streak Details');
    }
  };

  const handleOpenInbox = (): void => {
    if (navigation) {
      navigation.navigate('Inbox');
    } else {
      console.log('Navigate to Inbox');
    }
  };

  const handleOpenInsightDetail = (): void => {
    if (navigation) {
      navigation.navigate('InsightDetail');
    } else {
      console.log('Navigate to Insight Detail');
    }
  };

  // Toggle Week card with glow and chevron animation
  const toggleWeek = (): void => {
    if (weekNeedsExpansion !== true) return;

    const toValue = isWeekExpanded ? 0 : 1;

    Animated.parallel([
      Animated.timing(weekGlowAnim, {
        toValue,
        duration: isWeekExpanded ? 250 : 300,
        easing: isWeekExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
        delay: isWeekExpanded ? 0 : 50,
        useNativeDriver: false,
      }),
      Animated.timing(weekChevronAnim, {
        toValue,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    setIsWeekExpanded(!isWeekExpanded);
  };

  // Toggle Month card with glow and chevron animation
  const toggleMonth = (): void => {
    if (monthNeedsExpansion !== true) return;

    const toValue = isMonthExpanded ? 0 : 1;

    Animated.parallel([
      Animated.timing(monthGlowAnim, {
        toValue,
        duration: isMonthExpanded ? 250 : 300,
        easing: isMonthExpanded ? Easing.in(Easing.ease) : Easing.out(Easing.ease),
        delay: isMonthExpanded ? 0 : 50,
        useNativeDriver: false,
      }),
      Animated.timing(monthChevronAnim, {
        toValue,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    setIsMonthExpanded(!isMonthExpanded);
  };

  // Interpolated rotation for chevrons
  const weekChevronRotation = weekChevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const monthChevronRotation = monthChevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Interpolated shadow values for Week card (Variation A: Soft & Subtle)
  const weekShadowOpacity = weekGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.10],
  });

  const weekShadowRadius = weekGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 12],
  });

  const weekShadowOffsetY = weekGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });

  // Interpolated shadow values for Month card (Variation A: Soft & Subtle)
  const monthShadowOpacity = monthGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.02, 0.10],
  });

  const monthShadowRadius = monthGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 12],
  });

  const monthShadowOffsetY = monthGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 4],
  });

  // Fixed button shadow interpolation
  const buttonShadowOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0.05, 0.12],
    extrapolate: 'clamp',
  });

  // Greeting fade out on scroll
  const greetingOpacity = scrollY.interpolate({
    inputRange: [0, 25],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Mock data for 7-day statistics (ready for API integration)
  const weekStatistics = {
    nutrition: [6, 7, 8, 7, 6, 8, 9],
    energy: [7, 6, 7, 8, 7, 8, 9],
    satisfaction: [5, 6, 4, 5, 6, 7, 5],
  };

  // Focus content texts
  const FOCUS_CONTENT = {
    week: "Complete all daily routines, maintain consistent sleep schedule, and hit gym targets 4x. Focus on deep work sessions and minimize evening screen time for better recovery.",
    month: "Establish sustainable habits, review and adjust quarterly goals, and build momentum in key focus areas. Prioritize long-term health metrics and professional development.",
  };

  return (
    <View style={styles.container}>
      {/* LAYER 1: Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 }, // Safe area + header height + 24px gap
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Main Actions Section */}
        <View style={styles.actionsSection}>
          {/* Tracking Cards Row */}
          <View style={styles.trackingRow}>
            {/* Morning Tracking Card */}
            <TouchableOpacity
              style={styles.trackingCardTouchable}
              onPress={handleMorningTracking}
              activeOpacity={0.85}
            >
              <View style={styles.trackingCard}>
                {morningCheckInCompleted ? (
                  // Completed state - green ring with sun icon (success transformation)
                  <Animated.View style={[
                    styles.trackingIconCompletedRingWrapper,
                    { transform: [{ scale: morningScale }] }
                  ]}>
                    <LinearGradient
                      colors={['#34D399', '#10B981', '#059669']}
                      style={styles.trackingIconGradientRing}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.trackingIconInnerCircle}>
                        <Ionicons name="sunny" size={44} color="#059669" />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                ) : (
                  // Available state - orange gradient ring with sun
                  <LinearGradient
                    colors={['#FBBF24', '#F59E0B', '#D97706']}
                    style={styles.trackingIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.trackingIconInnerCircle}>
                      <Ionicons name="sunny" size={44} color="#D97706" />
                    </View>
                  </LinearGradient>
                )}
                <Text style={styles.lightCardTitle}>Morning{'\n'}Check-In</Text>
              </View>
            </TouchableOpacity>

            {/* Evening Tracking Card */}
            <TouchableOpacity
              style={styles.trackingCardTouchable}
              onPress={eveningCheckInCompleted || isEveningCheckInAvailable() ? handleEveningTracking : undefined}
              activeOpacity={eveningCheckInCompleted || isEveningCheckInAvailable() ? 0.85 : 1}
              disabled={!eveningCheckInCompleted && !isEveningCheckInAvailable()}
            >
              <View style={[
                styles.trackingCard,
                !eveningCheckInCompleted && !isEveningCheckInAvailable() && styles.trackingCardLocked
              ]}>
                {/* Icon with state-dependent appearance */}
                {eveningCheckInCompleted ? (
                  // Completed state - green ring with moon icon (success transformation)
                  <Animated.View style={[
                    styles.trackingIconCompletedRingWrapper,
                    { transform: [{ scale: eveningScale }] }
                  ]}>
                    <LinearGradient
                      colors={['#34D399', '#10B981', '#059669']}
                      style={styles.trackingIconGradientRing}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.trackingIconInnerCircle}>
                        <Ionicons name="moon" size={44} color="#059669" />
                      </View>
                    </LinearGradient>
                  </Animated.View>
                ) : isEveningCheckInAvailable() ? (
                  // Available state - purple gradient
                  <LinearGradient
                    colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                    style={styles.trackingIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.trackingIconInnerCircle}>
                      <Ionicons name="moon" size={44} color="#7C3AED" />
                    </View>
                  </LinearGradient>
                ) : (
                  // Locked state - same ring structure as Morning, muted colors
                  <LinearGradient
                    colors={['#E9E5FF', '#DDD6FE', '#C4B5FD']}
                    style={styles.trackingIconGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.trackingIconInnerCircle}>
                      <Ionicons name="moon" size={44} color="#B4A7DE" />
                    </View>
                  </LinearGradient>
                )}
                {!eveningCheckInCompleted && !isEveningCheckInAvailable() ? (
                  <Text style={[styles.lightCardTitle, styles.lightCardTitleLocked]}>
                    Evening{'\n'}<Text style={styles.timeInTitle}>in {getHoursUntilEveningCheckIn()}h</Text>
                  </Text>
                ) : (
                  <Text style={styles.lightCardTitle}>Evening{'\n'}Check-In</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Today's Priority Card - Display Only */}
          {todaysPriority && (
            <TodaysPriorityCard
              priority={todaysPriority}
              morningCheckInCompleted={morningCheckInCompleted}
              status={priorityStatus}
            />
          )}

          {/* Weekly Check-In Card */}
          <TouchableOpacity
            style={styles.weeklyCardTouchable}
            onPress={handleWeeklyTracking}
            activeOpacity={0.85}
          >
            <View style={styles.weeklyCard}>
              {/* Icon with gradient ring */}
              <LinearGradient
                colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                style={styles.weeklyIconGradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.weeklyIconInnerCircle}>
                  <Ionicons name="calendar" size={28} color="#0D9488" />
                </View>
              </LinearGradient>
              {/* Text content */}
              <View style={styles.weeklyTextContainer}>
                <Text style={styles.weeklyCardTitle}>Weekly Check-In</Text>
                <Text style={styles.weeklyCardSubtitle}>Reflect on your week</Text>
              </View>
              {/* Chevron indicator */}
              <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.weeklyChevron} />
            </View>
          </TouchableOpacity>

          {/* Monthly Check-In Card */}
          <TouchableOpacity
            style={styles.monthlyCardTouchable}
            onPress={handleMonthlyTracking}
            activeOpacity={0.85}
          >
            <View style={styles.monthlyCard}>
              {/* Icon with gradient ring */}
              <LinearGradient
                colors={['#FBCFE8', '#F472B6', '#DB2777']}
                style={styles.monthlyIconGradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.monthlyIconInnerCircle}>
                  <Ionicons name="calendar-outline" size={28} color="#DB2777" />
                </View>
              </LinearGradient>
              {/* Text content */}
              <View style={styles.monthlyTextContainer}>
                <Text style={styles.monthlyCardTitle}>Monthly Check-In</Text>
                <Text style={styles.monthlyCardSubtitle}>Review your month</Text>
              </View>
              {/* Chevron indicator */}
              <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.monthlyChevron} />
            </View>
          </TouchableOpacity>

          {/* Monthly Body Check-In Card */}
          <TouchableOpacity
            style={styles.bodyCheckInCardTouchable}
            onPress={handleMonthlyBodyTracking}
            activeOpacity={0.85}
          >
            <View style={styles.bodyCheckInCard}>
              {/* Icon with gradient ring */}
              <LinearGradient
                colors={['#BAE6FD', '#38BDF8', '#0EA5E9']}
                style={styles.bodyCheckInIconGradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bodyCheckInIconInnerCircle}>
                  <Ionicons name="body" size={28} color="#0EA5E9" />
                </View>
              </LinearGradient>
              {/* Text content */}
              <View style={styles.bodyCheckInTextContainer}>
                <Text style={styles.bodyCheckInCardTitle}>Monthly Body Check-In</Text>
                <Text style={styles.bodyCheckInCardSubtitle}>Track your physical progress</Text>
              </View>
              {/* Chevron indicator */}
              <Ionicons name="chevron-forward" size={20} color="#6B7280" style={styles.bodyCheckInChevron} />
            </View>
          </TouchableOpacity>

          {/* Today's Insight Section */}
          <View style={styles.insightSection}>
            <LinearGradient
              colors={['#FFFBEB', '#FEF3C7', '#FECACA']}
              style={styles.insightSectionCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Header */}
              <View style={styles.insightSectionHeader}>
                <Text style={styles.insightSectionTitle}>Daily Insight</Text>
              </View>

              {/* Insight Preview Card */}
              <TouchableOpacity
                style={styles.insightPreview}
                onPress={handleOpenInsightDetail}
                activeOpacity={0.8}
              >
                <View style={styles.insightPreviewContent}>
                  {/* Category Badge */}
                  <View style={styles.insightCategoryBadge}>
                    <Ionicons name="diamond-outline" size={11} color="#D97706" />
                    <Text style={styles.insightCategoryText}>{todaysInsight.category.toUpperCase()}</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.insightPreviewTitle} numberOfLines={2}>
                    {todaysInsight.title}
                  </Text>

                  {/* Meta Row */}
                  <View style={styles.insightMetaRow}>
                    <View style={styles.insightMetaItem}>
                      <Ionicons name="time-outline" size={13} color="#D97706" />
                      <Text style={styles.insightMetaText}>{todaysInsight.readTime}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D97706" style={styles.insightArrow} />
              </TouchableOpacity>

              {/* Timer Indicator - Original Design (Bottom Right) */}
              <View style={styles.timerIndicator}>
                <Ionicons name="hourglass-outline" size={16} color="#92400E" />
                <Text style={styles.timerText}>{timerHours}h</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Statistics Preview Card - Light Mode */}
          <View style={styles.statisticsPreviewCard}>
            {/* Header Row */}
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Last 7 Days</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation?.navigate('Statistics')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllLink}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Weekly Chart */}
            <WeeklyChart
              data={weekStatistics}
              activeMetrics={activeChartMetrics}
              onToggleMetric={handleToggleChartMetric}
            />
          </View>
        </View>

        {/* Focus Section - Clean Design */}
        <View style={styles.focusSection}>
          <View style={styles.focusCard}>
            {/* Section Header */}
            <Text style={styles.focusSectionTitle}>Focus</Text>

            {/* Week Focus Item */}
            <TouchableOpacity
              style={styles.focusItem}
              onPress={toggleWeek}
              activeOpacity={0.7}
            >
              <View style={styles.focusItemHeader}>
                <LinearGradient
                  colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                  style={styles.focusIconGradientRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.focusIconInner}>
                    <Ionicons name="calendar" size={16} color="#0D9488" />
                  </View>
                </LinearGradient>
                <Text style={styles.focusItemTitle}>This Week</Text>
                {weekNeedsExpansion === true && (
                  <Animated.View style={{ transform: [{ rotate: weekChevronRotation }] }}>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </Animated.View>
                )}
              </View>

              {/* Content with Preview */}
              <View style={styles.focusItemBody}>
                <Text
                  style={styles.focusItemText}
                  numberOfLines={weekNeedsExpansion === null ? undefined : (isWeekExpanded ? undefined : 3)}
                  onTextLayout={(e) => {
                    if (weekNeedsExpansion === null) {
                      setWeekNeedsExpansion(e.nativeEvent.lines.length > 3);
                    }
                  }}
                >
                  {FOCUS_CONTENT.week}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.focusDivider} />

            {/* Month Focus Item */}
            <TouchableOpacity
              style={styles.focusItem}
              onPress={toggleMonth}
              activeOpacity={0.7}
            >
              <View style={styles.focusItemHeader}>
                <LinearGradient
                  colors={['#FBCFE8', '#F472B6', '#DB2777']}
                  style={styles.focusIconGradientRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.focusIconInner}>
                    <Ionicons name="calendar" size={16} color="#DB2777" />
                  </View>
                </LinearGradient>
                <Text style={styles.focusItemTitle}>This Month</Text>
                {monthNeedsExpansion === true && (
                  <Animated.View style={{ transform: [{ rotate: monthChevronRotation }] }}>
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  </Animated.View>
                )}
              </View>

              {/* Content with Preview */}
              <View style={styles.focusItemBody}>
                <Text
                  style={styles.focusItemText}
                  numberOfLines={monthNeedsExpansion === null ? undefined : (isMonthExpanded ? undefined : 3)}
                  onTextLayout={(e) => {
                    if (monthNeedsExpansion === null) {
                      setMonthNeedsExpansion(e.nativeEvent.lines.length > 3);
                    }
                  }}
                >
                  {FOCUS_CONTENT.month}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Section */}
        <View style={styles.messagesSection}>
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF', '#DDD6FE']}
            style={styles.messagesCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.messagesHeader}>
              <Text style={styles.messagesTitle}>Messages</Text>
              <Text style={styles.messagesSubtitle}>Stay updated with insights</Text>
            </View>

            {/* Newest Message Preview */}
            <TouchableOpacity
              style={styles.messagePreview}
              onPress={handleOpenInbox}
              activeOpacity={0.8}
            >
              <View style={styles.messagePreviewContent}>
                <View style={styles.messagePreviewHeader}>
                  <Text style={styles.messagePreviewSubject} numberOfLines={1}>
                    {newestMessage.subject}
                  </Text>
                  {!newestMessage.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.messagePreviewBody} numberOfLines={2}>
                  {newestMessage.body}
                </Text>
                <Text style={styles.messagePreviewDate}>{newestMessage.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6366F1" />
            </TouchableOpacity>

            {/* Unread Counter or Empty State */}
            {unreadCount > 1 ? (
              <View style={styles.unreadCounter}>
                <Ionicons name="mail-unread-outline" size={16} color="#6366F1" />
                <Text style={styles.unreadCounterText}>
                  +{unreadCount - 1} more unread {unreadCount - 1 === 1 ? 'message' : 'messages'}
                </Text>
              </View>
            ) : unreadCount === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>You're all caught up ✨</Text>
              </View>
            ) : null}

            {/* Open Inbox Button */}
            <TouchableOpacity
              style={styles.inboxButton}
              onPress={handleOpenInbox}
              activeOpacity={0.7}
            >
              <Text style={styles.inboxButtonText}>Open Inbox</Text>
              <Ionicons name="arrow-forward" size={16} color="#6366F1" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Fixed Header with Blur Gradient */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background - light veil effect */}
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

        {/* Header Content - Single row with greeting centered between buttons */}
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            {/* Left: Streak Button */}
            <TouchableOpacity
              style={styles.streakButton}
              onPress={handleStreak}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={18} color="#F59E0B" />
              <Text style={styles.streakNumber}>{streakCount}</Text>
            </TouchableOpacity>

            {/* Right: Profile Button */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfile}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Center: Greeting - Absolutely positioned for true center */}
          <Animated.View style={[styles.greetingContainer, { opacity: greetingOpacity }]} pointerEvents="none">
            <Text style={styles.greeting} numberOfLines={1}>
              {getGreeting()}!
            </Text>
          </Animated.View>
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
    paddingHorizontal: 0,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    zIndex: 100,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    height: 120,
  },
  headerInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'relative',
    height: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // LAYER 2: Fixed Button HUD Styles
  fixedButtonHUD: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  fixedButtonsRow: {
    position: 'absolute',
    // top is applied dynamically via inline style: insets.top + 8
    left: 0,
    right: 0,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16, // 16px from screen edges (matches Dashboard cards and Knowledge Hub)
  },

  greetingContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.85,
  },
  streakButton: {
    minWidth: 64,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  streakNumber: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  actionsSection: {
    paddingHorizontal: 16, // Distance from screen edges to cards (matches Knowledge Hub)
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 12,
  },
  trackingCardTouchable: {
    flex: 1,
  },
  trackingCard: {
    aspectRatio: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  trackingIconGradientRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingIconInnerCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingIconCompletedRingWrapper: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  trackingIconInactiveRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  // Locked Evening Card Styles
  trackingCardLocked: {
    backgroundColor: '#FDFCFE',
  },
  lightCardTitleLocked: {
    color: '#A8A8B3',
  },
  timeInTitle: {
    color: '#9D8EC9',
    fontWeight: '500',
  },
  lightCardTitleInactive: {
    color: '#9CA3AF',
  },
  // Weekly Check-In Card Styles
  weeklyCardTouchable: {
    marginBottom: 12,
  },
  weeklyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    paddingLeft: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  weeklyIconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyIconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  weeklyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  weeklyCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0D9488',
    opacity: 0.85,
  },
  weeklyChevron: {
    opacity: 0.6,
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
  monthlyCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DB2777',
    opacity: 0.85,
  },
  monthlyChevron: {
    opacity: 0.6,
    marginLeft: 8,
  },
  // Monthly Body Check-In Card Styles
  bodyCheckInCardTouchable: {
    marginBottom: 24,
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
  darkCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    textAlign: 'center',
    lineHeight: 20,
  },
  lightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 20,
  },
  morningCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E', // Deep amber-brown for contrast on warm gradient
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  eveningCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#581C87', // Deep purple for contrast on cool gradient
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  morningPill: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#D97706', // Dark amber
    backgroundColor: 'rgba(217, 119, 6, 0.08)', // 8% amber tint
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  morningPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706', // Dark amber
    textAlign: 'center',
  },
  eveningPill: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#6B21A8', // Deep purple
    backgroundColor: 'rgba(107, 33, 168, 0.08)', // 8% purple tint
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eveningPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B21A8', // Deep purple
    textAlign: 'center',
  },
  cardTouchable: {
    marginBottom: 16,
  },

  // Today's Insight Section Styles (Redesigned)
  insightSection: {
    marginBottom: 24,
  },
  insightSectionCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  insightSectionHeader: {
    marginBottom: 16,
  },
  insightSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  insightSectionDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  insightPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  insightPreviewContent: {
    flex: 1,
    marginRight: 12,
  },
  insightCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  insightCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.8,
  },
  insightPreviewTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.4,
    lineHeight: 22,
    marginBottom: 10,
  },
  insightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D97706',
    opacity: 0.85,
  },
  insightArrow: {
    opacity: 0.6,
  },
  insightPreviewBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 19,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  insightPreviewReadTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D97706',
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  timerIndicator: {
    position: 'absolute',
    top: 22,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: -0.2,
  },
  statisticsPreviewCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 2,
  },
  // Focus Section - Clean Design
  focusSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  focusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  focusSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  focusItem: {
    paddingVertical: 4,
  },
  focusItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  focusIconGradientRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 0,
  },
  focusIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusIconWeek: {
    backgroundColor: '#F0FDFA',
  },
  focusIconMonth: {
    backgroundColor: '#F5F3FF',
  },
  focusItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  focusItemBody: {
    marginTop: 16,
  },
  focusItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  focusReadMore: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
    marginTop: 6,
  },
  focusDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  bottomSpacer: {
    height: 40,
  },

  // Messages Section Styles
  messagesSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  messagesCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  messagesHeader: {
    marginBottom: 16,
  },
  messagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4C1D95',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  messagesSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
    opacity: 0.7,
  },
  messagePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  messagePreviewContent: {
    flex: 1,
    marginRight: 12,
  },
  messagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messagePreviewSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4C1D95',
    flex: 1,
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginLeft: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  messagePreviewBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#5B21B6',
    lineHeight: 18,
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  messagePreviewDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
    opacity: 0.65,
  },
  unreadCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  unreadCounterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  emptyState: {
    paddingTop: 8, paddingBottom: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    opacity: 0.8,
  },
  inboxButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingTop: 8, paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inboxButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    letterSpacing: -0.1,
  },
});

export default DashboardScreen;
