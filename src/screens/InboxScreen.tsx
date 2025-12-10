import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: number;
  subject: string;
  body: string;
  sender: string;
  date: string;
  isRead: boolean;
  type: string;
}

interface InboxScreenProps {
  navigation?: {
    goBack: () => void;
  };
}

const InboxScreen = ({ navigation }: InboxScreenProps): React.JSX.Element => {
  // Mock messages data (Frontend only - no backend integration)
  const [messages] = useState<Message[]>([
    {
      id: 1,
      subject: 'Weekly Progress Summary',
      body: 'Great work this week! You completed 5 out of 7 daily check-ins and maintained a consistent sleep schedule. Keep it up!',
      sender: 'Life OS',
      date: '2 hours ago',
      isRead: false,
      type: 'summary',
    },
    {
      id: 2,
      subject: 'Reflection Reminder',
      body: "Don't forget to complete your weekly reflection. It's a great way to track your progress and set intentions for the week ahead.",
      sender: 'Life OS',
      date: '5 hours ago',
      isRead: false,
      type: 'reminder',
    },
    {
      id: 3,
      subject: 'New Insight Available',
      body: 'Based on your tracking patterns, we noticed you perform best when you exercise in the morning. Consider scheduling workouts earlier in the day.',
      sender: 'Life OS',
      date: 'Yesterday',
      isRead: true,
      type: 'insight',
    },
    {
      id: 4,
      subject: 'Streak Milestone',
      body: 'Congratulations on maintaining your daily tracking streak for 7 days! Keep the momentum going.',
      sender: 'Life OS',
      date: '2 days ago',
      isRead: true,
      type: 'achievement',
    },
    {
      id: 5,
      subject: 'Sleep Pattern Observation',
      body: "Your sleep quality has improved by 15% this week. Your consistent bedtime routine is paying off!",
      sender: 'Life OS',
      date: '3 days ago',
      isRead: true,
      type: 'insight',
    },
    {
      id: 6,
      subject: 'Monthly Check-in Due',
      body: 'Time for your monthly reflection! Review your progress and set new goals for the month ahead.',
      sender: 'Life OS',
      date: '1 week ago',
      isRead: true,
      type: 'reminder',
    },
  ]);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleBack = () => {
    if (selectedMessage) {
      setSelectedMessage(null);
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleMessagePress = (message: Message) => {
    setSelectedMessage(message);
  };

  const getMessageIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'summary':
        return 'stats-chart';
      case 'reminder':
        return 'notifications';
      case 'insight':
        return 'bulb';
      case 'achievement':
        return 'trophy';
      default:
        return 'mail';
    }
  };

  const getMessageIconColor = (type: string): string => {
    switch (type) {
      case 'summary':
        return '#6366F1';
      case 'reminder':
        return '#F59E0B';
      case 'insight':
        return '#8B5CF6';
      case 'achievement':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedMessage ? 'Message' : 'Inbox'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {selectedMessage ? (
        /* Message Detail View */
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContent}
        >
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF', '#F5F3FF']}
            style={styles.detailCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Message Icon */}
            <View style={styles.detailIconContainer}>
              <View
                style={[
                  styles.detailIconCircle,
                  { backgroundColor: `${getMessageIconColor(selectedMessage.type)}15` },
                ]}
              >
                <Ionicons
                  name={getMessageIcon(selectedMessage.type)}
                  size={32}
                  color={getMessageIconColor(selectedMessage.type)}
                />
              </View>
            </View>

            {/* Message Header */}
            <Text style={styles.detailSubject}>{selectedMessage.subject}</Text>
            <View style={styles.detailMeta}>
              <Text style={styles.detailSender}>{selectedMessage.sender}</Text>
              <Text style={styles.detailDot}>•</Text>
              <Text style={styles.detailDate}>{selectedMessage.date}</Text>
            </View>

            {/* Message Body */}
            <Text style={styles.detailBody}>{selectedMessage.body}</Text>
          </LinearGradient>
        </ScrollView>
      ) : (
        /* Message List View */
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {messages.map((message) => (
            <TouchableOpacity
              key={message.id}
              style={styles.messageCard}
              onPress={() => handleMessagePress(message)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  message.isRead
                    ? ['#FFFFFF', '#F9FAFB']
                    : ['#EEF2FF', '#F5F3FF']
                }
                style={styles.messageCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.messageIcon,
                    { backgroundColor: `${getMessageIconColor(message.type)}15` },
                  ]}
                >
                  <Ionicons
                    name={getMessageIcon(message.type)}
                    size={20}
                    color={getMessageIconColor(message.type)}
                  />
                </View>

                {/* Content */}
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <Text
                      style={[
                        styles.messageSubject,
                        !message.isRead && styles.messageSubjectUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {message.subject}
                    </Text>
                    {!message.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.messageBody} numberOfLines={2}>
                    {message.body}
                  </Text>
                  <Text style={styles.messageDate}>{message.date}</Text>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </LinearGradient>
            </TouchableOpacity>
          ))}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Message List
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  messageCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  messageCardGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSubject: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  messageSubjectUnread: {
    fontWeight: '700',
    color: '#4C1D95',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginLeft: 8,
  },
  messageBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  messageDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Message Detail
  detailContent: {
    padding: 16,
  },
  detailCard: {
    borderRadius: 20,
    padding: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  detailIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailSubject: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4C1D95',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  detailSender: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  detailDot: {
    fontSize: 13,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  detailDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  detailBody: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});

export default InboxScreen;
