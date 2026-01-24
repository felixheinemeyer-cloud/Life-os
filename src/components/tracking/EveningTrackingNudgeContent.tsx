import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 380;

interface EveningTrackingNudgeContentProps {
  onDoMorningFirst: () => void;
  onContinueAnyway: () => void;
}

const EveningTrackingNudgeContent: React.FC<EveningTrackingNudgeContentProps> = ({
  onDoMorningFirst,
  onContinueAnyway,
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

  const handleMorningPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDoMorningFirst();
  };

  const handleContinuePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onContinueAnyway();
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Question Section */}
      <View style={styles.questionSection}>
        <LinearGradient
          colors={['#FBBF24', '#F59E0B', '#D97706']}
          style={styles.iconGradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconInnerCircle}>
            <Ionicons name="sunny" size={28} color="#D97706" />
          </View>
        </LinearGradient>
        <Text style={styles.questionText}>
          Morning first?
        </Text>
        <Text style={styles.questionSubtext}>
          Setting intentions first can make your evening reflection more meaningful.
        </Text>
      </View>

      {/* Option Cards */}
      <View style={styles.cardsContainer}>
        {/* Do Morning First Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn(scale1)}
          onPressOut={() => handlePressOut(scale1)}
          onPress={handleMorningPress}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              styles.morningCard,
              isSmallScreen && styles.cardSmall,
              { transform: [{ scale: scale1 }] },
            ]}
          >
            {/* Icon */}
            <LinearGradient
              colors={['#FBBF24', '#F59E0B', '#D97706']}
              style={[styles.cardIconGradientRing, isSmallScreen && styles.cardIconGradientRingSmall]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.cardIconInnerCircle, isSmallScreen && styles.cardIconInnerCircleSmall]}>
                <Ionicons name="sunny" size={26} color="#D97706" />
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, isSmallScreen && styles.cardTitleSmall]}>Do Morning First</Text>
              <Text style={[styles.cardDescription, isSmallScreen && styles.cardDescriptionSmall]}>
                Set your intentions for the day
              </Text>
            </View>

            {/* Arrow */}
            <View style={[styles.arrowContainer, isSmallScreen && styles.arrowContainerSmall]}>
              <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Continue to Evening Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn(scale2)}
          onPressOut={() => handlePressOut(scale2)}
          onPress={handleContinuePress}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              styles.continueCard,
              isSmallScreen && styles.cardSmall,
              { transform: [{ scale: scale2 }] },
            ]}
          >
            {/* Icon */}
            <LinearGradient
              colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
              style={[styles.cardIconGradientRing, isSmallScreen && styles.cardIconGradientRingSmall]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.cardIconInnerCircle, isSmallScreen && styles.cardIconInnerCircleSmall]}>
                <Ionicons name="moon" size={26} color="#7C3AED" />
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, isSmallScreen && styles.cardTitleSmall]}>Continue to Evening</Text>
              <Text style={[styles.cardDescription, isSmallScreen && styles.cardDescriptionSmall]}>
                Skip morning
              </Text>
            </View>

            {/* Arrow */}
            <View style={[styles.arrowContainer, isSmallScreen && styles.arrowContainerSmall]}>
              <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 32,
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
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  questionSubtext: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  // Cards Container
  cardsContainer: {
    gap: 12,
  },

  // Card Styles
  cardTouchable: {
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    paddingRight: 56,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  morningCard: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  continueCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // Icon
  cardIconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    marginRight: 16,
  },
  cardIconInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 20,
    letterSpacing: -0.1,
  },

  // Arrow
  arrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 20,
    justifyContent: 'center',
  },

  // Small Screen Variants
  cardSmall: {
    padding: 18,
    paddingRight: 50,
    borderRadius: 20,
  },
  cardIconGradientRingSmall: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 12,
  },
  cardIconInnerCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardTitleSmall: {
    fontSize: 17,
    marginBottom: 2,
  },
  cardDescriptionSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  arrowContainerSmall: {
    right: 18,
  },
});

export default EveningTrackingNudgeContent;
