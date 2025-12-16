import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
  Dimensions,
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
  fill: '#38BDF8',
};

const SLIDER_WIDTH = Dimensions.get('window').width - 96;

export type WeightUnit = 'kg' | 'lbs';

export interface BodyMetricsData {
  weight: string;
  weightUnit: WeightUnit;
  measurements: string;
  waterIntake: number; // glasses per day (1-12)
}

interface MonthlyBodyTrackingMetricsContentProps {
  data: BodyMetricsData;
  onDataChange: (data: BodyMetricsData) => void;
  onContinue: () => void;
}

// Water intake slider component
interface WaterSliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

const WaterSlider: React.FC<WaterSliderProps> = ({ value, onValueChange }) => {
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);
  const animatedValue = useRef(new Animated.Value(value)).current;
  const sliderWidthRef = useRef(SLIDER_WIDTH);
  const valueRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);
  const isGestureActive = useRef(false);
  const lastHapticTime = useRef(0);

  const MIN_VALUE = 1;
  const MAX_VALUE = 12;

  useEffect(() => {
    if (!isGestureActive.current) {
      animatedValue.setValue(value);
    }
    valueRef.current = value;
  }, [value, animatedValue]);

  useEffect(() => {
    sliderWidthRef.current = sliderWidth;
  }, [sliderWidth]);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  const triggerHaptic = useCallback(() => {
    const now = Date.now();
    if (now - lastHapticTime.current > 80) {
      lastHapticTime.current = now;
      Haptics.selectionAsync();
    }
  }, []);

  const calculateValue = useCallback((locationX: number): number => {
    const thumbSize = 24;
    const effectiveWidth = sliderWidthRef.current - thumbSize;
    const adjustedX = Math.max(0, Math.min(effectiveWidth, locationX - thumbSize / 2));
    return Math.round(Math.max(MIN_VALUE, Math.min(MAX_VALUE, (adjustedX / effectiveWidth) * (MAX_VALUE - MIN_VALUE) + MIN_VALUE)));
  }, []);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      isGestureActive.current = true;
      const newValue = calculateValue(event.nativeEvent.locationX);
      animatedValue.setValue(newValue);
      if (newValue !== valueRef.current) {
        valueRef.current = newValue;
        triggerHaptic();
        onValueChangeRef.current(newValue);
      }
    },
    onPanResponderMove: (event) => {
      if (!isGestureActive.current) return;
      const newValue = calculateValue(event.nativeEvent.locationX);
      animatedValue.setValue(newValue);
      if (newValue !== valueRef.current) {
        valueRef.current = newValue;
        triggerHaptic();
        onValueChangeRef.current(newValue);
      }
    },
    onPanResponderRelease: () => {
      isGestureActive.current = false;
    },
    onPanResponderTerminate: () => {
      isGestureActive.current = false;
    },
  }), [calculateValue, triggerHaptic, animatedValue]);

  const thumbLeft = animatedValue.interpolate({
    inputRange: [MIN_VALUE, MAX_VALUE],
    outputRange: ['4%', '96%'],
  });

  const fillWidth = animatedValue.interpolate({
    inputRange: [MIN_VALUE, MAX_VALUE],
    outputRange: ['8%', '100%'],
  });

  // Water level indicator text
  const getWaterLevelText = (glasses: number): string => {
    if (glasses <= 4) return 'Low';
    if (glasses <= 7) return 'Moderate';
    if (glasses <= 9) return 'Good';
    return 'Excellent';
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderValueText}>{value}</Text>
        <Text style={styles.sliderValueUnit}>glasses/day</Text>
      </View>
      <Text style={styles.sliderLevelText}>{getWaterLevelText(value)}</Text>

      <View
        style={styles.sliderTrackContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrackBackground} />
        <Animated.View
          style={[styles.sliderFill, { width: fillWidth, backgroundColor: THEME_COLORS.fill }]}
        />
        <Animated.View
          style={[styles.sliderThumb, { left: thumbLeft }]}
        />
      </View>

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinLabel}>1 glass</Text>
        <Text style={styles.sliderMaxLabel}>12 glasses</Text>
      </View>
    </View>
  );
};

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

  const handleUnitToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newUnit: WeightUnit = data.weightUnit === 'kg' ? 'lbs' : 'kg';

    // Convert weight if a value exists
    let newWeight = data.weight;
    if (data.weight && !isNaN(parseFloat(data.weight))) {
      const currentWeight = parseFloat(data.weight);
      if (newUnit === 'lbs') {
        // kg to lbs
        newWeight = (currentWeight * 2.20462).toFixed(1);
      } else {
        // lbs to kg
        newWeight = (currentWeight / 2.20462).toFixed(1);
      }
    }

    onDataChange({ ...data, weight: newWeight, weightUnit: newUnit });
  };

  const handleMeasurementsChange = (measurements: string) => {
    onDataChange({ ...data, measurements });
  };

  const handleWaterChange = (waterIntake: number) => {
    onDataChange({ ...data, waterIntake });
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
            <View style={styles.inputCardHeader}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="scale-outline" size={20} color={THEME_COLORS.primary} />
                <Text style={styles.inputLabel}>Current Weight</Text>
              </View>
              {/* Unit Toggle */}
              <TouchableOpacity
                style={styles.unitToggle}
                onPress={handleUnitToggle}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.unitOption,
                  data.weightUnit === 'kg' && styles.unitOptionActive
                ]}>
                  <Text style={[
                    styles.unitOptionText,
                    data.weightUnit === 'kg' && styles.unitOptionTextActive
                  ]}>kg</Text>
                </View>
                <View style={[
                  styles.unitOption,
                  data.weightUnit === 'lbs' && styles.unitOptionActive
                ]}>
                  <Text style={[
                    styles.unitOptionText,
                    data.weightUnit === 'lbs' && styles.unitOptionTextActive
                  ]}>lbs</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={[
              styles.weightInputContainer,
              isWeightFocused && styles.inputFocused
            ]}>
              <TextInput
                style={styles.weightInput}
                placeholder={data.weightUnit === 'kg' ? '70.0' : '154.0'}
                placeholderTextColor="#D1D5DB"
                keyboardType="decimal-pad"
                value={data.weight}
                onChangeText={handleWeightChange}
                onFocus={() => setIsWeightFocused(true)}
                onBlur={() => setIsWeightFocused(false)}
              />
              <Text style={styles.weightUnitDisplay}>{data.weightUnit}</Text>
            </View>
          </View>

          {/* Water Intake Card */}
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="water-outline" size={20} color={THEME_COLORS.primary} />
                <Text style={styles.inputLabel}>Daily Water Intake</Text>
              </View>
            </View>
            <Text style={styles.waterDescription}>
              On average, how many glasses of water do you drink per day?
            </Text>
            <WaterSlider
              value={data.waterIntake}
              onValueChange={handleWaterChange}
            />
          </View>

          {/* Body Measurements Card (Optional) */}
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="resize-outline" size={20} color={THEME_COLORS.primary} />
                <Text style={styles.inputLabel}>Body Measurements</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              </View>
            </View>
            <View style={[
              styles.measurementsInputContainer,
              isMeasurementsFocused && styles.inputFocused
            ]}>
              <TextInput
                style={styles.measurementsInput}
                placeholder="E.g., Waist: 32in, Chest: 40in, Arms: 14in..."
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
            <Text style={styles.measurementsHint}>
              Track any measurements important to you
            </Text>
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
    flex: 1,
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

  // Unit Toggle
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitOptionActive: {
    backgroundColor: THEME_COLORS.primary,
  },
  unitOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitOptionTextActive: {
    color: '#FFFFFF',
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
    paddingVertical: 4,
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
    paddingVertical: 12,
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
  measurementsHint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Water Description
  waterDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },

  // Slider Styles
  sliderContainer: {
    marginTop: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sliderValueText: {
    fontSize: 40,
    fontWeight: '700',
    color: THEME_COLORS.primary,
    letterSpacing: -1,
  },
  sliderValueUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  sliderLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLORS.primary,
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderTrackContainer: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  sliderTrackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 32,
    borderRadius: 16,
    minWidth: 16,
  },
  sliderThumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    marginLeft: -13,
    top: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: THEME_COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  sliderMinLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  sliderMaxLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
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
