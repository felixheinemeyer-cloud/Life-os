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
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface FinancialWealthOptionalQuestionScreenProps {
  route: {
    params: {
      question: string;
      icon: keyof typeof Ionicons.glyphMap;
      promptHint?: string;
      questionId: string;
    };
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

const FinancialWealthOptionalQuestionScreen = ({
  route,
  navigation,
}: FinancialWealthOptionalQuestionScreenProps) => {
  const { question, icon, promptHint, questionId } = route.params;
  const [answer, setAnswer] = useState('');
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

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate back and signal to reopen the optional questions list
    navigation.navigate('FinancialWealthOverview', {
      reopenOptionalQuestions: true
    });
  };

  const handleFinish = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Keyboard.dismiss();
    // Navigate back with the optional question answer data
    navigation.navigate('FinancialWealthOverview', {
      newOptionalEntry: {
        questionId: questionId,
        question: question,
        answer: answer.trim(),
        icon: icon,
      }
    });
  };

  const isButtonEnabled = answer.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={0}
      >
        <View style={[
          styles.container,
          isKeyboardVisible && styles.containerKeyboardVisible,
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

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
                  <Ionicons name={icon} size={28} color="#EAB308" />
                </View>
              </LinearGradient>
              <Text style={styles.questionText}>
                {question}
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
                onChangeText={setAnswer}
                onFocus={handleFocus}
                onBlur={handleBlur}
                textAlignVertical="top"
              />
            </View>

            {/* Prompt Hint */}
            {promptHint && (
              <View style={styles.hintCard}>
                <View style={styles.hintIconContainer}>
                  <Ionicons name="bulb-outline" size={18} color="#EAB308" />
                </View>
                <Text style={styles.hintText}>
                  {promptHint}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Finish Button */}
          <TouchableOpacity
            style={[
              styles.finishButton,
              !isButtonEnabled && styles.finishButtonDisabled,
            ]}
            onPress={handleFinish}
            activeOpacity={0.8}
            disabled={!isButtonEnabled}
          >
            <Text style={[
              styles.finishButtonText,
              !isButtonEnabled && styles.finishButtonTextDisabled,
            ]}>
              Finish
            </Text>
            <Ionicons
              name="checkmark"
              size={18}
              color={isButtonEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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

  // Hint Card
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
    color: '#92400E',
    lineHeight: 19,
    letterSpacing: -0.2,
  },

  // Finish Button
  finishButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  finishButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  finishButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default FinancialWealthOptionalQuestionScreen;
