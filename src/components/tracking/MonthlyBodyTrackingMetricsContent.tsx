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

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
  fill: '#38BDF8',
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

const MonthlyBodyTrackingMetricsContent: React.FC<MonthlyBodyTrackingMetricsContentProps> = ({
  data,
  onDataChange,
  onContinue,
}) => {
  const [isWeightFocused, setIsWeightFocused] = useState(false);
  const [isMeasurementsFocused, setIsMeasurementsFocused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleWeightChange = (weight: string) => {
    // Only allow numeric input with one decimal point
    const cleaned = weight.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    onDataChange({ ...data, weight: formatted });
  };

  const handleMeasurementsChange = (measurements: string) => {
    onDataChange({ ...data, measurements });
  };


  const handleMeasurementsFocus = () => {
    setIsMeasurementsFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
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
                <Ionicons name="fitness" size={28} color={THEME_COLORS.primary} />
              </View>
            </LinearGradient>
            <Text style={styles.headerTitle}>Body Metrics</Text>
            <Text style={styles.headerSubtitle}>
              Track your physical measurements this month
            </Text>
          </View>

          {/* Weight Input Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="scale-outline" size={20} color={THEME_COLORS.primary} />
              <Text style={styles.inputLabel}>Current Weight</Text>
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

          {/* Additional Body Stats Card (Optional) */}
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="body-outline" size={20} color={THEME_COLORS.primary} />
                <Text style={styles.inputLabel}>Other Body Stats</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Track body fat %, waist, chest, or any body stats
            </Text>
            <View style={[
              styles.measurementsInputContainer,
              isMeasurementsFocused && styles.inputFocused
            ]}>
              <TextInput
                style={styles.measurementsInput}
                placeholder="E.g., Body fat: 18%, Waist: 32in, Chest: 40in, Arms: 14in"
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
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
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
    marginBottom: 24,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    paddingHorizontal: 20,
  },

  // Input Cards
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  optionalBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '500',
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
    paddingVertical: 8,
    minHeight: 64,
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
    lineHeight: 40,
  },
  weightUnitDisplay: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 8,
  },

  // Measurements Input
  measurementsInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 14,
  },
  measurementsInput: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 80,
    letterSpacing: -0.2,
    lineHeight: 22,
    paddingTop: 0,
    paddingLeft: 0,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 16,
    fontStyle: 'italic',
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
