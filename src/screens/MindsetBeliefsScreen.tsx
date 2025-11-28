import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Modal,
  Platform,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const fabScale = useRef(new Animated.Value(1)).current;

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleAddPress}
              onPressIn={handleFabPressIn}
              onPressOut={handleFabPressOut}
            >
              <Animated.View style={[styles.addButton, { transform: [{ scale: fabScale }] }]}>
                <Ionicons name="add" size={24} color="#1F2937" />
              </Animated.View>
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Mindset</Text>
            <Text style={styles.subtitle}>Your favorite quotes, values & guiding principles in one place</Text>
          </View>
        </View>

        {/* Entries List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSwipingCard}
        >
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
          ) : (
            entries.map((entry) => (
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
        </ScrollView>

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
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </Text>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.modalSaveButton, !newContent.trim() && styles.modalSaveButtonDisabled]}
                disabled={!newContent.trim()}
              >
                <Text style={[styles.modalSaveText, !newContent.trim() && styles.modalSaveTextDisabled]}>
                  Save
                </Text>
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
    </SafeAreaView>
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
          <Ionicons name="pencil-outline" size={20} color="#6366F1" />
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  headerContent: {
    paddingHorizontal: 4,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
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
    borderColor: '#C7D2FE',
    shadowColor: '#6366F1',
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
  modalCloseButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  modalSaveTextDisabled: {
    color: '#9CA3AF',
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
