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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const SLIDER_WIDTH = Dimensions.get('window').width - 64;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 24;
const SLIDER_COLOR = '#1F2937';

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
      <View style={styles.sliderHeader}>
        <Ionicons name={icon} size={18} color={themeColor} />
        <Text style={[styles.sliderLabel, { color: themeColor }]}>{label}</Text>
        <Text style={[styles.valueText, { color: SLIDER_COLOR }]}>{value}/10</Text>
      </View>

      <View
        style={styles.sliderTrackContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrackBackground} />
        <Animated.View
          style={[styles.sliderFill, { width: fillWidthAnimated, backgroundColor: '#A78BFA' }]}
        />
        <Animated.View
          style={[
            styles.sliderThumb,
            { left: thumbLeft },
          ]}
        />
      </View>

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
            colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
            style={styles.iconGradientRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconInnerCircle}>
              <Ionicons name="cloudy-night" size={24} color="#7C3AED" />
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
            themeColor="#8B5CF6"
            minLabel="Foggy"
            maxLabel="Clear"
          />

          <RatingSlider
            label="Emotional Balance"
            icon="leaf"
            value={data.emotionalBalance}
            onValueChange={(v) => handleRatingChange('emotionalBalance', v)}
            themeColor="#10B981"
            minLabel="Overwhelmed"
            maxLabel="Grounded"
          />

          <RatingSlider
            label="Motivation"
            icon="rocket"
            value={data.motivation}
            onValueChange={(v) => handleRatingChange('motivation', v)}
            themeColor="#3B82F6"
            minLabel="Drained"
            maxLabel="Driven"
          />
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

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconGradientRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    padding: 2,
  },
  iconInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
  },
  subtitleText: {
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
    marginBottom: 12,
    gap: 8,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#E5E7EB',
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
    paddingTop: 8,
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

export default MonthlyBodyTrackingMentalContent;
