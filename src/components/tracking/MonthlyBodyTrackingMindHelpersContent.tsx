import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
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

// Mind helpers options - 2x4 grid layout
const MIND_HELPERS = [
  {
    id: 'good_sleep',
    label: 'Good Sleep',
    icon: 'moon-outline' as const,
  },
  {
    id: 'time_alone',
    label: 'Time Alone',
    icon: 'person-outline' as const,
  },
  {
    id: 'meaningful_conversations',
    label: 'Conversations',
    icon: 'chatbubbles-outline' as const,
  },
  {
    id: 'physical_movement',
    label: 'Movement',
    icon: 'fitness-outline' as const,
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: 'leaf-outline' as const,
  },
  {
    id: 'creative_time',
    label: 'Creative Time',
    icon: 'color-palette-outline' as const,
  },
  {
    id: 'digital_breaks',
    label: 'Digital Breaks',
    icon: 'phone-portrait-outline' as const,
  },
  {
    id: 'nothing',
    label: 'Nothing',
    icon: 'remove-outline' as const,
  },
];

export type MindHelperId =
  | 'good_sleep'
  | 'time_alone'
  | 'meaningful_conversations'
  | 'physical_movement'
  | 'nature'
  | 'creative_time'
  | 'digital_breaks'
  | 'nothing';

export interface MindHelpersData {
  selectedHelpers: MindHelperId[];
}

interface MonthlyBodyTrackingMindHelpersContentProps {
  data: MindHelpersData;
  onDataChange: (data: MindHelpersData) => void;
  onContinue: () => void;
}

// Mind Helper Card Component - Clean, elegant design
interface MindHelperCardProps {
  helper: typeof MIND_HELPERS[0];
  isSelected: boolean;
  onToggle: () => void;
}

const MindHelperCard: React.FC<MindHelperCardProps> = ({
  helper,
  isSelected,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.helperCard,
        isSelected && styles.helperCardSelected,
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Checkmark indicator in top right */}
      {isSelected && (
        <View style={styles.checkmarkBadge}>
          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
        </View>
      )}

      <View style={[
        styles.helperIconContainer,
        isSelected && styles.helperIconContainerSelected,
      ]}>
        <Ionicons
          name={helper.icon}
          size={20}
          color={isSelected ? '#FFFFFF' : THEME_COLORS.primary}
        />
      </View>
      <Text style={[
        styles.helperLabel,
        isSelected && styles.helperLabelSelected,
      ]} numberOfLines={1}>
        {helper.label}
      </Text>
    </TouchableOpacity>
  );
};

const MonthlyBodyTrackingMindHelpersContent: React.FC<MonthlyBodyTrackingMindHelpersContentProps> = ({
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

  const handleToggle = (helperId: MindHelperId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isCurrentlySelected = data.selectedHelpers.includes(helperId);

    // If selecting "nothing", clear all other selections
    if (helperId === 'nothing' && !isCurrentlySelected) {
      onDataChange({ selectedHelpers: ['nothing'] });
      return;
    }

    // If selecting something else while "nothing" is selected, remove "nothing"
    let newSelections = data.selectedHelpers.filter(id => id !== 'nothing');

    if (isCurrentlySelected) {
      newSelections = newSelections.filter(id => id !== helperId);
    } else {
      newSelections = [...newSelections, helperId];
    }

    onDataChange({ selectedHelpers: newSelections });
  };

  const hasSelection = data.selectedHelpers.length > 0;

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
              <Ionicons name="sparkles-outline" size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>What Helped</Text>
          <Text style={styles.headerSubtitle}>
            What helped your mind this month?
          </Text>
          <View style={styles.selectionHint}>
            <Text style={styles.selectionHintText}>Select all that apply</Text>
          </View>
        </View>

        {/* Mind Helpers Grid - 2x4 */}
        <View style={styles.helpersGrid}>
          {MIND_HELPERS.map((helper) => (
            <MindHelperCard
              key={helper.id}
              helper={helper}
              isSelected={data.selectedHelpers.includes(helper.id as MindHelperId)}
              onToggle={() => handleToggle(helper.id as MindHelperId)}
            />
          ))}
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !hasSelection && styles.continueButtonDisabled,
          ]}
          onPress={hasSelection ? onContinue : undefined}
          activeOpacity={hasSelection ? 0.8 : 1}
          disabled={!hasSelection}
        >
          <Text style={[
            styles.continueButtonText,
            !hasSelection && styles.continueButtonTextDisabled,
          ]}>Continue</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={hasSelection ? "#FFFFFF" : "#9CA3AF"}
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

  // Header Section - Standard size matching other screens
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
    marginBottom: 12,
  },
  selectionHint: {
    backgroundColor: THEME_COLORS.primaryLighter + '50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectionHintText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME_COLORS.primary,
  },

  // Mind Helpers Grid - 2x4
  helpersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  helperCard: {
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
  helperCardSelected: {
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
  helperIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME_COLORS.primaryLighter + '50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  helperIconContainerSelected: {
    backgroundColor: THEME_COLORS.primary,
  },
  helperLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  helperLabelSelected: {
    color: THEME_COLORS.primary,
    fontWeight: '600',
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

export default MonthlyBodyTrackingMindHelpersContent;
