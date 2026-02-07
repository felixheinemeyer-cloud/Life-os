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
import OnboardingHeroGraphic from '../components/OnboardingHeroGraphic';

const { height } = Dimensions.get('window');

interface Props {
  onContinue: () => void;
}

const OnboardingScreen0: React.FC<Props> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Warm gradient background wash */}
      <LinearGradient
        colors={['#F7ECDA', '#F2EDDF', '#F0EEE8', '#F0EEE8']}
        locations={[0, 0.25, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Background orbs (continue into Screen 1's left orbs) ── */}
      <View style={styles.orbLayer}>
        {/* Gold accent — continues as Screen 1's upper-left */}
        <View style={[styles.orbWrap, { top: height * 0.06, right: -110 }]}>
          <View style={styles.goldAccentOuter} />
          <View style={styles.goldAccentCore} />
        </View>

        {/* Lavender zone — continues as Screen 1's bottom-left */}
        <View style={[styles.orbWrap, { bottom: -110, right: -180 }]}>
          <View style={styles.lavOuter} />
          <View style={styles.lavMid} />
          <View style={styles.lavCore} />
        </View>
      </View>

      {/* ── Top spacer ── */}
      <View style={styles.topSpacer} />

      {/* ── Hero graphic with logo overlay ── */}
      <View style={styles.heroContainer}>
        <OnboardingHeroGraphic size={320} />
        <View style={styles.logoOverlay}>
          <Image
            source={require('../../assets/clarity-mark.png')}
            style={styles.logoImage}
          />
        </View>
      </View>

      {/* ── Text ── */}
      <View style={styles.textContainer}>
        <Text style={styles.headline}>
          <Text style={styles.headlineEmphasis}>Clearly</Text> your{'\n'}best solution
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
          <Text style={styles.continueButtonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.7}
        >
          <Text style={styles.loginButtonText}>I already have an account</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          By continuing, you agree to our{'\n'}
          <Text style={styles.legalLink}>Terms of Service</Text> and <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
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

  /* ── Layout ── */
  topSpacer: {
    flex: 1.3,
  },
  bottomSpacer: {
    flex: 1,
  },

  /* ── Orbs (mirrored from Screen 1) ── */
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orbWrap: {
    position: 'absolute',
  },
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

  /* ── Hero graphic ── */
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  /* ── Text ── */
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  headline: {
    fontSize: 44,
    fontWeight: '600',
    color: '#1C1917',
    lineHeight: 54,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  headlineEmphasis: {
    fontStyle: 'italic',
    color: '#7C3AED',
  },

  /* ── Footer ── */
  footer: {
    paddingHorizontal: 40,
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
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
  loginButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginButtonText: {
    color: '#1C1917',
    fontSize: 15,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});

export default OnboardingScreen0;
