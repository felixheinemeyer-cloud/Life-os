import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MentalWealthIntroScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

const MentalWealthIntroScreen: React.FC<MentalWealthIntroScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.8)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Orchestrated entrance animation
    Animated.sequence([
      // Back button fades in
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hero icon appears
      Animated.parallel([
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Quote fades in
      Animated.timing(quoteOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Content slides up
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Button appears
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(buttonTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('MentalWealthQuestions');
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 64 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
          <View style={styles.heroSection}>
            {/* Icon Circle */}
            <Animated.View
              style={[
                styles.heroIconContainer,
                {
                  opacity: heroOpacity,
                  transform: [{ scale: heroScale }],
                },
              ]}
            >
              <View style={styles.heroIconOuter}>
                <View style={styles.heroIconInner}>
                  <Ionicons name="bulb" size={26} color="#3B82F6" />
                </View>
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.View
              style={[
                styles.titleContainer,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                },
              ]}
            >
              <Text style={styles.title}>Mental Wealth</Text>
            </Animated.View>
          </View>

          {/* Quote Section */}
          <Animated.View style={[styles.quoteSection, { opacity: quoteOpacity }]}>
            <View style={styles.quoteDecoration}>
              <Text style={styles.quoteMarkLeft}>"</Text>
            </View>
            <Text style={styles.quoteText}>
              The mind is everything.{'\n'}What you think, you become.
            </Text>
            <Text style={styles.quoteAttribution}>Buddha</Text>
          </Animated.View>

          {/* Content Section */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.contentCard}>
              <View style={styles.contentRow}>
                <View style={styles.contentDot} />
                <View style={styles.contentTextContainer}>
                  <Text style={styles.contentTitle}>Your mind is your compass</Text>
                  <Text style={styles.contentDescription}>
                    Your mental wealth is the clarity, resilience, and focus of your mind. It shapes how you perceive challenges, handle stress, and make decisions. A strong mind creates possibilities.
                  </Text>
                </View>
              </View>

              <View style={styles.contentDivider} />

              <View style={styles.contentRow}>
                <View style={styles.contentDot} />
                <View style={styles.contentTextContainer}>
                  <Text style={styles.contentTitle}>Define your ideal mindset</Text>
                  <Text style={styles.contentDescription}>
                    Define how your best mental self thinks, responds, and processes the world. How they maintain clarity, build resilience, and stay focused. This identity becomes your mental foundation.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

      {/* Fixed Header with Blur */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 0.85)',
              'rgba(247, 245, 242, 0.6)',
              'rgba(247, 245, 242, 0.3)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.headerGradient}
          />
        </View>
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Fixed Bottom Button */}
      <Animated.View
        style={[
          styles.bottomContainer,
          {
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
          },
        ]}
      >
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
            <View style={styles.continueButton}>
              <Text style={styles.continueButtonText}>Begin</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: 100,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    zIndex: 100,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  heroIconContainer: {
    marginBottom: 12,
  },
  heroIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // Quote Section
  quoteSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  quoteDecoration: {
    marginBottom: -16,
  },
  quoteMarkLeft: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3B82F6',
    lineHeight: 36,
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  quoteAttribution: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Content Section
  contentSection: {
    paddingHorizontal: 16,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 6,
    marginRight: 16,
  },
  contentTextContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  contentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
    marginLeft: 24,
  },

  // Bottom Button
  bottomContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  continueButtonWrapper: {
    borderRadius: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1F2937',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});

export default MentalWealthIntroScreen;
