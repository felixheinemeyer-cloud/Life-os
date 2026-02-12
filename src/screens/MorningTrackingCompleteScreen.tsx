import React, { useEffect, useRef, useState } from 'react';
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
import { useStreak } from '../context/StreakContext';

interface MorningTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string; params?: Record<string, unknown> }[] }) => void;
  };
  route?: {
    params?: {
      bedtime?: { hour: number; minute: number };
      wakeTime?: { hour: number; minute: number };
      gratitudeText?: string;
      intentionText?: string;
      mindsetDurationMs?: number;
    };
  };
}

const DIGIT_HEIGHT = 76;

const MorningTrackingCompleteScreen: React.FC<MorningTrackingCompleteScreenProps> = ({
  navigation,
  route,
}) => {
  // Get params from route
  const bedtime = route?.params?.bedtime;
  const wakeTime = route?.params?.wakeTime;
  const gratitudeText = route?.params?.gratitudeText;
  const intentionText = route?.params?.intentionText;
  const mindsetDurationMs = route?.params?.mindsetDurationMs;
  const { streakData, recordCheckIn } = useStreak();

  // Streak inline animation state
  const isFireModeRef = useRef(false);
  const [showStreakNumber, setShowStreakNumber] = useState(false);
  const [titleContent, setTitleContent] = useState('Check-in Complete!');
  const [subtitleContent, setSubtitleContent] = useState('Great job starting your day\nwith intention. Go crush it!');
  const streakWasIncremented = useRef(false);
  const [gratitudeExpanded, setGratitudeExpanded] = useState(false);
  const [priorityExpanded, setPriorityExpanded] = useState(false);
  const newStreakCountRef = useRef(0);
  const streakDigitsRef = useRef<{ old: string[]; new: string[] }>({ old: [], new: [] });

  // Compute sleep duration
  const sleepHours = (() => {
    if (!bedtime || !wakeTime) return null;
    const bedMinutes = bedtime.hour * 60 + bedtime.minute;
    const wakeMinutes = wakeTime.hour * 60 + wakeTime.minute;
    let diff = wakeMinutes - bedMinutes;
    if (diff <= 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return { hours, mins };
  })();

  // Animation values for the icon container
  const containerScale = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Sun icon animations
  const sunScale = useRef(new Animated.Value(1)).current;
  const sunOpacity = useRef(new Animated.Value(1)).current;
  const sunRotate = useRef(new Animated.Value(0)).current;

  // Fire icon animations (for streak phase)
  const fireScale = useRef(new Animated.Value(0)).current;
  const fireOpacity = useRef(new Animated.Value(0)).current;
  const fireRotate = useRef(new Animated.Value(-90)).current;
  const iconContainerRotate = useRef(new Animated.Value(0)).current;

  // Slide animations for overview transition (fire slides left, counter slides right+up)
  const fireSlideX = useRef(new Animated.Value(0)).current;
  const counterSlideX = useRef(new Animated.Value(0)).current;
  const counterSlideY = useRef(new Animated.Value(0)).current;

  // Streak number rolling animation
  const streakNumberOpacity = useRef(new Animated.Value(0)).current;
  const digitRolls = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const streakColorAnim = useRef(new Animated.Value(0)).current;

  // Ring animations
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Pulse effect for transformation
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

  // Celebration shift (moves up to make room for cards)
  const celebrationShiftY = useRef(new Animated.Value(0)).current;

  // Icon shrink when transitioning to overview
  const iconShrinkScale = useRef(new Animated.Value(1)).current;

  // Nudge card animations
  const nudgeOpacity = useRef(new Animated.Value(0)).current;
  const nudgeTranslateY = useRef(new Animated.Value(40)).current;

  // Continue button animations
  const continueOpacity = useRef(new Animated.Value(0)).current;
  const continueTranslateY = useRef(new Animated.Value(20)).current;

  // Layout measurements for centering calculation
  const bottomSectionHeight = useRef(0);
  const containerHeight = useRef(0);
  const iconCenterY = useRef(0);
  const overviewCardsHeight = useRef(0);
  const bottomFixedHeight = useRef(0);
  const overviewGapValue = useRef(new Animated.Value(0)).current;
  const bottomSectionTop = useRef(new Animated.Value(9999)).current;

  // Per-card stagger animations
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(20)).current;
  const card1Scale = useRef(new Animated.Value(1)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(20)).current;
  const card2Scale = useRef(new Animated.Value(1)).current;
  const card3Opacity = useRef(new Animated.Value(0)).current;
  const card3TranslateY = useRef(new Animated.Value(20)).current;
  const card3Scale = useRef(new Animated.Value(1)).current;
  const card4Opacity = useRef(new Animated.Value(0)).current;
  const card4TranslateY = useRef(new Animated.Value(20)).current;
  const card4Scale = useRef(new Animated.Value(1)).current;
  const card5Opacity = useRef(new Animated.Value(0)).current;
  const card5TranslateY = useRef(new Animated.Value(20)).current;
  const card5Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1+2: Ring + sun appear + brief pause
    const introAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        Animated.timing(containerOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(containerScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
      ]),
      Animated.delay(250),
    ]);

    // Overview transition logic (extracted so it can be called after streak phase or directly)
    const proceedToOverview = () => {
      const targetIconCenterY = containerHeight.current * 0.10;
      const iconVisualBottom = targetIconCenterY + 55;
      const cardsTargetTop = iconVisualBottom + 16;
      // Position bottom section: streak visual bottom + 48px gap
      const streakVisualBottom = targetIconCenterY + 6 + 66;
      bottomSectionTop.setValue(streakVisualBottom + 16);

      // Build animations array
      const overviewAnims: Animated.CompositeAnimation[] = [
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtextOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
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
      ];

      // In fire mode, slide fire left and counter right+up independently
      if (isFireModeRef.current) {
        overviewAnims.push(
          Animated.timing(fireSlideX, {
            toValue: -68,
            duration: 600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(counterSlideX, {
            toValue: 92,
            duration: 600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(counterSlideY, {
            toValue: -160,
            duration: 600,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        );
      }

      Animated.parallel(overviewAnims).start(() => {
        // Staggered card reveals with completion celebrations
        const fadeIn = (opacity: Animated.Value, translateY: Animated.Value) => Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]);
        const completionBounce = (scale: Animated.Value) => Animated.sequence([
          Animated.timing(scale, { toValue: 1.04, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        ]);

        const cardAnims: Animated.CompositeAnimation[] = [];
        let hapticDelay = 0;

        // Card 1: Sleep
        if (sleepHours) {
          cardAnims.push(fadeIn(card1Opacity, card1TranslateY));
          hapticDelay += 300;
          cardAnims.push(completionBounce(card1Scale));
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay);
          hapticDelay += 400;
        }

        // Card 2: Gratitude
        cardAnims.push(fadeIn(card2Opacity, card2TranslateY));
        hapticDelay += 300;
        if (gratitudeText && gratitudeText.trim().length > 0) {
          cardAnims.push(completionBounce(card2Scale));
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay);
          hapticDelay += 400;
        } else {
          cardAnims.push(Animated.delay(400));
          hapticDelay += 400;
        }

        // Card 3: Today's Priority
        cardAnims.push(fadeIn(card3Opacity, card3TranslateY));
        hapticDelay += 300;
        if (intentionText && intentionText.trim().length > 0) {
          cardAnims.push(completionBounce(card3Scale));
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay);
          hapticDelay += 400;
        } else {
          cardAnims.push(Animated.delay(400));
          hapticDelay += 400;
        }

        // Card 4: Mindset
        if (mindsetDurationMs && mindsetDurationMs > 0) {
          cardAnims.push(fadeIn(card4Opacity, card4TranslateY));
          hapticDelay += 300;
          cardAnims.push(completionBounce(card4Scale));
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay);
          hapticDelay += 400;
        }

        Animated.sequence(cardAnims).start(() => {
          // Nudge card + continue button + breathing start together
          Animated.parallel([
            Animated.timing(nudgeOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(nudgeTranslateY, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
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

    // Record check-in immediately, store promise for later
    const streakPromise = (async () => {
      const incremented = await recordCheckIn();
      streakWasIncremented.current = incremented;
      if (incremented) {
        newStreakCountRef.current = streakData.currentStreak + 1;
      }
      return incremented;
    })();

    // Light haptic on intro
    const hapticTimer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 400);

    // Start intro, then branch based on streak result
    introAnimation.start(async () => {
      const incremented = await streakPromise;

      if (incremented) {
        // === STREAK PATH: Sun → Fire directly ===
        const count = newStreakCountRef.current;
        const oldCount = Math.max(count - 1, 0);
        const newStr = String(count);
        const oldStr = String(oldCount).padStart(newStr.length, ' ');
        const oldDigits = oldStr.split('');
        const newDigits = newStr.split('');
        streakDigitsRef.current = { old: oldDigits, new: newDigits };
        setShowStreakNumber(true);
        setSubtitleContent(
          count === 1 ? "You've started your streak!" :
          count < 7 ? 'Keep going!' :
          count < 30 ? "You're on fire!" :
          'Legendary consistency!'
        );
        isFireModeRef.current = true;

        // Reset animation values
        iconContainerRotate.setValue(0);
        rippleScale.setValue(1);
        rippleOpacity.setValue(0);
        streakNumberOpacity.setValue(0);
        streakColorAnim.setValue(0);
        digitRolls.forEach(d => d.setValue(0));

        // Build per-digit roll animations
        const digitAnimations = newDigits.map((newD, i) => {
          if (oldDigits[i] !== newD) {
            return Animated.timing(digitRolls[i], {
              toValue: -DIGIT_HEIGHT,
              duration: 1000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            });
          }
          return Animated.delay(0);
        });

        // Sun+Container → Fire transition via Y-axis spin
        Animated.parallel([
          // Whole gradient circle (with sun inside) spins on Y-axis to edge-on
          Animated.timing(iconContainerRotate, {
            toValue: 90,
            duration: 550,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          // Ring fades out in sync
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
          // Snap container invisible after reaching edge-on
          Animated.sequence([
            Animated.delay(520),
            Animated.timing(containerOpacity, {
              toValue: 0,
              duration: 30,
              useNativeDriver: true,
            }),
          ]),
          // Pulse at crossover
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(pulseScale, {
              toValue: 1.15,
              duration: 200,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(pulseScale, {
              toValue: 1,
              friction: 5,
              tension: 80,
              useNativeDriver: true,
            }),
          ]),
          // Flame spins in from opposite Y-axis side
          Animated.sequence([
            Animated.delay(480),
            Animated.parallel([
              Animated.timing(fireOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(fireScale, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
              }),
              Animated.timing(fireRotate, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ]),
          // Ripple ring with fire colors
          Animated.sequence([
            Animated.delay(250),
            Animated.parallel([
              Animated.timing(rippleOpacity, {
                toValue: 0.6,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(rippleScale, {
                toValue: 1.8,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.delay(150),
                Animated.timing(rippleOpacity, {
                  toValue: 0,
                  duration: 450,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]),
          // Streak number rolling animation
          Animated.sequence([
            Animated.delay(300),
            Animated.timing(streakNumberOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.delay(700),
            Animated.parallel([
              ...digitAnimations,
              Animated.timing(streakColorAnim, {
                toValue: 1,
                duration: 1000,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }),
            ]),
            Animated.parallel([
              Animated.timing(subtextOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
              Animated.timing(subtextTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
          ]),
        ]).start(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => proceedToOverview(), 800);
        });
      } else {
        // === NON-STREAK PATH: Sun stays, outer ring expands + fades → text → overview ===
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
          // Outer ring expands and fades (becomes the ripple)
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
      }
    });

    return () => {
      clearTimeout(hapticTimer);
    };
  }, [navigation]);

  // Theme colors (always use morning gold — fire colors are on the flameStack itself)
  const gradientColors: [string, string, string] = ['#FBBF24', '#F59E0B', '#D97706'];
  const ringColor = '#FCD34D';
  const shadowColor = '#D97706';

  // Interpolate rotation values (Y-axis coin-flip)
  const sunRotateInterpolate = sunRotate.interpolate({
    inputRange: [0, 90],
    outputRange: ['0deg', '90deg'],
  });

  const fireRotateInterpolate = fireRotate.interpolate({
    inputRange: [-90, 0],
    outputRange: ['-90deg', '0deg'],
  });

  const iconContainerRotateInterpolate = iconContainerRotate.interpolate({
    inputRange: [0, 90],
    outputRange: ['0deg', '90deg'],
  });

  // Streak number color interpolations (gray → fire)
  const streakDigitColor = streakColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9CA3AF', '#E56B3E'],
  });
  const streakShadowColor = streakColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(156, 163, 175, 0)', 'rgba(229, 107, 62, 0.25)'],
  });
  const streakLabelColor = streakColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9CA3AF', '#C0714A'],
  });

  // Format time for display
  const formatTime = (time: { hour: number; minute: number }) => {
    const h = time.hour % 12 || 12;
    const m = time.minute.toString().padStart(2, '0');
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    return `${h}:${m} ${ampm}`;
  };

  // Format mindset duration
  const formatMindsetDuration = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} onLayout={(e) => { containerHeight.current = e.nativeEvent.layout.height; }}>
        {/* Celebration Zone — starts centered, shifts up */}
        <Animated.View style={[styles.celebrationZone, { transform: [{ translateY: celebrationShiftY }] }]}>
          <Animated.View
            onLayout={(e) => { iconCenterY.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2; }}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: iconShrinkScale }],
            }}
          >
            <Animated.View style={[styles.animationContainer, { transform: [{ translateX: fireSlideX }] }]}>
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
                  shadowColor: shadowColor,
                  opacity: containerOpacity,
                  transform: [
                    { perspective: 800 },
                    { scale: Animated.multiply(Animated.multiply(containerScale, pulseScale), breatheScale) },
                    { rotateY: iconContainerRotateInterpolate },
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
                  {/* Sun Icon (flips out on Y-axis) */}
                  <Animated.View
                    style={[
                      styles.iconWrapper,
                      {
                        opacity: sunOpacity,
                        transform: [
                          { perspective: 800 },
                          { scale: sunScale },
                          { rotateY: sunRotateInterpolate },
                        ],
                      },
                    ]}
                  >
                    <Ionicons name="sunny" size={72} color="#D97706" />
                  </Animated.View>

                </View>
              </LinearGradient>
            </Animated.View>

            {/* Flame Stack (flips in on Y-axis during streak phase) */}
            <Animated.View
              style={[
                styles.flameStack,
                {
                  opacity: fireOpacity,
                  transform: [
                    { translateY: 5 },
                    { perspective: 800 },
                    { scale: Animated.multiply(Animated.multiply(fireScale, pulseScale), breatheScale) },
                    { rotateY: fireRotateInterpolate },
                  ],
                },
              ]}
            >
              <View style={styles.flameOuterGlow} />
              <View style={styles.flameInnerGlow} />
              <View style={styles.flameLayer}>
                <Ionicons name="flame" size={114} color="#FFD166" />
              </View>
              <View style={[styles.flameLayer, { top: 5 }]}>
                <Ionicons name="flame" size={108} color="#FF9F43" />
              </View>
              <View style={[styles.flameLayer, { top: 10 }]}>
                <Ionicons name="flame" size={102} color="#EE7B4D" />
              </View>
            </Animated.View>
          </Animated.View>

            {/* Streak counter (inside scaled wrapper so it shrinks with icon) */}
            {showStreakNumber && (
              <Animated.View style={[styles.streakNumberWrapper, { opacity: streakNumberOpacity, transform: [{ translateX: counterSlideX }, { translateY: counterSlideY }] }]}>
                <View style={styles.digitsRow}>
                  {streakDigitsRef.current.new.map((newDigit, i) => {
                    const oldDigit = streakDigitsRef.current.old[i];
                    const changed = oldDigit !== newDigit;
                    return (
                      <View key={i} style={styles.digitClip}>
                        {changed ? (
                          <Animated.View style={{ transform: [{ translateY: digitRolls[i] }] }}>
                            <Animated.Text style={[styles.streakDigit, { color: oldDigit === ' ' ? 'transparent' : streakDigitColor, textShadowColor: streakShadowColor }]}>
                              {oldDigit === ' ' ? '0' : oldDigit}
                            </Animated.Text>
                            <Animated.Text style={[styles.streakDigit, { color: streakDigitColor, textShadowColor: streakShadowColor }]}>
                              {newDigit}
                            </Animated.Text>
                          </Animated.View>
                        ) : (
                          <Animated.Text style={[styles.streakDigit, { color: streakDigitColor, textShadowColor: streakShadowColor }]}>
                            {newDigit}
                          </Animated.Text>
                        )}
                      </View>
                    );
                  })}
                </View>
                <Animated.Text style={[styles.streakLabelText, { color: streakLabelColor }]}>day streak</Animated.Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Text Content (outside scaled wrapper) */}
          <View style={styles.textContainer}>
            <Animated.Text
              style={[
                styles.titleText,
                {
                  opacity: showStreakNumber ? 0 : textOpacity,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}
            >
              {titleContent}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.subtitleText,
                {
                  opacity: subtextOpacity,
                  transform: [{ translateY: showStreakNumber ? 68 : subtextTranslateY }],
                },
              ]}
            >
              {subtitleContent}
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Bottom Section: Overview + Continue */}
        <Animated.View
          onLayout={(e) => { bottomSectionHeight.current = e.nativeEvent.layout.height; }}
          style={[styles.bottomSection, { top: bottomSectionTop }]}
        >
          {/* Overview Cards Group - scrollable if content overflows */}
          <ScrollView
            style={{ flex: 1, marginBottom: 16 }}
            contentContainerStyle={{ paddingBottom: 4, paddingHorizontal: 16, flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            nestedScrollEnabled
            overScrollMode="never"
          >
            {/* Sleep Card - DailyOverview style */}
            {sleepHours ? (
              <Animated.View style={{ opacity: card1Opacity, transform: [{ translateY: card1TranslateY }, { scale: card1Scale }] }}>
                <View style={styles.sleepCard}>
                  <View style={styles.sleepRow}>
                    <View style={styles.sleepTimeColumn}>
                      <LinearGradient
                        colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                        style={styles.sleepIconRing}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.sleepIconInner}>
                          <Ionicons name="moon" size={16} color="#7C3AED" />
                        </View>
                      </LinearGradient>
                      <Text style={styles.sleepTimeValue}>{formatTime(bedtime!)}</Text>
                      <Text style={styles.sleepTimeLabel}>Bedtime</Text>
                    </View>

                    <View style={styles.sleepDurationCenter}>
                      <View style={styles.sleepConnector} />
                      <View style={styles.sleepDurationBadge}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.sleepDurationText}>{sleepHours.hours}h {sleepHours.mins > 0 ? `${sleepHours.mins}m` : ''}</Text>
                      </View>
                      <View style={styles.sleepConnector} />
                    </View>

                    <View style={styles.sleepTimeColumn}>
                      <LinearGradient
                        colors={['#FBBF24', '#F59E0B', '#D97706']}
                        style={styles.sleepIconRing}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.sleepIconInner}>
                          <Ionicons name="sunny" size={16} color="#D97706" />
                        </View>
                      </LinearGradient>
                      <Text style={styles.sleepTimeValue}>{formatTime(wakeTime!)}</Text>
                      <Text style={styles.sleepTimeLabel}>Wake up</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* Gratitude Card */}
            <Animated.View style={{ opacity: card2Opacity, transform: [{ translateY: card2TranslateY }, { scale: card2Scale }] }}>
              <TouchableOpacity
                activeOpacity={gratitudeText && gratitudeText.trim().length > 0 ? 0.7 : 1}
                onPress={() => { if (gratitudeText && gratitudeText.trim().length > 0) setGratitudeExpanded(prev => !prev); }}
                style={[
                  styles.gratitudeCard,
                  { borderLeftColor: gratitudeText && gratitudeText.trim().length > 0 ? '#F59E0B' : '#D1D5DB' },
                ]}
              >
                <View style={[styles.cardHeader, !(gratitudeText && gratitudeText.trim().length > 0) && { marginBottom: 0 }]}>
                  <Ionicons
                    name={gratitudeText && gratitudeText.trim().length > 0 ? 'heart' : 'heart-outline'}
                    size={14}
                    color={gratitudeText && gratitudeText.trim().length > 0 ? '#D97706' : '#9CA3AF'}
                  />
                  <Text style={[styles.cardLabel, { flex: 1, color: gratitudeText && gratitudeText.trim().length > 0 ? '#D97706' : '#9CA3AF' }]}>
                    {gratitudeText && gratitudeText.trim().length > 0 ? 'Gratitude Added' : 'Gratitude'}
                  </Text>
                  {!(gratitudeText && gratitudeText.trim().length > 0) && (
                    <View style={styles.skippedBadge}>
                      <Text style={styles.skippedBadgeText}>Skipped</Text>
                    </View>
                  )}
                </View>
                {gratitudeText && gratitudeText.trim().length > 0 && (
                  <Text
                    style={styles.cardTextCompleted}
                    numberOfLines={gratitudeExpanded ? undefined : 3}
                  >
                    {gratitudeText.trim()}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Today's Priority Card */}
            <Animated.View style={{ opacity: card3Opacity, transform: [{ translateY: card3TranslateY }, { scale: card3Scale }] }}>
              <TouchableOpacity
                activeOpacity={intentionText && intentionText.trim().length > 0 ? 0.7 : 1}
                onPress={() => { if (intentionText && intentionText.trim().length > 0) setPriorityExpanded(prev => !prev); }}
                style={[
                  styles.priorityCard,
                  { borderLeftColor: intentionText && intentionText.trim().length > 0 ? '#D97706' : '#D1D5DB' },
                ]}
              >
                <View style={[styles.cardHeader, !(intentionText && intentionText.trim().length > 0) && { marginBottom: 0 }]}>
                  <Ionicons
                    name={intentionText && intentionText.trim().length > 0 ? 'flag' : 'flag-outline'}
                    size={14}
                    color={intentionText && intentionText.trim().length > 0 ? '#D97706' : '#9CA3AF'}
                  />
                  <Text style={[styles.cardLabel, { flex: 1, color: intentionText && intentionText.trim().length > 0 ? '#D97706' : '#9CA3AF' }]}>
                    Today's Priority
                  </Text>
                  {!(intentionText && intentionText.trim().length > 0) && (
                    <View style={styles.skippedBadge}>
                      <Text style={styles.skippedBadgeText}>Skipped</Text>
                    </View>
                  )}
                </View>
                {intentionText && intentionText.trim().length > 0 && (
                  <Text
                    style={styles.cardTextCompleted}
                    numberOfLines={priorityExpanded ? undefined : 3}
                  >
                    {intentionText.trim()}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Mindset Card */}
            {mindsetDurationMs && mindsetDurationMs > 0 ? (
              <Animated.View style={{ opacity: card4Opacity, transform: [{ translateY: card4TranslateY }, { scale: card4Scale }] }}>
                <View style={[styles.mindsetCard, { borderLeftColor: '#F59E0B' }]}>
                  <View style={[styles.cardHeader, { marginBottom: 0 }]}>
                    <Ionicons name="analytics" size={14} color="#D97706" />
                    <Text style={[styles.cardLabel, { flex: 1, color: '#D97706' }]}>
                      Mindset Training
                    </Text>
                    <Text style={styles.mindsetDurationValue}>{formatMindsetDuration(mindsetDurationMs)}</Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </ScrollView>

          {/* Bottom Fixed Group */}
          <View
            style={{ paddingHorizontal: 16 }}
            onLayout={(e) => { bottomFixedHeight.current = e.nativeEvent.layout.height; }}
          >
            {/* Good Luck Nudge */}
            <Animated.View style={{ opacity: nudgeOpacity, transform: [{ translateY: nudgeTranslateY }] }}>
              <View style={styles.nudgeCard}>
                <View style={styles.nudgeContent}>
                  <View style={styles.nudgeIconRow}>
                    <View style={styles.nudgeIconCircle}>
                      <Ionicons name="flash" size={16} color="#D97706" />
                    </View>
                    <Text style={styles.nudgeLabel}>Go get it</Text>
                  </View>
                  <Text style={styles.nudgeText}>
                    Amazing work! You're already ahead - the day is yours.
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: continueOpacity, transform: [{ translateY: continueTranslateY }] }}>
              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.7}
                onPress={() => {
                  navigation?.reset({
                    index: 0,
                    routes: [{ name: 'DashboardMain', params: { morningCheckInJustCompleted: true } }],
                  });
                }}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
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
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameStack: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameOuterGlow: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: '#FFF0E5',
  },
  flameInnerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE4D4',
  },
  flameLayer: {
    position: 'absolute',
    alignItems: 'center',
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
  },
  sleepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  gratitudeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  priorityText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardTextCompleted: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sleepTimeColumn: {
    alignItems: 'center',
    flex: 1,
  },
  sleepIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  sleepIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepTimeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  sleepTimeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sleepDurationCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  sleepConnector: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  sleepDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sleepDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  mindsetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mindsetDurationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: -0.2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skippedBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skippedBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  nudgeCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  nudgeContent: {
    padding: 12,
    alignItems: 'center',
  },
  nudgeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nudgeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  nudgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nudgeText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  streakNumberWrapper: {
    position: 'absolute',
    top: 212,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitClip: {
    height: 76,
    overflow: 'hidden',
  },
  streakDigit: {
    fontSize: 64,
    fontWeight: '800',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    height: 76,
    lineHeight: 76,
    textAlign: 'center',
    width: 42,
  },
  streakLabelText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

export default MorningTrackingCompleteScreen;
