import React from 'react';
import {
  View,
  Text,
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

const OnboardingScreen4: React.FC<Props> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();

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
        {/* Gold small — bottom-left (continues Screen 3's bottom-right) */}
        <View style={[styles.orbWrap, { bottom: -100, left: -80 }]}>
          <View style={styles.goldSmallOuter} />
          <View style={styles.goldSmallCore} />
        </View>

        {/* Lavender small — upper-left (continues Screen 3's upper-right) */}
        <View style={[styles.orbWrap, { top: height * 0.04, left: -60 }]}>
          <View style={styles.lavSmallOuter} />
          <View style={styles.lavSmallCore} />
        </View>

        {/* Gold accent — upper-right */}
        <View style={[styles.orbWrap, { top: -80, right: -100 }]}>
          <View style={styles.goldAccentOuter} />
          <View style={styles.goldAccentCore} />
        </View>

        {/* Lavender zone — bottom-right */}
        <View style={[styles.orbWrap, { bottom: -120, right: -140 }]}>
          <View style={styles.lavOuter} />
          <View style={styles.lavMid} />
          <View style={styles.lavCore} />
        </View>
      </View>

      {/* ── Top spacer ── */}
      <View style={styles.topSpacer} />

      {/* ── Centered content block ── */}
      <View style={styles.centerContent}>
        <Text style={styles.headline}>
          You're not lazy.{'\n'}You're <Text style={styles.headlineEmphasis}>scattered</Text>.
        </Text>

        <View style={styles.cardsContainer}>
          <View style={styles.infoCard}>
            <View style={styles.cardAccent} />
            <Text style={styles.infoCardText}>
              You track habits... but forget why you started.
            </Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.cardAccent} />
            <Text style={styles.infoCardText}>
              You save insights... but never use them.
            </Text>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.cardAccent} />
            <Text style={styles.infoCardText}>
              You improve one area of life... while others decay.
            </Text>
          </View>
        </View>

        <Text style={styles.emphasisLine}>
          The effort is real. The system isn't.
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
    flex: 1.5,
  },
  bottomSpacer: {
    flex: 1,
  },

  /* ── Orbs ── */
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orbWrap: {
    position: 'absolute',
  },

  // Gold small — bottom-left (continues Screen 3's bottom-right)
  goldSmallOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FED7AA',
    opacity: 0.16,
    top: -25,
    left: -25,
  },
  goldSmallCore: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FDBA74',
    opacity: 0.18,
  },

  // Lavender small — upper-left (continues Screen 3's upper-right)
  lavSmallOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#EDE5FF',
    opacity: 0.2,
    top: -20,
    left: -20,
  },
  lavSmallCore: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#D8B4FE',
    opacity: 0.16,
  },

  // Gold accent — upper-right
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

  // Lavender zone — bottom-right
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
  cardsContainer: {
    gap: 10,
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingLeft: 24,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#8B5CF6',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  infoCardText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
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

export default OnboardingScreen4;
