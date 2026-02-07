import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import OnboardingScreen0 from './OnboardingScreen0';
import OnboardingScreen1 from './OnboardingScreen1';
import OnboardingScreen2 from './OnboardingScreen2';
import OnboardingScreen3 from './OnboardingScreen3';
import OnboardingScreen4 from './OnboardingScreen4';
import OnboardingScreen5 from './OnboardingScreen5';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 6;

interface OnboardingContainerScreenProps {
  onComplete: () => void;
}

const OnboardingContainerScreen: React.FC<OnboardingContainerScreenProps> = ({
  onComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);

  // Animation value for horizontal scroll position
  const scrollX = useRef(new Animated.Value(0)).current;

  // Animated values for dot widths
  const dotWidths = useRef(
    Array.from({ length: TOTAL_STEPS }, (_, i) =>
      new Animated.Value(i === 0 ? 20 : 8)
    )
  ).current;

  // Animate dot widths when step changes
  useEffect(() => {
    const animations = dotWidths.map((dotWidth, index) =>
      Animated.timing(dotWidth, {
        toValue: index === currentStep ? 20 : 8,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  }, [currentStep]);

  const animateToStep = (step: number) => {
    Animated.timing(scrollX, {
      toValue: -step * SCREEN_WIDTH,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    if (currentStep === 0) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newStep = currentStep - 1;
    setCurrentStep(newStep);
    animateToStep(newStep);
  };

  const handleContinue = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < TOTAL_STEPS - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      animateToStep(newStep);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Horizontal Paging Content — fills entire screen */}
      <View style={styles.contentWrapper}>
        <Animated.View
          style={[
            styles.slidingContainer,
            {
              width: SCREEN_WIDTH * TOTAL_STEPS,
              transform: [{ translateX: scrollX }],
            },
          ]}
        >
          <View style={styles.page}>
            <OnboardingScreen0 onContinue={handleContinue} />
          </View>

          <View style={styles.page}>
            <OnboardingScreen1 onContinue={handleContinue} />
          </View>

          <View style={styles.page}>
            <OnboardingScreen2 onContinue={handleContinue} />
          </View>

          <View style={styles.page}>
            <OnboardingScreen3 onContinue={handleContinue} />
          </View>

          <View style={styles.page}>
            <OnboardingScreen4 onContinue={handleContinue} />
          </View>

          <View style={styles.page}>
            <OnboardingScreen5 onContinue={handleContinue} />
          </View>
        </Animated.View>
      </View>

      {/* Header — overlaid on top */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {currentStep > 0 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {dotWidths.map((dotWidth, index) => (
            <Animated.View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep
                  ? styles.progressDotActive
                  : styles.progressDotInactive,
                { width: dotWidth },
              ]}
            />
          ))}
        </View>

        <View style={styles.headerSpacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Header - Absolute overlay
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#1F2937',
  },
  progressDotInactive: {
    backgroundColor: '#C9CDD5',
  },

  // Content - Horizontal Paging (full screen)
  contentWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  slidingContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});

export default OnboardingContainerScreen;
