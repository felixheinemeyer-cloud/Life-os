import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  Animated,
  Image,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WeeklyReviewScreenProps {
  navigation?: {
    goBack: () => void;
  };
  route?: {
    params?: {
      weekNumber: number;
      dateRange: string;
    };
  };
}

interface DailyScore {
  day: string;
  score: number;
}

interface WeeklyAverages {
  sleep: number;
  nutrition: number;
  energy: number;
  satisfaction: number;
  priorityRate: number;
  trackedDays: number;
  sleepTrend: number;
  nutritionTrend: number;
  energyTrend: number;
  satisfactionTrend: number;
  priorityTrend: number;
}

interface WeeklyData {
  completed: boolean;
  weekRange: string;
  overallScore: number;
  dailyBreakdown: DailyScore[];
  weeklyAverages: WeeklyAverages;
  wealthRatings: {
    physical: number;
    social: number;
    mental: number;
    financial: number;
    time: number;
  };
  wentWell: string;
  improveNextWeek: string;
  selfieUri?: string;
}

// Mock data for weekly check-ins (using ISO week numbers)
const mockWeeklyData: { [key: string]: WeeklyData } = {
  'week44': {
    completed: true,
    weekRange: 'Oct 27 – Nov 2',
    overallScore: 7.0,
    dailyBreakdown: [
      { day: 'M', score: 7 },
      { day: 'T', score: 6 },
      { day: 'W', score: 7 },
      { day: 'T', score: 8 },
      { day: 'F', score: 7 },
      { day: 'S', score: 7 },
      { day: 'S', score: 7 },
    ],
    weeklyAverages: {
      sleep: 7.3, nutrition: 7.0, energy: 6.8, satisfaction: 7.2, priorityRate: 85,
      trackedDays: 7, sleepTrend: 8, nutritionTrend: 5, energyTrend: -3, satisfactionTrend: 4, priorityTrend: 10,
    },
    wealthRatings: { physical: 7, social: 7, mental: 7, financial: 7, time: 7 },
    wentWell: 'Balanced week with steady progress on all fronts. Started new morning routine.',
    improveNextWeek: 'Be more intentional about screen time in the evenings.',
  },
  'week45': {
    completed: true,
    weekRange: 'Nov 3 – 9',
    overallScore: 6.5,
    dailyBreakdown: [
      { day: 'M', score: 6 },
      { day: 'T', score: 7 },
      { day: 'W', score: 6 },
      { day: 'T', score: 7 },
      { day: 'F', score: 6 },
      { day: 'S', score: 7 },
      { day: 'S', score: 6 },
    ],
    weeklyAverages: {
      sleep: 6.8, nutrition: 6.5, energy: 6.2, satisfaction: 6.7, priorityRate: 72,
      trackedDays: 7, sleepTrend: -5, nutritionTrend: -3, energyTrend: -8, satisfactionTrend: -2, priorityTrend: -5,
    },
    wealthRatings: { physical: 6, social: 7, mental: 6, financial: 6, time: 7 },
    wentWell: 'Good social interactions and maintained work-life balance despite busy schedule.',
    improveNextWeek: 'Get back to regular workout schedule after missing a few sessions.',
    selfieUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop',
  },
  'week46': {
    completed: true,
    weekRange: 'Nov 10 – 16',
    overallScore: 7.2,
    dailyBreakdown: [
      { day: 'M', score: 7 },
      { day: 'T', score: 8 },
      { day: 'W', score: 7 },
      { day: 'T', score: 7 },
      { day: 'F', score: 8 },
      { day: 'S', score: 7 },
      { day: 'S', score: 7 },
    ],
    weeklyAverages: {
      sleep: 7.5, nutrition: 7.2, energy: 7.0, satisfaction: 7.3, priorityRate: 80,
      trackedDays: 7, sleepTrend: 10, nutritionTrend: 8, energyTrend: 5, satisfactionTrend: 6, priorityTrend: 8,
    },
    wealthRatings: { physical: 8, social: 6, mental: 7, financial: 8, time: 7 },
    wentWell: 'Strong fitness week with 5 workouts completed. Good financial discipline.',
    improveNextWeek: 'Reconnect with friends - social energy was low this week.',
  },
  'week47': {
    completed: true,
    weekRange: 'Nov 17 – 23',
    overallScore: 7.1,
    dailyBreakdown: [
      { day: 'M', score: 7 },
      { day: 'T', score: 7 },
      { day: 'W', score: 8 },
      { day: 'T', score: 7 },
      { day: 'F', score: 7 },
      { day: 'S', score: 7 },
      { day: 'S', score: 7 },
    ],
    weeklyAverages: {
      sleep: 7.2, nutrition: 7.1, energy: 6.9, satisfaction: 7.4, priorityRate: 78,
      trackedDays: 7, sleepTrend: -3, nutritionTrend: -1, energyTrend: -2, satisfactionTrend: 1, priorityTrend: -2,
    },
    wealthRatings: { physical: 7, social: 8, mental: 7, financial: 6, time: 7 },
    wentWell: 'Great catch-ups with old friends. Felt mentally clear and focused.',
    improveNextWeek: 'Review budget before holiday spending begins.',
    selfieUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop',
  },
  'week49': {
    completed: true,
    weekRange: 'Dec 1 – 7',
    overallScore: 7.2,
    dailyBreakdown: [
      { day: 'M', score: 7 },
      { day: 'T', score: 8 },
      { day: 'W', score: 7 },
      { day: 'T', score: 7 },
      { day: 'F', score: 7 },
      { day: 'S', score: 8 },
      { day: 'S', score: 7 },
    ],
    weeklyAverages: {
      sleep: 7.4, nutrition: 7.0, energy: 7.2, satisfaction: 7.1, priorityRate: 82,
      trackedDays: 7, sleepTrend: 2, nutritionTrend: -1, energyTrend: 4, satisfactionTrend: -3, priorityTrend: 5,
    },
    wealthRatings: { physical: 8, social: 7, mental: 6, financial: 7, time: 8 },
    wentWell: 'Maintained consistent exercise routine and had quality family time.',
    improveNextWeek: 'Focus more on deep work and reduce distractions.',
  },
  'week50': {
    completed: true,
    weekRange: 'Dec 8 – 14',
    overallScore: 6.8,
    dailyBreakdown: [
      { day: 'M', score: 7 },
      { day: 'T', score: 6 },
      { day: 'W', score: 7 },
      { day: 'T', score: 7 },
      { day: 'F', score: 6 },
      { day: 'S', score: 7 },
      { day: 'S', score: 7 },
    ],
    weeklyAverages: {
      sleep: 6.5, nutrition: 6.8, energy: 6.3, satisfaction: 6.9, priorityRate: 68,
      trackedDays: 7, sleepTrend: -12, nutritionTrend: -3, energyTrend: -12, satisfactionTrend: -3, priorityTrend: -17,
    },
    wealthRatings: { physical: 7, social: 6, mental: 7, financial: 6, time: 8 },
    wentWell: 'Made progress on holiday shopping and stayed within budget.',
    improveNextWeek: 'Get more sleep and prioritize self-care.',
    selfieUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  },
  'week51': {
    completed: true,
    weekRange: 'Dec 15 – 21',
    overallScore: 7.4,
    dailyBreakdown: [
      { day: 'M', score: 7 },
      { day: 'T', score: 8 },
      { day: 'W', score: 7 },
      { day: 'T', score: 8 },
      { day: 'F', score: 7 },
      { day: 'S', score: 8 },
      { day: 'S', score: 7 },
    ],
    weeklyAverages: {
      sleep: 7.6, nutrition: 7.3, energy: 7.5, satisfaction: 7.8, priorityRate: 85,
      trackedDays: 7, sleepTrend: 17, nutritionTrend: 7, energyTrend: 19, satisfactionTrend: 13, priorityTrend: 25,
    },
    wealthRatings: { physical: 7, social: 8, mental: 7, financial: 7, time: 8 },
    wentWell: 'Great social connections with friends and family gatherings.',
    improveNextWeek: 'Finish all work before the holiday break.',
  },
  'week52': {
    completed: true,
    weekRange: 'Dec 22 – 28',
    overallScore: 8.0,
    dailyBreakdown: [
      { day: 'M', score: 8 },
      { day: 'T', score: 8 },
      { day: 'W', score: 9 },
      { day: 'T', score: 8 },
      { day: 'F', score: 8 },
      { day: 'S', score: 8 },
      { day: 'S', score: 7 },
    ],
    weeklyAverages: {
      sleep: 8.1, nutrition: 7.8, energy: 7.9, satisfaction: 8.2, priorityRate: 90,
      trackedDays: 7, sleepTrend: 7, nutritionTrend: 7, energyTrend: 5, satisfactionTrend: 5, priorityTrend: 6,
    },
    wealthRatings: { physical: 8, social: 9, mental: 8, financial: 7, time: 8 },
    wentWell: 'Wonderful Christmas celebrations with loved ones.',
    improveNextWeek: 'Set intentions and goals for the new year.',
    selfieUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  },
};

const getWeeklyData = (weekNumber: number): WeeklyData | null => {
  return mockWeeklyData[`week${weekNumber}`] || null;
};

const getScoreRating = (score: number): { label: string; color: string } => {
  if (score >= 8) return { label: 'Excellent', color: '#059669' };
  if (score >= 7) return { label: 'Good', color: '#10B981' };
  if (score >= 6) return { label: 'Okay', color: '#F59E0B' };
  if (score >= 5) return { label: 'Fair', color: '#F59E0B' };
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
          <SvgLinearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </SvgLinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8EAED"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

// Get day bar color based on score
const getDayBarColor = (score: number): string => {
  if (score >= 7) return '#10B981';
  if (score >= 5) return '#F59E0B';
  return '#EF4444';
};

// Helper to get approximate date range for any week number (ISO week)
const getWeekDateRange = (weekNumber: number): string => {
  // ISO week 1 of 2025 starts on Dec 30, 2024 (Monday)
  // For simplicity, we'll use a lookup for common weeks or calculate
  const weekRanges: { [key: number]: string } = {
    1: 'Dec 30 – Jan 5',
    44: 'Oct 27 – Nov 2',
    45: 'Nov 3 – 9',
    46: 'Nov 10 – 16',
    47: 'Nov 17 – 23',
    48: 'Nov 24 – 30',
    49: 'Dec 1 – 7',
    50: 'Dec 8 – 14',
    51: 'Dec 15 – 21',
    52: 'Dec 22 – 28',
  };

  if (weekRanges[weekNumber]) {
    return weekRanges[weekNumber];
  }

  // Fallback calculation for other weeks
  const jan6 = new Date(2025, 0, 6); // First Monday of ISO week 2
  const weekStart = new Date(jan6);
  weekStart.setDate(jan6.getDate() + (weekNumber - 2) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${months[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}`;
  } else {
    return `${months[weekStart.getMonth()]} ${weekStart.getDate()} – ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
  }
};

const WeeklyReviewScreen = ({ navigation, route }: WeeklyReviewScreenProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const initialWeekNumber = route?.params?.weekNumber || 1;
  const dateRange = route?.params?.dateRange || '';

  const [currentWeekNumber, setCurrentWeekNumber] = useState(initialWeekNumber);
  const weeklyData = getWeeklyData(currentWeekNumber);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  const handlePreviousWeek = () => {
    if (currentWeekNumber > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentWeekNumber(currentWeekNumber - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekNumber < 52) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentWeekNumber(currentWeekNumber + 1);
    }
  };

  const openImageViewer = (imageUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImageUri(imageUri);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageViewerVisible(false);
    setSelectedImageUri(null);
  };

  const downloadImage = async () => {
    if (!selectedImageUri) return;

    try {
      setIsDownloading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save photos to your library.');
        setIsDownloading(false);
        return;
      }

      const filename = `week-snapshot-${Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(selectedImageUri, fileUri);

      if (downloadResult.status === 200) {
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved!', 'Photo has been saved to your library.');
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save the photo. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!weeklyData) {
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
          {/* Weekly Check-in Card - Empty State */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#0D9488" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Weekly Check-in</Text>
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
                  Complete your weekly check-in to see your review here
                </Text>
                <TouchableOpacity
                  style={styles.emptyCardButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // TODO: Navigate to weekly check-in flow
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
                    currentWeekNumber <= 1 && styles.headerDatePillSideDisabled,
                    pressed && !(currentWeekNumber <= 1) && styles.headerDatePillSidePressed,
                  ]}
                  onPress={handlePreviousWeek}
                  disabled={currentWeekNumber <= 1}
                >
                  <Ionicons name="chevron-back" size={16} color={currentWeekNumber <= 1 ? '#D1D5DB' : '#6B7280'} />
                </Pressable>
                <View style={styles.headerDatePillCenter}>
                  <Ionicons name="calendar-outline" size={14} color="#0D9488" />
                  <Text style={styles.headerDateText}>{getWeekDateRange(currentWeekNumber)}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.headerDatePillSide,
                    currentWeekNumber >= 52 && styles.headerDatePillSideDisabled,
                    pressed && !(currentWeekNumber >= 52) && styles.headerDatePillSidePressed,
                  ]}
                  onPress={handleNextWeek}
                  disabled={currentWeekNumber >= 52}
                >
                  <Ionicons name="chevron-forward" size={16} color={currentWeekNumber >= 52 ? '#D1D5DB' : '#6B7280'} />
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
          {/* Weekly Check-in Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#0D9488" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Weekly Summary</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Weekly Overview Section */}
              <View style={styles.weeklyOverviewSection}>
                <View style={styles.scoreContainer}>
                  {/* Score Ring */}
                  <View style={styles.scoreRingWrapper}>
                    <ScoreRing score={weeklyData.overallScore} color={getScoreRating(weeklyData.overallScore).color} size={90} />
                    <View style={styles.scoreTextOverlay}>
                      <Text style={[styles.scoreValue, { color: getScoreRating(weeklyData.overallScore).color }]}>
                        {weeklyData.overallScore.toFixed(1)}
                      </Text>
                      <Text style={styles.scoreOutOf}>/ 10</Text>
                    </View>
                  </View>

                  {/* Score Info */}
                  <View style={styles.scoreInfo}>
                    <View style={[styles.performanceBadge, { backgroundColor: getScoreRating(weeklyData.overallScore).color + '15' }]}>
                      <View style={[styles.performanceDot, { backgroundColor: getScoreRating(weeklyData.overallScore).color }]} />
                      <Text style={[styles.performanceLabel, { color: getScoreRating(weeklyData.overallScore).color }]}>
                        {getScoreRating(weeklyData.overallScore).label}
                      </Text>
                    </View>
                    <Text style={styles.scoreDescription}>
                      Based on nutrition, energy & satisfaction
                    </Text>
                  </View>
                </View>

                {/* Daily Breakdown - Refined */}
                <View style={styles.dailyBreakdown}>
                  <Text style={styles.dailyBreakdownTitle}>Daily Breakdown</Text>
                  <View style={styles.dayIndicatorsRow}>
                    {weeklyData.dailyBreakdown.map((day, index) => {
                      const barColor = getDayBarColor(day.score);
                      const maxBarHeight = 28;
                      const barHeight = Math.max(8, (day.score / 10) * maxBarHeight);
                      return (
                        <View key={index} style={styles.dayIndicatorContainer}>
                          <Text style={styles.dayIndicatorLabel}>{day.day}</Text>
                          <View style={styles.dayIndicatorTrack}>
                            <View style={[styles.dayIndicatorBar, { backgroundColor: barColor, height: barHeight }]} />
                          </View>
                          <Text style={[styles.dayIndicatorScore, { color: barColor }]}>{day.score}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Weekly Averages Section */}
              <View style={styles.weeklyAveragesSection}>
                <View style={styles.weeklyAveragesHeader}>
                  <Text style={styles.weeklyAveragesTitle}>Weekly Averages</Text>
                </View>

                <AverageMetricRow
                  icon="moon"
                  label="Sleep"
                  value={`${weeklyData.weeklyAverages.sleep.toFixed(1)}h`}
                  numericValue={weeklyData.weeklyAverages.sleep}
                  maxValue={9}
                  color="#7C3AED"
                  bgColor="#F3E8FF"
                  trend={weeklyData.weeklyAverages.sleepTrend}
                />
                <AverageMetricRow
                  icon="leaf"
                  label="Nutrition"
                  value={weeklyData.weeklyAverages.nutrition.toFixed(1)}
                  numericValue={weeklyData.weeklyAverages.nutrition}
                  maxValue={10}
                  color="#059669"
                  bgColor="#ECFDF5"
                  trend={weeklyData.weeklyAverages.nutritionTrend}
                />
                <AverageMetricRow
                  icon="flash"
                  label="Energy"
                  value={weeklyData.weeklyAverages.energy.toFixed(1)}
                  numericValue={weeklyData.weeklyAverages.energy}
                  maxValue={10}
                  color="#F59E0B"
                  bgColor="#FEF3C7"
                  trend={weeklyData.weeklyAverages.energyTrend}
                />
                <AverageMetricRow
                  icon="sparkles"
                  label="Satisfaction"
                  value={weeklyData.weeklyAverages.satisfaction.toFixed(1)}
                  numericValue={weeklyData.weeklyAverages.satisfaction}
                  maxValue={10}
                  color="#3B82F6"
                  bgColor="#EFF6FF"
                  trend={weeklyData.weeklyAverages.satisfactionTrend}
                />
                <AverageMetricRow
                  icon="checkmark-circle"
                  label="Priorities"
                  value={`${Math.round(weeklyData.weeklyAverages.priorityRate)}%`}
                  numericValue={weeklyData.weeklyAverages.priorityRate}
                  maxValue={100}
                  color="#10B981"
                  bgColor="#D1FAE5"
                  trend={weeklyData.weeklyAverages.priorityTrend}
                  isLast
                />
              </View>
            </View>
          </View>

          {/* Weekly Reflection Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#0D9488" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Weekly Reflection</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Wealth Rating Bars */}
              <View style={styles.weeklyRatingsBlock}>
                <Text style={styles.wealthRatingsTitle}>Wealth Ratings</Text>
                <WeeklyRatingBar label="Physical" value={weeklyData.wealthRatings.physical} color="#059669" icon="fitness" />
                <WeeklyRatingBar label="Social" value={weeklyData.wealthRatings.social} color="#8B5CF6" icon="people" />
                <WeeklyRatingBar label="Mental" value={weeklyData.wealthRatings.mental} color="#3B82F6" icon="bulb" />
                <WeeklyRatingBar label="Financial" value={weeklyData.wealthRatings.financial} color="#EAB308" icon="bar-chart" />
                <WeeklyRatingBar label="Time" value={weeklyData.wealthRatings.time} color="#FB923C" icon="time" isLast />
              </View>

              {/* Reflections */}
              <View style={styles.weeklyReflectionsContainer}>
                <View style={styles.weeklyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="trophy" size={16} color="#0D9488" />
                    <Text style={styles.infoLabel}>What went well</Text>
                  </View>
                  <Text style={styles.infoText}>{weeklyData.wentWell}</Text>
                </View>
                <View style={styles.weeklyReflectionDivider} />
                <View style={styles.weeklyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="arrow-up-circle" size={16} color="#0D9488" />
                    <Text style={styles.infoLabel}>Focus for next week</Text>
                  </View>
                  <Text style={styles.infoText}>{weeklyData.improveNextWeek}</Text>
                </View>
              </View>

              {/* Week Selfie */}
              {weeklyData.selfieUri && (
                <View style={styles.weeklySelfieContainerBottom}>
                  <View style={styles.weeklySelfieHeader}>
                    <Ionicons name="camera" size={14} color="#0D9488" />
                    <Text style={styles.weeklySelfieLabel}>Week snapshot</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.weeklySelfieImageWrapper}
                    onPress={() => openImageViewer(weeklyData.selfieUri!)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: weeklyData.selfieUri }}
                      style={styles.weeklySelfieImage}
                      resizeMode="cover"
                    />
                    <View style={styles.selfieExpandHint}>
                      <Ionicons name="expand" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
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
                  currentWeekNumber <= 1 && styles.headerDatePillSideDisabled,
                  pressed && !(currentWeekNumber <= 1) && styles.headerDatePillSidePressed,
                ]}
                onPress={handlePreviousWeek}
                disabled={currentWeekNumber <= 1}
              >
                <Ionicons name="chevron-back" size={16} color={currentWeekNumber <= 1 ? '#D1D5DB' : '#6B7280'} />
              </Pressable>
              <View style={styles.headerDatePillCenter}>
                <Ionicons name="calendar-outline" size={14} color="#0D9488" />
                <Text style={styles.headerDateText}>{weeklyData.weekRange}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.headerDatePillSide,
                  currentWeekNumber >= 52 && styles.headerDatePillSideDisabled,
                  pressed && !(currentWeekNumber >= 52) && styles.headerDatePillSidePressed,
                ]}
                onPress={handleNextWeek}
                disabled={currentWeekNumber >= 52}
              >
                <Ionicons name="chevron-forward" size={16} color={currentWeekNumber >= 52 ? '#D1D5DB' : '#6B7280'} />
              </Pressable>
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          <SafeAreaView style={styles.imageViewerHeaderSafeArea}>
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity
                style={styles.imageViewerButton}
                onPress={closeImageViewer}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.imageViewerTitle}>Week Snapshot</Text>
              <TouchableOpacity
                style={styles.imageViewerButton}
                onPress={downloadImage}
                activeOpacity={0.7}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.imageViewerContent}>
            {selectedImageUri && (
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.imageViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Average Metric Row Component
interface AverageMetricRowProps {
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

const AverageMetricRow: React.FC<AverageMetricRowProps> = ({
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
    <View style={[styles.avgMetricRow, isLast && styles.avgMetricRowLast]}>
      <View style={[styles.avgMetricIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.avgMetricContent}>
        <View style={styles.avgMetricHeader}>
          <Text style={styles.avgMetricLabel}>{label}</Text>
          <Text style={[styles.avgMetricValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.avgProgressRow}>
          <View style={styles.avgProgressBarBg}>
            <View
              style={[
                styles.avgProgressBarFill,
                { backgroundColor: color, width: `${progress * 100}%` }
              ]}
            />
          </View>
          <Text style={[styles.avgMetricTrend, { color: getTrendColor() }]}>
            {getTrendLabel()}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Weekly Rating Bar Component (matching Monthly tracking design)
interface WeeklyRatingBarProps {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLast?: boolean;
}

const WeeklyRatingBar: React.FC<WeeklyRatingBarProps> = ({ label, value, color, icon, isLast }) => {
  const percentage = (value / 10) * 100;

  return (
    <View style={[styles.wealthRatingRow, isLast && styles.wealthRatingRowLast]}>
      <LinearGradient
        colors={['#FFFFFF', '#F5F5F5']}
        style={[styles.wealthRatingIconContainer, { borderColor: color }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={16} color={color} />
      </LinearGradient>
      <View style={styles.wealthRatingContent}>
        <View style={styles.wealthRatingHeader}>
          <Text style={styles.wealthRatingLabel}>{label}</Text>
          <Text style={[styles.wealthRatingValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.wealthRatingProgressRow}>
          <View style={styles.wealthRatingProgressBg}>
            <View style={[styles.wealthRatingProgressFill, { width: `${percentage}%`, backgroundColor: color }]} />
          </View>
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerDatePicker: {
    flex: 1,
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

  // Weekly Overview Section - Redesigned to match WeeklyTrackingOverviewContent
  weeklyOverviewSection: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  },
  // Daily Breakdown - Refined slim design
  dailyBreakdown: {
    paddingBottom: 2,
  },
  dailyBreakdownTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9AA0A6',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dayIndicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  dayIndicatorContainer: {
    alignItems: 'center',
    width: 32,
  },
  dayIndicatorLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9AA0A6',
    marginBottom: 6,
  },
  dayIndicatorTrack: {
    width: 4,
    height: 28,
    backgroundColor: '#E8EAED',
    borderRadius: 2,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 4,
  },
  dayIndicatorBar: {
    width: '100%',
    borderRadius: 2,
  },
  dayIndicatorScore: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Weekly Averages Section
  weeklyAveragesSection: {
    paddingBottom: 0,
    marginBottom: 0,
  },
  weeklyAveragesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyAveragesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  weeklyAveragesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F7F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  weeklyAveragesBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  avgMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB60',
  },
  avgMetricRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  avgMetricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avgMetricContent: {
    flex: 1,
    height: 34,
    justifyContent: 'space-between',
  },
  avgMetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avgMetricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  avgMetricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  avgProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avgProgressBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  avgProgressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  avgMetricTrend: {
    fontSize: 10,
    fontWeight: '500',
    minWidth: 45,
    textAlign: 'right',
  },

  // Weekly Ratings (matching Monthly tracking design)
  weeklyRatingsBlock: {
    paddingTop: 0,
    paddingBottom: 16,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  wealthRatingsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  wealthRatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED60',
  },
  wealthRatingRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  wealthRatingIconContainer: {
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
  wealthRatingContent: {
    flex: 1,
    gap: 6,
  },
  wealthRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wealthRatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  wealthRatingValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  wealthRatingProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wealthRatingProgressBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#E8EAED',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  wealthRatingProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // Weekly Reflections
  weeklyReflectionsContainer: {
    borderTopWidth: 0,
    borderTopColor: '#E5E7EB',
    marginBottom: -16,
  },
  weeklyReflectionItem: {
    paddingVertical: 16,
  },
  weeklyReflectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // Weekly Selfie
  weeklySelfieContainerBottom: {
    marginTop: 16,
    marginBottom: 0,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  weeklySelfieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  weeklySelfieLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  weeklySelfieImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  weeklySelfieImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  selfieExpandHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Image Viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeaderSafeArea: {
    backgroundColor: 'transparent',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8, paddingBottom: 12,
  },
  imageViewerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageViewerImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: 16,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default WeeklyReviewScreen;
