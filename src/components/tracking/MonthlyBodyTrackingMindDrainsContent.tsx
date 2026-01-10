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

// Mind drains options
const MIND_DRAINS = [
  {
    id: 'work_pressure',
    label: 'Work / Study Pressure',
    description: 'Deadlines, demands, expectations',
    icon: 'briefcase-outline' as const,
  },
  {
    id: 'social_overload',
    label: 'Social Overload',
    description: 'Too many interactions or obligations',
    icon: 'people-outline' as const,
  },
  {
    id: 'lack_of_structure',
    label: 'Lack of Structure',
    description: 'No routine, feeling scattered',
    icon: 'grid-outline' as const,
  },
  {
    id: 'constant_notifications',
    label: 'Constant Notifications',
    description: 'Digital interruptions and distractions',
    icon: 'notifications-outline' as const,
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty / Worrying',
    description: 'Anxious thoughts about the future',
    icon: 'help-circle-outline' as const,
  },
  {
    id: 'physical_exhaustion',
    label: 'Physical Exhaustion',
    description: 'Body fatigue affecting the mind',
    icon: 'battery-dead-outline' as const,
  },
];

export type MindDrainId =
  | 'work_pressure'
  | 'social_overload'
  | 'lack_of_structure'
  | 'constant_notifications'
  | 'uncertainty'
  | 'physical_exhaustion';

export interface MindDrainsData {
  primaryDrain: MindDrainId | null;
}

interface MonthlyBodyTrackingMindDrainsContentProps {
  data: MindDrainsData;
  onDataChange: (data: MindDrainsData) => void;
  onContinue: () => void;
}

// Mind Drain Card Component
interface MindDrainCardProps {
  drain: typeof MIND_DRAINS[0];
  isSelected: boolean;
  onSelect: () => void;
}

const MindDrainCard: React.FC<MindDrainCardProps> = ({
  drain,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.drainCard,
        isSelected && styles.drainCardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[
        styles.drainIconContainer,
        isSelected && styles.drainIconContainerSelected,
      ]}>
        <Ionicons
          name={drain.icon}
          size={21}
          color={isSelected ? '#FFFFFF' : THEME_COLORS.primary}
        />
      </View>
      <View style={styles.drainTextContainer}>
        <Text style={[
          styles.drainLabel,
          isSelected && styles.drainLabelSelected,
        ]}>
          {drain.label}
        </Text>
        <Text style={[
          styles.drainDescription,
          isSelected && styles.drainDescriptionSelected,
        ]}>
          {drain.description}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.checkmarkContainer}>
          <Ionicons name="checkmark-circle" size={22} color={THEME_COLORS.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const MonthlyBodyTrackingMindDrainsContent: React.FC<MonthlyBodyTrackingMindDrainsContentProps> = ({
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

  const handleDrainSelect = (drainId: MindDrainId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDataChange({ ...data, primaryDrain: drainId });
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
              <Ionicons name="water-outline" size={28} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Energy Drains</Text>
          <Text style={styles.headerSubtitle}>
            What drained you most?
          </Text>
        </View>

        {/* Mind Drains Selection */}
        <View style={styles.drainsSection}>
          {MIND_DRAINS.map((drain) => (
            <MindDrainCard
              key={drain.id}
              drain={drain}
              isSelected={data.primaryDrain === drain.id}
              onSelect={() => handleDrainSelect(drain.id as MindDrainId)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !data.primaryDrain && styles.continueButtonDisabled,
          ]}
          onPress={data.primaryDrain ? onContinue : undefined}
          activeOpacity={data.primaryDrain ? 0.8 : 1}
          disabled={!data.primaryDrain}
        >
          <Text style={[
            styles.continueButtonText,
            !data.primaryDrain && styles.continueButtonTextDisabled,
          ]}>Continue</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={data.primaryDrain ? "#FFFFFF" : "#9CA3AF"}
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
    paddingBottom: 80,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9AA0A6',
    textAlign: 'center',
  },

  // Mind Drains Selection - Balanced to fit all 6 options
  drainsSection: {
    gap: 8,
  },
  drainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
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
  drainCardSelected: {
    borderColor: THEME_COLORS.primary,
    backgroundColor: THEME_COLORS.primaryLighter + '20',
  },
  drainIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.primaryLighter + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drainIconContainerSelected: {
    backgroundColor: THEME_COLORS.primary,
  },
  drainTextContainer: {
    flex: 1,
  },
  drainLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  drainLabelSelected: {
    color: THEME_COLORS.primary,
  },
  drainDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  drainDescriptionSelected: {
    color: '#4B5563',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },

  // Button Container
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
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

export default MonthlyBodyTrackingMindDrainsContent;
