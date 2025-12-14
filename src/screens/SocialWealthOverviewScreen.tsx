import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SocialWealthOverviewScreenProps {
  route?: {
    params?: {
      reopenOptionalQuestions?: boolean;
      reopenGoDeeper?: boolean;
    };
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
    setParams: (params: any) => void;
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
  promptHint?: string;
}

// Core questions data
const CORE_QA_DATA: QuestionAnswer[] = [
  {
    id: '1',
    questionNumber: 1,
    question: 'Your best self\'s friendships and social relationships',
    answer: 'My friendships are deep, authentic, and mutually supportive. I have a close circle of friends who truly know and accept me. We celebrate each other\'s wins and support each other through challenges. I feel energized after spending time with my friends, and our connections are built on trust, honesty, and shared experiences.',
    icon: 'chatbubbles',
    type: 'core',
  },
  {
    id: '2',
    questionNumber: 2,
    question: 'How your best self nurtures social connections',
    answer: 'I reach out regularly to check in on friends without needing a reason. I remember important dates and celebrate milestones with the people I care about. I listen more than I speak and show genuine curiosity about others\' lives. I make time for social activities even when life gets busy, and I\'m always there when someone needs support.',
    icon: 'hand-left',
    type: 'core',
  },
  {
    id: '3',
    questionNumber: 3,
    question: 'Your best self\'s ideal romantic relationship',
    answer: 'My romantic relationship is built on deep trust, respect, and genuine partnership. We communicate openly and honestly, supporting each other\'s dreams while building a life together. There\'s a beautiful balance of independence and togetherness. We laugh often, handle conflicts with grace, and continuously grow both individually and as a couple.',
    icon: 'heart',
    type: 'core',
  },
  {
    id: '4',
    questionNumber: 4,
    question: 'How your best self shows up in romantic love',
    answer: 'I am fully present with my partner, putting away distractions during our time together. I express love through words, actions, and small daily gestures. I listen with empathy, validate their feelings, and work through disagreements with patience. I maintain my own identity while being a devoted partner, and I never stop dating them.',
    icon: 'people',
    type: 'core',
  },
];

// Curated optional questions
const OPTIONAL_QUESTIONS: OptionalQuestion[] = [
  {
    id: 'opt1',
    question: 'What social strengths or qualities do you want to be known for?',
    icon: 'medal',
    promptHint: 'Think about how you show up in relationships. Consider traits like being trustworthy, authentic, empathetic, inspiring, fun, a good listener, reliable, or someone who brings positive energy.',
  },
  {
    id: 'opt2',
    question: 'How does your best self handle conflicts, misunderstandings, or emotional challenges in relationships?',
    icon: 'shield-checkmark',
    promptHint: 'Consider communication style, emotional regulation, courage in difficult conversations, and empathy.',
  },
  {
    id: 'opt3',
    question: 'Which types of people does your best social self intentionally surround themselves with?',
    icon: 'people-circle',
    promptHint: 'Think about values, energy, ambition, kindness, growth mindset, or shared passions.',
  },
  {
    id: 'opt4',
    question: 'What role does community play in your ideal life, and how do you contribute to it?',
    icon: 'earth',
    promptHint: 'Think about family, friendships, professional circles, networking, clubs, local groups, or digital communities.',
  },
];

const SocialWealthOverviewScreen: React.FC<SocialWealthOverviewScreenProps> = ({
  route,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
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

  // Handle reopening optional questions when returning from question screen
  useEffect(() => {
    if (isFocused && route?.params?.reopenOptionalQuestions) {
      // Clear the param
      navigation.setParams({ reopenOptionalQuestions: undefined });
      // Reopen the bottom sheet with optional questions
      setShowBottomSheet(true);
      setShowOptionalQuestions(true);
      Animated.spring(bottomSheetAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, route?.params?.reopenOptionalQuestions]);

  // Handle reopening Go deeper menu when returning from custom question screen
  useEffect(() => {
    if (isFocused && route?.params?.reopenGoDeeper) {
      // Clear the param
      navigation.setParams({ reopenGoDeeper: undefined });
      // Reopen the bottom sheet with main menu
      setShowBottomSheet(true);
      setShowOptionalQuestions(false);
      setShowCustomInput(false);
      Animated.spring(bottomSheetAnim, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused, route?.params?.reopenGoDeeper]);

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
    navigation.navigate('SocialWealthQuestions');
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
    // Close the bottom sheet
    closeBottomSheet();
    // Navigate to the custom question screen
    navigation.navigate('SocialWealthCustomQuestion');
  };

  const handleSelectOptional = (question: OptionalQuestion) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Close the bottom sheet
    closeBottomSheet();
    // Navigate to the optional question screen
    navigation.navigate('SocialWealthOptionalQuestion', {
      question: question.question,
      icon: question.icon,
      promptHint: question.promptHint,
      questionId: question.id,
    });
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
                : ['#C4B5FD', '#A78BFA', '#8B5CF6']}
              style={styles.questionIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.questionIconInner}>
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={item.type === 'custom' ? '#F59E0B' : '#8B5CF6'}
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
                  color="#8B5CF6"
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
      const selectedOptQuestion = selectedOptionalId
        ? OPTIONAL_QUESTIONS.find((q) => q.id === selectedOptionalId)
        : null;
      const selectedQuestion = selectedOptQuestion?.question || customQuestion;

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
                  color="#8B5CF6"
                />
                <Text style={styles.selectedQuestionText}>
                  {selectedQuestion}
                </Text>
              </View>

              {selectedOptQuestion?.promptHint && (
                <View style={styles.promptHintContainer}>
                  <Ionicons name="bulb-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.promptHintText}>
                    {selectedOptQuestion.promptHint}
                  </Text>
                </View>
              )}

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
                  <View style={styles.optionalQuestionIconRing}>
                    <Ionicons name={question.icon} size={18} color="#8B5CF6" />
                  </View>
                  <View style={styles.optionalQuestionContent}>
                    <Text style={styles.optionalQuestionTitle} numberOfLines={3}>
                      {question.question}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noQuestionsLeft}>
                <Ionicons name="checkmark-circle" size={48} color="#8B5CF6" />
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
              colors={['#C4B5FD', '#A78BFA', '#8B5CF6']}
              style={styles.menuCardIconRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.menuCardIconInner}>
                <Ionicons name="compass" size={24} color="#8B5CF6" />
              </View>
            </LinearGradient>
            <View style={styles.menuCardContent}>
              <Text style={styles.menuCardTitle}>Explore questions</Text>
              <Text style={styles.menuCardSubtitle}>
                Pick one and dive deeper
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#6B7280" />
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
            <Ionicons name="chevron-forward" size={22} color="#6B7280" />
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
              colors={['#C4B5FD', '#A78BFA', '#8B5CF6']}
              style={styles.titleIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.titleIconInner}>
                <Ionicons name="people" size={20} color="#8B5CF6" />
              </View>
            </LinearGradient>
            <Text style={styles.title}>Social Wealth</Text>
          </View>
          <Text style={styles.subtitle}>
            Your vision for your best social self
          </Text>
        </View>

        {/* Core Q&A Cards */}
        {CORE_QA_DATA.map((item) => renderCard(item, false))}

        {/* Additional Q&A Cards */}
        {additionalQAs.map((item) => renderCard(item, true))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
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
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
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
  scrollableTitle: {
    marginBottom: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  additionalCard: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#8B5CF6',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  customAccent: {
    backgroundColor: '#F59E0B',
  },
  optionalAccent: {
    backgroundColor: '#A78BFA',
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
    backgroundColor: '#EDE9FE',
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
  questionText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  answerSection: {},
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
    color: '#8B5CF6',
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
    maxHeight: 500,
  },
  optionalQuestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  optionalQuestionIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  optionalQuestionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionalQuestionTitle: {
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  selectedQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 22,
  },
  promptHintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  promptHintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    lineHeight: 19,
    fontStyle: 'italic',
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

export default SocialWealthOverviewScreen;
