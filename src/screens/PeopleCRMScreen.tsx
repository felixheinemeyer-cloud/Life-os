import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Keyboard,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Types
interface PeopleCRMScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface Contact {
  id: string;
  name: string;
  initials: string;
  category: string;
  phoneNumber?: string;
  email?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  contactAgainDate?: string;
  reminderStatus?: 'none' | 'future' | 'soon' | 'overdue';
  notes?: { id: string; text: string; createdAt: string }[];
}

// Mock Data
const CONTACTS_DATA: Contact[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    initials: 'AT',
    category: 'Close Friend',
    phoneNumber: '+1 (555) 123-4567',
    email: 'alex.thompson@email.com',
    instagram: 'alexthompson',
    location: 'San Francisco',
    dateOfBirth: '1995-03-15',
    contactAgainDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    reminderStatus: 'future',
    notes: [
      { id: '1', text: 'Loves hiking and outdoor activities', createdAt: new Date().toISOString() },
      { id: '2', text: 'Works at a tech startup as a designer', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: '2',
    name: 'Maria Garcia',
    initials: 'MG',
    category: 'Family',
    phoneNumber: '+1 (555) 234-5678',
    email: 'maria.garcia@email.com',
    contactAgainDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reminderStatus: 'overdue',
  },
  {
    id: '3',
    name: 'James Wilson',
    initials: 'JW',
    category: 'Work',
    email: 'james.wilson@company.com',
    location: 'London',
  },
  {
    id: '4',
    name: 'Sophie Chen',
    initials: 'SC',
    category: 'Close Friend',
    phoneNumber: '+1 (555) 345-6789',
    instagram: 'sophiechen',
    contactAgainDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    reminderStatus: 'soon',
  },
  {
    id: '5',
    name: 'David Kim',
    initials: 'DK',
    category: 'Acquaintance',
    email: 'david.kim@email.com',
    location: 'Seoul',
    contactAgainDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reminderStatus: 'overdue',
  },
  {
    id: '6',
    name: 'Emma Brown',
    initials: 'EB',
    category: 'Family',
    phoneNumber: '+1 (555) 456-7890',
    location: 'Chicago',
    dateOfBirth: '1992-07-22',
    contactAgainDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    reminderStatus: 'future',
  },
  {
    id: '7',
    name: 'Lucas Martinez',
    initials: 'LM',
    category: 'Work',
    email: 'lucas.martinez@work.com',
    contactAgainDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    reminderStatus: 'soon',
  },
  {
    id: '8',
    name: 'Olivia Johnson',
    initials: 'OJ',
    category: 'Close Friend',
    phoneNumber: '+1 (555) 567-8901',
    instagram: 'oliviaj',
    location: 'Toronto',
    dateOfBirth: '1997-11-08',
  },
];

// Unified avatar colors - matching the attention section background (rgba(0,0,0,0.03) on #F7F5F2)
const getAvatarColors = (): [string, string, string] => {
  return ['#F0EEEB', '#F0EEEB', '#F0EEEB'];
};

const getInitialsColor = (): string => {
  return '#1F2937'; // Same as contact name
};

// Reminder bell colors based on status
const getReminderStyle = (status?: string): { iconColor: string; bgColor: string } | null => {
  switch (status) {
    case 'future':
      return { iconColor: '#9CA3AF', bgColor: '#F3F4F6' };
    case 'soon':
      return { iconColor: '#F59E0B', bgColor: '#FEF3C7' };
    case 'overdue':
      return { iconColor: '#EF4444', bgColor: '#FEE2E2' };
    default:
      return null;
  }
};

const CATEGORIES = ['All', 'Family', 'Close Friend', 'Friend', 'Work', 'Acquaintance'];

// Check if today is the person's birthday
const isBirthdayToday = (dateOfBirth: string): boolean => {
  const today = new Date();
  const birthday = new Date(dateOfBirth);
  return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
};

const getCategoryFilterStyle = (category: string, isSelected: boolean): { bg: string; text: string; border: string } => {
  if (!isSelected) {
    return { bg: '#FFFFFF', text: '#6B7280', border: 'rgba(0, 0, 0, 0.08)' };
  }
  switch (category.toLowerCase()) {
    case 'all':
      return { bg: '#1F2937', text: '#FFFFFF', border: '#1F2937' };
    case 'close friend':
      return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' };
    case 'friend':
      return { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' };
    case 'family':
      return { bg: '#FCE7F3', text: '#BE185D', border: '#FBCFE8' };
    case 'work':
      return { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' };
    case 'acquaintance':
      return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB' };
    default:
      return { bg: '#1F2937', text: '#FFFFFF', border: '#1F2937' };
  }
};

const PeopleCRMScreen: React.FC<PeopleCRMScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);

  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const addButtonScale = useRef(new Animated.Value(1)).current;

  // Count contacts needing attention
  const overdueCount = CONTACTS_DATA.filter(c => c.reminderStatus === 'overdue').length;
  const soonCount = CONTACTS_DATA.filter(c => c.reminderStatus === 'soon').length;
  const needsAttentionCount = overdueCount + soonCount;

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

  const handleContactPress = (contact: Contact) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('ContactDetail', { contact });
  };

  const handleAddContact = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('PeopleEntry');
  };

  const handleCategorySelect = (categoryName: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(categoryName);
    setShowNeedsAttention(false);
  };

  const handleNeedsAttentionToggle = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowNeedsAttention(!showNeedsAttention);
  };

  // Filter and sort contacts
  const filteredContacts = CONTACTS_DATA
    .filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || contact.category === selectedCategory;
      const matchesAttention = !showNeedsAttention ||
        contact.reminderStatus === 'overdue' ||
        contact.reminderStatus === 'soon';
      return matchesSearch && matchesCategory && matchesAttention;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

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
        keyboardDismissMode="on-drag"
      >
        <Pressable onPress={() => Keyboard.dismiss()}>
          {/* Scrollable Title */}
          <View style={styles.scrollableTitle}>
            <Text style={styles.title}>People</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
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
                  <Ionicons name="close-circle" size={18} color="#C4C4C4" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                const filterStyle = getCategoryFilterStyle(category, isSelected);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filterStyle.bg,
                        borderColor: filterStyle.border,
                      },
                    ]}
                    onPress={() => handleCategorySelect(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, { color: filterStyle.text }]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Needs Attention Banner */}
          {needsAttentionCount > 0 && (
            <View style={styles.attentionBannerContainer}>
              <TouchableOpacity
                style={[
                  styles.attentionBanner,
                  showNeedsAttention && styles.attentionBannerActive,
                ]}
                onPress={handleNeedsAttentionToggle}
                activeOpacity={0.7}
              >
                <View style={styles.attentionContent}>
                  <Ionicons
                    name="notifications"
                    size={16}
                    color={showNeedsAttention ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text style={[
                    styles.attentionText,
                    showNeedsAttention && styles.attentionTextActive,
                  ]}>
                    {overdueCount > 0 && (
                      <Text style={[styles.attentionCount, showNeedsAttention && styles.attentionCountActive, { color: showNeedsAttention ? '#FFFFFF' : '#EF4444' }]}>
                        {overdueCount} overdue
                      </Text>
                    )}
                    {overdueCount > 0 && soonCount > 0 && (
                      <Text style={[styles.attentionSeparator, showNeedsAttention && styles.attentionTextActive]}> · </Text>
                    )}
                    {soonCount > 0 && (
                      <Text style={[styles.attentionCount, showNeedsAttention && styles.attentionCountActive, { color: showNeedsAttention ? '#FFFFFF' : '#F59E0B' }]}>
                        {soonCount} due soon
                      </Text>
                    )}
                  </Text>
                </View>
                <Ionicons
                  name={showNeedsAttention ? 'close' : 'chevron-forward'}
                  size={16}
                  color={showNeedsAttention ? '#FFFFFF' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Contact List */}
          <View style={styles.listContainer}>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactCard}
                    onPress={() => handleContactPress(contact)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar */}
                    <LinearGradient
                      colors={getAvatarColors()}
                      style={styles.contactAvatar}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={[styles.contactInitials, { color: getInitialsColor() }]}>
                        {contact.initials}
                      </Text>
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.contactCardContent}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                    </View>

                    {/* Indicators */}
                    <View style={styles.indicatorsContainer}>
                      {/* Birthday Indicator - only show if today is their birthday */}
                      {contact.dateOfBirth && isBirthdayToday(contact.dateOfBirth) && (
                        <View style={styles.birthdayIndicator}>
                          <Ionicons name="gift" size={14} color="#1D4ED8" />
                        </View>
                      )}

                      {/* Reminder Indicator */}
                      {contact.reminderStatus && contact.reminderStatus !== 'none' && (
                        <View style={[
                          styles.reminderIndicator,
                          { backgroundColor: getReminderStyle(contact.reminderStatus)?.bgColor }
                        ]}>
                          <Ionicons
                            name="notifications"
                            size={14}
                            color={getReminderStyle(contact.reminderStatus)?.iconColor}
                          />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptySearchContainer}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptySearchTitle}>No contacts found</Text>
                <Text style={styles.emptySearchText}>
                  Try adjusting your search query
                </Text>
              </View>
            )}
          </View>
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
              onPress={handleAddContact}
              onPressIn={handleAddPressIn}
              onPressOut={handleAddPressOut}
            >
              <Animated.View style={[styles.addButton, { transform: [{ scale: addButtonScale }] }]}>
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
  },
  // Search Bar
  searchBarContainer: {
    marginBottom: 16,
  },

  // Attention Banner
  attentionBannerContainer: {
    marginBottom: 20,
  },
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  attentionBannerActive: {
    backgroundColor: '#1F2937',
  },
  attentionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attentionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  attentionTextActive: {
    color: '#FFFFFF',
  },
  attentionCount: {
    fontWeight: '600',
  },
  attentionCountActive: {
    color: '#FFFFFF',
  },
  attentionSeparator: {
    color: '#9CA3AF',
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

  // Category Filters
  filtersContainer: {
    marginHorizontal: -16,
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  // Contact List
  listContainer: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitials: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  birthdayIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty Search State
  emptySearchContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySearchText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default PeopleCRMScreen;
