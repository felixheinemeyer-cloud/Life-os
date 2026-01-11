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

interface MentalWealthOptionalQuestionScreenProps {
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

const MentalWealthOptionalQuestionScreen = ({
  route,
  navigation,
}: MentalWealthOptionalQuestionScreenProps) => {
  const { question, icon, promptHint, questionId } = route.params;
  const [answer, setAnswer] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const buttonBottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
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

  const handleFocus = (): void => {
    setIsFocused(true);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('MentalWealthOverview', {
      reopenOptionalQuestions: true
    });
  };

  const handleFinish = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Keyboard.dismiss();
    navigation.navigate('MentalWealthOverview', {
      newOptionalEntry: {
        questionId: questionId,
        question: question,
        answer: answer.trim(),
        icon: icon,
      }
    });
  };

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
          {/* Question Section */}
          <View style={styles.questionSection}>
            <LinearGradient
              colors={['#93C5FD', '#60A5FA', '#3B82F6']}
              style={styles.iconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInnerCircle}>
                <Ionicons name={icon} size={28} color="#3B82F6" />
              </View>
            </LinearGradient>
            <Text style={styles.questionText}>
              {question}
            </Text>

            {/* Hint Text */}
            {promptHint && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  {promptHint}
                </Text>
              </View>
            )}
          </View>

          {/* Free Writing Area */}
          <TextInput
            ref={textInputRef}
            style={styles.freeWritingInput}
            placeholder="Write your answer here..."
            placeholderTextColor="#9CA3AF"
            multiline
            scrollEnabled={false}
            value={answer}
            onChangeText={setAnswer}
            onFocus={handleFocus}
            onBlur={handleBlur}
            textAlignVertical="top"
            selectionColor="#1F2937"
            cursorColor="#1F2937"
          />
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
              style={styles.roundFinishButton}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.finishButtonText}>Finish</Text>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
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
    paddingTop: 8,
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
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
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
});

export default MentalWealthOptionalQuestionScreen;
