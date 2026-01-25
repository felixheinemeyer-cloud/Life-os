// Notification Utility Functions for Life-os

import { Notification, NotificationPriority, Contact } from '../types/notifications';

// Get current date in Berlin timezone (YYYY-MM-DD format)
export const getBerlinDate = (): string => {
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  const year = berlinTime.getFullYear();
  const month = String(berlinTime.getMonth() + 1).padStart(2, '0');
  const day = String(berlinTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get current hour in Berlin timezone
export const getBerlinHour = (): number => {
  const now = new Date();
  const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
  return berlinTime.getHours();
};

// Check if today is the person's birthday (ignores year)
export const isBirthdayToday = (dateOfBirth: string): boolean => {
  const today = new Date();
  const birthday = new Date(dateOfBirth);
  return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
};

// Check if tomorrow is the person's birthday
export const isBirthdayTomorrow = (dateOfBirth: string): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const birthday = new Date(dateOfBirth);
  return tomorrow.getMonth() === birthday.getMonth() && tomorrow.getDate() === birthday.getDate();
};

// Check if birthday is within N days
export const isBirthdayWithinDays = (dateOfBirth: string, days: number): boolean => {
  const today = new Date();
  const birthday = new Date(dateOfBirth);

  // Set birthday to this year
  birthday.setFullYear(today.getFullYear());

  // If birthday already passed this year, check next year
  if (birthday < today) {
    birthday.setFullYear(today.getFullYear() + 1);
  }

  const diffTime = birthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 && diffDays <= days;
};

// Calculate days until contact reminder is due (negative = overdue)
export const getDaysUntilContactReminder = (contactAgainDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(contactAgainDate);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Check if contact reminder is overdue
export const isContactOverdue = (contactAgainDate: string): boolean => {
  return getDaysUntilContactReminder(contactAgainDate) < 0;
};

// Check if contact reminder is due soon (within 3 days)
export const isContactDueSoon = (contactAgainDate: string): boolean => {
  const days = getDaysUntilContactReminder(contactAgainDate);
  return days >= 0 && days <= 3;
};

// Generate birthday notification from contact
export const createBirthdayNotification = (contact: Contact): Notification | null => {
  if (!contact.dateOfBirth) return null;

  let priority: NotificationPriority = 'low';
  let subtitle = '';

  if (isBirthdayToday(contact.dateOfBirth)) {
    priority = 'high';
    subtitle = `${contact.name} is celebrating today!`;
  } else if (isBirthdayTomorrow(contact.dateOfBirth)) {
    priority = 'high';
    subtitle = `${contact.name}'s birthday is tomorrow`;
  } else if (isBirthdayWithinDays(contact.dateOfBirth, 3)) {
    priority = 'medium';
    const birthday = new Date(contact.dateOfBirth);
    const today = new Date();
    birthday.setFullYear(today.getFullYear());
    if (birthday < today) birthday.setFullYear(today.getFullYear() + 1);
    const days = Math.ceil((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    subtitle = `${contact.name}'s birthday is in ${days} days`;
  } else {
    return null; // Not within notification window
  }

  return {
    id: `birthday-${contact.id}`,
    type: 'birthday',
    priority,
    title: isBirthdayToday(contact.dateOfBirth) ? 'Birthday Today' : 'Upcoming Birthday',
    subtitle,
    createdAt: new Date(),
    isRead: false,
    isDismissed: false,
    metadata: {
      contactId: contact.id,
      contactName: contact.name,
    },
  };
};

// Generate contact reminder notification from contact
export const createContactReminderNotification = (contact: Contact): Notification | null => {
  if (!contact.contactAgainDate) return null;

  const daysUntil = getDaysUntilContactReminder(contact.contactAgainDate);
  let priority: NotificationPriority = 'low';
  let subtitle = '';

  if (daysUntil <= -3) {
    // 3+ days overdue
    priority = 'high';
    subtitle = `Reach out ${Math.abs(daysUntil)} days overdue`;
  } else if (daysUntil < 0) {
    // 1-2 days overdue
    priority = 'high';
    subtitle = `Reach out ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'} overdue`;
  } else if (daysUntil === 0) {
    // Due today
    priority = 'high';
    subtitle = 'Reach out today';
  } else if (daysUntil === 1) {
    // Due tomorrow
    priority = 'high';
    subtitle = 'Due tomorrow';
  } else if (daysUntil <= 3) {
    // Due within 3 days
    priority = 'medium';
    subtitle = `Due in ${daysUntil} days`;
  } else if (daysUntil <= 7) {
    // Due within a week
    priority = 'low';
    subtitle = `Due in ${daysUntil} days`;
  } else {
    return null; // Not within notification window
  }

  return {
    id: `reminder-${contact.id}`,
    type: 'contact_reminder',
    priority,
    title: `Reach out to ${contact.name}`,
    subtitle,
    createdAt: new Date(),
    isRead: false,
    isDismissed: false,
    metadata: {
      contactId: contact.id,
      contactName: contact.name,
      isOverdue: daysUntil < 0,
    },
  };
};

// Generate all notifications from contacts list
export const generateContactNotifications = (contacts: Contact[]): Notification[] => {
  const notifications: Notification[] = [];

  contacts.forEach(contact => {
    const birthdayNotif = createBirthdayNotification(contact);
    if (birthdayNotif) notifications.push(birthdayNotif);

    const reminderNotif = createContactReminderNotification(contact);
    if (reminderNotif) notifications.push(reminderNotif);
  });

  return notifications;
};

// Sort notifications by priority
export const sortByPriority = (notifications: Notification[]): Notification[] => {
  const priorityOrder: Record<NotificationPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...notifications].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by type (birthdays first)
    if (a.type === 'birthday' && b.type !== 'birthday') return -1;
    if (b.type === 'birthday' && a.type !== 'birthday') return 1;

    // Then by created date (newest first)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
};

// Get the highest priority notification for the banner
export const getBannerNotification = (notifications: Notification[]): Notification | null => {
  const sorted = sortByPriority(notifications);
  const high = sorted.filter(n => n.priority === 'high' && !n.isDismissed && !n.snoozedUntil);

  if (high.length > 0) return high[0];

  return null;
};

// Check if a snoozed notification should be shown again
export const isSnoozedExpired = (notification: Notification): boolean => {
  if (!notification.snoozedUntil) return true;
  return new Date() >= notification.snoozedUntil;
};

// Get snooze time options
export const getSnoozeTime = (option: 'later' | 'tomorrow' | 'week'): Date => {
  const now = new Date();

  switch (option) {
    case 'later':
      // 3 hours from now
      return new Date(now.getTime() + 3 * 60 * 60 * 1000);
    case 'tomorrow':
      // 9 AM tomorrow (Berlin time)
      const tomorrow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    case 'week':
      // 7 days from now
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 3 * 60 * 60 * 1000);
  }
};
