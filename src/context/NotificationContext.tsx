import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification, Contact } from '../types/notifications';
import {
  generateContactNotifications,
  sortByPriority,
  getBannerNotification,
  isSnoozedExpired,
  getSnoozeTime,
} from '../utils/notificationUtils';

interface NotificationState {
  notifications: Notification[];
  bannerNotification: Notification | null;
  unreadCount: number;
}

interface NotificationContextType {
  notifications: Notification[];
  bannerNotification: Notification | null;
  unreadCount: number;
  isLoading: boolean;
  dismiss: (id: string) => void;
  snooze: (id: string, option: 'later' | 'tomorrow' | 'week') => void;
  markAsRead: (id: string) => void;
  markAsActioned: (id: string) => void;
  refreshNotifications: (contacts: Contact[]) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = '@life_os_notifications';
const DISMISSED_KEY = '@life_os_dismissed_notifications';
const SNOOZED_KEY = '@life_os_snoozed_notifications';

// Mock contacts for initial development - will be replaced with actual data
const MOCK_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    initials: 'AT',
    category: 'Close Friend',
    dateOfBirth: (() => {
      // Set birthday to today for testing
      const today = new Date();
      return `1995-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    })(),
  },
  {
    id: '2',
    name: 'Maria Garcia',
    initials: 'MG',
    category: 'Family',
    contactAgainDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days overdue
  },
  {
    id: '3',
    name: 'Sophie Chen',
    initials: 'SC',
    category: 'Close Friend',
    contactAgainDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
  },
  {
    id: '4',
    name: 'David Kim',
    initials: 'DK',
    category: 'Work',
    contactAgainDate: new Date().toISOString(), // Due today
  },
];

// Mock notifications for UI demonstration
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'mock-birthday-1',
    type: 'birthday',
    priority: 'high',
    title: 'Birthday Today',
    subtitle: 'Birthday today!',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    isRead: false,
    isDismissed: false,
    metadata: { contactId: '1', contactName: 'Alex Thompson' },
  },
  {
    id: 'mock-reminder-1',
    type: 'contact_reminder',
    priority: 'high',
    title: 'Reach out to Maria Garcia',
    subtitle: 'Reach out 4 days overdue',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    isRead: false,
    isDismissed: false,
    metadata: { contactId: '2', contactName: 'Maria Garcia', isOverdue: true },
  },
  {
    id: 'mock-achievement-1',
    type: 'achievement',
    priority: 'medium',
    title: '7-Day Streak!',
    subtitle: 'You completed morning check-in 7 days in a row',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: true,
    isDismissed: false,
    metadata: { achievementType: 'streak' },
  },
  {
    id: 'mock-insight-1',
    type: 'insight',
    priority: 'medium',
    title: 'Weekly Insight',
    subtitle: 'Your energy levels are highest on Tuesdays',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    isRead: true,
    isDismissed: false,
    metadata: { insightId: 'energy-pattern' },
  },
  {
    id: 'mock-reminder-2',
    type: 'contact_reminder',
    priority: 'high',
    title: 'Reach out to David Kim',
    subtitle: 'Reach out today',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isRead: false,
    isDismissed: false,
    metadata: { contactId: '4', contactName: 'David Kim' },
  },
  {
    id: 'mock-announcement-1',
    type: 'announcement',
    priority: 'low',
    title: 'New Feature Available',
    subtitle: 'Try the new evening reflection prompts',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
    isDismissed: false,
    metadata: { actionUrl: '/settings/features' },
  },
  {
    id: 'mock-insight-2',
    type: 'insight',
    priority: 'low',
    title: 'Monthly Reflection',
    subtitle: 'Your satisfaction improved 15% last month',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    isRead: true,
    isDismissed: false,
    metadata: { insightId: 'monthly-satisfaction' },
  },
  {
    id: 'mock-achievement-2',
    type: 'achievement',
    priority: 'low',
    title: '30-Day Milestone',
    subtitle: 'You completed your first month of tracking!',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    isRead: true,
    isDismissed: false,
    metadata: { achievementType: 'milestone' },
  },
];

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [snoozedMap, setSnoozedMap] = useState<Record<string, Date>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load dismissed and snoozed state from storage
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const [dismissedJson, snoozedJson] = await Promise.all([
          AsyncStorage.getItem(DISMISSED_KEY),
          AsyncStorage.getItem(SNOOZED_KEY),
        ]);

        if (dismissedJson) {
          const dismissed = JSON.parse(dismissedJson) as string[];
          setDismissedIds(new Set(dismissed));
        }

        if (snoozedJson) {
          const snoozed = JSON.parse(snoozedJson) as Record<string, string>;
          const snoozedDates: Record<string, Date> = {};
          Object.entries(snoozed).forEach(([id, dateStr]) => {
            snoozedDates[id] = new Date(dateStr);
          });
          setSnoozedMap(snoozedDates);
        }
      } catch (error) {
        console.error('Error loading notification state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedState();
  }, []);

  // Generate notifications from contacts
  const refreshNotifications = useCallback((contacts: Contact[]) => {
    const generated = generateContactNotifications(contacts);

    // Apply dismissed and snoozed state
    const withState = generated.map(notif => ({
      ...notif,
      isDismissed: dismissedIds.has(notif.id),
      snoozedUntil: snoozedMap[notif.id],
    }));

    // Filter out expired snoozes
    const active = withState.filter(n => {
      if (n.snoozedUntil && !isSnoozedExpired(n)) {
        return false; // Still snoozed, don't show
      }
      return true;
    });

    setNotifications(sortByPriority(active));
  }, [dismissedIds, snoozedMap]);

  // Initial load with mock notifications for demonstration
  useEffect(() => {
    if (!isLoading) {
      // Use mock notifications directly for UI demonstration
      setNotifications(MOCK_NOTIFICATIONS);
      // Uncomment below to use generated notifications from contacts instead:
      // refreshNotifications(MOCK_CONTACTS);
    }
  }, [isLoading]);

  // Save dismissed IDs to storage
  const saveDismissed = async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
    } catch (error) {
      console.error('Error saving dismissed state:', error);
    }
  };

  // Save snoozed map to storage
  const saveSnoozed = async (map: Record<string, Date>) => {
    try {
      const serialized: Record<string, string> = {};
      Object.entries(map).forEach(([id, date]) => {
        serialized[id] = date.toISOString();
      });
      await AsyncStorage.setItem(SNOOZED_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Error saving snoozed state:', error);
    }
  };

  // Dismiss a notification
  const dismiss = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isDismissed: true } : n))
    );

    setDismissedIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      saveDismissed(newSet);
      return newSet;
    });
  }, []);

  // Snooze a notification
  const snooze = useCallback((id: string, option: 'later' | 'tomorrow' | 'week') => {
    const snoozeUntil = getSnoozeTime(option);

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, snoozedUntil: snoozeUntil } : n))
    );

    setSnoozedMap(prev => {
      const newMap = { ...prev, [id]: snoozeUntil };
      saveSnoozed(newMap);
      return newMap;
    });
  }, []);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  // Mark as actioned (completed the action, e.g., sent birthday wishes)
  const markAsActioned = useCallback((id: string) => {
    dismiss(id);
  }, [dismiss]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    const allIds = new Set(notifications.map(n => n.id));
    setDismissedIds(allIds);
    await saveDismissed(allIds);
    setNotifications(prev => prev.map(n => ({ ...n, isDismissed: true })));
  }, [notifications]);

  // Calculate derived state
  const activeNotifications = notifications.filter(n => !n.isDismissed && isSnoozedExpired(n));
  const bannerNotification = getBannerNotification(activeNotifications);
  const unreadCount = activeNotifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: activeNotifications,
        bannerNotification,
        unreadCount,
        isLoading,
        dismiss,
        snooze,
        markAsRead,
        markAsActioned,
        refreshNotifications,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
