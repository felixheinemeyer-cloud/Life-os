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
  iconColor: string;
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
      subtitle: 'Beliefs, rules &\naffirmations',
      icon: 'star',
      gradientColors: ['#F3E8FF', '#E9D5FF', '#D8B4FE'],
      iconColor: '#6366F1',
      route: 'MindsetIdentity',
      itemCount: 12,
    },
    {
      id: '2',
      title: 'Knowledge',
      subtitle: 'Notes, concepts &\nframeworks',
      icon: 'bulb',
      gradientColors: ['#CFFAFE', '#A5F3FC', '#67E8F9'],
      iconColor: '#06B6D4',
      route: 'KnowledgeVault',
      itemCount: 36,
    },
    {
      id: '3',
      title: 'Media Vault',
      subtitle: 'Podcasts, videos &\narticles',
      icon: 'play-circle',
      gradientColors: ['#FCE7F3', '#FBCFE8', '#F9A8D4'],
      iconColor: '#EC4899',
      route: 'MediaVault',
      itemCount: 42,
    },
    {
      id: '4',
      title: 'Book Vault',
      subtitle: 'Summaries &\nhighlights',
      icon: 'book',
      gradientColors: ['#FEF3C7', '#FDE68A', '#FCD34D'],
      iconColor: '#F59E0B',
      route: 'BookVault',
      itemCount: 18,
    },
    {
      id: '5',
      title: 'People',
      subtitle: 'Relationships &\nyour network',
      icon: 'people',
      gradientColors: ['#DBEAFE', '#BFDBFE', '#93C5FD'],
      iconColor: '#3B82F6',
      route: 'PeopleCRM',
      itemCount: 24,
    },
    {
      id: '6',
      title: 'Love / Dating',
      subtitle: 'Dates & romantic\ninsights',
      icon: 'heart',
      gradientColors: ['#FFE4E6', '#FECDD3', '#FDA4AF'],
      iconColor: '#F43F5E',
      route: 'LoveDating',
      itemCount: 8,
    },
    {
      id: '7',
      title: 'Story Bank',
      subtitle: 'Personal stories &\nanecdotes',
      icon: 'bookmark',
      gradientColors: ['#DCFCE7', '#BBF7D0', '#86EFAC'],
      iconColor: '#16A34A',
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
          <Text style={styles.title}>Second Brain</Text>
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
        <View style={styles.vaultCard}>
          {/* Icon */}
          <View style={styles.vaultIconContainer}>
            <View style={[
              styles.vaultIconCircle,
              {
                backgroundColor: `${vault.iconColor}26`,
                borderWidth: 1.5,
                borderColor: `${vault.iconColor}33`
              }
            ]}>
              <Ionicons name={vault.icon} size={24} color={vault.iconColor} />
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
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2', // Same as Dashboard
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
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
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // Vaults Grid
  vaultsSection: {
    marginTop: 8,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 16,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },

  // Vault Card Content
  vaultIconContainer: {
    marginBottom: 10,
  },
  vaultIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    height: 32, // Force exactly 2 lines (16 * 2)
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 20,
  },
});

export default KnowledgeHubScreen;
