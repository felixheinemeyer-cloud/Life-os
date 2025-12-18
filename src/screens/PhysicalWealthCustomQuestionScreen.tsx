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

interface PhysicalWealthCustomQuestionScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

const PhysicalWealthCustomQuestionScreen: React.FC<PhysicalWealthCustomQuestionScreenProps> = ({
  navigation,
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isFocused, setIsFocused] = useState<'question' | 'answer' | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const questionInputRef = useRef<TextInput>(null);
  const answerInputRef = useRef<TextInput>(null);
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

  const handleFocus = (field: 'question' | 'answer'): void => {
    setIsFocused(field);
    if (field === 'answer') {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 150, animated: true });
      }, 100);
    }
  };

  const handleBlur = (): void => {
    setIsFocused(null);
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Navigate back and signal to reopen the Go deeper menu
    navigation.navigate('PhysicalWealthOverview', {
      reopenGoDeeper: true
    });
  };

  const handleFinish = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Keyboard.dismiss();
    // Navigate back with the custom question and answer data
    navigation.navigate('PhysicalWealthOverview', {
      newCustomEntry: {
        question: question.trim(),
        answer: answer.trim(),
      }
    });
  };

  const isButtonEnabled = question.trim().length > 0 && answer.trim().length > 0;

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
            {/* Icon Section */}
            <View style={styles.iconSection}>
              <LinearGradient
                colors={['#34D399', '#10B981', '#059669']}
                style={styles.iconGradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconInnerCircle}>
                  <Ionicons name="create" size={28} color="#059669" />
                </View>
              </LinearGradient>
              <Text style={styles.instructionText}>
                Write your own reflection question
              </Text>
            </View>

            {/* Question Input Card */}
            <View style={styles.sectionContainer}>
              <Text style={styles.inputLabel}>Your question</Text>
              <View style={[styles.inputCard, isFocused === 'question' && styles.inputCardFocused]}>
                <TextInput
                  ref={questionInputRef}
                  style={styles.questionInput}
                  placeholder="Ask about your best self..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={question}
                  onChangeText={setQuestion}
                  onFocus={() => handleFocus('question')}
                  onBlur={handleBlur}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Answer Input Card */}
            <View style={styles.sectionContainer}>
              <Text style={styles.inputLabel}>Your answer</Text>
              <View style={[styles.inputCard, isFocused === 'answer' && styles.inputCardFocused]}>
                <TextInput
                  ref={answerInputRef}
                  style={styles.answerInput}
                  placeholder="Write your answer here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={8}
                  value={answer}
                  onChangeText={setAnswer}
                  onFocus={() => handleFocus('answer')}
                  onBlur={handleBlur}
                  textAlignVertical="top"
                />
              </View>
            </View>
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

  // Icon Section
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  instructionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Input Sections
  sectionContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
  questionInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 80,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  answerInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 180,
    letterSpacing: -0.2,
    lineHeight: 24,
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

export default PhysicalWealthCustomQuestionScreen;
