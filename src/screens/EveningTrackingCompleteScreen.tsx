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

interface EveningTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string; params?: Record<string, unknown> }[] }) => void;
  };
  route?: {
    params?: {
      priorityCompleted?: boolean;
      morningPriority?: string;
      ratings?: { nutrition: number; energy: number; satisfaction: number };
      journalCompleted?: boolean;
    };
  };
}

const { width, height } = Dimensions.get('window');

const EveningTrackingCompleteScreen: React.FC<EveningTrackingCompleteScreenProps> = ({
  navigation,
  route,
}) => {
  // Get params from route
  const priorityCompleted = route?.params?.priorityCompleted;
  const morningPriority = route?.params?.morningPriority;
  const ratings = route?.params?.ratings;
  const journalCompleted = route?.params?.journalCompleted;
  const { streakData, recordCheckIn } = useStreak();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);

  // Animation values for the icon container
  const containerScale = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Moon icon animations
  const moonScale = useRef(new Animated.Value(1)).current;
  const moonOpacity = useRef(new Animated.Value(1)).current;
  const moonRotate = useRef(new Animated.Value(0)).current;

  // Checkmark icon animations
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(-180)).current;

  // Ring animations
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  // Pulse effect for transformation
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Ripple ring (expands and fades after checkmark lands)
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // Breathing glow after settle
  const breatheScale = useRef(new Animated.Value(1)).current;

  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const subtextTranslateY = useRef(new Animated.Value(15)).current;

  // Celebration shift (moves up to make room for nudge)
  const celebrationShiftY = useRef(new Animated.Value(0)).current;

  // Icon shrink when transitioning to overview
  const iconShrinkScale = useRef(new Animated.Value(1)).current;

  // Nudge section animations
  const nudgeOpacity = useRef(new Animated.Value(0)).current;
  const nudgeTranslateY = useRef(new Animated.Value(40)).current;
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
      // Phase 1: Ring and Moon appear together
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

      // Phase 2: Brief pause to show the moon
      Animated.delay(250),

      // Phase 3: Transform Moon to Checkmark with pulse + ripple
      Animated.parallel([
        // Moon spins and shrinks out
        Animated.timing(moonRotate, {
          toValue: 180,
          duration: 400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(moonScale, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(moonOpacity, {
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

    // Text animations (start after moon-to-checkmark transform)
    const textAnimations = Animated.sequence([
      Animated.delay(1100), // Wait for icon transformation
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
      // Compute gap to center overview cards between icon and nudge
      const gap = Math.max(0, (containerHeight.current - overviewCardsHeight.current - bottomFixedHeight.current - 73) / 3);
      overviewGapValue.setValue(gap);
      const totalBottom = overviewCardsHeight.current + gap + bottomFixedHeight.current;

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
          toValue: (containerHeight.current - totalBottom - 16) / 2 - iconCenterY.current + 8,
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

        // Card 1: Priority
        if (morningPriority) {
          cardAnims.push(fadeIn(card1Opacity, card1TranslateY));
          hapticDelay += 300;
          if (priorityCompleted) {
            cardAnims.push(completionBounce(card1Scale));
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay);
            hapticDelay += 400;
          } else {
            cardAnims.push(Animated.delay(400));
            hapticDelay += 400;
          }
        }

        // Card 2: Ratings
        if (ratings) {
          cardAnims.push(fadeIn(card2Opacity, card2TranslateY));
          hapticDelay += 300;
          cardAnims.push(completionBounce(card2Scale));
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay);
          hapticDelay += 400;
        }

        // Card 3: Journal
        cardAnims.push(fadeIn(card3Opacity, card3TranslateY));
        hapticDelay += 300;
        if (journalCompleted) {
          cardAnims.push(completionBounce(card3Scale));
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), hapticDelay);
          hapticDelay += 400;
        } else {
          cardAnims.push(Animated.delay(400));
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

          // "Before you sleep" nudge card 1 second later
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(nudgeOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
              Animated.timing(nudgeTranslateY, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
          }, 1000);
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
        // Show streak modal after main animation completes
        setTimeout(() => {
          setShowStreakModal(true);
        }, 2500);
      }
      // Screen stays visible — no auto-navigation
    };

    recordStreak();

    return () => {
      clearTimeout(hapticTimer);
    };
  }, [navigation]);

  const particleColors = ['#7C3AED', '#A78BFA', '#C4B5FD', '#6366F1', '#818CF8', '#DDD6FE', '#EDE9FE', '#8B5CF6', '#7C3AED', '#C4B5FD', '#A78BFA', '#6366F1'];

  // Interpolate rotation values
  const moonRotateInterpolate = moonRotate.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const checkmarkRotateInterpolate = checkmarkRotate.interpolate({
    inputRange: [-180, 0],
    outputRange: ['-180deg', '0deg'],
  });

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

            {/* Ripple Ring (expands and fades on checkmark) */}
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
                colors={['#7C3AED', '#6366F1', '#818CF8']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Moon Icon (fades/rotates out) */}
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    {
                      opacity: moonOpacity,
                      transform: [
                        { scale: moonScale },
                        { rotate: moonRotateInterpolate },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="moon" size={56} color="#FFFFFF" />
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
              Great job reflecting on your day.{'\n'}Sweet dreams!
            </Animated.Text>
          </View>
        </Animated.View>

        {/* Bottom Section: Overview + Nudge */}
        <View
          onLayout={(e) => { bottomSectionHeight.current = e.nativeEvent.layout.height; }}
          style={styles.bottomSection}
        >
          {/* Overview Cards Group */}
          <View onLayout={(e) => { overviewCardsHeight.current = e.nativeEvent.layout.height; }}>
            {/* Priority Status */}
            {morningPriority ? (
              <Animated.View style={{ opacity: card1Opacity, transform: [{ translateY: card1TranslateY }, { scale: card1Scale }] }}>
                <View style={[
                  styles.priorityCard,
                  { borderLeftColor: priorityCompleted ? '#7C3AED' : '#D1D5DB' },
                ]}>
                  <View style={styles.priorityHeader}>
                    <Ionicons
                      name={priorityCompleted ? 'checkmark-circle' : 'flag'}
                      size={14}
                      color={priorityCompleted ? '#7C3AED' : '#9CA3AF'}
                    />
                    <Text style={[styles.priorityLabel, { color: priorityCompleted ? '#7C3AED' : '#9CA3AF' }]}>
                      {priorityCompleted ? 'Priority Completed' : "Today's Priority"}
                    </Text>
                    {!priorityCompleted && (
                      <View style={styles.notCompletedBadge}>
                        <Text style={styles.notCompletedBadgeText}>Not completed</Text>
                      </View>
                    )}
                  </View>
                  <Text style={priorityCompleted ? styles.priorityTextCompleted : styles.priorityTextNotCompleted}>
                    {morningPriority}
                  </Text>
                </View>
              </Animated.View>
            ) : null}

            {/* Ratings */}
            {ratings ? (
              <Animated.View style={{ opacity: card2Opacity, transform: [{ translateY: card2TranslateY }, { scale: card2Scale }] }}>
                <View style={styles.ratingsRow}>
                  <View style={styles.ratingItem}>
                    <View style={[styles.ratingIconCircle, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="leaf" size={16} color="#059669" />
                    </View>
                    <Text style={styles.ratingValue}>{ratings.nutrition}</Text>
                    <Text style={styles.ratingLabel}>Nutrition</Text>
                  </View>
                  <View style={styles.ratingItem}>
                    <View style={[styles.ratingIconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="flash" size={16} color="#F59E0B" />
                    </View>
                    <Text style={styles.ratingValue}>{ratings.energy}</Text>
                    <Text style={styles.ratingLabel}>Energy</Text>
                  </View>
                  <View style={styles.ratingItem}>
                    <View style={[styles.ratingIconCircle, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="sparkles" size={16} color="#3B82F6" />
                    </View>
                    <Text style={styles.ratingValue}>{ratings.satisfaction}</Text>
                    <Text style={styles.ratingLabel}>Satisfaction</Text>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* Journal Status */}
            <Animated.View style={{ opacity: card3Opacity, transform: [{ translateY: card3TranslateY }, { scale: card3Scale }] }}>
              <View style={[
                styles.journalCard,
                { borderLeftColor: journalCompleted ? '#7C3AED' : '#D1D5DB' },
              ]}>
                <View style={[styles.journalHeader, journalCompleted && { marginBottom: 0 }]}>
                  <Ionicons
                    name={journalCompleted ? 'book' : 'document-text-outline'}
                    size={14}
                    color={journalCompleted ? '#7C3AED' : '#9CA3AF'}
                  />
                  <Text style={[styles.journalLabel, { flex: 1, color: journalCompleted ? '#7C3AED' : '#9CA3AF' }]}>
                    {journalCompleted ? 'Journal Entry Added' : 'Journal Entry'}
                  </Text>
                  {!journalCompleted && (
                    <View style={styles.skippedBadge}>
                      <Text style={styles.skippedBadgeText}>Skipped</Text>
                    </View>
                  )}
                  {journalCompleted && (
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {!journalCompleted && (
                  <Text style={styles.journalTextSkipped}>
                    No entry recorded tonight.
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Dynamic spacer to center overview cards */}
          <Animated.View style={{ height: overviewGapValue }} />

          {/* Bottom Fixed Group */}
          <View
            onLayout={(e) => { bottomFixedHeight.current = e.nativeEvent.layout.height; }}
          >
            {/* Before You Sleep Nudge */}
            <Animated.View style={{ opacity: nudgeOpacity, transform: [{ translateY: nudgeTranslateY }] }}>
              <View style={styles.nudgeCard}>
                <View style={styles.nudgeContent}>
                  <View style={styles.nudgeIconRow}>
                    <View style={styles.nudgeIconCircle}>
                      <Ionicons name="bulb-outline" size={18} color="#7C3AED" />
                    </View>
                    <Text style={styles.nudgeLabel}>Before you sleep</Text>
                  </View>

                  <Text style={styles.nudgeText}>
                    A 1-minute review keeps your notes alive.
                  </Text>

                  <TouchableOpacity
                    style={styles.takeLookButton}
                    activeOpacity={0.85}
                    onPress={() => {
                      navigation?.reset({
                        index: 0,
                        routes: [
                          { name: 'DashboardMain', params: { eveningCheckInJustCompleted: true, priorityCompleted, morningPriority } },
                          { name: 'KnowledgeHub' as string },
                        ],
                      });
                    }}
                  >
                    <Text style={styles.takeLookButtonText}>Second Brain</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
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
                    routes: [{ name: 'DashboardMain', params: { eveningCheckInJustCompleted: true, priorityCompleted, morningPriority } }],
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
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  notCompletedBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  notCompletedBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  priorityTextCompleted: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4C1D95',
    lineHeight: 22,
    letterSpacing: -0.2,
    textDecorationLine: 'line-through',
    textDecorationColor: '#A78BFA',
  },
  priorityTextNotCompleted: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  journalCard: {
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
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  journalLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  skippedBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  skippedBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  journalTextCompleted: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  journalTextSkipped: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  ratingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  ratingItem: {
    flex: 1,
    alignItems: 'center',
  },
  ratingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  nudgeCard: {
    backgroundColor: '#FAF9FF',
    borderRadius: 18,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#7C3AED',
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
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  nudgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nudgeText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  takeLookButton: {
    backgroundColor: '#A78BFA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  takeLookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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

export default EveningTrackingCompleteScreen;
