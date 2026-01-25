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
import * as Haptics from 'expo-haptics';
import { Notification, NOTIFICATION_CONFIGS } from '../../../types/notifications';

interface PriorityBannerProps {
  notification: Notification;
  onDismiss: () => void;
  onSnooze: () => void;
  onAction: () => void;
}

const PriorityBanner: React.FC<PriorityBannerProps> = ({
  notification,
  onDismiss,
  onSnooze,
  onAction,
}) => {
  // Animation values
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  // Get config based on notification type
  const getConfig = () => {
    return NOTIFICATION_CONFIGS[notification.type];
  };

  const config = getConfig();

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

  // Get background tint color (very subtle)
  const getBackgroundTint = () => {
    switch (notification.type) {
      case 'birthday':
        return '#FFFBFC';
      case 'contact_reminder':
        return '#FFFDFB';
      case 'insight':
        return '#FCFBFF';
      case 'achievement':
        return '#FBFEFC';
      case 'announcement':
        return '#FBFBFF';
      default:
        return '#FFFFFF';
    }
  };

  // Get icon background color (soft, not gradient)
  const getIconBackground = () => {
    switch (notification.type) {
      case 'birthday':
        return '#FDF2F8';
      case 'contact_reminder':
        return '#FEF9EE';
      case 'insight':
        return '#F5F3FF';
      case 'achievement':
        return '#ECFDF5';
      case 'announcement':
        return '#EEF2FF';
      default:
        return '#F3F4F6';
    }
  };

  // Get label text
  const getLabel = () => {
    switch (notification.type) {
      case 'birthday':
        return 'Birthday';
      case 'contact_reminder':
        return 'Reminder';
      case 'insight':
        return 'Insight';
      case 'achievement':
        return 'Achievement';
      case 'announcement':
        return 'New';
      default:
        return 'Alert';
    }
  };

  // Get title text (contact name for birthday/reminder)
  const getTitle = () => {
    if (notification.type === 'birthday' && notification.metadata?.contactName) {
      return notification.metadata.contactName;
    }
    if (notification.type === 'contact_reminder' && notification.metadata?.contactName) {
      return notification.metadata.contactName;
    }
    return notification.title;
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
        style={[
          styles.card,
          { backgroundColor: getBackgroundTint() },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Icon (smaller, no gradient ring) */}
        <View style={[styles.iconCircle, { backgroundColor: getIconBackground() }]}>
          <Ionicons
            name={config.icon as any}
            size={20}
            color={config.accentColor}
          />
        </View>

        {/* Text content */}
        <View style={styles.textContainer}>
          {/* Label + Title row */}
          <View style={styles.titleRow}>
            <View style={[styles.label, { backgroundColor: config.accentColor + '18' }]}>
              <Text style={[styles.labelText, { color: config.accentColor }]}>
                {getLabel()}
              </Text>
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {getTitle()}
            </Text>
          </View>
          {/* Subtitle */}
          <Text style={styles.subtitle} numberOfLines={1}>
            {notification.subtitle}
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
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  label: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PriorityBanner;
