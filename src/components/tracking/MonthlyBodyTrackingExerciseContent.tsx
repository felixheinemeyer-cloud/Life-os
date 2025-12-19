import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

// Activity levels with relatable descriptions - no numbers, just lifestyle
const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    description: 'Mostly sitting, minimal movement',
    icon: 'desktop-outline' as const,
    examples: 'Desk work, driving, watching TV',
  },
  {
    id: 'light',
    label: 'Lightly Active',
    description: 'Some walking and light activities',
    icon: 'walk-outline' as const,
    examples: 'Errands, light housework, short walks',
  },
  {
    id: 'moderate',
    label: 'Moderately Active',
    description: 'Regular movement throughout the day',
    icon: 'body-outline' as const,
    examples: 'Active job, regular walks, some workouts',
  },
  {
    id: 'active',
    label: 'Active',
    description: 'Consistent exercise and movement',
    icon: 'bicycle-outline' as const,
    examples: 'Regular workouts, sports, active hobbies',
  },
  {
    id: 'very_active',
    label: 'Very Active',
    description: 'High activity most days',
    icon: 'flame-outline' as const,
    examples: 'Daily training, physical job, athlete',
  },
];

export type ActivityLevelId = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface PhysicalActivityData {
  activityLevel: ActivityLevelId | null;
}

interface MonthlyBodyTrackingExerciseContentProps {
  data: PhysicalActivityData;
  onDataChange: (data: PhysicalActivityData) => void;
  onContinue: () => void;
}

// Activity Level Card Component
interface ActivityLevelCardProps {
  level: typeof ACTIVITY_LEVELS[0];
  isSelected: boolean;
  onSelect: () => void;
}

const ActivityLevelCard: React.FC<ActivityLevelCardProps> = ({
  level,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.activityCard,
        isSelected && styles.activityCardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[
        styles.activityIconContainer,
        isSelected && styles.activityIconContainerSelected,
      ]}>
        <Ionicons
          name={level.icon}
          size={22}
          color={isSelected ? '#FFFFFF' : THEME_COLORS.primary}
        />
      </View>
      <View style={styles.activityTextContainer}>
        <Text style={[
          styles.activityLabel,
          isSelected && styles.activityLabelSelected,
        ]}>
          {level.label}
        </Text>
        <Text style={[
          styles.activityDescription,
          isSelected && styles.activityDescriptionSelected,
        ]}>
          {level.description}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={24} color={THEME_COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const MonthlyBodyTrackingExerciseContent: React.FC<MonthlyBodyTrackingExerciseContentProps> = ({
  data,
  onDataChange,
  onContinue,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleActivitySelect = (levelId: ActivityLevelId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDataChange({ ...data, activityLevel: levelId });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.headerIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerIconInner}>
              <Ionicons name="body" size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Physical Activity</Text>
          <Text style={styles.headerSubtitle}>
            How would you describe your overall movement this month?
          </Text>
        </View>

        {/* Activity Level Selection */}
        <View style={styles.activitySection}>
          {ACTIVITY_LEVELS.map((level) => (
            <ActivityLevelCard
              key={level.id}
              level={level}
              isSelected={data.activityLevel === level.id}
              onSelect={() => handleActivitySelect(level.id as ActivityLevelId)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !data.activityLevel && styles.continueButtonDisabled,
          ]}
          onPress={data.activityLevel ? onContinue : undefined}
          activeOpacity={data.activityLevel ? 0.8 : 1}
          disabled={!data.activityLevel}
        >
          <Text style={[
            styles.continueButtonText,
            !data.activityLevel && styles.continueButtonTextDisabled,
          ]}>Continue</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={data.activityLevel ? "#FFFFFF" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    paddingHorizontal: 16,
  },

  // Activity Level Selection
  activitySection: {
    gap: 8,
    marginBottom: 14,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  activityCardSelected: {
    borderColor: THEME_COLORS.primary,
    backgroundColor: THEME_COLORS.primaryLighter + '20',
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME_COLORS.primaryLighter + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconContainerSelected: {
    backgroundColor: THEME_COLORS.primary,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  activityLabelSelected: {
    color: THEME_COLORS.primary,
  },
  activityDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  activityDescriptionSelected: {
    color: '#4B5563',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default MonthlyBodyTrackingExerciseContent;
