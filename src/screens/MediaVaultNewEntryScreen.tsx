import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  TextInput,
  Keyboard,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useMedia, MediaEntry } from '../context/MediaContext';

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

// Default Categories (initial set)
const DEFAULT_CATEGORIES: MediaCategory[] = [
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
  { id: 'travel', name: 'Travel', color: '#0891B2' },
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

// Colors for new categories
const CATEGORY_COLORS = [
  '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6',
  '#6366F1', '#F97316', '#64748B', '#0EA5E9', '#DC2626',
  '#EA580C', '#059669', '#14B8A6', '#7C3AED', '#2563EB',
  '#DB2777', '#4B5563', '#0891B2', '#92400E', '#4F46E5',
];

// Main Component
const MediaVaultNewEntryScreen: React.FC<MediaVaultNewEntryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Get addEntry from context
  const { addEntry } = useMedia();

  // Form state
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [categories, setCategories] = useState<MediaCategory[]>(DEFAULT_CATEGORIES);

  // Modal state
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [previewColor, setPreviewColor] = useState(CATEGORY_COLORS[0]);

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
  const card4Opacity = useRef(new Animated.Value(0)).current;
  const card4TranslateY = useRef(new Animated.Value(30)).current;

  // Refs
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Check if form is valid
  const isFormValid = link.trim().length > 0 && title.trim().length > 0;

  // Displayed categories
  const displayedCategories = isCategoriesExpanded
    ? categories
    : categories.slice(0, INITIAL_CATEGORIES_SHOWN);
  const hiddenCategoriesCount = categories.length - INITIAL_CATEGORIES_SHOWN;

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
        Animated.parallel([
          Animated.timing(card4Opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(card4TranslateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleSave = () => {
    if (!isFormValid) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newEntry: MediaEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      sourceUrl: link.trim(),
      isWatchLater,
      category: selectedCategory || 'uncategorized',
      format: (selectedFormat as MediaEntry['format']) || 'video',
    };

    addEntry(newEntry);
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

  const handleWatchLaterToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsWatchLater(!isWatchLater);
  };

  const toggleCategoriesExpand = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsCategoriesExpanded(!isCategoriesExpanded);
  };

  const handleAddCategory = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCategoryName('');
    setIsEditMode(false);
    setEditingCategoryId(null);
    // Set a random preview color
    setPreviewColor(CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)]);
    setIsCategoryModalVisible(true);
  };

  const handleEditCategory = (category: MediaCategory) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCategoryName(category.name);
    setPreviewColor(category.color);
    setIsEditMode(true);
    setEditingCategoryId(category.id);
    setIsCategoryModalVisible(true);
  };

  const handleSaveCategory = () => {
    const trimmedName = categoryName.trim();
    if (trimmedName.length === 0) return;

    if (isEditMode && editingCategoryId) {
      // Update existing category
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategoryId
            ? { ...cat, name: trimmedName, color: previewColor }
            : cat
        )
      );
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      // Check if category already exists
      const exists = categories.some(
        (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (exists) {
        setIsCategoryModalVisible(false);
        return;
      }

      // Create new category with the preview color
      const newCategory: MediaCategory = {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        color: previewColor,
      };

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Add to categories and select it
      setCategories((prev) => [...prev, newCategory]);
      setSelectedCategory(newCategory.id);

      // Expand categories to show the new one
      setIsCategoriesExpanded(true);
    }

    setIsCategoryModalVisible(false);
    setCategoryName('');
    setIsEditMode(false);
    setEditingCategoryId(null);
  };

  const handleDeleteCategory = () => {
    if (!editingCategoryId) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    // Remove category
    setCategories((prev) => prev.filter((cat) => cat.id !== editingCategoryId));

    // Deselect if this category was selected
    if (selectedCategory === editingCategoryId) {
      setSelectedCategory(null);
    }

    setIsCategoryModalVisible(false);
    setCategoryName('');
    setIsEditMode(false);
    setEditingCategoryId(null);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalVisible(false);
    setCategoryName('');
    setIsEditMode(false);
    setEditingCategoryId(null);
  };

  const handleChangePreviewColor = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Pick a random different color
    let newColor = previewColor;
    while (newColor === previewColor) {
      newColor = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];
    }
    setPreviewColor(newColor);
  };

  return (
    <View style={styles.container}>
      {/* Content - ScrollView goes first */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64 },
        ]}
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
              <Text style={styles.optionalLabel}>optional</Text>
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
                    onLongPress={() => handleEditCategory(category)}
                    delayLongPress={400}
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
              {categories.length > INITIAL_CATEGORIES_SHOWN && (
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
              <TouchableOpacity
                style={styles.addCategoryChip}
                onPress={handleAddCategory}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#9CA3AF" />
                <Text style={styles.addCategoryChipText}>New</Text>
              </TouchableOpacity>
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

          {/* Watch Later Section */}
          <Animated.View
            style={[
              styles.card,
              { opacity: card4Opacity, transform: [{ translateY: card4TranslateY }] },
            ]}
          >
            <TouchableOpacity
              style={styles.watchLaterRow}
              onPress={handleWatchLaterToggle}
              activeOpacity={0.7}
            >
              <View style={styles.watchLaterLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="time-outline" size={20} color="#EC4899" />
                </View>
                <Text style={styles.cardLabel}>Watchlist</Text>
              </View>
              <View
                style={[
                  styles.watchLaterToggle,
                  isWatchLater && styles.watchLaterToggleActive,
                ]}
              >
                <Ionicons
                  name={isWatchLater ? 'checkmark' : 'add'}
                  size={14}
                  color={isWatchLater ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.watchLaterToggleText,
                    isWatchLater && styles.watchLaterToggleTextActive,
                  ]}
                >
                  {isWatchLater ? 'Queued' : 'Add to Queue'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

      </ScrollView>

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
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.roundButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Entry</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.roundButton, !isFormValid && styles.roundButtonDisabled]}
              activeOpacity={0.7}
              disabled={!isFormValid}
            >
              <Ionicons name="checkmark" size={20} color={isFormValid ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Category Modal (Add/Edit) */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseCategoryModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseCategoryModal}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={16}
              style={styles.modalKeyboardAvoid}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalContent}>
                  {/* Header with icon */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderRow}>
                      <View style={styles.modalIconCircle}>
                        <Ionicons name="folder-outline" size={22} color="#EC4899" />
                      </View>
                      <Text style={styles.modalTitle}>
                        {isEditMode ? 'Edit Category' : 'New Category'}
                      </Text>
                      {isEditMode && (
                        <TouchableOpacity
                          style={styles.modalDeleteButton}
                          onPress={handleDeleteCategory}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.modalSubtitle}>
                      {isEditMode
                        ? 'Update the category name or color'
                        : 'Create a custom category to organize your media'}
                    </Text>
                  </View>

                  {/* Input with color preview */}
                  <View style={styles.modalInputContainer}>
                    <TouchableOpacity
                      onPress={handleChangePreviewColor}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.modalColorDotTouchable}
                    >
                      <View style={[styles.modalColorDot, { backgroundColor: previewColor }]} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Enter category name"
                      placeholderTextColor="#9CA3AF"
                      value={categoryName}
                      onChangeText={setCategoryName}
                      autoFocus
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleSaveCategory}
                    />
                  </View>

                  {/* Buttons */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={handleCloseCategoryModal}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.modalButtonCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButtonSave,
                        categoryName.trim().length === 0 && styles.modalButtonSaveDisabled,
                      ]}
                      onPress={handleSaveCategory}
                      activeOpacity={0.7}
                      disabled={categoryName.trim().length === 0}
                    >
                      <Ionicons
                        name={isEditMode ? 'checkmark' : 'add'}
                        size={18}
                        color={categoryName.trim().length === 0 ? '#9CA3AF' : '#FFFFFF'}
                        style={styles.modalButtonIcon}
                      />
                      <Text
                        style={[
                          styles.modalButtonSaveText,
                          categoryName.trim().length === 0 && styles.modalButtonSaveTextDisabled,
                        ]}
                      >
                        {isEditMode ? 'Save' : 'Create'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
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
    paddingTop: 8,
    paddingBottom: 0,
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
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },

  // Watch Later Toggle
  watchLaterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  watchLaterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  watchLaterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  watchLaterToggleActive: {
    backgroundColor: '#EC4899',
  },
  watchLaterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  watchLaterToggleTextActive: {
    color: '#FFFFFF',
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
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChipSelected: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
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
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addCategoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardAvoid: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '88%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalDeleteButton: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalColorDotTouchable: {
    padding: 6,
    marginLeft: -6,
    marginRight: 4,
  },
  modalColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalButtonDelete: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonSave: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSaveDisabled: {
    backgroundColor: '#E5E7EB',
  },
  modalButtonIcon: {
    marginRight: 4,
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonSaveTextDisabled: {
    color: '#9CA3AF',
  },
});

export default MediaVaultNewEntryScreen;
