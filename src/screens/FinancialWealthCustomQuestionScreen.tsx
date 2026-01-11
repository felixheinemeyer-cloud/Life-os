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
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface FinancialWealthCustomQuestionScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

const FinancialWealthCustomQuestionScreen: React.FC<FinancialWealthCustomQuestionScreenProps> = ({
  navigation,
}) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const questionInputRef = useRef<TextInput>(null);
  const answerInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonBottom = useRef(new Animated.Value(0)).current;

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

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('FinancialWealthOverview', {
      reopenGoDeeper: true
    });
  };

  const handleFinish = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Keyboard.dismiss();
    navigation.navigate('FinancialWealthOverview', {
      newCustomEntry: {
        question: question.trim(),
        answer: answer.trim(),
      }
    });
  };

  const isButtonEnabled = question.trim().length > 0 && answer.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
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
              colors={['#FDE68A', '#FBBF24', '#EAB308']}
              style={styles.iconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInnerCircle}>
                <Ionicons name="create" size={28} color="#EAB308" />
              </View>
            </LinearGradient>
            <Text style={styles.titleText}>
              Write your own reflection question
            </Text>
          </View>

          {/* Question Input Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.inputLabel}>Question</Text>
            <TextInput
              ref={questionInputRef}
              style={styles.questionInput}
              placeholder="Ask about your best self..."
              placeholderTextColor="#9CA3AF"
              multiline
              scrollEnabled={false}
              value={question}
              onChangeText={setQuestion}
              textAlignVertical="top"
              selectionColor="#1F2937"
              cursorColor="#1F2937"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Answer Input Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.inputLabel}>Answer</Text>
            <TextInput
              ref={answerInputRef}
              style={styles.answerInput}
              placeholder="Write your answer here..."
              placeholderTextColor="#9CA3AF"
              multiline
              scrollEnabled={false}
              value={answer}
              onChangeText={setAnswer}
              textAlignVertical="top"
              selectionColor="#1F2937"
              cursorColor="#1F2937"
            />
          </View>
        </ScrollView>

        {/* Finish Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            isFocused && styles.buttonContainerFocused,
            { bottom: buttonBottom }
          ]}
        >
          {isFocused ? (
            <TouchableOpacity
              style={[
                styles.roundFinishButton,
                !isButtonEnabled && styles.roundFinishButtonDisabled,
              ]}
              onPress={handleFinish}
              activeOpacity={0.8}
              disabled={!isButtonEnabled}
            >
              <Ionicons
                name="checkmark"
                size={22}
                color={isButtonEnabled ? '#FFFFFF' : '#9CA3AF'}
              />
            </TouchableOpacity>
          ) : (
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
          )}
        </Animated.View>
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
    paddingBottom: 300,
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
  titleText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },

  // Input Sections
  sectionContainer: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    letterSpacing: -0.2,
    borderLeftWidth: 2,
    borderLeftColor: '#9CA3AF',
    paddingLeft: 12,
  },
  questionInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    letterSpacing: -0.1,
    lineHeight: 30,
    minHeight: 60,
    paddingHorizontal: 0,
  },
  answerInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    letterSpacing: -0.1,
    lineHeight: 30,
    minHeight: 150,
    paddingHorizontal: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 16,
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
  finishButton: {
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
  finishButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  finishButtonTextDisabled: {
    color: '#9CA3AF',
  },
  roundFinishButton: {
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
  roundFinishButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
});

export default FinancialWealthCustomQuestionScreen;
