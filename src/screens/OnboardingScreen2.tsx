import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const THEME = {
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryLighter: '#DDD6FE',
};

const { height } = Dimensions.get('window');

const OPTIONS = [
  { id: 'goals', label: 'My goals', sub: "I'm moving, but not sure where" },
  { id: 'time', label: 'My time & energy', sub: "I'm busy, but not intentional" },
  { id: 'thoughts', label: 'My thoughts & ideas', sub: 'I have too many, but nothing connects' },
  { id: 'relationships', label: 'My relationships', sub: "I'm not showing up like I want to" },
  { id: 'other', label: 'Something else' },
];

interface Props {
  onContinue: () => void;
}

const OnboardingScreen2: React.FC<Props> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelected(id);
  };

  return (
    <View style={styles.container}>
      {/* Warm gradient background wash */}
      <LinearGradient
        colors={['#F0EEE8', '#F2EDDF', '#F0EEE8', '#EDE5FF08']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Background orbs ── */}
      <View style={styles.orbLayer}>
        {/* Gold zone — top-left (continues Screen 1's top-right gold) */}
        <View style={[styles.orbWrap, { top: -120, left: -200 }]}>
          <View style={styles.goldOuter} />
          <View style={styles.goldMid} />
          <LinearGradient
            colors={['#FDBA74', '#F97316']}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.goldCore}
          />
        </View>

        {/* Lavender zone — bottom-right (Screen 3 continues this) */}
        <View style={[styles.orbWrap, { bottom: -100, right: -100 }]}>
          <View style={styles.lavOuter} />
          <View style={styles.lavMid} />
          <View style={styles.lavCore} />
        </View>

        {/* Gold accent — upper-right (Screen 3 continues this) */}
        <View style={[styles.orbWrap, { top: height * 0.06, right: -60 }]}>
          <View style={styles.goldAccentOuter} />
          <View style={styles.goldAccentCore} />
        </View>
      </View>

      {/* ── Top spacer ── */}
      <View style={styles.topSpacer} />

      {/* ── Content ── */}
      <View style={styles.centerContent}>
        <Text style={styles.headline}>
          What feels most{'\n'}<Text style={styles.headlineEmphasis}>unclear</Text> right now?
        </Text>

        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => handleSelect(option.id)}
                activeOpacity={0.7}
              >
                <View style={styles.optionTextWrap}>
                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.sub && (
                    <Text
                      style={[
                        styles.optionSub,
                        isSelected && styles.optionSubSelected,
                      ]}
                    >
                      {option.sub}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color={THEME.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Bottom spacer ── */}
      <View style={styles.bottomSpacer} />

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: 48 }]}>
        <TouchableOpacity
          onPress={onContinue}
          style={[
            styles.continueButton,
            !selected && styles.continueButtonDisabled,
          ]}
          activeOpacity={0.82}
          disabled={!selected}
        >
          <Text
            style={[
              styles.continueButtonText,
              !selected && styles.continueButtonTextDisabled,
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
    overflow: 'hidden',
  },

  /* ── Layout spacers ── */
  topSpacer: {
    flex: 1.2,
  },
  bottomSpacer: {
    flex: 0.6,
  },

  /* ── Orbs ── */
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orbWrap: {
    position: 'absolute',
  },

  // Gold zone — top-left (matches Screen 1's top-right gold)
  goldOuter: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: '#FED7AA',
    opacity: 0.2,
    top: -30,
    left: -30,
  },
  goldMid: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#FDBA74',
    opacity: 0.18,
    top: 20,
    left: 20,
  },
  goldCore: {
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.22,
    marginTop: 60,
    marginLeft: 60,
  },

  // Lavender zone — bottom-right (3 layers, Screen 3 continues on its left)
  lavOuter: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: '#EDE5FF',
    opacity: 0.4,
    top: -40,
    left: -40,
  },
  lavMid: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#D8B4FE',
    opacity: 0.2,
    top: 20,
    left: 20,
  },
  lavCore: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#C084FC',
    opacity: 0.16,
    marginTop: 70,
    marginLeft: 70,
  },

  // Gold accent — upper-right (2 layers, Screen 3 continues on its left)
  goldAccentOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FED7AA',
    opacity: 0.14,
    top: -30,
    left: -30,
  },
  goldAccentCore: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FDBA74',
    opacity: 0.18,
  },

  /* ── Content ── */
  centerContent: {
    paddingHorizontal: 36,
  },
  headline: {
    fontSize: 38,
    fontWeight: '600',
    color: '#1C1917',
    lineHeight: 50,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 32,
  },
  headlineEmphasis: {
    fontStyle: 'italic',
  },

  /* ── Options ── */
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLighter + '20',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: THEME.primary,
  },
  optionSub: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  optionSubSelected: {
    color: '#4B5563',
  },

  /* ── Footer ── */
  footer: {
    paddingHorizontal: 40,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

export default OnboardingScreen2;
