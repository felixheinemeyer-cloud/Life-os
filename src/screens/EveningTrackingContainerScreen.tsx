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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import content components
import EveningTrackingPriorityContent from '../components/tracking/EveningTrackingPriorityContent';
import EveningTrackingRatingsContent from '../components/tracking/EveningTrackingRatingsContent';
import EveningTrackingJournalContent from '../components/tracking/EveningTrackingJournalContent';
import EveningTrackingNudgeContent from '../components/tracking/EveningTrackingNudgeContent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 3;

interface EveningTrackingContainerScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route?: {
    params?: {
      morningCheckInCompleted?: boolean;
      date?: string;
    };
  };
}

// Shared tracking data state
interface TrackingData {
  priorityCompleted: boolean | null;
  morningPriority: string;
  ratings: {
    nutrition: number;
    energy: number;
    satisfaction: number;
  };
  journalText: string;
  journalType: 'text' | 'voice' | 'video';
  journalVoiceUri: string | null;
  journalVoiceDuration: number;
  journalVideoUri: string | null;
  journalVideoDuration: number;
}

const EveningTrackingContainerScreen: React.FC<EveningTrackingContainerScreenProps> = ({
  navigation,
  route,
}) => {
  // Check if morning check-in was completed (passed from Dashboard)
  const morningCheckInCompleted = route?.params?.morningCheckInCompleted ?? false;
  const dateKey = route?.params?.date || `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;

  const [currentStep, setCurrentStep] = useState(0);
  const [trackingData, setTrackingData] = useState<TrackingData>({
    priorityCompleted: null,
    morningPriority: "Finish the project proposal and send it to the team",
    ratings: { nutrition: 5, energy: 5, satisfaction: 5 },
    journalText: '',
    journalType: 'text',
    journalVoiceUri: null,
    journalVoiceDuration: 0,
    journalVideoUri: null,
    journalVideoDuration: 0,
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

  const handleContinue = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < TOTAL_STEPS - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      animateToStep(newStep);
    } else {
      // Final step - save and go to completion screen
      try {
        const eveningData = {
          completed: true,
          priorityCompleted: trackingData.priorityCompleted,
          ratings: trackingData.ratings,
          journalType: trackingData.journalType,
          journal: trackingData.journalText,
          journalVoiceUri: trackingData.journalVoiceUri,
          journalVoiceDuration: trackingData.journalVoiceDuration,
          journalVideoUri: trackingData.journalVideoUri,
          journalVideoDuration: trackingData.journalVideoDuration,
        };
        await AsyncStorage.setItem(
          `@life_os_evening_${dateKey}`,
          JSON.stringify(eveningData)
        );
      } catch (e) {
        console.error('Failed to save evening data:', e);
      }
      navigation?.navigate('EveningTrackingComplete', {
        priorityCompleted: trackingData.priorityCompleted,
        morningPriority: trackingData.morningPriority,
      });
    }
  };

  const handlePrioritySelection = (completed: boolean) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTrackingData((prev) => ({
      ...prev,
      priorityCompleted: completed,
    }));
    // Auto-advance after selection
    const newStep = 1;
    setCurrentStep(newStep);
    animateToStep(newStep);
  };

  // Nudge handlers (when morning check-in not completed)
  const handleDoMorningFirst = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate to Morning Tracking
    navigation?.navigate('MorningTracking');
  };

  const handleContinueAnyway = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Skip to ratings step (step 1), bypassing priority
    const newStep = 1;
    setCurrentStep(newStep);
    animateToStep(newStep);
  };

  const updateTrackingData = <K extends keyof TrackingData>(key: K, value: TrackingData[K]) => {
    setTrackingData((prev) => ({
      ...prev,
      [key]: value,
    }));
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
            {/* Step 1: Nudge (if morning not done) or Priority */}
            <View style={styles.page}>
              {morningCheckInCompleted ? (
                <EveningTrackingPriorityContent
                  morningPriority={trackingData.morningPriority}
                  onSelectionComplete={handlePrioritySelection}
                />
              ) : (
                <EveningTrackingNudgeContent
                  onDoMorningFirst={handleDoMorningFirst}
                  onContinueAnyway={handleContinueAnyway}
                />
              )}
            </View>

            {/* Step 2: Ratings */}
            <View style={styles.page}>
              <EveningTrackingRatingsContent
                ratings={trackingData.ratings}
                onRatingsChange={(value) => updateTrackingData('ratings', value)}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 3: Journal */}
            <View style={styles.page}>
              <EveningTrackingJournalContent
                journalText={trackingData.journalText}
                onJournalChange={(value) => updateTrackingData('journalText', value)}
                onContinue={handleContinue}
                onTabChange={(tab) => updateTrackingData('journalType', tab)}
                onVoiceRecordingComplete={(uri, duration) => {
                  setTrackingData((prev) => ({
                    ...prev,
                    journalVoiceUri: uri,
                    journalVoiceDuration: duration,
                  }));
                }}
                onVoiceRecordingDelete={() => {
                  setTrackingData((prev) => ({
                    ...prev,
                    journalVoiceUri: null,
                    journalVoiceDuration: 0,
                  }));
                }}
                onVideoRecordingComplete={(uri, duration) => {
                  setTrackingData((prev) => ({
                    ...prev,
                    journalVideoUri: uri,
                    journalVideoDuration: duration,
                  }));
                }}
                onVideoRecordingDelete={() => {
                  setTrackingData((prev) => ({
                    ...prev,
                    journalVideoUri: null,
                    journalVideoDuration: 0,
                  }));
                }}
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
    backgroundColor: '#F0EEE8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Header - Fixed
  header: {
    backgroundColor: '#F0EEE8',
    paddingHorizontal: 16,
    paddingTop: 8,
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

export default EveningTrackingContainerScreen;
