import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

type VaultItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  route: string;
};

interface KnowledgeHubScreenProps {
  navigation: {
    navigate: (route: string) => void;
  };
}

const KnowledgeHubScreen: React.FC<KnowledgeHubScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Vaults data - 8 vaults in 4 rows of 2
  const vaults: VaultItem[] = [
    {
      id: '1',
      title: 'Best Self',
      subtitle: 'Your best version &\nidentity',
      icon: 'star',
      iconColor: '#6366F1',
      route: 'HigherSelf',
    },
    {
      id: '2',
      title: 'Mindset',
      subtitle: 'Rules, affirmations &\nbeliefs',
      icon: 'flash',
      iconColor: '#8B5CF6',
      route: 'MindsetBeliefs',
    },
    {
      id: '3',
      title: 'Knowledge',
      subtitle: 'Notes, concepts &\nframeworks',
      icon: 'bulb',
      iconColor: '#38BDF8',
      route: 'KnowledgeVault',
    },
    {
      id: '4',
      title: 'Media Vault',
      subtitle: 'Podcasts, videos &\narticles',
      icon: 'play-circle',
      iconColor: '#EC4899',
      route: 'MediaVault',
    },
    {
      id: '5',
      title: 'Book Vault',
      subtitle: 'Summaries &\nhighlights',
      icon: 'book',
      iconColor: '#F59E0B',
      route: 'BookVault',
    },
    {
      id: '6',
      title: 'People',
      subtitle: 'Relationships &\nyour network',
      icon: 'people',
      iconColor: '#3B82F6',
      route: 'PeopleCRM',
    },
    {
      id: '7',
      title: 'Love / Dating',
      subtitle: 'Dates & romantic\ninsights',
      icon: 'heart',
      iconColor: '#F43F5E',
      route: 'LoveDating',
    },
    {
      id: '8',
      title: 'Story Bank',
      subtitle: 'Personal stories &\nanecdotes',
      icon: 'bookmark',
      iconColor: '#16A34A',
      route: 'StoryBank',
    },
  ];

  const handleVaultPress = (route: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(route);
  };

  // Group vaults into rows of 2
  const rows = [];
  for (let i = 0; i < vaults.length; i += 2) {
    rows.push(vaults.slice(i, i + 2));
  }

  return (
    <View style={styles.safeArea}>
      <View style={[styles.container, { paddingTop: insets.top + 14 }]}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Second Brain</Text>
        </View>

        {/* Vaults Grid - fills remaining space */}
        <View style={styles.vaultsSection}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.vaultRow}>
              {row.map((vault) => (
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  onPress={() => handleVaultPress(vault.route)}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
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
    backgroundColor: '#F0EEE8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },

  // Header
  header: {
    backgroundColor: '#F0EEE8',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // Vaults Grid - fills remaining space
  vaultsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16, // Space below header
    paddingBottom: 16, // 16px space above navigation bar
    gap: 12, // Gap between rows
  },
  vaultRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12, // Gap between cards in a row
  },
  vaultCardTouchable: {
    flex: 1,
  },
  vaultCardWrapper: {
    flex: 1,
  },
  vaultCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 14,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Vault Card Content
  vaultIconContainer: {
    marginBottom: 12,
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
    // Content stays grouped with icon at top
  },
  vaultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  vaultSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 16,
  },
});

export default KnowledgeHubScreen;
