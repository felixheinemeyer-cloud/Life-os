import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyOverviewScreenProps {
  route?: {
    params?: {
      date: Date;
      dateString: string;
    };
  };
  navigation?: {
    goBack: () => void;
  };
}

// Mock data structure - in production this would come from storage/API
interface MorningTrackingData {
  completed: boolean;
  bedtime: { hour: number; minute: number };
  wakeTime: { hour: number; minute: number };
  gratitude: string;
  intention: string;
}

interface EveningTrackingData {
  completed: boolean;
  priorityCompleted: boolean | null;
  priorityText: string;
  ratings: {
    nutrition: number;
    energy: number;
    satisfaction: number;
  };
  journal: string;
}

// Mock data for demonstration
const getMockMorningData = (dateKey: string): MorningTrackingData | null => {
  // Simulate some days having data
  const mockData: { [key: string]: MorningTrackingData } = {
    '2025-12-20': {
      completed: true,
      bedtime: { hour: 23, minute: 30 },
      wakeTime: { hour: 7, minute: 0 },
      gratitude: "I'm grateful for the peaceful morning and the opportunity to start fresh. The sunrise through my window reminded me of life's simple beauties.",
      intention: "Today I will focus on deep work for 4 hours and make meaningful progress on the app redesign project.",
    },
    '2025-12-19': {
      completed: true,
      bedtime: { hour: 22, minute: 45 },
      wakeTime: { hour: 6, minute: 30 },
      gratitude: "Grateful for my health and the energy to pursue my goals.",
      intention: "I will practice mindful listening in all my conversations today.",
    },
  };
  return mockData[dateKey] || null;
};

const getMockEveningData = (dateKey: string): EveningTrackingData | null => {
  const mockData: { [key: string]: EveningTrackingData } = {
    '2025-12-20': {
      completed: true,
      priorityCompleted: true,
      priorityText: "Finish implementing the DailyOverviewScreen feature",
      ratings: {
        nutrition: 9,
        energy: 8,
        satisfaction: 9,
      },
      journal: "An amazing day of focused work. Built the daily overview screen with beautiful animations and clean design. Feeling proud of the progress made today.",
    },
    '2025-12-19': {
      completed: true,
      priorityCompleted: true,
      priorityText: "Complete the UI mockups for the calendar feature",
      ratings: {
        nutrition: 8,
        energy: 7,
        satisfaction: 9,
      },
      journal: "Today was incredibly productive. I managed to finish the design work ahead of schedule and had a great workout. Feeling accomplished and ready to rest.",
    },
    '2025-12-18': {
      completed: true,
      priorityCompleted: false,
      priorityText: "Finish reading chapter 5",
      ratings: {
        nutrition: 6,
        energy: 5,
        satisfaction: 6,
      },
      journal: "Challenging day with some unexpected interruptions. Learning to be more adaptable.",
    },
  };
  return mockData[dateKey] || null;
};

const DailyOverviewScreen = ({ route, navigation }: DailyOverviewScreenProps): React.JSX.Element => {
  const selectedDate = route?.params?.date ? new Date(route.params.date) : new Date();
  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const overviewCardAnim = useRef(new Animated.Value(0)).current;
  const morningCardAnim = useRef(new Animated.Value(0)).current;
  const eveningCardAnim = useRef(new Animated.Value(0)).current;

  // Get tracking data
  const morningData = getMockMorningData(dateKey);
  const eveningData = getMockEveningData(dateKey);

  // Calculate sleep duration
  const calculateSleepDuration = (): string => {
    if (!morningData) return '--';
    const bedtime = morningData.bedtime;
    const wakeTime = morningData.wakeTime;

    let sleepMinutes = (wakeTime.hour * 60 + wakeTime.minute) - (bedtime.hour * 60 + bedtime.minute);
    if (sleepMinutes < 0) sleepMinutes += 24 * 60; // Handle overnight sleep

    const hours = Math.floor(sleepMinutes / 60);
    const minutes = sleepMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  // Calculate average rating
  const calculateAverageRating = (): string => {
    if (!eveningData?.ratings) return '--';
    const { nutrition, energy, satisfaction } = eveningData.ratings;
    const avg = (nutrition + energy + satisfaction) / 3;
    return avg.toFixed(1);
  };

  // Format time
  const formatTime = (time: { hour: number; minute: number }): string => {
    const hour = time.hour % 12 || 12;
    const ampm = time.hour >= 12 ? 'PM' : 'AM';
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute} ${ampm}`;
  };

  // Format date for header
  const formatDateHeader = (): string => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Entrance animations
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

    // Staggered card animations
    Animated.sequence([
      Animated.delay(150),
      Animated.timing(overviewCardAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(250),
      Animated.timing(morningCardAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(350),
      Animated.timing(eveningCardAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{formatDateHeader()}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Overview Card */}
          <Animated.View
            style={[
              styles.overviewCard,
              {
                opacity: overviewCardAnim,
                transform: [{
                  translateY: overviewCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient
              colors={['#F8F7F4', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.overviewGradient}
            >
              <View style={styles.overviewContent}>
                {/* Sleep Duration */}
                <View style={styles.overviewItem}>
                  <View style={[styles.overviewIconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="bed" size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.overviewValue}>{calculateSleepDuration()}</Text>
                  <Text style={styles.overviewLabel}>Sleep</Text>
                </View>

                {/* Divider */}
                <View style={styles.overviewDivider} />

                {/* Average Rating */}
                <View style={styles.overviewItem}>
                  <View style={[styles.overviewIconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Ionicons name="stats-chart" size={18} color="#D97706" />
                  </View>
                  <Text style={styles.overviewValue}>{calculateAverageRating()}</Text>
                  <Text style={styles.overviewLabel}>Avg Rating</Text>
                </View>

                {/* Divider */}
                <View style={styles.overviewDivider} />

                {/* Completion Status */}
                <View style={styles.overviewItem}>
                  <View style={styles.completionMinimal}>
                    {/* AM */}
                    <View style={styles.completionRow}>
                      <Ionicons
                        name={morningData?.completed ? "sunny" : "sunny-outline"}
                        size={16}
                        color={morningData?.completed ? '#F59E0B' : '#D1D5DB'}
                      />
                      <Text style={[
                        styles.completionLabel,
                        { color: morningData?.completed ? '#6B7280' : '#D1D5DB' }
                      ]}>AM</Text>
                      {morningData?.completed && (
                        <View style={styles.completionDot} />
                      )}
                    </View>

                    {/* PM */}
                    <View style={styles.completionRow}>
                      <Ionicons
                        name={eveningData?.completed ? "moon" : "moon-outline"}
                        size={16}
                        color={eveningData?.completed ? '#8B5CF6' : '#D1D5DB'}
                      />
                      <Text style={[
                        styles.completionLabel,
                        { color: eveningData?.completed ? '#6B7280' : '#D1D5DB' }
                      ]}>PM</Text>
                      {eveningData?.completed && (
                        <View style={styles.completionDot} />
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Morning Tracking Section */}
          <Animated.View
            style={{
              opacity: morningCardAnim,
              transform: [{
                translateY: morningCardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="sunny" size={16} color="#D97706" />
              </View>
              <Text style={styles.sectionTitle}>MORNING TRACKING</Text>
            </View>

            <View style={styles.trackingCard}>
              {morningData ? (
                <>
                  {/* Sleep Times */}
                  <View style={styles.sleepTimesRow}>
                    <View style={styles.sleepTimeItem}>
                      <LinearGradient
                        colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                        style={styles.sleepTimeIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.sleepTimeIconInner}>
                          <Ionicons name="moon" size={14} color="#7C3AED" />
                        </View>
                      </LinearGradient>
                      <View>
                        <Text style={styles.sleepTimeLabel}>Bedtime</Text>
                        <Text style={styles.sleepTimeValue}>{formatTime(morningData.bedtime)}</Text>
                      </View>
                    </View>

                    <View style={styles.sleepArrow}>
                      <Ionicons name="arrow-forward" size={16} color="#D1D5DB" />
                    </View>

                    <View style={styles.sleepTimeItem}>
                      <LinearGradient
                        colors={['#FBBF24', '#F59E0B', '#D97706']}
                        style={styles.sleepTimeIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.sleepTimeIconInner}>
                          <Ionicons name="sunny" size={14} color="#D97706" />
                        </View>
                      </LinearGradient>
                      <View>
                        <Text style={styles.sleepTimeLabel}>Wake Time</Text>
                        <Text style={styles.sleepTimeValue}>{formatTime(morningData.wakeTime)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Gratitude */}
                  <View style={styles.textSection}>
                    <View style={styles.textSectionHeader}>
                      <Ionicons name="heart" size={14} color="#EC4899" />
                      <Text style={styles.textSectionTitle}>Gratitude</Text>
                    </View>
                    <Text style={styles.textContent} numberOfLines={3}>
                      {morningData.gratitude}
                    </Text>
                  </View>

                  {/* Intention */}
                  <View style={styles.textSection}>
                    <View style={styles.textSectionHeader}>
                      <Ionicons name="flag" size={14} color="#3B82F6" />
                      <Text style={styles.textSectionTitle}>Intention</Text>
                    </View>
                    <Text style={styles.textContent} numberOfLines={2}>
                      {morningData.intention}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="sunny-outline" size={32} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyTitle}>No Morning Tracking</Text>
                  <Text style={styles.emptySubtitle}>Morning tracking was not completed for this day</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Evening Tracking Section */}
          <Animated.View
            style={{
              opacity: eveningCardAnim,
              transform: [{
                translateY: eveningCardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            }}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="moon" size={16} color="#7C3AED" />
              </View>
              <Text style={styles.sectionTitle}>EVENING TRACKING</Text>
            </View>

            <View style={styles.trackingCard}>
              {eveningData ? (
                <>
                  {/* Priority Completion */}
                  <View style={styles.prioritySection}>
                    <View style={styles.priorityHeader}>
                      <View style={[
                        styles.priorityStatus,
                        { backgroundColor: eveningData.priorityCompleted ? '#D1FAE5' : '#FEE2E2' }
                      ]}>
                        <Ionicons
                          name={eveningData.priorityCompleted ? "checkmark-circle" : "close-circle"}
                          size={16}
                          color={eveningData.priorityCompleted ? '#059669' : '#DC2626'}
                        />
                        <Text style={[
                          styles.priorityStatusText,
                          { color: eveningData.priorityCompleted ? '#059669' : '#DC2626' }
                        ]}>
                          {eveningData.priorityCompleted ? 'Priority Completed' : 'Priority Not Completed'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.priorityText} numberOfLines={2}>
                      {eveningData.priorityText}
                    </Text>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Ratings */}
                  <View style={styles.ratingsSection}>
                    <RatingBar
                      label="Nutrition"
                      value={eveningData.ratings.nutrition}
                      color="#10B981"
                      icon="nutrition"
                    />
                    <RatingBar
                      label="Energy"
                      value={eveningData.ratings.energy}
                      color="#F59E0B"
                      icon="flash"
                    />
                    <RatingBar
                      label="Satisfaction"
                      value={eveningData.ratings.satisfaction}
                      color="#8B5CF6"
                      icon="happy"
                    />
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Journal */}
                  <View style={styles.textSection}>
                    <View style={styles.textSectionHeader}>
                      <Ionicons name="book" size={14} color="#6366F1" />
                      <Text style={styles.textSectionTitle}>Journal</Text>
                    </View>
                    <Text style={styles.textContent} numberOfLines={4}>
                      {eveningData.journal}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="moon-outline" size={32} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyTitle}>No Evening Tracking</Text>
                  <Text style={styles.emptySubtitle}>Evening tracking was not completed for this day</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// Rating Bar Component
interface RatingBarProps {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const RatingBar = ({ label, value, color, icon }: RatingBarProps): React.JSX.Element => {
  const percentage = (value / 10) * 100;

  return (
    <View style={styles.ratingBarContainer}>
      <View style={styles.ratingBarHeader}>
        <View style={styles.ratingBarLabel}>
          <Ionicons name={icon} size={14} color={color} />
          <Text style={styles.ratingBarLabelText}>{label}</Text>
        </View>
        <Text style={[styles.ratingBarValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.ratingBarTrack}>
        <View
          style={[
            styles.ratingBarFill,
            { width: `${percentage}%`, backgroundColor: color }
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0EEE8',
  },
  backButton: {
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
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Overview Card
  overviewCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  overviewGradient: {
    padding: 20,
  },
  overviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overviewDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E5E7EB',
  },
  completionMinimal: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  completionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1.5,
  },

  // Tracking Cards
  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },

  // Sleep Times
  sleepTimesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sleepTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sleepTimeIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    padding: 2,
  },
  sleepTimeIconInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepTimeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sleepTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  sleepArrow: {
    paddingHorizontal: 12,
  },

  // Text Sections
  textSection: {
    marginBottom: 12,
  },
  textSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  textSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  textContent: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 21,
    letterSpacing: -0.1,
  },

  // Priority Section
  prioritySection: {
    marginBottom: 0,
  },
  priorityHeader: {
    marginBottom: 8,
  },
  priorityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 20,
  },

  // Ratings Section
  ratingsSection: {
    gap: 14,
  },
  ratingBarContainer: {
    gap: 6,
  },
  ratingBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBarLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 6,
  },
  ratingBarValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingBarTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  bottomSpacer: {
    height: 40,
  },
});

export default DailyOverviewScreen;
