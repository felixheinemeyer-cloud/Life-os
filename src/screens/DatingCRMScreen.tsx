import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Types
interface DatingCRMScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface DatingPerson {
  id: string;
  name: string;
  initials: string;
  stage: string;
  source: string;
  lastActivity: string;
}

// Mock Data - Full list
const DATING_CRM_DATA: DatingPerson[] = [
  { id: '1', name: 'Sophie', initials: 'S', stage: 'Texting', source: 'Met on Hinge', lastActivity: '2 days ago' },
  { id: '2', name: 'Emma', initials: 'E', stage: 'First date', source: 'Met at a party', lastActivity: 'Yesterday' },
  { id: '3', name: 'Mia', initials: 'M', stage: 'Matched', source: 'Bumble', lastActivity: '5 hours ago' },
  { id: '4', name: 'Olivia', initials: 'O', stage: 'Texting', source: 'Coffee shop', lastActivity: '1 week ago' },
  { id: '5', name: 'Ava', initials: 'A', stage: 'Second date', source: 'Tinder', lastActivity: '3 days ago' },
  { id: '6', name: 'Isabella', initials: 'I', stage: 'Matched', source: 'Hinge', lastActivity: '1 hour ago' },
  { id: '7', name: 'Charlotte', initials: 'C', stage: 'Not interested', source: 'Friend intro', lastActivity: '2 weeks ago' },
];

// Stage badge colors
const getStageColor = (stage: string): { bg: string; text: string } => {
  switch (stage.toLowerCase()) {
    case 'matched':
      return { bg: '#DBEAFE', text: '#1D4ED8' };
    case 'texting':
      return { bg: '#FEF3C7', text: '#B45309' };
    case 'first date':
      return { bg: '#D1FAE5', text: '#047857' };
    case 'second date':
      return { bg: '#EDE9FE', text: '#6D28D9' };
    case 'not interested':
      return { bg: '#F3F4F6', text: '#6B7280' };
    default:
      return { bg: '#F3F4F6', text: '#4B5563' };
  }
};

const DatingCRMScreen: React.FC<DatingCRMScreenProps> = ({ navigation }) => {
  // Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
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
      ]),
      // Content animation
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handlePersonPress = (person: DatingPerson) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('Person selected:', person.name);
    // TODO: Navigate to person detail screen
  };

  const handleAddPerson = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log('Add person pressed');
    // TODO: Navigate to add person screen
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Dating CRM</Text>
            <Text style={styles.subtitle}>Everyone you're talking to</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Add New Person Button */}
          <Animated.View
            style={[
              styles.addCardWrapper,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.addCard}
              onPress={handleAddPerson}
              activeOpacity={0.7}
            >
              <View style={styles.addIconCircle}>
                <Ionicons name="add" size={24} color="#E11D48" />
              </View>
              <Text style={styles.addCardText}>Add someone new</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* CRM List */}
          <Animated.View
            style={[
              styles.listContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            {DATING_CRM_DATA.map((person, index) => {
              const stageColors = getStageColor(person.stage);
              return (
                <TouchableOpacity
                  key={person.id}
                  style={styles.crmCard}
                  onPress={() => handlePersonPress(person)}
                  activeOpacity={0.8}
                >
                  {/* Avatar */}
                  <LinearGradient
                    colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
                    style={styles.crmAvatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.crmInitials}>{person.initials}</Text>
                  </LinearGradient>

                  {/* Content */}
                  <View style={styles.crmCardContent}>
                    <View style={styles.crmCardHeader}>
                      <Text style={styles.crmName}>{person.name}</Text>
                      <View style={[styles.stageBadge, { backgroundColor: stageColors.bg }]}>
                        <Text style={[styles.stageBadgeText, { color: stageColors.text }]}>
                          {person.stage}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.crmSource}>{person.source}</Text>
                    <Text style={styles.crmLastActivity}>Active {person.lastActivity}</Text>
                  </View>

                  {/* Chevron */}
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })}
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
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    fontWeight: '400',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Add Card
  addCardWrapper: {
    marginBottom: 20,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderStyle: 'dashed',
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },

  // CRM List
  listContainer: {
    gap: 10,
  },
  crmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  crmAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  crmInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#BE123C',
  },
  crmCardContent: {
    flex: 1,
  },
  crmCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 3,
  },
  crmName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  crmSource: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4B5563',
    marginBottom: 2,
  },
  crmLastActivity: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
});

export default DatingCRMScreen;
