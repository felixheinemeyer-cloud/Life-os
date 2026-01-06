import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WeeklyReviewScreenProps {
  navigation?: {
    goBack: () => void;
  };
  route?: {
    params?: {
      weekNumber: number;
      dateRange: string;
    };
  };
}

interface WeeklyData {
  completed: boolean;
  weekRange: string;
  overallScore: number;
  wealthRatings: {
    physical: number;
    social: number;
    mental: number;
    financial: number;
    time: number;
  };
  wentWell: string;
  improveNextWeek: string;
  selfieUri?: string;
}

// Mock data for weekly check-ins (using ISO week numbers)
const mockWeeklyData: { [key: string]: WeeklyData } = {
  'week44': {
    completed: true,
    weekRange: 'Oct 27 – Nov 2',
    overallScore: 7.0,
    wealthRatings: { physical: 7, social: 7, mental: 7, financial: 7, time: 7 },
    wentWell: 'Balanced week with steady progress on all fronts. Started new morning routine.',
    improveNextWeek: 'Be more intentional about screen time in the evenings.',
  },
  'week45': {
    completed: true,
    weekRange: 'Nov 3 – 9',
    overallScore: 6.5,
    wealthRatings: { physical: 6, social: 7, mental: 6, financial: 6, time: 7 },
    wentWell: 'Good social interactions and maintained work-life balance despite busy schedule.',
    improveNextWeek: 'Get back to regular workout schedule after missing a few sessions.',
    selfieUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop',
  },
  'week46': {
    completed: true,
    weekRange: 'Nov 10 – 16',
    overallScore: 7.2,
    wealthRatings: { physical: 8, social: 6, mental: 7, financial: 8, time: 7 },
    wentWell: 'Strong fitness week with 5 workouts completed. Good financial discipline.',
    improveNextWeek: 'Reconnect with friends - social energy was low this week.',
  },
  'week47': {
    completed: true,
    weekRange: 'Nov 17 – 23',
    overallScore: 7.1,
    wealthRatings: { physical: 7, social: 8, mental: 7, financial: 6, time: 7 },
    wentWell: 'Great catch-ups with old friends. Felt mentally clear and focused.',
    improveNextWeek: 'Review budget before holiday spending begins.',
    selfieUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop',
  },
  'week49': {
    completed: true,
    weekRange: 'Dec 1 – 7',
    overallScore: 7.2,
    wealthRatings: { physical: 8, social: 7, mental: 6, financial: 7, time: 8 },
    wentWell: 'Maintained consistent exercise routine and had quality family time.',
    improveNextWeek: 'Focus more on deep work and reduce distractions.',
  },
  'week50': {
    completed: true,
    weekRange: 'Dec 8 – 14',
    overallScore: 6.8,
    wealthRatings: { physical: 7, social: 6, mental: 7, financial: 6, time: 8 },
    wentWell: 'Made progress on holiday shopping and stayed within budget.',
    improveNextWeek: 'Get more sleep and prioritize self-care.',
    selfieUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  },
  'week51': {
    completed: true,
    weekRange: 'Dec 15 – 21',
    overallScore: 7.4,
    wealthRatings: { physical: 7, social: 8, mental: 7, financial: 7, time: 8 },
    wentWell: 'Great social connections with friends and family gatherings.',
    improveNextWeek: 'Finish all work before the holiday break.',
  },
  'week52': {
    completed: true,
    weekRange: 'Dec 22 – 28',
    overallScore: 8.0,
    wealthRatings: { physical: 8, social: 9, mental: 8, financial: 7, time: 8 },
    wentWell: 'Wonderful Christmas celebrations with loved ones.',
    improveNextWeek: 'Set intentions and goals for the new year.',
    selfieUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  },
};

const getWeeklyData = (weekNumber: number): WeeklyData | null => {
  return mockWeeklyData[`week${weekNumber}`] || null;
};

// Helper to get approximate date range for any week number (ISO week)
const getWeekDateRange = (weekNumber: number): string => {
  // ISO week 1 of 2025 starts on Dec 30, 2024 (Monday)
  // For simplicity, we'll use a lookup for common weeks or calculate
  const weekRanges: { [key: number]: string } = {
    1: 'Dec 30 – Jan 5',
    44: 'Oct 27 – Nov 2',
    45: 'Nov 3 – 9',
    46: 'Nov 10 – 16',
    47: 'Nov 17 – 23',
    48: 'Nov 24 – 30',
    49: 'Dec 1 – 7',
    50: 'Dec 8 – 14',
    51: 'Dec 15 – 21',
    52: 'Dec 22 – 28',
  };

  if (weekRanges[weekNumber]) {
    return weekRanges[weekNumber];
  }

  // Fallback calculation for other weeks
  const jan6 = new Date(2025, 0, 6); // First Monday of ISO week 2
  const weekStart = new Date(jan6);
  weekStart.setDate(jan6.getDate() + (weekNumber - 2) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${months[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}`;
  } else {
    return `${months[weekStart.getMonth()]} ${weekStart.getDate()} – ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
  }
};

const WeeklyReviewScreen = ({ navigation, route }: WeeklyReviewScreenProps): React.JSX.Element => {
  const initialWeekNumber = route?.params?.weekNumber || 1;
  const dateRange = route?.params?.dateRange || '';

  const [currentWeekNumber, setCurrentWeekNumber] = useState(initialWeekNumber);
  const weeklyData = getWeeklyData(currentWeekNumber);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  const handlePreviousWeek = () => {
    if (currentWeekNumber > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentWeekNumber(currentWeekNumber - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekNumber < 52) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentWeekNumber(currentWeekNumber + 1);
    }
  };

  const openImageViewer = (imageUri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImageUri(imageUri);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageViewerVisible(false);
    setSelectedImageUri(null);
  };

  const downloadImage = async () => {
    if (!selectedImageUri) return;

    try {
      setIsDownloading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save photos to your library.');
        setIsDownloading(false);
        return;
      }

      const filename = `week-snapshot-${Date.now()}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(selectedImageUri, fileUri);

      if (downloadResult.status === 200) {
        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved!', 'Photo has been saved to your library.');
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save the photo. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!weeklyData) {
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
            <Text style={styles.headerTitle}>Week {currentWeekNumber}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Weekly Check-in Card - Empty State */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#0D9488" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Weekly Check-in</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Date Navigation */}
              <View style={styles.emptyDateSection}>
                <View style={styles.weekNavigationRow}>
                  <TouchableOpacity
                    style={[styles.weekNavButton, currentWeekNumber <= 1 && styles.weekNavButtonDisabled]}
                    onPress={handlePreviousWeek}
                    disabled={currentWeekNumber <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={18} color={currentWeekNumber <= 1 ? '#D1D5DB' : '#0D9488'} />
                  </TouchableOpacity>
                  <View style={styles.weeklyDateBadge}>
                    <Ionicons name="calendar-outline" size={14} color="#0D9488" />
                    <Text style={styles.weeklyDateText}>{getWeekDateRange(currentWeekNumber)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.weekNavButton, currentWeekNumber >= 52 && styles.weekNavButtonDisabled]}
                    onPress={handleNextWeek}
                    disabled={currentWeekNumber >= 52}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={18} color={currentWeekNumber >= 52 ? '#D1D5DB' : '#0D9488'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Empty State Content */}
              <View style={styles.emptyCardContent}>
                <View style={styles.emptyCardIcon}>
                  <Ionicons name="document-text-outline" size={32} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyCardTitle}>No review data</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Complete your weekly check-in to see your review here
                </Text>
                <TouchableOpacity
                  style={styles.emptyCardButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // TODO: Navigate to weekly check-in flow
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyCardButtonText}>Complete Check-in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
          <Text style={styles.headerTitle}>Week {currentWeekNumber}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Weekly Check-in Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#5EEAD4', '#14B8A6', '#0D9488']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="calendar" size={22} color="#0D9488" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Weekly Check-in</Text>
                {weeklyData.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Hero Score Section */}
              <View style={styles.weeklyHeroSection}>
                <View style={styles.weekNavigationRow}>
                  <TouchableOpacity
                    style={[styles.weekNavButton, currentWeekNumber <= 1 && styles.weekNavButtonDisabled]}
                    onPress={handlePreviousWeek}
                    disabled={currentWeekNumber <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={18} color={currentWeekNumber <= 1 ? '#D1D5DB' : '#0D9488'} />
                  </TouchableOpacity>
                  <View style={styles.weeklyDateBadge}>
                    <Ionicons name="calendar-outline" size={14} color="#0D9488" />
                    <Text style={styles.weeklyDateText}>{weeklyData.weekRange}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.weekNavButton, currentWeekNumber >= 52 && styles.weekNavButtonDisabled]}
                    onPress={handleNextWeek}
                    disabled={currentWeekNumber >= 52}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={18} color={currentWeekNumber >= 52 ? '#D1D5DB' : '#0D9488'} />
                  </TouchableOpacity>
                </View>
                <View style={styles.weeklyScoreCircle}>
                  <Text style={styles.weeklyScoreNumber}>{weeklyData.overallScore.toFixed(1)}</Text>
                  <Text style={styles.weeklyScoreLabel}>Overall</Text>
                </View>
              </View>

              {/* Wealth Rating Bars */}
              <View style={styles.weeklyRatingsBlock}>
                <WeeklyRatingBar label="Physical" value={weeklyData.wealthRatings.physical} color="#10B981" icon="fitness" />
                <WeeklyRatingBar label="Social" value={weeklyData.wealthRatings.social} color="#8B5CF6" icon="people" />
                <WeeklyRatingBar label="Mental" value={weeklyData.wealthRatings.mental} color="#3B82F6" icon="bulb" />
                <WeeklyRatingBar label="Financial" value={weeklyData.wealthRatings.financial} color="#F59E0B" icon="wallet" />
                <WeeklyRatingBar label="Time" value={weeklyData.wealthRatings.time} color="#EC4899" icon="time" />
              </View>

              {/* Reflections */}
              <View style={styles.weeklyReflectionsContainer}>
                <View style={styles.weeklyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="checkmark-circle" size={16} color="#0D9488" />
                    <Text style={styles.infoLabel}>What went well</Text>
                  </View>
                  <Text style={styles.infoText}>{weeklyData.wentWell}</Text>
                </View>
                <View style={styles.weeklyReflectionDivider} />
                <View style={styles.weeklyReflectionItem}>
                  <View style={styles.infoHeader}>
                    <Ionicons name="arrow-forward-circle" size={16} color="#0D9488" />
                    <Text style={styles.infoLabel}>Focus for next week</Text>
                  </View>
                  <Text style={styles.infoText}>{weeklyData.improveNextWeek}</Text>
                </View>
              </View>

              {/* Week Selfie */}
              {weeklyData.selfieUri && (
                <View style={styles.weeklySelfieContainerBottom}>
                  <View style={styles.weeklySelfieHeader}>
                    <Ionicons name="camera" size={14} color="#0D9488" />
                    <Text style={styles.weeklySelfieLabel}>Week snapshot</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.weeklySelfieImageWrapper}
                    onPress={() => openImageViewer(weeklyData.selfieUri!)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: weeklyData.selfieUri }}
                      style={styles.weeklySelfieImage}
                      resizeMode="cover"
                    />
                    <View style={styles.selfieExpandHint}>
                      <Ionicons name="expand" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          <SafeAreaView style={styles.imageViewerHeaderSafeArea}>
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity
                style={styles.imageViewerButton}
                onPress={closeImageViewer}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.imageViewerTitle}>Week Snapshot</Text>
              <TouchableOpacity
                style={styles.imageViewerButton}
                onPress={downloadImage}
                activeOpacity={0.7}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.imageViewerContent}>
            {selectedImageUri && (
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.imageViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Weekly Rating Bar Component
interface WeeklyRatingBarProps {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const WeeklyRatingBar: React.FC<WeeklyRatingBarProps> = ({ label, value, color, icon }) => {
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
    <View style={styles.weeklyRatingBarItem}>
      <View style={styles.weeklyRatingBarHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.weeklyRatingBarLabel}>{label}</Text>
        <Text style={[styles.weeklyRatingBarValue, { color }]}>{value}</Text>
      </View>
      <View style={[styles.weeklyRatingBarTrack, { backgroundColor: getTrackColor(color) }]}>
        <View style={[styles.weeklyRatingBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
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
    fontSize: 19,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
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
  emptyDateSection: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  emptyCardContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  emptyCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  emptyCardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  emptyCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  emptyCardButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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

  // Weekly Hero
  weeklyHeroSection: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 24,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekNavigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  weekNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  weeklyDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  weeklyDateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0D9488',
  },
  weeklyScoreCircle: {
    alignItems: 'center',
  },
  weeklyScoreNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0D9488',
    letterSpacing: -1,
  },
  weeklyScoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -2,
  },

  // Weekly Ratings
  weeklyRatingsBlock: {
    gap: 18,
    paddingTop: 24,
    paddingBottom: 24,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weeklyRatingBarItem: {
    gap: 6,
  },
  weeklyRatingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyRatingBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  weeklyRatingBarValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  weeklyRatingBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weeklyRatingBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Weekly Reflections
  weeklyReflectionsContainer: {
    borderTopWidth: 0,
    borderTopColor: '#E5E7EB',
    marginBottom: -24,
  },
  weeklyReflectionItem: {
    paddingVertical: 24,
  },
  weeklyReflectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  // Weekly Selfie
  weeklySelfieContainerBottom: {
    marginTop: 24,
    marginBottom: 0,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  weeklySelfieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  weeklySelfieLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  weeklySelfieImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  weeklySelfieImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  selfieExpandHint: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Image Viewer
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeaderSafeArea: {
    backgroundColor: 'transparent',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  imageViewerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageViewerImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: 16,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default WeeklyReviewScreen;
