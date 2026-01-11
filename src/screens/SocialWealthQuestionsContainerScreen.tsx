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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Import content components
import SocialWealthQuestion1Content from '../components/socialwealth/SocialWealthQuestion1Content';
import SocialWealthQuestion2Content from '../components/socialwealth/SocialWealthQuestion2Content';
import SocialWealthQuestion3Content from '../components/socialwealth/SocialWealthQuestion3Content';
import SocialWealthQuestion4Content from '../components/socialwealth/SocialWealthQuestion4Content';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 4;

interface SocialWealthQuestionsContainerScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

// Shared data state for all questions
interface QuestionsData {
  question1Answer: string;
  question2Answer: string;
  question3Answer: string;
  question4Answer: string;
}

const SocialWealthQuestionsContainerScreen: React.FC<SocialWealthQuestionsContainerScreenProps> = ({
  navigation,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [questionsData, setQuestionsData] = useState<QuestionsData>({
    question1Answer: '',
    question2Answer: '',
    question3Answer: '',
    question4Answer: '',
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
      // Final step - complete the flow and go to Social Wealth Overview
      console.log('Social Wealth questions complete:', questionsData);
      navigation?.navigate('SocialWealthOverview');
    }
  };

  const updateQuestionsData = <K extends keyof QuestionsData>(key: K, value: QuestionsData[K]) => {
    setQuestionsData((prev) => ({
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
            {/* Step 1: Friendships - What they look like */}
            <View style={styles.page}>
              <SocialWealthQuestion3Content
                answer={questionsData.question3Answer}
                onAnswerChange={(value) => updateQuestionsData('question3Answer', value)}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 2: Friendships - How to nurture */}
            <View style={styles.page}>
              <SocialWealthQuestion4Content
                answer={questionsData.question4Answer}
                onAnswerChange={(value) => updateQuestionsData('question4Answer', value)}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 3: Romantic - What it looks like */}
            <View style={styles.page}>
              <SocialWealthQuestion1Content
                answer={questionsData.question1Answer}
                onAnswerChange={(value) => updateQuestionsData('question1Answer', value)}
                onContinue={handleContinue}
              />
            </View>

            {/* Step 4: Romantic - How to show up */}
            <View style={styles.page}>
              <SocialWealthQuestion2Content
                answer={questionsData.question2Answer}
                onAnswerChange={(value) => updateQuestionsData('question2Answer', value)}
                onContinue={handleContinue}
                isLastQuestion={true}
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

export default SocialWealthQuestionsContainerScreen;
