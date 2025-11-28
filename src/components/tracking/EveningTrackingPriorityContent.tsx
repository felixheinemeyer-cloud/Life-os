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

interface EveningTrackingPriorityContentProps {
  morningPriority: string;
  onSelectionComplete: (completed: boolean) => void;
}

const EveningTrackingPriorityContent: React.FC<EveningTrackingPriorityContentProps> = ({
  morningPriority,
  onSelectionComplete,
}) => {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Question Section */}
      <View style={styles.questionSection}>
        <LinearGradient
          colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
          style={styles.iconGradientRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.iconInnerCircle}>
            <Ionicons name="checkmark-circle" size={28} color="#7C3AED" />
          </View>
        </LinearGradient>
        <Text style={styles.questionText}>
          Did you complete your priority?
        </Text>
        <Text style={styles.questionSubtext}>
          Reflect on your most important goal for today
        </Text>
      </View>

      {/* Priority Card */}
      <View style={styles.priorityCard}>
        <View style={styles.priorityHeader}>
          <Ionicons name="flag" size={16} color="#D97706" />
          <Text style={styles.priorityLabel}>Today's Priority</Text>
        </View>
        <Text style={styles.priorityText}>{morningPriority}</Text>
      </View>

      {/* Completion Toggle */}
      <View style={styles.toggleSection}>
        <TouchableOpacity
          style={styles.toggleOption}
          onPress={() => onSelectionComplete(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleCircle, styles.toggleCircleSelected]}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.toggleText}>Yes, I did it!</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevron} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleOption}
          onPress={() => onSelectionComplete(false)}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleCircle, styles.toggleCircleNotSelected]}>
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.toggleText}>Not today</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevron} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 3,
  },
  iconInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 8,
  },
  questionSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 20,
  },

  // Priority Card
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  priorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 24,
    letterSpacing: -0.2,
  },

  // Toggle Section
  toggleSection: {
    gap: 12,
  },
  toggleOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  toggleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCircleSelected: {
    backgroundColor: '#7C3AED',
  },
  toggleCircleNotSelected: {
    backgroundColor: '#9CA3AF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  chevron: {
    marginLeft: 'auto',
  },
});

export default EveningTrackingPriorityContent;
