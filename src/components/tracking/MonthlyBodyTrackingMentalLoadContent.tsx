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

// Purple color scheme for Mental Wellness
const THEME_COLORS = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryLighter: '#DDD6FE',
  gradient: ['#DDD6FE', '#A78BFA', '#8B5CF6'] as const,
};

// Mental load levels
const MENTAL_LOAD_LEVELS = [
  {
    id: 'calm',
    label: 'Mostly Calm',
    description: 'Plenty of mental space',
    icon: 'leaf-outline' as const,
  },
  {
    id: 'manageable',
    label: 'Busy but Manageable',
    description: 'Full schedule, but coping well',
    icon: 'list-outline' as const,
  },
  {
    id: 'overloaded',
    label: 'Mentally Overloaded',
    description: 'Too much on my plate',
    icon: 'cloudy-outline' as const,
  },
  {
    id: 'stressed',
    label: 'Constantly Stressed',
    description: 'Reactive and overwhelmed',
    icon: 'thunderstorm-outline' as const,
  },
];

export type MentalLoadLevelId = 'calm' | 'manageable' | 'overloaded' | 'stressed';

export interface MentalLoadData {
  mentalLoadLevel: MentalLoadLevelId | null;
}

interface MonthlyBodyTrackingMentalLoadContentProps {
  data: MentalLoadData;
  onDataChange: (data: MentalLoadData) => void;
  onContinue: () => void;
}

// Mental Load Card Component
interface MentalLoadCardProps {
  level: typeof MENTAL_LOAD_LEVELS[0];
  isSelected: boolean;
  onSelect: () => void;
}

const MentalLoadCard: React.FC<MentalLoadCardProps> = ({
  level,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.loadCard,
        isSelected && styles.loadCardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[
        styles.loadIconContainer,
        isSelected && styles.loadIconContainerSelected,
      ]}>
        <Ionicons
          name={level.icon}
          size={22}
          color={isSelected ? '#FFFFFF' : THEME_COLORS.primary}
        />
      </View>
      <View style={styles.loadTextContainer}>
        <Text style={[
          styles.loadLabel,
          isSelected && styles.loadLabelSelected,
        ]}>
          {level.label}
        </Text>
        <Text style={[
          styles.loadDescription,
          isSelected && styles.loadDescriptionSelected,
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

const MonthlyBodyTrackingMentalLoadContent: React.FC<MonthlyBodyTrackingMentalLoadContentProps> = ({
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

  const handleLoadSelect = (levelId: MentalLoadLevelId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDataChange({ ...data, mentalLoadLevel: levelId });
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
              <Ionicons name="scale-outline" size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Mental Load</Text>
          <Text style={styles.headerSubtitle}>
            Which best describes your mental load this month?
          </Text>
        </View>

        {/* Mental Load Selection */}
        <View style={styles.loadSection}>
          {MENTAL_LOAD_LEVELS.map((level) => (
            <MentalLoadCard
              key={level.id}
              level={level}
              isSelected={data.mentalLoadLevel === level.id}
              onSelect={() => handleLoadSelect(level.id as MentalLoadLevelId)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !data.mentalLoadLevel && styles.continueButtonDisabled,
          ]}
          onPress={data.mentalLoadLevel ? onContinue : undefined}
          activeOpacity={data.mentalLoadLevel ? 0.8 : 1}
          disabled={!data.mentalLoadLevel}
        >
          <Text style={[
            styles.continueButtonText,
            !data.mentalLoadLevel && styles.continueButtonTextDisabled,
          ]}>Continue</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={data.mentalLoadLevel ? "#FFFFFF" : "#9CA3AF"}
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

  // Mental Load Selection
  loadSection: {
    gap: 10,
    marginBottom: 14,
  },
  loadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
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
  loadCardSelected: {
    borderColor: THEME_COLORS.primary,
    backgroundColor: THEME_COLORS.primaryLighter + '20',
  },
  loadIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME_COLORS.primaryLighter + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loadIconContainerSelected: {
    backgroundColor: THEME_COLORS.primary,
  },
  loadTextContainer: {
    flex: 1,
  },
  loadLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  loadLabelSelected: {
    color: THEME_COLORS.primary,
  },
  loadDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  loadDescriptionSelected: {
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

export default MonthlyBodyTrackingMentalLoadContent;
