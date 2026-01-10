import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
  Animated,
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
  hint?: string;
}

const REFLECTION_CONFIGS: Record<MonthlyReflectionType, ReflectionConfig> = {
  keyLearning: {
    title: 'What was your key learning this month?',
    icon: 'bulb',
    placeholder: 'Reflect on the most important lesson or insight you gained...',
    hint: 'Reflect on the most important lesson or insight you gained',
  },
  lostSightOf: {
    title: 'What did you lose sight of in the midst of everything?',
    icon: 'eye-off',
    placeholder: 'Think about priorities, habits, or goals that slipped away...',
    hint: 'Think about priorities, habits, or goals that slipped away',
  },
  proudMoment: {
    title: 'What are you most proud of this month?',
    icon: 'trophy',
    placeholder: 'Think about an achievement or moment that stands out...',
    hint: 'Think about an achievement or moment that stands out',
  },
  messageToSelf: {
    title: 'What message do you want to give yourself for next month?',
    icon: 'mail',
    placeholder: 'Write a note of encouragement, reminder, or intention for your future self...',
    hint: 'Write a note of encouragement, reminder, or intention for your future self',
  },
  biggestChallenge: {
    title: 'What was your biggest challenge this month?',
    icon: 'fitness',
    placeholder: 'Reflect on obstacles you faced and how you handled them...',
    hint: 'Reflect on obstacles you faced and how you handled them',
  },
  gratitude: {
    title: 'What are you most grateful for this month?',
    icon: 'heart',
    placeholder: 'Think about the people, experiences, or things you appreciate...',
    hint: 'Think about the people, experiences, or things you appreciate',
  },
  nextMonthGoal: {
    title: 'What is your main goal for next month?',
    icon: 'flag',
    placeholder: 'Set a clear intention for the month ahead...',
    hint: 'Set a clear intention for the month ahead',
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
  const buttonBottom = useRef(new Animated.Value(0)).current;

  const config = REFLECTION_CONFIGS[reflectionType];

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setIsFocused(true);
        const keyboardTop = e.endCoordinates.height - 80;
        Animated.timing(buttonBottom, {
          toValue: keyboardTop + 8,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsFocused(false);
        Animated.timing(buttonBottom, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const isFinish = buttonText !== 'Continue';

  return (
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
              <Ionicons name={config.icon} size={28} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.questionText}>
            {config.title}
          </Text>

          {/* Hint Text */}
          {config.hint && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>
                {config.hint}
              </Text>
            </View>
          )}
        </View>

        {/* Free Writing Area */}
        <TextInput
          ref={textInputRef}
          style={styles.freeWritingInput}
          placeholder="Start writing..."
          placeholderTextColor="#9CA3AF"
          multiline
          scrollEnabled={false}
          value={value}
          onChangeText={onValueChange}
          textAlignVertical="top"
          selectionColor="#1F2937"
          cursorColor="#1F2937"
        />
      </ScrollView>

      {/* Continue Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          isFocused && styles.buttonContainerFocused,
          { bottom: buttonBottom }
        ]}
      >
        {isFocused ? (
          <TouchableOpacity
            style={styles.roundContinueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Ionicons name={isFinish ? 'checkmark' : 'chevron-forward'} size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{buttonText}</Text>
            <Ionicons name={isFinish ? 'checkmark' : 'chevron-forward'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 300,
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
    lineHeight: 32,
    marginBottom: 16,
  },
  hintContainer: {
    borderLeftWidth: 2,
    borderLeftColor: '#9CA3AF',
    paddingLeft: 12,
    marginTop: 0,
    alignSelf: 'stretch',
  },
  hintText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 30,
    letterSpacing: -0.1,
  },

  // Free Writing Input
  freeWritingInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    letterSpacing: -0.1,
    lineHeight: 30,
    paddingHorizontal: 0,
    paddingTop: 0,
    minHeight: 200,
  },

  // Button Container
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F5F2',
  },
  buttonContainerFocused: {
    alignItems: 'flex-end',
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  roundContinueButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default MonthlyTrackingReflectionContent;
