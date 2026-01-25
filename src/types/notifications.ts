// Notification Types for Life-os Dashboard

export type NotificationType =
  | 'birthday'
  | 'contact_reminder'
  | 'insight'
  | 'achievement'
  | 'announcement';

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  subtitle?: string;
  createdAt: Date;
  isRead: boolean;
  isDismissed: boolean;
  snoozedUntil?: Date;
  metadata?: {
    contactId?: string;
    contactName?: string;
    insightId?: string;
    achievementType?: string;
    actionUrl?: string;
    isOverdue?: boolean;
  };
}

// Contact interface (matches PeopleCRMScreen)
export interface Contact {
  id: string;
  name: string;
  initials: string;
  category: string;
  phoneNumber?: string;
  email?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  contactAgainDate?: string;
  reminderStatus?: 'none' | 'future' | 'soon' | 'overdue';
  notes?: { id: string; text: string; createdAt: string }[];
}

// Priority banner configuration for each notification type
export interface BannerConfig {
  accentColor: string;
  backgroundColor: string;
  icon: string;
  label: string;
  labelColor: string;
}

export const NOTIFICATION_CONFIGS: Record<NotificationType, BannerConfig> = {
  birthday: {
    accentColor: '#EC4899',
    backgroundColor: '#FDF2F8',
    icon: 'gift',
    label: 'BIRTHDAY TODAY',
    labelColor: '#BE185D',
  },
  contact_reminder: {
    accentColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    icon: 'notifications',
    label: 'STAY IN TOUCH',
    labelColor: '#D97706',
  },
  insight: {
    accentColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    icon: 'bulb-outline',
    label: 'INSIGHT',
    labelColor: '#7C3AED',
  },
  achievement: {
    accentColor: '#10B981',
    backgroundColor: '#D1FAE5',
    icon: 'trophy',
    label: 'ACHIEVEMENT',
    labelColor: '#059669',
  },
  announcement: {
    accentColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    icon: 'megaphone',
    label: 'ANNOUNCEMENT',
    labelColor: '#4F46E5',
  },
};

