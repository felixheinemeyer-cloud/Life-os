import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhysicalWealthOverviewScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

interface QuestionAnswer {
  id: string;
  questionNumber: number;
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
  type?: 'core' | 'optional' | 'custom';
}

interface OptionalQuestion {
  id: string;
  question: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Core questions data
const CORE_QA_DATA: QuestionAnswer[] = [
  {
    id: '1',
    questionNumber: 1,
    question: 'Your best self\'s body, energy and overall health',
    answer: 'I am strong, lean, and full of energy. I wake up feeling refreshed and ready to tackle the day. My body is capable and resilient, allowing me to enjoy all physical activities I love. I have excellent posture and move with confidence. My immune system is strong and I rarely get sick. I feel vibrant and alive every single day.',
    icon: 'body',
    type: 'core',
  },
  {
    id: '2',
    questionNumber: 2,
    question: 'Your best self\'s routines for strength, health and vitality',
    answer: 'I exercise 5 times a week combining strength training and cardio. I eat whole, nutritious foods and stay hydrated. I prioritize 7-8 hours of quality sleep every night. I stretch and do mobility work daily. I take cold showers to boost my energy and resilience. I track my progress and celebrate small wins along the way.',
    icon: 'barbell',
    type: 'core',
  },
  {
    id: '3',
    questionNumber: 3,
    question: 'Behaviors your best self refuses to tolerate',
    answer: 'I refuse to skip workouts for convenience, eat processed junk food, stay up late scrolling on my phone, or neglect my body\'s signals when it needs rest.',
    icon: 'shield-checkmark',
    type: 'core',
  },
  {
    id: '4',
    questionNumber: 4,
    question: 'Your best self\'s approach to rest and recovery',
    answer: 'I take rest days seriously, practice meditation and deep breathing, spend time in nature, and ensure I have quiet time for mental recovery. I listen to my body and rest when needed.',
    icon: 'leaf',
    type: 'core',
  },
];

// Curated optional questions
const OPTIONAL_QUESTIONS: OptionalQuestion[] = [
  {
    id: 'opt1',
    question: 'How does your best self handle injuries or physical setbacks?',
    icon: 'medical',
  },
  {
    id: 'opt2',
    question: 'What does your best self\'s nutrition philosophy look like?',
    icon: 'restaurant',
  },
  {
    id: 'opt3',
    question: 'How does your best self stay motivated to maintain physical health?',
    icon: 'flame',
  },
  {
    id: 'opt4',
    question: 'What physical activities bring your best self the most joy?',
    icon: 'bicycle',
  },
  {
    id: 'opt5',
    question: 'How does your best self balance pushing limits with listening to the body?',
    icon: 'scale',
  },
  {
    id: 'opt6',
    question: 'What role does your best self give to preventive health care?',
    icon: 'heart-circle',
  },
];

const PhysicalWealthOverviewScreen: React.FC<PhysicalWealthOverviewScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [measuredCards, setMeasuredCards] = useState<Set<string>>(new Set());
  const [needsExpansion, setNeedsExpansion] = useState<Set<string>>(new Set());

  // Bottom sheet state
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showOptionalQuestions, setShowOptionalQuestions] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  // Additional questions state
  const [additionalQAs, setAdditionalQAs] = useState<QuestionAnswer[]>([]);
  const [selectedOptionalId, setSelectedOptionalId] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [answerInput, setAnswerInput] = useState('');

  // Get available optional questions (not yet added)
  const availableOptionalQuestions = OPTIONAL_QUESTIONS.filter(
    (opt) => !additionalQAs.some((qa) => qa.id === opt.id)
  );

  const handleTextLayout = (id: string, e: any) => {
    if (!measuredCards.has(id)) {
      const { lines } = e.nativeEvent;
      setMeasuredCards((prev) => new Set(prev).add(id));
      if (lines.length > 5) {
        setNeedsExpansion((prev) => new Set(prev).add(id));
      }
    }
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleEdit = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Navigate to the questions flow to edit answers
    navigation.navigate('PhysicalWealthQuestions');
  };

  const toggleExpand = (id: string) => {
    if (!needsExpansion.has(id)) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const openBottomSheet = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowBottomSheet(true);
    Animated.spring(bottomSheetAnim, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  const closeBottomSheet = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(bottomSheetAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowBottomSheet(false);
      setShowOptionalQuestions(false);
      setShowCustomInput(false);
      setSelectedOptionalId(null);
      setCustomQuestion('');
      setAnswerInput('');
    });
  };

  const handleExploreQuestions = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowOptionalQuestions(true);
  };

  const handleWriteOwn = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowCustomInput(true);
  };

  const handleSelectOptional = (question: OptionalQuestion) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedOptionalId(question.id);
    setShowOptionalQuestions(false);
  };

  const handleSaveAnswer = () => {
    if (!answerInput.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (selectedOptionalId) {
      // Save optional question answer
      const optQuestion = OPTIONAL_QUESTIONS.find((q) => q.id === selectedOptionalId);
      if (optQuestion) {
        const newQA: QuestionAnswer = {
          id: optQuestion.id,
          questionNumber: CORE_QA_DATA.length + additionalQAs.length + 1,
          question: optQuestion.question,
          answer: answerInput.trim(),
          icon: optQuestion.icon,
          type: 'optional',
        };
        setAdditionalQAs((prev) => [...prev, newQA]);
      }
    } else if (customQuestion.trim()) {
      // Save custom question answer
      const newQA: QuestionAnswer = {
        id: `custom_${Date.now()}`,
        questionNumber: CORE_QA_DATA.length + additionalQAs.length + 1,
        question: customQuestion.trim(),
        answer: answerInput.trim(),
        icon: 'create',
        type: 'custom',
      };
      setAdditionalQAs((prev) => [...prev, newQA]);
    }

    closeBottomSheet();
  };

  const handleDeleteAdditional = (id: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAdditionalQAs((prev) => prev.filter((qa) => qa.id !== id));
  };

  const renderCard = (item: QuestionAnswer, isAdditional: boolean = false) => {
    const isExpanded = expandedCards.has(item.id);
    const isMeasured = measuredCards.has(item.id);
    const isLongAnswer = needsExpansion.has(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={isLongAnswer ? 0.8 : 1}
        onPress={() => toggleExpand(item.id)}
        onLongPress={isAdditional ? () => handleDeleteAdditional(item.id) : undefined}
        style={styles.cardWrapper}
      >
        <View style={[styles.card, isAdditional && styles.additionalCard]}>
          {/* Card Accent */}
          <View style={[
            styles.cardAccent,
            item.type === 'custom' && styles.customAccent,
            item.type === 'optional' && styles.optionalAccent,
          ]} />

          {/* Badge for additional cards */}
          {isAdditional && (
            <View style={[
              styles.badge,
              item.type === 'custom' ? styles.customBadge : styles.optionalBadge,
            ]}>
              <Text style={styles.badgeText}>
                {item.type === 'custom' ? 'Custom' : 'Optional'}
              </Text>
            </View>
          )}

          {/* Question Header with Icon */}
          <View style={[styles.questionHeader, isAdditional && { marginTop: 8 }]}>
            <LinearGradient
              colors={item.type === 'custom'
                ? ['#FDE68A', '#FCD34D', '#F59E0B']
                : ['#34D399', '#10B981', '#059669']}
              style={styles.questionIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.questionIconInner}>
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={item.type === 'custom' ? '#F59E0B' : '#059669'}
                />
              </View>
            </LinearGradient>
            <Text style={styles.questionText}>{item.question}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Answer Section */}
          <View style={styles.answerSection}>
            <Text
              style={styles.answerText}
              numberOfLines={!isMeasured ? undefined : (isExpanded || !isLongAnswer ? undefined : 5)}
              onTextLayout={(e) => handleTextLayout(item.id, e)}
            >
              {item.answer}
            </Text>
            {isMeasured && isLongAnswer && (
              <View style={styles.expandIndicator}>
                <Text style={styles.expandText}>
                  {isExpanded ? 'Show less' : 'Read more'}
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#059669"
                />
              </View>
            )}
          </View>

          {/* Delete hint for additional cards */}
          {isAdditional && (
            <Text style={styles.deleteHint}>Long press to remove</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Determine what to show in the bottom sheet content area
  const renderBottomSheetContent = () => {
    if (selectedOptionalId || showCustomInput) {
      // Show answer input
      const selectedQuestion = selectedOptionalId
        ? OPTIONAL_QUESTIONS.find((q) => q.id === selectedOptionalId)?.question
        : customQuestion;

      return (
        <View style={styles.answerInputContainer}>
          {showCustomInput && !selectedOptionalId && (
            <View style={styles.customQuestionInput}>
              <Text style={styles.inputLabel}>Your question</Text>
              <TextInput
                style={styles.questionTextInput}
                placeholder="What do you want to reflect on?"
                placeholderTextColor="#9CA3AF"
                value={customQuestion}
                onChangeText={setCustomQuestion}
                multiline
              />
            </View>
          )}

          {(selectedOptionalId || customQuestion.trim()) && (
            <>
              <View style={styles.selectedQuestionCard}>
                <Ionicons
                  name={selectedOptionalId ? 'help-circle' : 'create'}
                  size={20}
                  color="#059669"
                />
                <Text style={styles.selectedQuestionText}>
                  {selectedQuestion}
                </Text>
              </View>

              <Text style={styles.inputLabel}>Your answer</Text>
              <TextInput
                style={styles.answerTextInput}
                placeholder="Write your reflection..."
                placeholderTextColor="#9CA3AF"
                value={answerInput}
                onChangeText={setAnswerInput}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !answerInput.trim() && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveAnswer}
                disabled={!answerInput.trim()}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.saveButtonText,
                  !answerInput.trim() && styles.saveButtonTextDisabled,
                ]}>
                  Save Reflection
                </Text>
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={answerInput.trim() ? '#FFFFFF' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      );
    }

    if (showOptionalQuestions) {
      // Show optional questions list
      return (
        <View style={styles.optionalQuestionsContainer}>
          <Text style={styles.sheetSectionTitle}>Choose a question</Text>
          <ScrollView
            style={styles.optionalQuestionsList}
            showsVerticalScrollIndicator={false}
          >
            {availableOptionalQuestions.length > 0 ? (
              availableOptionalQuestions.map((question) => (
                <TouchableOpacity
                  key={question.id}
                  style={styles.optionalQuestionItem}
                  onPress={() => handleSelectOptional(question)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionalQuestionIcon}>
                    <Ionicons name={question.icon} size={18} color="#059669" />
                  </View>
                  <Text style={styles.optionalQuestionText}>
                    {question.question}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noQuestionsLeft}>
                <Ionicons name="checkmark-circle" size={48} color="#059669" />
                <Text style={styles.noQuestionsText}>
                  You've answered all optional questions!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    // Show main menu
    return (
      <View style={styles.menuContainer}>
        {/* Explore Questions Card */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={handleExploreQuestions}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#FFFFFF']}
            style={styles.menuCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={['#34D399', '#10B981', '#059669']}
              style={styles.menuCardIconRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.menuCardIconInner}>
                <Ionicons name="compass" size={24} color="#059669" />
              </View>
            </LinearGradient>
            <View style={styles.menuCardContent}>
              <Text style={styles.menuCardTitle}>Explore questions</Text>
              <Text style={styles.menuCardSubtitle}>
                Pick one and dive deeper
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#059669" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Write Your Own Card */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={handleWriteOwn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFFFFF', '#FFFFFF']}
            style={styles.menuCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={['#FDE68A', '#FBBF24', '#F59E0B']}
              style={styles.menuCardIconRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.menuCardIconInner}>
                <Ionicons name="create" size={24} color="#F59E0B" />
              </View>
            </LinearGradient>
            <View style={styles.menuCardContent}>
              <Text style={styles.menuCardTitle}>Write your own</Text>
              <Text style={styles.menuCardSubtitle}>
                Create your own question
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#F59E0B" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scrollable Title */}
        <View style={styles.scrollableTitle}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={['#34D399', '#10B981', '#059669']}
              style={styles.titleIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.titleIconInner}>
                <Ionicons name="fitness" size={20} color="#059669" />
              </View>
            </LinearGradient>
            <Text style={styles.title}>Physical Wealth</Text>
          </View>
          <Text style={styles.subtitle}>
            Your vision for your best physical self
          </Text>
        </View>

        {/* Core Q&A Cards */}
        {CORE_QA_DATA.map((item) => renderCard(item, false))}

        {/* Additional Q&A Cards */}
        {additionalQAs.map((item) => renderCard(item, true))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Header with Blur Background */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background */}
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 0.85)',
              'rgba(247, 245, 242, 0.6)',
              'rgba(247, 245, 242, 0.3)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.headerGradient}
          />
        </View>

        {/* Header Content */}
        <View style={styles.header} pointerEvents="box-none">
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={openBottomSheet}
                style={styles.addButton}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={22} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.editButton}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={18} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <LinearGradient
                colors={['#34D399', '#10B981', '#059669']}
                style={styles.titleIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.titleIconInner}>
                  <Ionicons name="fitness" size={20} color="#059669" />
                </View>
              </LinearGradient>
              <Text style={styles.title}>Physical Wealth</Text>
            </View>
            <Text style={styles.subtitle}>
              Your vision for your best physical self
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeBottomSheet}
          >
            <Animated.View
              style={[
                styles.backdropOverlay,
                {
                  opacity: bottomSheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              ]}
            />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [
                  {
                    translateY: bottomSheetAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [SCREEN_HEIGHT, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                style={styles.sheetBackButton}
                onPress={() => {
                  if (selectedOptionalId) {
                    setSelectedOptionalId(null);
                    setAnswerInput('');
                    setShowOptionalQuestions(true);
                  } else if (showOptionalQuestions || showCustomInput) {
                    setShowOptionalQuestions(false);
                    setShowCustomInput(false);
                    setCustomQuestion('');
                    setAnswerInput('');
                  } else {
                    closeBottomSheet();
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showOptionalQuestions || showCustomInput || selectedOptionalId ? 'chevron-back' : 'close'}
                  size={24}
                  color="#1F2937"
                />
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>
                {selectedOptionalId || showCustomInput
                  ? 'Add reflection'
                  : showOptionalQuestions
                    ? 'Optional questions'
                    : 'Go deeper'}
              </Text>
              <View style={styles.sheetHeaderSpacer} />
            </View>

            {/* Content */}
            <ScrollView
              style={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderBottomSheetContent()}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  scrollableTitle: {
    marginBottom: 24,
  },

  // Header Container
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },

  // Header
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
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
  editButton: {
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
  headerContent: {
    paddingHorizontal: 4,
    marginTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    marginRight: 12,
  },
  titleIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottomSpacer: {
    height: 32,
  },

  // Card Styles
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#10B981',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  // Question Header
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionIconGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    marginRight: 10,
    flexShrink: 0,
  },
  questionIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Question Text
  questionText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },

  // Answer Section
  answerSection: {},
  answerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 22,
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    gap: 2,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
  },
  additionalCard: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  customAccent: {
    backgroundColor: '#F59E0B',
  },
  optionalAccent: {
    backgroundColor: '#34D399',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionalBadge: {
    backgroundColor: '#D1FAE5',
  },
  customBadge: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteHint: {
    fontSize: 11,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },

  // Modal & Bottom Sheet
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  sheetHeaderSpacer: {
    width: 36,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    backgroundColor: '#F7F5F2',
  },
  sheetSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 12,
  },

  // Menu Cards
  menuContainer: {
    paddingVertical: 20,
    gap: 12,
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  menuCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
  },
  menuCardIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    padding: 3,
  },
  menuCardIconInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  menuCardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // Optional Questions List
  optionalQuestionsContainer: {
    paddingBottom: 24,
  },
  optionalQuestionsList: {
    maxHeight: 400,
  },
  optionalQuestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionalQuestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionalQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 21,
  },
  noQuestionsLeft: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noQuestionsText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },

  // Answer Input
  answerInputContainer: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  customQuestionInput: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionTextInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedQuestionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  selectedQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 22,
  },
  answerTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 150,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    lineHeight: 22,
  },
  saveButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default PhysicalWealthOverviewScreen;
