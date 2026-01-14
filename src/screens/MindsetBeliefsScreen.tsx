import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Modal,
  Platform,
  KeyboardAvoidingView,
  PanResponder,
  Keyboard,
  Pressable,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const ACTION_WIDTH = 140; // 48 + 12 + 48 + 16 + 16 (two circular buttons + gaps + padding)

interface MindsetBeliefsScreenProps {
  navigation: {
    goBack: () => void;
  };
}

interface BeliefEntry {
  id: string;
  content: string;
  createdAt: Date;
}

const MindsetBeliefsScreen: React.FC<MindsetBeliefsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Header animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  const [entries, setEntries] = useState<BeliefEntry[]>([
    {
      id: '1',
      content: 'The only way to do great work is to love what you do.',
      createdAt: new Date(),
    },
    {
      id: '2',
      content: 'Always act with integrity, even when no one is watching. Your character is defined by your actions in the dark.',
      createdAt: new Date(),
    },
    {
      id: '3',
      content: 'Growth over comfort. Every challenge is an opportunity to become stronger and wiser. Embrace discomfort as the path to excellence.',
      createdAt: new Date(),
    },
    {
      id: '4',
      content: 'Success is not final, failure is not fatal: it is the courage to continue that counts. The road to success is always under construction. What lies behind us and what lies before us are tiny matters compared to what lies within us. Your limitation is only your imagination. Dream big, work hard, stay focused, and surround yourself with good people.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BeliefEntry | null>(null);
  const [newContent, setNewContent] = useState('');
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fabScale = useRef(new Animated.Value(1)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const searchInputRef = useRef<TextInput>(null);

  // Header animation on mount
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

  // Filter entries based on search query
  const filteredEntries = entries.filter(entry =>
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSearching(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    Keyboard.dismiss();
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

  const handleAddPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setEditingEntry(null);
    setNewContent('');
    setModalVisible(true);
  };

  const handleEditPress = (entry: BeliefEntry) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingEntry(entry);
    setNewContent(entry.content);
    setModalVisible(true);
  };

  const handleDeletePress = (entryId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setEntries(entries.filter(e => e.id !== entryId));
  };

  const handleSave = () => {
    if (!newContent.trim()) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (editingEntry) {
      setEntries(entries.map(e =>
        e.id === editingEntry.id
          ? { ...e, content: newContent.trim() }
          : e
      ));
    } else {
      const newEntry: BeliefEntry = {
        id: Date.now().toString(),
        content: newContent.trim(),
        createdAt: new Date(),
      };
      setEntries([newEntry, ...entries]);
    }

    setModalVisible(false);
    setNewContent('');
    setEditingEntry(null);
  };

  const handleFabPressIn = () => {
    Animated.spring(fabScale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleFabPressOut = () => {
    Animated.spring(fabScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* ScrollView - scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 64 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSwipingCard}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable onPress={() => Keyboard.dismiss()}>
          {/* Scrollable Title */}
          <View style={styles.scrollableTitle}>
            <Text style={styles.title}>Mindset</Text>
            <Text style={styles.subtitle}>Your favorite quotes, values & guiding principles in one place</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                ref={searchInputRef}
                style={styles.searchBarInput}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="#C4C4C4" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Results Label */}
          {searchQuery.trim() && (
            <Text style={styles.searchResultsLabel}>
              {filteredEntries.length === 0
                ? 'No results'
                : `${filteredEntries.length} ${filteredEntries.length === 1 ? 'result' : 'results'}`}
            </Text>
          )}
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="diamond-outline" size={48} color="#C7D2FE" />
              </View>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first belief to get started
              </Text>
            </View>
          ) : filteredEntries.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noResultsTitle}>No entries found</Text>
              <Text style={styles.noResultsText}>Try a different search term</Text>
            </View>
          ) : (
            filteredEntries.map((entry) => (
              <BeliefCard
                key={entry.id}
                entry={entry}
                onEdit={() => handleEditPress(entry)}
                onDelete={() => handleDeletePress(entry.id)}
                onSwipeStart={() => setIsSwipingCard(true)}
                onSwipeEnd={() => setIsSwipingCard(false)}
              />
            ))
          )}
          <View style={styles.bottomSpacer} />
        </Pressable>
      </ScrollView>

      {/* Fixed Header with Blur Background */}
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
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleAddPress}
              onPressIn={handleFabPressIn}
              onPressOut={handleFabPressOut}
            >
              <Animated.View style={[styles.headerButton, { transform: [{ scale: fabScale }] }]}>
                <Ionicons name="add" size={24} color="#1F2937" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.roundButton}
              >
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.roundButton, !newContent.trim() && styles.roundButtonDisabled]}
                disabled={!newContent.trim()}
              >
                <Ionicons name="checkmark" size={20} color={newContent.trim() ? "#1F2937" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>

            {/* Content Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Write something that inspires you..."
                placeholderTextColor="#9CA3AF"
                value={newContent}
                onChangeText={setNewContent}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
    </View>
  );
};

// Belief Card Component with Swipe Actions
const BeliefCard: React.FC<{
  entry: BeliefEntry;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
}> = ({ entry, onEdit, onDelete, onSwipeStart, onSwipeEnd }) => {
  const [expanded, setExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const currentTranslateX = useRef(0);

  // Track current translateX value - set up listener once
  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    });
    return () => {
      translateX.removeListener(listenerId);
    };
  }, [translateX]);

  const openActions = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsOpen(true);
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [translateX]);

  const closeActions = useCallback(() => {
    setIsOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [translateX]);

  // Use a ref to track open state for PanResponder (avoids stale closure)
  const isOpenRef = useRef(false);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Capture horizontal swipes - prioritize over ScrollView
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe && Math.abs(gestureState.dx) > 5;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Capture phase - intercept before ScrollView gets the gesture
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        // Stop any running animation and disable scroll
        translateX.stopAnimation();
        onSwipeStart();
      },
      onPanResponderTerminationRequest: () => false, // Don't give up gesture to ScrollView
      onShouldBlockNativeResponder: () => true, // Block native scroll
      onPanResponderMove: (_, gestureState) => {
        let newValue;
        if (isOpenRef.current) {
          newValue = -ACTION_WIDTH + gestureState.dx;
        } else {
          newValue = gestureState.dx;
        }
        // Clamp between -ACTION_WIDTH and 0
        newValue = Math.max(-ACTION_WIDTH, Math.min(0, newValue));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPos = currentTranslateX.current;
        const velocity = gestureState.vx;
        onSwipeEnd();

        // Lower velocity threshold for easier swiping (like Apple Notes)
        if (velocity < -0.3) {
          // Swipe left -> open
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
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
          // Swipe right -> close
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

        // Position-based snap - lower threshold (1/3 instead of 1/2) for easier opening
        if (currentPos < -ACTION_WIDTH / 3) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
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
        // If gesture is interrupted, snap to nearest position
        const currentPos = currentTranslateX.current;
        onSwipeEnd();
        if (currentPos < -ACTION_WIDTH / 2) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
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

  const handleTextLayout = (e: any) => {
    if (!measured) {
      const { lines } = e.nativeEvent;
      if (lines.length > 3) {
        setNeedsExpansion(true);
      }
      setMeasured(true);
    }
  };

  const handleCardPress = () => {
    if (isOpen) {
      closeActions();
    } else if (needsExpansion) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setExpanded(!expanded);
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
    <View style={styles.cardWrapper}>
      {/* Action buttons behind the card */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.editAction]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[styles.cardAnimatedWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCardPress}
        >
          <View style={styles.card}>
            {/* Accent border */}
            <View style={styles.cardAccent} />

            {/* Content */}
            <Text
              style={styles.cardContent}
              numberOfLines={!measured ? undefined : (expanded ? undefined : 3)}
              onTextLayout={handleTextLayout}
            >
              {entry.content}
            </Text>

            {/* Expand Button */}
            {needsExpansion && (
              <TouchableOpacity onPress={handleCardPress} style={styles.expandButton}>
                <Text style={styles.expandButtonText}>
                  {expanded ? 'Show less' : 'Read more'}
                </Text>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#6366F1"
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  // Fixed Header
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
    overflow: 'hidden',
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  addButton: {
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
    height: 44,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  // Scrollable Title
  scrollableTitle: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  searchBarContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchResultsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },
  bottomSpacer: {
    height: 100,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // No Results
  noResults: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  noResultsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
  },

  // Card Styles
  cardWrapper: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  cardAnimatedWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 0,
    gap: 12,
  },
  swipeAction: {
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
  editAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#6B7280',
  },
  deleteAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    marginRight: 16,
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
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    gap: 2,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
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
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 24,
    padding: 0,
  },
});

export default MindsetBeliefsScreen;
