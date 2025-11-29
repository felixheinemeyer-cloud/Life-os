import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface MorningTrackingMindsetContentProps {
  onNavigate?: (screen: string) => void;
}

const MorningTrackingMindsetContent: React.FC<MorningTrackingMindsetContentProps> = ({
  onNavigate,
}) => {
  // Scale animations for press
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;

  const handlePressIn = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#FBBF24', '#F59E0B', '#D97706']}
            style={styles.iconGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconInnerCircle}>
              <Ionicons name="diamond" size={28} color="#D97706" />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>
            Get into the right mindset
          </Text>
          <Text style={styles.headerSubtext}>
            Review your vision and guiding principles
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* Higher Self Card */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(scale1)}
            onPressOut={() => handlePressOut(scale1)}
            onPress={() => handleCardPress('MorningTrackingHigherSelf')}
          >
            <Animated.View
              style={[
                styles.featureCardWrapper,
                {
                  transform: [{ scale: scale1 }],
                },
              ]}
            >
              <LinearGradient
                colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
                style={styles.featureCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <View style={styles.cardIconCircle}>
                    <Ionicons name="star" size={36} color="#6366F1" />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Your Best Version</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    Review your ideal self and aspirations
                  </Text>
                </View>

                {/* Arrow indicator */}
                <View style={styles.arrowContainer}>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                  </View>
                </View>

                {/* Decorative elements */}
                <View style={[styles.decorDot, styles.dot1]} />
                <View style={[styles.decorDot, styles.dot2]} />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Mindset Card */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(scale2)}
            onPressOut={() => handlePressOut(scale2)}
            onPress={() => handleCardPress('MorningTrackingMindsetEntries')}
          >
            <Animated.View
              style={[
                styles.featureCardWrapper,
                {
                  transform: [{ scale: scale2 }],
                },
              ]}
            >
              <LinearGradient
                colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
                style={styles.featureCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <View style={styles.cardIconCircle}>
                    <Ionicons name="diamond" size={36} color="#6366F1" />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Mindset</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    Explore your beliefs and mental frameworks
                  </Text>
                </View>

                {/* Arrow indicator */}
                <View style={styles.arrowContainer}>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                  </View>
                </View>

                {/* Decorative elements */}
                <View style={[styles.decorDot, styles.dot1]} />
                <View style={[styles.decorDot, styles.dot2]} />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 20,
  },

  // Cards Container
  cardsContainer: {
    gap: 16,
  },

  // Feature Card Styles
  featureCardWrapper: {
    borderRadius: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  featureCard: {
    borderRadius: 24,
    padding: 24,
    minHeight: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    marginBottom: 16,
  },
  cardIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    paddingRight: 60,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4338CA',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  decorDot: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dot1: {
    width: 80,
    height: 80,
    top: -20,
    right: -20,
  },
  dot2: {
    width: 40,
    height: 40,
    top: 60,
    right: 80,
  },
});

export default MorningTrackingMindsetContent;
