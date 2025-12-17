import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const SLIDER_WIDTH = Dimensions.get('window').width - 64;
const THUMB_SIZE = 24;
const SLIDER_COLOR = '#1F2937';

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
  fill: '#38BDF8',
};

export interface HealthRatingsData {
  overallHealth: number; // 1-10
  skinQuality: number; // 1-10
}

interface MonthlyBodyTrackingHealthContentProps {
  data: HealthRatingsData;
  onDataChange: (data: HealthRatingsData) => void;
  onContinue: () => void;
}

// Rating Slider Component with description
interface RatingSliderProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  value: number;
  onValueChange: (value: number) => void;
  themeColor: string;
  minLabel: string;
  maxLabel: string;
}

const RatingSlider: React.FC<RatingSliderProps> = ({
  label,
  icon,
  description,
  value,
  onValueChange,
  themeColor,
  minLabel,
  maxLabel,
}) => {
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);

  const animatedValue = useRef(new Animated.Value(value)).current;
  const sliderWidthRef = useRef(SLIDER_WIDTH);
  const valueRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);
  const isGestureActive = useRef(false);
  const lastHapticTime = useRef(0);

  useEffect(() => {
    if (!isGestureActive.current) {
      animatedValue.setValue(value);
    }
    valueRef.current = value;
  }, [value]);

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
    const effectiveWidth = sliderWidthRef.current - THUMB_SIZE;
    const adjustedX = Math.max(0, Math.min(effectiveWidth, locationX - THUMB_SIZE / 2));
    return Math.round(Math.max(1, Math.min(10, (adjustedX / effectiveWidth) * 9 + 1)));
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
  }), [calculateValue, triggerHaptic]);

  const thumbLeft = animatedValue.interpolate({
    inputRange: [1, 10],
    outputRange: ['4%', '96%'],
  });

  const fillWidthAnimated = animatedValue.interpolate({
    inputRange: [1, 10],
    outputRange: ['8%', '100%'],
  });

  return (
    <View style={styles.sliderContainer}>
      {/* Header: Icon + Label on left, Value on right */}
      <View style={styles.sliderHeader}>
        <Ionicons name={icon} size={18} color={themeColor} />
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.valueText, { color: SLIDER_COLOR }]}>{value}/10</Text>
      </View>

      {/* Description */}
      <Text style={styles.sliderDescription}>{description}</Text>

      {/* Slider Track */}
      <View
        style={styles.sliderTrackContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrackBackground} />
        <Animated.View
          style={[styles.sliderFill, { width: fillWidthAnimated, backgroundColor: THEME_COLORS.fill }]}
        />
        <Animated.View
          style={[styles.sliderThumb, { left: thumbLeft }]}
        />
      </View>

      {/* Min/Max Labels */}
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinLabel}>{minLabel}</Text>
        <Text style={styles.sliderMaxLabel}>{maxLabel}</Text>
      </View>
    </View>
  );
};

const MonthlyBodyTrackingHealthContent: React.FC<MonthlyBodyTrackingHealthContentProps> = ({
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

  const handleHealthChange = (overallHealth: number) => {
    onDataChange({ ...data, overallHealth });
  };

  const handleSkinChange = (skinQuality: number) => {
    onDataChange({ ...data, skinQuality });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Main Content - No ScrollView needed */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.headerIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerIconInner}>
              <Ionicons name="heart" size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>Health Assessment</Text>
          <Text style={styles.headerSubtitle}>
            Rate your health over the past 30 days
          </Text>
        </View>

        {/* Rating Sliders */}
        <View style={styles.slidersSection}>
          <RatingSlider
            label="Overall Health"
            icon="fitness"
            description="1 = sick most of the month, 10 = felt great every day"
            value={data.overallHealth}
            onValueChange={handleHealthChange}
            themeColor={THEME_COLORS.primary}
            minLabel="Sick"
            maxLabel="Healthy"
          />

          <RatingSlider
            label="Skin Quality"
            icon="sparkles"
            description="Skin reflects your health, stress, and sleep quality"
            value={data.skinQuality}
            onValueChange={handleSkinChange}
            themeColor={THEME_COLORS.primary}
            minLabel="Poor"
            maxLabel="Excellent"
          />
        </View>
      </View>

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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Sliders Section
  slidersSection: {
    gap: 14,
  },
  sliderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
    color: '#1F2937',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  sliderTrackContainer: {
    height: 28,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14,
  },
  sliderTrackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 28,
    borderRadius: 14,
    minWidth: 14,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: -11,
    top: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sliderMinLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderMaxLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

export default MonthlyBodyTrackingHealthContent;
