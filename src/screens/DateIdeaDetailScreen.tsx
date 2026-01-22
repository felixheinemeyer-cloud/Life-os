import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DONE_IDEAS_STORAGE_KEY = '@done_date_ideas';
const SAVED_IDEAS_STORAGE_KEY = '@saved_date_ideas';

interface DateIdeaDetailScreenProps {
  navigation: any;
  route: any;
}

// Default color for custom date ideas (matches "My Ideas" theme)
const DEFAULT_IDEA_COLOR = '#0D9488';

const DateIdeaDetailScreen: React.FC<DateIdeaDetailScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { idea } = route.params || {};

  // Detect if this is a custom idea (custom ideas don't have a color property)
  const isCustomIdea = !idea.color;
  const ideaColor = idea.color || DEFAULT_IDEA_COLOR;

  // State
  const [isSaved, setIsSaved] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Load saved and done status
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const savedStored = await AsyncStorage.getItem(SAVED_IDEAS_STORAGE_KEY);
        if (savedStored) {
          const savedIdeas = new Set(JSON.parse(savedStored));
          setIsSaved(savedIdeas.has(idea.id));
        }

        const doneStored = await AsyncStorage.getItem(DONE_IDEAS_STORAGE_KEY);
        if (doneStored) {
          const doneIdeas = new Set(JSON.parse(doneStored));
          setIsDone(doneIdeas.has(idea.id));
        }
      } catch (error) {
        console.error('Error loading status:', error);
      }
    };
    loadStatus();
  }, [idea.id]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleToggleSave = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const stored = await AsyncStorage.getItem(SAVED_IDEAS_STORAGE_KEY);
      const savedIdeas = stored ? new Set(JSON.parse(stored)) : new Set<string>();

      if (savedIdeas.has(idea.id)) {
        savedIdeas.delete(idea.id);
      } else {
        savedIdeas.add(idea.id);
      }

      await AsyncStorage.setItem(SAVED_IDEAS_STORAGE_KEY, JSON.stringify(Array.from(savedIdeas)));
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleToggleChallenge = (challengeId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCompletedChallenges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId);
      } else {
        newSet.add(challengeId);
      }
      return newSet;
    });
  };

  const handleMarkAsDone = async () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      const doneStored = await AsyncStorage.getItem(DONE_IDEAS_STORAGE_KEY);
      const doneIdeas = doneStored ? new Set(JSON.parse(doneStored)) : new Set<string>();
      doneIdeas.add(idea.id);
      await AsyncStorage.setItem(DONE_IDEAS_STORAGE_KEY, JSON.stringify(Array.from(doneIdeas)));
      setIsDone(true);
    } catch (error) {
      console.error('Error marking date as done:', error);
    }
  };

  const handleUnmarkAsDone = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const doneStored = await AsyncStorage.getItem(DONE_IDEAS_STORAGE_KEY);
      const doneIdeas = doneStored ? new Set(JSON.parse(doneStored)) : new Set<string>();
      doneIdeas.delete(idea.id);
      await AsyncStorage.setItem(DONE_IDEAS_STORAGE_KEY, JSON.stringify(Array.from(doneIdeas)));
      setIsDone(false);
    } catch (error) {
      console.error('Error unmarking date as done:', error);
    }
  };

  const getBudgetDisplay = (budget: string): string => {
    switch (budget) {
      case 'free': return 'Free';
      case 'low': return '$';
      case 'medium': return '$$';
      case 'high': return '$$$';
      default: return '$';
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[`${ideaColor}15`, `${ideaColor}05`]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.heroIconCircle, { backgroundColor: `${ideaColor}20` }]}>
              <Ionicons name={idea.icon} size={40} color={ideaColor} />
            </View>
          </LinearGradient>
          <Text style={styles.title}>{idea.title}</Text>
          {!isCustomIdea && idea.tagline && (
            <Text style={styles.tagline}>{idea.tagline}</Text>
          )}
        </Animated.View>

        {/* Quick Info Pills */}
        <Animated.View
          style={[
            styles.quickInfoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {idea.duration && (
            <View style={styles.infoPill}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.infoPillText}>{idea.duration}</Text>
            </View>
          )}
          {idea.budget && (
            <View style={styles.infoPill}>
              <Ionicons name="wallet-outline" size={14} color="#6B7280" />
              <Text style={styles.infoPillText}>{getBudgetDisplay(idea.budget)}</Text>
            </View>
          )}
          {!isCustomIdea && idea.bestTime && (
            <View style={styles.infoPill}>
              <Ionicons name="sunny-outline" size={14} color="#6B7280" />
              <Text style={styles.infoPillText}>{idea.bestTime}</Text>
            </View>
          )}
        </Animated.View>

        {/* Custom Idea Cards */}
        {isCustomIdea && idea.description && (
          <Animated.View
            style={[
              styles.sectionCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: `${ideaColor}15` }]}>
                <Ionicons name="document-text-outline" size={22} color={ideaColor} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.descriptionText}>{idea.description}</Text>
            </View>
          </Animated.View>
        )}

        {/* Pre-built Idea Cards */}
        {!isCustomIdea && (
          <>
            {/* Description Card */}
            <Animated.View
              style={[
                styles.sectionCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="sparkles" size={22} color="#E11D48" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Why this date is special</Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.descriptionText}>{idea.description}</Text>
              </View>
            </Animated.View>

            {/* Steps Section */}
            <Animated.View
              style={[
                styles.sectionCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="list" size={22} color="#E11D48" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>How to make it happen</Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                {idea?.steps?.map((step: string, index: number) => (
                  <View key={index} style={[styles.stepItem, index === 0 && styles.stepItemFirst, index === idea.steps.length - 1 && styles.stepItemLast]}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Challenges Section */}
            <Animated.View
              style={[
                styles.sectionCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons name="trophy" size={22} color="#E11D48" />
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Fun challenges</Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <Text style={styles.challengesSubtitle}>
                  Complete these to make the date extra memorable
                </Text>
                {idea?.challenges?.map((challenge: any, index: number) => (
                  <TouchableOpacity
                    key={challenge.id}
                    style={[
                      styles.challengeItem,
                      completedChallenges.has(challenge.id) && styles.challengeItemCompleted,
                      index === idea.challenges.length - 1 && styles.challengeItemLast,
                    ]}
                    onPress={() => handleToggleChallenge(challenge.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.challengeCheckbox,
                      completedChallenges.has(challenge.id) && styles.challengeCheckboxCompleted,
                    ]}>
                      {completedChallenges.has(challenge.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={styles.challengeContent}>
                      <Text style={styles.challengeTitle}>{challenge.title}</Text>
                      <Text style={styles.challengeDescription}>{challenge.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Header with Gradient Fade */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerBlur} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(240, 238, 232, 0.95)',
              'rgba(240, 238, 232, 0.8)',
              'rgba(240, 238, 232, 0.4)',
              'rgba(240, 238, 232, 0)',
            ]}
            locations={[0, 0.4, 0.75, 1]}
            style={styles.headerGradient}
          />
        </View>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleSave}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={22}
              color={isSaved ? '#E11D48' : '#1F2937'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mark as Done Button */}
      {!isDone && (
        <View style={[styles.bottomButtonContainer, { bottom: 16 }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleMarkAsDone}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Mark as Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Done Button */}
      {isDone && (
        <View style={[styles.bottomButtonContainer, { bottom: 16 }]}>
          <TouchableOpacity
            style={styles.doneButton}
            activeOpacity={0.8}
            onPress={handleUnmarkAsDone}
          >
            <Ionicons name="checkmark-circle" size={18} color="#64748B" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Fixed Header with Gradient
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerGradient: {
    flex: 1,
    height: 120,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroGradient: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
    paddingHorizontal: 24,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  // Quick Info Section
  quickInfoSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Section Card (matching WeeklyReview)
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  sectionContent: {
    gap: 0,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },

  // Steps Section
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB60',
    gap: 12,
  },
  stepItemFirst: {
    paddingTop: 0,
  },
  stepItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
    paddingTop: 3,
  },

  // Challenges Section
  challengesSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginBottom: 16,
    lineHeight: 18,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  challengeItemCompleted: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  challengeItemLast: {
    marginBottom: 0,
  },
  challengeCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    backgroundColor: '#FAFAFA',
  },
  challengeCheckboxCompleted: {
    borderColor: '#E11D48',
    backgroundColor: '#E11D48',
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  challengeDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
  },

  // Bottom Action Button
  bottomButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  doneButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: -0.2,
  },
});

export default DateIdeaDetailScreen;
