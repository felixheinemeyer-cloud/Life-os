import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type VaultItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  route: string;
  itemCount: number;
};

interface KnowledgeHubScreenProps {
  navigation: {
    navigate: (route: string) => void;
  };
}

const KnowledgeHubScreen: React.FC<KnowledgeHubScreenProps> = ({ navigation }) => {
  // Vaults data - ordered as specified: Mindset, Knowledge, Media, Book, People, Love, Story
  const vaults: VaultItem[] = [
    {
      id: '1',
      title: 'Mindset',
      subtitle: 'Beliefs, rules & affirmations',
      icon: 'diamond',
      gradientColors: ['#F3E8FF', '#E9D5FF', '#D8B4FE'],
      route: 'MindsetIdentity',
      itemCount: 12,
    },
    {
      id: '2',
      title: 'Knowledge',
      subtitle: 'Notes, concepts & frameworks',
      icon: 'bulb',
      gradientColors: ['#E0E7FF', '#C7D2FE', '#A5B4FC'],
      route: 'KnowledgeVault',
      itemCount: 36,
    },
    {
      id: '3',
      title: 'Media Vault',
      subtitle: 'Podcasts, videos & articles',
      icon: 'play-circle',
      gradientColors: ['#FCE7F3', '#FBCFE8', '#F9A8D4'],
      route: 'MediaVault',
      itemCount: 42,
    },
    {
      id: '4',
      title: 'Book Vault',
      subtitle: 'Summaries & highlights',
      icon: 'book',
      gradientColors: ['#FEF3C7', '#FDE68A', '#FCD34D'],
      route: 'BookVault',
      itemCount: 18,
    },
    {
      id: '5',
      title: 'People',
      subtitle: 'Relationships & network',
      icon: 'people',
      gradientColors: ['#DBEAFE', '#BFDBFE', '#93C5FD'],
      route: 'PeopleCRM',
      itemCount: 24,
    },
    {
      id: '6',
      title: 'Love / Dating',
      subtitle: 'Dates & romantic insights',
      icon: 'heart',
      gradientColors: ['#FFE4E6', '#FECDD3', '#FDA4AF'],
      route: 'LoveDating',
      itemCount: 8,
    },
    {
      id: '7',
      title: 'Story Bank',
      subtitle: 'Personal stories & anecdotes',
      icon: 'bookmark',
      gradientColors: ['#ECFCCB', '#D9F99D', '#BEF264'],
      route: 'StoryBank',
      itemCount: 15,
    },
  ];

  const handleVaultPress = (route: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Knowledge Hub</Text>
          <Text style={styles.subtitle}>Your second brain in one place</Text>
        </View>

        {/* Vaults Grid */}
        <View style={styles.vaultsSection}>
          <View style={styles.vaultsGrid}>
            {vaults.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onPress={() => handleVaultPress(vault.route)}
              />
            ))}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Vault Card Component with microinteractions
const VaultCard: React.FC<{
  vault: VaultItem;
  onPress: () => void;
}> = ({ vault, onPress }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.vaultCardTouchable}
    >
      <Animated.View
        style={[
          styles.vaultCardWrapper,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={vault.gradientColors as [string, string, ...string[]]}
          style={styles.vaultCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Icon */}
          <View style={styles.vaultIconContainer}>
            <View style={styles.vaultIconCircle}>
              <Ionicons name={vault.icon} size={28} color="#1F2937" />
            </View>
          </View>

          {/* Content */}
          <View style={styles.vaultContent}>
            <Text style={styles.vaultTitle} numberOfLines={1}>
              {vault.title}
            </Text>
            <Text style={styles.vaultSubtitle} numberOfLines={2}>
              {vault.subtitle}
            </Text>
          </View>

          {/* Chevron */}
          <View style={styles.vaultChevron}>
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1EEE0', // Same as Dashboard
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Vaults Grid
  vaultsSection: {
    marginTop: 20,
    paddingHorizontal: 16, // Distance from screen edges to vault cards
  },
  vaultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vaultCardTouchable: {
    width: '48%',
    marginBottom: 16,
  },
  vaultCardWrapper: {
    width: '100%',
  },
  vaultCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },

  // Vault Card Content
  vaultIconContainer: {
    marginBottom: 12,
  },
  vaultIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vaultContent: {
    flex: 1,
    paddingRight: 26,
  },
  vaultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  vaultSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 16,
  },
  vaultChevron: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 20,
  },
});

export default KnowledgeHubScreen;
