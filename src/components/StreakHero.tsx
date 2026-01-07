import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakHeroProps {
  currentStreak: number;
  longestStreak: number;
}

const StreakHero: React.FC<StreakHeroProps> = ({ currentStreak, longestStreak }) => {
  return (
    <View style={styles.container}>
      <View style={styles.heroRow}>
        {/* Left side - Number and text */}
        <View style={styles.textSection}>
          {/* Number with warm glow background */}
          <View style={styles.numberWrapper}>
            <View style={styles.numberGlow} />
            <Text style={styles.streakNumber}>{currentStreak}</Text>
          </View>
          <Text style={styles.labelText}>
            {currentStreak === 1 ? 'day logged' : 'days logged'}
          </Text>
          <Text style={styles.labelTextSecondary}>in a row</Text>
        </View>

        {/* Right side - Flame icon */}
        <View style={styles.flameStack}>
          {/* Soft outer glow */}
          <View style={styles.outerGlow} />

          {/* Inner glow */}
          <View style={styles.innerGlow} />

          {/* Back flame layer - yellow tint for top highlight */}
          <View style={styles.flameLayer}>
            <Ionicons name="flame" size={90} color="#FFD166" />
          </View>

          {/* Middle flame layer - main orange */}
          <View style={[styles.flameLayer, { top: 4 }]}>
            <Ionicons name="flame" size={85} color="#FF9F43" />
          </View>

          {/* Front flame layer - coral/salmon base */}
          <View style={[styles.flameLayer, { top: 8 }]}>
            <Ionicons name="flame" size={80} color="#EE7B4D" />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingLeft: 24,
    paddingRight: 32,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textSection: {
    flex: 1,
  },
  numberWrapper: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  numberGlow: {
    position: 'absolute',
    top: 8,
    left: -8,
    right: -8,
    bottom: 0,
    backgroundColor: '#FFF5EE',
    borderRadius: 16,
    opacity: 0.8,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#E56B3E',
    textShadowColor: 'rgba(229, 107, 62, 0.25)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  labelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#92756A',
    marginTop: 2,
  },
  labelTextSecondary: {
    fontSize: 17,
    fontWeight: '500',
    color: '#A8968D',
    marginTop: -1,
  },
  flameStack: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF0E5',
  },
  innerGlow: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: '#FFE4D4',
  },
  flameLayer: {
    position: 'absolute',
    alignItems: 'center',
  },
});

export default StreakHero;
