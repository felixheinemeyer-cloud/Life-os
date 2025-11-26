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

interface EveningTrackingCompleteScreenProps {
  navigation?: {
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
}

const { width } = Dimensions.get('window');

const EveningTrackingCompleteScreen: React.FC<EveningTrackingCompleteScreenProps> = ({
  navigation,
}) => {
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

  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const subtextOpacity = useRef(new Animated.Value(0)).current;
  const subtextTranslateY = useRef(new Animated.Value(15)).current;

  // Particle animations
  const particles = useRef(
    Array.from({ length: 8 }, () => ({
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
      Animated.delay(500),

      // Phase 3: Transform Moon to Checkmark with pulse effect
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
            toValue: 1.15,
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
        // Checkmark spins and grows in (delayed slightly)
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
      ]),

      // Small delay before particles
      Animated.delay(100),

      // Phase 4: Particles burst out
      Animated.parallel(
        particles.map((particle, index) => {
          const angle = (index / particles.length) * 2 * Math.PI;
          const distance = 80 + Math.random() * 40;
          return Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 1,
              duration: 300,
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
        })
      ),
      // Fade out particles
      Animated.parallel(
        particles.map((particle) =>
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ),
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
    ]);

    // Start all animations
    Animated.parallel([animationSequence, textAnimations]).start();

    // Trigger haptic when transformation completes
    const hapticTimer = setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);

    // Auto-redirect after 3 seconds (adjusted for longer animation)
    const redirectTimer = setTimeout(() => {
      navigation?.reset({
        index: 0,
        routes: [{ name: 'DashboardMain' }],
      });
    }, 3000);

    return () => {
      clearTimeout(redirectTimer);
      clearTimeout(hapticTimer);
    };
  }, [navigation]);

  const particleColors = ['#7C3AED', '#A78BFA', '#C4B5FD', '#6366F1', '#818CF8', '#DDD6FE', '#EDE9FE', '#8B5CF6'];

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
      <View style={styles.container}>
        {/* Animation Container */}
        <View style={styles.animationContainer}>
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

          {/* Outer Ring */}
          <Animated.View
            style={[
              styles.outerRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          {/* Icon Container with Pulse */}
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

        {/* Small Moon Icon at Bottom */}
        <Animated.View
          style={[
            styles.bottomMoonContainer,
            {
              opacity: subtextOpacity,
            },
          ]}
        >
          <Ionicons name="moon" size={24} color="#C4B5FD" />
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
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
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
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  bottomMoonContainer: {
    position: 'absolute',
    bottom: 60,
  },
});

export default EveningTrackingCompleteScreen;
