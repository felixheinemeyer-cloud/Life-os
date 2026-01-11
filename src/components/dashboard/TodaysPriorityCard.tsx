import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PriorityStatus = 'pending' | 'completed' | 'not_completed';

interface TodaysPriorityCardProps {
  priority: string;
  morningCheckInCompleted: boolean;
  status?: PriorityStatus;
}

const TodaysPriorityCard: React.FC<TodaysPriorityCardProps> = ({
  priority,
  morningCheckInCompleted,
  status = 'pending',
}) => {
  // Don't render if morning check-in not completed
  if (!morningCheckInCompleted) {
    return null;
  }

  // Configuration based on status
  const statusConfig = {
    pending: {
      icon: 'flag' as const,
      iconColor: '#D97706',
      borderColor: '#D97706',
      label: "Today's Priority",
      labelColor: '#D97706',
      textStyle: styles.priorityText,
    },
    completed: {
      icon: 'checkmark-circle' as const,
      iconColor: '#059669',
      borderColor: '#10B981',
      label: 'Priority Completed',
      labelColor: '#059669',
      textStyle: styles.priorityTextCompleted,
    },
    not_completed: {
      icon: 'flag-outline' as const,
      iconColor: '#9CA3AF',
      borderColor: '#D1D5DB',
      label: "Today's Priority",
      labelColor: '#9CA3AF',
      textStyle: styles.priorityTextNotCompleted,
    },
  };

  const config = statusConfig[status];

  return (
    <View style={[
      styles.card,
      { borderLeftColor: config.borderColor },
      status === 'completed' && styles.cardCompleted,
      status === 'not_completed' && styles.cardNotCompleted,
    ]}>
      {/* Header with Icon and Label */}
      <View style={styles.header}>
        <Ionicons name={config.icon} size={14} color={config.iconColor} />
        <Text style={[styles.label, { color: config.labelColor }]}>
          {config.label}
        </Text>
        {status === 'not_completed' && (
          <View style={styles.notCompletedBadge}>
            <Text style={styles.notCompletedText}>Not completed</Text>
          </View>
        )}
      </View>

      {/* Priority Text - Full, no truncation */}
      <Text style={config.textStyle}>
        {priority}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: '#F0FDF4',
    shadowColor: '#10B981',
    shadowOpacity: 0.12,
  },
  cardNotCompleted: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  completedBadge: {
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  notCompletedBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  notCompletedText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  priorityText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  priorityTextCompleted: {
    fontSize: 15,
    fontWeight: '500',
    color: '#065F46',
    lineHeight: 22,
    letterSpacing: -0.2,
    textDecorationLine: 'line-through',
    textDecorationColor: '#10B981',
  },
  priorityTextNotCompleted: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
});

export default TodaysPriorityCard;
