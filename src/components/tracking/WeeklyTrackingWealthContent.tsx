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
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.valueOutOf}>/10</Text>
      </View>

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
              <Ionicons name={config.icon} size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.questionText}>
            {config.title}
          </Text>
          <Text style={styles.questionSubtext}>
            {config.subtitle}
          </Text>
        </View>

        {/* Guiding Questions Card */}
        <View style={styles.guidingCard}>
          <Text style={styles.guidingCardTitle}>Consider...</Text>
          {config.guidingQuestions.map((item, index) => (
            <View key={index} style={styles.guidingItem}>
              <View style={styles.guidingIconContainer}>
                <Ionicons name={item.icon} size={17} color={THEME_COLORS.primary} />
              </View>
              <Text style={styles.guidingText}>{item.text}</Text>
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
    paddingBottom: 16,
    flexGrow: 1,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 0,
  },
  iconGradientRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 2,
  },
  iconInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    marginBottom: 4,
  },
  questionSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  // Guiding Questions Card
  guidingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    paddingBottom: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  guidingCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME_COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  guidingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guidingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${THEME_COLORS.primaryLighter}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  guidingText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 21,
  },

  // Slider Section
  sliderSection: {
    marginBottom: 0,
  },
  sliderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 10,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '700',
    color: THEME_COLORS.primary,
    letterSpacing: -1,
  },
  valueOutOf: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    marginLeft: 2,
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
    borderWidth: 2,
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
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sliderMinLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderMaxLabel: {
    fontSize: 12,
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

export default WeeklyTrackingWealthContent;
