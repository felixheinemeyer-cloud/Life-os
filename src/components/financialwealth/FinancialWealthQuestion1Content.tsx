import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FinancialWealthQuestion1ContentProps {
  answer: string;
  onAnswerChange: (value: string) => void;
  onContinue: () => void;
  buttonText?: string;
}

const FinancialWealthQuestion1Content: React.FC<FinancialWealthQuestion1ContentProps> = ({
  answer,
  onAnswerChange,
  onContinue,
  buttonText = 'Continue',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleFocus = (): void => {
    setIsFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
    }, 100);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
  };

  const isButtonEnabled = answer.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={120}
    >
      <View style={[
        styles.container,
        isKeyboardVisible && styles.containerKeyboardVisible,
      ]}>
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
              colors={['#FDE68A', '#FBBF24', '#EAB308']}
              style={styles.iconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInnerCircle}>
                <Ionicons name="diamond" size={28} color="#EAB308" />
              </View>
            </LinearGradient>
            <Text style={styles.questionText}>
              What does financial wealth look like in your ideal life, and what freedom does it give you?
            </Text>
          </View>

          {/* Text Input Card */}
          <View style={[styles.inputCard, isFocused && styles.inputCardFocused]}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="Write your answer here..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={8}
              value={answer}
              onChangeText={onAnswerChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              textAlignVertical="top"
            />
          </View>

          {/* Inspiration Hint */}
          <View style={styles.hintCard}>
            <View style={styles.hintIconContainer}>
              <Ionicons name="bulb-outline" size={18} color="#EAB308" />
            </View>
            <Text style={styles.hintText}>
              Think beyond numbers. What experiences, choices, and peace of mind does financial security provide?
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            !isButtonEnabled && styles.continueButtonDisabled,
          ]}
          onPress={() => {
            Keyboard.dismiss();
            onContinue();
          }}
          activeOpacity={0.8}
          disabled={!isButtonEnabled}
        >
          <Text style={[
            styles.continueButtonText,
            !isButtonEnabled && styles.continueButtonTextDisabled,
          ]}>
            {buttonText}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={isButtonEnabled ? '#FFFFFF' : '#9CA3AF'}
          />
        </TouchableOpacity>
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
  containerKeyboardVisible: {
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#F7F5F2',
  },
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 30,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputCardFocused: {
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 180,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  hintCard: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  hintIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#78350F',
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default FinancialWealthQuestion1Content;
