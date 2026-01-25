import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Notification } from '../../types/notifications';

interface ContactNotificationBannerProps {
  notification: Notification;
  onDismiss: () => void;
  onAction: () => void;
}

// Configuration for different notification types
// All use white backgrounds for consistency with check-in cards
// Colored rings differentiate the notification type
const NOTIFICATION_STYLES = {
  birthday: {
    ringColors: ['#FBBF24', '#F59E0B', '#EA580C'] as const,
    badgeColors: ['#F472B6', '#EC4899'] as const,
    initialsColor: '#EA580C',
    subtitleColor: '#EA580C',
  },
  reminder: {
    ringColors: ['#FDE68A', '#FBBF24', '#F59E0B'] as const,
    badgeColors: ['#FBBF24', '#F59E0B'] as const,
    initialsColor: '#D97706',
    subtitleColor: '#D97706',
  },
};

const ContactNotificationBanner: React.FC<ContactNotificationBannerProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  // Determine notification style based on type
  const getStyleKey = (): keyof typeof NOTIFICATION_STYLES => {
    if (notification.type === 'birthday') return 'birthday';
    return 'reminder';
  };

  const styleKey = getStyleKey();
  const styles_config = NOTIFICATION_STYLES[styleKey];

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Dismiss with animation
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -8,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  // Handle card press
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction();
  };

  // Get contact name and initials
  const contactName = notification.metadata?.contactName || notification.title;
  const initials = contactName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get subtitle based on notification type
  const getSubtitle = (): string => {
    if (notification.type === 'birthday') {
      return 'Birthday today!';
    }
    return notification.subtitle || '';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        {/* Avatar with badge */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[...styles_config.ringColors]}
            style={styles.avatarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarInner}>
              <Text style={[styles.avatarText, { color: styles_config.initialsColor }]}>
                {initials}
              </Text>
            </View>
          </LinearGradient>
          {/* Gift badge - only for birthdays */}
          {notification.type === 'birthday' && (
            <LinearGradient
              colors={[...styles_config.badgeColors]}
              style={styles.typeBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="gift" size={10} color="#FFFFFF" />
            </LinearGradient>
          )}
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {contactName}
          </Text>
          <Text style={[styles.subtitle, { color: styles_config.subtitleColor }]}>
            {getSubtitle()}
          </Text>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  typeBadge: {
    position: 'absolute',
    bottom: -1,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactNotificationBanner;
