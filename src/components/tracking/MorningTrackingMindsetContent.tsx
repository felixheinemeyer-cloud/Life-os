import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface MorningTrackingMindsetContentProps {
  onNavigate?: (screen: string) => void;
  onContinue?: () => void;
}

const MorningTrackingMindsetContent: React.FC<MorningTrackingMindsetContentProps> = ({
  onNavigate,
}) => {
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;

  const handlePressIn = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleCardPress = (route: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNavigate?.(route);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <LinearGradient
          colors={['#FBBF24', '#F59E0B', '#D97706']}
          style={styles.iconGradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconInnerCircle}>
            <Ionicons name="analytics" size={28} color="#D97706" />
          </View>
        </LinearGradient>
        <Text style={styles.headerTitle}>
          Get into the right mindset
        </Text>
        <Text style={styles.headerSubtext}>
          Review your vision and guiding principles
        </Text>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Higher Self Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn(scale1)}
          onPressOut={() => handlePressOut(scale1)}
          onPress={() => handleCardPress('MorningTrackingHigherSelf')}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              styles.higherSelfCard,
              { transform: [{ scale: scale1 }] },
            ]}
          >
            {/* Icon */}
            <View style={[styles.cardIconCircle, styles.higherSelfIconBg]}>
              <Ionicons name="star" size={29} color="#6366F1" />
            </View>

            {/* Content */}
            <Text style={styles.cardTitle}>Higher Self</Text>
            <Text style={styles.cardDescription}>
              Your best version & identity
            </Text>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Mindset Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn(scale2)}
          onPressOut={() => handlePressOut(scale2)}
          onPress={() => handleCardPress('MorningTrackingMindsetEntries')}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              styles.mindsetCard,
              { transform: [{ scale: scale2 }] },
            ]}
          >
            {/* Icon */}
            <View style={[styles.cardIconCircle, styles.mindsetIconBg]}>
              <Ionicons name="flash" size={29} color="#8B5CF6" />
            </View>

            {/* Content */}
            <Text style={styles.cardTitle}>Mindset</Text>
            <Text style={styles.cardDescription}>
              Rules, affirmations & beliefs
            </Text>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 28,
  },
  iconGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 3,
  },
  iconInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 22,
  },

  // Cards Container
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 16,
  },

  // Card Styles
  cardTouchable: {
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 29,
    paddingRight: 67,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    minWidth: 336,
  },
  higherSelfCard: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  mindsetCard: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },

  // Icon
  cardIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 19,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  higherSelfIconBg: {
    backgroundColor: '#EEF2FF',
  },
  mindsetIconBg: {
    backgroundColor: '#F3E8FF',
  },

  // Content
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 25,
    letterSpacing: -0.1,
  },

  // Arrow
  arrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 29,
    justifyContent: 'center',
  },
});

export default MorningTrackingMindsetContent;
