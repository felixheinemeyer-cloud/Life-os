import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  TextInput,
  Keyboard,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBooks, BookEntry } from '../context/BookContext';

// Types
interface BookVaultNewEntryScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface BookFormat {
  id: BookEntry['format'];
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface BookSearchResult {
  key: string;
  title: string;
  author: string;
  coverId?: number;
  coverUrl?: string;
  numberOfPages?: number;
}

// Book Formats
const BOOK_FORMATS: BookFormat[] = [
  { id: 'physical', name: 'Physical', icon: 'book-outline' },
  { id: 'ebook', name: 'Ebook', icon: 'tablet-portrait-outline' },
  { id: 'audiobook', name: 'Audiobook', icon: 'headset-outline' },
];

// Open Library API search
const searchBooks = async (query: string): Promise<BookSearchResult[]> => {
  if (query.trim().length < 2) return [];

  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,cover_i,number_of_pages_median`
    );
    const data = await response.json();

    return (data.docs || []).map((doc: any) => ({
      key: doc.key,
      title: doc.title,
      author: doc.author_name?.[0] || 'Unknown Author',
      coverId: doc.cover_i,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : undefined,
      numberOfPages: doc.number_of_pages_median || undefined,
    }));
  } catch (error) {
    console.error('Book search error:', error);
    return [];
  }
};

// Main Component
const BookVaultNewEntryScreen: React.FC<BookVaultNewEntryScreenProps> = ({ navigation }) => {
  // Get addEntry from context
  const { addEntry } = useBooks();

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
  const [selectedFormat, setSelectedFormat] = useState<BookEntry['format'] | null>(null);
  const [isReadingList, setIsReadingList] = useState(false);

  // Search state
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus states
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isAuthorFocused, setIsAuthorFocused] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(30)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(30)).current;
  const card3Opacity = useRef(new Animated.Value(0)).current;
  const card3TranslateY = useRef(new Animated.Value(30)).current;

  // Refs
  const authorInputRef = useRef<TextInput>(null);

  // Check if form is valid
  const isFormValid = title.trim().length > 0 && author.trim().length > 0;

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if title is too short
    if (title.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search by 400ms
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchBooks(title);
      setSearchResults(results);
      setShowResults(results.length > 0 && isTitleFocused);
      setIsSearching(false);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [title]);

  // Handle book selection from search results
  const handleSelectBook = (book: BookSearchResult) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTitle(book.title);
    setAuthor(book.author);
    setCoverUrl(book.coverUrl);
    setTotalPages(book.numberOfPages);
    setShowResults(false);
    setSearchResults([]);
    Keyboard.dismiss();
  };

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
      ]),
    ]).start();
  }, []);

  const handleSave = () => {
    if (!isFormValid) return;

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newEntry: BookEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      author: author.trim(),
      ...(selectedFormat && { format: selectedFormat }),
      ...(coverUrl && { coverUrl }),
      ...(totalPages && { totalPages }),
      isWatchlist: isReadingList,
      dateAdded: new Date().toISOString().split('T')[0],
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

  const handleFormatSelect = (formatId: BookEntry['format']) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Toggle: tap same format to deselect
    setSelectedFormat(selectedFormat === formatId ? null : formatId);
  };

  const handleReadingListToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsReadingList(!isReadingList);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.cancelButton}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Book</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
              activeOpacity={0.7}
              disabled={!isFormValid}
            >
              <Text style={[styles.saveButtonText, !isFormValid && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title & Author Card */}
          <Animated.View
            style={[
              styles.card,
              (isTitleFocused || isAuthorFocused) && styles.cardFocused,
              { opacity: card1Opacity, transform: [{ translateY: card1TranslateY }] },
            ]}
          >
            {/* Title Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="book-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.cardLabel}>Title</Text>
                {isSearching && (
                  <ActivityIndicator size="small" color="#F59E0B" style={styles.searchSpinner} />
                )}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Search for a book..."
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  // Clear cover, author, and page count if user is typing new title
                  if (coverUrl) {
                    setCoverUrl(undefined);
                    setAuthor('');
                    setTotalPages(undefined);
                  }
                }}
                onFocus={() => {
                  setIsTitleFocused(true);
                  if (searchResults.length > 0) {
                    setShowResults(true);
                  }
                }}
                onBlur={() => {
                  setIsTitleFocused(false);
                  // Delay hiding results to allow tap
                  setTimeout(() => setShowResults(false), 200);
                }}
                returnKeyType="next"
                onSubmitEditing={() => authorInputRef.current?.focus()}
              />

              {/* Autocomplete Dropdown */}
              {showResults && searchResults.length > 0 && (
                <View style={styles.autocompleteDropdown}>
                  {searchResults.map((book) => (
                    <TouchableOpacity
                      key={book.key}
                      style={styles.autocompleteItem}
                      onPress={() => handleSelectBook(book)}
                      activeOpacity={0.7}
                    >
                      {book.coverUrl ? (
                        <Image
                          source={{ uri: book.coverUrl }}
                          style={styles.autocompleteImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.autocompletePlaceholder}>
                          <Ionicons name="book" size={16} color="#F59E0B" />
                        </View>
                      )}
                      <View style={styles.autocompleteText}>
                        <Text style={styles.autocompleteTitle} numberOfLines={1}>
                          {book.title}
                        </Text>
                        <Text style={styles.autocompleteAuthor} numberOfLines={1}>
                          {book.author}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputDivider} />

            {/* Author Input */}
            <View style={styles.inputSection}>
              <View style={styles.cardLabelRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.cardLabel}>Author</Text>
              </View>
              <TextInput
                ref={authorInputRef}
                style={styles.textInput}
                placeholder="Author name..."
                placeholderTextColor="#9CA3AF"
                value={author}
                onChangeText={setAuthor}
                onFocus={() => setIsAuthorFocused(true)}
                onBlur={() => setIsAuthorFocused(false)}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </Animated.View>

          {/* Format Card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: card2Opacity, transform: [{ translateY: card2TranslateY }] },
            ]}
          >
            <View style={styles.cardLabelRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="apps-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.cardLabel}>Format</Text>
              <Text style={styles.optionalLabel}>optional</Text>
            </View>
            <View style={styles.chipsContainer}>
              {BOOK_FORMATS.map((format) => {
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

          {/* Wishlist Toggle Card */}
          <Animated.View
            style={[
              styles.card,
              { opacity: card3Opacity, transform: [{ translateY: card3TranslateY }] },
            ]}
          >
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={handleReadingListToggle}
              activeOpacity={0.7}
            >
              <View style={styles.toggleLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="bookmark-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.cardLabel}>To Read</Text>
              </View>
              <View
                style={[
                  styles.toggleButton,
                  isReadingList && styles.toggleButtonActive,
                ]}
              >
                <Ionicons
                  name={isReadingList ? 'checkmark' : 'add'}
                  size={14}
                  color={isReadingList ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.toggleButtonText,
                    isReadingList && styles.toggleButtonTextActive,
                  ]}
                >
                  {isReadingList ? 'To Read' : 'Add to List'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
      </View>
    </SafeAreaView>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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

  // Input Section
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

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  toggleButtonActive: {
    backgroundColor: '#F59E0B',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },

  // Chips Container
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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

  // Search & Autocomplete Styles
  searchSpinner: {
    marginLeft: 'auto',
  },
  autocompleteDropdown: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  autocompleteImage: {
    width: 40,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },
  autocompletePlaceholder: {
    width: 40,
    height: 56,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autocompleteText: {
    flex: 1,
  },
  autocompleteTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  autocompleteAuthor: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
  },
});

export default BookVaultNewEntryScreen;
