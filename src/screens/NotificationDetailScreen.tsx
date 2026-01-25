import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface NotificationDetailScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params: {
      notification: {
        id: string;
        type: string;
        title: string;
        subtitle?: string;
        createdAt: Date;
        metadata?: Record<string, any>;
      };
    };
  };
}

// Gradient colors for different notification types
const NOTIFICATION_GRADIENTS: Record<string, readonly [string, string, string]> = {
  insight: ['#C4B5FD', '#A78BFA', '#8B5CF6'],
  achievement: ['#6EE7B7', '#34D399', '#10B981'],
  announcement: ['#93C5FD', '#60A5FA', '#3B82F6'],
};

// Icons for different notification types
const NOTIFICATION_ICONS: Record<string, string> = {
  insight: 'bulb',
  achievement: 'trophy',
  announcement: 'megaphone',
};

// Accent colors for different notification types
const NOTIFICATION_COLORS: Record<string, string> = {
  insight: '#8B5CF6',
  achievement: '#10B981',
  announcement: '#3B82F6',
};

const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { notification } = route.params;

  const gradientColors = NOTIFICATION_GRADIENTS[notification.type] || NOTIFICATION_GRADIENTS.announcement;
  const iconName = NOTIFICATION_ICONS[notification.type] || 'notifications';
  const accentColor = NOTIFICATION_COLORS[notification.type] || '#3B82F6';

  const formattedDate = notification.createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {notification.type === 'achievement' ? 'Achievement' :
             notification.type === 'insight' ? 'Insight' : 'Notification'}
          </Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon with gradient ring */}
        <LinearGradient
          colors={[...gradientColors]}
          style={styles.iconGradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconInner}>
            <Ionicons
              name={iconName as keyof typeof Ionicons.glyphMap}
              size={48}
              color={accentColor}
            />
          </View>
        </LinearGradient>

        {/* Title */}
        <Text style={styles.title}>{notification.title}</Text>

        {/* Subtitle */}
        {notification.subtitle && (
          <Text style={styles.subtitle}>{notification.subtitle}</Text>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>{formattedDate}</Text>

        {/* Placeholder content area */}
        <View style={styles.placeholderArea}>
          <View style={styles.placeholderCard}>
            <Ionicons name="construct-outline" size={24} color="#9CA3AF" />
            <Text style={styles.placeholderText}>
              More details coming soon
            </Text>
            <Text style={styles.placeholderSubtext}>
              This area will show additional context, charts, and actionable insights in a future update.
            </Text>
          </View>
        </View>
      </View>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconGradientRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 28,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  timestamp: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
  placeholderArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default NotificationDetailScreen;
