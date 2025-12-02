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
  Alert,
  TextInput,
  Keyboard,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBooks, BookEntry } from '../context/BookContext';

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

const BookVaultEntryScreen: React.FC<BookVaultEntryScreenProps> = ({ navigation, route }) => {
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

  // Refs
  const formatBadgeRef = useRef<View>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const coverScale = useRef(new Animated.Value(0.95)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

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

  const handleNotesPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('BookVaultNotes', { entry });
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
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconCircle}>
                <Ionicons name="bookmark-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Reading Progress</Text>
            </View>
          </View>

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

        {/* Notes Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardIconCircle}>
                <Ionicons name="document-text-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
          </View>

          {/* Notes Preview */}
          {entry.notes && (
            <Text style={styles.notesPreview} numberOfLines={3}>
              {entry.notes}
            </Text>
          )}

          {/* View Notes Button */}
          <TouchableOpacity
            style={styles.notesButton}
            onPress={handleNotesPress}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.notesButtonText}>
              {entry.notes ? 'View Notes' : 'Add Notes'}
            </Text>
          </TouchableOpacity>
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

          <View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleMoreOptions}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color="#1F2937" />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {isToRead && (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={handleRemoveToRead}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bookmark-outline" size={18} color="#6B7280" />
                    <Text style={styles.dropdownItemText}>Remove "To Read"</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.dropdownItem, styles.dropdownItemDestructive]}
                  onPress={handleDeleteEntry}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.dropdownItemTextDestructive}>Delete Entry</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Dropdown Overlay */}
      {showDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>
      )}

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
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 101,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownItemDestructive: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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

  // Notes
  notesPreview: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  notesEmpty: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  notesButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

});

export default BookVaultEntryScreen;
