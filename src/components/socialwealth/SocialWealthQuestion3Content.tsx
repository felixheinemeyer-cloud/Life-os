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

interface SocialWealthQuestion3ContentProps {
  answer: string;
  onAnswerChange: (value: string) => void;
  onContinue: () => void;
}

const SocialWealthQuestion3Content: React.FC<SocialWealthQuestion3ContentProps> = ({
  answer,
  onAnswerChange,
  onContinue,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
              colors={['#C4B5FD', '#A78BFA', '#8B5CF6']}
              style={styles.iconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInnerCircle}>
                <Ionicons name="chatbubbles" size={28} color="#8B5CF6" />
              </View>
            </LinearGradient>
            <Text style={styles.questionText}>
              What do your best self's friendships and social relationships look and feel like?
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
              <Ionicons name="bulb-outline" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.hintText}>
              Think about the quality of your friendships, how you show up for others, and the energy you bring to social connections.
            </Text>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isButtonEnabled && styles.continueButtonDisabled,
            ]}
            onPress={onContinue}
            activeOpacity={0.8}
            disabled={!isButtonEnabled}
          >
            <Text style={[
              styles.continueButtonText,
              !isButtonEnabled && styles.continueButtonTextDisabled,
            ]}>
              Continue
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isButtonEnabled ? '#FFFFFF' : '#9CA3AF'}
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
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Question Section
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

  // Input Card
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
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.15,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 180,
    letterSpacing: -0.2,
    lineHeight: 24,
  },

  // Hint Card
  hintCard: {
    backgroundColor: '#EDE9FE',
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
    backgroundColor: '#DDD6FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#5B21B6',
    lineHeight: 19,
    letterSpacing: -0.2,
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 18,
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

export default SocialWealthQuestion3Content;
