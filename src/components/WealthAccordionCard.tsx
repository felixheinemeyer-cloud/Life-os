import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type WealthType = 'physical' | 'mental' | 'social' | 'financial' | 'time';

interface WealthConfig {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  prompt: string;
  placeholder: string;
  color: string;
  backgroundColor: string;
  lightBackground: string;
}

export const WEALTH_CONFIGS: Record<WealthType, WealthConfig> = {
  physical: {
    title: 'Physical Wealth',
    icon: 'fitness-outline',
    prompt: 'How does your best self take care of their body, energy, and health?',
    placeholder: 'Describe your ideal physical routines, exercise habits, nutrition choices, and how you maintain peak energy...',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    lightBackground: '#ECFDF5',
  },
  mental: {
    title: 'Mental Wealth',
    icon: 'bulb-outline',
    prompt: 'How does your best self think, handle stress, and stay resilient?',
    placeholder: 'Describe your mindset, how you process challenges, your learning habits, and mental clarity practices...',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    lightBackground: '#EFF6FF',
  },
  social: {
    title: 'Social Wealth',
    icon: 'people-outline',
    prompt: 'How does your best self show up in relationships and community?',
    placeholder: 'Describe how you nurture relationships, contribute to your community, and maintain meaningful connections...',
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
    lightBackground: '#F5F3FF',
  },
  financial: {
    title: 'Financial Wealth',
    icon: 'trending-up-outline',
    prompt: 'How does your best self manage money, decisions, and long-term security?',
    placeholder: 'Describe your relationship with money, financial habits, investment mindset, and approach to abundance...',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    lightBackground: '#FFFBEB',
  },
  time: {
    title: 'Time Wealth',
    icon: 'time-outline',
    prompt: 'How does your best self use and protect their time?',
    placeholder: 'Describe how you prioritize, set boundaries, create space for what matters, and balance work with life...',
    color: '#6366F1',
    backgroundColor: '#E0E7FF',
    lightBackground: '#EEF2FF',
  },
};

interface WealthAccordionCardProps {
  type: WealthType;
  value: string;
  onChangeText: (text: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const WealthAccordionCard: React.FC<WealthAccordionCardProps> = ({
  type,
  value,
  onChangeText,
  isExpanded,
  onToggle,
}) => {
  const config = WEALTH_CONFIGS[type];

  // Animation values
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  const contentOpacity = heightAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: isExpanded ? config.lightBackground : '#FFFFFF',
          borderColor: isExpanded ? config.color + '30' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: config.backgroundColor },
          ]}
        >
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>

        {/* Title and short description */}
        <View style={styles.headerContent}>
          <Text style={styles.title}>{config.title}</Text>
          {!isExpanded && (
            <Text style={styles.shortDescription} numberOfLines={1}>
              {value ? 'Tap to edit your vision' : 'Tap to define your vision'}
            </Text>
          )}
        </View>

        {/* Expand/Collapse indicator */}
        <Animated.View
          style={[
            styles.chevronContainer,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </Animated.View>

        {/* Filled indicator dot */}
        {value.length > 0 && !isExpanded && (
          <View style={[styles.filledDot, { backgroundColor: config.color }]} />
        )}
      </TouchableOpacity>

      {/* Expandable Content */}
      <Animated.View
        style={[
          styles.expandableContent,
          {
            maxHeight: maxHeight,
            opacity: contentOpacity,
          },
        ]}
      >
        {/* Prompt */}
        <Text style={[styles.prompt, { color: config.color }]}>
          {config.prompt}
        </Text>

        {/* Text Area */}
        <View
          style={[
            styles.textAreaContainer,
            { borderColor: config.color + '40' },
          ]}
        >
          <TextInput
            style={styles.textArea}
            multiline
            placeholder={config.placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            textAlignVertical="top"
          />
        </View>

        {/* Character count hint */}
        <Text style={styles.characterHint}>
          {value.length > 0 ? `${value.length} characters` : 'Start writing...'}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  shortDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledDot: {
    position: 'absolute',
    top: 16,
    right: 58,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  prompt: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  textAreaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  textArea: {
    minHeight: 120,
    padding: 14,
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 22,
  },
  characterHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default WealthAccordionCard;
