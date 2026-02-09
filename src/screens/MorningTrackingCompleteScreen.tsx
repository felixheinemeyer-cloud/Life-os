import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStreak } from '../context/StreakContext';
import StreakCelebrationModal from '../components/StreakCelebrationModal';

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

const { width, height } = Dimensions.get('window');

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
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);

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

  // Checkmark icon animations
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(-180)).current;

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

  // Particle animations (12 particles with varied sizes)
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Sequence of animations
    const animationSequence = Animated.sequence([
      // Phase 1: Ring and Sun appear together
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(containerScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),

      // Phase 2: Brief pause to show the sun
      Animated.delay(250),

      // Phase 3: Transform Sun to Checkmark with pulse + ripple
      Animated.parallel([
        // Sun spins and shrinks out
        Animated.timing(sunRotate, {
          toValue: 180,
          duration: 400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sunScale, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(sunOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        // Pulse the container
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
        // Checkmark spins and grows in with bounce
        Animated.sequence([
          Animated.delay(150),
          Animated.parallel([
            Animated.timing(checkmarkRotate, {
              toValue: 0,
              duration: 400,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: true,
            }),
            Animated.spring(checkmarkScale, {
              toValue: 1,
              friction: 3,
              tension: 100,
              useNativeDriver: true,
            }),
            Animated.timing(checkmarkOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Ripple ring expands outward
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
      ]),
    ]);

    // Text animations (start after sun-to-checkmark transform)
    const textAnimations = Animated.sequence([
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtextOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(subtextTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Pause to let user read the text
      Animated.delay(400),
    ]);

    // Start all animations, then transition to overview
    Animated.parallel([animationSequence, textAnimations]).start(() => {
      // Position icon and cards to match evening screen layout
      const targetIconCenterY = containerHeight.current * 0.10;
      const iconVisualBottom = targetIconCenterY + 44; // half of scaled animation container (160 * 0.55 / 2)
      const cardsTargetTop = iconVisualBottom + 16;
      const spacer = Math.max(0, containerHeight.current - 16 - overviewCardsHeight.current - bottomFixedHeight.current - cardsTargetTop);
      overviewGapValue.setValue(spacer);

      // Phase 1: Icon transition (shrink + move up + text fade out)
      Animated.parallel([
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
          toValue: targetIconCenterY - iconCenterY.current,
          duration: 600,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 2: Staggered card reveals with completion celebrations
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
          // Continue button + confetti + breathing all start together
          Animated.parallel([
            Animated.timing(continueOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(continueTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]).start();

          // Confetti particles
          Animated.sequence([
            Animated.stagger(
              40,
              particles.map((particle, index) => {
                const angle = (index / particles.length) * 2 * Math.PI + (Math.random() * 0.3 - 0.15);
                const distance = 70 + Math.random() * 60;
                return Animated.parallel([
                  Animated.timing(particle.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
                  Animated.spring(particle.scale, { toValue: 0.6 + Math.random() * 0.8, friction: 5, tension: 80, useNativeDriver: true }),
                  Animated.timing(particle.translateX, { toValue: Math.cos(angle) * distance, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                  Animated.timing(particle.translateY, { toValue: Math.sin(angle) * distance, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                ]);
              })
            ),
            Animated.parallel(
              particles.map((particle) =>
                Animated.timing(particle.opacity, { toValue: 0, duration: 400, useNativeDriver: true })
              )
            ),
          ]).start();

          // Gentle breathing pulse
          Animated.loop(
            Animated.sequence([
              Animated.timing(breatheScale, { toValue: 1.04, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
              Animated.timing(breatheScale, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
          ).start();
        });
      });
    });

    // Trigger haptic when transformation completes
    const hapticTimer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);

    // Record check-in and potentially show streak modal
    const recordStreak = async () => {
      const streakIncremented = await recordCheckIn();
      if (streakIncremented) {
        setNewStreakCount(streakData.currentStreak + 1);
        setTimeout(() => {
          setShowStreakModal(true);
        }, 2500);
      }
    };

    recordStreak();

    return () => {
      clearTimeout(hapticTimer);
    };
  }, [navigation]);

  // Warm morning colors for particles
  const particleColors = ['#7C3AED', '#A78BFA', '#C4B5FD', '#6366F1', '#818CF8', '#DDD6FE', '#EDE9FE', '#8B5CF6', '#7C3AED', '#C4B5FD', '#A78BFA', '#6366F1'];

  // Interpolate rotation values
  const sunRotateInterpolate = sunRotate.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const checkmarkRotateInterpolate = checkmarkRotate.interpolate({
    inputRange: [-180, 0],
    outputRange: ['-180deg', '0deg'],
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
          <View onLayout={(e) => { iconCenterY.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2; }}>
            <Animated.View style={[styles.animationContainer, { transform: [{ scale: iconShrinkScale }] }]}>
            {/* Particles */}
            {particles.map((particle, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    backgroundColor: particleColors[index % particleColors.length],
                    opacity: particle.opacity,
                    transform: [
                      { scale: particle.scale },
                      { translateX: particle.translateX },
                      { translateY: particle.translateY },
                    ],
                  },
                ]}
              />
            ))}

            {/* Ripple Ring */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
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
                  opacity: containerOpacity,
                  transform: [
                    { scale: Animated.multiply(Animated.multiply(containerScale, pulseScale), breatheScale) },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#6D28D9', '#7C3AED', '#8B5CF6']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Sun Icon (fades/rotates out) */}
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    {
                      opacity: sunOpacity,
                      transform: [
                        { scale: sunScale },
                        { rotate: sunRotateInterpolate },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="sunny" size={56} color="#FFFFFF" />
                </Animated.View>

                {/* Checkmark Icon (fades/rotates in) */}
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    styles.iconOverlay,
                    {
                      opacity: checkmarkOpacity,
                      transform: [
                        { scale: checkmarkScale },
                        { rotate: checkmarkRotateInterpolate },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={56} color="#FFFFFF" />
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
          </View>

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
              Check-in Complete!
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
              Great job starting your day{'\n'}with intention. Go crush it!
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Bottom Section: Overview + Continue */}
        <View
          onLayout={(e) => { bottomSectionHeight.current = e.nativeEvent.layout.height; }}
          style={styles.bottomSection}
        >
          {/* Overview Cards Group */}
          <View onLayout={(e) => { overviewCardsHeight.current = e.nativeEvent.layout.height; }}>
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
              <View style={[
                styles.gratitudeCard,
                { borderLeftColor: gratitudeText && gratitudeText.trim().length > 0 ? '#F59E0B' : '#D1D5DB' },
              ]}>
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
                  <Text style={styles.cardTextCompleted} numberOfLines={2}>
                    {gratitudeText.trim()}
                  </Text>
                )}
              </View>
            </Animated.View>

            {/* Today's Priority Card */}
            <Animated.View style={{ opacity: card3Opacity, transform: [{ translateY: card3TranslateY }, { scale: card3Scale }] }}>
              <View style={[
                styles.priorityCard,
                { borderLeftColor: intentionText && intentionText.trim().length > 0 ? '#D97706' : '#D1D5DB' },
              ]}>
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
                  <Text style={styles.cardTextCompleted}>
                    {intentionText.trim()}
                  </Text>
                )}
              </View>
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
          </View>

          {/* Dynamic spacer to center overview cards */}
          <Animated.View style={{ height: overviewGapValue }} />

          {/* Bottom Fixed Group */}
          <View
            onLayout={(e) => { bottomFixedHeight.current = e.nativeEvent.layout.height; }}
          >
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
        </View>
      </View>

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        visible={showStreakModal}
        streakCount={newStreakCount}
        onClose={() => {
          setShowStreakModal(false);
          navigation?.reset({
            index: 0,
            routes: [{ name: 'DashboardMain', params: { morningCheckInJustCompleted: true } }],
          });
        }}
      />
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
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  rippleRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#C4B5FD',
  },
  outerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#C4B5FD',
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOverlay: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textContainer: {
    alignItems: 'center',
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
    left: 16,
    right: 16,
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
});

export default MorningTrackingCompleteScreen;
