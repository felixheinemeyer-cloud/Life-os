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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const SLIDER_WIDTH = Dimensions.get('window').width - 64;

interface EveningTrackingRatingsContentProps {
  ratings: {
    nutrition: number;
    energy: number;
    satisfaction: number;
  };
  onRatingsChange: (ratings: { nutrition: number; energy: number; satisfaction: number }) => void;
  onContinue: () => void;
}

interface RatingSliderProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: React.ReactNode;
  value: number;
  onValueChange: (value: number) => void;
  themeColor: string;
  minLabel: string;
  maxLabel: string;
}

const THUMB_SIZE = 24;
const THEME_COLOR = '#8B5CF6'; // Evening checkin purple

const RatingSlider: React.FC<RatingSliderProps> = ({
  label,
  icon,
  customIcon,
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
    // Throttle updates to prevent rapid firing
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
      // Capture pageX immediately before event is recycled
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
        {customIcon || <Ionicons name={icon!} size={18} color={themeColor} />}
        <Text style={[styles.sliderLabel, { color: themeColor }]}>{label}</Text>
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
            { width: fillWidth, backgroundColor: THEME_COLOR },
          ]}
        />
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              transform: [{ translateX: thumbLeft as unknown as number }],
              backgroundColor: THEME_COLOR,
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

const EveningTrackingRatingsContent: React.FC<EveningTrackingRatingsContentProps> = ({
  ratings,
  onRatingsChange,
  onContinue,
}) => {
  const handleRatingChange = (key: keyof typeof ratings, value: number) => {
    onRatingsChange({
      ...ratings,
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
              <Ionicons name="stats-chart" size={24} color="#7C3AED" />
            </View>
          </LinearGradient>
          <Text style={styles.questionText}>
            Rate your day
          </Text>
        </View>

        {/* Rating Sliders */}
        <View style={styles.slidersSection}>
          <RatingSlider
            label="Nutrition"
            customIcon={<MaterialCommunityIcons name="food-apple" size={18} color="#059669" />}
            value={ratings.nutrition}
            onValueChange={(v) => handleRatingChange('nutrition', v)}
            themeColor="#059669"
            minLabel="Poor"
            maxLabel="Excellent"
          />

          <RatingSlider
            label="Energy"
            icon="flash"
            value={ratings.energy}
            onValueChange={(v) => handleRatingChange('energy', v)}
            themeColor="#F59E0B"
            minLabel="Drained"
            maxLabel="Energized"
          />

          <RatingSlider
            label="Satisfaction"
            icon="sparkles"
            value={ratings.satisfaction}
            onValueChange={(v) => handleRatingChange('satisfaction', v)}
            themeColor="#3B82F6"
            minLabel="Unfulfilled"
            maxLabel="Fulfilled"
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
    paddingTop: 16,
    paddingBottom: 16,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
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
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  valueNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: -0.5,
  },
  valueSuffix: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A78BFA',
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
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
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
    borderColor: '#7C3AED',
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 6,
    letterSpacing: -0.2,
  },
});

export default EveningTrackingRatingsContent;
