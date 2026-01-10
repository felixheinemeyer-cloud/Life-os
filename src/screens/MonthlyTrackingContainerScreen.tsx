import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
  Easing,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import MonthlyTrackingOverviewContent from '../components/tracking/MonthlyTrackingOverviewContent';
import MonthlyTrackingReflectionContent, { MonthlyReflectionType } from '../components/tracking/MonthlyTrackingReflectionContent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 5;

interface MonthlyTrackingContainerScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface TrackingData {
  keyLearning: string;
  lostSightOf: string;
  proudMoment: string;
  messageToSelf: string;
}

const MonthlyTrackingContainerScreen: React.FC<MonthlyTrackingContainerScreenProps> = ({
  navigation,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [trackingData, setTrackingData] = useState<TrackingData>({
    keyLearning: '',
    lostSightOf: '',
    proudMoment: '',
    messageToSelf: '',
  });

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
    Keyboard.dismiss();
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep === 0) {
      navigation?.goBack();
    } else {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      animateToStep(newStep);
    }
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
      // Final step - complete tracking
      console.log('Monthly tracking complete:', trackingData);
      navigation?.navigate('MonthlyTrackingComplete', trackingData);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>

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

        {/* Horizontal Paging Content */}
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
            {/* Step 0: Monthly Overview with Stats */}
            <View style={styles.page}>
              <MonthlyTrackingOverviewContent
                onContinue={handleContinue}
              />
            </View>
            {/* Step 1: Key Learning */}
            <View style={styles.page}>
              <MonthlyTrackingReflectionContent
                reflectionType="keyLearning"
                value={trackingData.keyLearning}
                onValueChange={(value) => setTrackingData(prev => ({ ...prev, keyLearning: value }))}
                onContinue={handleContinue}
              />
            </View>
            {/* Step 2: Lost Sight Of */}
            <View style={styles.page}>
              <MonthlyTrackingReflectionContent
                reflectionType="lostSightOf"
                value={trackingData.lostSightOf}
                onValueChange={(value) => setTrackingData(prev => ({ ...prev, lostSightOf: value }))}
                onContinue={handleContinue}
              />
            </View>
            {/* Step 3: Proud Moment */}
            <View style={styles.page}>
              <MonthlyTrackingReflectionContent
                reflectionType="proudMoment"
                value={trackingData.proudMoment}
                onValueChange={(value) => setTrackingData(prev => ({ ...prev, proudMoment: value }))}
                onContinue={handleContinue}
              />
            </View>
            {/* Step 4: Message to Self */}
            <View style={styles.page}>
              <MonthlyTrackingReflectionContent
                reflectionType="messageToSelf"
                value={trackingData.messageToSelf}
                onValueChange={(value) => setTrackingData(prev => ({ ...prev, messageToSelf: value }))}
                onContinue={handleContinue}
                buttonText="Finish"
              />
            </View>
          </Animated.View>
        </View>
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

  // Header - Fixed
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
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
    backgroundColor: '#E5E7EB',
  },

  // Content - Horizontal Paging
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

export default MonthlyTrackingContainerScreen;
