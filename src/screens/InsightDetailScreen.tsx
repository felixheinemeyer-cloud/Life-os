import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InsightDetailScreenProps {
  navigation?: {
    goBack: () => void;
  };
}

const InsightDetailScreen = ({ navigation }: InsightDetailScreenProps): React.JSX.Element => {
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
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Insight</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <Text style={styles.insightContent}>{insight.content}</Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 12,
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
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
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
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
    paddingTop: 8,
    paddingBottom: 12,
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
