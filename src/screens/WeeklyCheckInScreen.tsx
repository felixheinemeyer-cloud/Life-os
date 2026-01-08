import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
interface WeeklyCheckInScreenProps {
  navigation: {
    goBack: () => void;
  };
}

interface CheckInQuestion {
  id: string;
  category: string;
  question: string;
  type: 'scale' | 'text' | 'emoji-scale';
  placeholder?: string;
}

// Questions for the check-in
const CHECK_IN_QUESTIONS: CheckInQuestion[] = [
  {
    id: '1',
    category: 'Personal',
    question: 'How are you feeling this week?',
    type: 'emoji-scale',
  },
  {
    id: '2',
    category: 'Connection',
    question: 'How connected have we felt lately?',
    type: 'scale',
  },
  {
    id: '3',
    category: 'Gratitude',
    question: 'Something I appreciate about you this week...',
    type: 'text',
    placeholder: 'Share what made you smile...',
  },
  {
    id: '4',
    category: 'Communication',
    question: 'Is there anything on your mind you\'d like to share?',
    type: 'text',
    placeholder: 'This is a safe space to share...',
  },
  {
    id: '5',
    category: 'Future',
    question: 'Something I\'m looking forward to with you...',
    type: 'text',
    placeholder: 'A moment, date, or goal...',
  },
];

const EMOJI_SCALE = [
  { value: 1, emoji: '😔', label: 'Struggling' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😊', label: 'Great' },
  { value: 5, emoji: '🥰', label: 'Amazing' },
];

// Main Component
const WeeklyCheckInScreen: React.FC<WeeklyCheckInScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [textInput, setTextInput] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isIntro = currentStep === -1;
  const isComplete = currentStep === CHECK_IN_QUESTIONS.length;
  const currentQuestion = CHECK_IN_QUESTIONS[currentStep];
  const progress = (currentStep + 1) / CHECK_IN_QUESTIONS.length;

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep > 0) {
      animateTransition('prev');
      setCurrentStep(currentStep - 1);
      setTextInput(answers[CHECK_IN_QUESTIONS[currentStep - 1].id]?.text || '');
    } else {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Save current answer if it's a text question
    if (currentQuestion?.type === 'text' && textInput.trim()) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: { text: textInput.trim() },
      }));
    }

    animateTransition('next');
    setCurrentStep(currentStep + 1);
    setTextInput('');
  };

  const handleSkip = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    animateTransition('next');
    setCurrentStep(currentStep + 1);
    setTextInput('');
  };

  const animateTransition = (direction: 'next' | 'prev') => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleEmojiSelect = (value: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { scale: value },
    }));
  };

  const handleScaleSelect = (value: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { scale: value },
    }));
  };

  const handleComplete = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // TODO: Save check-in to storage
    navigation.goBack();
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const answer = answers[currentQuestion.id];

    return (
      <Animated.View
        style={[
          styles.questionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{currentQuestion.category}</Text>
        </View>

        {/* Question */}
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* Answer Input Based on Type */}
        {currentQuestion.type === 'emoji-scale' && (
          <View style={styles.emojiScaleContainer}>
            {EMOJI_SCALE.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.emojiOption,
                  answer?.scale === item.value && styles.emojiOptionSelected,
                ]}
                onPress={() => handleEmojiSelect(item.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiIcon}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.emojiLabel,
                    answer?.scale === item.value && styles.emojiLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {currentQuestion.type === 'scale' && (
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabel}>Not very</Text>
              <Text style={styles.scaleLabel}>Very</Text>
            </View>
            <View style={styles.scaleDots}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.scaleDot,
                    answer?.scale === value && styles.scaleDotSelected,
                    answer?.scale >= value && styles.scaleDotFilled,
                  ]}
                  onPress={() => handleScaleSelect(value)}
                  activeOpacity={0.7}
                >
                  {answer?.scale >= value && (
                    <View style={styles.scaleDotInner} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {currentQuestion.type === 'text' && (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={currentQuestion.placeholder}
              placeholderTextColor="#9CA3AF"
              value={textInput}
              onChangeText={setTextInput}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        )}
      </Animated.View>
    );
  };

  const renderComplete = () => (
    <Animated.View
      style={[
        styles.completeContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
        style={styles.completeHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.completeIconCircle}>
          <Ionicons name="checkmark-circle" size={64} color="#E11D48" />
        </View>
      </LinearGradient>

      <Text style={styles.completeTitle}>Check-in Complete!</Text>
      <Text style={styles.completeMessage}>
        Thank you for taking the time to reflect and share. These moments of
        connection help strengthen your relationship.
      </Text>

      <View style={styles.completeCard}>
        <View style={styles.completeCardHeader}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <Text style={styles.completeCardTitle}>Next check-in</Text>
        </View>
        <Text style={styles.completeCardText}>
          We'll remind you next week to do another check-in together.
        </Text>
      </View>
    </Animated.View>
  );

  const canProceed = () => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'text') {
      return true; // Text questions are optional
    }
    return answer?.scale !== undefined;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Check-in</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Progress Bar */}
        {!isComplete && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} of {CHECK_IN_QUESTIONS.length}
            </Text>
          </View>
        )}

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isComplete ? renderComplete() : renderQuestion()}
        </ScrollView>

        {/* Bottom Actions */}
        {!isComplete && (
          <View style={styles.bottomActions}>
            {currentQuestion?.type === 'text' && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              activeOpacity={0.8}
              disabled={!canProceed()}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === CHECK_IN_QUESTIONS.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Complete Button */}
        {isComplete && (
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#F7F5F2',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Question Styles
  questionContainer: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E11D48',
    letterSpacing: -0.1,
  },
  questionText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 32,
  },

  // Emoji Scale
  emojiScaleContainer: {
    gap: 12,
  },
  emojiOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emojiOptionSelected: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  emojiIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  emojiLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  emojiLabelSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E11D48',
  },

  // Number Scale
  scaleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scaleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  scaleDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  scaleDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleDotSelected: {
    borderColor: '#E11D48',
    borderWidth: 3,
  },
  scaleDotFilled: {
    backgroundColor: '#FFF1F2',
  },
  scaleDotInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E11D48',
  },

  // Text Input
  textInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    minHeight: 160,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    gap: 12,
    backgroundColor: '#F7F5F2',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Complete Screen
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  completeHero: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  completeIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  completeMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  completeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  completeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  completeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  completeCardText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default WeeklyCheckInScreen;
