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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
    '2025-12-28': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 45 },
        wakeTime: { hour: 8, minute: 0 },
        gratitude: 'Grateful for the wonderful Christmas week spent with family and the memories we created together.',
        priority: 'Reflect on the year and start planning goals for the new year',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 8, energy: 8, satisfaction: 9 },
        journal: 'A perfect end to the Christmas week. Spent the day reflecting on all the good moments and feeling hopeful about the year ahead.',
      },
    },
    // January 2026
    '2026-1-1': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 45 },
        wakeTime: { hour: 7, minute: 30 },
        gratitude: 'Grateful for a fresh start to the new year and the chance to set new intentions.',
        priority: 'Set goals for 2026 and create a vision board',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 7, energy: 8, satisfaction: 9 },
        journal: 'Amazing first day of 2026! Spent time reflecting on last year and setting intentions for the new one. Feeling motivated and excited.',
      },
    },
    '2026-1-2': {
      morning: {
        completed: true,
        bedtime: { hour: 0, minute: 30 },
        wakeTime: { hour: 8, minute: 0 },
        gratitude: 'Thankful for my family and the quality time we spent together during the holidays.',
        priority: 'Organize workspace and plan the first week back',
      },
      evening: {
        completed: false,
        priorityCompleted: null,
        ratings: { nutrition: 5, energy: 5, satisfaction: 5 },
        journal: '',
      },
    },
    '2026-1-3': {
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
        journal: 'Busy day getting back into routine. Missed my morning check-in but the day turned out well overall.',
      },
    },
    '2026-1-4': {
      morning: {
        completed: true,
        bedtime: { hour: 22, minute: 30 },
        wakeTime: { hour: 6, minute: 45 },
        gratitude: 'Grateful for the discipline to wake up early and start the day with intention.',
        priority: 'Complete weekly planning and catch up on emails',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 8, energy: 7, satisfaction: 8 },
        journal: 'Productive Saturday! Got all my planning done and feeling ready for next week. Good balance of work and rest today.',
      },
    },
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
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
                <View style={[styles.infoBlock, styles.sleepBlock]}>
                  <View style={styles.sleepRow}>
                    <View style={styles.sleepTimeColumn}>
                      <LinearGradient
                        colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                        style={styles.sleepIconRing}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.sleepIconInner}>
                          <Ionicons name="moon" size={16} color="#7C3AED" />
                        </View>
                      </LinearGradient>
                      <Text style={styles.sleepTimeValue}>
                        {formatTime(morning.bedtime.hour, morning.bedtime.minute)}
                      </Text>
                      <Text style={styles.sleepTimeLabel}>Bedtime</Text>
                    </View>

                    <View style={styles.sleepDurationCenter}>
                      <View style={styles.sleepConnector} />
                      <View style={styles.sleepDurationBadge}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.sleepDurationText}>{calculateSleepDuration()}</Text>
                      </View>
                      <View style={styles.sleepConnector} />
                    </View>

                    <View style={styles.sleepTimeColumn}>
                      <LinearGradient
                        colors={['#FBBF24', '#F59E0B', '#D97706']}
                        style={styles.sleepIconRing}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.sleepIconInner}>
                          <Ionicons name="sunny" size={16} color="#D97706" />
                        </View>
                      </LinearGradient>
                      <Text style={styles.sleepTimeValue}>
                        {formatTime(morning.wakeTime.hour, morning.wakeTime.minute)}
                      </Text>
                      <Text style={styles.sleepTimeLabel}>Wake up</Text>
                    </View>
                  </View>
                </View>

                {/* Gratitude */}
                {morning.gratitude && (
                  <View style={[styles.infoBlock, styles.gratitudeBlock]}>
                    <View style={styles.infoHeader}>
                      <Ionicons name="heart" size={16} color="#F59E0B" />
                      <Text style={styles.infoLabel}>Gratitude</Text>
                    </View>
                    <Text style={styles.infoText}>{morning.gratitude}</Text>
                  </View>
                )}

                {/* Priority */}
                {morning.priority && (
                  <View style={[styles.infoBlock, styles.priorityBlock]}>
                    <View style={styles.infoHeader}>
                      <Ionicons name="flag" size={16} color="#D97706" />
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
                  <>
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
                    <View style={styles.priorityReviewDivider} />
                  </>
                )}

                {/* Ratings */}
                <View style={[styles.ratingsBlock, styles.ratingsBlockNoBorder]}>
                  <RatingBar label="Nutrition" value={evening.ratings.nutrition} color="#059669" customIcon={<MaterialCommunityIcons name="food-apple" size={16} color="#059669" />} />
                  <RatingBar label="Energy" value={evening.ratings.energy} color="#F59E0B" icon="flash" />
                  <RatingBar label="Satisfaction" value={evening.ratings.satisfaction} color="#3B82F6" icon="sparkles" />
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Evening reflection wasn't recorded</Text>
              </View>
            )}
          </View>

          {/* Journal Card - Standalone */}
          {evening.journal && (
            <View style={styles.journalCard}>
              <View style={styles.journalCardHeader}>
                <LinearGradient
                  colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
                  style={styles.sectionIconRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.sectionIconInner}>
                    <Ionicons name="book" size={22} color="#7C3AED" />
                  </View>
                </LinearGradient>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.journalCardTitle}>Journal</Text>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                </View>
              </View>
              <View style={styles.journalContentContainer}>
                <Text style={styles.journalContentText}>{evening.journal}</Text>
              </View>
            </View>
          )}

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
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
}

const RatingBar: React.FC<RatingBarProps> = ({ label, value, color, icon, customIcon }) => {
  const percentage = (value / 10) * 100;

  // Get a lighter tint of the color for the track background
  const getTrackColor = (c: string) => {
    if (c === '#059669') return '#D1FAE5'; // green tint
    if (c === '#F59E0B') return '#FEF3C7'; // amber tint
    if (c === '#3B82F6') return '#DBEAFE'; // blue tint
    return '#E5E7EB';
  };

  return (
    <View style={styles.ratingBarItem}>
      <View style={styles.ratingBarHeader}>
        {customIcon || <Ionicons name={icon!} size={16} color={color} />}
        <Text style={styles.ratingBarLabel}>{label}</Text>
        <Text style={[styles.ratingBarValue, { color }]}>{value}</Text>
      </View>
      <View style={[styles.ratingBarTrack, { backgroundColor: getTrackColor(color) }]}>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: '#F0EEE8',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 38,
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconInner: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: '#FFFFFF',
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
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },

  // Content
  sectionContent: {
    gap: 0,
  },
  infoBlock: {
    backgroundColor: 'transparent',
    paddingVertical: 24,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sleepBlock: {
    paddingTop: 0,
  },
  gratitudeBlock: {
  },
  priorityBlock: {
    borderBottomWidth: 0,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginTop: 24,
    marginBottom: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    letterSpacing: -0.1,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },

  // Sleep
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sleepTimeColumn: {
    alignItems: 'center',
    flex: 1,
  },
  sleepIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  sleepIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sleepTimeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  sleepTimeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sleepDurationCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  sleepConnector: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  sleepDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sleepDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  // Priority Review
  priorityReview: {
    borderBottomWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderLeftWidth: 3,
    marginBottom: 24,
  },
  priorityReviewDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 0,
  },
  prioritySuccess: {
    backgroundColor: '#F0FDF4',
    borderLeftColor: '#10B981',
  },
  priorityMissed: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },

  // Ratings
  ratingsBlock: {
    backgroundColor: 'transparent',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 0,
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ratingsBlockNoBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  ratingBarItem: {
    gap: 6,
  },
  ratingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBarLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  ratingBarValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Empty State
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
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

  // Journal Card
  journalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  journalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  journalCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  journalContentContainer: {
    paddingTop: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  journalContentText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default DailyOverviewScreen;
