import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface DailyOverviewScreenProps {
  navigation?: {
    goBack: () => void;
  };
  route?: {
    params?: {
      date: string;
      dateDisplay: string;
    };
  };
}

interface MorningData {
  completed: boolean;
  bedtime: { hour: number; minute: number };
  wakeTime: { hour: number; minute: number };
  gratitude: string;
  priority: string;
}

interface EveningData {
  completed: boolean;
  priorityCompleted: boolean | null;
  ratings: {
    nutrition: number;
    energy: number;
    satisfaction: number;
  };
  journal: string;
}

const getMockData = (dateKey: string): { morning: MorningData; evening: EveningData } => {
  const mockDatabase: { [key: string]: { morning: MorningData; evening: EveningData } } = {
    '2025-12-24': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 30 },
        wakeTime: { hour: 7, minute: 15 },
        gratitude: 'Grateful for the peaceful morning and the opportunity to spend time with family during the holidays.',
        priority: 'Finish holiday preparations and wrap all remaining gifts',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 8, energy: 7, satisfaction: 9 },
        journal: 'Had a wonderful day preparing for Christmas. The house is decorated beautifully and I feel ready for tomorrow.',
      },
    },
    '2025-12-23': {
      morning: {
        completed: false,
        bedtime: { hour: 23, minute: 0 },
        wakeTime: { hour: 7, minute: 0 },
        gratitude: '',
        priority: '',
      },
      evening: {
        completed: true,
        priorityCompleted: null,
        ratings: { nutrition: 6, energy: 5, satisfaction: 7 },
        journal: 'Got all the last-minute gifts wrapped and ready. Feeling accomplished.',
      },
    },
    '2025-12-22': {
      morning: {
        completed: true,
        bedtime: { hour: 22, minute: 45 },
        wakeTime: { hour: 6, minute: 30 },
        gratitude: 'Thankful for my health and the ability to exercise this morning.',
        priority: 'Complete all work tasks before the holiday break',
      },
      evening: {
        completed: true,
        priorityCompleted: false,
        ratings: { nutrition: 7, energy: 6, satisfaction: 8 },
        journal: 'Got distracted by meetings and couldn\'t finish all the tasks. Will need to wrap up tomorrow.',
      },
    },
    '2025-12-21': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 15 },
        wakeTime: { hour: 7, minute: 30 },
        gratitude: 'Grateful for the cozy winter weather and hot coffee.',
        priority: 'Relax and recharge for the upcoming week',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 8, energy: 8, satisfaction: 9 },
        journal: 'Perfect winter day. Spent quality time reading and relaxing.',
      },
    },
    '2025-12-20': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 0 },
        wakeTime: { hour: 6, minute: 45 },
        gratitude: 'Thankful for supportive colleagues at work.',
        priority: 'Complete end-of-week reports and clear inbox',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 7, energy: 6, satisfaction: 8 },
        journal: 'Great end to the work week. Looking forward to the holidays.',
      },
    },
    '2025-12-15': {
      morning: {
        completed: true,
        bedtime: { hour: 22, minute: 30 },
        wakeTime: { hour: 6, minute: 0 },
        gratitude: 'Grateful for a productive morning routine.',
        priority: 'Stay focused on deep work and avoid distractions',
      },
      evening: {
        completed: false,
        priorityCompleted: null,
        ratings: { nutrition: 5, energy: 5, satisfaction: 5 },
        journal: '',
      },
    },
    '2025-12-14': {
      morning: {
        completed: false,
        bedtime: { hour: 23, minute: 0 },
        wakeTime: { hour: 7, minute: 0 },
        gratitude: '',
        priority: '',
      },
      evening: {
        completed: true,
        priorityCompleted: false,
        ratings: { nutrition: 5, energy: 4, satisfaction: 5 },
        journal: 'Challenging day but learned a lot. Need to prioritize better tomorrow.',
      },
    },
    '2025-12-1': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 0 },
        wakeTime: { hour: 7, minute: 0 },
        gratitude: 'Grateful for the start of a new month full of possibilities.',
        priority: 'Set clear goals for December and create action plan',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 7, energy: 7, satisfaction: 8 },
        journal: 'Great start to December! Feeling organized and motivated.',
      },
    },
  };

  return mockDatabase[dateKey] || {
    morning: {
      completed: false,
      bedtime: { hour: 23, minute: 0 },
      wakeTime: { hour: 7, minute: 0 },
      gratitude: '',
      priority: '',
    },
    evening: {
      completed: false,
      priorityCompleted: null,
      ratings: { nutrition: 5, energy: 5, satisfaction: 5 },
      journal: '',
    },
  };
};

const DailyOverviewScreen = ({ navigation, route }: DailyOverviewScreenProps): React.JSX.Element => {
  const dateKey = route?.params?.date || '';
  const dateDisplay = route?.params?.dateDisplay || 'Today';

  const { morning, evening } = getMockData(dateKey);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  const calculateSleepDuration = (): string => {
    const bedtimeMinutes = morning.bedtime.hour * 60 + morning.bedtime.minute;
    const wakeTimeMinutes = morning.wakeTime.hour * 60 + morning.wakeTime.minute;
    let durationMinutes = wakeTimeMinutes - bedtimeMinutes;
    if (durationMinutes < 0) durationMinutes += 24 * 60;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const hasAnyData = morning.completed || evening.completed;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{dateDisplay}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Morning Check-in Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B', '#D97706']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="sunny" size={22} color="#D97706" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Morning Check-in</Text>
                {morning.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            </View>

            {morning.completed ? (
              <View style={styles.sectionContent}>
                {/* Sleep */}
                <View style={styles.infoBlock}>
                  <View style={styles.sleepList}>
                    <View style={styles.sleepItem}>
                      <Ionicons name="moon" size={16} color="#8B5CF6" />
                      <Text style={styles.sleepItemLabel}>Bedtime</Text>
                      <Text style={styles.sleepItemValue}>
                        {formatTime(morning.bedtime.hour, morning.bedtime.minute)}
                      </Text>
                    </View>
                    <View style={styles.sleepItem}>
                      <Ionicons name="sunny" size={16} color="#F59E0B" />
                      <Text style={styles.sleepItemLabel}>Wake up</Text>
                      <Text style={styles.sleepItemValue}>
                        {formatTime(morning.wakeTime.hour, morning.wakeTime.minute)}
                      </Text>
                    </View>
                    <View style={styles.sleepItem}>
                      <Ionicons name="bed-outline" size={16} color="#8B5CF6" />
                      <Text style={styles.sleepItemLabel}>Sleep</Text>
                      <View style={styles.sleepBadge}>
                        <Text style={styles.sleepBadgeText}>{calculateSleepDuration()}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Gratitude */}
                {morning.gratitude && (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoHeader}>
                      <Ionicons name="heart" size={16} color="#EC4899" />
                      <Text style={styles.infoLabel}>Gratitude</Text>
                    </View>
                    <Text style={styles.infoText}>{morning.gratitude}</Text>
                  </View>
                )}

                {/* Priority */}
                {morning.priority && (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoHeader}>
                      <Ionicons name="flag" size={16} color="#3B82F6" />
                      <Text style={styles.infoLabel}>Today's Priority</Text>
                    </View>
                    <Text style={styles.infoText}>{morning.priority}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Morning reflection wasn't recorded</Text>
              </View>
            )}
          </View>

          {/* Evening Check-in Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="moon" size={22} color="#7C3AED" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Evening Check-in</Text>
                {evening.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            </View>

            {evening.completed ? (
              <View style={styles.sectionContent}>
                {/* Priority Review - only show if morning had a priority */}
                {morning.completed && morning.priority && (
                  <View style={[
                    styles.infoBlock,
                    styles.priorityReview,
                    evening.priorityCompleted ? styles.prioritySuccess : styles.priorityMissed
                  ]}>
                    <View style={styles.infoHeader}>
                      <Ionicons
                        name={evening.priorityCompleted ? "checkmark-circle" : "close-circle"}
                        size={16}
                        color={evening.priorityCompleted ? "#059669" : "#EF4444"}
                      />
                      <Text style={styles.infoLabel}>Priority Review</Text>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: evening.priorityCompleted ? '#D1FAE5' : '#FEE2E2' }
                      ]}>
                        <Text style={[
                          styles.priorityBadgeText,
                          { color: evening.priorityCompleted ? '#059669' : '#EF4444' }
                        ]}>
                          {evening.priorityCompleted ? 'Achieved' : 'Missed'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.priorityText}>{morning.priority}</Text>
                  </View>
                )}

                {/* Ratings */}
                <View style={styles.ratingsBlock}>
                  <RatingBar label="Nutrition" value={evening.ratings.nutrition} color="#10B981" icon="nutrition" />
                  <RatingBar label="Energy" value={evening.ratings.energy} color="#F59E0B" icon="flash" />
                  <RatingBar label="Satisfaction" value={evening.ratings.satisfaction} color="#8B5CF6" icon="happy" />
                </View>

                {/* Journal */}
                {evening.journal && (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoHeader}>
                      <Ionicons name="book" size={16} color="#6366F1" />
                      <Text style={styles.infoLabel}>Journal</Text>
                    </View>
                    <Text style={styles.infoText}>{evening.journal}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Evening reflection wasn't recorded</Text>
              </View>
            )}
          </View>

        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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

const RatingBar: React.FC<RatingBarProps> = ({ label, value, color, icon }) => {
  const percentage = (value / 10) * 100;

  return (
    <View style={styles.ratingBarItem}>
      <View style={styles.ratingBarHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.ratingBarLabel}>{label}</Text>
        <Text style={[styles.ratingBarValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.ratingBarTrack}>
        <View style={[styles.ratingBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
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
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
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
    elevation: 3,
  },
  headerTextContainer: {
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

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#059669',
  },

  // Content
  sectionContent: {
    gap: 16,
  },
  infoBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 22,
  },

  // Sleep
  sleepList: {
    gap: 12,
  },
  sleepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
  sleepItemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  sleepBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sleepBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },

  // Priority Review
  priorityReview: {
    borderWidth: 1.5,
    borderStyle: 'solid',
  },
  prioritySuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  priorityMissed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 22,
  },

  // Ratings
  ratingsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  ratingBarItem: {
    gap: 8,
  },
  ratingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  ratingBarValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  ratingBarTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Empty State
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // No Data
  noDataCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  noDataIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  noDataSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default DailyOverviewScreen;
