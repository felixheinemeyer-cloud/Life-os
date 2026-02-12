import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Platform,
  TextInput,
  Keyboard,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  InputAccessoryView,
  PanResponder,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ENTRY_ACTION_WIDTH = 140;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;

// Consistent teal color matching KnowledgeVaultScreen
const ACCENT_COLOR = '#38BDF8';

// Icon categories for the picker
const ICON_CATEGORIES: { name: string; icons: (keyof typeof Ionicons.glyphMap)[] }[] = [
  {
    name: 'Popular',
    icons: [
      'bookmark-outline', 'book-outline', 'bulb-outline', 'star-outline',
      'folder-outline', 'document-text-outline', 'heart-outline', 'flag-outline',
    ],
  },
  {
    name: 'Learning',
    icons: [
      'school-outline', 'library-outline', 'reader-outline', 'newspaper-outline',
      'language-outline', 'pencil-outline', 'create-outline', 'glasses-outline',
    ],
  },
  {
    name: 'Mind & Growth',
    icons: [
      'body-outline', 'happy-outline', 'sparkles-outline', 'rocket-outline',
      'fitness-outline', 'leaf-outline', 'sunny-outline', 'rose-outline',
    ],
  },
  {
    name: 'Finance',
    icons: [
      'wallet-outline', 'cash-outline', 'card-outline', 'trending-up-outline',
      'stats-chart-outline', 'pie-chart-outline', 'calculator-outline', 'diamond-outline',
    ],
  },
  {
    name: 'Career',
    icons: [
      'briefcase-outline', 'business-outline', 'people-outline', 'podium-outline',
      'trophy-outline', 'ribbon-outline', 'megaphone-outline', 'chatbubbles-outline',
    ],
  },
  {
    name: 'Technology',
    icons: [
      'hardware-chip-outline', 'code-slash-outline', 'terminal-outline', 'laptop-outline',
      'cloud-outline', 'server-outline', 'globe-outline', 'analytics-outline',
    ],
  },
  {
    name: 'Health',
    icons: [
      'medkit-outline', 'nutrition-outline', 'pulse-outline', 'medical-outline',
      'barbell-outline', 'bicycle-outline', 'walk-outline', 'water-outline',
    ],
  },
  {
    name: 'Creative',
    icons: [
      'brush-outline', 'color-palette-outline', 'camera-outline', 'musical-notes-outline',
      'film-outline', 'mic-outline', 'easel-outline', 'videocam-outline',
    ],
  },
  {
    name: 'Food & Travel',
    icons: [
      'restaurant-outline', 'cafe-outline', 'airplane-outline', 'map-outline',
      'compass-outline', 'location-outline', 'bed-outline', 'trail-sign-outline',
    ],
  },
];

// Flatten all icons for search
const ALL_ICONS = ICON_CATEGORIES.flatMap(cat => cat.icons);
const UNIQUE_ICONS = [...new Set(ALL_ICONS)];

// Types
interface KnowledgeTopic {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightColor: string;
  createdAt: string;
}

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; uri: string; aspectRatio?: number };

interface KnowledgeEntry {
  id: string;
  topicId: string;
  title: string;
  content: string;
  contentBlocks?: ContentBlock[];
  imageUri?: string;
  tags?: string[];
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper functions for block content
const entryToBlocks = (entry: KnowledgeEntry): ContentBlock[] => {
  if (entry.contentBlocks?.length) return entry.contentBlocks;
  const blocks: ContentBlock[] = [{ type: 'text', text: entry.content }];
  if (entry.imageUri) blocks.push({ type: 'image', uri: entry.imageUri });
  return blocks;
};

const blocksToPlainText = (blocks: ContentBlock[]): string =>
  blocks.filter((b): b is { type: 'text'; text: string } => b.type === 'text').map(b => b.text).join('\n');

const blocksHaveContent = (blocks: ContentBlock[]): boolean =>
  blocks.some(b => (b.type === 'text' && b.text.trim()) || b.type === 'image');

const insertImageAtCursor = (
  blocks: ContentBlock[],
  blockIndex: number,
  cursorPos: number,
  imageUri: string,
  aspectRatio?: number
): ContentBlock[] => {
  const newBlocks = [...blocks];
  const targetBlock = newBlocks[blockIndex];
  if (!targetBlock || targetBlock.type !== 'text') {
    newBlocks.splice(blockIndex + 1, 0, { type: 'image', uri: imageUri, aspectRatio }, { type: 'text', text: '' });
    return newBlocks;
  }
  const textBefore = targetBlock.text.slice(0, cursorPos);
  const textAfter = targetBlock.text.slice(cursorPos);
  newBlocks.splice(blockIndex, 1,
    { type: 'text', text: textBefore },
    { type: 'image', uri: imageUri, aspectRatio },
    { type: 'text', text: textAfter }
  );
  return newBlocks;
};

const removeImageBlock = (blocks: ContentBlock[], index: number): ContentBlock[] => {
  const newBlocks = [...blocks];
  newBlocks.splice(index, 1);
  // Merge adjacent text blocks
  const merged: ContentBlock[] = [];
  for (const block of newBlocks) {
    const prev = merged[merged.length - 1];
    if (block.type === 'text' && prev?.type === 'text') {
      merged[merged.length - 1] = { type: 'text', text: prev.text + block.text };
    } else {
      merged.push(block);
    }
  }
  // Ensure at least one text block
  if (merged.length === 0) merged.push({ type: 'text', text: '' });
  return merged;
};

interface KnowledgeTopicScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params: {
      topic: KnowledgeTopic;
      entries: KnowledgeEntry[];
    };
  };
}

// Add Entry Card Component (simple button that opens modal)
const AddEntryCard: React.FC<{
  topicColor: string;
  onPress: () => void;
}> = ({ topicColor, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.addEntryCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.addEntryPlaceholder}>Add a new insight...</Text>
      <View style={[styles.addEntryButton, { backgroundColor: topicColor + '15' }]}>
        <Ionicons name="add" size={20} color={topicColor} />
      </View>
    </TouchableOpacity>
  );
};

// Edit Topic Modal Component
const EditTopicModal: React.FC<{
  visible: boolean;
  topic: KnowledgeTopic;
  entryCount: number;
  onClose: () => void;
  onSave: (name: string, icon: keyof typeof Ionicons.glyphMap) => void;
}> = ({ visible, topic, entryCount, onClose, onSave }) => {
  const insets = useSafeAreaInsets();
  const [topicName, setTopicName] = useState(topic.name);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>(topic.icon);
  const [iconSearch, setIconSearch] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setTopicName(topic.name);
      setSelectedIcon(topic.icon);
      setIconSearch('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible, topic]);

  const handleClose = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    if (topicName.trim()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSave(topicName.trim(), selectedIcon);
      Keyboard.dismiss();
    }
  };

  const handleIconSelect = (icon: keyof typeof Ionicons.glyphMap) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIcon(icon);
  };

  const isValid = topicName.trim().length > 0;

  // Filter icons based on search
  const filteredCategories = iconSearch.trim()
    ? [{
        name: 'Search Results',
        icons: UNIQUE_ICONS.filter(icon =>
          icon.toLowerCase().includes(iconSearch.toLowerCase().replace(/\s+/g, '-'))
        ),
      }]
    : ICON_CATEGORIES;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[editTopicModalStyles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={editTopicModalStyles.header}>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={editTopicModalStyles.headerBtn}>
            <Text style={editTopicModalStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={editTopicModalStyles.title}>Edit Topic</Text>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={!isValid}
            style={editTopicModalStyles.headerBtn}
          >
            <Text style={[editTopicModalStyles.saveText, !isValid && editTopicModalStyles.saveTextDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={editTopicModalStyles.scroll}
          contentContainerStyle={editTopicModalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          <View style={editTopicModalStyles.previewSection}>
            <View style={editTopicModalStyles.previewCard}>
              <View style={editTopicModalStyles.previewIconCircle}>
                <Ionicons name={selectedIcon} size={24} color={ACCENT_COLOR} />
              </View>
              <Text style={editTopicModalStyles.previewName} numberOfLines={1}>
                {topicName.trim() || 'Topic name'}
              </Text>
              <Text style={editTopicModalStyles.previewCount}>{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</Text>
            </View>
          </View>

          {/* Topic Name Input */}
          <View style={editTopicModalStyles.inputCard}>
            <Text style={editTopicModalStyles.inputLabel}>Topic Name</Text>
            <TextInput
              ref={inputRef}
              style={editTopicModalStyles.topicNameInput}
              placeholder="Enter topic name..."
              placeholderTextColor="#9CA3AF"
              value={topicName}
              onChangeText={setTopicName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={30}
            />
          </View>

          {/* Icon Picker */}
          <View style={editTopicModalStyles.iconPickerCard}>
            <Text style={editTopicModalStyles.inputLabel}>Choose Icon</Text>

            {/* Icon Search */}
            <View style={editTopicModalStyles.iconSearchContainer}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={editTopicModalStyles.iconSearchInput}
                placeholder="Search icons..."
                placeholderTextColor="#9CA3AF"
                value={iconSearch}
                onChangeText={setIconSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {iconSearch.length > 0 && (
                <TouchableOpacity onPress={() => setIconSearch('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Icon Categories */}
            {filteredCategories.map((category) => (
              <View key={category.name} style={editTopicModalStyles.iconCategory}>
                <Text style={editTopicModalStyles.iconCategoryTitle}>{category.name}</Text>
                <View style={editTopicModalStyles.iconGrid}>
                  {category.icons.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        editTopicModalStyles.iconItem,
                        selectedIcon === icon && editTopicModalStyles.iconItemSelected,
                      ]}
                      onPress={() => handleIconSelect(icon)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icon}
                        size={24}
                        color={selectedIcon === icon ? ACCENT_COLOR : '#6B7280'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {filteredCategories[0]?.icons.length === 0 && (
              <View style={editTopicModalStyles.noIconsFound}>
                <Ionicons name="search-outline" size={32} color="#D1D5DB" />
                <Text style={editTopicModalStyles.noIconsText}>No icons found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Edit Topic Modal Styles
const editTopicModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: {
    minWidth: 60,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_COLOR,
    textAlign: 'right',
  },
  saveTextDisabled: {
    color: '#D1D5DB',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  previewCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  previewIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  previewCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  topicNameInput: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    paddingTop: 4,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  iconPickerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  iconSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    padding: 0,
  },
  iconCategory: {
    marginBottom: 20,
  },
  iconCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconItemSelected: {
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: ACCENT_COLOR,
  },
  noIconsFound: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noIconsText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});

// Swipeable Entry Card Component
const SwipeableEntryCard: React.FC<{
  entry: KnowledgeEntry;
  topicColor: string;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
  index: number;
}> = ({ entry, topicColor, onPress, onEdit, onDelete, onSwipeStart, onSwipeEnd, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const currentTranslateX = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    });
    return () => {
      translateX.removeListener(listenerId);
    };
  }, [translateX]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const closeActions = useCallback(() => {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [translateX]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe && Math.abs(gestureState.dx) > 5;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation();
        onSwipeStart();
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newValue;
        if (isOpenRef.current) {
          newValue = -ENTRY_ACTION_WIDTH + gestureState.dx;
        } else {
          newValue = gestureState.dx;
        }
        newValue = Math.max(-ENTRY_ACTION_WIDTH, Math.min(0, newValue));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPos = currentTranslateX.current;
        const velocity = gestureState.vx;
        onSwipeEnd();

        if (velocity < -0.3) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -ENTRY_ACTION_WIDTH,
            useNativeDriver: true,
            velocity: velocity,
            friction: 7,
            tension: 80,
          }).start();
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return;
        }
        if (velocity > 0.3) {
          setIsOpen(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            velocity: velocity,
            friction: 7,
            tension: 80,
          }).start();
          return;
        }

        if (currentPos < -ENTRY_ACTION_WIDTH / 3) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -ENTRY_ACTION_WIDTH,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } else {
          setIsOpen(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        const currentPos = currentTranslateX.current;
        onSwipeEnd();
        if (currentPos < -ENTRY_ACTION_WIDTH / 2) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -ENTRY_ACTION_WIDTH,
            useNativeDriver: true,
          }).start();
        } else {
          setIsOpen(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  [translateX, onSwipeStart, onSwipeEnd]);

  const handleCardPress = () => {
    if (isOpen) {
      closeActions();
    } else {
      onPress();
    }
  };

  const handleEdit = () => {
    closeActions();
    setTimeout(() => onEdit(), 200);
  };

  const handleDelete = () => {
    closeActions();
    setTimeout(() => onDelete(), 200);
  };

  return (
    <Animated.View
      style={[
        swipeableEntryStyles.entryCardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Action buttons behind the card */}
      <View style={swipeableEntryStyles.entryActionsContainer}>
        <TouchableOpacity
          style={[swipeableEntryStyles.entrySwipeAction, swipeableEntryStyles.entryEditAction]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[swipeableEntryStyles.entrySwipeAction, swipeableEntryStyles.entryDeleteAction]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[swipeableEntryStyles.entryCardAnimated, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleCardPress}>
          <View style={swipeableEntryStyles.entryCard}>
            <View style={[swipeableEntryStyles.entryAccentBar, { backgroundColor: topicColor }]} />
            <View style={swipeableEntryStyles.entryContent}>
              <Text style={swipeableEntryStyles.entryTitle} numberOfLines={1}>{entry.title}</Text>
              <Text
                style={swipeableEntryStyles.entrySnippet}
                numberOfLines={3}
              >
                {entry.content}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// Swipeable entry card styles
const swipeableEntryStyles = StyleSheet.create({
  entryCardWrapper: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  entryCardAnimated: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  entryActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 0,
    gap: 12,
  },
  entrySwipeAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  entryEditAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#6B7280',
  },
  entryDeleteAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    marginRight: 16,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  entryAccentBar: {
    width: 4,
  },
  entryContent: {
    flex: 1,
    padding: 16,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  entrySnippet: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
  },
});

// Main Component
const KnowledgeTopicScreen = ({ navigation, route }: KnowledgeTopicScreenProps) => {
  const { topic, entries: initialEntries } = route.params;
  const insets = useSafeAreaInsets();

  // State
  const [currentTopic, setCurrentTopic] = useState<KnowledgeTopic>(topic);
  const [entries, setEntries] = useState<KnowledgeEntry[]>(initialEntries);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryBlocks, setEntryBlocks] = useState<ContentBlock[]>([{ type: 'text', text: '' }]);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [isSwipingEntry, setIsSwipingEntry] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [editTopicModalVisible, setEditTopicModalVisible] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);
  const blockInputRefs = useRef<{ [key: number]: TextInput | null }>({});

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const moreButtonScale = useRef(new Animated.Value(1)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const dropdownScale = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownContentOpacity = useRef(new Animated.Value(0)).current;

  // Show search only when 5+ entries
  const showSearch = entries.length >= 5;

  // Filtered entries based on search
  const filteredEntries = searchQuery.trim()
    ? entries.filter(entry =>
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  // Sort by newest first
  const sortedEntries = [...filteredEntries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Animations
  useEffect(() => {
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
    ]).start();
  }, []);

  // Handlers
  const handleSearchPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSearching(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleCloseSearch = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSearching(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleOpenModal = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingEntry(null);
    setEntryTitle('');
    setEntryBlocks([{ type: 'text', text: '' }]);
    setFocusedBlockIndex(0);
    setCursorPosition(0);
    setModalVisible(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEntryTitle('');
    setEntryBlocks([{ type: 'text', text: '' }]);
    setEditingEntry(null);
    Keyboard.dismiss();
  };

  const handleSaveEntry = () => {
    if (blocksHaveContent(entryBlocks)) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const plainText = blocksToPlainText(entryBlocks);

      if (editingEntry) {
        // Editing existing entry
        const updatedEntries = entries.map(e =>
          e.id === editingEntry.id
            ? {
                ...e,
                title: entryTitle.trim() || plainText.trim().split('\n')[0].slice(0, 50),
                content: plainText.trim(),
                contentBlocks: entryBlocks,
                imageUri: undefined,
                updatedAt: new Date().toISOString(),
              }
            : e
        );
        setEntries(updatedEntries);
      } else {
        // Creating new entry
        const autoTitle = entryTitle.trim() || plainText.trim().split('\n')[0].slice(0, 50);
        const newEntry: KnowledgeEntry = {
          id: Date.now().toString(),
          topicId: topic.id,
          title: autoTitle,
          content: plainText.trim(),
          contentBlocks: entryBlocks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setEntries(prev => [newEntry, ...prev]);
      }
      handleCloseModal();
    }
  };

  const handleEditEntry = (entry: KnowledgeEntry) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingEntry(entry);
    setEntryTitle(entry.title);
    setEntryBlocks(entryToBlocks(entry));
    setFocusedBlockIndex(0);
    setCursorPosition(0);
    setModalVisible(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable photo library access in your device settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const ratio = asset.width && asset.height ? asset.width / asset.height : undefined;
      const newBlocks = insertImageAtCursor(entryBlocks, focusedBlockIndex, cursorPosition, asset.uri, ratio);
      setEntryBlocks(newBlocks);
      // Focus the text block after the image (index = focusedBlockIndex + 2)
      const nextTextIndex = focusedBlockIndex + 2;
      setTimeout(() => {
        blockInputRefs.current[nextTextIndex]?.focus();
      }, 100);
    }
  };

  const handleRemoveImageBlock = (blockIndex: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newBlocks = removeImageBlock(entryBlocks, blockIndex);
    setEntryBlocks(newBlocks);
  };

  const handleBlockTextChange = (blockIndex: number, text: string) => {
    setEntryBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[blockIndex] = { type: 'text', text };
      return newBlocks;
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setEntries(prev => prev.filter(e => e.id !== entryId));
          },
        },
      ]
    );
  };

  const handleEntryPress = (entry: KnowledgeEntry) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('KnowledgeEntryDetail', {
      entry,
      topicName: currentTopic.name,
      topicIcon: currentTopic.icon,
      topicColor: ACCENT_COLOR,
      onUpdate: (updated: KnowledgeEntry) => {
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      },
      onDelete: (entryId: string) => {
        setEntries(prev => prev.filter(e => e.id !== entryId));
      },
    });
  };

  const handleSearchPressIn = () => {
    Animated.spring(searchButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleSearchPressOut = () => {
    Animated.spring(searchButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleEditTopic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditTopicModalVisible(true);
  };

  const handleSaveTopicEdit = (name: string, icon: keyof typeof Ionicons.glyphMap) => {
    setCurrentTopic(prev => ({
      ...prev,
      name,
      icon,
    }));
    setEditTopicModalVisible(false);
    // TODO: Persist changes to storage
  };

  const openDropdown = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowMoreMenu(true);
    dropdownScale.setValue(0);
    dropdownOpacity.setValue(0);
    dropdownContentOpacity.setValue(0);

    // Dropdown "emerges" from the button - ease-out for a releasing feel
    Animated.parallel([
      // Icon morphs from ellipsis to X
      Animated.timing(iconRotation, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Container expands from button position
      Animated.timing(dropdownScale, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.back(1.2)), // Slight overshoot for organic feel
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Content fades in after container starts expanding
    Animated.timing(dropdownContentOpacity, {
      toValue: 1,
      duration: 200,
      delay: 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = (callback?: () => void) => {
    // First, quickly fade out content
    Animated.timing(dropdownContentOpacity, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Then collapse container back into button with "suction" effect
    Animated.parallel([
      // Icon morphs back to ellipsis
      Animated.timing(iconRotation, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      // Container shrinks and moves towards button - ease-in for suction feel
      Animated.timing(dropdownScale, {
        toValue: 0,
        duration: 240,
        delay: 40, // Slight delay so content fades first
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 200,
        delay: 60,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMoreMenu(false);
      if (callback) callback();
    });
  };

  const handleMorePress = () => {
    if (showMoreMenu) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const handleMoreButtonPressIn = () => {
    Animated.spring(moreButtonScale, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  const handleMoreButtonPressOut = () => {
    Animated.spring(moreButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 300,
    }).start();
  };

  const handleDeleteTopic = () => {
    closeDropdown(() => {
      Alert.alert(
        'Delete Topic',
        `Are you sure you want to delete "${currentTopic.name}" and all its entries? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              // TODO: Implement actual deletion from storage
              navigation.goBack();
            },
          },
        ]
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSwipingEntry}
        keyboardShouldPersistTaps="handled"
      >
        {/* Scrollable Title */}
        {!isSearching && (
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <Ionicons name={currentTopic.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap} size={24} color="#FFFFFF" style={{ position: 'absolute' }} />
                <Ionicons name={currentTopic.icon} size={24} color={ACCENT_COLOR} />
              </View>
              <Text style={styles.title}>{currentTopic.name}</Text>
            </View>
          </View>
        )}

        {/* Add Entry Card */}
        {!isSearching && (
          <AddEntryCard
            topicColor={ACCENT_COLOR}
            onPress={handleOpenModal}
          />
        )}

        {/* Entry Count */}
        {!isSearching && entries.length > 0 && (
          <Text style={styles.entryCount}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Text>
        )}

        {/* Search Results Label */}
        {isSearching && searchQuery.trim() && (
          <Text style={styles.searchResultsLabel}>
            {filteredEntries.length === 0
              ? 'No results'
              : `${filteredEntries.length} ${filteredEntries.length === 1 ? 'result' : 'results'}`}
          </Text>
        )}

        {/* Entry Cards */}
        {sortedEntries.length > 0 ? (
          <View style={styles.entriesContainer}>
            {sortedEntries.map((entry, index) => (
              <SwipeableEntryCard
                key={entry.id}
                entry={entry}
                topicColor={ACCENT_COLOR}
                onPress={() => handleEntryPress(entry)}
                onEdit={() => handleEditEntry(entry)}
                onDelete={() => handleDeleteEntry(entry.id)}
                onSwipeStart={() => setIsSwipingEntry(true)}
                onSwipeEnd={() => setIsSwipingEntry(false)}
                index={index}
              />
            ))}
          </View>
        ) : isSearching && searchQuery.trim() ? (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color="#D1D5DB" />
            <Text style={styles.noResultsText}>No entries found</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background */}
        <View style={styles.headerBlur} pointerEvents="none">
          <LinearGradient
            colors={[
              'rgba(240, 238, 232, 0.95)',
              'rgba(240, 238, 232, 0.8)',
              'rgba(240, 238, 232, 0.4)',
              'rgba(240, 238, 232, 0)',
            ]}
            locations={[0, 0.4, 0.75, 1]}
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
              zIndex: showMoreMenu ? 100 : 10,
            },
          ]}
          pointerEvents="box-none"
        >
          {isSearching ? (
            /* Search Mode Header */
            <View style={styles.searchHeader}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  placeholder="Search entries..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={handleCloseSearch}
                style={styles.searchCancelButton}
                activeOpacity={0.7}
              >
                <Text style={styles.searchCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Normal Header */
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
              </TouchableOpacity>
              <View style={styles.headerActions}>
                {showSearch && (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleSearchPress}
                    onPressIn={handleSearchPressIn}
                    onPressOut={handleSearchPressOut}
                  >
                    <Animated.View style={[styles.headerButton, { transform: [{ scale: searchButtonScale }] }]}>
                      <Ionicons name="search" size={22} color="#1F2937" />
                    </Animated.View>
                  </TouchableOpacity>
                )}
                <View style={styles.moreButtonContainer}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleMorePress}
                    onPressIn={handleMoreButtonPressIn}
                    onPressOut={handleMoreButtonPressOut}
                    style={{ zIndex: 20 }}
                  >
                    <Animated.View style={[
                      styles.headerButton,
                      { transform: [{ scale: moreButtonScale }] }
                    ]}>
                      {/* Ellipsis icon - fades out */}
                      <Animated.View style={{
                        position: 'absolute',
                        opacity: iconRotation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 0, 0],
                        }),
                        transform: [{
                          rotate: iconRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '90deg'],
                          }),
                        }],
                      }}>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#1F2937" />
                      </Animated.View>
                      {/* Close icon - fades in */}
                      <Animated.View style={{
                        position: 'absolute',
                        opacity: iconRotation.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 0, 1],
                        }),
                        transform: [{
                          rotate: iconRotation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-90deg', '0deg'],
                          }),
                        }],
                      }}>
                        <Ionicons name="close" size={20} color="#1F2937" />
                      </Animated.View>
                    </Animated.View>
                  </TouchableOpacity>

                  {/* Inline Dropdown */}
                  {showMoreMenu && (
                    <Animated.View
                      style={[
                        styles.inlineMenuContainer,
                        {
                          opacity: dropdownOpacity,
                          transform: [
                            { translateX: dropdownScale.interpolate({
                              inputRange: [0, 1],
                              outputRange: [95, 0],
                            })},
                            { translateY: dropdownScale.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-45, 0],
                            })},
                            { scale: dropdownScale },
                          ],
                        }
                      ]}
                    >
                      <Animated.View style={{ opacity: dropdownContentOpacity }}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            closeDropdown(() => handleEditTopic());
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dropdownItemIcon}>
                            <Ionicons name="pencil-outline" size={18} color="#6B7280" />
                          </View>
                          <Text style={styles.dropdownItemText}>Edit Topic</Text>
                        </TouchableOpacity>
                        <View style={styles.dropdownDivider} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={handleDeleteTopic}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.dropdownItemIcon, styles.dropdownItemIconDestructive]}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </View>
                          <Text style={styles.dropdownItemTextDestructive}>Delete Topic</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Add Entry Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={styles.roundButton}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingEntry ? 'Edit Insight' : 'New Insight'}</Text>
            <TouchableOpacity
              onPress={handleSaveEntry}
              style={[styles.roundButton, !blocksHaveContent(entryBlocks) && styles.roundButtonDisabled]}
              disabled={!blocksHaveContent(entryBlocks)}
            >
              <Ionicons name="checkmark" size={20} color={blocksHaveContent(entryBlocks) ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <TextInput
              ref={titleInputRef}
              style={styles.modalTitleInput}
              placeholder="Title (optional)"
              placeholderTextColor="#9CA3AF"
              value={entryTitle}
              onChangeText={setEntryTitle}
              autoFocus
            />

            {/* Block Editor */}
            {entryBlocks.map((block, index) => {
              if (block.type === 'text') {
                const isFirstBlock = index === 0;
                const isOnlyEmptyText = entryBlocks.length === 1 && !block.text;
                return (
                  <TextInput
                    key={`text-${index}`}
                    ref={(ref) => { blockInputRefs.current[index] = ref; }}
                    style={styles.modalContentInput}
                    placeholder={isFirstBlock && isOnlyEmptyText ? 'What did you learn?' : undefined}
                    placeholderTextColor="#9CA3AF"
                    value={block.text}
                    onChangeText={(text) => handleBlockTextChange(index, text)}
                    onFocus={() => setFocusedBlockIndex(index)}
                    onSelectionChange={(e) => {
                      if (focusedBlockIndex === index) {
                        setCursorPosition(e.nativeEvent.selection.start);
                      }
                    }}
                    multiline
                    textAlignVertical="top"
                    inputAccessoryViewID="knowledgeEditorToolbar"
                  />
                );
              } else {
                return (
                  <View key={`image-${index}`} style={styles.inlineImageContainer}>
                    <Image
                      source={{ uri: block.uri }}
                      style={[styles.inlineImage, block.aspectRatio ? { aspectRatio: block.aspectRatio } : { height: 200 }]}
                    />
                    <TouchableOpacity
                      style={styles.inlineImageRemoveButton}
                      onPress={() => handleRemoveImageBlock(index)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              }
            })}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* InputAccessoryView - renders above keyboard on iOS */}
        <InputAccessoryView nativeID="knowledgeEditorToolbar" backgroundColor="transparent">
          <View style={styles.keyboardToolbar}>
            <TouchableOpacity
              style={styles.toolbarImageButton}
              onPress={handlePickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="image" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      </Modal>

      {/* Dropdown overlay for closing */}
      {showMoreMenu && (
        <TouchableWithoutFeedback onPress={() => closeDropdown()}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Edit Topic Modal */}
      <EditTopicModal
        visible={editTopicModalVisible}
        topic={currentTopic}
        entryCount={entries.length}
        onClose={() => setEditTopicModalVisible(false)}
        onSave={handleSaveTopicEdit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerGradient: {
    flex: 1,
    height: 120,
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
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  moreButtonContainer: {
    position: 'relative',
    zIndex: 100,
  },
  inlineMenuContainer: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 6,
    paddingBottom: 2,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  dropdownItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemIconDestructive: {
    backgroundColor: '#FEE2E2',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 14,
    marginVertical: 2,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  dropdownItemTextDestructive: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
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
  headerButton: {
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

  // Search Header
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  searchCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  searchCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Title Section
  titleSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E8F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // Add Entry Card
  addEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addEntryPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  addEntryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Entry Count
  entryCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },

  // Search Results Label
  searchResultsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },

  // Entries Container
  entriesContainer: {
    gap: 0,
  },

  // No Results
  noResults: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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

  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalTitleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  modalContentInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    minHeight: 40,
    padding: 0,
  },
  inlineImageContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  inlineImage: {
    width: '100%',
    borderRadius: 12,
  },
  inlineImageRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  keyboardToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  toolbarButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  toolbarImageButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default KnowledgeTopicScreen;
