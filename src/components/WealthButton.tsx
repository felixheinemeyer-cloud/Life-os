import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type WealthType = 'physical' | 'mental' | 'social' | 'financial' | 'time';

interface WealthConfig {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  color: string;
  backgroundColor: string;
}

export const WEALTH_CONFIGS: Record<WealthType, WealthConfig> = {
  physical: {
    title: 'Physical Wealth',
    icon: 'fitness-outline',
    description: 'How does your best self take care of their body, energy, and health?',
    color: '#059669',
    backgroundColor: '#D1FAE5',
  },
  mental: {
    title: 'Mental Wealth',
    icon: 'bulb-outline',
    description: 'How does your best self think, handle stress, and stay resilient?',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  social: {
    title: 'Social Wealth',
    icon: 'people-outline',
    description: 'How does your best self show up in relationships and community?',
    color: '#8B5CF6',
    backgroundColor: '#EDE9FE',
  },
  financial: {
    title: 'Financial Wealth',
    icon: 'trending-up-outline',
    description: 'How does your best self manage money, decisions, and long-term security?',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  time: {
    title: 'Time Wealth',
    icon: 'time-outline',
    description: 'How does your best self use and protect their time?',
    color: '#6366F1',
    backgroundColor: '#E0E7FF',
  },
};

interface WealthButtonProps {
  type: WealthType;
  isCompleted?: boolean;
  onPress: () => void;
}

const WealthButton: React.FC<WealthButtonProps> = ({
  type,
  isCompleted = false,
  onPress,
}) => {
  const config = WEALTH_CONFIGS[type];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: config.backgroundColor },
          ]}
        >
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>

        {/* Right side: Completed check or Chevron */}
        {isCompleted ? (
          <View style={[styles.completedBadge, { backgroundColor: config.color }]}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WealthButton;
