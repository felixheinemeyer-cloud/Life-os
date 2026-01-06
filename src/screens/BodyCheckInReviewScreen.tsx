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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BodyCheckInReviewScreenProps {
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

interface BodyMeasurement {
  label: string;
  value: number;
  unit: string;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
}

interface WellnessMetric {
  label: string;
  value: number;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface BodyCheckInData {
  completed: boolean;
  monthName: string;
  date: string;
  photos: {
    front?: string;
    side?: string;
    back?: string;
  };
  measurements: BodyMeasurement[];
  wellness: WellnessMetric[];
  physicalActivity: string;
  satisfaction: number;
  healthAssessment: string;
  mentalWellness: string;
  mentalLoad: string;
  whatHelped: string;
  energyDrains: string;
  focus: string;
}

// Mock data for body check-ins
const mockBodyCheckInData: { [key: string]: BodyCheckInData } = {
  '2025-11': {
    completed: true,
    monthName: 'November',
    date: 'November 30, 2025',
    photos: {
      front: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop',
    },
    measurements: [
      { label: 'Weight', value: 75.2, unit: 'kg', change: -1.3, icon: 'scale-outline' },
      { label: 'Body Fat', value: 18.5, unit: '%', change: -0.8, icon: 'body-outline' },
      { label: 'Waist', value: 82, unit: 'cm', change: -2, icon: 'resize-outline' },
      { label: 'Chest', value: 102, unit: 'cm', change: 1, icon: 'fitness-outline' },
      { label: 'Arms', value: 36, unit: 'cm', change: 0.5, icon: 'barbell-outline' },
    ],
    wellness: [
      { label: 'Energy', value: 8, icon: 'flash', color: '#F59E0B' },
      { label: 'Sleep', value: 7.38, unit: 'h', icon: 'moon', color: '#8B5CF6' },
      { label: 'Workouts', value: 9, icon: 'barbell', color: '#10B981' },
      { label: 'Nutrition', value: 7, icon: 'nutrition', color: '#EC4899' },
    ],
    physicalActivity: 'Strength training 4x/week, running 2x/week, daily walks',
    satisfaction: 8,
    healthAssessment: 'Overall feeling healthy and strong. Minor lower back tightness from sitting too much.',
    mentalWellness: 'Good mental clarity and focus. Meditation practice helping with stress management.',
    mentalLoad: 'Work projects demanding but manageable. Need to set better boundaries.',
    whatHelped: 'Morning workouts, meal prepping on Sundays, 10min daily meditation',
    energyDrains: 'Late night screen time, skipping lunch breaks, overthinking work issues',
    focus: 'Want to improve sleep quality and be more consistent with nutrition on weekends.',
  },
};

const getBodyCheckInData = (year: number, month: number): BodyCheckInData | null => {
  return mockBodyCheckInData[`${year}-${month}`] || null;
};

const BodyCheckInReviewScreen = ({ navigation, route }: BodyCheckInReviewScreenProps): React.JSX.Element => {
  const month = route?.params?.month || 11;
  const year = route?.params?.year || 2025;
  const monthName = route?.params?.monthName || 'November';

  const bodyData = getBodyCheckInData(year, month);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Photo viewer state
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoLabel, setSelectedPhotoLabel] = useState<string>('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.goBack();
  };

  const openPhotoViewer = (photoUri: string, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPhoto(photoUri);
    setSelectedPhotoLabel(label);
    setPhotoViewerVisible(true);
  };

  const closePhotoViewer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoViewerVisible(false);
    setSelectedPhoto(null);
  };

  if (!bodyData) {
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
            <Text style={styles.headerTitle}>Body Check-In</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="body-outline" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Body Check-In Data</Text>
          <Text style={styles.emptySubtitle}>This body check-in hasn't been completed yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photoEntries = Object.entries(bodyData.photos).filter(([_, uri]) => uri);

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
          <Text style={styles.headerTitle}>Body Check-In</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Body Check-in Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#BAE6FD', '#38BDF8', '#0EA5E9']}
                style={styles.sectionIconRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionIconInner}>
                  <Ionicons name="body" size={22} color="#0EA5E9" />
                </View>
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Body Check-In</Text>
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {/* Date Badge */}
              <View style={styles.dateBadgeContainer}>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={14} color="#0EA5E9" />
                  <Text style={styles.dateBadgeText}>{monthName}</Text>
                </View>
              </View>

              {/* Wellness Metrics Section */}
              <View style={styles.wellnessSection}>
                <View style={styles.wellnessGrid}>
                  {bodyData.wellness.map((metric, index) => (
                    <WellnessBar key={index} metric={metric} />
                  ))}
                </View>
              </View>

              {/* Reflections Section */}
              <View style={styles.reflectionsSection}>
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="fitness" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>Physical activity</Text>
                  </View>
                  <Text style={styles.reflectionText}>{bodyData.physicalActivity}</Text>
                </View>
                <View style={styles.reflectionDivider} />
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="star" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>Satisfaction</Text>
                  </View>
                  <View style={styles.satisfactionRow}>
                    <View style={styles.satisfactionPill}>
                      <Text style={styles.satisfactionValue}>{bodyData.satisfaction}/10</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reflectionDivider} />
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="medkit" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>Health assessment</Text>
                  </View>
                  <Text style={styles.reflectionText}>{bodyData.healthAssessment}</Text>
                </View>
                <View style={styles.reflectionDivider} />
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="happy" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>Mental wellness</Text>
                  </View>
                  <Text style={styles.reflectionText}>{bodyData.mentalWellness}</Text>
                </View>
                <View style={styles.reflectionDivider} />
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="cloud" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>Mental load</Text>
                  </View>
                  <Text style={styles.reflectionText}>{bodyData.mentalLoad}</Text>
                </View>
                <View style={styles.reflectionDivider} />
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="sunny" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>What helped</Text>
                  </View>
                  <Text style={styles.reflectionText}>{bodyData.whatHelped}</Text>
                </View>
                <View style={styles.reflectionDivider} />
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="battery-dead" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>Energy drains</Text>
                  </View>
                  <Text style={styles.reflectionText}>{bodyData.energyDrains}</Text>
                </View>
                <View style={styles.reflectionDivider} />
                <View style={styles.reflectionItem}>
                  <View style={styles.reflectionHeader}>
                    <Ionicons name="arrow-forward-circle" size={16} color="#0EA5E9" />
                    <Text style={styles.reflectionLabel}>Focus for next month</Text>
                  </View>
                  <Text style={styles.reflectionText}>{bodyData.focus}</Text>
                </View>
              </View>

              {/* Measurements Section */}
              <View style={styles.measurementsSection}>
                <View style={styles.measurementsSectionHeader}>
                  <Ionicons name="analytics" size={16} color="#0EA5E9" />
                  <Text style={styles.measurementsSectionTitle}>Measurements</Text>
                </View>

                {/* Weight Entry */}
                {bodyData.measurements.filter(m => m.label === 'Weight').map((m, i) => (
                  <View key={i} style={styles.weightEntry}>
                    <Text style={styles.weightLabel}>Weight</Text>
                    <View style={styles.weightRight}>
                      <View style={styles.weightPill}>
                        <Text style={styles.weightPillValue}>{m.value} {m.unit}</Text>
                      </View>
                      {m.change !== 0 && (
                        <View style={[styles.weightChangeBadge, m.change < 0 ? styles.weightChangeNegative : styles.weightChangePositive]}>
                          <Ionicons
                            name={m.change < 0 ? 'arrow-down' : 'arrow-up'}
                            size={10}
                            color={m.change < 0 ? '#059669' : '#DC2626'}
                          />
                          <Text style={[styles.weightChangeText, { color: m.change < 0 ? '#059669' : '#DC2626' }]}>
                            {Math.abs(m.change)} {m.unit}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                {/* Other Body Stats Entry */}
                {bodyData.measurements.filter(m => m.label !== 'Weight').length > 0 && (
                  <View style={styles.measurementEntry}>
                    <Text style={styles.measurementEntryLabel}>Other Body Stats</Text>
                    <Text style={styles.measurementsText}>
                      {bodyData.measurements
                        .filter(m => m.label !== 'Weight')
                        .map((m, i, arr) =>
                          `${m.label}: ${m.value}${m.unit}${i < arr.length - 1 ? ', ' : ''}`
                        ).join('')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Progress Photos Section */}
              {photoEntries.length > 0 && (
                <View style={styles.photosSection}>
                  <View style={styles.photosSectionHeader}>
                    <Ionicons name="camera" size={16} color="#0EA5E9" />
                    <Text style={styles.photosSectionTitle}>Progress Photo</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.singlePhotoCard}
                    onPress={() => openPhotoViewer(photoEntries[0][1]!, 'Progress')}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: photoEntries[0][1] }}
                      style={styles.singlePhotoImage}
                      resizeMode="cover"
                    />
                    <View style={styles.photoExpandHint}>
                      <Ionicons name="expand" size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Photo Viewer Modal */}
      <Modal
        visible={photoViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoViewer}
      >
        <View style={styles.photoViewerOverlay}>
          <SafeAreaView style={styles.photoViewerHeaderSafeArea}>
            <View style={styles.photoViewerHeader}>
              <TouchableOpacity
                style={styles.photoViewerButton}
                onPress={closePhotoViewer}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.photoViewerTitle}>{selectedPhotoLabel}</Text>
              <View style={styles.photoViewerButtonPlaceholder} />
            </View>
          </SafeAreaView>

          <View style={styles.photoViewerContent}>
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.photoViewerImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Wellness Bar Component
interface WellnessBarProps {
  metric: WellnessMetric;
}

const WellnessBar: React.FC<WellnessBarProps> = ({ metric }) => {
  const percentage = (metric.value / 10) * 100;

  const getTrackColor = (color: string) => {
    if (color === '#F59E0B') return '#FEF3C7';
    if (color === '#8B5CF6') return '#EDE9FE';
    if (color === '#10B981') return '#D1FAE5';
    if (color === '#EC4899') return '#FCE7F3';
    return '#E5E7EB';
  };

  const formatValue = () => {
    if (metric.label === 'Sleep' && metric.unit === 'h') {
      const hours = Math.floor(metric.value);
      const minutes = Math.round((metric.value - hours) * 60);
      return `${hours}h ${minutes}m`;
    }
    return `${metric.value}${metric.unit || ''}`;
  };

  return (
    <View style={styles.wellnessBarItem}>
      <View style={styles.wellnessBarHeader}>
        <Ionicons name={metric.icon} size={16} color={metric.color} />
        <Text style={styles.wellnessBarLabel}>{metric.label}</Text>
        <Text style={[styles.wellnessBarValue, { color: metric.color }]}>{formatValue()}</Text>
      </View>
      <View style={[styles.wellnessBarTrack, { backgroundColor: getTrackColor(metric.color) }]}>
        <View style={[styles.wellnessBarFill, { width: `${percentage}%`, backgroundColor: metric.color }]} />
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

  // Date Badge
  dateBadgeContainer: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 0,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dateBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0EA5E9',
  },

  // Photos Section
  photosSection: {
    marginTop: 0,
    paddingTop: 24,
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
    borderBottomColor: '#E5E7EB',
  },
  photosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  photosSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  singlePhotoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  singlePhotoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  photoLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoExpandHint: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Measurements Section
  measurementsSection: {
    marginTop: 24,
    marginBottom: 0,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopWidth: 0,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  measurementsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  measurementsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  weightEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weightLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  weightRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightPill: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  weightPillValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  weightChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  weightChangeNegative: {
    backgroundColor: '#D1FAE5',
  },
  weightChangePositive: {
    backgroundColor: '#FEE2E2',
  },
  weightChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  measurementEntry: {
    marginBottom: 0,
  },
  measurementEntryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  measurementsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  measurementCard: {
    width: '31%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  measurementIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  measurementLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  measurementValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  measurementValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  measurementUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  measurementChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
    marginTop: 6,
  },
  measurementChangeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Wellness Section
  wellnessSection: {
    marginBottom: 0,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  wellnessSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  wellnessSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  wellnessGrid: {
    gap: 18,
  },
  wellnessBarItem: {
    gap: 6,
  },
  wellnessBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wellnessBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  wellnessBarValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  wellnessBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  wellnessBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Reflections Section
  reflectionsSection: {
    borderTopWidth: 0,
    borderTopColor: '#E5E7EB',
    paddingTop: 0,
    marginBottom: -24,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reflectionItem: {
    paddingVertical: 24,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  reflectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.1,
  },
  reflectionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },
  reflectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  satisfactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  satisfactionPill: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  satisfactionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },

  // Photo Viewer Modal
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  photoViewerHeaderSafeArea: {
    backgroundColor: 'transparent',
  },
  photoViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  photoViewerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  photoViewerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  photoViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  photoViewerImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 16,
  },

  bottomSpacer: {
    height: 20,
  },
});

export default BodyCheckInReviewScreen;
