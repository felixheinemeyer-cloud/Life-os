import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface StreakCelebrationModalProps {
  visible: boolean;
  streakCount: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  visible,
  streakCount,
  onClose,
}) => {
  // Main container animations
  const containerScale = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Fire icon animations
  const fireScale = useRef(new Animated.Value(0.5)).current;
  const fireGlow = useRef(new Animated.Value(0)).current;

  // Number animations
  const numberScale = useRef(new Animated.Value(0)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;

  // Text animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;

  // Particle animations (fire embers)
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset all animations
      containerScale.setValue(0);
      containerOpacity.setValue(0);
      fireScale.setValue(0.5);
      fireGlow.setValue(0);
      numberScale.setValue(0);
      numberOpacity.setValue(0);
      textOpacity.setValue(0);
      textTranslateY.setValue(30);
      particles.forEach(p => {
        p.opacity.setValue(0);
        p.translateX.setValue(0);
        p.translateY.setValue(0);
        p.scale.setValue(0);
      });

      // Trigger haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Start animation sequence
      Animated.sequence([
        // Container appears
        Animated.parallel([
          Animated.spring(containerScale, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(containerOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),

        // Fire icon grows with glow
        Animated.parallel([
          Animated.spring(fireScale, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(fireGlow, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),

        // Particles burst out
        Animated.parallel(
          particles.map((particle, index) => {
            const angle = (index / particles.length) * 2 * Math.PI - Math.PI / 2;
            const distance = 60 + Math.random() * 40;
            return Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.5 + Math.random() * 0.5,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateX, {
                toValue: Math.cos(angle) * distance,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateY, {
                toValue: Math.sin(angle) * distance - 20,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]);
          })
        ),

        // Number appears
        Animated.parallel([
          Animated.spring(numberScale, {
            toValue: 1,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(numberOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),

        // Text slides up
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

        // Fade out particles
        Animated.parallel(
          particles.map(particle =>
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            })
          )
        ),
      ]).start();

      // Auto close after delay
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(containerScale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const particleColors = ['#FF6B35', '#FF8C42', '#FFD23F', '#FFA500', '#FF4500', '#FFD700'];

  const getMessage = () => {
    if (streakCount === 1) return "You've started your streak!";
    if (streakCount < 7) return "Keep the fire burning!";
    if (streakCount < 30) return "You're on fire!";
    if (streakCount < 100) return "Incredible dedication!";
    return "Legendary streak!";
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: containerOpacity,
              transform: [{ scale: containerScale }],
            },
          ]}
        >
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
                    { translateX: particle.translateX },
                    { translateY: particle.translateY },
                    { scale: particle.scale },
                  ],
                },
              ]}
            />
          ))}

          {/* Fire Icon with Glow */}
          <Animated.View
            style={[
              styles.fireContainer,
              {
                transform: [{ scale: fireScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.fireGlow,
                {
                  opacity: Animated.multiply(fireGlow, new Animated.Value(0.6)),
                },
              ]}
            />
            <LinearGradient
              colors={['#FF6B35', '#FF8C42', '#FFD23F']}
              style={styles.fireGradient}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
            >
              <Ionicons name="flame" size={64} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          {/* Streak Number */}
          <Animated.View
            style={[
              styles.numberContainer,
              {
                opacity: numberOpacity,
                transform: [{ scale: numberScale }],
              },
            ]}
          >
            <Text style={styles.streakNumber}>{streakCount}</Text>
            <Text style={styles.dayLabel}>day streak</Text>
          </Animated.View>

          {/* Message */}
          <Animated.Text
            style={[
              styles.message,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            {getMessage()}
          </Animated.Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 340,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fireContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FF6B35',
  },
  fireGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: -4,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD23F',
    textAlign: 'center',
  },
});

export default StreakCelebrationModal;
