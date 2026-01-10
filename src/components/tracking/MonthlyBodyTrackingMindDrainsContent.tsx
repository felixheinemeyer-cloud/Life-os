import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

// Mind drains options - 2x3 grid layout
const MIND_DRAINS = [
  {
    id: 'work_pressure',
    label: 'Work Pressure',
    icon: 'briefcase-outline' as const,
  },
  {
    id: 'social_overload',
    label: 'Social Overload',
    icon: 'people-outline' as const,
  },
  {
    id: 'lack_of_structure',
    label: 'Lack of Structure',
    icon: 'grid-outline' as const,
  },
  {
    id: 'constant_notifications',
    label: 'Notifications',
    icon: 'notifications-outline' as const,
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty',
    icon: 'help-circle-outline' as const,
  },
  {
    id: 'physical_exhaustion',
    label: 'Exhaustion',
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

// Mind Drain Card Component - Grid layout
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
      {/* Checkmark indicator in top right */}
      {isSelected && (
        <View style={styles.checkmarkBadge}>
          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
        </View>
      )}

      <View style={[
        styles.drainIconContainer,
        isSelected && styles.drainIconContainerSelected,
      ]}>
        <Ionicons
          name={drain.icon}
          size={20}
          color={isSelected ? '#FFFFFF' : THEME_COLORS.primary}
        />
      </View>
      <Text style={[
        styles.drainLabel,
        isSelected && styles.drainLabelSelected,
      ]} numberOfLines={1}>
        {drain.label}
      </Text>
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
      <View style={styles.contentContainer}>
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

        {/* Mind Drains Grid - 2x3 */}
        <View style={styles.drainsGrid}>
          {MIND_DRAINS.map((drain) => (
            <MindDrainCard
              key={drain.id}
              drain={drain}
              isSelected={data.primaryDrain === drain.id}
              onSelect={() => handleDrainSelect(drain.id as MindDrainId)}
            />
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !data.primaryDrain && styles.continueButtonDisabled,
          ]}
          onPress={data.primaryDrain ? () => { Keyboard.dismiss(); onContinue(); } : undefined}
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
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

  // Mind Drains Grid - 2x3
  drainsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  drainCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  drainCardSelected: {
    borderColor: THEME_COLORS.primary,
    backgroundColor: THEME_COLORS.primaryLighter + '25',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drainIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.primaryLighter + '50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  drainIconContainerSelected: {
    backgroundColor: THEME_COLORS.primary,
  },
  drainLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  drainLabelSelected: {
    color: THEME_COLORS.primary,
    fontWeight: '600',
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
