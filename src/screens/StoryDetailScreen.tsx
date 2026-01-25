import React, { useState, useRef } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Types
interface StoryDetailScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params?: {
      story?: Story;
      onUpdate?: (story: Story) => void;
      onDelete?: (storyId: string) => void;
    };
  };
}

interface Story {
  id: string;
  title: string;
  content: string;
  whenItHappened?: string;
  createdAt: string;
  updatedAt: string;
}

const StoryDetailScreen: React.FC<StoryDetailScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const story = route.params?.story;
  const onUpdate = route.params?.onUpdate;
  const onDelete = route.params?.onDelete;

  // State
  const [currentStory, setCurrentStory] = useState<Story | undefined>(story);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(story?.title || '');
  const [editContent, setEditContent] = useState(story?.content || '');
  const [editWhen, setEditWhen] = useState(story?.whenItHappened || '');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Animation
  const moreButtonScale = useRef(new Animated.Value(1)).current;
  const dropdownScale = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownContentOpacity = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  // Dropdown animation functions
  const openDropdown = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowMoreMenu(true);
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
      setShowMoreMenu(false);
      if (callback) callback();
    });
  };

  // Handlers
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleEdit = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditTitle(currentStory?.title || '');
    setEditContent(currentStory?.content || '');
    setEditWhen(currentStory?.whenItHappened || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && currentStory) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const updatedStory: Story = {
        ...currentStory,
        title: editTitle.trim() || editContent.trim().split('\n')[0].slice(0, 50),
        content: editContent.trim(),
        whenItHappened: editWhen.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      setCurrentStory(updatedStory);
      onUpdate?.(updatedStory);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    closeDropdown(() => {
      Alert.alert(
        'Delete Story',
        'Are you sure you want to delete this story? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              if (currentStory) {
                onDelete?.(currentStory.id);
              }
              navigation.goBack();
            },
          },
        ]
      );
    });
  };

  const handleMorePress = () => {
    if (showMoreMenu) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const handleButtonPressIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleButtonPressOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  if (!currentStory) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Story not found</Text>
      </View>
    );
  }

  const canSaveEdit = editContent.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Decorative accent */}
          <View style={styles.accentBar} />

          {/* When badge */}
          {currentStory.whenItHappened && (
            <View style={styles.whenBadge}>
              <Ionicons name="time-outline" size={14} color="#16A34A" />
              <Text style={styles.whenText}>{currentStory.whenItHappened}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{currentStory.title}</Text>
        </View>

        {/* Story Content */}
        <View style={styles.contentSection}>
          <View style={styles.storyTextContainer}>
            <View style={styles.storyAccentLine} />
            <Text style={styles.storyContent}>{currentStory.content}</Text>
          </View>
        </View>

        {/* Metadata footer */}
        <View style={styles.metadataSection}>
          <View style={styles.metadataRow}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.metadataText}>
              Added {new Date(currentStory.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          {currentStory.updatedAt !== currentStory.createdAt && (
            <View style={styles.metadataRow}>
              <Ionicons name="create-outline" size={14} color="#9CA3AF" />
              <Text style={styles.metadataText}>
                Updated {new Date(currentStory.updatedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dropdown overlay for closing */}
      {showMoreMenu && (
        <TouchableWithoutFeedback onPress={() => closeDropdown()}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Fixed Header with Gradient Fade */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, zIndex: showMoreMenu ? 100 : 10 }]} pointerEvents="box-none">
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
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>

          <View style={styles.moreButtonContainer}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleMorePress}
                onPressIn={() => handleButtonPressIn(moreButtonScale)}
                onPressOut={() => handleButtonPressOut(moreButtonScale)}
                style={{ zIndex: 20 }}
              >
                <Animated.View style={[styles.headerButton, { transform: [{ scale: moreButtonScale }] }]}>
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
                      style={styles.menuItem}
                      onPress={() => closeDropdown(() => handleEdit())}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItemIcon}>
                        <Ionicons name="pencil-outline" size={18} color="#6B7280" />
                      </View>
                      <Text style={styles.menuItemText}>Edit Story</Text>
                    </TouchableOpacity>

                    <View style={styles.menuDivider} />

                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={handleDelete}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItemIconDestructive}>
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </View>
                      <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete Story</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}
            </View>
        </View>
      </View>

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
            <Text style={styles.editModalTitle}>Edit Story</Text>
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={[styles.roundButton, !canSaveEdit && styles.roundButtonDisabled]}
              disabled={!canSaveEdit}
            >
              <Ionicons name="checkmark" size={20} color={canSaveEdit ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.editModalContent}>
            {/* Title Row */}
            <View style={styles.titleInputRow}>
              <TextInput
                style={styles.editTitleInput}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                value={editTitle}
                onChangeText={setEditTitle}
              />
            </View>

            {/* When Row */}
            <View style={styles.editWhenRow}>
              <Ionicons name="time-outline" size={18} color="#16A34A" />
              <TextInput
                style={styles.editWhenInput}
                placeholder="When? (e.g., 2024, Summer 2022)"
                placeholderTextColor="#9CA3AF"
                value={editWhen}
                onChangeText={setEditWhen}
              />
            </View>

            <View style={styles.inputDivider} />

            {/* Content Input */}
            <TextInput
              style={styles.editContentInput}
              placeholder="What happened? Share the moment, the feelings, the details that made it memorable..."
              placeholderTextColor="#9CA3AF"
              value={editContent}
              onChangeText={setEditContent}
              multiline
              textAlignVertical="top"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Fixed Header
  fixedHeader: {
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Hero Section
  heroSection: {
    marginBottom: 20,
    paddingTop: 8,
  },
  accentBar: {
    width: 40,
    height: 4,
    backgroundColor: '#16A34A',
    borderRadius: 2,
    marginBottom: 20,
  },
  whenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  whenText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16A34A',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  // Content Section
  contentSection: {
    marginBottom: 32,
  },
  storyTextContainer: {
    flexDirection: 'row',
  },
  storyAccentLine: {
    width: 3,
    backgroundColor: '#16A34A',
    borderRadius: 1.5,
    marginRight: 18,
  },
  storyContent: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 28,
    letterSpacing: 0.1,
  },

  // Metadata Section
  metadataSection: {
    paddingHorizontal: 4,
    gap: 8,
    marginBottom: 20,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },

  // Error
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 100,
  },

  // More Button & Inline Dropdown
  moreButtonContainer: {
    position: 'relative',
    zIndex: 100,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  inlineMenuContainer: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  menuItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemIconDestructive: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 14,
    marginVertical: 2,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuItemTextDanger: {
    color: '#DC2626',
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
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  editTitleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    paddingTop: 8, paddingBottom: 12,
  },
  editWhenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    marginBottom: 12,
  },
  editWhenInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 8,
  },
  inputDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  editContentInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    flex: 1,
    padding: 0,
  },
});

export default StoryDetailScreen;
