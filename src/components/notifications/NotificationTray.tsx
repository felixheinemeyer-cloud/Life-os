import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Notification } from '../../types/notifications';
import NotificationItem from './NotificationItem';

interface NotificationTrayProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onNotificationPress: (notification: Notification) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRAY_HEIGHT = SCREEN_HEIGHT * 0.75;

const NotificationTray: React.FC<NotificationTrayProps> = ({
  visible,
  notifications,
  onClose,
  onNotificationPress,
  onDismiss,
  onClearAll,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(TRAY_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Open/close animations
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: TRAY_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Group notifications by time
  const groupNotifications = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: { title: string; items: Notification[] }[] = [
      { title: 'Today', items: [] },
      { title: 'Yesterday', items: [] },
      { title: 'This Week', items: [] },
      { title: 'Earlier', items: [] },
    ];

    notifications.forEach(n => {
      const date = new Date(n.createdAt);
      if (date >= today) {
        groups[0].items.push(n);
      } else if (date >= yesterday) {
        groups[1].items.push(n);
      } else if (date >= weekAgo) {
        groups[2].items.push(n);
      } else {
        groups[3].items.push(n);
      }
    });

    // Filter out empty groups
    return groups.filter(g => g.items.length > 0);
  };

  const groupedNotifications = groupNotifications();
  const hasNotifications = notifications.length > 0;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Tray */}
      <Animated.View
        style={[
          styles.tray,
          {
            height: TRAY_HEIGHT,
            paddingBottom: insets.bottom,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Handle */}
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {hasNotifications && (
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClearAll();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {hasNotifications ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {groupedNotifications.map((group, groupIndex) => (
              <View key={group.title} style={groupIndex > 0 ? styles.groupSpacing : undefined}>
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionLine} />
                  <Text style={styles.sectionTitle}>{group.title}</Text>
                  <View style={styles.sectionLine} />
                </View>

                {/* Notification Items */}
                {group.items.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onPress={() => onNotificationPress(notification)}
                    onDismiss={() => onDismiss(notification.id)}
                  />
                ))}
              </View>
            ))}

            {/* Bottom hint */}
            <View style={styles.bottomHint}>
              <Ionicons name="arrow-back" size={14} color="#9CA3AF" />
              <Text style={styles.bottomHintText}>Swipe left to dismiss</Text>
            </View>
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
                <Ionicons name="notifications-outline" size={32} color="#6366F1" />
              </View>
            </LinearGradient>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              You have no new notifications.
            </Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tray: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F0EEE8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  groupSpacing: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E1DB',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.3,
    paddingHorizontal: 12,
  },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    opacity: 0.6,
  },
  bottomHintText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 6,
  },
});

export default NotificationTray;
