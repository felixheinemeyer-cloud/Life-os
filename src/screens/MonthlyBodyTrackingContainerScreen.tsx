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

import MonthlyBodyTrackingStatsContent from '../components/tracking/MonthlyBodyTrackingStatsContent';
import MonthlyBodyTrackingInsightsContent from '../components/tracking/MonthlyBodyTrackingInsightsContent';
import MonthlyBodyTrackingMetricsContent, { BodyMetricsData } from '../components/tracking/MonthlyBodyTrackingMetricsContent';
import MonthlyBodyTrackingHealthContent, { HealthRatingsData } from '../components/tracking/MonthlyBodyTrackingHealthContent';
import MonthlyBodyTrackingExerciseContent, { PhysicalActivityData } from '../components/tracking/MonthlyBodyTrackingExerciseContent';
import MonthlyBodyTrackingPhotoContent, { ProgressPhotoData } from '../components/tracking/MonthlyBodyTrackingPhotoContent';
import MonthlyBodyTrackingPromiseContent, { BodyPromiseData } from '../components/tracking/MonthlyBodyTrackingPromiseContent';
import MonthlyBodyTrackingMentalContent, { MentalWellnessData } from '../components/tracking/MonthlyBodyTrackingMentalContent';
import MonthlyBodyTrackingMentalLoadContent, { MentalLoadData } from '../components/tracking/MonthlyBodyTrackingMentalLoadContent';
import MonthlyBodyTrackingMindHelpersContent, { MindHelpersData } from '../components/tracking/MonthlyBodyTrackingMindHelpersContent';
import MonthlyBodyTrackingMindDrainsContent, { MindDrainsData } from '../components/tracking/MonthlyBodyTrackingMindDrainsContent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 11;

interface MonthlyBodyTrackingContainerScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

const MonthlyBodyTrackingContainerScreen: React.FC<MonthlyBodyTrackingContainerScreenProps> = ({
  navigation,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Body metrics state
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetricsData>({
    weight: '',
    weightUnit: 'kg',
    measurements: '',
  });

  // Health ratings state
  const [healthRatings, setHealthRatings] = useState<HealthRatingsData>({
    overallHealth: 5,
    skinQuality: 5,
  });

  // Physical activity data state
  const [physicalActivityData, setPhysicalActivityData] = useState<PhysicalActivityData>({
    activityLevel: null,
  });

  // Progress photo data state
  const [progressPhotoData, setProgressPhotoData] = useState<ProgressPhotoData>({
    photoUri: null,
  });

  // Body promise data state
  const [bodyPromiseData, setBodyPromiseData] = useState<BodyPromiseData>({
    promise: '',
  });

  // Mental wellness data state
  const [mentalWellnessData, setMentalWellnessData] = useState<MentalWellnessData>({
    mentalClarity: 5,
    emotionalBalance: 5,
    motivation: 5,
  });

  // Mental load data state
  const [mentalLoadData, setMentalLoadData] = useState<MentalLoadData>({
    mentalLoadLevel: null,
  });

  // Mind helpers data state
  const [mindHelpersData, setMindHelpersData] = useState<MindHelpersData>({
    selectedHelpers: [],
  });

  // Mind drains data state
  const [mindDrainsData, setMindDrainsData] = useState<MindDrainsData>({
    primaryDrain: null,
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
      // Final step - complete the check-in
      // For now, just go back. Later, navigate to a completion screen.
      console.log('Monthly Body Check-In complete:', {
        bodyMetrics,
        healthRatings,
        physicalActivityData,
        progressPhotoData,
        bodyPromiseData,
        mentalWellnessData,
        mentalLoadData,
        mindHelpersData,
        mindDrainsData,
      });
      navigation?.goBack();
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
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
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
            {/* Step 1: 30-Day Statistics Overview */}
            <View style={styles.page}>
              <MonthlyBodyTrackingStatsContent
                onContinue={handleContinue}
              />
            </View>

            {/* Step 2: Body Metrics Input */}
            <View style={styles.page}>
              <MonthlyBodyTrackingMetricsContent
                data={bodyMetrics}
                onDataChange={setBodyMetrics}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 3: Health Ratings */}
            <View style={styles.page}>
              <MonthlyBodyTrackingHealthContent
                data={healthRatings}
                onDataChange={setHealthRatings}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 4: Physical Activity */}
            <View style={styles.page}>
              <MonthlyBodyTrackingExerciseContent
                data={physicalActivityData}
                onDataChange={setPhysicalActivityData}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 5: 30-Day Insights - Sleep, Energy, Nutrition */}
            <View style={styles.page}>
              <MonthlyBodyTrackingInsightsContent
                onContinue={handleContinue}
              />
            </View>

            {/* Step 6: Progress Photo */}
            <View style={styles.page}>
              <MonthlyBodyTrackingPhotoContent
                data={progressPhotoData}
                onDataChange={setProgressPhotoData}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 7: Body Promise */}
            <View style={styles.page}>
              <MonthlyBodyTrackingPromiseContent
                data={bodyPromiseData}
                onDataChange={setBodyPromiseData}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 8: Mental Wellness */}
            <View style={styles.page}>
              <MonthlyBodyTrackingMentalContent
                data={mentalWellnessData}
                onDataChange={setMentalWellnessData}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 9: Mental Load */}
            <View style={styles.page}>
              <MonthlyBodyTrackingMentalLoadContent
                data={mentalLoadData}
                onDataChange={setMentalLoadData}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 10: Mind Drains (Energy Drains) */}
            <View style={styles.page}>
              <MonthlyBodyTrackingMindDrainsContent
                data={mindDrainsData}
                onDataChange={setMindDrainsData}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 11: Mind Helpers (What Helped) */}
            <View style={styles.page}>
              <MonthlyBodyTrackingMindHelpersContent
                data={mindHelpersData}
                onDataChange={setMindHelpersData}
                onContinue={handleContinue}
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
    backgroundColor: '#1F2937', // Match continue button color
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

export default MonthlyBodyTrackingContainerScreen;
