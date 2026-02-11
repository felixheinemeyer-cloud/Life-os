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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface MonthlyTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string; params?: Record<string, unknown> }[] }) => void;
  };
  route?: {
    params?: {
      keyLearning?: string;
      lostSightOf?: string;
      proudMoment?: string;
      messageToSelf?: string;
    };
  };
}

// --- Mock data ---

interface WealthAreaData {
  score: number;
  trend: number;
}

interface MonthlySummaryData {
  overallScore: number;
  overallTrend: number;
  wealthAverages: {
    physical: WealthAreaData;
    social: WealthAreaData;
    mental: WealthAreaData;
    financial: WealthAreaData;
    time: WealthAreaData;
  };
}

const mockSummaryData: MonthlySummaryData = {
  overallScore: 7.1,
  overallTrend: 5,
  wealthAverages: {
    physical: { score: 7.2, trend: 5 },
    social: { score: 7.0, trend: -3 },
    mental: { score: 6.8, trend: 8 },
    financial: { score: 7.5, trend: 2 },
    time: { score: 7.0, trend: -1 },
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

const getBgColor = (color: string): string => {
  switch (color) {
    case '#059669': return '#ECFDF5';
    case '#8B5CF6': return '#F3E8FF';
    case '#3B82F6': return '#EFF6FF';
    case '#EAB308': return '#FEF9C3';
    case '#FB923C': return '#FFF7ED';
    default: return '#F3F4F6';
  }
};

// --- Sub-components ---

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
          <SvgLinearGradient id="monthlyScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E8EAED" strokeWidth={strokeWidth} fill="transparent" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#monthlyScoreGradient)" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" />
      </Svg>
    </View>
  );
};

interface WealthAreaRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  trend: number;
  isLast?: boolean;
}

const WealthAreaRow: React.FC<WealthAreaRowProps> = ({
  icon, label, value, color, trend, isLast,
}) => {
  const percentage = Math.min(value / 10, 1) * 100;
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
            <View style={[styles.wealthAreaProgressFill, { width: `${percentage}%`, backgroundColor: color }]} />
          </View>
          <Text style={[styles.wealthAreaTrend, { color: getTrendColor() }]}>{getTrendLabel()}</Text>
        </View>
      </View>
    </View>
  );
};

// --- Main Screen ---

const MonthlyTrackingCompleteScreen: React.FC<MonthlyTrackingCompleteScreenProps> = ({
  navigation,
  route,
}) => {
  const keyLearning = route?.params?.keyLearning ?? '';
  const lostSightOf = route?.params?.lostSightOf ?? '';
  const proudMoment = route?.params?.proudMoment ?? '';
  const messageToSelf = route?.params?.messageToSelf ?? '';

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
          // Card 1: Monthly Summary
          fadeIn(card1Opacity, card1TranslateY),
          completionBounce(card1Scale),
          (() => { setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay += 300); return Animated.delay(200); })(),
          // Card 2: Monthly Reflection
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

    // Start intro, then non-streak path -> overview
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
  const gradientColors: [string, string, string] = ['#FBCFE8', '#F472B6', '#DB2777'];
  const ringColor = '#F472B6';
  const shadowColorValue = '#DB2777';

  const rating = getScoreRating(summaryData.overallScore);

  // Build reflection items for card 2
  const reflectionItems: { icon: keyof typeof Ionicons.glyphMap; label: string; text: string }[] = [];
  if (keyLearning) reflectionItems.push({ icon: 'bulb', label: 'Key learning', text: keyLearning });
  if (lostSightOf) reflectionItems.push({ icon: 'eye-off', label: 'Lost sight of', text: lostSightOf });
  if (proudMoment) reflectionItems.push({ icon: 'trophy', label: 'Proud moment', text: proudMoment });
  if (messageToSelf) reflectionItems.push({ icon: 'mail', label: 'Message to self', text: messageToSelf });

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
                    <Ionicons name="calendar" size={72} color="#DB2777" />
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
              Month Complete!
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
              {'Great job reflecting on your month.\nOnward and upward!'}
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Bottom Section: Overview + Continue */}
        <View style={styles.bottomSection}>
          <Animated.View style={{ height: overviewTopGapValue }} />

          {/* Overview Cards in ScrollView */}
          <View style={{ flex: 1 }} onLayout={(e) => { overviewCardsHeight.current = e.nativeEvent.layout.height; }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, paddingHorizontal: 16 }}>
              {/* Card 1: Monthly Summary */}
              <Animated.View style={{ opacity: card1Opacity, transform: [{ translateY: card1TranslateY }, { scale: card1Scale }] }}>
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
                    <Text style={styles.sectionTitle}>Monthly Summary</Text>
                  </View>

                  <View style={styles.sectionContent}>
                    {/* Score Ring + Info */}
                    <View style={styles.scoreSection}>
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
                          <Text style={styles.scoreDescription}>Average across all wealth areas</Text>
                        </View>
                      </View>

                      {/* Overall Trend */}
                      <View style={styles.overallTrendRow}>
                        <Ionicons
                          name={summaryData.overallTrend >= 0 ? 'trending-up' : 'trending-down'}
                          size={16}
                          color={summaryData.overallTrend >= 0 ? '#059669' : '#EF4444'}
                        />
                        <Text style={[styles.overallTrendText, { color: summaryData.overallTrend >= 0 ? '#059669' : '#EF4444' }]}>
                          {summaryData.overallTrend >= 0 ? '+' : ''}{summaryData.overallTrend}% vs last month
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 }} />

                    {/* Wealth Areas */}
                    <View style={styles.wealthAreasSection}>
                      <Text style={styles.wealthAreasTitle}>Wealth Areas</Text>
                      <WealthAreaRow
                        icon="fitness"
                        label="Physical"
                        value={summaryData.wealthAverages.physical.score}
                        color="#059669"
                        trend={summaryData.wealthAverages.physical.trend}
                      />
                      <WealthAreaRow
                        icon="people"
                        label="Social"
                        value={summaryData.wealthAverages.social.score}
                        color="#8B5CF6"
                        trend={summaryData.wealthAverages.social.trend}
                      />
                      <WealthAreaRow
                        icon="bulb"
                        label="Mental"
                        value={summaryData.wealthAverages.mental.score}
                        color="#3B82F6"
                        trend={summaryData.wealthAverages.mental.trend}
                      />
                      <WealthAreaRow
                        icon="bar-chart"
                        label="Financial"
                        value={summaryData.wealthAverages.financial.score}
                        color="#EAB308"
                        trend={summaryData.wealthAverages.financial.trend}
                      />
                      <WealthAreaRow
                        icon="time"
                        label="Time"
                        value={summaryData.wealthAverages.time.score}
                        color="#FB923C"
                        trend={summaryData.wealthAverages.time.trend}
                        isLast
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Card 2: Monthly Reflection */}
              <Animated.View style={{ opacity: card2Opacity, transform: [{ translateY: card2TranslateY }, { scale: card2Scale }] }}>
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
                    <Text style={styles.sectionTitle}>Monthly Reflection</Text>
                  </View>

                  <View style={styles.sectionContent}>
                    <View style={styles.monthlyReflectionsContainer}>
                      {reflectionItems.map((item, index) => (
                        <React.Fragment key={item.label}>
                          {index > 0 && (
                            <View style={styles.monthlyReflectionDivider} />
                          )}
                          <View style={styles.monthlyReflectionItem}>
                            <View style={styles.infoHeader}>
                              <Ionicons name={item.icon} size={16} color="#DB2777" />
                              <Text style={styles.infoLabel}>{item.label}</Text>
                            </View>
                            <Text style={styles.infoText}>{item.text}</Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
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

  // Section Card
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

  // Score Section
  scoreSection: {
    paddingBottom: 16,
    marginBottom: 0,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 0,
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

  // Overall Trend
  overallTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overallTrendText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Wealth Areas
  wealthAreasSection: {
    paddingBottom: 0,
    marginBottom: 0,
  },
  wealthAreasTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
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
    gap: 6,
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

  // Monthly Reflections
  monthlyReflectionsContainer: {
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

export default MonthlyTrackingCompleteScreen;
