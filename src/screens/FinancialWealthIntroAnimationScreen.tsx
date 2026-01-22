import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FinancialWealthIntroAnimationScreenProps {
  navigation: {
    replace: (screen: string) => void;
  };
}

const FinancialWealthIntroAnimationScreen: React.FC<FinancialWealthIntroAnimationScreenProps> = ({
  navigation,
}) => {
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;

  // Breathing/pulse animation for the main circle
  const breatheScale = useRef(new Animated.Value(1)).current;

  // Expanding rings
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0.6)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Opacity = useRef(new Animated.Value(0.4)).current;
  const ring3Scale = useRef(new Animated.Value(0.8)).current;
  const ring3Opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.sequence([
      // Fade in background
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Show label
      Animated.timing(labelOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      // Show icon with scale
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // Show text
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Start breathing animation (continuous)
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheScale, {
          toValue: 1.08,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheScale, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breatheAnimation.start();

    // Start expanding rings animation (continuous)
    const createRingAnimation = (
      scaleAnim: Animated.Value,
      opacityAnim: Animated.Value,
      delay: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 2.2,
              duration: 1600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 1600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const ring1Animation = createRingAnimation(ring1Scale, ring1Opacity, 0);
    const ring2Animation = createRingAnimation(ring2Scale, ring2Opacity, 500);
    const ring3Animation = createRingAnimation(ring3Scale, ring3Opacity, 1000);

    ring1Animation.start();
    ring2Animation.start();
    ring3Animation.start();

    // Auto-navigate after 2.4 seconds
    const navigationTimer = setTimeout(() => {
      navigation.replace('FinancialWealthIntro');
    }, 2400);

    return () => {
      clearTimeout(navigationTimer);
      breatheAnimation.stop();
      ring1Animation.stop();
      ring2Animation.stop();
      ring3Animation.stop();
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeIn }]}>
          {/* Top Label */}
          <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
            <Text style={styles.label}>FINANCIAL WEALTH</Text>
          </Animated.View>

          {/* Animation Area */}
          <View style={styles.animationContainer}>
            {/* Expanding Rings */}
            <Animated.View
              style={[
                styles.ring,
                {
                  transform: [{ scale: ring1Scale }],
                  opacity: ring1Opacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                {
                  transform: [{ scale: ring2Scale }],
                  opacity: ring2Opacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.ring,
                {
                  transform: [{ scale: ring3Scale }],
                  opacity: ring3Opacity,
                },
              ]}
            />

            {/* Main Icon Circle with Breathing Effect */}
            <Animated.View
              style={[
                styles.iconCircleOuter,
                {
                  opacity: iconOpacity,
                  transform: [{ scale: iconScale }, { scale: breatheScale }],
                },
              ]}
            >
              <LinearGradient
                colors={['#FDE68A', '#FBBF24', '#EAB308']}
                style={styles.iconCircleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconCircleInner}>
                  <Ionicons name="wallet" size={56} color="#EAB308" />
                </View>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Caption */}
          <Animated.View
            style={[
              styles.captionContainer,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <Text style={styles.caption}>
              Building lasting prosperity and financial freedom.
            </Text>
          </Animated.View>
        </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  labelContainer: {
    position: 'absolute',
    top: 120,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EAB308',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  animationContainer: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#EAB308',
  },
  iconCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircleGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 180,
  },
  caption: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
});

export default FinancialWealthIntroAnimationScreen;
