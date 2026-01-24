import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Types
interface StoryBankScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
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

// Mock Stories
const MOCK_STORIES: Story[] = [
  {
    id: '1',
    title: 'The Time I Got Lost in Tokyo',
    content: 'I wandered into a tiny alley and found the best ramen shop run by a 90-year-old woman who spoke no English. We communicated through gestures and she gave me extra noodles for free.',
    whenItHappened: '2023',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Meeting My Mentor',
    content: 'I was nervous walking into that coffee shop. Little did I know that one conversation would change the trajectory of my career entirely. She saw potential in me that I couldn\'t see myself.',
    whenItHappened: '2022',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
  },
  {
    id: '3',
    title: 'The Wedding Speech Disaster',
    content: 'I practiced for weeks. But when I got up there, I completely blanked and accidentally called the bride by my ex\'s name. The room went silent... then my buddy burst out laughing and saved the moment.',
    whenItHappened: '2021',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
  },
  {
    id: '4',
    title: 'Dad\'s Surprise Visit',
    content: 'I hadn\'t seen my dad in two years. One morning, I opened the door to get my delivery and there he was, suitcase in hand, tears in his eyes. We hugged for what felt like an hour.',
    whenItHappened: '2023',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-10',
  },
  {
    id: '5',
    title: 'The Interview That Changed Everything',
    content: 'I bombed the technical questions. But instead of giving up, I asked the interviewer what I should learn. He spent 30 minutes teaching me. A month later, I aced the re-interview.',
    whenItHappened: '2020',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
  },
  {
    id: '6',
    title: 'First Date at the Wrong Restaurant',
    content: 'I showed up to the fancy Italian place she suggested. She showed up to a completely different restaurant with the same name across town. We ended up meeting at a hot dog stand in the middle.',
    whenItHappened: '2019',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20',
  },
];

// Add Story Card Component
const AddStoryCard: React.FC<{
  onPress: () => void;
}> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.addStoryCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.addStoryIconContainer}>
        <Ionicons name="add" size={18} color="#16A34A" />
      </View>
      <View style={styles.addStoryContent}>
        <Text style={styles.addStoryTitle}>New Story</Text>
        <Text style={styles.addStorySubtitle}>Capture a memory</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
};

// Story Card Component
const StoryCard: React.FC<{
  story: Story;
  onPress: () => void;
}> = ({ story, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.storyCard,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Icon */}
        <View style={styles.storyIconContainer}>
          <Ionicons name="bookmark" size={16} color="#16A34A" />
        </View>

        {/* Card content */}
        <View style={styles.storyCardContent}>
          {/* Title */}
          <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>

          {/* Content Preview */}
          <Text style={styles.storySnippet} numberOfLines={2}>{story.content}</Text>

          {/* Year */}
          {story.whenItHappened && (
            <Text style={styles.storyYear}>{story.whenItHappened}</Text>
          )}
        </View>

        {/* Chevron */}
        <View style={styles.storyChevron}>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Empty State Component
const EmptyState: React.FC<{
  onAddPress: () => void;
}> = ({ onAddPress }) => {
  return (
    <View style={styles.emptyStateContainer}>
      <LinearGradient
        colors={['#DCFCE7', '#BBF7D0', '#86EFAC']}
        style={styles.emptyStateCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.emptyIconCircle}>
          <Ionicons name="bookmark" size={40} color="#16A34A" />
        </View>
        <Text style={styles.emptyStateTitle}>Your Story Bank is Empty</Text>
        <Text style={styles.emptyStateText}>
          Every life is full of stories worth remembering.{'\n'}Start capturing yours.
        </Text>
      </LinearGradient>

      <TouchableOpacity
        style={styles.emptyAddButton}
        onPress={onAddPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.emptyAddButtonText}>Write Your First Story</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Component
const StoryBankScreen: React.FC<StoryBankScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // State
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [storyWhen, setStoryWhen] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const titleInputRef = useRef<TextInput>(null);

  // Filtered stories
  const filteredStories = stories.filter(story => {
    const matchesSearch = !searchQuery.trim() ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Sort by year (newest first), then by createdAt
  const sortedStories = [...filteredStories].sort((a, b) => {
    const yearA = parseInt(a.whenItHappened || '0');
    const yearB = parseInt(b.whenItHappened || '0');
    if (yearB !== yearA) return yearB - yearA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Handlers
  const handleOpenModal = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalVisible(true);
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setStoryTitle('');
    setStoryContent('');
    setStoryWhen('');
    Keyboard.dismiss();
  };

  const handleSaveStory = () => {
    if (storyContent.trim()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const autoTitle = storyTitle.trim() || storyContent.trim().split('\n')[0].slice(0, 50);
      const newStory: Story = {
        id: Date.now().toString(),
        title: autoTitle,
        content: storyContent.trim(),
        whenItHappened: storyWhen.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setStories(prev => [newStory, ...prev]);
      handleCloseModal();
    }
  };

  const handleStoryUpdate = (updatedStory: Story) => {
    setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
  };

  const handleStoryDelete = (storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
  };

  const handleStoryPress = (story: Story) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('StoryDetail', {
      story,
      onUpdate: handleStoryUpdate,
      onDelete: handleStoryDelete,
    });
  };

  const canSave = storyContent.trim();

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
        keyboardDismissMode="on-drag"
      >
        <Pressable onPress={() => Keyboard.dismiss()}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Story Bank</Text>
          </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
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
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {stories.length > 0 ? (
          <>
            {/* Add Story Card */}
            <AddStoryCard onPress={handleOpenModal} />

            {/* Stories Section */}
            <View style={styles.storiesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {searchQuery.trim() ? `Results` : 'All Stories'}
                </Text>
              </View>

              {/* Story Cards */}
              {sortedStories.length > 0 ? (
                <View style={styles.storiesContainer}>
                  {sortedStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onPress={() => handleStoryPress(story)}
                    />
                  ))}
                </View>
              ) : searchQuery.trim() ? (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.noResultsTitle}>No stories found</Text>
                  <Text style={styles.noResultsText}>Try a different search term</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <EmptyState onAddPress={handleOpenModal} />
        )}
        </Pressable>
      </ScrollView>

      {/* Fixed Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
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

        <View style={styles.header} pointerEvents="box-none">
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Story Modal */}
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
            <Text style={styles.modalTitle}>New Story</Text>
            <TouchableOpacity
              onPress={handleSaveStory}
              style={[styles.roundButton, !canSave && styles.roundButtonDisabled]}
              disabled={!canSave}
            >
              <Ionicons name="checkmark" size={20} color={canSave ? "#1F2937" : "#9CA3AF"} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Title Row */}
            <View style={styles.titleInputRow}>
              <TextInput
                ref={titleInputRef}
                style={styles.modalTitleInput}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                value={storyTitle}
                onChangeText={setStoryTitle}
              />
            </View>

            {/* When Row */}
            <View style={styles.whenInputRow}>
              <Ionicons name="time-outline" size={18} color="#16A34A" />
              <TextInput
                style={styles.whenInput}
                placeholder="When? (e.g., 2024, Summer 2022)"
                placeholderTextColor="#9CA3AF"
                value={storyWhen}
                onChangeText={setStoryWhen}
              />
            </View>

            <View style={styles.inputDivider} />

            {/* Content Input */}
            <TextInput
              style={styles.modalContentInput}
              placeholder="What happened? Share the moment, the feelings, the details that made it memorable..."
              placeholderTextColor="#9CA3AF"
              value={storyContent}
              onChangeText={setStoryContent}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    paddingVertical: 0,
    height: 44,
  },
  clearButton: {
    padding: 4,
  },

  // Add Story Card
  addStoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addStoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  addStoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  addStorySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },

  // Stories Container
  storiesContainer: {
    gap: 12,
  },

  // Story Card
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  storyIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  storyCardContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  storySnippet: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  storyYear: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  storyChevron: {
    alignSelf: 'center',
    marginLeft: 4,
  },

  // Stories Section
  storiesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.3,
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

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 8,
  },
  emptyStateCard: {
    width: '100%',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyIconEmoji: {
    fontSize: 42,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#15803D',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 28,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  emptyAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  titleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    paddingTop: 8, paddingBottom: 12,
  },
  whenInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    marginBottom: 12,
  },
  whenInput: {
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
  modalContentInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
    flex: 1,
    padding: 0,
  },
});

export default StoryBankScreen;
