import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface WeeklyTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string; params?: Record<string, unknown> }[] }) => void;
  };
  route?: {
    params?: {
      physical?: number;
      social?: number;
      mental?: number;
      financial?: number;
      time?: number;
      wentWell?: string;
      improveNextWeek?: string;
      photoUri?: string | null;
    };
  };
}

// --- Mock data (same approach as WeeklyReviewScreen) ---

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
  sleepTrend: number;
  nutritionTrend: number;
  energyTrend: number;
  satisfactionTrend: number;
  priorityTrend: number;
}

interface WeeklySummaryData {
  overallScore: number;
  dailyBreakdown: DailyScore[];
  weeklyAverages: WeeklyAverages;
}

const mockSummaryData: WeeklySummaryData = {
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
    sleepTrend: 2, nutritionTrend: -1, energyTrend: 4, satisfactionTrend: -3, priorityTrend: 5,
  },
};

// --- Helper functions ---

const getScoreRating = (score: number): { label: string; color: string } => {
  if (score >= 8) return { label: 'Excellent', color: '#059669' };
  if (score >= 7) return { label: 'Good', color: '#10B981' };
  if (score >= 6) return { label: 'Okay', color: '#F59E0B' };
  if (score >= 5) return { label: 'Fair', color: '#F59E0B' };
  return { label: 'Needs Work', color: '#EF4444' };
};

const getDayBarColor = (score: number): string => {
  if (score >= 7) return '#10B981';
  if (score >= 5) return '#F59E0B';
  return '#EF4444';
};

// --- Sub-components (inline, matching WeeklyReviewScreen) ---

const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({
  score, color, size = 90,
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
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E8EAED" strokeWidth={strokeWidth} fill="transparent" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#scoreGradient)" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" />
      </Svg>
    </View>
  );
};

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
  icon, label, value, numericValue, maxValue, color, bgColor, trend, isLast,
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
            <View style={[styles.avgProgressBarFill, { backgroundColor: color, width: `${progress * 100}%` }]} />
          </View>
          <Text style={[styles.avgMetricTrend, { color: getTrendColor() }]}>{getTrendLabel()}</Text>
        </View>
      </View>
    </View>
  );
};

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

// --- Main Screen ---

const WeeklyTrackingCompleteScreen: React.FC<WeeklyTrackingCompleteScreenProps> = ({
  navigation,
  route,
}) => {
  const physical = route?.params?.physical ?? 5;
  const social = route?.params?.social ?? 5;
  const mental = route?.params?.mental ?? 5;
  const financial = route?.params?.financial ?? 5;
  const time = route?.params?.time ?? 5;
  const wentWell = route?.params?.wentWell ?? '';
  const improveNextWeek = route?.params?.improveNextWeek ?? '';
  const photoUri = route?.params?.photoUri ?? null;

  const summaryData = mockSummaryData;

  // Animation values — icon container
  const containerScale = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Ring animations
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Pulse effect
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Ripple ring
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // Breathing glow after settle
  const breatheScale = useRef(new Animated.Value(1)).current;

  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const subtextTranslateY = useRef(new Animated.Value(15)).current;

  // Celebration shift (moves up to make room for overview)
  const celebrationShiftY = useRef(new Animated.Value(0)).current;

  // Icon shrink when transitioning to overview
  const iconShrinkScale = useRef(new Animated.Value(1)).current;

  // Continue button
  const continueOpacity = useRef(new Animated.Value(0)).current;
  const continueTranslateY = useRef(new Animated.Value(20)).current;

  // Layout measurements
  const containerHeight = useRef(0);
  const iconCenterY = useRef(0);
  const overviewCardsHeight = useRef(0);
  const bottomFixedHeight = useRef(0);
  const overviewTopGapValue = useRef(new Animated.Value(0)).current;
  const overviewGapValue = useRef(new Animated.Value(0)).current;

  // Per-card stagger
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(20)).current;
  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(20)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: Ring + icon appear
    const introAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(containerOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(containerScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      ]),
      Animated.delay(250),
    ]);

    // Overview transition
    const proceedToOverview = () => {
      const targetIconCenterY = containerHeight.current * 0.10;

      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(subtextOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(iconShrinkScale, {
          toValue: 0.55,
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(celebrationShiftY, {
          toValue: targetIconCenterY - iconCenterY.current + 6,
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Staggered card reveals
        const fadeIn = (opacity: Animated.Value, translateY: Animated.Value) => Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]);
        const completionBounce = (scale: Animated.Value) => Animated.sequence([
          Animated.timing(scale, { toValue: 1.04, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        ]);

        let hapticDelay = 0;

        Animated.sequence([
          // Card 1: Weekly Summary
          fadeIn(card1Opacity, card1TranslateY),
          completionBounce(card1Scale),
          (() => { setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay += 300); return Animated.delay(200); })(),
          // Card 2: Weekly Reflection
          fadeIn(card2Opacity, card2TranslateY),
          completionBounce(card2Scale),
          (() => { setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay += 500); return Animated.delay(200); })(),
        ]).start(() => {
          // Continue button + breathing start together
          Animated.parallel([
            Animated.timing(continueOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(continueTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]).start();

          // Gentle breathing pulse
          Animated.loop(
            Animated.sequence([
              Animated.timing(breatheScale, { toValue: 1.08, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(breatheScale, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
          ).start();
        });
      });
    };

    // Light haptic on intro
    const hapticTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 400);

    // Start intro, then non-streak path → overview
    introAnimation.start(() => {
      Animated.parallel([
        // Pulse
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.2,
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(pulseScale, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
        ]),
        // Outer ring expands and fades
        Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.timing(ringScale, {
              toValue: 1.8,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(150),
              Animated.timing(ringOpacity, {
                toValue: 0,
                duration: 450,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]),
      ]).start(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Show text then proceed to overview
        Animated.sequence([
          Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(textTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(subtextOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(subtextTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.delay(400),
        ]).start(() => proceedToOverview());
      });
    });

    return () => {
      clearTimeout(hapticTimer);
    };
  }, [navigation]);

  // Theme colors
  const gradientColors: [string, string, string] = ['#5EEAD4', '#14B8A6', '#0D9488'];
  const ringColor = '#14B8A6';
  const shadowColorValue = '#0D9488';

  const rating = getScoreRating(summaryData.overallScore);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} onLayout={(e) => { containerHeight.current = e.nativeEvent.layout.height; }}>
        {/* Celebration Zone */}
        <Animated.View style={[styles.celebrationZone, { transform: [{ translateY: celebrationShiftY }] }]}>
          <Animated.View
            onLayout={(e) => { iconCenterY.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2; }}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: iconShrinkScale }],
            }}
          >
            <View style={styles.animationContainer}>
              {/* Ripple Ring */}
              <Animated.View
                style={[
                  styles.rippleRing,
                  {
                    borderColor: ringColor,
                    opacity: rippleOpacity,
                    transform: [{ scale: rippleScale }],
                  },
                ]}
              />

              {/* Outer Ring */}
              <Animated.View
                style={[
                  styles.outerRing,
                  {
                    borderColor: ringColor,
                    opacity: ringOpacity,
                    transform: [{ scale: Animated.multiply(ringScale, breatheScale) }],
                  },
                ]}
              />

              {/* Icon Container with Pulse + Breathe */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    shadowColor: shadowColorValue,
                    opacity: containerOpacity,
                    transform: [
                      { scale: Animated.multiply(Animated.multiply(containerScale, pulseScale), breatheScale) },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={gradientColors}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.iconInnerCircle}>
                    <Ionicons name="calendar" size={72} color="#0D9488" />
                  </View>
                </LinearGradient>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Text Content */}
          <View style={styles.textContainer}>
            <Animated.Text
              style={[
                styles.titleText,
                {
                  opacity: textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}
            >
              Week Complete!
            </Animated.Text>
            <Animated.Text
              style={[
                styles.subtitleText,
                {
                  opacity: subtextOpacity,
                  transform: [{ translateY: subtextTranslateY }],
                },
              ]}
            >
              {'Great job reflecting on your week.\nKeep up the momentum!'}
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Bottom Section: Overview + Continue */}
        <View style={styles.bottomSection}>
          <Animated.View style={{ height: overviewTopGapValue }} />

          {/* Overview Cards in ScrollView */}
          <View style={{ flex: 1 }} onLayout={(e) => { overviewCardsHeight.current = e.nativeEvent.layout.height; }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, paddingHorizontal: 16 }}>
              {/* Card 1: Weekly Summary */}
              <Animated.View style={{ opacity: card1Opacity, transform: [{ translateY: card1TranslateY }, { scale: card1Scale }] }}>
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
                    <Text style={styles.sectionTitle}>Weekly Summary</Text>
                  </View>

                  <View style={styles.sectionContent}>
                    {/* Score Ring + Info */}
                    <View style={styles.weeklyOverviewSection}>
                      <View style={styles.scoreContainer}>
                        <View style={styles.scoreRingWrapper}>
                          <ScoreRing score={summaryData.overallScore} color={rating.color} size={90} />
                          <View style={styles.scoreTextOverlay}>
                            <Text style={[styles.scoreValue, { color: rating.color }]}>
                              {summaryData.overallScore.toFixed(1)}
                            </Text>
                            <Text style={styles.scoreOutOf}>/ 10</Text>
                          </View>
                        </View>
                        <View style={styles.scoreInfo}>
                          <View style={[styles.performanceBadge, { backgroundColor: rating.color + '15' }]}>
                            <View style={[styles.performanceDot, { backgroundColor: rating.color }]} />
                            <Text style={[styles.performanceLabel, { color: rating.color }]}>{rating.label}</Text>
                          </View>
                          <Text style={styles.scoreDescription}>Based on nutrition, energy & satisfaction</Text>
                        </View>
                      </View>

                      {/* Daily Breakdown */}
                      <View style={styles.dailyBreakdown}>
                        <Text style={styles.dailyBreakdownTitle}>Daily Breakdown</Text>
                        <View style={styles.dayIndicatorsRow}>
                          {summaryData.dailyBreakdown.map((day, index) => {
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

                    {/* Weekly Averages */}
                    <View style={styles.weeklyAveragesSection}>
                      <Text style={styles.weeklyAveragesTitle}>Weekly Averages</Text>
                      <AverageMetricRow icon="moon" label="Sleep" value={`${summaryData.weeklyAverages.sleep.toFixed(1)}h`} numericValue={summaryData.weeklyAverages.sleep} maxValue={9} color="#7C3AED" bgColor="#F3E8FF" trend={summaryData.weeklyAverages.sleepTrend} />
                      <AverageMetricRow icon="leaf" label="Nutrition" value={summaryData.weeklyAverages.nutrition.toFixed(1)} numericValue={summaryData.weeklyAverages.nutrition} maxValue={10} color="#059669" bgColor="#ECFDF5" trend={summaryData.weeklyAverages.nutritionTrend} />
                      <AverageMetricRow icon="flash" label="Energy" value={summaryData.weeklyAverages.energy.toFixed(1)} numericValue={summaryData.weeklyAverages.energy} maxValue={10} color="#F59E0B" bgColor="#FEF3C7" trend={summaryData.weeklyAverages.energyTrend} />
                      <AverageMetricRow icon="sparkles" label="Satisfaction" value={summaryData.weeklyAverages.satisfaction.toFixed(1)} numericValue={summaryData.weeklyAverages.satisfaction} maxValue={10} color="#3B82F6" bgColor="#EFF6FF" trend={summaryData.weeklyAverages.satisfactionTrend} />
                      <AverageMetricRow icon="checkmark-circle" label="Priorities" value={`${Math.round(summaryData.weeklyAverages.priorityRate)}%`} numericValue={summaryData.weeklyAverages.priorityRate} maxValue={100} color="#10B981" bgColor="#D1FAE5" trend={summaryData.weeklyAverages.priorityTrend} isLast />
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Card 2: Weekly Reflection */}
              <Animated.View style={{ opacity: card2Opacity, transform: [{ translateY: card2TranslateY }, { scale: card2Scale }] }}>
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
                    <Text style={styles.sectionTitle}>Weekly Reflection</Text>
                  </View>

                  <View style={styles.sectionContent}>
                    {/* Wealth Ratings */}
                    <View style={styles.weeklyRatingsBlock}>
                      <Text style={styles.wealthRatingsTitle}>Wealth Ratings</Text>
                      <WeeklyRatingBar label="Physical" value={physical} color="#059669" icon="fitness" />
                      <WeeklyRatingBar label="Social" value={social} color="#8B5CF6" icon="people" />
                      <WeeklyRatingBar label="Mental" value={mental} color="#3B82F6" icon="bulb" />
                      <WeeklyRatingBar label="Financial" value={financial} color="#EAB308" icon="bar-chart" />
                      <WeeklyRatingBar label="Time" value={time} color="#FB923C" icon="time" isLast />
                    </View>

                    {/* Reflections */}
                    <View style={styles.weeklyReflectionsContainer}>
                      {wentWell ? (
                        <View style={styles.weeklyReflectionItem}>
                          <View style={styles.infoHeader}>
                            <Ionicons name="trophy" size={16} color="#0D9488" />
                            <Text style={styles.infoLabel}>What went well</Text>
                          </View>
                          <Text style={styles.infoText}>{wentWell}</Text>
                        </View>
                      ) : null}
                      {wentWell && improveNextWeek ? (
                        <View style={styles.weeklyReflectionDivider} />
                      ) : null}
                      {improveNextWeek ? (
                        <View style={styles.weeklyReflectionItem}>
                          <View style={styles.infoHeader}>
                            <Ionicons name="arrow-up-circle" size={16} color="#0D9488" />
                            <Text style={styles.infoLabel}>Focus for next week</Text>
                          </View>
                          <Text style={styles.infoText}>{improveNextWeek}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Week Snapshot Photo */}
                    {photoUri ? (
                      <View style={styles.weeklySelfieContainerBottom}>
                        <View style={styles.weeklySelfieHeader}>
                          <Ionicons name="camera" size={14} color="#0D9488" />
                          <Text style={styles.weeklySelfieLabel}>Week snapshot</Text>
                        </View>
                        <View style={styles.weeklySelfieImageWrapper}>
                          <Image
                            source={{ uri: photoUri }}
                            style={styles.weeklySelfieImage}
                            resizeMode="cover"
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </View>

          <Animated.View style={{ height: overviewGapValue }} />

          {/* Continue Button */}
          <View style={{ paddingHorizontal: 16 }} onLayout={(e) => { bottomFixedHeight.current = e.nativeEvent.layout.height; }}>
            <Animated.View style={{ opacity: continueOpacity, transform: [{ translateY: continueTranslateY }] }}>
              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.7}
                onPress={() => {
                  navigation?.reset({
                    index: 0,
                    routes: [{ name: 'DashboardMain' }],
                  });
                }}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 20,
  },
  celebrationZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rippleRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
  },
  outerRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
    backgroundColor: '#F0EEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    minHeight: 96,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    top: '20%',
  },

  // Section Card (matching WeeklyReviewScreen)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginLeft: 12,
  },
  sectionContent: {
    gap: 0,
  },

  // Weekly Overview Section
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

  // Daily Breakdown
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

  // Weekly Averages
  weeklyAveragesSection: {
    paddingBottom: 0,
    marginBottom: 0,
  },
  weeklyAveragesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
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

  // Wealth Ratings
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

  // Reflections
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

  // Week Selfie
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

  // Continue Button
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WeeklyTrackingCompleteScreen;
