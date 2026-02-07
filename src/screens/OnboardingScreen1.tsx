import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface Props {
  onContinue: () => void;
}

const OnboardingScreen1: React.FC<Props> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* ── Background orbs (layered for soft edges) ── */}
      <View style={styles.orbLayer}>
        {/* Gold zone — top-right */}
        <View style={[styles.orbWrap, { top: -120, right: -100 }]}>
          <View style={styles.goldOuter} />
          <View style={styles.goldMid} />
          <LinearGradient
            colors={['#FDBA74', '#F97316']}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.goldCore}
          />
        </View>

        {/* Gold accent — upper-left */}
        <View style={[styles.orbWrap, { top: height * 0.06, left: -60 }]}>
          <View style={styles.goldAccentOuter} />
          <View style={styles.goldAccentCore} />
        </View>

        {/* Lavender zone — bottom-left */}
        <View style={[styles.orbWrap, { bottom: -110, left: -110 }]}>
          <View style={styles.lavOuter} />
          <View style={styles.lavMid} />
          <View style={styles.lavCore} />
        </View>

      </View>

      {/* ── Top spacer (pushes content to optical center) ── */}
      <View style={styles.topSpacer} />

      {/* ── Centered content block ── */}
      <View style={styles.centerContent}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/clarity-mark.png')}
            style={styles.logoImage}
          />
        </View>

        <Text style={styles.headline}>
          Busy isn't the{'\n'}same as <Text style={styles.headlineEmphasis}>clear</Text>.
        </Text>

        <View style={styles.bodyContainer}>
          <Text style={styles.bodyLine}>
            You fill your days. You check things off.
          </Text>
          <Text style={styles.bodyLine}>
            But something still feels unfinished.
          </Text>
        </View>

        <Text style={styles.emphasisLine}>
          Not broken. Just unclear.
        </Text>
      </View>

      {/* ── Bottom spacer ── */}
      <View style={styles.bottomSpacer} />

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: 48 }]}>
        <TouchableOpacity
          onPress={onContinue}
          style={styles.continueButton}
          activeOpacity={0.82}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    flex: 1.3,
  },
  bottomSpacer: {
    flex: 1,
  },

  /* ── Orbs (layered concentric circles for soft edges) ── */
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orbWrap: {
    position: 'absolute',
  },

  // Gold zone — top-right (3 layers: outer → mid → core)
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

  // Gold accent — upper-left (2 layers)
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

  // Lavender zone — bottom-left (3 layers)
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

  /* ── Content ── */
  centerContent: {
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  logoWrap: {
    marginBottom: 32,
  },
  logoImage: {
    width: 88,
    height: 88,
    resizeMode: 'contain',
  },
  headline: {
    fontSize: 38,
    fontWeight: '600',
    color: '#1C1917',
    lineHeight: 50,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 40,
  },
  headlineEmphasis: {
    fontStyle: 'italic',
  },
  bodyContainer: {
    gap: 12,
    marginBottom: 36,
  },
  bodyLine: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 26,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  emphasisLine: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1917',
    lineHeight: 28,
    letterSpacing: -0.2,
    textAlign: 'center',
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen1;
