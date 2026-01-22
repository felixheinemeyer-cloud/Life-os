import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  Dimensions,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const SLIDER_WIDTH = Dimensions.get('window').width - 64;
const THUMB_SIZE = 24;

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

export interface MentalWellnessData {
  mentalClarity: number;
  emotionalBalance: number;
  motivation: number;
}

interface MonthlyBodyTrackingMentalContentProps {
  data: MentalWellnessData;
  onDataChange: (data: MentalWellnessData) => void;
  onContinue: () => void;
}

interface RatingSliderProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  onValueChange: (value: number) => void;
  themeColor: string;
  minLabel: string;
  maxLabel: string;
}

const RatingSlider: React.FC<RatingSliderProps> = ({
  label,
  icon,
  value,
  onValueChange,
  themeColor,
  minLabel,
  maxLabel,
}) => {
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);

  const animatedValue = useRef(new Animated.Value(value)).current;
  const sliderWidthRef = useRef(SLIDER_WIDTH);
  const sliderLeftRef = useRef(0);
  const containerRef = useRef<View>(null);
  const valueRef = useRef(value);
  const onValueChangeRef = useRef(onValueChange);
  const isGestureActive = useRef(false);
  const lastHapticTime = useRef(0);
  const lastValueTime = useRef(0);

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

  const calculateValue = useCallback((pageX: number): number => {
    const width = sliderWidthRef.current;
    const left = sliderLeftRef.current;
    if (width <= 0) return valueRef.current;

    const locationX = pageX - left;
    const clampedX = Math.max(0, Math.min(width, locationX));
    const effectiveWidth = width - THUMB_SIZE;
    if (effectiveWidth <= 0) return valueRef.current;

    const adjustedX = Math.max(0, Math.min(effectiveWidth, clampedX - THUMB_SIZE / 2));
    const rawValue = (adjustedX / effectiveWidth) * 9 + 1;
    return Math.round(Math.max(1, Math.min(10, rawValue)));
  }, []);

  const updateValue = useCallback((pageX: number) => {
    const now = Date.now();
    if (now - lastValueTime.current < 16) return;
    lastValueTime.current = now;

    const newValue = calculateValue(pageX);
    if (newValue >= 1 && newValue <= 10 && newValue !== valueRef.current) {
      valueRef.current = newValue;
      animatedValue.setValue(newValue);
      triggerHaptic();
      onValueChangeRef.current(newValue);
    }
  }, [calculateValue, triggerHaptic, animatedValue]);

  const measureSlider = useCallback(() => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      sliderLeftRef.current = pageX;
    });
  }, []);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      isGestureActive.current = true;
      const pageX = event.nativeEvent.pageX;
      measureSlider();
      setTimeout(() => {
        if (isGestureActive.current) {
          updateValue(pageX);
        }
      }, 10);
    },
    onPanResponderMove: (event) => {
      if (!isGestureActive.current) return;
      updateValue(event.nativeEvent.pageX);
    },
    onPanResponderRelease: () => {
      isGestureActive.current = false;
    },
    onPanResponderTerminate: () => {
      isGestureActive.current = false;
    },
  }), [updateValue, measureSlider]);

  const thumbLeft = animatedValue.interpolate({
    inputRange: [1, 10],
    outputRange: [0, sliderWidth - THUMB_SIZE],
  });

  const fillWidth = animatedValue.interpolate({
    inputRange: [1, 10],
    outputRange: [THUMB_SIZE, sliderWidth],
  });

  return (
    <View style={styles.sliderContainer}>
      {/* Header: Icon + Label on left, Value pill on right */}
      <View style={styles.sliderHeader}>
        <Ionicons name={icon} size={18} color={themeColor} />
        <Text style={[styles.sliderLabel, { color: themeColor }]}>{label}</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.valueNumber}>{value}</Text>
          <Text style={styles.valueSuffix}>/10</Text>
        </View>
      </View>

      {/* Slider Track */}
      <View
        ref={containerRef}
        style={styles.sliderTrackContainer}
        onLayout={(e) => {
          setSliderWidth(e.nativeEvent.layout.width);
          measureSlider();
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrackBackground} />
        <Animated.View
          style={[
            styles.sliderFill,
            { width: fillWidth, backgroundColor: THEME_COLORS.primary },
          ]}
        />
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: thumbLeft as unknown as number }],
            },
          ]}
        >
          <View style={styles.sliderThumbInner} />
        </Animated.View>
      </View>

      {/* Min/Max Labels */}
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinLabel}>{minLabel}</Text>
        <Text style={styles.sliderMaxLabel}>{maxLabel}</Text>
      </View>
    </View>
  );
};

const MonthlyBodyTrackingMentalContent: React.FC<MonthlyBodyTrackingMentalContentProps> = ({
  data,
  onDataChange,
  onContinue,
}) => {
  const handleRatingChange = (key: keyof MentalWellnessData, value: number) => {
    onDataChange({
      ...data,
      [key]: value,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Question Section */}
        <View style={styles.questionSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.iconGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconInnerCircle}>
              <Ionicons name="cloudy-night" size={28} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.questionText}>
            Mental Wellness
          </Text>
          <Text style={styles.subtitleText}>
            How has your mind felt this month?
          </Text>
        </View>

        {/* Rating Sliders */}
        <View style={styles.slidersSection}>
          <RatingSlider
            label="Mental Clarity"
            icon="bulb"
            value={data.mentalClarity}
            onValueChange={(v) => handleRatingChange('mentalClarity', v)}
            themeColor={THEME_COLORS.primary}
            minLabel="Foggy"
            maxLabel="Clear"
          />

          <RatingSlider
            label="Emotional Balance"
            icon="swap-horizontal"
            value={data.emotionalBalance}
            onValueChange={(v) => handleRatingChange('emotionalBalance', v)}
            themeColor={THEME_COLORS.primary}
            minLabel="Overwhelmed"
            maxLabel="Grounded"
          />

          <RatingSlider
            label="Motivation"
            icon="rocket"
            value={data.motivation}
            onValueChange={(v) => handleRatingChange('motivation', v)}
            themeColor={THEME_COLORS.primary}
            minLabel="Drained"
            maxLabel="Driven"
          />
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => { Keyboard.dismiss(); onContinue(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
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
  questionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9AA0A6',
    textAlign: 'center',
  },

  // Sliders Section
  slidersSection: {
    gap: 14,
  },
  sliderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    marginBottom: 10,
    gap: 8,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: THEME_COLORS.primaryLighter + '60',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  valueNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME_COLORS.primary,
    letterSpacing: -0.5,
  },
  valueSuffix: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME_COLORS.primaryLight,
    marginLeft: 1,
  },
  sliderTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 24,
    borderRadius: 12,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sliderThumbInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 2,
    borderColor: THEME_COLORS.primary,
    overflow: 'hidden',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 2,
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default MonthlyBodyTrackingMentalContent;
