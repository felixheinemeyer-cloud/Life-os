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

interface MonthlyReviewScreenProps {
  navigation?: {
    goBack: () => void;
  };
  route?: {
    params?: {
      month: number;
      year: number;
      monthName: string;
    };
  };
}

interface MonthlyData {
  completed: boolean;
  monthName: string;
  overallScore: number;
  wealthAverages: {
    physical: { score: number; trend: number };
    social: { score: number; trend: number };
    mental: { score: number; trend: number };
    financial: { score: number; trend: number };
    time: { score: number; trend: number };
  };
  keyLearning: string;
  lostSightOf: string;
  proudMoment: string;
  messageToSelf: string;
}

// Mock data for monthly check-ins
const mockMonthlyData: { [key: string]: MonthlyData } = {
  '2025-11': {
    completed: true,
    monthName: 'November',
    overallScore: 7.1,
    wealthAverages: {
      physical: { score: 7.2, trend: 5 },
      social: { score: 7.0, trend: -3 },
      mental: { score: 6.8, trend: 8 },
      financial: { score: 7.5, trend: 2 },
      time: { score: 7.0, trend: -1 },
    },
    keyLearning: 'Consistency in small daily habits leads to big results over time.',
    lostSightOf: 'Regular exercise routine slipped during the busy work weeks.',
    proudMoment: 'Successfully completed the 30-day meditation challenge.',
    messageToSelf: 'Remember to take breaks and not sacrifice health for productivity.',
  },
  '2025-12': {
    completed: true,
    monthName: 'December',
    overallScore: 7.6,
    wealthAverages: {
      physical: { score: 7.5, trend: 4 },
      social: { score: 8.2, trend: 17 },
      mental: { score: 7.2, trend: 6 },
      financial: { score: 7.0, trend: -7 },
      time: { score: 8.0, trend: 14 },
    },
    keyLearning: 'Quality time with family is more valuable than any material gift.',
    lostSightOf: 'Budget discipline during the holiday shopping season.',
    proudMoment: 'Created meaningful memories during the holiday season.',
    messageToSelf: 'Start the new year with intention and focus on what truly matters.',
  },
};

const getMonthlyData = (year: number, month: number): MonthlyData | null => {
  return mockMonthlyData[`${year}-${month}`] || null;
};

const MonthlyReviewScreen = ({ navigation, route }: MonthlyReviewScreenProps): React.JSX.Element => {
  const month = route?.params?.month || new Date().getMonth() + 1;
  const year = route?.params?.year || new Date().getFullYear();
  const monthName = route?.params?.monthName || new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' });

  const monthlyData = getMonthlyData(year, month);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  if (!monthlyData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Monthly Check-In</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Review Data</Text>
          <Text style={styles.emptySubtitle}>This monthly review hasn't been completed yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Monthly Check-In</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Monthly Check-in Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#FBCFE8', '#F472B6', '#DB2777']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#DB2777" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Monthly Check-in</Text>
                {monthlyData.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Hero Score Section */}
              <View style={styles.monthlyHeroSection}>
                <View style={styles.monthlyDateBadge}>
                  <Ionicons name="calendar" size={14} color="#DB2777" />
                  <Text style={styles.monthlyDateText}>{monthlyData.monthName}</Text>
                </View>
                <View style={styles.monthlyScoreCircle}>
                  <Text style={styles.monthlyScoreNumber}>{monthlyData.overallScore.toFixed(1)}</Text>
                  <Text style={styles.monthlyScoreLabel}>Overall</Text>
                </View>
              </View>

              {/* Wealth Rating Bars with Trends */}
              <View style={styles.monthlyRatingsBlock}>
                <MonthlyRatingBar label="Physical" value={monthlyData.wealthAverages.physical.score} trend={monthlyData.wealthAverages.physical.trend} color="#10B981" icon="fitness" />
                <MonthlyRatingBar label="Social" value={monthlyData.wealthAverages.social.score} trend={monthlyData.wealthAverages.social.trend} color="#8B5CF6" icon="people" />
                <MonthlyRatingBar label="Mental" value={monthlyData.wealthAverages.mental.score} trend={monthlyData.wealthAverages.mental.trend} color="#3B82F6" icon="bulb" />
                <MonthlyRatingBar label="Financial" value={monthlyData.wealthAverages.financial.score} trend={monthlyData.wealthAverages.financial.trend} color="#F59E0B" icon="wallet" />
                <MonthlyRatingBar label="Time" value={monthlyData.wealthAverages.time.score} trend={monthlyData.wealthAverages.time.trend} color="#EC4899" icon="time" />
              </View>

              {/* Reflections */}
              <View style={styles.monthlyReflectionsContainer}>
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="bulb" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Key learning</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.keyLearning}</Text>
                </View>
                <View style={styles.monthlyReflectionDivider} />
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="eye-off" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Lost sight of</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.lostSightOf}</Text>
                </View>
                <View style={styles.monthlyReflectionDivider} />
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="trophy" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Proud moment</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.proudMoment}</Text>
                </View>
                <View style={styles.monthlyReflectionDivider} />
                <View style={styles.monthlyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="mail" size={16} color="#DB2777" />
                    <Text style={styles.infoLabel}>Message to self</Text>
                  </View>
                  <Text style={styles.infoText}>{monthlyData.messageToSelf}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Monthly Rating Bar Component (with trend badge)
interface MonthlyRatingBarProps {
  label: string;
  value: number;
  trend: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MonthlyRatingBar: React.FC<MonthlyRatingBarProps> = ({ label, value, trend, color, icon }) => {
  const percentage = (value / 10) * 100;

  const getTrackColor = (c: string) => {
    if (c === '#10B981') return '#D1FAE5';
    if (c === '#8B5CF6') return '#EDE9FE';
    if (c === '#3B82F6') return '#DBEAFE';
    if (c === '#F59E0B') return '#FEF3C7';
    if (c === '#EC4899') return '#FCE7F3';
    return '#E5E7EB';
  };

  return (
    <View style={styles.monthlyRatingBarItem}>
      <View style={styles.monthlyRatingBarHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.monthlyRatingBarLabel}>{label}</Text>
        <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#D1FAE5' : '#FEE2E2' }]}>
          <Ionicons
            name={trend >= 0 ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={trend >= 0 ? '#059669' : '#EF4444'}
          />
          <Text style={[styles.trendText, { color: trend >= 0 ? '#059669' : '#EF4444' }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
        <Text style={[styles.monthlyRatingBarValue, { color }]}>{value.toFixed(1)}</Text>
      </View>
      <View style={[styles.monthlyRatingBarTrack, { backgroundColor: getTrackColor(color) }]}>
        <View style={[styles.monthlyRatingBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
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
    paddingBottom: 14,
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

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
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
  sectionContent: {
    gap: 0,
  },

  // Info Block
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

  // Monthly Hero
  monthlyHeroSection: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 24,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthlyDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  monthlyDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DB2777',
  },
  monthlyScoreCircle: {
    alignItems: 'center',
  },
  monthlyScoreNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: '#DB2777',
    letterSpacing: -1,
  },
  monthlyScoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -2,
  },

  // Monthly Ratings
  monthlyRatingsBlock: {
    gap: 18,
    paddingTop: 24,
    paddingBottom: 24,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthlyRatingBarItem: {
    gap: 6,
  },
  monthlyRatingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyRatingBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  monthlyRatingBarValue: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  monthlyRatingBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  monthlyRatingBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Monthly Reflections
  monthlyReflectionsContainer: {
    borderTopWidth: 0,
    borderTopColor: '#E5E7EB',
    marginBottom: -24,
  },
  monthlyReflectionItem: {
    paddingVertical: 24,
  },
  monthlyReflectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  bottomSpacer: {
    height: 20,
  },
});

export default MonthlyReviewScreen;
