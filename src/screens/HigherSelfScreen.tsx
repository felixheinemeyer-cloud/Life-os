import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
import Svg, { Path, Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
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
}

// Calculate star points
const createStarPath = (cx: number, cy: number, outerR: number, innerR: number, points: number) => {
  let path = '';
  const step = Math.PI / points;

  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  path += ' Z';
  return path;
};

// Position for each wealth type on the star (5 points)
const getWealthPosition = (index: number, centerX: number, centerY: number, radius: number) => {
  const angle = (index * 72 - 90) * (Math.PI / 180);
  return {
    x: centerX + radius * Math.cos(angle) - BUTTON_SIZE / 2,
    y: centerY + radius * Math.sin(angle) - BUTTON_SIZE / 2,
  };
};

const HigherSelfScreen: React.FC<HigherSelfScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

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

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0.8)).current;
  const starRotate = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
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
  }, []);

  const openModal = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      modalScale.setValue(0.9);
    });
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

  const starPath = createStarPath(CENTER, CENTER, OUTER_RADIUS * 0.75, OUTER_RADIUS * 0.35, 5);

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64, paddingBottom: 24 + 48 + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
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
            {/* Background glow */}
            <View style={styles.glowContainer}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.15)', 'rgba(99, 102, 241, 0.05)', 'transparent']}
                style={styles.glowGradient}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </View>

            {/* Star SVG */}
            <Svg width={STAR_SIZE} height={STAR_SIZE} style={styles.starSvg}>
              {/* Outer decorative circles */}
              <Circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS + 20} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              <Circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS * 0.5} fill="none" stroke="#E5E7EB" strokeWidth="1" />
            </Svg>

            {/* Center Info Button */}
            <TouchableOpacity
              style={styles.centerIconTouchable}
              onPress={openModal}
              activeOpacity={0.8}
            >
              <View style={styles.centerIcon}>
                <LinearGradient
                  colors={['#818CF8', '#6366F1', '#4F46E5']}
                  style={styles.centerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24">
                    {/* Dot */}
                    <Circle cx="12" cy="4" r="2" fill="#FFFFFF" />
                    {/* Bar - perfectly centered */}
                    <Rect x="10" y="9" width="4" height="12" rx="2" fill="#FFFFFF" />
                  </Svg>
                </LinearGradient>
              </View>
            </TouchableOpacity>

            {/* Wealth Buttons at star points */}
            {wealthOrder.map((type, index) => {
              const config = WEALTH_CONFIGS[type];
              const position = getWealthPosition(index, CENTER, CENTER, OUTER_RADIUS + 15);
              const isCompleted = completedWealth[type];
              const anim = buttonAnims[index];
              const displayColor = isCompleted ? config.color : '#9CA3AF';

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
                    <LinearGradient
                      colors={['#FFFFFF', '#F5F5F5']}
                      style={[
                        styles.wealthButton,
                        { borderColor: displayColor },
                        !isCompleted && styles.wealthButtonUndefined,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name={getIconName(type)}
                        size={26}
                        color={displayColor}
                      />
                    </LinearGradient>
                    <Text style={[styles.wealthLabel, { color: displayColor }]}>
                      {config.title.replace(' Wealth', '')}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>
        </View>

      </ScrollView>

      {/* Bottom instruction - Fixed at bottom */}
      <Animated.View style={[styles.bottomContainer, { opacity: fadeIn, bottom: 24 }]}>
        <View style={styles.instructionCard}>
          <Ionicons name="hand-left-outline" size={18} color="#6B7280" />
          <Text style={styles.instructionText}>
            Tap any area to define your best self
          </Text>
        </View>
      </Animated.View>

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
            {
              opacity: fadeIn,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Your Best Self</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarTrack}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressBarSegment,
                      index < completedCount && styles.progressBarSegmentFilled,
                      index === 0 && styles.progressBarSegmentFirst,
                      index === 4 && styles.progressBarSegmentLast,
                    ]}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.progressText}>{completedCount}/5 areas defined</Text>
          </View>
          <View style={styles.headerSpacer} />
        </Animated.View>
      </View>

      {/* Info Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeModal}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F9FAFB']}
              style={styles.modalContent}
            >
              {/* Close Button */}
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Scrollable Content */}
              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                {/* Header Icon */}
                <View style={styles.modalIconContainer}>
                  <LinearGradient
                    colors={['#E0E7FF', '#C7D2FE']}
                    style={styles.modalIconBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="star" size={32} color="#6366F1" />
                  </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.modalTitle}>What is Your Best Self?</Text>

                <View style={styles.modalQuoteSection}>
                  <View style={styles.modalQuoteDecoration}>
                    <Text style={styles.modalQuoteMarkLeft}>"</Text>
                  </View>
                  <Text style={styles.modalQuoteText}>
                    The person who knows their destination finds the way. The person who doesn't wanders endlessly.
                  </Text>
                  <Text style={styles.modalQuoteAttribution}>Ancient Proverb</Text>
                </View>

                <View style={styles.modalDivider} />

                <Text style={styles.modalParagraph}>
                  Your Best Self is the highest version of who you can become — the person you aspire to be when you're living with intention, clarity, and purpose.
                </Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSubtitle}>Why Design It?</Text>
                <Text style={styles.modalParagraph}>
                  Without a clear vision of who you want to become, daily decisions lack direction. By defining your Best Self across five key areas of life, you create a compass that guides every choice you make.
                </Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSubtitle}>Five Pillars of Wealth</Text>
                <View style={styles.modalPillarList}>
                  {[
                    { icon: 'fitness-outline', color: '#059669', name: 'Physical', desc: 'Body, energy & health' },
                    { icon: 'bulb-outline', color: '#3B82F6', name: 'Mental', desc: 'Mind, clarity & resilience' },
                    { icon: 'people-outline', color: '#8B5CF6', name: 'Social', desc: 'Relationships & connection' },
                    { icon: 'bar-chart-outline', color: '#F59E0B', name: 'Financial', desc: 'Money & security' },
                    { icon: 'time-outline', color: '#6366F1', name: 'Time', desc: 'Focus & priorities' },
                  ].map((pillar, index) => (
                    <View key={index} style={styles.modalPillarItem}>
                      <View style={[styles.modalPillarIcon, { backgroundColor: `${pillar.color}15` }]}>
                        <Ionicons name={pillar.icon as any} size={18} color={pillar.color} />
                      </View>
                      <View style={styles.modalPillarText}>
                        <Text style={styles.modalPillarName}>{pillar.name}</Text>
                        <Text style={styles.modalPillarDesc}>{pillar.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.modalBottomSpacer} />
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
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
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  progressBarContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  progressBarTrack: {
    flexDirection: 'row',
    gap: 3,
  },
  progressBarSegment: {
    width: 24,
    height: 6,
    backgroundColor: '#E5E7EB',
  },
  progressBarSegmentFilled: {
    backgroundColor: '#1F2937',
  },
  progressBarSegmentFirst: {
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  progressBarSegmentLast: {
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 6,
  },
  headerSpacer: {
    width: 40,
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
  glowContainer: {
    position: 'absolute',
    width: STAR_SIZE,
    height: STAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowGradient: {
    width: STAR_SIZE * 0.9,
    height: STAR_SIZE * 0.9,
    borderRadius: STAR_SIZE * 0.45,
  },
  starSvg: {
    position: 'absolute',
  },

  // Center Icon
  centerIconTouchable: {
    position: 'absolute',
    left: CENTER - 28,
    top: CENTER - 28,
    width: 56,
    height: 56,
  },
  centerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  centerGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  wealthButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  wealthButtonUndefined: {
    borderStyle: 'dashed',
  },
  wealthLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
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

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 40,
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    paddingTop: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBackground: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  modalScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  modalParagraph: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 23,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  modalSubtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  modalQuoteSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalQuoteDecoration: {
    marginBottom: -16,
  },
  modalQuoteMarkLeft: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6366F1',
    lineHeight: 36,
  },
  modalQuoteText: {
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  modalQuoteAttribution: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalPillarList: {
    gap: 10,
  },
  modalPillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  modalPillarIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalPillarText: {
    flex: 1,
  },
  modalPillarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  modalPillarDesc: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 1,
  },
  modalBottomSpacer: {
    height: 16,
  },
});

export default HigherSelfScreen;
