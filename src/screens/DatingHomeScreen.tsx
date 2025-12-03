import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Types
interface DatingHomeScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface DatingPerson {
  id: string;
  name: string;
  initials: string;
  createdAt: string;
  phoneNumber?: string;
  instagram?: string;
  location?: string;
  dateOfBirth?: string;
  rating?: number;
  notes?: { id: string; text: string; createdAt: string }[];
}

interface DateIdea {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface DatingAdvice {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Mock Data
const DATING_CRM_DATA: DatingPerson[] = [
  { id: '1', name: 'Sophie', initials: 'S', createdAt: '2024-03-01' },
  { id: '2', name: 'Emma', initials: 'E', createdAt: '2024-02-28' },
  { id: '3', name: 'Mia', initials: 'M', createdAt: '2024-02-25' },
];

const DATE_IDEAS: DateIdea[] = [
  { id: '1', title: 'Coffee walk', icon: 'cafe-outline', color: '#92400E' },
  { id: '2', title: 'Museum date', icon: 'color-palette-outline', color: '#7C3AED' },
  { id: '3', title: 'Board games', icon: 'game-controller-outline', color: '#059669' },
  { id: '4', title: 'Picnic', icon: 'leaf-outline', color: '#0891B2' },
];

const DATING_ADVICE_DATA: DatingAdvice[] = [
  {
    id: '1',
    title: 'Green flags to look for',
    description: 'Signs that someone is emotionally available',
    icon: 'flag-outline',
  },
  {
    id: '2',
    title: 'Questions for deeper conversation',
    description: 'Move beyond small talk',
    icon: 'chatbubbles-outline',
  },
  {
    id: '3',
    title: 'Setting healthy boundaries',
    description: 'How to communicate your needs',
    icon: 'shield-checkmark-outline',
  },
];

// Main Component
const DatingHomeScreen: React.FC<DatingHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handlePersonPress = (person: DatingPerson) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DatingDetail', { person });
  };

  const handleSeeAllCRM = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DatingCRM');
  };

  const handleSeeAllDateIdeas = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DateIdeasList');
  };

  const handleIdeaPress = (idea: DateIdea) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Date idea selected:', idea.title);
  };

  const handleAdvicePress = (advice: DatingAdvice) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('DatingAdviceDetail', { advice });
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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Dating</Text>
          </View>
          {/* People Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>People</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={handleSeeAllCRM}
                activeOpacity={0.6}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.peopleList}>
              {DATING_CRM_DATA.map((person) => (
                <TouchableOpacity
                  key={person.id}
                  style={styles.personCard}
                  onPress={() => handlePersonPress(person)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
                    style={styles.personAvatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.personInitials}>{person.initials}</Text>
                  </LinearGradient>
                  <Text style={styles.personName}>{person.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Ideas Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Date Ideas</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={handleSeeAllDateIdeas}
                activeOpacity={0.6}
              >
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateIdeasScroll}
            >
              {DATE_IDEAS.map((idea) => (
                <TouchableOpacity
                  key={idea.id}
                  style={styles.dateIdeaCard}
                  onPress={() => handleIdeaPress(idea)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dateIdeaIcon, { backgroundColor: `${idea.color}12` }]}>
                    <Ionicons name={idea.icon} size={24} color={idea.color} />
                  </View>
                  <Text style={styles.dateIdeaTitle}>{idea.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Dating Advice Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Advice</Text>
            </View>

            <View style={styles.adviceList}>
              {DATING_ADVICE_DATA.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.adviceCard}
                  onPress={() => handleAdvicePress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.adviceIconCircle}>
                    <Ionicons name={item.icon} size={20} color="#BE123C" />
                  </View>
                  <View style={styles.adviceContent}>
                    <Text style={styles.adviceTitle}>{item.title}</Text>
                    <Text style={styles.adviceDescription}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

      {/* Fixed Header with Blur Background */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]} pointerEvents="box-none">
        {/* Gradient Fade Background */}
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

        {/* Header Content */}
        <View style={styles.header} pointerEvents="box-none">
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                // TODO: Navigate to settings
                console.log('Settings pressed');
              }}
              style={styles.settingsButton}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 16,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
  settingsButton: {
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Section Common
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  // People Section
  peopleList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personInitials: {
    fontSize: 15,
    fontWeight: '600',
    color: '#BE123C',
  },
  personName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
  },

  // Date Ideas Section
  dateIdeasScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  dateIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  dateIdeaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateIdeaTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },

  // Advice Section
  adviceList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  adviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adviceContent: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  adviceDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
});

export default DatingHomeScreen;
