import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
interface MediaVaultNewEntryScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface MediaCategory {
  id: string;
  name: string;
  color: string;
}

interface MediaFormat {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Categories (same as MediaVaultScreen for consistency)
const MEDIA_CATEGORIES: MediaCategory[] = [
  { id: 'health', name: 'Health', color: '#10B981' },
  { id: 'finance', name: 'Finance', color: '#F59E0B' },
  { id: 'love', name: 'Love', color: '#EC4899' },
  { id: 'mindset', name: 'Mindset', color: '#8B5CF6' },
  { id: 'work', name: 'Work', color: '#3B82F6' },
  { id: 'psychology', name: 'Psychology', color: '#6366F1' },
  { id: 'marketing', name: 'Marketing', color: '#F97316' },
  { id: 'politics', name: 'Politics', color: '#64748B' },
  { id: 'common-knowledge', name: 'Common Knowledge', color: '#0EA5E9' },
  { id: 'piano', name: 'Piano', color: '#1F2937' },
  { id: 'polish', name: 'Polish', color: '#DC2626' },
  { id: 'cooking', name: 'Cooking', color: '#EA580C' },
  { id: 'fitness', name: 'Fitness', color: '#059669' },
  { id: 'meditation', name: 'Meditation', color: '#14B8A6' },
  { id: 'productivity', name: 'Productivity', color: '#7C3AED' },
  { id: 'tech', name: 'Tech', color: '#2563EB' },
  { id: 'design', name: 'Design', color: '#DB2777' },
  { id: 'photography', name: 'Photography', color: '#4B5563' },
  { id: 'travel', name: 'Travel', color: '#0891B2' },
  { id: 'history', name: 'History', color: '#92400E' },
  { id: 'science', name: 'Science', color: '#4F46E5' },
  { id: 'philosophy', name: 'Philosophy', color: '#7C2D12' },
  { id: 'spirituality', name: 'Spirituality', color: '#8B5CF6' },
];

// Media Formats - Based on consumption method (mutually exclusive)
const MEDIA_FORMATS: MediaFormat[] = [
  { id: 'video', name: 'Video', icon: 'play-circle-outline' },
  { id: 'short-video', name: 'Short Video', icon: 'phone-portrait-outline' },
  { id: 'audio', name: 'Audio', icon: 'headset-outline' },
  { id: 'article', name: 'Article', icon: 'document-text-outline' },
  { id: 'thread', name: 'Thread', icon: 'chatbubbles-outline' },
  { id: 'website', name: 'Website', icon: 'globe-outline' },
];

// Initial categories to show
const INITIAL_CATEGORIES_SHOWN = 8;

// Main Component
const MediaVaultNewEntryScreen: React.FC<MediaVaultNewEntryScreenProps> = ({ navigation }) => {
  // Form state
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);

  // Focus states
  const [isLinkFocused, setIsLinkFocused] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(30)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(30)).current;
  const card3Opacity = useRef(new Animated.Value(0)).current;
  const card3TranslateY = useRef(new Animated.Value(30)).current;

  // Refs
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if form is valid
  const isFormValid = link.trim().length > 0 && title.trim().length > 0 && selectedCategory !== null;

  // Displayed categories
  const displayedCategories = isCategoriesExpanded
    ? MEDIA_CATEGORIES
    : MEDIA_CATEGORIES.slice(0, INITIAL_CATEGORIES_SHOWN);
  const hiddenCategoriesCount = MEDIA_CATEGORIES.length - INITIAL_CATEGORIES_SHOWN;

  useEffect(() => {
    // Staggered card animations
    Animated.sequence([
      // Header
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
      // Cards staggered
      Animated.stagger(80, [
        Animated.parallel([
          Animated.timing(card1Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(card1TranslateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(card2Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(card2TranslateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(card3Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(card3TranslateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleSave = () => {
    if (!isFormValid) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newEntry = {
      id: Date.now().toString(),
      link: link.trim(),
      title: title.trim(),
      category: selectedCategory,
      format: selectedFormat,
      createdAt: new Date().toISOString(),
    };

    console.log('New media entry:', newEntry);
    navigation.goBack();
  };

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleCategorySelect = (categoryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleFormatSelect = (formatId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedFormat(formatId === selectedFormat ? null : formatId);
  };

  const toggleCategoriesExpand = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsCategoriesExpanded(!isCategoriesExpanded);
  };

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
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.cancelButton}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Entry</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
              activeOpacity={0.7}
              disabled={!isFormValid}
            >
              <Text style={[styles.saveButtonText, !isFormValid && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Link & Title Card */}
          <Animated.View
            style={[
              styles.card,
              (isLinkFocused || isTitleFocused) && styles.cardFocused,
              { opacity: card1Opacity, transform: [{ translateY: card1TranslateY }] },
            ]}
          >
            {/* Link Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="link-outline" size={20} color="#EC4899" />
                </View>
                <Text style={styles.cardLabel}>Link</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Paste URL here..."
                placeholderTextColor="#9CA3AF"
                value={link}
                onChangeText={setLink}
                onFocus={() => setIsLinkFocused(true)}
                onBlur={() => setIsLinkFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="next"
                onSubmitEditing={() => titleInputRef.current?.focus()}
              />
            </View>

            <View style={styles.inputDivider} />

            {/* Title Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="text-outline" size={20} color="#EC4899" />
                </View>
                <Text style={styles.cardLabel}>Title</Text>
              </View>
              <TextInput
                ref={titleInputRef}
                style={styles.textInput}
                placeholder="Give it a title..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                onFocus={() => setIsTitleFocused(true)}
                onBlur={() => setIsTitleFocused(false)}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </Animated.View>

          {/* Category Card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: card2Opacity, transform: [{ translateY: card2TranslateY }] },
            ]}
          >
            <View style={styles.cardLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="folder-outline" size={20} color="#EC4899" />
              </View>
              <Text style={styles.cardLabel}>Category</Text>
            </View>
            <View style={styles.chipsContainer}>
              {displayedCategories.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => handleCategorySelect(category.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {MEDIA_CATEGORIES.length > INITIAL_CATEGORIES_SHOWN && (
                <TouchableOpacity
                  style={styles.expandChip}
                  onPress={toggleCategoriesExpand}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isCategoriesExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#6B7280"
                  />
                  <Text style={styles.expandChipText}>
                    {isCategoriesExpanded ? 'Less' : `+${hiddenCategoriesCount} more`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Format Card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: card3Opacity, transform: [{ translateY: card3TranslateY }] },
            ]}
          >
            <View style={styles.cardLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="apps-outline" size={20} color="#EC4899" />
              </View>
              <Text style={styles.cardLabel}>Format</Text>
              <Text style={styles.optionalLabel}>optional</Text>
            </View>
            <View style={styles.chipsContainer}>
              {MEDIA_FORMATS.map((format) => {
                const isSelected = selectedFormat === format.id;
                return (
                  <TouchableOpacity
                    key={format.id}
                    style={[
                      styles.formatChip,
                      isSelected && styles.formatChipSelected,
                    ]}
                    onPress={() => handleFormatSelect(format.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={format.icon}
                      size={16}
                      color={isSelected ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.formatChipText,
                        isSelected && styles.formatChipTextSelected,
                      ]}
                    >
                      {format.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
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
    padding: 20,
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
  optionalLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginLeft: 'auto',
  },

  // Input Section (for combined cards)
  inputSection: {
    // Container for each input within a combined card
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },

  // Text Input
  textInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 4,
    paddingHorizontal: 0,
  },

  // Chips Container
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Category Chips
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#1F2937',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  expandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  expandChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Format Chips
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  formatChipSelected: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  formatChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  formatChipTextSelected: {
    color: '#FFFFFF',
  },
});

export default MediaVaultNewEntryScreen;
