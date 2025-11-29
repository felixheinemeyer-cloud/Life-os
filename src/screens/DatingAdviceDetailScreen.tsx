import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
const getAdviceContent = (adviceId: string): { points: string[]; summary: string } => {
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
      };
  }
};

const DatingAdviceDetailScreen: React.FC<DatingAdviceDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const advice = route.params?.advice;
  const content = advice ? getAdviceContent(advice.id) : getAdviceContent('');

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      // Header animation
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Hero animation
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Content animation
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  if (!advice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
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
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: heroOpacity,
                transform: [{ scale: heroScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
              style={styles.heroIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroIconCircle}>
                <Ionicons name={advice.icon} size={32} color="#E11D48" />
              </View>
            </LinearGradient>

            <Text style={styles.heroTitle}>{advice.title}</Text>
            <Text style={styles.heroDescription}>{content.summary}</Text>
          </Animated.View>

          {/* Content Section */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Text style={styles.contentSectionTitle}>Key Takeaways</Text>

            {content.points.map((point, index) => (
              <View key={index} style={styles.pointCard}>
                <View style={styles.pointNumber}>
                  <Text style={styles.pointNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Coming Soon Section */}
          <Animated.View
            style={[
              styles.comingSoonSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.comingSoonCard}>
              <Ionicons name="sparkles-outline" size={24} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>
                More insights and interactive exercises coming soon
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
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

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 16,
  },
  heroIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  heroDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // Content Section
  contentSection: {
    marginBottom: 24,
  },
  contentSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pointNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  pointNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  pointText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 22,
  },

  // Coming Soon
  comingSoonSection: {
    marginTop: 8,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default DatingAdviceDetailScreen;
