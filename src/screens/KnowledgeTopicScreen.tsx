import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ENTRY_ACTION_WIDTH = 140;

// Consistent teal color matching KnowledgeVaultScreen
const ACCENT_COLOR = '#0D9488';

// Types
interface KnowledgeTopic {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  lightColor: string;
  createdAt: string;
}

interface KnowledgeEntry {
  id: string;
  topicId: string;
  title: string;
  content: string;
  tags?: string[];
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

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

// Swipeable Entry Card Component
const SwipeableEntryCard: React.FC<{
  entry: KnowledgeEntry;
  topicColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
  index: number;
}> = ({ entry, topicColor, onEdit, onDelete, onSwipeStart, onSwipeEnd, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [hasCheckedLayout, setHasCheckedLayout] = useState(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleTextLayout = (e: any) => {
    if (!hasCheckedLayout) {
      setHasCheckedLayout(true);
      if (e.nativeEvent.lines.length > 3) {
        setNeedsExpansion(true);
      }
    }
  };

  const handleCardPress = () => {
    if (isOpen) {
      closeActions();
    } else if (needsExpansion) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIsExpanded(!isExpanded);
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
                numberOfLines={!hasCheckedLayout ? undefined : (isExpanded ? undefined : 3)}
                onTextLayout={handleTextLayout}
              >
                {entry.content}
              </Text>
              {needsExpansion && (
                <TouchableOpacity onPress={handleCardPress} style={swipeableEntryStyles.expandButton}>
                  <Text style={swipeableEntryStyles.expandButtonText}>
                    {isExpanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              )}
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
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 2,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
});

// Main Component
const KnowledgeTopicScreen = ({ navigation, route }: KnowledgeTopicScreenProps) => {
  const { topic, entries: initialEntries } = route.params;
  const insets = useSafeAreaInsets();

  // State
  const [entries, setEntries] = useState<KnowledgeEntry[]>(initialEntries);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [isSwipingEntry, setIsSwipingEntry] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;

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
    setEntryContent('');
    setModalVisible(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEntryTitle('');
    setEntryContent('');
    setEditingEntry(null);
    Keyboard.dismiss();
  };

  const handleSaveEntry = () => {
    if (entryContent.trim()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (editingEntry) {
        // Editing existing entry
        const updatedEntries = entries.map(e =>
          e.id === editingEntry.id
            ? {
                ...e,
                title: entryTitle.trim() || entryContent.trim().split('\n')[0].slice(0, 50),
                content: entryContent.trim(),
                updatedAt: new Date().toISOString(),
              }
            : e
        );
        setEntries(updatedEntries);
      } else {
        // Creating new entry
        const autoTitle = entryTitle.trim() || entryContent.trim().split('\n')[0].slice(0, 50);
        const newEntry: KnowledgeEntry = {
          id: Date.now().toString(),
          topicId: topic.id,
          title: autoTitle,
          content: entryContent.trim(),
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
    setEntryContent(entry.content);
    setModalVisible(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
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
    // TODO: Navigate to entry detail screen
    console.log('Entry pressed:', entry.title);
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

  return (
    <View style={styles.container}>
      {/* ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72 },
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
                <Ionicons name={topic.icon} size={24} color={ACCENT_COLOR} />
              </View>
              <Text style={styles.title}>{topic.name}</Text>
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
        <View style={styles.headerBlur}>
          <LinearGradient
            colors={[
              'rgba(247, 245, 242, 0.95)',
              'rgba(247, 245, 242, 0.85)',
              'rgba(247, 245, 242, 0.6)',
              'rgba(247, 245, 242, 0.3)',
              'rgba(247, 245, 242, 0.1)',
              'rgba(247, 245, 242, 0)',
            ]}
            locations={[0, 0.25, 0.5, 0.7, 0.85, 1]}
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
                <Ionicons name="chevron-back" size={24} color="#1F2937" />
              </TouchableOpacity>
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
              style={[styles.roundButton, !entryContent.trim() && styles.roundButtonDisabled]}
              disabled={!entryContent.trim()}
            >
              <Ionicons name="checkmark" size={20} color={entryContent.trim() ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              ref={titleInputRef}
              style={styles.modalTitleInput}
              placeholder="Title (optional)"
              placeholderTextColor="#9CA3AF"
              value={entryTitle}
              onChangeText={setEntryTitle}
              autoFocus
            />
            <TextInput
              style={styles.modalContentInput}
              placeholder="What did you learn?"
              placeholderTextColor="#9CA3AF"
              value={entryContent}
              onChangeText={setEntryContent}
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
    backgroundColor: '#F7F5F2',
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 65,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
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
    paddingVertical: 12,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  modalContentInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    flex: 1,
    padding: 0,
  },
});

export default KnowledgeTopicScreen;
