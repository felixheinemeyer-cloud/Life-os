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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Notification, NOTIFICATION_CONFIGS } from '../../types/notifications';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DISMISS_THRESHOLD = -100;

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDismiss,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemHeight = useRef(new Animated.Value(88)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const isDismissing = useRef(false);

  // Get config based on notification type
  const getConfig = () => {
    return NOTIFICATION_CONFIGS[notification.type];
  };

  const config = getConfig();

  // Get gradient colors for icon ring
  const getGradientColors = (): [string, string, string] => {
    switch (notification.type) {
      case 'birthday':
        return ['#FBBF24', '#F59E0B', '#EA580C'];
      case 'contact_reminder':
        return ['#FDE68A', '#FBBF24', '#F59E0B'];
      case 'insight':
        return ['#C4B5FD', '#A78BFA', '#8B5CF6'];
      case 'achievement':
        return ['#6EE7B7', '#34D399', '#10B981'];
      case 'announcement':
        return ['#93C5FD', '#60A5FA', '#3B82F6'];
      default:
        return ['#E5E7EB', '#D1D5DB', '#9CA3AF'];
    }
  };

  // Format relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
      Animated.timing(itemHeight, {
        toValue: 0,
        duration: 200,
        delay: 100,
        useNativeDriver: false,
      }),
      Animated.timing(itemOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [onDismiss, translateX, itemHeight, itemOpacity]);

  // Spring back animation helper
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
        // Only capture horizontal swipes (left) with enough movement
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
      // Handle when gesture is terminated by another responder (e.g., scroll)
      onPanResponderTerminate: () => {
        springBack();
      },
      // Allow termination when user isn't actively swiping far
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
        styles.swipeContainer,
        {
          height: itemHeight,
          opacity: itemOpacity,
        },
      ]}
    >
      {/* Dismiss action */}
      <Animated.View style={[styles.dismissAction, { opacity: dismissOpacity }]}>
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
      </Animated.View>

      {/* Swipeable content */}
      <Animated.View
        style={[styles.itemWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[
            styles.container,
            !notification.isRead && styles.unread,
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {/* Icon with gradient ring */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={getGradientColors()}
              style={styles.iconRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInner}>
                <Ionicons
                  name={config.icon as any}
                  size={20}
                  color={config.accentColor}
                />
              </View>
            </LinearGradient>
            {/* Unread indicator on avatar */}
            {!notification.isRead && (
              <View style={[styles.unreadBadge, { backgroundColor: config.accentColor }]} />
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.title}
            </Text>
            {notification.subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {notification.subtitle}
              </Text>
            )}
          </View>

          {/* Time & chevron */}
          <View style={styles.rightSection}>
            <Text style={styles.time}>
              {getRelativeTime(notification.createdAt)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: 2,
    overflow: 'hidden',
  },
  dismissAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 2,
    width: 80,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemWrapper: {
    backgroundColor: '#F0EEE8',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 2,
  },
  unread: {
    backgroundColor: '#FFFCF5',
  },
  iconContainer: {
    position: 'relative',
  },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});

export default NotificationItem;
