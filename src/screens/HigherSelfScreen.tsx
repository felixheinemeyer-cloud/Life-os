import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WealthType, WEALTH_CONFIGS } from '../components/WealthButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STAR_SIZE = SCREEN_WIDTH * 0.85;
const CENTER = STAR_SIZE / 2;
const OUTER_RADIUS = STAR_SIZE * 0.42;
const BUTTON_SIZE = 64;

interface HigherSelfScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
  route?: {
    params?: {
      fromTracking?: boolean;
      trackingCompletionParams?: Record<string, unknown>;
    };
  };
}

// Position for each wealth type on the star (5 points)
const getWealthPosition = (index: number, centerX: number, centerY: number, radius: number) => {
  const angle = (index * 72 - 90) * (Math.PI / 180);
  return {
    x: centerX + radius * Math.cos(angle) - BUTTON_SIZE / 2,
    y: centerY + radius * Math.sin(angle) - BUTTON_SIZE / 2,
  };
};

const HigherSelfScreen: React.FC<HigherSelfScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const fromTracking = route?.params?.fromTracking ?? false;
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const nudgeShown = useRef(false);

  // Track which wealth areas have been defined
  const completedWealth: Record<WealthType, boolean> = {
    physical: true,
    mental: true,
    social: true,
    financial: false,
    time: true,
  };

  // Get filled icons for both states (gray when undefined, colored when defined)
  const getIconName = (type: WealthType): keyof typeof Ionicons.glyphMap => {
    const filledIcons: Record<WealthType, keyof typeof Ionicons.glyphMap> = {
      physical: 'fitness',
      mental: 'bulb',
      social: 'people',
      financial: 'bar-chart',
      time: 'time',
    };
    return filledIcons[type];
  };

  // Gradient colors for each wealth type (light → medium → dark)
  const WEALTH_GRADIENTS: Record<WealthType, [string, string, string]> = {
    physical: ['#34D399', '#10B981', '#059669'],
    mental: ['#93C5FD', '#60A5FA', '#3B82F6'],
    social: ['#A78BFA', '#8B5CF6', '#7C3AED'],
    financial: ['#FDE047', '#FACC15', '#EAB308'],
    time: ['#FDBA74', '#FB923C', '#F97316'],
  };

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0.8)).current;
  const starRotate = useRef(new Animated.Value(0)).current;
  const nudgeScale = useRef(new Animated.Value(0.9)).current;
  const nudgeOpacity = useRef(new Animated.Value(0)).current;
  const buttonAnims = useRef(
    [0, 1, 2, 3, 4].map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Header fade in
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Star animation
    Animated.parallel([
      Animated.spring(starScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger button animations
    const buttonAnimations = buttonAnims.map((anim, index) =>
      Animated.sequence([
        Animated.delay(300 + index * 100),
        Animated.parallel([
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    Animated.parallel(buttonAnimations).start();

    // Show nudge popup after animations settle (incomplete areas)
    if (completedCount < 5 && !nudgeShown.current) {
      nudgeShown.current = true;
      setTimeout(() => {
        setNudgeVisible(true);
        Animated.parallel([
          Animated.spring(nudgeScale, {
            toValue: 1,
            friction: 8,
            tension: 65,
            useNativeDriver: true,
          }),
          Animated.timing(nudgeOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1000);
    }
  }, []);

  const openBestSelfInfo = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('BestSelfInfo');
  };

  const closeNudge = () => {
    Animated.parallel([
      Animated.timing(nudgeScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(nudgeOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setNudgeVisible(false);
      nudgeScale.setValue(0.9);
    });
  };

  // Find incomplete wealth areas
  const incompleteAreas = (Object.entries(completedWealth) as [WealthType, boolean][])
    .filter(([, done]) => !done)
    .map(([type]) => type);
  const firstIncomplete = incompleteAreas[0];

  const handleNudgeAction = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    closeNudge();
    if (firstIncomplete) {
      setTimeout(() => handleWealthPress(firstIncomplete), 250);
    }
  };

  const handleWealthPress = (type: WealthType) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const isCompleted = completedWealth[type];

    if (type === 'physical') {
      if (isCompleted) {
        // Area is already defined - go to overview screen
        navigation.navigate('PhysicalWealthOverview');
      } else {
        // Area is not defined yet - go to intro/setup flow
        navigation.navigate('PhysicalWealthIntroAnimation');
      }
    } else if (type === 'social') {
      if (isCompleted) {
        // Area is already defined - go to overview screen
        navigation.navigate('SocialWealthOverview');
      } else {
        // Area is not defined yet - go to intro/setup flow
        navigation.navigate('SocialWealthIntroAnimation');
      }
    } else if (type === 'mental') {
      if (isCompleted) {
        // Area is already defined - go to overview screen
        navigation.navigate('MentalWealthOverview');
      } else {
        // Area is not defined yet - go to intro/setup flow
        navigation.navigate('MentalWealthIntroAnimation');
      }
    } else if (type === 'time') {
      if (isCompleted) {
        // Area is already defined - go to overview screen
        navigation.navigate('TimeWealthOverview');
      } else {
        // Area is not defined yet - go to intro/setup flow
        navigation.navigate('TimeWealthIntroAnimation');
      }
    } else if (type === 'financial') {
      if (isCompleted) {
        // Area is already defined - go to overview screen
        navigation.navigate('FinancialWealthOverview');
      } else {
        // Area is not defined yet - go to intro/setup flow
        navigation.navigate('FinancialWealthIntroAnimation');
      }
    } else {
      console.log(`Navigate to ${type} wealth flow`);
    }
  };

  // Count completed areas
  const completedCount = Object.values(completedWealth).filter(Boolean).length;

  const wealthOrder: WealthType[] = ['social', 'mental', 'financial', 'time', 'physical'];

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64, paddingBottom: fromTracking ? 24 + 80 + 24 : 24 + 48 + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero text */}
        <Animated.View style={[styles.heroSection, { opacity: fadeIn }]}>
          <Text style={styles.heroLabel}>FELIX'S</Text>
          <Text style={styles.heroTitle}>Best Self</Text>
        </Animated.View>

        {/* Progress */}
        {completedCount < 5 && (
          <Animated.View style={[styles.progressRow, { opacity: fadeIn }]}>
            <View style={styles.progressTrack}>
              {completedCount > 0 && (
                <View
                  style={[styles.progressFill, { width: `${(completedCount / 5) * 100}%` }]}
                />
              )}
            </View>
            <Text style={styles.progressLabel}>{completedCount} of 5</Text>
          </Animated.View>
        )}

        {/* Star Visualization */}
        <View style={styles.starContainer}>
          <Animated.View
            style={[
              styles.starWrapper,
              {
                transform: [{ scale: starScale }],
              },
            ]}
          >
            {/* Glowing concentric rings */}
            <Svg width={STAR_SIZE} height={STAR_SIZE} style={styles.starSvg}>
              <Defs>
                {wealthOrder.map((type, i) => {
                  const spokeColor = WEALTH_GRADIENTS[type][1];
                  const angle = (i * 72 - 90) * (Math.PI / 180);
                  const r1 = 35;
                  const r2 = OUTER_RADIUS + 15 - BUTTON_SIZE / 2 - 4;
                  return (
                    <SvgLinearGradient
                      key={`spoke-grad-${i}`}
                      id={`spokeGrad${i}`}
                      x1={String(CENTER + r1 * Math.cos(angle))}
                      y1={String(CENTER + r1 * Math.sin(angle))}
                      x2={String(CENTER + r2 * Math.cos(angle))}
                      y2={String(CENTER + r2 * Math.sin(angle))}
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop offset="0%" stopColor={spokeColor} stopOpacity="0" />
                      <Stop offset="100%" stopColor={spokeColor} stopOpacity="0.22" />
                    </SvgLinearGradient>
                  );
                })}
              </Defs>
              {/* Orbit ring */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS + 15}
                fill="rgba(99, 102, 241, 0.03)"
                stroke="rgba(99, 102, 241, 0.10)"
                strokeWidth="1"
              />
              {/* Color-gradient spoke lines radiating outward */}
              {wealthOrder.map((_type, i) => {
                const angle = (i * 72 - 90) * (Math.PI / 180);
                const r1 = 35;
                const r2 = OUTER_RADIUS + 15 - BUTTON_SIZE / 2 - 4;
                return (
                  <Line
                    key={`spoke-${i}`}
                    x1={CENTER + r1 * Math.cos(angle)}
                    y1={CENTER + r1 * Math.sin(angle)}
                    x2={CENTER + r2 * Math.cos(angle)}
                    y2={CENTER + r2 * Math.sin(angle)}
                    stroke={`url(#spokeGrad${i})`}
                    strokeWidth="1.5"
                  />
                );
              })}
            </Svg>

            {/* Center Info Button */}
            <TouchableOpacity
              style={styles.centerIconTouchable}
              onPress={openBestSelfInfo}
              activeOpacity={0.7}
            >
              <View style={styles.centerIcon}>
                <Ionicons name="star" size={22} color="#6366F1" />
              </View>
            </TouchableOpacity>

            {/* Wealth Buttons at star points */}
            {wealthOrder.map((type, index) => {
              const config = WEALTH_CONFIGS[type];
              const position = getWealthPosition(index, CENTER, CENTER, OUTER_RADIUS + 15);
              const isCompleted = completedWealth[type];
              const anim = buttonAnims[index];
              const displayColor = isCompleted ? config.color : '#9CA3AF';
              const gradientColors = WEALTH_GRADIENTS[type];

              return (
                <Animated.View
                  key={type}
                  style={[
                    styles.wealthButtonContainer,
                    {
                      left: position.x,
                      top: position.y,
                      opacity: anim.opacity,
                      transform: [{ scale: anim.scale }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleWealthPress(type)}
                    activeOpacity={0.7}
                    style={styles.wealthTouchable}
                  >
                    {isCompleted ? (
                      <LinearGradient
                        colors={gradientColors}
                        style={styles.wealthGradientRing}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.wealthInnerCircle}>
                          <Ionicons
                            name={getIconName(type)}
                            size={26}
                            color={config.color}
                          />
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={styles.wealthButtonUndefined}>
                        <Ionicons
                          name={getIconName(type)}
                          size={26}
                          color="#9CA3AF"
                        />
                      </View>
                    )}
                    <View style={styles.wealthLabelBackground}>
                      <Text style={[styles.wealthLabel, { color: displayColor }]}>
                        {config.title.replace(' Wealth', '')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>
        </View>

      </ScrollView>

      {/* Bottom - Fixed at bottom */}
      {fromTracking ? (
        <View style={[styles.finishButtonContainer, { bottom: 16 }]}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              navigation.navigate('MorningTrackingComplete', route?.params?.trackingCompletionParams ?? {});
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : completedCount < 5 ? (
        <Animated.View style={[styles.bottomContainer, { opacity: fadeIn, bottom: 24 }]}>
          <View style={styles.instructionCard}>
            <Ionicons name="star" size={16} color="#6366F1" />
            <Text style={styles.instructionText}>
              Tap the star to learn more
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {/* Fixed Header with Blur Background */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background */}
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 0.85)',
              'rgba(247, 245, 242, 0.6)',
              'rgba(247, 245, 242, 0.3)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.headerGradient}
          />
        </View>

        {/* Header Content */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeIn },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </Animated.View>
      </View>

      {/* Nudge Modal - incomplete areas reminder */}
      <Modal
        visible={nudgeVisible}
        transparent
        animationType="none"
        onRequestClose={closeNudge}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.nudgeBackdrop}
            activeOpacity={1}
            onPress={closeNudge}
          />
          <Animated.View
            style={[
              styles.nudgeContainer,
              {
                opacity: nudgeOpacity,
                transform: [{ scale: nudgeScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FAFAFA']}
              style={styles.nudgeContent}
            >
              {/* Icon */}
              <View style={styles.nudgeIconContainer}>
                <LinearGradient
                  colors={['#E0E7FF', '#C7D2FE']}
                  style={styles.nudgeIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="compass" size={26} color="#6366F1" />
                </LinearGradient>
              </View>

              {/* Title */}
              <Text style={styles.nudgeTitle}>
                {completedCount === 0
                  ? 'Define Your Best Self'
                  : `${5 - completedCount} ${5 - completedCount === 1 ? 'area' : 'areas'} left to define`}
              </Text>

              {/* Subtitle */}
              <Text style={styles.nudgeSubtitle}>
                Completing all five areas creates a clear compass for your daily decisions.
              </Text>

              {/* Incomplete areas chips */}
              <View style={styles.nudgeChipsRow}>
                {incompleteAreas.map((type) => {
                  const config = WEALTH_CONFIGS[type];
                  return (
                    <View key={type} style={[styles.nudgeChip, { backgroundColor: config.backgroundColor }]}>
                      <Ionicons name={getIconName(type)} size={14} color={config.color} />
                      <Text style={[styles.nudgeChipText, { color: config.color }]}>
                        {config.title.replace(' Wealth', '')}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={styles.nudgeCta}
                onPress={handleNudgeAction}
                activeOpacity={0.8}
              >
                <Text style={styles.nudgeCtaText}>
                  Define {firstIncomplete ? WEALTH_CONFIGS[firstIncomplete].title.replace(' Wealth', '') : 'Next Area'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Dismiss */}
              <TouchableOpacity
                onPress={closeNudge}
                activeOpacity={0.7}
                style={styles.nudgeDismiss}
              >
                <Text style={styles.nudgeDismissText}>Later</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header Container
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  headerSpacer: {
    width: 40,
  },

  // Hero
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -1,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 0,
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#E0DED8',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 1.5,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // Star Container
  starContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starWrapper: {
    width: STAR_SIZE,
    height: STAR_SIZE,
    position: 'relative',
  },
  starSvg: {
    position: 'absolute',
  },

  // Center Icon
  centerIconTouchable: {
    position: 'absolute',
    left: CENTER - 24,
    top: CENTER - 24,
    width: 48,
    height: 48,
  },
  centerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F126',
    borderWidth: 1.5,
    borderColor: '#6366F133',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Wealth Buttons
  wealthButtonContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: BUTTON_SIZE,
  },
  wealthTouchable: {
    alignItems: 'center',
  },
  wealthGradientRing: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  wealthInnerCircle: {
    width: BUTTON_SIZE - 5,
    height: BUTTON_SIZE - 5,
    borderRadius: (BUTTON_SIZE - 5) / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wealthButtonUndefined: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
  },
  wealthLabelBackground: {
    backgroundColor: '#EDECEA',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  wealthLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Bottom
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // Finish Button (tracking flow)
  finishButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  finishButton: {
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
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: -0.2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 40,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  modalContent: {
    borderRadius: 28,
    padding: 24,
    paddingTop: 24,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F126',
    borderWidth: 1.5,
    borderColor: '#6366F133',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  modalParagraph: {
    fontSize: 14.5,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    letterSpacing: -0.15,
    marginBottom: 24,
    textAlign: 'left',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  modalQuoteCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  modalQuoteLine: {
    width: 3.5,
    backgroundColor: '#6366F1',
  },
  modalQuoteContent: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 16,
  },
  modalQuoteText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#4B5563',
    lineHeight: 21,
    letterSpacing: -0.15,
  },
  modalQuoteAttribution: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    marginTop: 8,
  },
  modalPillarList: {
    gap: 8,
  },
  modalPillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEDEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  modalPillarGradientRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalPillarIconInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPillarText: {
    flex: 1,
  },
  modalPillarName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  modalPillarDesc: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  modalBottomSpacer: {
    height: 8,
  },

  // Nudge Modal
  nudgeBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  nudgeContainer: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },
  nudgeContent: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
  },
  nudgeIconContainer: {
    marginBottom: 16,
  },
  nudgeIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  nudgeSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: -0.1,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  nudgeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  nudgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  nudgeChipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  nudgeCta: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  nudgeCtaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  nudgeDismiss: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  nudgeDismissText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: -0.2,
  },
});

export default HigherSelfScreen;
