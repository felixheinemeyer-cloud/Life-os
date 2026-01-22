import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStreak } from '../context/StreakContext';
import StreakCelebrationModal from '../components/StreakCelebrationModal';

interface WeeklyTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
}

const { width, height } = Dimensions.get('window');

// Teal color scheme
const THEME_COLORS = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryLighter: '#5EEAD4',
  gradient: ['#5EEAD4', '#14B8A6', '#0D9488'] as const,
};

// Wealth area icons and colors for the orbiting elements
const WEALTH_AREAS = [
  { icon: 'body', color: '#0D9488' },        // Physical
  { icon: 'people', color: '#14B8A6' },       // Social
  { icon: 'bulb', color: '#5EEAD4' },         // Mental
  { icon: 'wallet', color: '#2DD4BF' },       // Financial
  { icon: 'time', color: '#99F6E4' },         // Time
];

const WeeklyTrackingCompleteScreen: React.FC<WeeklyTrackingCompleteScreenProps> = ({
  navigation,
}) => {
  const { streakData, recordCheckIn } = useStreak();
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);

  // Main icon animations
  const containerScale = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Calendar to checkmark transformation
  const calendarScale = useRef(new Animated.Value(1)).current;
  const calendarOpacity = useRef(new Animated.Value(1)).current;
  const calendarRotate = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const checkmarkRotate = useRef(new Animated.Value(-180)).current;

  // Ring animations
  const innerRingScale = useRef(new Animated.Value(0.8)).current;
  const innerRingOpacity = useRef(new Animated.Value(0)).current;
  const outerRingScale = useRef(new Animated.Value(0.6)).current;
  const outerRingOpacity = useRef(new Animated.Value(0)).current;

  // Pulse effect
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Orbiting wealth dots
  const orbitProgress = useRef(new Animated.Value(0)).current;
  const orbitScale = useRef(new Animated.Value(0)).current;
  const orbitOpacity = useRef(new Animated.Value(0)).current;
  const convergeProgress = useRef(new Animated.Value(0)).current;

  // Text animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsScale = useRef(new Animated.Value(0.8)).current;

  // Confetti particles
  const confettiParticles = useRef(
    Array.from({ length: 20 }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // Burst particles (from center)
  const burstParticles = useRef(
    Array.from({ length: 12 }, () => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Phase 1: Rings and container appear
    const phase1 = Animated.parallel([
      Animated.timing(outerRingOpacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(outerRingScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(innerRingOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(innerRingScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(containerScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Orbiting wealth dots appear and orbit
    const phase2 = Animated.parallel([
      Animated.timing(orbitOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(orbitScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(orbitProgress, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    // Phase 3: Dots converge to center
    const phase3 = Animated.timing(convergeProgress, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    // Phase 4: Calendar transforms to checkmark
    const phase4 = Animated.parallel([
      // Calendar spins and shrinks
      Animated.timing(calendarRotate, {
        toValue: 180,
        duration: 400,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(calendarScale, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(calendarOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      // Pulse effect
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.2,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Checkmark appears
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(checkmarkRotate, {
            toValue: 0,
            duration: 350,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(checkmarkScale, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(checkmarkOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Hide orbiting dots
      Animated.timing(orbitOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    // Phase 5: Burst particles
    const phase5 = Animated.parallel([
      ...burstParticles.map((particle, index) => {
        const angle = (index / burstParticles.length) * 2 * Math.PI;
        const distance = 90 + Math.random() * 50;
        return Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateX, {
            toValue: Math.cos(angle) * distance,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: Math.sin(angle) * distance,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
      }),
    ]);

    // Phase 5b: Fade out burst particles
    const phase5b = Animated.parallel(
      burstParticles.map((particle) =>
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      )
    );

    // Phase 6: Confetti falls - each with unique timing and distance
    const phase6 = Animated.parallel(
      confettiParticles.map((particle, index) => {
        const startX = (Math.random() - 0.5) * width;
        const endX = startX + (Math.random() - 0.5) * 150;
        const delay = Math.random() * 600;
        const fallDuration = 2500 + Math.random() * 1500; // 2.5-4 seconds
        const fallDistance = height * (0.8 + Math.random() * 0.4); // Falls past screen
        const fadeDelay = fallDuration * 0.6; // Start fading at 60% of fall

        return Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            // Fade in quickly, then fade out gradually
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.9,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.delay(fadeDelay - 150),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: fallDuration - fadeDelay,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(particle.scale, {
              toValue: 0.4 + Math.random() * 0.6,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateX, {
              toValue: endX,
              duration: fallDuration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateY, {
              toValue: fallDistance,
              duration: fallDuration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(particle.rotate, {
              toValue: 360 * (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
              duration: fallDuration,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
        ]);
      })
    );

    // Text animations
    const textAnimations = Animated.sequence([
      Animated.delay(1600),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(statsScale, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Main animation sequence
    const mainSequence = Animated.sequence([
      phase1,
      Animated.delay(200),
      phase2,
      Animated.delay(100),
      phase3,
      Animated.delay(100),
      phase4,
      Animated.delay(100),
      phase5,
      phase5b,
    ]);

    // Start all animations
    Animated.parallel([mainSequence, textAnimations, phase6]).start();

    // Haptic feedback at key moments
    const haptic1 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 400);

    const haptic2 = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);

    // Record check-in and potentially show streak modal
    const recordStreak = async () => {
      const streakIncremented = await recordCheckIn();
      if (streakIncremented) {
        setNewStreakCount(streakData.currentStreak + 1);
        // Show streak modal after main animation completes
        setTimeout(() => {
          setShowStreakModal(true);
        }, 3000);
      } else {
        // No streak increment, just redirect
        setTimeout(() => {
          navigation?.reset({
            index: 0,
            routes: [{ name: 'DashboardMain' }],
          });
        }, 3500);
      }
    };

    recordStreak();

    return () => {
      clearTimeout(haptic1);
      clearTimeout(haptic2);
    };
  }, [navigation]);

  // Interpolations
  const calendarRotateInterpolate = calendarRotate.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const checkmarkRotateInterpolate = checkmarkRotate.interpolate({
    inputRange: [-180, 0],
    outputRange: ['-180deg', '0deg'],
  });

  // Confetti colors
  const confettiColors = [
    '#0D9488', '#14B8A6', '#5EEAD4', '#2DD4BF', '#99F6E4',
    '#0F766E', '#115E59', '#134E4A', '#CCFBF1', '#F0FDFA',
  ];

  // Burst particle colors
  const burstColors = [
    '#0D9488', '#14B8A6', '#5EEAD4', '#2DD4BF', '#99F6E4', '#CCFBF1',
    '#0D9488', '#14B8A6', '#5EEAD4', '#2DD4BF', '#99F6E4', '#CCFBF1',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Confetti particles (falling from top) */}
        {confettiParticles.map((particle, index) => {
          const rotateInterpolate = particle.rotate.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '360deg'],
          });
          return (
            <Animated.View
              key={`confetti-${index}`}
              style={[
                styles.confetti,
                {
                  backgroundColor: confettiColors[index % confettiColors.length],
                  opacity: particle.opacity,
                  transform: [
                    { translateX: particle.translateX },
                    { translateY: Animated.subtract(particle.translateY, height * 0.4) },
                    { scale: particle.scale },
                    { rotate: rotateInterpolate },
                  ],
                },
              ]}
            />
          );
        })}

        {/* Animation Container */}
        <View style={styles.animationContainer}>
          {/* Burst particles */}
          {burstParticles.map((particle, index) => (
            <Animated.View
              key={`burst-${index}`}
              style={[
                styles.burstParticle,
                {
                  backgroundColor: burstColors[index % burstColors.length],
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

          {/* Outer Ring */}
          <Animated.View
            style={[
              styles.outerRing,
              {
                opacity: outerRingOpacity,
                transform: [{ scale: outerRingScale }],
              },
            ]}
          />

          {/* Inner Ring */}
          <Animated.View
            style={[
              styles.innerRing,
              {
                opacity: innerRingOpacity,
                transform: [{ scale: innerRingScale }],
              },
            ]}
          />

          {/* Orbiting Wealth Dots */}
          {WEALTH_AREAS.map((area, index) => {
            const baseAngle = (index / WEALTH_AREAS.length) * 2 * Math.PI - Math.PI / 2;
            const orbitRadius = 75;

            const translateX = orbitProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Math.cos(baseAngle) * orbitRadius],
            });

            const translateY = orbitProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, Math.sin(baseAngle) * orbitRadius],
            });

            const convergeX = convergeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            });

            const convergeY = convergeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            });

            return (
              <Animated.View
                key={`orbit-${index}`}
                style={[
                  styles.orbitDot,
                  {
                    backgroundColor: area.color,
                    opacity: orbitOpacity,
                    transform: [
                      { scale: orbitScale },
                      { translateX: Animated.multiply(translateX, convergeX) },
                      { translateY: Animated.multiply(translateY, convergeY) },
                    ],
                  },
                ]}
              >
                <Ionicons name={area.icon as any} size={14} color="#FFFFFF" />
              </Animated.View>
            );
          })}

          {/* Main Icon Container */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: containerOpacity,
                transform: [
                  { scale: Animated.multiply(containerScale, pulseScale) },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={THEME_COLORS.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Calendar Icon (transforms out) */}
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    opacity: calendarOpacity,
                    transform: [
                      { scale: calendarScale },
                      { rotate: calendarRotateInterpolate },
                    ],
                  },
                ]}
              >
                <Ionicons name="calendar" size={52} color="#FFFFFF" />
              </Animated.View>

              {/* Checkmark Icon (transforms in) */}
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
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.titleText,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            Week Complete!
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitleText,
              {
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              },
            ]}
          >
            Great job reflecting on your week.{'\n'}Keep building your best life!
          </Animated.Text>

          {/* Stats Card */}
          <Animated.View
            style={[
              styles.statsCard,
              {
                opacity: statsOpacity,
                transform: [{ scale: statsScale }],
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Areas Rated</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Reflections</Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Accent */}
        <Animated.View
          style={[
            styles.bottomAccent,
            { opacity: statsOpacity },
          ]}
        >
          <Ionicons name="sparkles" size={20} color={THEME_COLORS.primaryLighter} />
        </Animated.View>
      </View>

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        visible={showStreakModal}
        streakCount={newStreakCount}
        onClose={() => {
          setShowStreakModal(false);
          navigation?.reset({
            index: 0,
            routes: [{ name: 'DashboardMain' }],
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  animationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  outerRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: THEME_COLORS.primaryLighter,
  },
  innerRing: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 72.5,
    borderWidth: 3,
    borderColor: THEME_COLORS.primaryLight,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    shadowColor: THEME_COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
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
  orbitDot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  burstParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 14,
    borderRadius: 2,
    top: 0,
    left: width / 2,
  },
  textContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.2,
    marginBottom: 24,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME_COLORS.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 60,
  },
});

export default WeeklyTrackingCompleteScreen;
