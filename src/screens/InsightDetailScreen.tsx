import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface InsightDetailScreenProps {
  navigation?: {
    goBack: () => void;
  };
}

const InsightDetailScreen = ({ navigation }: InsightDetailScreenProps): React.JSX.Element => {
  const insets = useSafeAreaInsets();

  // Mock insight data (Frontend only - would come from route params or global state in real app)
  const insight = {
    title: 'Small steps every day lead to remarkable transformations',
    content: 'Building sustainable habits starts with consistency, not perfection. When you commit to showing up daily, even in small ways, you create momentum that compounds over time.\n\nResearch shows that it takes an average of 66 days to form a new habit. But the real magic happens when you stop focusing on the end goal and start celebrating the process itself.\n\nEvery time you complete your morning routine, track your meals, or take a moment to reflect, you\'re not just checking off a box—you\'re reinforcing your identity as someone who values growth and self-improvement.\n\nRemember: transformation isn\'t about dramatic overnight changes. It\'s about the small, consistent actions that, when stacked together, create the life you want to live.\n\nStart today. Start small. Stay consistent. The results will follow.',
    category: 'Mindset',
    readTime: '3 min read',
    date: 'Today',
  };

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Content */}
      <LinearGradient
        colors={['#FFFBEB', '#FEF3C7', '#FECACA']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 64 }]}
        >
          <View style={styles.contentCard}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Ionicons name="diamond" size={14} color="#D97706" />
            <Text style={styles.categoryText}>{insight.category}</Text>
          </View>

          {/* Title */}
          <Text style={styles.insightTitle}>{insight.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#D97706" />
              <Text style={styles.metaText}>{insight.readTime}</Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{insight.date}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content */}
          <Text style={styles.insightContent}>{insight.content}</Text>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </LinearGradient>

      {/* Fixed Header with Blur Background */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background */}
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 0.85)',
              'rgba(247, 245, 242, 0.6)',
              'rgba(247, 245, 242, 0.3)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.headerGradient}
          />
        </View>

        {/* Header Content */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Insight</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 16,
    zIndex: 100,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  // Content
  scrollContent: {
    padding: 16,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
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
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightTitle: {
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
    color: '#D97706',
  },
  metaDot: {
    fontSize: 13,
    color: '#D97706',
    marginHorizontal: 8,
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    marginBottom: 20,
  },
  insightContent: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 26,
    letterSpacing: -0.1,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },

  // Related Section
  relatedSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  relatedPlaceholder: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});

export default InsightDetailScreen;
