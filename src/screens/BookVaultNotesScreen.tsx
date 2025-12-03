import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useBooks, BookEntry, ChapterNote } from '../context/BookContext';

interface BookVaultNotesScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params: {
      entry: BookEntry;
    };
  };
}

type TabType = 'notes' | 'chapters';

const BookVaultNotesScreen: React.FC<BookVaultNotesScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { entry } = route.params;
  const { updateEntry } = useBooks();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [generalNotes, setGeneralNotes] = useState(entry.notes || '');
  const [chapters, setChapters] = useState<ChapterNote[]>(entry.chapterNotes || []);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [editingChapterTitle, setEditingChapterTitle] = useState<string | null>(null);

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mount animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto-save general notes
  useEffect(() => {
    if (generalNotes !== entry.notes) {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateEntry(entry.id, { notes: generalNotes });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [generalNotes]);

  // Auto-save chapters
  useEffect(() => {
    if (JSON.stringify(chapters) !== JSON.stringify(entry.chapterNotes)) {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateEntry(entry.id, { chapterNotes: chapters });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }, 1000);
    }
  }, [chapters]);

  // Handlers
  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Save before leaving
    if (generalNotes !== entry.notes) {
      updateEntry(entry.id, { notes: generalNotes });
    }
    if (JSON.stringify(chapters) !== JSON.stringify(entry.chapterNotes)) {
      updateEntry(entry.id, { chapterNotes: chapters });
    }
    navigation.goBack();
  };

  const handleTabChange = (tab: TabType) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const handleAddChapter = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newChapter: ChapterNote = {
      id: Date.now().toString(),
      title: `Chapter ${chapters.length + 1}`,
      notes: '',
      createdAt: new Date().toISOString(),
    };
    setChapters([...chapters, newChapter]);
    setExpandedChapterId(newChapter.id);
    setEditingChapterTitle(newChapter.id);
  };

  const handleChapterPress = (chapterId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedChapterId(expandedChapterId === chapterId ? null : chapterId);
  };

  const handleChapterTitleChange = (chapterId: string, title: string) => {
    setChapters(chapters.map(ch =>
      ch.id === chapterId ? { ...ch, title } : ch
    ));
  };

  const handleChapterNotesChange = (chapterId: string, notes: string) => {
    setChapters(chapters.map(ch =>
      ch.id === chapterId ? { ...ch, notes } : ch
    ));
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const chapter = chapters.find(ch => ch.id === chapterId);
    Alert.alert(
      'Delete Chapter',
      `Are you sure you want to delete "${chapter?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setChapters(chapters.filter(ch => ch.id !== chapterId));
            if (expandedChapterId === chapterId) {
              setExpandedChapterId(null);
            }
          },
        },
      ]
    );
  };

  const getNotesPreview = (notes: string): string => {
    if (!notes) return 'Tap to add notes';
    const firstLine = notes.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  };

  const chaptersWithNotes = chapters.filter(ch => ch.notes && ch.notes.trim().length > 0).length;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.roundButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {entry.title}
              </Text>
              {saveStatus !== 'idle' && (
                <Text style={styles.saveStatus}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.roundButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={20} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControlContainer}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, activeTab === 'notes' && styles.segmentButtonActive]}
              onPress={() => handleTabChange('notes')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, activeTab === 'notes' && styles.segmentTextActive]}>
                Notes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, activeTab === 'chapters' && styles.segmentButtonActive]}
              onPress={() => handleTabChange('chapters')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, activeTab === 'chapters' && styles.segmentTextActive]}>
                Chapters
              </Text>
              {chaptersWithNotes > 0 && (
                <View style={styles.chaptersBadge}>
                  <Text style={styles.chaptersBadgeText}>{chaptersWithNotes}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {activeTab === 'notes' ? (
            // General Notes Tab
            <View style={styles.notesContainer}>
              <TextInput
                style={styles.notesInput}
                value={generalNotes}
                onChangeText={setGeneralNotes}
                placeholder="Write your thoughts about this book..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                scrollEnabled
              />
            </View>
          ) : (
            // Chapters Tab
            <ScrollView
              style={styles.chaptersScrollView}
              contentContainerStyle={styles.chaptersContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {chapters.length === 0 ? (
                // Empty State
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <Ionicons name="book-outline" size={48} color="#D1D5DB" />
                  </View>
                  <Text style={styles.emptyStateTitle}>No chapters yet</Text>
                  <Text style={styles.emptyStateText}>
                    Add chapters to organize your notes by section
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={handleAddChapter}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.emptyStateButtonText}>Add First Chapter</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Chapter List
                <>
                  {/* Add Chapter Button */}
                  <TouchableOpacity
                    style={styles.addChapterButton}
                    onPress={handleAddChapter}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color="#F59E0B" />
                    <Text style={styles.addChapterText}>Add Chapter</Text>
                  </TouchableOpacity>

                  {chapters.map((chapter, index) => (
                    <View key={chapter.id} style={styles.chapterCard}>
                      <TouchableOpacity
                        style={styles.chapterHeader}
                        onPress={() => handleChapterPress(chapter.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.chapterHeaderLeft}>
                          <View style={[
                            styles.chapterIndicator,
                            chapter.notes && chapter.notes.trim() ? styles.chapterIndicatorFilled : {}
                          ]} />
                          {editingChapterTitle === chapter.id ? (
                            <TextInput
                              style={styles.chapterTitleInput}
                              value={chapter.title}
                              onChangeText={(text) => handleChapterTitleChange(chapter.id, text)}
                              onBlur={() => setEditingChapterTitle(null)}
                              autoFocus
                              selectTextOnFocus
                            />
                          ) : (
                            <TouchableOpacity
                              onPress={() => setEditingChapterTitle(chapter.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.chapterTitle}>{chapter.title}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={styles.chapterHeaderRight}>
                          <TouchableOpacity
                            style={styles.chapterDeleteButton}
                            onPress={() => handleDeleteChapter(chapter.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                          </TouchableOpacity>
                          <Ionicons
                            name={expandedChapterId === chapter.id ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#9CA3AF"
                          />
                        </View>
                      </TouchableOpacity>

                      {expandedChapterId !== chapter.id && (
                        <Text style={styles.chapterPreview} numberOfLines={1}>
                          {getNotesPreview(chapter.notes)}
                        </Text>
                      )}

                      {expandedChapterId === chapter.id && (
                        <View style={styles.chapterNotesContainer}>
                          <TextInput
                            style={styles.chapterNotesInput}
                            value={chapter.notes}
                            onChangeText={(text) => handleChapterNotesChange(chapter.id, text)}
                            placeholder="Write your notes for this chapter..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                          />
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F7F5F2',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  saveStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Segmented Control
  segmentedControlContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#1F2937',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  chaptersBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  chaptersBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
  },

  // Notes Tab
  notesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notesInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Chapters Tab
  chaptersScrollView: {
    flex: 1,
  },
  chaptersContent: {
    paddingHorizontal: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Chapter Card
  chapterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  chapterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  chapterIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  chapterIndicatorFilled: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  chapterTitleInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    padding: 0,
    minWidth: 150,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  chapterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterDeleteButton: {
    padding: 4,
  },
  chapterPreview: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingLeft: 36,
  },
  chapterNotesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chapterNotesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  // Add Chapter Button
  addChapterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  addChapterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
});

export default BookVaultNotesScreen;
