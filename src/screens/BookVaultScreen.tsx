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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBooks, BookEntry } from '../context/BookContext';

// Types
interface BookVaultScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

// Format info helper
const getFormatInfo = (format: BookEntry['format']): { icon: keyof typeof Ionicons.glyphMap; label: string } => {
  switch (format) {
    case 'physical':
      return { icon: 'book-outline', label: 'Physical' };
    case 'ebook':
      return { icon: 'tablet-portrait-outline', label: 'Ebook' };
    case 'audiobook':
      return { icon: 'headset-outline', label: 'Audiobook' };
    default:
      return { icon: 'book-outline', label: 'Physical' };
  }
};

// Book Card Component
const BookCard: React.FC<{
  entry: BookEntry;
  onPress: () => void;
}> = ({ entry, onPress }) => {
  const formatInfo = entry.format ? getFormatInfo(entry.format) : null;

  return (
    <TouchableOpacity style={styles.bookCard} onPress={onPress} activeOpacity={0.8}>
      {/* Cover Image or Placeholder */}
      <View style={styles.coverContainer}>
        {entry.coverUrl ? (
          <Image
            source={{ uri: entry.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book" size={24} color="#F59E0B" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.bookCardContent}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {entry.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {entry.author}
        </Text>
        {/* Format Badge - only show if format is set */}
        {formatInfo && (
          <View style={styles.badgesRow}>
            <View style={styles.formatBadge}>
              <Ionicons name={formatInfo.icon} size={12} color="#6B7280" />
              <Text style={styles.formatBadgeText}>{formatInfo.label}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onAddPress: () => void }> = ({ onAddPress }) => {
  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="book-outline" size={56} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyStateTitle}>No books saved yet</Text>
      <Text style={styles.emptyStateText}>
        Build your reading list and track books you've read.
      </Text>
      <TouchableOpacity style={styles.emptyAddButton} onPress={onAddPress} activeOpacity={0.8}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyAddButtonText}>Add Book</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Component
const BookVaultScreen: React.FC<BookVaultScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { entries: bookEntries } = useBooks();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isReadingListFilter, setIsReadingListFilter] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const addButtonScale = useRef(new Animated.Value(1)).current;

  // Check if there are any entries
  const hasEntries = bookEntries.length > 0;

  // Count of reading list items
  const readingListCount = bookEntries.filter(entry => entry.isWatchlist).length;

  // Filtered entries based on search query and reading list filter
  const filteredEntries = bookEntries.filter((entry) => {
    // Filter by reading list if active
    if (isReadingListFilter && !entry.isWatchlist) {
      return false;
    }
    // Filter by search query if entered
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.author.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Handler for reading list filter toggle
  const handleReadingListToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsReadingListFilter(!isReadingListFilter);
  };

  useEffect(() => {
    // Header animation
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

  const handleAddPressIn = () => {
    Animated.spring(addButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleAddPressOut = () => {
    Animated.spring(addButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleAddEntry = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('BookVaultNewEntry');
  };

  const handleEntryPress = (entry: BookEntry) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Navigate to BookVaultEntry screen when created
    console.log('Book pressed:', entry.title);
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Scrollable Title */}
        <View style={styles.scrollableTitle}>
          <Text style={styles.title}>Book Vault</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
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

        {hasEntries ? (
          <>
            {/* Books Section */}
            <View style={styles.booksSection}>
              <View style={styles.booksSectionHeader}>
                <View style={styles.booksSectionTitleRow}>
                  <Text style={styles.booksSectionTitle}>
                    {searchQuery.trim()
                      ? `Results for "${searchQuery}"`
                      : isReadingListFilter
                        ? 'Reading List'
                        : 'All Books'}
                  </Text>
                </View>
                {/* Reading List Button */}
                {!searchQuery.trim() && (
                  <TouchableOpacity
                    style={[
                      styles.readingListButton,
                      isReadingListFilter && styles.readingListButtonActive,
                    ]}
                    onPress={handleReadingListToggle}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isReadingListFilter ? 'bookmark' : 'bookmark-outline'}
                      size={15}
                      color={isReadingListFilter ? '#FFFFFF' : '#1F2937'}
                    />
                    <Text
                      style={[
                        styles.readingListButtonText,
                        isReadingListFilter && styles.readingListButtonTextActive,
                      ]}
                    >
                      Reading List
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {filteredEntries.length > 0 ? (
                <View style={styles.cardsContainer}>
                  {filteredEntries.map((entry) => (
                    <BookCard
                      key={entry.id}
                      entry={entry}
                      onPress={() => handleEntryPress(entry)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.noResultsText}>No books found</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <EmptyState onAddPress={handleAddEntry} />
        )}
      </ScrollView>

      {/* Fixed Header with Blur Background */}
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
              onPress={handleAddEntry}
              onPressIn={handleAddPressIn}
              onPressOut={handleAddPressOut}
            >
              <Animated.View style={[styles.headerButton, { transform: [{ scale: addButtonScale }] }]}>
                <Ionicons name="add" size={24} color="#1F2937" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
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
    marginBottom: 0,
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
  scrollableTitle: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  // Search Bar
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Books Section
  booksSection: {
    marginBottom: 32,
  },
  booksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  booksSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  booksSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  readingListButtonActive: {
    backgroundColor: '#1F2937',
  },
  readingListButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  readingListButtonTextActive: {
    color: '#FFFFFF',
  },

  // Cards Container
  cardsContainer: {
    gap: 10,
  },

  // Book Card
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  coverContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  bookAuthor: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  formatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  chevronContainer: {
    padding: 4,
  },

  // No Results
  noResults: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 28,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});

export default BookVaultScreen;
