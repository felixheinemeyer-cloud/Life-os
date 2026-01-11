import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  PanResponder,
  Dimensions,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface WeeklyTrackingTimeWealthScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route?: {
    params?: {
      physicalWealth?: number;
      socialWealth?: number;
      mentalWealth?: number;
      financialWealth?: number;
    };
  };
}

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

interface RatingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

const RatingSlider: React.FC<RatingSliderProps> = ({
  value,
  onValueChange,
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
        <Text style={styles.sliderMinLabel}>Rushed</Text>
        <Text style={styles.sliderMaxLabel}>Balanced</Text>
      </View>
    </View>
  );
};

const WeeklyTrackingTimeWealthScreen: React.FC<WeeklyTrackingTimeWealthScreenProps> = ({
  navigation,
  route,
}) => {
  const [timeWealth, setTimeWealth] = useState(5);
  const physicalWealth = route?.params?.physicalWealth;
  const socialWealth = route?.params?.socialWealth;
  const mentalWealth = route?.params?.mentalWealth;
  const financialWealth = route?.params?.financialWealth;

  const handleBack = (): void => {
    Keyboard.dismiss();
    navigation?.goBack();
  };

  const handleContinue = (): void => {
    console.log('Time Wealth Rating:', timeWealth);
    console.log('All Ratings:', { physicalWealth, socialWealth, mentalWealth, financialWealth, timeWealth });
    // TODO: Navigate to weekly tracking complete/summary screen
    // navigation?.navigate('WeeklyTrackingComplete', { physicalWealth, socialWealth, mentalWealth, financialWealth, timeWealth });
  };

  // Guiding questions for Time Wealth assessment
  const guidingQuestions = [
    { icon: 'hourglass-outline' as const, text: 'Did you have enough time for what matters most?' },
    { icon: 'calendar-outline' as const, text: 'How well did you balance work and personal life?' },
    { icon: 'pause-outline' as const, text: 'Did you have margin for rest and spontaneity?' },
    { icon: 'checkmark-done-outline' as const, text: 'Were you able to complete your priorities without rushing?' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
          </View>
          <View style={styles.headerSpacer} />
        </View>

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
                <Ionicons name="time" size={28} color={THEME_COLORS.primary} />
              </View>
            </LinearGradient>
            <Text style={styles.questionText}>
              Time Wealth
            </Text>
            <Text style={styles.questionSubtext}>
              Rate your time balance and freedom this week
            </Text>
          </View>

          {/* Guiding Questions Card */}
          <View style={styles.guidingCard}>
            <Text style={styles.guidingCardTitle}>Consider...</Text>
            {guidingQuestions.map((item, index) => (
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
              value={timeWealth}
              onValueChange={setTimeWealth}
            />
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
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
    paddingTop: 4,
    paddingBottom: 16,
    flexGrow: 1,
  },

  // Header
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerSpacer: {
    width: 40,
  },

  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F2937',
  },
  progressDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
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

export default WeeklyTrackingTimeWealthScreen;
