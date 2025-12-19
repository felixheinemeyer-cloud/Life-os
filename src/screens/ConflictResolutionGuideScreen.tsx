import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ConflictResolutionGuideScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const ConflictResolutionGuideScreen: React.FC<ConflictResolutionGuideScreenProps> = ({
  navigation,
}) => {
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conflict Resolution</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content with Gradient Background */}
      <View style={styles.backgroundContainer}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.contentCard}>
            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Ionicons name="heart" size={14} color="#E11D48" />
              <Text style={styles.categoryText}>Relationship</Text>
            </View>

            {/* Title */}
            <Text style={styles.guideTitle}>Navigating Conflict Together</Text>

            {/* Meta Info */}
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#E11D48" />
                <Text style={styles.metaText}>5 min read</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Introduction */}
            <Text style={styles.introduction}>
              Every relationship has conflicts. What matters is how you navigate them together. These strategies help you turn disagreements into opportunities for deeper understanding and connection.
            </Text>

            {/* Strategy 1 */}
            <View style={styles.strategySection}>
              <Text style={styles.strategyHeading}>1. Pause when emotions run high</Text>
              <Text style={styles.strategyBody}>
                If you're feeling overwhelmed, take a 20-minute break to cool down. This isn't running away—it's choosing to respond thoughtfully rather than react emotionally. A brief pause allows your nervous system to calm and helps you approach the conversation with clarity rather than defensiveness.
              </Text>
            </View>

            {/* Strategy 2 */}
            <View style={styles.strategySection}>
              <Text style={styles.strategyHeading}>2. Use "I feel" statements</Text>
              <Text style={styles.strategyBody}>
                Instead of saying "You never listen" or "You always ignore me," try "I feel hurt when I'm talking and it seems like you're distracted." This opens dialogue instead of triggering defensiveness. It shifts the conversation from blame to vulnerability, making it easier for your partner to hear you.
              </Text>
            </View>

            {/* Strategy 3 */}
            <View style={styles.strategySection}>
              <Text style={styles.strategyHeading}>3. Listen to understand, not to win</Text>
              <Text style={styles.strategyBody}>
                Your goal isn't to prove you're right—it's to understand your partner's perspective and find a path forward together. Put down your mental rebuttals and truly absorb what they're saying. Ask clarifying questions. Reflect back what you hear. Real listening is an act of love.
              </Text>
            </View>

            {/* Strategy 4 */}
            <View style={styles.strategySection}>
              <Text style={styles.strategyHeading}>4. Acknowledge your partner's feelings</Text>
              <Text style={styles.strategyBody}>
                Even if you disagree with their perspective, you can validate their emotions. "I hear that you're frustrated" or "I can see why that would hurt you" shows you care about their experience. Validation doesn't mean you're abandoning your own viewpoint—it means you're holding space for both realities.
              </Text>
            </View>

            {/* Strategy 5 */}
            <View style={styles.strategySection}>
              <Text style={styles.strategyHeading}>5. Focus on the issue, not the person</Text>
              <Text style={styles.strategyBody}>
                Attack the problem together, not each other. Avoid bringing up past conflicts or making character attacks. Stay present with the specific issue at hand. You're teammates working through a challenge, not adversaries trying to defeat each other.
              </Text>
            </View>

            {/* Strategy 6 */}
            <View style={styles.strategySection}>
              <Text style={styles.strategyHeading}>6. Find common ground</Text>
              <Text style={styles.strategyBody}>
                What do you both want? What can you both agree on? Start there and build toward solutions with compromise and creativity. Often, beneath surface-level disagreements, you'll find shared values and desires. Identify those and use them as your foundation.
              </Text>
            </View>

            {/* Strategy 7 */}
            <View style={styles.strategySection}>
              <Text style={styles.strategyHeading}>7. Check in after resolution</Text>
              <Text style={styles.strategyBody}>
                A day or two later, ask "How are you feeling about our conversation?" This shows care and helps prevent lingering resentment. It also gives both of you space to process and share any thoughts that emerged after the heat of the moment passed.
              </Text>
            </View>

            {/* Remember Box */}
            <View style={styles.rememberBox}>
              <View style={styles.rememberHeader}>
                <Ionicons name="sparkles" size={20} color="#E11D48" />
                <Text style={styles.rememberTitle}>Remember</Text>
              </View>
              <Text style={styles.rememberText}>
                Conflict is not a sign of a failing relationship. It's a natural part of two individuals learning to navigate life together. The goal isn't to avoid conflict—it's to handle it with respect, empathy, and a genuine desire to understand each other.
              </Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#F0EEE8',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  scrollContent: {
    padding: 16,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E11D48',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E11D48',
  },
  metaDot: {
    fontSize: 13,
    color: '#E11D48',
    marginHorizontal: 8,
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(225, 29, 72, 0.2)',
    marginBottom: 20,
  },
  introduction: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 26,
    letterSpacing: -0.1,
    marginBottom: 28,
  },

  // Strategy Sections
  strategySection: {
    marginBottom: 24,
  },
  strategyHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  strategyBody: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Remember Box
  rememberBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E11D48',
  },
  rememberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rememberTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#BE123C',
    letterSpacing: -0.2,
  },
  rememberText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 24,
    letterSpacing: -0.1,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 40,
  },
});

export default ConflictResolutionGuideScreen;
