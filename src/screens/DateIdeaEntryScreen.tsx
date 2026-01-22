import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface DateIdea {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  duration: string;
  budget: 'free' | 'low' | 'medium' | 'high';
  isCustom?: boolean;
  createdAt?: string;
}

interface DateIdeaEntryScreenProps {
  navigation: {
    goBack: () => void;
  };
  route?: {
    params?: {
      idea?: DateIdea;
      onSave?: () => void;
    };
  };
}

// Constants
const STORAGE_KEY = '@custom_date_ideas';

// Default category and icon for all custom date ideas
const CUSTOM_CATEGORY = 'custom';
const CUSTOM_ICON: keyof typeof Ionicons.glyphMap = 'sparkles-outline';

const DURATIONS = [
  { id: '1h', label: '1h' },
  { id: '1-2h', label: '1-2h' },
  { id: '2-3h', label: '2-3h' },
  { id: '3-4h', label: '3-4h' },
  { id: '4h+', label: '4h+' },
  { id: 'half-day', label: 'Half day' },
  { id: 'full-day', label: 'Full day' },
];

const BUDGETS: { id: DateIdea['budget']; label: string; description: string }[] = [
  { id: 'free', label: 'Free', description: 'No cost' },
  { id: 'low', label: '$', description: 'Budget-friendly' },
  { id: 'medium', label: '$$', description: 'Moderate' },
  { id: 'high', label: '$$$', description: 'Splurge' },
];


// Main Component
const DateIdeaEntryScreen: React.FC<DateIdeaEntryScreenProps> = ({ navigation, route }) => {
  // Get existing idea if editing
  const existingIdea = route?.params?.idea;
  const isEditMode = !!existingIdea;
  const onSaveCallback = route?.params?.onSave;

  // Form state
  const [title, setTitle] = useState(existingIdea?.title || '');
  const [description, setDescription] = useState(existingIdea?.description || '');
  const [selectedDuration, setSelectedDuration] = useState(existingIdea?.duration || '2-3h');
  const [selectedBudget, setSelectedBudget] = useState<DateIdea['budget']>(existingIdea?.budget || 'low');

  // Focus states
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);

  // Check if form is valid
  const isFormValid = title.trim().length > 0;

  const handleSave = async () => {
    if (!isFormValid) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const ideaData: DateIdea = {
      id: isEditMode ? existingIdea.id : `custom_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      icon: CUSTOM_ICON,
      category: CUSTOM_CATEGORY,
      duration: selectedDuration,
      budget: selectedBudget,
      isCustom: true,
      createdAt: isEditMode ? existingIdea.createdAt : new Date().toISOString(),
    };

    try {
      // Get existing custom ideas
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      let customIdeas: DateIdea[] = existingData ? JSON.parse(existingData) : [];

      if (isEditMode) {
        // Update existing idea
        customIdeas = customIdeas.map(idea =>
          idea.id === existingIdea.id ? ideaData : idea
        );
      } else {
        // Add new idea
        customIdeas.unshift(ideaData);
      }

      // Save to storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customIdeas));

      // Call the callback if provided
      if (onSaveCallback) {
        onSaveCallback();
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving date idea:', error);
    }
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
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.roundButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Date Idea</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.roundButton, !isFormValid && styles.roundButtonDisabled]}
              activeOpacity={0.7}
              disabled={!isFormValid}
            >
              <Ionicons name="checkmark" size={20} color={isFormValid ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Card */}
          <View style={[styles.card, isTitleFocused && styles.cardFocused]}>
            <View style={styles.cardLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="create-outline" size={20} color="#E11D48" />
              </View>
              <Text style={styles.cardLabel}>Title</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter a title for your date idea..."
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setIsTitleFocused(false)}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          </View>

          {/* Description Card */}
          <View style={[styles.card, isDescriptionFocused && styles.cardFocused]}>
            <View style={styles.cardLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text-outline" size={20} color="#E11D48" />
              </View>
              <Text style={styles.cardLabel}>Description</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>optional</Text>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              placeholder="Add a brief description..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              onFocus={() => setIsDescriptionFocused(true)}
              onBlur={() => setIsDescriptionFocused(false)}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Duration Card */}
          <View style={styles.card}>
            <View style={styles.cardLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={20} color="#E11D48" />
              </View>
              <Text style={styles.cardLabel}>Duration</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>optional</Text>
              </View>
            </View>
            <View style={styles.chipsContainer}>
              {DURATIONS.map(duration => (
                <TouchableOpacity
                  key={duration.id}
                  style={[
                    styles.chip,
                    selectedDuration === duration.id && styles.chipSelected,
                  ]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedDuration(duration.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedDuration === duration.id && styles.chipTextSelected,
                    ]}
                  >
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Budget Card */}
          <View style={styles.card}>
            <View style={styles.cardLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="wallet-outline" size={20} color="#E11D48" />
              </View>
              <Text style={styles.cardLabel}>Budget</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>optional</Text>
              </View>
            </View>
            <View style={styles.chipsContainer}>
              {BUDGETS.map(budget => (
                <TouchableOpacity
                  key={budget.id}
                  style={[
                    styles.budgetChip,
                    selectedBudget === budget.id && styles.chipSelected,
                  ]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedBudget(budget.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedBudget === budget.id && styles.chipTextSelected,
                    ]}
                  >
                    {budget.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundButton: {
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
  roundButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardFocused: {
    borderColor: '#E5E7EB',
    shadowOpacity: 0.1,
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  optionalBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  optionalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Text Input
  textInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  textInputMultiline: {
    minHeight: 22,
    lineHeight: 22,
  },

  // Chips Container
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Chips
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  budgetChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});

export default DateIdeaEntryScreen;
