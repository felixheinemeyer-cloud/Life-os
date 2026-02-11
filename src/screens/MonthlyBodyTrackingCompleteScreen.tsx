import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import {
  SectionCard,
  MetricRow,
  SliderRatingBar,
  SingleChoiceSection,
  TextSection,
  WhatHelpedSection,
  SimplePhotoWeightRow,
  RatingsSectionTitle,
  CombinedChart,
  generateChartMockData,
  ChartMetricType,
} from '../components/tracking/BodyCheckInShared';

interface MonthlyBodyTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string; params?: Record<string, unknown> }[] }) => void;
  };
  route?: {
    params?: {
      weight?: string;
      weightUnit?: 'kg' | 'lbs';
      measurements?: string;
      overallHealth?: number;
      skinQuality?: number;
      activityLevel?: string | null;
      healthNotes?: string;
      photoUri?: string | null;
      promise?: string;
      mentalClarity?: number;
      emotionalBalance?: number;
      motivation?: number;
      mentalLoadLevel?: string | null;
      primaryDrain?: string | null;
      selectedHelpers?: string[];
    };
  };
}

// --- Mock data for monthly averages ---

const mockAverages = {
  energy: { value: 7.2, trend: 4 },
  sleep: { value: 7.5, trend: 2 },
  satisfaction: { value: 7.0, trend: -1 },
  nutrition: { value: 7.3, trend: 3 },
};

// --- Data Mapping Helpers ---

const ACTIVITY_LEVEL_MAP: Record<string, { label: string; icon: string; description: string }> = {
  'sedentary': { label: 'Sedentary', icon: 'desktop-outline', description: 'Mostly sitting, minimal movement' },
  'light': { label: 'Lightly Active', icon: 'walk-outline', description: 'Some walking and light activities' },
  'moderate': { label: 'Moderately Active', icon: 'body-outline', description: 'Regular movement throughout the day' },
  'active': { label: 'Active', icon: 'bicycle-outline', description: 'Consistent exercise and movement' },
  'very_active': { label: 'Very Active', icon: 'flame-outline', description: 'High activity most days' },
};

const MENTAL_LOAD_MAP: Record<string, { label: string; icon: string; description: string }> = {
  'calm': { label: 'Mostly Calm', icon: 'leaf-outline', description: 'Plenty of mental space' },
  'manageable': { label: 'Busy but Manageable', icon: 'list-outline', description: 'Full schedule, but coping well' },
  'overloaded': { label: 'Mentally Overloaded', icon: 'cloudy-outline', description: 'Too much on my plate' },
  'stressed': { label: 'Constantly Stressed', icon: 'thunderstorm-outline', description: 'Reactive and overwhelmed' },
};

const DRAIN_MAP: Record<string, { label: string; icon: string; description: string }> = {
  'work_pressure': { label: 'Work / Study Pressure', icon: 'briefcase-outline', description: 'Deadlines, demands, expectations' },
  'social_overload': { label: 'Social Overload', icon: 'people-outline', description: 'Too many interactions or obligations' },
  'lack_of_structure': { label: 'Lack of Structure', icon: 'grid-outline', description: 'No routine, feeling scattered' },
  'constant_notifications': { label: 'Constant Notifications', icon: 'notifications-outline', description: 'Digital interruptions and distractions' },
  'uncertainty': { label: 'Uncertainty / Worrying', icon: 'help-circle-outline', description: 'Anxious thoughts about the future' },
  'physical_exhaustion': { label: 'Physical Exhaustion', icon: 'battery-dead-outline', description: 'Body fatigue affecting the mind' },
};

const HELPER_MAP: Record<string, { label: string; icon: string }> = {
  'good_sleep': { label: 'Good Sleep', icon: 'moon-outline' },
  'time_alone': { label: 'Time Alone', icon: 'person-outline' },
  'meaningful_conversations': { label: 'Conversations', icon: 'chatbubbles-outline' },
  'physical_movement': { label: 'Movement', icon: 'fitness-outline' },
  'nature': { label: 'Nature', icon: 'leaf-outline' },
  'creative_time': { label: 'Creative Time', icon: 'color-palette-outline' },
  'digital_breaks': { label: 'Digital Breaks', icon: 'phone-portrait-outline' },
};

const getInfo = (key: string | null, map: Record<string, { label: string; icon: string; description: string }>) => {
  if (!key) return null;
  // Try exact match, then lowercase, then as-is display
  return map[key] || map[key.toLowerCase()] || { label: key, icon: 'help-circle', description: key };
};

const getHelperDisplay = (key: string) => {
  const mapped = HELPER_MAP[key] || HELPER_MAP[key.toLowerCase()];
  if (mapped) return mapped;
  const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label, icon: 'checkmark-circle-outline' };
};

// --- Main Screen ---

const MonthlyBodyTrackingCompleteScreen: React.FC<MonthlyBodyTrackingCompleteScreenProps> = ({
  navigation,
  route,
}) => {
  const weight = route?.params?.weight ?? '';
  const weightUnit = route?.params?.weightUnit ?? 'kg';
  const overallHealth = route?.params?.overallHealth ?? 0;
  const skinQuality = route?.params?.skinQuality ?? 0;
  const activityLevel = route?.params?.activityLevel ?? null;
  const healthNotes = route?.params?.healthNotes ?? '';
  const photoUri = route?.params?.photoUri ?? null;
  const promise = route?.params?.promise ?? '';
  const mentalClarity = route?.params?.mentalClarity ?? 0;
  const emotionalBalance = route?.params?.emotionalBalance ?? 0;
  const motivation = route?.params?.motivation ?? 0;
  const mentalLoadLevel = route?.params?.mentalLoadLevel ?? null;
  const primaryDrain = route?.params?.primaryDrain ?? null;
  const selectedHelpers = (route?.params?.selectedHelpers ?? []).filter(h => h !== 'nothing');

  // Chart state
  const [activeChartMetrics, setActiveChartMetrics] = useState<Set<ChartMetricType>>(new Set(['sleep', 'energy', 'nutrition']));
  const chartData = useMemo(() => generateChartMockData(), []);
  const handleToggleChartMetric = useCallback((metric: ChartMetricType) => {
    setActiveChartMetrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(metric)) {
        if (newSet.size > 1) newSet.delete(metric);
      } else {
        newSet.add(metric);
      }
      return newSet;
    });
  }, []);

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
          // Card 1: Body Summary
          fadeIn(card1Opacity, card1TranslateY),
          completionBounce(card1Scale),
          (() => { setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay += 300); return Animated.delay(200); })(),
          // Card 2: Body Reflection
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

    // Start intro, then proceed to overview
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

  // Theme colors — Sky Blue
  const gradientColors: [string, string, string] = ['#BAE6FD', '#38BDF8', '#0EA5E9'];
  const ringColor = '#38BDF8';
  const shadowColorValue = '#0EA5E9';

  // Determine which sections have data for Card 2
  const hasPhoto = !!photoUri;
  const hasWeight = !!weight;
  const hasHealthRatings = overallHealth > 0 || skinQuality > 0;
  const hasActivityLevel = !!activityLevel;
  const hasHealthNotes = !!healthNotes;
  const hasPromise = !!promise;
  const hasMentalWellness = mentalClarity > 0 || emotionalBalance > 0 || motivation > 0;
  const hasMentalLoad = !!mentalLoadLevel;
  const hasPrimaryDrain = !!primaryDrain;
  const hasHelpers = selectedHelpers.length > 0;

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
                    <Ionicons name="body" size={72} color="#0EA5E9" />
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
              Body Check-In Complete!
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
              {'Great job tracking your body.\nStay consistent!'}
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Bottom Section: Overview + Continue */}
        <View style={styles.bottomSection}>
          <Animated.View style={{ height: overviewTopGapValue }} />

          {/* Overview Cards in ScrollView */}
          <View style={{ flex: 1 }} onLayout={(e) => { overviewCardsHeight.current = e.nativeEvent.layout.height; }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, paddingHorizontal: 16 }}>
              {/* Card 1: Body Summary */}
              <Animated.View style={{ opacity: card1Opacity, transform: [{ translateY: card1TranslateY }, { scale: card1Scale }] }}>
                <SectionCard title="Body Summary">
                  <CombinedChart data={chartData} activeMetrics={activeChartMetrics} onToggleMetric={handleToggleChartMetric} />
                  <RatingsSectionTitle title="Monthly Averages" withBorder={false} />
                  <MetricRow icon="flash" label="Energy" value={mockAverages.energy.value.toFixed(1)} numericValue={mockAverages.energy.value} maxValue={10} color="#F59E0B" bgColor="#FEF3C7" trend={mockAverages.energy.trend} />
                  <MetricRow icon="moon" label="Sleep" value={`${mockAverages.sleep.value.toFixed(1)}h`} numericValue={mockAverages.sleep.value} maxValue={9} color="#8B5CF6" bgColor="#F3E8FF" trend={mockAverages.sleep.trend} />
                  <MetricRow icon="sparkles" label="Satisfaction" value={mockAverages.satisfaction.value.toFixed(1)} numericValue={mockAverages.satisfaction.value} maxValue={10} color="#3B82F6" bgColor="#DBEAFE" trend={mockAverages.satisfaction.trend} />
                  <MetricRow icon="leaf" label="Nutrition" value={mockAverages.nutrition.value.toFixed(1)} numericValue={mockAverages.nutrition.value} maxValue={10} color="#059669" bgColor="#ECFDF5" trend={mockAverages.nutrition.trend} isLast />
                </SectionCard>
              </Animated.View>

              {/* Card 2: Body Reflection */}
              <Animated.View style={{ opacity: card2Opacity, transform: [{ translateY: card2TranslateY }, { scale: card2Scale }] }}>
                <SectionCard title="Body Reflection">
                  {(hasPhoto || hasWeight) && (
                    <SimplePhotoWeightRow photoUri={photoUri} weight={hasWeight ? weight : undefined} weightUnit={weightUnit} />
                  )}

                  {hasHealthRatings && (
                    <>
                      <RatingsSectionTitle title="Health Ratings" withBorder={hasPhoto || hasWeight} />
                      {overallHealth > 0 && <SliderRatingBar icon="medkit" label="Overall Health" value={overallHealth} color="#0EA5E9" isLast={skinQuality <= 0} />}
                      {skinQuality > 0 && <SliderRatingBar icon="sparkles" label="Skin Quality" value={skinQuality} color="#8B5CF6" isLast />}
                    </>
                  )}

                  {hasActivityLevel && (() => {
                    const info = getInfo(activityLevel, ACTIVITY_LEVEL_MAP)!;
                    return <SingleChoiceSection title="Physical Activity" icon={info.icon as any} selectedLabel={info.label} selectedDescription={info.description} color="#0EA5E9" />;
                  })()}

                  {hasHealthNotes && <TextSection icon="document-text" iconColor="#0EA5E9" title="Health Notes" text={healthNotes} />}

                  {hasPromise && <TextSection icon="heart" iconColor="#0EA5E9" title="One small promise" text={promise} />}

                  {hasMentalWellness && (
                    <>
                      <RatingsSectionTitle title="Mental Wellness" />
                      {mentalClarity > 0 && <SliderRatingBar icon="bulb" label="Mental Clarity" value={mentalClarity} color="#0EA5E9" isLast={emotionalBalance <= 0 && motivation <= 0} />}
                      {emotionalBalance > 0 && <SliderRatingBar icon="swap-horizontal" label="Emotional Balance" value={emotionalBalance} color="#8B5CF6" isLast={motivation <= 0} />}
                      {motivation > 0 && <SliderRatingBar icon="flash" label="Motivation" value={motivation} color="#F59E0B" isLast />}
                    </>
                  )}

                  {hasMentalLoad && (() => {
                    const info = getInfo(mentalLoadLevel, MENTAL_LOAD_MAP)!;
                    return <SingleChoiceSection title="Mental Load" icon={info.icon as any} selectedLabel={info.label} selectedDescription={info.description} color="#0EA5E9" />;
                  })()}

                  {hasPrimaryDrain && (() => {
                    const info = getInfo(primaryDrain, DRAIN_MAP)!;
                    return <SingleChoiceSection title="Energy Drains" icon={info.icon as any} selectedLabel={info.label} selectedDescription={info.description} color="#0EA5E9" />;
                  })()}

                  {hasHelpers && (
                    <WhatHelpedSection helpers={selectedHelpers.map(h => getHelperDisplay(h))} />
                  )}
                </SectionCard>
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

export default MonthlyBodyTrackingCompleteScreen;
