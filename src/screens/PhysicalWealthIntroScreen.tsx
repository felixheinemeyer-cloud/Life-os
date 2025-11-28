import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface PhysicalWealthIntroScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

const PhysicalWealthIntroScreen: React.FC<PhysicalWealthIntroScreenProps> = ({
  navigation,
}) => {
  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(20)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(20)).current;
  const card3Opacity = useRef(new Animated.Value(0)).current;
  const card3TranslateY = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      // Header fades in
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideUp, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Cards stagger in
      Animated.stagger(120, [
        Animated.parallel([
          Animated.timing(card1Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(card1TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(card2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(card2TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(card3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(card3TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('PhysicalWealthQuestions');
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="fitness" size={24} color="#059669" />
            </View>
            <Text style={styles.title}>Physical Wealth</Text>
          </View>
        </Animated.View>

        {/* Quote Section */}
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: fadeIn,
              transform: [{ translateY: slideUp }],
            },
          ]}
        >
          <Text style={styles.quoteText}>
            "A healthy man has a thousand wishes, a sick man only one."
          </Text>
          <Text style={styles.quoteAttribution}>— Indian Proverb</Text>
        </Animated.View>

        {/* Content Cards */}
        <View style={styles.cardsContainer}>
          {/* Card 1: What is Physical Wealth */}
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: card1Opacity,
                transform: [{ translateY: card1TranslateY }],
              },
            ]}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconCircle}>
                  <Ionicons name="body-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.cardTitle}>What is Physical Wealth?</Text>
              </View>
              <Text style={styles.cardText}>
                Physical wealth is the strength, health, and energy of your body. It's your ability to move freely, recover quickly, and feel energized throughout your day.
              </Text>
              <Text style={styles.cardTextSecondary}>
                It's the foundation that supports every other area of your life.
              </Text>
            </View>
          </Animated.View>

          {/* Card 2: Why it matters */}
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: card2Opacity,
                transform: [{ translateY: card2TranslateY }],
              },
            ]}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconCircle}>
                  <Ionicons name="sparkles-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.cardTitle}>Why it matters</Text>
              </View>
              <Text style={styles.cardText}>
                A strong, healthy body gives you the capacity for deep work, meaningful relationships, and personal growth.
              </Text>
              <Text style={styles.cardTextSecondary}>
                Physical health fuels mental clarity, emotional stability, and the energy to pursue what matters most to you.
              </Text>
            </View>
          </Animated.View>

          {/* Card 3: How to approach this */}
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: card3Opacity,
                transform: [{ translateY: card3TranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              style={styles.guidanceCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, styles.cardIconCircleGreen]}>
                  <Ionicons name="bulb-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.cardTitle}>How to approach this</Text>
              </View>
              <Text style={styles.guidanceText}>
                In the next steps, you'll describe how your best physical self looks, feels, and acts.
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Be honest and aspirational</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Focus on who you want to become</Text>
                </View>
                <View style={styles.bulletItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>Be specific about habits and choices</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleContinue}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
        >
          <Animated.View
            style={[
              styles.continueButtonWrapper,
              { transform: [{ scale: buttonScale }] },
            ]}
          >
            <LinearGradient
              colors={['#10B981', '#059669', '#047857']}
              style={styles.continueButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.continueButtonText}>
                Start Defining Your Physical Wealth
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
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
    backgroundColor: '#F7F5F2',
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // Quote
  quoteContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  quoteAttribution: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: -0.2,
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIconCircleGreen: {
    backgroundColor: '#059669',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  cardTextSecondary: {
    fontSize: 15,
    fontWeight: '500',
    color: '#059669',
    lineHeight: 23,
    letterSpacing: -0.2,
    marginTop: 10,
  },

  // Guidance Card
  guidanceCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  guidanceText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#065F46',
    lineHeight: 23,
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 12,
  },
  bulletText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#065F46',
    letterSpacing: -0.2,
  },

  // Bottom Button
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: '#F7F5F2',
  },
  continueButtonWrapper: {
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});

export default PhysicalWealthIntroScreen;
