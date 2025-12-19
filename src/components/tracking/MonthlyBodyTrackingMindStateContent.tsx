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

// Mind state options
const MIND_STATES = [
  {
    id: 'light_flexible',
    label: 'Light & Flexible',
    description: 'Mentally agile and at ease',
    icon: 'sunny-outline' as const,
  },
  {
    id: 'stable_strong',
    label: 'Stable & Strong',
    description: 'Grounded and resilient',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 'tense_functional',
    label: 'Tense but Functional',
    description: 'Managing despite the pressure',
    icon: 'fitness-outline' as const,
  },
  {
    id: 'heavy_exhausted',
    label: 'Heavy & Exhausted',
    description: 'Weighed down and depleted',
    icon: 'cloudy-night-outline' as const,
  },
];

export type MindStateId =
  | 'light_flexible'
  | 'stable_strong'
  | 'tense_functional'
  | 'heavy_exhausted';

export interface MindStateData {
  mindState: MindStateId | null;
}

interface MonthlyBodyTrackingMindStateContentProps {
  data: MindStateData;
  onDataChange: (data: MindStateData) => void;
  onContinue: () => void;
}

// Mind State Card Component
interface MindStateCardProps {
  state: typeof MIND_STATES[0];
  isSelected: boolean;
  onSelect: () => void;
}

const MindStateCard: React.FC<MindStateCardProps> = ({
  state,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.stateCard,
        isSelected && styles.stateCardSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[
        styles.stateIconContainer,
        isSelected && styles.stateIconContainerSelected,
      ]}>
        <Ionicons
          name={state.icon}
          size={24}
          color={isSelected ? '#FFFFFF' : THEME_COLORS.primary}
        />
      </View>
      <View style={styles.stateTextContainer}>
        <Text style={[
          styles.stateLabel,
          isSelected && styles.stateLabelSelected,
        ]}>
          {state.label}
        </Text>
        <Text style={[
          styles.stateDescription,
          isSelected && styles.stateDescriptionSelected,
        ]}>
          {state.description}
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

const MonthlyBodyTrackingMindStateContent: React.FC<MonthlyBodyTrackingMindStateContentProps> = ({
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

  const handleStateSelect = (stateId: MindStateId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDataChange({ ...data, mindState: stateId });
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
              <Ionicons name="body-outline" size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Mind-Body State</Text>
          <Text style={styles.headerSubtitle}>
            If your mind had a physical state this month, how would it feel?
          </Text>
        </View>

        {/* Mind State Selection */}
        <View style={styles.statesSection}>
          {MIND_STATES.map((state) => (
            <MindStateCard
              key={state.id}
              state={state}
              isSelected={data.mindState === state.id}
              onSelect={() => handleStateSelect(state.id as MindStateId)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !data.mindState && styles.continueButtonDisabled,
          ]}
          onPress={data.mindState ? onContinue : undefined}
          activeOpacity={data.mindState ? 0.8 : 1}
          disabled={!data.mindState}
        >
          <Text style={[
            styles.continueButtonText,
            !data.mindState && styles.continueButtonTextDisabled,
          ]}>Continue</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={data.mindState ? "#FFFFFF" : "#9CA3AF"}
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
    marginBottom: 20,
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
    paddingHorizontal: 8,
    lineHeight: 20,
  },

  // Mind State Selection
  statesSection: {
    gap: 12,
    marginBottom: 14,
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  stateCardSelected: {
    borderColor: THEME_COLORS.primary,
    backgroundColor: THEME_COLORS.primaryLighter + '20',
  },
  stateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME_COLORS.primaryLighter + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stateIconContainerSelected: {
    backgroundColor: THEME_COLORS.primary,
  },
  stateTextContainer: {
    flex: 1,
  },
  stateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  stateLabelSelected: {
    color: THEME_COLORS.primary,
  },
  stateDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  stateDescriptionSelected: {
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

export default MonthlyBodyTrackingMindStateContent;
