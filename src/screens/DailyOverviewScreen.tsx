import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    '2026-1-29': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 15 },
        wakeTime: { hour: 7, minute: 0 },
        gratitude: 'Grateful for the progress I made this month and the momentum building towards February.',
        priority: 'Finalize monthly report and prepare presentation for tomorrow',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 7, energy: 6, satisfaction: 8 },
        journal: 'Busy but fulfilling day. Got the monthly report done and feeling prepared for the presentation. January has been a great month overall.',
      },
    },
    '2026-1-30': {
      morning: {
        completed: true,
        bedtime: { hour: 22, minute: 45 },
        wakeTime: { hour: 6, minute: 30 },
        gratitude: 'Thankful for my supportive team and the collaborative spirit at work.',
        priority: 'Deliver presentation and wrap up all January projects',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 8, energy: 7, satisfaction: 9 },
        journal: 'Presentation went really well! Got great feedback from the team. Feeling accomplished as January wraps up.',
      },
    },
    '2026-1-31': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 0 },
        wakeTime: { hour: 7, minute: 15 },
        gratitude: 'Grateful for completing another month and all the growth and learning it brought.',
        priority: 'Reflect on January achievements and set intentions for February',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 7, energy: 8, satisfaction: 9 },
        journal: 'Perfect end to January! Took time to celebrate the wins and learned from the challenges. Excited for what February will bring.',
      },
    },
    '2025-11-26': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 0 },
        wakeTime: { hour: 6, minute: 45 },
        gratitude: 'Grateful for a productive week and the progress made on my projects.',
        priority: 'Finish the quarterly review document before the weekend',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 7, energy: 6, satisfaction: 8 },
        journal: 'Managed to complete the quarterly review ahead of schedule. Feeling accomplished and ready for a relaxing weekend.',
      },
    },
    '2025-11-29': {
      morning: {
        completed: true,
        bedtime: { hour: 23, minute: 30 },
        wakeTime: { hour: 8, minute: 0 },
        gratitude: 'Thankful for the lazy Saturday morning and quality time with loved ones.',
        priority: 'Plan activities for the upcoming week and organize the home office',
      },
      evening: {
        completed: true,
        priorityCompleted: false,
        ratings: { nutrition: 8, energy: 7, satisfaction: 7 },
        journal: 'Got distracted by a good book and didn\'t finish organizing, but it was a restful day overall. Sometimes rest is more important.',
      },
    },
    '2025-11-30': {
      morning: {
        completed: true,
        bedtime: { hour: 22, minute: 45 },
        wakeTime: { hour: 7, minute: 30 },
        gratitude: 'Grateful for the last day of November and all the memories this month brought.',
        priority: 'Complete November reflection and set December intentions',
      },
      evening: {
        completed: true,
        priorityCompleted: true,
        ratings: { nutrition: 7, energy: 8, satisfaction: 9 },
        journal: 'Beautiful end to November. Spent time reflecting on the month and feeling optimistic about December. Ready for the holiday season!',
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
  const insets = useSafeAreaInsets();
  const initialDateKey = route?.params?.date || '';

  // Parse initial date from route params
  const parseInitialDate = (): Date => {
    if (initialDateKey) {
      const parts = initialDateKey.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(parseInitialDate);

  // Format date key for data lookup (YYYY-M-D format)
  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  // Format display date (e.g., "Sun, Nov 30")
  const formatDisplayDate = (date: Date): string => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const dateKey = getDateKey(currentDate);
  const dateDisplay = formatDisplayDate(currentDate);

  const { morning, evening } = getMockData(dateKey);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  const handlePreviousDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Check if we're at today (can't go forward)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDateNormalized = new Date(currentDate);
  currentDateNormalized.setHours(0, 0, 0, 0);
  const isToday = currentDateNormalized.getTime() === today.getTime();

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
    <View style={styles.container}>
      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 },
        ]}
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
                  <RatingBar label="Nutrition" value={evening.ratings.nutrition} color="#059669" bgColor="#ECFDF5" icon="leaf" />
                  <RatingBar label="Energy" value={evening.ratings.energy} color="#F59E0B" bgColor="#FEF3C7" icon="flash" />
                  <RatingBar label="Satisfaction" value={evening.ratings.satisfaction} color="#3B82F6" bgColor="#EFF6FF" icon="sparkles" isLast />
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
      </Animated.ScrollView>

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
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.headerDatePicker}>
            <View style={styles.headerDatePill}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerDatePillSide,
                  pressed && styles.headerDatePillSidePressed,
                ]}
                onPress={handlePreviousDay}
              >
                <Ionicons name="chevron-back" size={16} color="#6B7280" />
              </Pressable>
              <View style={styles.headerDatePillCenter}>
                <Ionicons name="calendar-outline" size={14} color="#F59E0B" />
                <Text style={styles.headerDateText}>{dateDisplay}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.headerDatePillSide,
                  isToday && styles.headerDatePillSideDisabled,
                  pressed && !isToday && styles.headerDatePillSidePressed,
                ]}
                onPress={handleNextDay}
                disabled={isToday}
              >
                <Ionicons name="chevron-forward" size={16} color={isToday ? '#D1D5DB' : '#6B7280'} />
              </Pressable>
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>
    </View>
  );
};

// Rating Bar Component
interface RatingBarProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
  isLast?: boolean;
}

const RatingBar: React.FC<RatingBarProps> = ({ label, value, color, bgColor, icon, customIcon, isLast }) => {
  const percentage = (value / 10) * 100;

  return (
    <View style={[styles.ratingBarItem, isLast && styles.ratingBarItemLast]}>
      <View style={[styles.ratingBarIcon, { backgroundColor: bgColor }]}>
        {customIcon || <Ionicons name={icon!} size={16} color={color} />}
      </View>
      <View style={styles.ratingBarContent}>
        <View style={styles.ratingBarHeader}>
          <Text style={styles.ratingBarLabel}>{label}</Text>
          <Text style={[styles.ratingBarValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.ratingBarTrack}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 0,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    position: 'relative',
  },
  backButton: {
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
  headerDatePicker: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  headerDatePillSide: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  headerDatePillSidePressed: {
    backgroundColor: '#F3F4F6',
  },
  headerDatePillSideDisabled: {
    opacity: 0.4,
  },
  headerDatePillCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
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
    paddingVertical: 16,
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
    marginTop: 16,
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
    marginBottom: 16,
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
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ratingsBlockNoBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  ratingBarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB60',
  },
  ratingBarItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  ratingBarIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingBarContent: {
    flex: 1,
    gap: 6,
  },
  ratingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  ratingBarValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  ratingBarTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 2,
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  journalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
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
