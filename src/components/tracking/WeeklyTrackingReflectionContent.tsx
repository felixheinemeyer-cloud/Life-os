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

// Teal color scheme for weekly check-in
const THEME_COLORS = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryLighter: '#5EEAD4',
  gradient: ['#5EEAD4', '#14B8A6', '#0D9488'] as const,
};

export type ReflectionType = 'wentWell' | 'improveNextWeek' | 'lessonLearned';

interface ReflectionConfig {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  hint?: string;
}

const REFLECTION_CONFIGS: Record<ReflectionType, ReflectionConfig> = {
  wentWell: {
    title: 'What went well for you this week?',
    icon: 'trophy',
    placeholder: 'Reflect on your wins and accomplishments...',
    hint: 'Reflect on your wins and accomplishments',
  },
  improveNextWeek: {
    title: 'What do you want to improve or do differently next week?',
    icon: 'arrow-up-circle',
    placeholder: 'Think about areas for growth and change...',
    hint: 'Think about areas for growth and change',
  },
  lessonLearned: {
    title: 'What did you learn this week?',
    icon: 'bulb',
    placeholder: 'Capture your insights and learnings...',
    hint: 'Capture your insights and learnings',
  },
};

interface WeeklyTrackingReflectionContentProps {
  reflectionType: ReflectionType;
  value: string;
  onValueChange: (value: string) => void;
  onContinue: () => void;
}

const WeeklyTrackingReflectionContent: React.FC<WeeklyTrackingReflectionContentProps> = ({
  reflectionType,
  value,
  onValueChange,
  onContinue,
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
            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
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

export default WeeklyTrackingReflectionContent;
