import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  Alert,
  TextInput,
  Keyboard,
  Image,
  Modal,
  KeyboardAvoidingView,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBooks, BookEntry, ChapterNote } from '../context/BookContext';

const NOTE_ACTION_WIDTH = 140;

// Types
interface BookVaultEntryScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
  route: {
    params: {
      entry: BookEntry;
    };
  };
}

// Format info helper
const getFormatInfo = (format?: BookEntry['format']): { icon: keyof typeof Ionicons.glyphMap; label: string } | null => {
  if (!format) return null;
  switch (format) {
    case 'physical':
      return { icon: 'book-outline', label: 'Physical' };
    case 'ebook':
      return { icon: 'tablet-portrait-outline', label: 'Ebook' };
    case 'audiobook':
      return { icon: 'headset-outline', label: 'Audiobook' };
    default:
      return null;
  }
};

// Format date helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const BookVaultEntryScreen = ({ navigation, route }: BookVaultEntryScreenProps) => {
  const insets = useSafeAreaInsets();
  const { entry } = route.params;
  const { updateEntry, deleteEntry } = useBooks();

  // State
  const [currentPage, setCurrentPage] = useState<string>(
    entry.currentPage?.toString() || ''
  );
  const [totalPages, setTotalPages] = useState<string>(
    entry.totalPages?.toString() || ''
  );
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [isToRead, setIsToRead] = useState(entry.isWatchlist);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<BookEntry['format']>(entry.format);
  const [formatBadgeLayout, setFormatBadgeLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [chapterNotes, setChapterNotes] = useState<ChapterNote[]>(entry.chapterNotes || []);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<ChapterNote | null>(null);
  const [isSwipingNote, setIsSwipingNote] = useState(false);
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);

  // Refs
  const formatBadgeRef = useRef<View>(null);
  const noteTitleInputRef = useRef<TextInput>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const coverScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const progressAccordionAnim = useRef(new Animated.Value(0)).current;
  const progressChevronAnim = useRef(new Animated.Value(1)).current;

  // Derived data
  const formatInfo = getFormatInfo(currentFormat);
  const progress = currentPage && totalPages
    ? Math.min(100, Math.round((parseInt(currentPage) / parseInt(totalPages)) * 100))
    : null;

  // Mount animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(coverScale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handlers
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Save progress before going back
    saveProgress();
    navigation.goBack();
  };

  const handleMoreOptions = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDropdown(!showDropdown);
  };

  const handleDeleteEntry = () => {
    setShowDropdown(false);
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            deleteEntry(entry.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRemoveToRead = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDropdown(false);
    if (isToRead) {
      setIsToRead(false);
      updateEntry(entry.id, { isWatchlist: false });
    }
  };

  const handleAddToRead = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowDropdown(false);
    if (!isToRead) {
      setIsToRead(true);
      updateEntry(entry.id, { isWatchlist: true });
    }
  };

  const handleFormatPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Measure the badge position before showing dropdown
    if (formatBadgeRef.current) {
      formatBadgeRef.current.measureInWindow((x, y, width, height) => {
        setFormatBadgeLayout({ x, y, width, height });
        setShowFormatDropdown(!showFormatDropdown);
      });
    } else {
      setShowFormatDropdown(!showFormatDropdown);
    }
  };

  const handleFormatSelect = (format: BookEntry['format']) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowFormatDropdown(false);
    setCurrentFormat(format);
    updateEntry(entry.id, { format });
  };

  const saveProgress = () => {
    const updates: Partial<BookEntry> = {};
    const parsedCurrent = parseInt(currentPage);
    const parsedTotal = parseInt(totalPages);

    if (!isNaN(parsedCurrent) && parsedCurrent >= 0) {
      updates.currentPage = parsedCurrent;
    } else if (currentPage === '') {
      updates.currentPage = undefined;
    }

    if (!isNaN(parsedTotal) && parsedTotal > 0) {
      updates.totalPages = parsedTotal;
    } else if (totalPages === '') {
      updates.totalPages = undefined;
    }

    if (Object.keys(updates).length > 0) {
      updateEntry(entry.id, updates);
    }
  };

  const handleProgressBlur = () => {
    setIsEditingProgress(false);
    saveProgress();
    Keyboard.dismiss();
  };

  const toggleProgressSection = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const toValue = isProgressExpanded ? 0 : 1;
    setIsProgressExpanded(!isProgressExpanded);

    Animated.parallel([
      Animated.spring(progressAccordionAnim, {
        toValue,
        useNativeDriver: false,
        friction: 10,
        tension: 100,
      }),
      Animated.spring(progressChevronAnim, {
        toValue: isProgressExpanded ? 1 : 0,
        useNativeDriver: true,
        friction: 10,
        tension: 100,
      }),
    ]).start();
  };

  const handleOpenNotesModal = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setShowNotesModal(true);
    setTimeout(() => noteTitleInputRef.current?.focus(), 100);
  };

  const handleEditNote = (note: ChapterNote) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.notes);
    setShowNotesModal(true);
  };

  const handleCloseNotesModal = () => {
    setShowNotesModal(false);
    setNoteTitle('');
    setNoteContent('');
    setEditingNote(null);
    Keyboard.dismiss();
  };

  const handleSaveNote = () => {
    if (noteContent.trim()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const title = noteTitle.trim();

      if (editingNote) {
        // Update existing note
        const updatedNotes = chapterNotes.map(n =>
          n.id === editingNote.id
            ? { ...n, title, notes: noteContent.trim() }
            : n
        );
        setChapterNotes(updatedNotes);
        updateEntry(entry.id, { chapterNotes: updatedNotes });
      } else {
        // Add new note
        const newNote: ChapterNote = {
          id: Date.now().toString(),
          title,
          notes: noteContent.trim(),
          createdAt: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...chapterNotes];
        setChapterNotes(updatedNotes);
        updateEntry(entry.id, { chapterNotes: updatedNotes });
      }
      handleCloseNotesModal();
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    const updatedNotes = chapterNotes.filter(n => n.id !== noteId);
    setChapterNotes(updatedNotes);
    updateEntry(entry.id, { chapterNotes: updatedNotes });
  };

  const handleToReadToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newValue = !isToRead;
    setIsToRead(newValue);
    updateEntry(entry.id, { isWatchlist: newValue });
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 64 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSwipingNote}
        keyboardShouldPersistTaps="handled"
      >
        {/* Book Cover Hero */}
        <Animated.View
          style={[
            styles.coverContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: coverScale }],
            },
          ]}
        >
          {entry.coverUrl ? (
            <Image
              source={{ uri: entry.coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book" size={48} color="#F59E0B" />
            </View>
          )}
        </Animated.View>

        {/* Book Info Section */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{entry.title}</Text>
          <Text style={styles.author}>{entry.author}</Text>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            {/* To Read Badge - Tappable */}
            <TouchableOpacity
              style={[styles.toReadBadge, !isToRead && styles.toReadBadgeInactive]}
              onPress={handleToReadToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isToRead ? 'bookmark' : 'bookmark-outline'}
                size={12}
                color={isToRead ? '#F59E0B' : '#FFFFFF'}
              />
              <Text style={[styles.toReadBadgeText, !isToRead && styles.toReadBadgeTextInactive]}>
                {isToRead ? 'To Read' : 'Add To Read'}
              </Text>
            </TouchableOpacity>
            {/* Format Badge */}
            <View ref={formatBadgeRef} style={styles.formatBadgeContainer}>
              <TouchableOpacity
                style={styles.badge}
                onPress={handleFormatPress}
                activeOpacity={0.7}
              >
                {formatInfo ? (
                  <>
                    <Ionicons name={formatInfo.icon} size={12} color="#6B7280" />
                    <Text style={styles.badgeText}>{formatInfo.label}</Text>
                    <Ionicons name="chevron-down" size={12} color="#6B7280" />
                  </>
                ) : (
                  <>
                    <Ionicons name="add" size={12} color="#6B7280" />
                    <Text style={styles.badgeText}>Add Format</Text>
                    <Ionicons name="chevron-down" size={12} color="#6B7280" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Reading Progress Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.cardHeaderTouchable,
              !isProgressExpanded && { marginBottom: 0 },
            ]}
            onPress={toggleProgressSection}
            activeOpacity={0.7}
          >
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconCircle}>
                <Ionicons name="bookmark-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Reading Progress</Text>
            </View>
            <Animated.View
              style={{
                transform: [{
                  rotate: progressChevronAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['180deg', '0deg'],
                  }),
                }],
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </Animated.View>
          </TouchableOpacity>

          {/* Collapsible Content */}
          <Animated.View
            style={{
              maxHeight: progressAccordionAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
              opacity: progressAccordionAnim,
              overflow: 'hidden',
            }}
          >
            {/* Progress Bar (if both values set) */}
            {progress !== null && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressPercentage}>{progress}%</Text>
              </View>
            )}

            {/* Page Input Row */}
            <View style={styles.pageInputRow}>
              <View style={styles.pageInputGroup}>
                <Text style={styles.pageInputLabel}>Current Page</Text>
                <TextInput
                  style={styles.pageInput}
                  value={currentPage}
                  onChangeText={setCurrentPage}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onFocus={() => setIsEditingProgress(true)}
                  onBlur={handleProgressBlur}
                />
              </View>

              <View style={styles.pageDivider}>
                <Text style={styles.pageDividerText}>of</Text>
              </View>

              <View style={styles.pageInputGroup}>
                <Text style={styles.pageInputLabel}>Total Pages</Text>
                <TextInput
                  style={styles.pageInput}
                  value={totalPages}
                  onChangeText={setTotalPages}
                  placeholder="—"
                  placeholderTextColor="#D1D5DB"
                keyboardType="number-pad"
                returnKeyType="done"
                onFocus={() => setIsEditingProgress(true)}
                onBlur={handleProgressBlur}
              />
            </View>
          </View>
          </Animated.View>
        </Animated.View>

        {/* Notes Section */}
        <Animated.View
          style={[
            styles.notesSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Notes Header */}
          <View style={styles.notesSectionHeader}>
            <Text style={styles.notesSectionTitle}>Notes</Text>
            <Text style={styles.notesSectionSubtitle}>Insights and thoughts about this book</Text>
          </View>

          {/* Add Note Card */}
          <TouchableOpacity
            style={styles.addNoteCard}
            onPress={handleOpenNotesModal}
            activeOpacity={0.7}
          >
            <Text style={styles.addNotePlaceholder}>Add a note...</Text>
            <View style={styles.addNoteButton}>
              <Ionicons name="add" size={20} color="#F59E0B" />
            </View>
          </TouchableOpacity>

          {/* Note Cards */}
          {chapterNotes.map((note) => (
            <SwipeableNoteCard
              key={note.id}
              note={note}
              onEdit={() => handleEditNote(note)}
              onDelete={() => handleDeleteNote(note.id)}
              onSwipeStart={() => setIsSwipingNote(true)}
              onSwipeEnd={() => setIsSwipingNote(false)}
            />
          ))}
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top }]} pointerEvents="box-none">
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

        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMoreOptions}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color="#1F2937" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Options Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownModalOverlay}>
            <View style={[styles.dropdownMenu, { top: insets.top + 56, right: 16 }]}>
              {isToRead ? (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleRemoveToRead}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark-outline" size={18} color="#6B7280" />
                  <Text style={styles.dropdownItemText}>Remove "To Read"</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleAddToRead}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark" size={18} color="#F59E0B" />
                  <Text style={styles.dropdownItemText}>Add "To Read"</Text>
                </TouchableOpacity>
              )}
              <View style={styles.dropdownDivider} />
              <TouchableOpacity
                style={[styles.dropdownItem, styles.dropdownItemDestructive]}
                onPress={handleDeleteEntry}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.dropdownItemTextDestructive}>Delete Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Format Dropdown Modal */}
      <Modal
        visible={showFormatDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormatDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFormatDropdown(false)}>
          <View style={styles.formatModalOverlay}>
            <View
              style={[
                styles.formatDropdownMenu,
                {
                  position: 'absolute',
                  top: formatBadgeLayout.y + formatBadgeLayout.height + 6,
                  left: formatBadgeLayout.x + formatBadgeLayout.width - 140,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('physical')}
                activeOpacity={0.6}
              >
                <Ionicons name="book-outline" size={16} color={currentFormat === 'physical' ? '#F59E0B' : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'physical' && styles.formatDropdownItemTextActive]}>Physical</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('ebook')}
                activeOpacity={0.6}
              >
                <Ionicons name="tablet-portrait-outline" size={16} color={currentFormat === 'ebook' ? '#F59E0B' : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'ebook' && styles.formatDropdownItemTextActive]}>Ebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatDropdownItem}
                onPress={() => handleFormatSelect('audiobook')}
                activeOpacity={0.6}
              >
                <Ionicons name="headset-outline" size={16} color={currentFormat === 'audiobook' ? '#F59E0B' : '#6B7280'} />
                <Text style={[styles.formatDropdownItemText, currentFormat === 'audiobook' && styles.formatDropdownItemTextActive]}>Audiobook</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseNotesModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={handleCloseNotesModal}
              style={styles.modalRoundButton}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
            <TouchableOpacity
              onPress={handleSaveNote}
              style={[styles.modalRoundButton, !noteContent.trim() && styles.modalRoundButtonDisabled]}
              disabled={!noteContent.trim()}
            >
              <Ionicons name="checkmark" size={20} color={noteContent.trim() ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.titleInputRow}>
              <TextInput
                ref={noteTitleInputRef}
                style={styles.modalTitleInput}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                value={noteTitle}
                onChangeText={setNoteTitle}
              />
              <Text style={styles.optionalLabel}>optional</Text>
            </View>
            <TextInput
              style={styles.modalContentInput}
              placeholder="What did you learn?"
              placeholderTextColor="#9CA3AF"
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// Swipeable Note Card Component
const SwipeableNoteCard: React.FC<{
  note: ChapterNote;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart: () => void;
  onSwipeEnd: () => void;
}> = ({ note, onEdit, onDelete, onSwipeStart, onSwipeEnd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const [measured, setMeasured] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const currentTranslateX = useRef(0);

  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    });
    return () => {
      translateX.removeListener(listenerId);
    };
  }, [translateX]);

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
          newValue = -NOTE_ACTION_WIDTH + gestureState.dx;
        } else {
          newValue = gestureState.dx;
        }
        newValue = Math.max(-NOTE_ACTION_WIDTH, Math.min(0, newValue));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPos = currentTranslateX.current;
        const velocity = gestureState.vx;
        onSwipeEnd();

        if (velocity < -0.3) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -NOTE_ACTION_WIDTH,
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

        if (currentPos < -NOTE_ACTION_WIDTH / 3) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -NOTE_ACTION_WIDTH,
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
        if (currentPos < -NOTE_ACTION_WIDTH / 2) {
          setIsOpen(true);
          Animated.spring(translateX, {
            toValue: -NOTE_ACTION_WIDTH,
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
    <View style={styles.noteCardWrapper}>
      {/* Action buttons behind the card */}
      <View style={styles.noteActionsContainer}>
        <TouchableOpacity
          style={[styles.noteSwipeAction, styles.noteEditAction]}
          onPress={handleEdit}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.noteSwipeAction, styles.noteDeleteAction]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Swipeable card */}
      <Animated.View
        style={[styles.noteCardAnimated, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={1} onPress={handleCardPress}>
          <View style={styles.noteCard}>
            <View style={styles.noteAccentBar} />
            <View style={styles.noteContent}>
              {note.title ? (
                <Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text>
              ) : null}
              <Text
                style={styles.noteSnippet}
                numberOfLines={!measured ? undefined : (expanded ? undefined : 3)}
                onTextLayout={handleTextLayout}
              >
                {note.notes}
              </Text>
              {needsExpansion && (
                <TouchableOpacity onPress={handleCardPress} style={styles.noteExpandButton}>
                  <Text style={styles.noteExpandButtonText}>
                    {expanded ? 'Show less' : 'Read more'}
                  </Text>
                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 16,
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Dropdown Menu
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  dropdownItemDestructive: {
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  dropdownItemTextDestructive: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },

  // Book Cover
  coverContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  coverPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  // Info Section
  infoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  author: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  toReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  toReadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  toReadBadgeInactive: {
    backgroundColor: '#1F2937',
  },
  toReadBadgeTextInactive: {
    color: '#FFFFFF',
  },

  // Format Badge & Dropdown
  formatBadgeContainer: {
    position: 'relative',
  },
  formatModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  formatDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  formatDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  formatDropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formatDropdownItemTextActive: {
    color: '#F59E0B',
    fontWeight: '600',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: -0.3,
  },

  // Progress Bar
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    minWidth: 40,
    textAlign: 'right',
  },

  // Page Inputs
  pageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageInputGroup: {
    flex: 1,
  },
  pageInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  pageInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pageDivider: {
    paddingTop: 18,
  },
  pageDividerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Notes Section
  notesSection: {
    marginTop: 18,
    marginBottom: 14,
  },
  notesSectionHeader: {
    marginBottom: 16,
  },
  notesSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  notesSectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  addNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addNotePlaceholder: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  addNoteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteCardWrapper: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  noteCardAnimated: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  noteActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 0,
    gap: 12,
  },
  noteSwipeAction: {
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
  noteEditAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#6B7280',
  },
  noteDeleteAction: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    marginRight: 16,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  noteAccentBar: {
    width: 4,
    backgroundColor: '#F59E0B',
  },
  noteContent: {
    flex: 1,
    padding: 16,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  noteSnippet: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 22,
  },
  noteExpandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 2,
  },
  noteExpandButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
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
  modalRoundButton: {
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
  modalRoundButtonDisabled: {
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
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  modalTitleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 12,
  },
  optionalLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
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

export default BookVaultEntryScreen;
