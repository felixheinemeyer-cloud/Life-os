import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface DateIdeaDetailScreenProps {
  navigation: any;
  route: any;
}

const DateIdeaDetailScreen: React.FC<DateIdeaDetailScreenProps> = ({ navigation, route }) => {
  const { idea } = route.params || {};

  // State
  const [isSaved, setIsSaved] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  const handleToggleSave = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSaved(!isSaved);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return '#6B7280';
    }
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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
              colors={[`${idea.color}15`, `${idea.color}05`]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.heroIconCircle, { backgroundColor: `${idea.color}20` }]}>
                <Ionicons name={idea.icon} size={48} color={idea.color} />
              </View>
            </LinearGradient>
            <Text style={styles.title}>{idea.title}</Text>
            <Text style={styles.tagline}>{idea.tagline}</Text>
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
            <View style={styles.infoPill}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.infoPillText}>{idea.duration}</Text>
            </View>
            <View style={[styles.infoPill, { borderColor: getDifficultyColor(idea.difficulty) }]}>
              <View style={[styles.difficultyDot, { backgroundColor: getDifficultyColor(idea.difficulty) }]} />
              <Text style={styles.infoPillText}>{idea.difficulty}</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="sunny-outline" size={16} color="#6B7280" />
              <Text style={styles.infoPillText}>{idea.bestTime}</Text>
            </View>
          </Animated.View>

          {/* Description Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={20} color="#E11D48" />
              <Text style={styles.cardTitle}>Why this date is special</Text>
            </View>
            <Text style={styles.descriptionText}>{idea.description}</Text>
          </Animated.View>

          {/* Steps Section */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={20} color="#E11D48" />
              <Text style={styles.cardTitle}>How to make it happen</Text>
            </View>
            {idea?.steps?.map((step: string, index: number) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Challenges Section */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="trophy-outline" size={20} color="#E11D48" />
              <Text style={styles.cardTitle}>Fun challenges</Text>
            </View>
            <Text style={styles.challengesSubtitle}>
              Complete these to make the date extra memorable
            </Text>
            {idea?.challenges?.map((challenge: any) => (
              <TouchableOpacity
                key={challenge.id}
                style={[
                  styles.challengeItem,
                  completedChallenges.has(challenge.id) && styles.challengeItemCompleted,
                ]}
                onPress={() => handleToggleChallenge(challenge.id)}
                activeOpacity={0.7}
              >
                <View style={styles.challengeCheckbox}>
                  {completedChallenges.has(challenge.id) && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.challengeContent}>
                  <Text
                    style={[
                      styles.challengeTitle,
                      completedChallenges.has(challenge.id) && styles.challengeTitleCompleted,
                    ]}
                  >
                    {challenge.title}
                  </Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              // TODO: Mark as planned or done
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Plan this date</Text>
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroGradient: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },

  // Quick Info Section
  quickInfoSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
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
    borderColor: 'transparent',
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 22,
  },

  // Steps Section
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 22,
    paddingTop: 2,
  },

  // Challenges Section
  challengesSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  challengeItemCompleted: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  challengeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  challengeTitleCompleted: {
    color: '#E11D48',
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
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#F7F5F2',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});

export default DateIdeaDetailScreen;
