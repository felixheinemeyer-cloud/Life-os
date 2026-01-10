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
const THUMB_SIZE = 24;

// Teal color scheme for weekly check-in
const THEME_COLORS = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryLighter: '#5EEAD4',
  gradient: ['#5EEAD4', '#14B8A6', '#0D9488'] as const,
  fill: '#14B8A6',
};

// Wealth type configurations
export type WealthType = 'physical' | 'social' | 'mental' | 'financial' | 'time';

interface WealthConfig {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  minLabel: string;
  maxLabel: string;
  guidingQuestions: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
  }>;
}

const WEALTH_CONFIGS: Record<WealthType, WealthConfig> = {
  physical: {
    title: 'Physical Wealth',
    subtitle: 'Rate your physical health and vitality this week',
    icon: 'body',
    minLabel: 'Neglected',
    maxLabel: 'Thriving',
    guidingQuestions: [
      { icon: 'flash-outline', text: 'How were your energy levels throughout the week?' },
      { icon: 'bed-outline', text: 'Did you sleep well and wake up feeling rested?' },
      { icon: 'fitness-outline', text: 'Were you consistent with exercise or movement?' },
      { icon: 'nutrition-outline', text: 'How well did you nourish your body?' },
    ],
  },
  social: {
    title: 'Social Wealth',
    subtitle: 'Rate your relationships and connections this week',
    icon: 'people',
    minLabel: 'Isolated',
    maxLabel: 'Connected',
    guidingQuestions: [
      { icon: 'people-outline', text: 'Did you spend quality time with family or friends?' },
      { icon: 'chatbubbles-outline', text: 'Did you have meaningful conversations this week?' },
      { icon: 'heart-outline', text: 'Did you feel supported and connected to others?' },
      { icon: 'hand-left-outline', text: 'Were you able to support or help someone else?' },
    ],
  },
  mental: {
    title: 'Mental Wealth',
    subtitle: 'Rate your mental clarity and focus this week',
    icon: 'bulb',
    minLabel: 'Depleted',
    maxLabel: 'Sharp',
    guidingQuestions: [
      { icon: 'bulb-outline', text: 'How clear and focused was your thinking this week?' },
      { icon: 'book-outline', text: 'Did you learn something new or challenge your mind?' },
      { icon: 'cloud-outline', text: 'How well did you manage stress and mental load?' },
      { icon: 'sparkles-outline', text: 'Did you feel creative and mentally engaged?' },
    ],
  },
  financial: {
    title: 'Financial Wealth',
    subtitle: 'Rate your financial health and security this week',
    icon: 'wallet',
    minLabel: 'Stressed',
    maxLabel: 'Secure',
    guidingQuestions: [
      { icon: 'wallet-outline', text: 'Did you stay within your budget this week?' },
      { icon: 'trending-up-outline', text: 'Did you make progress toward your financial goals?' },
      { icon: 'shield-checkmark-outline', text: 'How secure do you feel about your finances?' },
      { icon: 'cash-outline', text: 'Were you mindful about your spending decisions?' },
    ],
  },
  time: {
    title: 'Time Wealth',
    subtitle: 'Rate your time balance and freedom this week',
    icon: 'time',
    minLabel: 'Rushed',
    maxLabel: 'Balanced',
    guidingQuestions: [
      { icon: 'hourglass-outline', text: 'Did you have enough time for what matters most?' },
      { icon: 'calendar-outline', text: 'How well did you balance work and personal life?' },
      { icon: 'pause-outline', text: 'Did you have margin for rest and spontaneity?' },
      { icon: 'checkmark-done-outline', text: 'Were you able to complete your priorities without rushing?' },
    ],
  },
};

interface RatingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
}

const RatingSlider: React.FC<RatingSliderProps> = ({
  value,
  onValueChange,
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
      <View style={styles.sliderHeader}>
        <View style={styles.valueContainer}>
          <Text style={styles.valueNumber}>{value}</Text>
          <Text style={styles.valueSuffix}>/10</Text>
        </View>
      </View>

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

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderMinLabel}>{minLabel}</Text>
        <Text style={styles.sliderMaxLabel}>{maxLabel}</Text>
      </View>
    </View>
  );
};

interface WeeklyTrackingWealthContentProps {
  wealthType: WealthType;
  value: number;
  onValueChange: (value: number) => void;
  onContinue: () => void;
}

const WeeklyTrackingWealthContent: React.FC<WeeklyTrackingWealthContentProps> = ({
  wealthType,
  value,
  onValueChange,
  onContinue,
}) => {
  const config = WEALTH_CONFIGS[wealthType];

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
              <Ionicons name={config.icon} size={28} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.questionText}>
            {config.title}
          </Text>
          <Text style={styles.questionSubtext}>
            {config.subtitle}
          </Text>
        </View>

        {/* Consider Card */}
        <View style={styles.considerCard}>
          <Text style={styles.considerTitle}>CONSIDER...</Text>
          {config.guidingQuestions.map((item, index) => (
            <View key={index} style={[styles.considerItem, index === config.guidingQuestions.length - 1 && { marginBottom: 0 }]}>
              <Ionicons name={item.icon} size={16} color={THEME_COLORS.primaryLight} style={styles.considerIcon} />
              <Text style={styles.considerText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Rating Slider */}
        <View style={styles.sliderSection}>
          <RatingSlider
            value={value}
            onValueChange={onValueChange}
            minLabel={config.minLabel}
            maxLabel={config.maxLabel}
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
    paddingTop: 4,
    paddingBottom: 80,
    flexGrow: 1,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 0,
  },
  iconGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 3,
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
    lineHeight: 26,
    marginBottom: 6,
  },
  questionSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9AA0A6',
    textAlign: 'center',
  },

  // Consider Card
  considerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  considerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME_COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 20,
  },
  considerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  considerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  considerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 21,
  },

  // Slider Section
  sliderSection: {
    marginBottom: 0,
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
    justifyContent: 'center',
    marginBottom: 10,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: THEME_COLORS.primaryLighter + '40',
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
    shadowOpacity: 0.6,
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

export default WeeklyTrackingWealthContent;
