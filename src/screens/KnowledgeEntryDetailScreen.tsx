import React, { useEffect, useRef, useState } from 'react';
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
  KeyboardAvoidingView,
  InputAccessoryView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const ACCENT_COLOR = '#38BDF8';

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
  blocks: ContentBlock[], blockIndex: number, cursorPos: number, imageUri: string, aspectRatio?: number
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
  const merged: ContentBlock[] = [];
  for (const block of newBlocks) {
    const prev = merged[merged.length - 1];
    if (block.type === 'text' && prev?.type === 'text') {
      merged[merged.length - 1] = { type: 'text', text: prev.text + block.text };
    } else {
      merged.push(block);
    }
  }
  if (merged.length === 0) merged.push({ type: 'text', text: '' });
  return merged;
};

interface KnowledgeEntryDetailScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params: {
      entry: KnowledgeEntry;
      topicName: string;
      topicIcon: string;
      topicColor: string;
      onUpdate?: (entry: KnowledgeEntry) => void;
      onDelete?: (entryId: string) => void;
    };
  };
}

const KnowledgeEntryDetailScreen: React.FC<KnowledgeEntryDetailScreenProps> = ({ navigation, route }) => {
  const { entry, topicName, topicIcon, topicColor, onUpdate, onDelete } = route.params;
  const insets = useSafeAreaInsets();

  const [currentEntry, setCurrentEntry] = useState<KnowledgeEntry>(entry);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(entry.title);
  const [editBlocks, setEditBlocks] = useState<ContentBlock[]>(entryToBlocks(entry));
  const [editFocusedBlockIndex, setEditFocusedBlockIndex] = useState(0);
  const [editCursorPosition, setEditCursorPosition] = useState(0);
  const titleInputRef = useRef<TextInput>(null);
  const editBlockInputRefs = useRef<{ [key: number]: TextInput | null }>({});

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(16)).current;

  // Dropdown animations
  const dropdownScale = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownContentOpacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const moreButtonScale = useRef(new Animated.Value(1)).current;

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

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const openDropdown = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDropdown(true);
    dropdownScale.setValue(0);
    dropdownOpacity.setValue(0);
    dropdownContentOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(iconRotation, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dropdownScale, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(dropdownContentOpacity, {
      toValue: 1,
      duration: 200,
      delay: 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = (callback?: () => void) => {
    Animated.timing(dropdownContentOpacity, {
      toValue: 0,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(iconRotation, {
        toValue: 0,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dropdownScale, {
        toValue: 0,
        duration: 240,
        delay: 40,
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
      setShowDropdown(false);
      if (callback) callback();
    });
  };

  const handleMoreButtonPressIn = () => {
    Animated.spring(moreButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleMoreButtonPressOut = () => {
    Animated.spring(moreButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleMoreOptions = () => {
    if (showDropdown) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const handleEdit = () => {
    closeDropdown(() => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setEditTitle(currentEntry.title);
      setEditBlocks(entryToBlocks(currentEntry));
      setEditFocusedBlockIndex(0);
      setEditCursorPosition(0);
      setIsEditing(true);
      setTimeout(() => titleInputRef.current?.focus(), 300);
    });
  };

  const handleSaveEdit = () => {
    if (blocksHaveContent(editBlocks)) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const plainText = blocksToPlainText(editBlocks);
      const updated: KnowledgeEntry = {
        ...currentEntry,
        title: editTitle.trim() || plainText.trim().split('\n')[0].slice(0, 50),
        content: plainText.trim(),
        contentBlocks: editBlocks,
        imageUri: undefined,
        updatedAt: new Date().toISOString(),
      };
      setCurrentEntry(updated);
      setIsEditing(false);
      Keyboard.dismiss();
      if (onUpdate) onUpdate(updated);
    }
  };

  const handleEditPickImage = async () => {
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
      const newBlocks = insertImageAtCursor(editBlocks, editFocusedBlockIndex, editCursorPosition, asset.uri, ratio);
      setEditBlocks(newBlocks);
      const nextTextIndex = editFocusedBlockIndex + 2;
      setTimeout(() => {
        editBlockInputRefs.current[nextTextIndex]?.focus();
      }, 100);
    }
  };

  const handleEditRemoveImageBlock = (blockIndex: number) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditBlocks(removeImageBlock(editBlocks, blockIndex));
  };

  const handleEditBlockTextChange = (blockIndex: number, text: string) => {
    setEditBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[blockIndex] = { type: 'text', text };
      return newBlocks;
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleDelete = () => {
    closeDropdown(() => {
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
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              if (onDelete) onDelete(currentEntry.id);
              navigation.goBack();
            },
          },
        ]
      );
    });
  };

  const wasEdited = currentEntry.createdAt !== currentEntry.updatedAt;

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
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        }}>
          {/* Topic badge */}
          <View style={styles.topicBadge}>
            <Ionicons name={topicIcon as any} size={14} color={topicColor} />
            <Text style={styles.topicBadgeText}>{topicName}</Text>
          </View>

          {/* Title */}
          <Text style={styles.entryTitle}>{currentEntry.title}</Text>

          {/* Date info */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {formatDate(currentEntry.createdAt)}
            </Text>
            {wasEdited && (
              <Text style={styles.metaTextEdited}>
                {' '}· Edited {formatDate(currentEntry.updatedAt)}
              </Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content Blocks */}
          {entryToBlocks(currentEntry).map((block, index) => {
            if (block.type === 'text') {
              return block.text ? (
                <Text key={`text-${index}`} style={styles.entryContent}>{block.text}</Text>
              ) : null;
            } else {
              return (
                <Image
                  key={`image-${index}`}
                  source={{ uri: block.uri }}
                  style={[styles.entryImage, block.aspectRatio ? { aspectRatio: block.aspectRatio } : { height: 240 }]}
                />
              );
            }
          })}

          {/* Tags */}
          {currentEntry.tags && currentEntry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {currentEntry.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Source URL */}
          {currentEntry.sourceUrl && (
            <View style={styles.sourceContainer}>
              <Ionicons name="link-outline" size={14} color="#9CA3AF" />
              <Text style={styles.sourceText} numberOfLines={1}>
                {currentEntry.sourceUrl}
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top, zIndex: showDropdown ? 100 : 10 }]} pointerEvents="box-none">
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
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
            </TouchableOpacity>
            <View style={styles.moreButtonContainer}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleMoreOptions}
                onPressIn={handleMoreButtonPressIn}
                onPressOut={handleMoreButtonPressOut}
                style={{ zIndex: 20 }}
              >
                <Animated.View style={[
                  styles.headerButton,
                  { transform: [{ scale: moreButtonScale }] }
                ]}>
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
                    <Ionicons name="ellipsis-horizontal" size={22} color="#1F2937" />
                  </Animated.View>
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

              {showDropdown && (
                <Animated.View
                  style={[
                    styles.inlineDropdownMenu,
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
                      onPress={handleEdit}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownItemIcon}>
                        <Ionicons name="pencil-outline" size={18} color="#6B7280" />
                      </View>
                      <Text style={styles.dropdownItemText}>Edit Entry</Text>
                    </TouchableOpacity>
                    <View style={styles.dropdownDivider} />
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.dropdownItemDestructive]}
                      onPress={handleDelete}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.dropdownItemIcon, styles.dropdownItemIconDestructive]}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </View>
                      <Text style={styles.dropdownItemTextDestructive}>Delete Entry</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Overlay to close dropdown when tapping outside */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={() => closeDropdown()}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Edit Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.editModalContainer}
        >
          <View style={styles.editModalHeader}>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={styles.roundButton}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Insight</Text>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={[styles.roundButton, !blocksHaveContent(editBlocks) && styles.roundButtonDisabled]}
              disabled={!blocksHaveContent(editBlocks)}
            >
              <Ionicons name="checkmark" size={20} color={blocksHaveContent(editBlocks) ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalContent} keyboardShouldPersistTaps="handled">
            <TextInput
              ref={titleInputRef}
              style={styles.editTitleInput}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
              value={editTitle}
              onChangeText={setEditTitle}
            />

            {/* Block Editor */}
            {editBlocks.map((block, index) => {
              if (block.type === 'text') {
                const isFirstBlock = index === 0;
                const isOnlyEmptyText = editBlocks.length === 1 && !block.text;
                return (
                  <TextInput
                    key={`text-${index}`}
                    ref={(ref) => { editBlockInputRefs.current[index] = ref; }}
                    style={styles.editContentInput}
                    placeholder={isFirstBlock && isOnlyEmptyText ? 'What did you learn?' : undefined}
                    placeholderTextColor="#9CA3AF"
                    value={block.text}
                    onChangeText={(text) => handleEditBlockTextChange(index, text)}
                    onFocus={() => setEditFocusedBlockIndex(index)}
                    onSelectionChange={(e) => {
                      if (editFocusedBlockIndex === index) {
                        setEditCursorPosition(e.nativeEvent.selection.start);
                      }
                    }}
                    multiline
                    textAlignVertical="top"
                    inputAccessoryViewID="knowledgeDetailEditorToolbar"
                  />
                );
              } else {
                return (
                  <View key={`image-${index}`} style={styles.editInlineImageContainer}>
                    <Image
                      source={{ uri: block.uri }}
                      style={[styles.editInlineImage, block.aspectRatio ? { aspectRatio: block.aspectRatio } : { height: 200 }]}
                    />
                    <TouchableOpacity
                      style={styles.editInlineImageRemoveButton}
                      onPress={() => handleEditRemoveImageBlock(index)}
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
        <InputAccessoryView nativeID="knowledgeDetailEditorToolbar" backgroundColor="transparent">
          <View style={styles.editKeyboardToolbar}>
            <TouchableOpacity
              style={styles.editToolbarImageButton}
              onPress={handleEditPickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="image" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      </Modal>
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
  moreButtonContainer: {
    position: 'relative',
    zIndex: 100,
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
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  inlineDropdownMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    minWidth: 190,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
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
  dropdownItemDestructive: {},
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  // Topic Badge
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topicBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Title
  entryTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginBottom: 12,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  metaTextEdited: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },

  // Content
  entryContent: {
    fontSize: 17,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 28,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Source
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sourceText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    flex: 1,
  },

  // Edit Modal
  editModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  editModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  editTitleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  editContentInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    minHeight: 40,
    padding: 0,
  },

  // Entry Image (detail view - inline)
  entryImage: {
    width: '100%',
    borderRadius: 12,
    marginVertical: 16,
  },

  // Edit - Inline Image
  editInlineImageContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  editInlineImage: {
    width: '100%',
    borderRadius: 12,
  },
  editInlineImageRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },

  // Edit Keyboard Toolbar
  editKeyboardToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  editToolbarImageButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
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
});

export default KnowledgeEntryDetailScreen;
