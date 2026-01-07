import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  primaryBg: '#E0F2FE',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

export type WeightUnit = 'kg' | 'lbs';

export interface BodyMetricsData {
  weight: string;
  weightUnit: WeightUnit;
  measurements: string;
}

interface MonthlyBodyTrackingMetricsContentProps {
  data: BodyMetricsData;
  onDataChange: (data: BodyMetricsData) => void;
  onContinue: () => void;
}

// Suggestion chips for common body measurements
const MEASUREMENT_SUGGESTIONS = [
  { label: 'Body Fat', placeholder: '18%' },
  { label: 'Waist', placeholder: '32in' },
  { label: 'Chest', placeholder: '40in' },
  { label: 'Arms', placeholder: '14in' },
  { label: 'Hips', placeholder: '38in' },
  { label: 'Thighs', placeholder: '22in' },
];

const MonthlyBodyTrackingMetricsContent: React.FC<MonthlyBodyTrackingMetricsContentProps> = ({
  data,
  onDataChange,
  onContinue,
}) => {
  const [isWeightFocused, setIsWeightFocused] = useState(false);
  const [isMeasurementsFocused, setIsMeasurementsFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const measurementsInputRef = useRef<TextInput>(null);

  const handleWeightChange = (weight: string) => {
    const cleaned = weight.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    onDataChange({ ...data, weight: formatted });
  };

  const handleMeasurementsChange = (measurements: string) => {
    onDataChange({ ...data, measurements });
  };

  const handleSuggestionTap = (label: string, placeholder: string) => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
    const newMeasurement = `${label}: ${placeholder}`;
    const currentMeasurements = data.measurements.trim();

    if (currentMeasurements) {
      onDataChange({ ...data, measurements: `${currentMeasurements}, ${newMeasurement}` });
    } else {
      onDataChange({ ...data, measurements: newMeasurement });
    }

    measurementsInputRef.current?.focus();
  };

  const handleMeasurementsFocus = () => {
    setIsMeasurementsFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 150, animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
                <Ionicons name="fitness" size={26} color={THEME_COLORS.primary} />
              </View>
            </LinearGradient>
            <Text style={styles.headerTitle}>Body Metrics</Text>
            <Text style={styles.headerSubtitle}>
              Track your physical measurements this month
            </Text>
          </View>

          {/* Weight Input Card */}
          <View style={styles.inputCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: THEME_COLORS.primaryBg }]}>
                <Ionicons name="scale-outline" size={18} color={THEME_COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Current Weight</Text>
            </View>
            <View style={[
              styles.weightInputContainer,
              isWeightFocused && styles.inputFocused
            ]}>
              <TextInput
                style={styles.weightInput}
                placeholder="70.0"
                placeholderTextColor="#D1D5DB"
                keyboardType="decimal-pad"
                value={data.weight}
                onChangeText={handleWeightChange}
                onFocus={() => setIsWeightFocused(true)}
                onBlur={() => setIsWeightFocused(false)}
              />
              <Text style={styles.weightUnitDisplay}>kg</Text>
            </View>
          </View>

          {/* Other Body Stats Card */}
          <View style={styles.inputCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconContainer, { backgroundColor: THEME_COLORS.primaryBg }]}>
                <Ionicons name="body-outline" size={18} color={THEME_COLORS.primary} />
              </View>
              <Text style={styles.cardTitle}>Other Body Stats</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>Optional</Text>
              </View>
            </View>

            {/* Free-form Input - Primary action */}
            <View style={[
              styles.measurementsInputContainer,
              isMeasurementsFocused && styles.inputFocused
            ]}>
              <TextInput
                ref={measurementsInputRef}
                style={styles.measurementsInput}
                placeholder="Body fat: 18%, Neck: 15in, ..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={data.measurements}
                onChangeText={handleMeasurementsChange}
                onFocus={handleMeasurementsFocus}
                onBlur={() => setIsMeasurementsFocused(false)}
                textAlignVertical="top"
              />
            </View>

            {/* Quick-add Chips - Secondary helper */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Quick add:</Text>
              <View style={styles.suggestionsRow}>
                {MEASUREMENT_SUGGESTIONS.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.label}
                    style={styles.suggestionChip}
                    onPress={() => handleSuggestionTap(suggestion.label, suggestion.placeholder)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={14} color="#6B7280" style={styles.chipIcon} />
                    <Text style={styles.suggestionChipText}>{suggestion.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
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
    paddingBottom: 24,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    color: '#6B7280',
    textAlign: 'center',
  },

  // Input Cards
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  optionalBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Weight Input
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  inputFocused: {
    borderColor: THEME_COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  weightInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -1,
    paddingVertical: 8,
  },
  weightUnitDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 8,
  },

  // Measurements Input - Primary action area
  measurementsInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 12,
    marginBottom: 14,
  },
  measurementsInput: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 56,
    lineHeight: 20,
  },

  // Quick-add Suggestions - Secondary helper
  suggestionsContainer: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  suggestionsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIcon: {
    marginRight: 4,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default MonthlyBodyTrackingMetricsContent;
