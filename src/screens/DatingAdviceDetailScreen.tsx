import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
interface DatingAdvice {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface DatingAdviceDetailScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params?: {
      advice?: DatingAdvice;
    };
  };
}

// Placeholder content for each advice type
const getAdviceContent = (adviceId: string): { points: string[]; summary: string; expandedPoints: { heading: string; body: string }[] } => {
  switch (adviceId) {
    case '1':
      return {
        summary: 'Learning to recognize green flags helps you invest your energy in people who are truly ready for a healthy connection.',
        points: [
          'They ask thoughtful questions and remember details about your life',
          "They're consistent in their communication without playing games",
          'They respect your boundaries and time',
          'They show genuine interest in your goals and passions',
          'They take responsibility for their actions and communicate openly',
          'They make plans and follow through on them',
        ],
        expandedPoints: [
          {
            heading: '1. They ask thoughtful questions',
            body: 'Someone who genuinely cares will remember details about your life and ask follow-up questions. They show curiosity about who you are beyond surface-level conversation.',
          },
          {
            heading: '2. Consistent communication',
            body: "They don't play games or leave you guessing. Their actions match their words, and they communicate regularly without hot-and-cold patterns.",
          },
          {
            heading: '3. They respect boundaries',
            body: 'When you set a boundary, they honor it without making you feel guilty. They understand that healthy boundaries are essential for a strong connection.',
          },
          {
            heading: '4. Genuine interest in your life',
            body: 'They celebrate your wins and support your goals. Your passions matter to them because you matter to them.',
          },
          {
            heading: '5. Taking responsibility',
            body: 'They own their mistakes, apologize sincerely, and work to do better. Open communication about feelings and needs comes naturally to them.',
          },
          {
            heading: '6. Following through on plans',
            body: "They don't just talk about spending time together—they make it happen. Reliability and consistency show up in both their words and actions.",
          },
        ],
      };
    case '2':
      return {
        summary: 'The right questions can transform a surface-level conversation into a meaningful connection.',
        points: [
          "\"What's something you're really proud of that most people don't know about?\"",
          '"What does your ideal weekend look like?"',
          "\"What's a belief you held strongly that you've since changed your mind about?\"",
          '"What kind of relationship are you looking for right now?"',
          "\"What's something that always makes you feel recharged?\"",
          '"How do you like to show and receive care in relationships?"',
        ],
        expandedPoints: [
          {
            heading: '1. "What are you proud of?"',
            body: 'This question invites vulnerability and lets someone share achievements that matter to them personally, not just professionally. It reveals what they value.',
          },
          {
            heading: '2. "Your ideal weekend?"',
            body: 'Understanding how someone spends their free time shows you their lifestyle, energy levels, and what they find restorative or exciting.',
          },
          {
            heading: '3. "Beliefs you\'ve changed?"',
            body: 'This reveals self-awareness, growth, and open-mindedness. It shows they can reflect on their own evolution and aren\'t stuck in rigid thinking.',
          },
          {
            heading: '4. "What are you looking for?"',
            body: 'Direct but essential. This question helps you both understand if you\'re on the same page about relationship expectations and timelines.',
          },
          {
            heading: '5. "What recharges you?"',
            body: 'Learning what energizes someone helps you understand their self-care needs and whether your recharge modes complement each other.',
          },
          {
            heading: '6. "How do you show care?"',
            body: 'Understanding love languages early helps set realistic expectations and shows you both take emotional connection seriously.',
          },
        ],
      };
    case '3':
      return {
        summary: "Healthy boundaries aren't walls - they're bridges that help the right people connect with the real you.",
        points: [
          'Be clear about your communication preferences early on',
          "Don't feel pressured to share everything right away - trust is built gradually",
          "It's okay to say no to last-minute plans without over-explaining",
          'Pay attention to how someone responds when you set a boundary',
          'Your comfort and safety always come first',
          'Boundaries can evolve as you get to know someone better',
        ],
        expandedPoints: [
          {
            heading: '1. Communicate your preferences early',
            body: 'Share how you prefer to communicate—texting frequency, phone calls, response times. Setting these expectations early prevents misunderstandings.',
          },
          {
            heading: '2. Trust is built gradually',
            body: "You don't owe anyone your entire story on the first date. Share at your own pace. The right person will respect your timeline for opening up.",
          },
          {
            heading: '3. Saying no without guilt',
            body: 'Last-minute plans don\'t work for you? That\'s completely valid. You don\'t need to explain or apologize excessively. A simple "I can\'t make it tonight" is enough.',
          },
          {
            heading: '4. Watch their response',
            body: 'Someone who respects you will accept your boundaries gracefully. If they push back, guilt-trip, or dismiss your needs, that\'s valuable information.',
          },
          {
            heading: '5. Your comfort comes first',
            body: "If something doesn't feel right—whether it's physical, emotional, or about pacing—trust that feeling. Your instincts are protecting you.",
          },
          {
            heading: '6. Boundaries can change',
            body: 'As trust deepens, you might naturally adjust certain boundaries. That\'s healthy growth. But you should never feel pressured to change them.',
          },
        ],
      };
    default:
      return {
        summary: 'Mindful dating means staying present and intentional in your connections.',
        points: [
          "Take time to reflect on what you're really looking for",
          'Stay curious about others without rushing to conclusions',
          'Trust your intuition when something feels off',
          'Celebrate the connections that feel right',
        ],
        expandedPoints: [],
      };
  }
};

const DatingAdviceDetailScreen: React.FC<DatingAdviceDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const advice = route.params?.advice;
  const content = advice ? getAdviceContent(advice.id) : getAdviceContent('');

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  if (!advice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Content not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dating Advice</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content with Gradient Background */}
      <View style={styles.backgroundContainer}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentCard}>
            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Ionicons name="heart" size={14} color="#E11D48" />
              <Text style={styles.categoryText}>Dating</Text>
            </View>

            {/* Title */}
            <Text style={styles.guideTitle}>{advice.title}</Text>

            {/* Meta Info */}
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="list-outline" size={14} color="#E11D48" />
                <Text style={styles.metaText}>{content.expandedPoints.length} insights</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Introduction */}
            <Text style={styles.introduction}>{content.summary}</Text>

            {/* Expanded Points */}
            {content.expandedPoints.map((point, index) => (
              <View key={index} style={styles.pointSection}>
                <Text style={styles.pointHeading}>{point.heading}</Text>
                <Text style={styles.pointBody}>{point.body}</Text>
              </View>
            ))}

            {/* Remember Box */}
            <View style={styles.rememberBox}>
              <View style={styles.rememberHeader}>
                <Ionicons name="sparkles" size={20} color="#E11D48" />
                <Text style={styles.rememberTitle}>Remember</Text>
              </View>
              <Text style={styles.rememberText}>
                Dating is about discovering compatibility, not proving your worth. The right connection should feel natural, respectful, and energizing—not anxious or one-sided.
              </Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  scrollContent: {
    padding: 16,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E11D48',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E11D48',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    marginBottom: 20,
  },
  introduction: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 26,
    letterSpacing: -0.1,
    marginBottom: 28,
  },

  // Point Sections
  pointSection: {
    marginBottom: 24,
  },
  pointHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  pointBody: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Remember Box
  rememberBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E11D48',
  },
  rememberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rememberTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BE123C',
    letterSpacing: -0.2,
  },
  rememberText: {
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

export default DatingAdviceDetailScreen;
