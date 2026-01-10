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

// Sample mindset entries
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
    content: 'Success is not final, failure is not fatal: it is the courage to continue that counts. The road to success is always under construction. What lies behind us and what lies before us are tiny matters compared to what lies within us.',
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
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Mindset</Text>
            <Text style={styles.subtitle}>
              Your favorite quotes, values & guiding principles in one place
            </Text>
          </View>

          {/* Mindset Entries */}
          <View style={styles.entriesContainer}>
            {entries.map((entry) => {
              const isExpanded = expandedCards.has(entry.id);
              const isLongText = entry.content.length > 120;

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
                      numberOfLines={isExpanded ? undefined : 4}
                    >
                      {entry.content}
                    </Text>
                    {isLongText && !isExpanded && (
                      <TouchableOpacity
                        style={styles.readMoreButton}
                        onPress={() => toggleExpand(entry.id)}
                      >
                        <Text style={styles.readMoreText}>Read more</Text>
                        <Ionicons name="chevron-down" size={14} color="#6366F1" />
                      </TouchableOpacity>
                    )}
                    {isLongText && isExpanded && (
                      <TouchableOpacity
                        style={styles.readMoreButton}
                        onPress={() => toggleExpand(entry.id)}
                      >
                        <Text style={styles.readMoreText}>Show less</Text>
                        <Ionicons name="chevron-up" size={14} color="#6366F1" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Finish Check-in Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishCheckin}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Finish</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingBottom: 80,
  },

  // Title Section
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Entries Container
  entriesContainer: {
    gap: 12,
  },

  // Card Styles
  cardWrapper: {
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    paddingLeft: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },

  // Button Container
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  finishButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: -0.2,
  },
});

export default MorningTrackingMindsetEntriesScreen;
