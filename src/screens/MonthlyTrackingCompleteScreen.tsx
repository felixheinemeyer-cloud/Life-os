import React, { useEffect, useRef } from 'react';
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

interface MonthlyTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
}

const { width, height } = Dimensions.get('window');

// Rose/Pink color scheme
const THEME_COLORS = {
  primary: '#DB2777',
  primaryLight: '#F472B6',
  primaryLighter: '#FBCFE8',
  gradient: ['#FBCFE8', '#F472B6', '#DB2777'] as const,
};

const MonthlyTrackingCompleteScreen: React.FC<MonthlyTrackingCompleteScreenProps> = ({
  navigation,
}) => {
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

    // Phase 2: Calendar transforms to checkmark
    const phase2 = Animated.parallel([
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
    ]);

    // Phase 3: Burst particles
    const phase3 = Animated.parallel([
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

    // Phase 3b: Fade out burst particles
    const phase3b = Animated.parallel(
      burstParticles.map((particle) =>
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      )
    );

    // Phase 4: Confetti falls
    const phase4 = Animated.parallel(
      confettiParticles.map((particle, index) => {
        const startX = (Math.random() - 0.5) * width;
        const endX = startX + (Math.random() - 0.5) * 150;
        const delay = Math.random() * 600;
        const fallDuration = 2500 + Math.random() * 1500;
        const fallDistance = height * (0.8 + Math.random() * 0.4);
        const fadeDelay = fallDuration * 0.6;

        return Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
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
      Animated.delay(1200),
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
      Animated.delay(300),
      phase2,
      Animated.delay(100),
      phase3,
      phase3b,
    ]);

    // Start all animations
    Animated.parallel([mainSequence, textAnimations, phase4]).start();

    // Haptic feedback at key moments
    const haptic1 = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 400);

    const haptic2 = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);

    // Auto-redirect after animation
    const redirectTimer = setTimeout(() => {
      navigation?.reset({
        index: 0,
        routes: [{ name: 'DashboardMain' }],
      });
    }, 3500);

    return () => {
      clearTimeout(haptic1);
      clearTimeout(haptic2);
      clearTimeout(redirectTimer);
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

  // Confetti colors (rose/pink theme)
  const confettiColors = [
    '#DB2777', '#F472B6', '#FBCFE8', '#EC4899', '#F9A8D4',
    '#BE185D', '#9D174D', '#831843', '#FDF2F8', '#FCE7F3',
  ];

  // Burst particle colors
  const burstColors = [
    '#DB2777', '#F472B6', '#FBCFE8', '#EC4899', '#F9A8D4', '#FCE7F3',
    '#DB2777', '#F472B6', '#FBCFE8', '#EC4899', '#F9A8D4', '#FCE7F3',
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
                <Ionicons name="calendar-outline" size={52} color="#FFFFFF" />
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
            Month Complete!
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
            Great job reflecting on your month.{'\n'}Keep learning and growing!
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
              <Text style={styles.statNumber}>4</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
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
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
    gap: 10,
  },
  statItem: {
    alignItems: 'center',
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
  bottomAccent: {
    position: 'absolute',
    bottom: 60,
  },
});

export default MonthlyTrackingCompleteScreen;
