import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface EveningTrackingRatingsScreenProps {
  navigation?: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

const SLIDER_WIDTH = Dimensions.get('window').width - 64; // 32px padding on each side

interface RatingSliderProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  onValueChange: (value: number) => void;
  gradientColors: [string, string, string];
  thumbBorderColor: string;
  minLabel: string;
  maxLabel: string;
}

const TRACK_HEIGHT = 28;
const THUMB_SIZE = 24;

const RatingSlider: React.FC<RatingSliderProps> = ({
  label,
  icon,
  value,
  onValueChange,
  gradientColors,
  thumbBorderColor,
  minLabel,
  maxLabel,
}) => {
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);

  const handleSliderPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    // Account for thumb size padding
    const effectiveWidth = sliderWidth - THUMB_SIZE;
    const adjustedX = Math.max(0, Math.min(effectiveWidth, locationX - THUMB_SIZE / 2));
    const newValue = Math.round(Math.max(1, Math.min(10, (adjustedX / effectiveWidth) * 9 + 1)));
    if (newValue !== value) {
      Haptics.selectionAsync();
      onValueChange(newValue);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      handleSliderPress(event);
    },
    onPanResponderMove: (event) => {
      const { locationX } = event.nativeEvent;
      const effectiveWidth = sliderWidth - THUMB_SIZE;
      const adjustedX = Math.max(0, Math.min(effectiveWidth, locationX - THUMB_SIZE / 2));
      const newValue = Math.round(Math.max(1, Math.min(10, (adjustedX / effectiveWidth) * 9 + 1)));
      if (newValue !== value) {
        Haptics.selectionAsync();
        onValueChange(newValue);
      }
    },
  });

  // Calculate thumb position with padding to stay inside track
  // At value 1: position at ~4% (thumb radius from left edge)
  // At value 10: position at ~96% (thumb radius from right edge)
  const thumbPosition = 4 + ((value - 1) / 9) * 92;
  // Fill extends past thumb to surround it, goes to 105% at max to cover rounded edge
  const fillWidth = value === 10 ? 105 : thumbPosition + 4;

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Ionicons name={icon} size={18} color={gradientColors[2]} />
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.valueText, { color: gradientColors[2] }]}>{value}/10</Text>
      </View>

      <View
        style={styles.sliderTrackContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Background track (unfilled) */}
        <View style={styles.sliderTrackBackground} />
        {/* Filled portion - extends past thumb center to surround it */}
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1], gradientColors[2]]}
          style={[styles.sliderFill, { width: `${fillWidth}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        {/* Thumb */}
        <View
          style={[
            styles.sliderThumb,
            {
              left: `${thumbPosition}%`,
              borderWidth: 3,
              borderColor: thumbBorderColor,
            },
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

const EveningTrackingRatingsScreen: React.FC<EveningTrackingRatingsScreenProps> = ({
  navigation,
}) => {
  const [nutrition, setNutrition] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [satisfaction, setSatisfaction] = useState(5);

  const handleBack = (): void => {
    navigation?.goBack();
  };

  const handleContinue = (): void => {
    console.log('Ratings:', { nutrition, energy, satisfaction });
    navigation?.navigate('EveningTrackingJournal');
  };

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
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotActive} />
            <View style={styles.progressDotInactive} />
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
              colors={['#EDE9FE', '#DDD6FE', '#C4B5FD']}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="stats-chart" size={24} color="#7C3AED" />
            </LinearGradient>
            <Text style={styles.questionText}>
              Rate your day
            </Text>
          </View>

          {/* Rating Sliders */}
          <View style={styles.slidersSection}>
            <RatingSlider
              label="Nutrition"
              icon="pizza"
              value={nutrition}
              onValueChange={setNutrition}
              gradientColors={['#D1FAE5', '#34D399', '#059669']}
              thumbBorderColor="#059669"
              minLabel="Poor"
              maxLabel="Excellent"
            />

            <RatingSlider
              label="Energy"
              icon="flash"
              value={energy}
              onValueChange={setEnergy}
              gradientColors={['#FEF3C7', '#FBBF24', '#D97706']}
              thumbBorderColor="#D97706"
              minLabel="Drained"
              maxLabel="Energized"
            />

            <RatingSlider
              label="Satisfaction"
              icon="sparkles"
              value={satisfaction}
              onValueChange={setSatisfaction}
              gradientColors={['#EDE9FE', '#A78BFA', '#7C3AED']}
              thumbBorderColor="#7C3AED"
              minLabel="Unfulfilled"
              maxLabel="Fulfilled"
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
    backgroundColor: '#FFFFFF',
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
    paddingTop: 16,
    paddingBottom: 16,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#6366F1',
  },
  progressDotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
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
  questionSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 18,
  },

  // Sliders Section
  slidersSection: {
    gap: 24,
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
    color: '#1F2937',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -14,
    top: 0,
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
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default EveningTrackingRatingsScreen;
