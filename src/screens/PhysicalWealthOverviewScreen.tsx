import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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
}

// Sample data - in a real app, this would come from persistent storage
const SAMPLE_QA_DATA: QuestionAnswer[] = [
  {
    id: '1',
    questionNumber: 1,
    question: 'Your best self\'s body, energy and overall health',
    answer: 'I am strong, lean, and full of energy. I wake up feeling refreshed and ready to tackle the day. My body is capable and resilient, allowing me to enjoy all physical activities I love. I have excellent posture and move with confidence. My immune system is strong and I rarely get sick. I feel vibrant and alive every single day.',
    icon: 'body',
  },
  {
    id: '2',
    questionNumber: 2,
    question: 'Your best self\'s routines for strength, health and vitality',
    answer: 'I exercise 5 times a week combining strength training and cardio. I eat whole, nutritious foods and stay hydrated. I prioritize 7-8 hours of quality sleep every night. I stretch and do mobility work daily. I take cold showers to boost my energy and resilience. I track my progress and celebrate small wins along the way.',
    icon: 'barbell',
  },
  {
    id: '3',
    questionNumber: 3,
    question: 'Behaviors your best self refuses to tolerate',
    answer: 'I refuse to skip workouts for convenience, eat processed junk food, stay up late scrolling on my phone, or neglect my body\'s signals when it needs rest.',
    icon: 'shield-checkmark',
  },
  {
    id: '4',
    questionNumber: 4,
    question: 'Your best self\'s approach to rest and recovery',
    answer: 'I take rest days seriously, practice meditation and deep breathing, spend time in nature, and ensure I have quiet time for mental recovery. I listen to my body and rest when needed.',
    icon: 'leaf',
  },
];

const PhysicalWealthOverviewScreen: React.FC<PhysicalWealthOverviewScreenProps> = ({
  navigation,
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [measuredCards, setMeasuredCards] = useState<Set<string>>(new Set());
  const [needsExpansion, setNeedsExpansion] = useState<Set<string>>(new Set());

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={18} color="#1F2937" />
            </TouchableOpacity>
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

        {/* Q&A Cards */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SAMPLE_QA_DATA.map((item) => {
            const isExpanded = expandedCards.has(item.id);
            const isMeasured = measuredCards.has(item.id);
            const isLongAnswer = needsExpansion.has(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={isLongAnswer ? 0.8 : 1}
                onPress={() => toggleExpand(item.id)}
                style={styles.cardWrapper}
              >
                <View style={styles.card}>
                  {/* Card Accent */}
                  <View style={styles.cardAccent} />

                  {/* Question Header with Icon */}
                  <View style={styles.questionHeader}>
                    <LinearGradient
                      colors={['#34D399', '#10B981', '#059669']}
                      style={styles.questionIconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.questionIconInner}>
                        <Ionicons name={item.icon} size={16} color="#059669" />
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
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    marginBottom: 16,
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
});

export default PhysicalWealthOverviewScreen;
