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
const isSmallScreen = SCREEN_WIDTH < 380; // iPhone 14 Pro/15 Pro is ~393pt, iPhone 16 Pro is ~402pt

interface EveningTrackingPriorityContentProps {
  morningPriority: string;
  onSelectionComplete: (completed: boolean) => void;
}

const EveningTrackingPriorityContent: React.FC<EveningTrackingPriorityContentProps> = ({
  morningPriority,
  onSelectionComplete,
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

  const handleCardPress = (completed: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectionComplete(completed);
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
          colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
          style={styles.iconGradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconInnerCircle}>
            <Ionicons name="checkmark-circle" size={28} color="#7C3AED" />
          </View>
        </LinearGradient>
        <Text style={styles.questionText}>
          Did you complete your priority?
        </Text>
      </View>

      {/* Priority Card */}
      <View style={styles.priorityCard}>
        <View style={styles.priorityHeader}>
          <Ionicons name="flag" size={16} color="#D97706" />
          <Text style={styles.priorityLabel}>Today's Priority</Text>
        </View>
        <Text style={styles.priorityText}>{morningPriority}</Text>
      </View>

      {/* Completion Cards */}
      <View style={styles.cardsContainer}>
        {/* Yes, I did it! Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn(scale1)}
          onPressOut={() => handlePressOut(scale1)}
          onPress={() => handleCardPress(true)}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              styles.successCard,
              isSmallScreen && styles.cardSmall,
              { transform: [{ scale: scale1 }] },
            ]}
          >
            {/* Icon */}
            <LinearGradient
              colors={['#34D399', '#10B981', '#059669']}
              style={[styles.cardIconGradientRing, isSmallScreen && styles.cardIconGradientRingSmall]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.cardIconInnerCircle, isSmallScreen && styles.cardIconInnerCircleSmall]}>
                <Ionicons name="checkmark" size={26} color="#059669" />
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, isSmallScreen && styles.cardTitleSmall]}>Yes, I did it!</Text>
              <Text style={[styles.cardDescription, isSmallScreen && styles.cardDescriptionSmall]}>
                Celebrate your achievement
              </Text>
            </View>

            {/* Arrow */}
            <View style={[styles.arrowContainer, isSmallScreen && styles.arrowContainerSmall]}>
              <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Not today Card */}
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={() => handlePressIn(scale2)}
          onPressOut={() => handlePressOut(scale2)}
          onPress={() => handleCardPress(false)}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              styles.notTodayCard,
              isSmallScreen && styles.cardSmall,
              { transform: [{ scale: scale2 }] },
            ]}
          >
            {/* Icon */}
            <LinearGradient
              colors={['#9CA3AF', '#6B7280', '#4B5563']}
              style={[styles.cardIconGradientRing, isSmallScreen && styles.cardIconGradientRingSmall]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.cardIconInnerCircle, isSmallScreen && styles.cardIconInnerCircleSmall]}>
                <Ionicons name="close" size={26} color="#4B5563" />
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, isSmallScreen && styles.cardTitleSmall]}>Not today</Text>
              <Text style={[styles.cardDescription, isSmallScreen && styles.cardDescriptionSmall]}>
                Reflect and move forward
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
    marginBottom: 16,
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
    marginBottom: 8,
  },
  questionSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Priority Card
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  // Cards Container
  cardsContainer: {
    gap: 12,
    paddingTop: 20,
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
  successCard: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  notTodayCard: {
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
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

export default EveningTrackingPriorityContent;
