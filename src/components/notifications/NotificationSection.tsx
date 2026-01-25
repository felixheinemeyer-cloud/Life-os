import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Notification } from '../../types/notifications';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DISMISS_THRESHOLD = -100;

interface NotificationSectionProps {
  notifications: Notification[];
  onNotificationPress: (notification: Notification) => void;
  onDismiss: (id: string) => void;
}

interface ActionCardProps {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
  isLast: boolean;
  accentColor: string;
  contactName: string;
  initials: string;
  subtitle: string;
}

// Action-oriented notification card with swipe-to-dismiss
const ActionCard: React.FC<ActionCardProps> = ({
  onPress,
  onDismiss,
  isLast,
  accentColor,
  contactName,
  initials,
  subtitle,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const itemHeight = useRef(new Animated.Value(72)).current;
  const isDismissing = useRef(false);

  const handleDismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(itemOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(itemHeight, {
        toValue: 0,
        duration: 200,
        delay: 100,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, translateX, itemOpacity, itemHeight]);

  const springBack = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isLeftSwipe = gestureState.dx < -10;
        const isNotVertical = Math.abs(gestureState.dy) < 15;
        return isHorizontalSwipe && isLeftSwipe && isNotVertical;
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < DISMISS_THRESHOLD) {
          handleDismiss();
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: () => {
        springBack();
      },
      onPanResponderTerminationRequest: (_, gestureState) => {
        return gestureState.dx > -50;
      },
    })
  ).current;

  const dismissOpacity = translateX.interpolate({
    inputRange: [-100, -40, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: itemOpacity,
          height: itemHeight,
          marginTop: 12,
        },
      ]}
    >
      {/* Dismiss action - matches NotificationsScreen */}
      <Animated.View style={[styles.dismissAction, { opacity: dismissOpacity }]}>
        <Ionicons name="close" size={22} color="#FFFFFF" />
        <Text style={styles.dismissActionText}>Dismiss</Text>
      </Animated.View>

      {/* Swipeable card */}
      <Animated.View
        style={[styles.cardWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={onPress}
          activeOpacity={0.9}
        >
          {/* Colored accent bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          {/* Content area */}
          <View style={styles.cardContent}>
            {/* Avatar - simple solid background */}
            <View style={[styles.avatar, { backgroundColor: `${accentColor}15` }]}>
              <Text style={[styles.avatarText, { color: accentColor }]}>
                {initials}
              </Text>
            </View>

            {/* Text */}
            <View style={styles.textContent}>
              <Text style={styles.name} numberOfLines={1}>
                {contactName}
              </Text>
              <Text style={[styles.subtitle, { color: accentColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const NotificationSection: React.FC<NotificationSectionProps> = ({
  notifications,
  onNotificationPress,
  onDismiss,
}) => {
  // Only show high priority notifications that are due TODAY (not overdue)
  const visibleNotifications = notifications
    .filter(n => n.priority === 'high' && !n.metadata?.isOverdue);

  if (visibleNotifications.length === 0) {
    return null;
  }

  // Get accent color based on notification type
  const getAccentColor = (notification: Notification) => {
    if (notification.type === 'birthday') return '#EC4899'; // Pink
    return '#F59E0B'; // Amber for reminders
  };

  // Get contact info
  const getContactInfo = (notification: Notification) => {
    const contactName = notification.metadata?.contactName || notification.title;
    const initials = contactName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return { contactName, initials };
  };

  // Get subtitle based on type
  const getSubtitle = (notification: Notification) => {
    if (notification.type === 'birthday') return 'Birthday today!';
    return notification.subtitle || 'Reach out today';
  };

  return (
    <View style={styles.container}>
      {/* Subtle inline label */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>NOTIFICATIONS</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Action Cards */}
      <View style={styles.cardsList}>
        {visibleNotifications.map((notification, index) => {
          const { contactName, initials } = getContactInfo(notification);
          const subtitle = getSubtitle(notification);
          const accentColor = getAccentColor(notification);
          const isLast = index === visibleNotifications.length - 1;

          return (
            <ActionCard
              key={notification.id}
              onPress={() => onNotificationPress(notification)}
              onDismiss={() => onDismiss(notification.id)}
              isLast={isLast}
              accentColor={accentColor}
              contactName={contactName}
              initials={initials}
              subtitle={subtitle}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
  cardsList: {
    gap: 0,
  },
  cardContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  dismissAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 88,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dismissActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default NotificationSection;
