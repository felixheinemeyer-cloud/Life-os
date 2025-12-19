import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface DailyOverviewScreenProps {
  navigation: {
    goBack: () => void;
  };
}

// Mock data for December 19th
const dailyData = {
  date: {
    dayName: 'Thursday',
    month: 'December',
    day: 19,
    year: 2024,
    weekNumber: 51,
  },
  summary: {
    mood: 'Energized',
    moodIcon: 'flash' as const,
    energy: 4,
    highlight: 'Had a productive morning and great coffee with a friend',
  },
  morning: {
    completed: true,
    sleepHours: 7.5,
    bedtime: '22:30',
    wakeTime: '06:00',
    gratitude: 'Grateful for the sunny weather and a good night\'s sleep',
    intention: 'Focus on deep work and be present in conversations',
  },
  evening: {
    completed: true,
    priorityCompleted: true,
    priority: 'Finish the product design review',
    ratings: {
      nutrition: 4,
      energy: 4,
      satisfaction: 5,
    },
    journal: 'Today felt balanced and intentional. The morning deep work session was incredibly productive. Coffee with Emma was exactly what I needed - we talked about growth, change, and being patient with ourselves. Ended the day feeling grateful and accomplished.',
  },
  wins: [
    'Completed the product design review ahead of schedule',
    'Had a meaningful conversation with Emma',
    'Stayed consistent with morning routine',
  ],
};

const DailyOverviewScreen: React.FC<DailyOverviewScreenProps> = ({
  navigation,
}) => {
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const renderEnergyBar = (level: number, maxLevel: number = 5) => {
    return (
      <View style={styles.energyBarContainer}>
        <View style={styles.energyBarBackground}>
          <View
            style={[
              styles.energyBarFill,
              { width: `${(level / maxLevel) * 100}%` }
            ]}
          />
        </View>
      </View>
    );
  };

  const renderRatingDots = (rating: number, color: string) => {
    return (
      <View style={styles.ratingDotsContainer}>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.ratingDot,
              level <= rating ? { backgroundColor: color } : { backgroundColor: '#E5E7EB' },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Refined Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerDate}>
            {dailyData.date.dayName}, {dailyData.date.month} {dailyData.date.day}
          </Text>
          <View style={styles.weekBadge}>
            <Text style={styles.weekBadgeText}>Week {dailyData.date.weekNumber}</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.backgroundContainer}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero: Day Summary */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.moodContainer}>
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A', '#FCD34D']}
                  style={styles.moodIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={dailyData.summary.moodIcon} size={28} color="#92400E" />
                </LinearGradient>
                <View style={styles.moodTextContainer}>
                  <Text style={styles.moodLabel}>Feeling</Text>
                  <Text style={styles.moodText}>{dailyData.summary.mood}</Text>
                </View>
              </View>
              <View style={styles.energyContainer}>
                <Text style={styles.energyLabel}>Energy</Text>
                {renderEnergyBar(dailyData.summary.energy)}
              </View>
            </View>
            <View style={styles.heroDivider} />
            <Text style={styles.heroQuote}>"{dailyData.summary.highlight}"</Text>
          </View>

          {/* Your Day - Tracking Status */}
          <View style={styles.trackingCard}>
            <Text style={styles.trackingCardTitle}>Your Day</Text>
            <View style={styles.trackingCirclesRow}>
              <View style={styles.trackingCircleItem}>
                <LinearGradient
                  colors={['#FBBF24', '#F59E0B', '#D97706']}
                  style={styles.trackingCircleOuter}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.trackingCircleInner}>
                    <Ionicons name="sunny" size={28} color="#F59E0B" />
                  </View>
                </LinearGradient>
                <Text style={styles.trackingCircleLabel}>Morning</Text>
                <View style={styles.trackingCircleStatus}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.trackingCircleStatusText}>Complete</Text>
                </View>
              </View>

              <View style={styles.trackingCircleItem}>
                <LinearGradient
                  colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                  style={styles.trackingCircleOuter}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.trackingCircleInner}>
                    <Ionicons name="moon" size={28} color="#8B5CF6" />
                  </View>
                </LinearGradient>
                <Text style={styles.trackingCircleLabel}>Evening</Text>
                <View style={styles.trackingCircleStatus}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.trackingCircleStatusText}>Complete</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Morning Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="sunny" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>Morning</Text>
              <Text style={styles.sectionTime}>{dailyData.morning.wakeTime}</Text>
            </View>

            {/* Sleep Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dailyData.morning.sleepHours}h</Text>
                <Text style={styles.statLabel}>Sleep</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dailyData.morning.bedtime}</Text>
                <Text style={styles.statLabel}>Bedtime</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{dailyData.morning.wakeTime}</Text>
                <Text style={styles.statLabel}>Wake</Text>
              </View>
            </View>

            {/* Gratitude */}
            <View style={styles.textBlock}>
              <View style={styles.textBlockHeader}>
                <Ionicons name="heart" size={14} color="#D97706" />
                <Text style={styles.textBlockLabel}>Gratitude</Text>
              </View>
              <Text style={styles.textBlockContent}>{dailyData.morning.gratitude}</Text>
            </View>

            {/* Intention */}
            <View style={[styles.textBlock, { marginBottom: 0 }]}>
              <View style={styles.textBlockHeader}>
                <Ionicons name="flag" size={14} color="#D97706" />
                <Text style={styles.textBlockLabel}>Intention</Text>
              </View>
              <Text style={styles.textBlockContent}>{dailyData.morning.intention}</Text>
            </View>
          </View>

          {/* How You Felt Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="pulse" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.sectionTitle}>How You Felt</Text>
            </View>

            <View style={styles.ratingsContainer}>
              <View style={styles.ratingRow}>
                <View style={styles.ratingLabelContainer}>
                  <View style={[styles.ratingIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="leaf" size={14} color="#059669" />
                  </View>
                  <Text style={styles.ratingLabel}>Nutrition</Text>
                </View>
                {renderRatingDots(dailyData.evening.ratings.nutrition, '#059669')}
              </View>

              <View style={styles.ratingRow}>
                <View style={styles.ratingLabelContainer}>
                  <View style={[styles.ratingIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="flash" size={14} color="#D97706" />
                  </View>
                  <Text style={styles.ratingLabel}>Energy</Text>
                </View>
                {renderRatingDots(dailyData.evening.ratings.energy, '#F59E0B')}
              </View>

              <View style={[styles.ratingRow, { marginBottom: 0 }]}>
                <View style={styles.ratingLabelContainer}>
                  <View style={[styles.ratingIcon, { backgroundColor: '#EDE9FE' }]}>
                    <Ionicons name="sparkles" size={14} color="#7C3AED" />
                  </View>
                  <Text style={styles.ratingLabel}>Satisfaction</Text>
                </View>
                {renderRatingDots(dailyData.evening.ratings.satisfaction, '#8B5CF6')}
              </View>
            </View>
          </View>

          {/* Wins Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="trophy" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.sectionTitle}>Wins</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{dailyData.wins.length}</Text>
              </View>
            </View>

            <View style={styles.winsContainer}>
              {dailyData.wins.map((win, index) => (
                <View
                  key={index}
                  style={[
                    styles.winItem,
                    index === dailyData.wins.length - 1 && { marginBottom: 0 }
                  ]}
                >
                  <View style={styles.winBullet}>
                    <Ionicons name="checkmark" size={12} color="#059669" />
                  </View>
                  <Text style={styles.winText}>{win}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Evening Reflection Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="moon" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.sectionTitle}>Evening Reflection</Text>
            </View>

            {/* Priority */}
            <View style={styles.priorityContainer}>
              <View style={styles.priorityHeader}>
                <Text style={styles.priorityLabel}>Today's Priority</Text>
                <View style={styles.priorityBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.priorityBadgeText}>Done</Text>
                </View>
              </View>
              <Text style={styles.priorityText}>{dailyData.evening.priority}</Text>
            </View>

            {/* Journal */}
            <View style={styles.journalContainer}>
              <View style={styles.journalHeader}>
                <Ionicons name="book-outline" size={14} color="#6B7280" />
                <Text style={styles.journalLabel}>Journal</Text>
              </View>
              <Text style={styles.journalText}>{dailyData.evening.journal}</Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  container: {
    flex: 1,
  },

  // Header - Refined
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  headerDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  weekBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 36,
  },

  // Content
  scrollContent: {
    padding: 20,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  moodIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodTextContainer: {
    gap: 2,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  moodText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  energyContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  energyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  energyBarContainer: {
    width: 80,
  },
  energyBarBackground: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  heroQuote: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    fontStyle: 'italic',
    letterSpacing: -0.1,
  },

  // Tracking Card
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  trackingCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  trackingCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trackingCircleItem: {
    alignItems: 'center',
    flex: 1,
  },
  trackingCircleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingCircleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  trackingCircleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingCircleStatusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  sectionTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // Text Blocks
  textBlock: {
    marginBottom: 20,
  },
  textBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  textBlockLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textBlockContent: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Ratings
  ratingsContainer: {
    gap: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  ratingDotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Wins
  countBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  winsContainer: {
    gap: 12,
  },
  winItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  winBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  winText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 22,
    letterSpacing: -0.1,
  },

  // Priority
  priorityContainer: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  priorityText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 22,
  },

  // Journal
  journalContainer: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    padding: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  journalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  journalText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});

export default DailyOverviewScreen;
