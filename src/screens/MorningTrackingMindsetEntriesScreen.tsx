import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface MorningTrackingMindsetEntriesScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

interface BeliefEntry {
  id: string;
  content: string;
}

// Sample mindset entries - in a real app, these would come from state/storage
const SAMPLE_ENTRIES: BeliefEntry[] = [
  {
    id: '1',
    content: 'The only way to do great work is to love what you do.',
  },
  {
    id: '2',
    content: 'Always act with integrity, even when no one is watching. Your character is defined by your actions in the dark.',
  },
  {
    id: '3',
    content: 'Growth over comfort. Every challenge is an opportunity to become stronger and wiser. Embrace discomfort as the path to excellence.',
  },
  {
    id: '4',
    content: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
  },
];

const MorningTrackingMindsetEntriesScreen: React.FC<MorningTrackingMindsetEntriesScreenProps> = ({
  navigation,
}) => {
  const [entries] = useState<BeliefEntry[]>(SAMPLE_ENTRIES);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleFinishCheckin = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Navigate to the complete animation screen
    navigation.navigate('MorningTrackingComplete');
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <LinearGradient
              colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
              style={styles.iconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInnerCircle}>
                <Ionicons name="diamond" size={28} color="#7C3AED" />
              </View>
            </LinearGradient>
            <Text style={styles.headerTitle}>Mindset</Text>
            <Text style={styles.headerSubtext}>
              Your beliefs and guiding principles
            </Text>
          </View>

          {/* Mindset Entries */}
          <View style={styles.entriesContainer}>
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="diamond-outline" size={40} color="#C7D2FE" />
                </View>
                <Text style={styles.emptyTitle}>No mindset entries yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add beliefs and quotes in the Mindset section
                </Text>
              </View>
            ) : (
              entries.map((entry) => {
                const isExpanded = expandedCards.has(entry.id);
                const isLongText = entry.content.length > 100;

                return (
                  <TouchableOpacity
                    key={entry.id}
                    activeOpacity={isLongText ? 0.8 : 1}
                    onPress={() => isLongText && toggleExpand(entry.id)}
                    style={styles.cardWrapper}
                  >
                    <View style={styles.card}>
                      <View style={styles.cardAccent} />
                      <Text
                        style={styles.cardContent}
                        numberOfLines={isExpanded ? undefined : 3}
                      >
                        {entry.content}
                      </Text>
                      {isLongText && (
                        <View style={styles.expandIndicator}>
                          <Text style={styles.expandText}>
                            {isExpanded ? 'Show less' : 'Read more'}
                          </Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color="#6366F1"
                          />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Finish Check-in Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishCheckin}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Finish Check-in</Text>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
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
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Header Section
  headerSection: {
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 20,
  },

  // Entries Container
  entriesContainer: {
    gap: 12,
  },

  // Card Styles
  cardWrapper: {
    borderRadius: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 24,
  },
  expandIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    gap: 2,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F5F2',
  },
  finishButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: -0.2,
  },
});

export default MorningTrackingMindsetEntriesScreen;
