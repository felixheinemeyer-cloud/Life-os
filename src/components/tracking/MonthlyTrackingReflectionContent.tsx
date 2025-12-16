import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Rose/Pink color scheme for monthly check-in
const THEME_COLORS = {
  primary: '#DB2777',
  primaryLight: '#F472B6',
  primaryLighter: '#FBCFE8',
  gradient: ['#FBCFE8', '#F472B6', '#DB2777'] as const,
};

export type MonthlyReflectionType = 'keyLearning' | 'lostSightOf' | 'proudMoment' | 'messageToSelf' | 'biggestChallenge' | 'gratitude' | 'nextMonthGoal';

interface ReflectionConfig {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
}

const REFLECTION_CONFIGS: Record<MonthlyReflectionType, ReflectionConfig> = {
  keyLearning: {
    title: 'What was your key learning this month?',
    icon: 'bulb',
    placeholder: 'Reflect on the most important lesson or insight you gained...',
  },
  lostSightOf: {
    title: 'What did you lose sight of in the midst of everything?',
    icon: 'eye-off',
    placeholder: 'Think about priorities, habits, or goals that slipped away...',
  },
  proudMoment: {
    title: 'What are you most proud of this month?',
    icon: 'trophy',
    placeholder: 'Think about an achievement or moment that stands out...',
  },
  messageToSelf: {
    title: 'What message do you want to give yourself for next month?',
    icon: 'mail',
    placeholder: 'Write a note of encouragement, reminder, or intention for your future self...',
  },
  biggestChallenge: {
    title: 'What was your biggest challenge this month?',
    icon: 'fitness',
    placeholder: 'Reflect on obstacles you faced and how you handled them...',
  },
  gratitude: {
    title: 'What are you most grateful for this month?',
    icon: 'heart',
    placeholder: 'Think about the people, experiences, or things you appreciate...',
  },
  nextMonthGoal: {
    title: 'What is your main goal for next month?',
    icon: 'flag',
    placeholder: 'Set a clear intention for the month ahead...',
  },
};

interface MonthlyTrackingReflectionContentProps {
  reflectionType: MonthlyReflectionType;
  value: string;
  onValueChange: (value: string) => void;
  onContinue: () => void;
  buttonText?: string;
}

const MonthlyTrackingReflectionContent: React.FC<MonthlyTrackingReflectionContentProps> = ({
  reflectionType,
  value,
  onValueChange,
  onContinue,
  buttonText = 'Continue',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const config = REFLECTION_CONFIGS[reflectionType];

  const handleFocus = (): void => {
    setIsFocused(true);
    // Scroll to show the input card at the top
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 80, animated: true });
    }, 100);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Question Section */}
          <View style={styles.questionSection}>
            <LinearGradient
              colors={THEME_COLORS.gradient}
              style={styles.iconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInnerCircle}>
                <Ionicons name={config.icon} size={26} color={THEME_COLORS.primary} />
              </View>
            </LinearGradient>
            <Text style={styles.questionText}>
              {config.title}
            </Text>
          </View>

          {/* Text Input Card */}
          <View style={[styles.inputCard, isFocused && styles.inputCardFocused]}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder={config.placeholder}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              value={value}
              onChangeText={onValueChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{buttonText}</Text>
            <Ionicons
              name={buttonText === 'Continue' ? 'chevron-forward' : 'checkmark'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 2,
  },
  iconInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
    paddingHorizontal: 16,
  },

  // Input Card
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputCardFocused: {
    borderColor: THEME_COLORS.primary,
    shadowColor: THEME_COLORS.primary,
    shadowOpacity: 0.15,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 220,
    letterSpacing: -0.2,
    lineHeight: 24,
    paddingTop: 0,
    paddingLeft: 0,
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default MonthlyTrackingReflectionContent;
