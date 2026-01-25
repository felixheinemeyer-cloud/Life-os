import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '../context/NotificationContext';
import { Notification, NOTIFICATION_CONFIGS, BannerConfig } from '../types/notifications';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DISMISS_THRESHOLD = -80;

interface NotificationsScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

// Gradient colors matching the dashboard notification components
const NOTIFICATION_GRADIENTS: Record<string, readonly [string, string, string]> = {
  birthday: ['#FBBF24', '#F59E0B', '#EA580C'],
  contact_reminder: ['#FDE68A', '#FBBF24', '#F59E0B'],
  insight: ['#C4B5FD', '#A78BFA', '#8B5CF6'],
  achievement: ['#6EE7B7', '#34D399', '#10B981'],
  announcement: ['#93C5FD', '#60A5FA', '#3B82F6'],
};

// Card-based notification item component (matches dashboard style)
interface NotificationItemProps {
  notification: Notification;
  config: BannerConfig;
  gradientColors: readonly [string, string, string];
  onPress: () => void;
  onDismiss: () => void;
  getRelativeTime: (date: Date) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  config,
  gradientColors,
  onPress,
  onDismiss,
  getRelativeTime,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const itemHeight = useRef(new Animated.Value(80)).current; // Card height (72px) + margin (8px)
  const isDismissing = useRef(false);
  const isUnread = !notification.isRead;

  // Get contact info for contact-related notifications
  const isContactNotification = notification.type === 'birthday' || notification.type === 'contact_reminder';
  const contactName = notification.metadata?.contactName || notification.title;
  const initials = contactName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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

  // Get subtitle text based on notification type
  const getSubtitleText = () => {
    if (notification.type === 'birthday') {
      return notification.subtitle || 'Birthday today!';
    }
    return notification.subtitle || '';
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: itemOpacity,
          height: itemHeight,
        },
      ]}
    >
      {/* Dismiss action behind card */}
      <Animated.View
        style={[
          styles.dismissAction,
          { opacity: dismissOpacity },
        ]}
      >
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
          {/* Accent bar - vibrant for unread, muted for read */}
          <View style={[
            styles.accentBar,
            { backgroundColor: config.accentColor },
            !isUnread && styles.accentBarRead
          ]} />

          {/* Card content */}
          <View style={styles.cardContent}>
            {/* Avatar/Icon - muted for read items */}
            {isContactNotification ? (
              <View style={[
                styles.avatar,
                { backgroundColor: isUnread ? `${config.accentColor}18` : `${config.accentColor}12` }
              ]}>
                <Text style={[
                  styles.avatarText,
                  { color: config.accentColor },
                  !isUnread && styles.avatarTextRead
                ]}>
                  {initials}
                </Text>
              </View>
            ) : (
              <View style={[styles.iconContainer, !isUnread && styles.iconContainerRead]}>
                <LinearGradient
                  colors={[...gradientColors]}
                  style={styles.iconGradientRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.iconInner}>
                    <Ionicons
                      name={config.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={config.accentColor}
                    />
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Text content */}
            <View style={styles.textContent}>
              <Text
                style={[styles.cardTitle, isUnread ? styles.cardTitleUnread : styles.cardTitleRead]}
                numberOfLines={1}
              >
                {isContactNotification ? contactName : notification.title}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  isUnread
                    ? { color: config.accentColor }
                    : { color: config.accentColor, opacity: 0.6 }
                ]}
                numberOfLines={1}
              >
                {getSubtitleText()}
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

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { notifications, dismiss, markAsRead } = useNotifications();

  // Group notifications by time period with specific dates for older items
  const groupNotifications = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Map to collect groups by date key
    const groupsMap = new Map<string, { title: string; items: Notification[]; sortKey: number }>();

    // Initialize Today and Yesterday
    groupsMap.set('today', { title: 'Today', items: [], sortKey: Date.now() });
    groupsMap.set('yesterday', { title: 'Yesterday', items: [], sortKey: yesterday.getTime() });

    notifications.forEach(n => {
      const date = new Date(n.createdAt);
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (dateStart >= today) {
        groupsMap.get('today')!.items.push(n);
      } else if (dateStart >= yesterday) {
        groupsMap.get('yesterday')!.items.push(n);
      } else {
        // Use specific date as key
        const dateKey = dateStart.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!groupsMap.has(dateKey)) {
          // Format: "January 22" or "January 22, 2024" if different year
          const isCurrentYear = date.getFullYear() === now.getFullYear();
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            ...(isCurrentYear ? {} : { year: 'numeric' }),
          });
          groupsMap.set(dateKey, { title: formattedDate, items: [], sortKey: dateStart.getTime() });
        }
        groupsMap.get(dateKey)!.items.push(n);
      }
    });

    // Convert to array, filter empty groups, and sort by date (newest first)
    return Array.from(groupsMap.values())
      .filter(g => g.items.length > 0)
      .sort((a, b) => b.sortKey - a.sortKey)
      .map(({ title, items }) => ({ title, items }));
  };

  const groupedNotifications = groupNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Get config for notification type
  const getConfig = (notification: Notification): BannerConfig => {
    return NOTIFICATION_CONFIGS[notification.type];
  };

  // Get gradient colors based on notification type
  const getGradientColors = (notification: Notification): readonly [string, string, string] => {
    return NOTIFICATION_GRADIENTS[notification.type] || NOTIFICATION_GRADIENTS.announcement;
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

  const handleNotificationPress = (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.type === 'birthday' || notification.type === 'contact_reminder') {
      // Contact notifications → Navigate to ContactDetail within the same stack
      const contactName = notification.metadata?.contactName || 'Unknown';
      const contactId = notification.metadata?.contactId || '';

      // Create a mock contact object for the ContactDetailScreen
      const contact = {
        id: contactId,
        name: contactName,
        initials: contactName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        category: 'Friend', // Default category
      };

      // Navigate within DashboardStack so back button works
      navigation.navigate('ContactDetail', { contact });
    } else if (notification.type === 'insight' || notification.type === 'achievement') {
      // Insight/Achievement → Navigate to NotificationDetail
      navigation.navigate('NotificationDetail', { notification });
    } else if (notification.type === 'announcement') {
      // Announcement → Do nothing for now (future: navigate to the feature)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handleDismiss = (id: string) => {
    dismiss(id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
        </TouchableOpacity>

        <View style={styles.headerCenter} pointerEvents="none">
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          )}
        </View>
      </View>

      {/* Content */}
      {notifications.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {groupedNotifications.map((group, groupIndex) => (
            <View key={group.title} style={groupIndex > 0 ? styles.groupSpacing : undefined}>
              {/* Section Header - clean left-aligned */}
              <Text style={styles.sectionTitle}>{group.title}</Text>

              {/* Individual notification cards */}
              <View style={styles.cardsList}>
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    config={getConfig(notification)}
                    gradientColors={getGradientColors(notification)}
                    onPress={() => handleNotificationPress(notification)}
                    onDismiss={() => handleDismiss(notification.id)}
                    getRelativeTime={getRelativeTime}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
            style={styles.emptyIconRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.emptyIconInner}>
              <Ionicons name="checkmark-done" size={36} color="#6366F1" />
            </View>
          </LinearGradient>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            You have no notifications right now.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
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
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  groupSpacing: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: -0.1,
    marginBottom: 10,
    marginLeft: 4,
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
    bottom: 8,
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
    bottom: 8,
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
  accentBarRead: {
    opacity: 0.55,
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
  avatarTextRead: {
    opacity: 0.75,
  },
  iconContainer: {
    // Wrapper for gradient icon - full opacity for unread
  },
  iconContainerRead: {
    opacity: 0.7,
  },
  iconGradientRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  cardTitleRead: {
    fontWeight: '500',
    color: '#6B7280',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 8,
  },
});

export default NotificationsScreen;
