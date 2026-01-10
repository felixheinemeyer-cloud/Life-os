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
import { WealthType, WEALTH_CONFIGS } from '../components/WealthButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STAR_SIZE = SCREEN_WIDTH * 0.8;
const CENTER = STAR_SIZE / 2;
const OUTER_RADIUS = STAR_SIZE * 0.42;
const BUTTON_SIZE = 60;

interface MorningTrackingHigherSelfScreenProps {
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

// Get filled icons for wealth types
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

const MorningTrackingHigherSelfScreen: React.FC<MorningTrackingHigherSelfScreenProps> = ({
  navigation,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Track which wealth areas have been defined (sample data)
  const completedWealth: Record<WealthType, boolean> = {
    physical: true,
    mental: true,
    social: true,
    financial: true,
    time: true,
  };

  // Animation values
  const fadeIn = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0.8)).current;
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
    Animated.spring(starScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

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

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleFinishCheckin = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('MorningTrackingComplete');
  };

  const handleWealthPress = (type: WealthType) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // In morning tracking mode, just show a brief feedback
    // Could navigate to overview screens if desired
    console.log(`Tapped ${type} wealth`);
  };

  // Count completed areas
  const completedCount = Object.values(completedWealth).filter(Boolean).length;

  const wealthOrder: WealthType[] = ['physical', 'mental', 'financial', 'time', 'social'];

  const starPath = createStarPath(CENTER, CENTER, OUTER_RADIUS * 0.75, OUTER_RADIUS * 0.35, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <TouchableOpacity
            onPress={handleBack}
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
              <Defs>
                <RadialGradient id="starGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#C7D2FE" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.6" />
                </RadialGradient>
              </Defs>
              {/* Outer decorative circles */}
              <Circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS + 20} fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
              <Circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS * 0.5} fill="none" stroke="#E5E7EB" strokeWidth="1" />
              {/* Star shape */}
              <Path d={starPath} fill="url(#starGrad)" />
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
              const position = getWealthPosition(index, CENTER, CENTER, OUTER_RADIUS + 12);
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
                        size={24}
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

        {/* Finish Check-in Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishCheckin}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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

              {/* Scrollable Content */}
              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalParagraph}>
                  Your Best Self is the highest version of who you can become — the person you aspire to be when you're living with intention, clarity, and purpose.
                </Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSubtitle}>The Five Pillars</Text>
                <View style={styles.modalPillarList}>
                  {[
                    { icon: 'fitness-outline', color: '#059669', name: 'Physical', desc: 'Body, energy & health' },
                    { icon: 'bulb-outline', color: '#3B82F6', name: 'Mental', desc: 'Mind, clarity & resilience' },
                    { icon: 'people-outline', color: '#8B5CF6', name: 'Social', desc: 'Relationships & connection' },
                    { icon: 'bar-chart-outline', color: '#F59E0B', name: 'Financial', desc: 'Wealth & security' },
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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
    left: CENTER - 26,
    top: CENTER - 26,
    width: 52,
    height: 52,
  },
  centerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  centerGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: -0.2,
  },

  // Button Container
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 40,
    maxHeight: SCREEN_HEIGHT * 0.7,
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
    maxHeight: SCREEN_HEIGHT * 0.4,
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

export default MorningTrackingHigherSelfScreen;
