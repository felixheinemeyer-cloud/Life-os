import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WealthType, WEALTH_CONFIGS } from '../components/WealthButton';

interface BestSelfInfoScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const WEALTH_GRADIENTS: Record<WealthType, [string, string, string]> = {
  physical: ['#34D399', '#10B981', '#059669'],
  mental: ['#93C5FD', '#60A5FA', '#3B82F6'],
  social: ['#A78BFA', '#8B5CF6', '#7C3AED'],
  financial: ['#FDE047', '#FACC15', '#EAB308'],
  time: ['#FDBA74', '#FB923C', '#F97316'],
};

const getIconName = (type: WealthType): keyof typeof Ionicons.glyphMap => {
  const filledIcons: Record<WealthType, keyof typeof Ionicons.glyphMap> = {
    physical: 'fitness',
    mental: 'bulb',
    social: 'people',
    financial: 'bar-chart',
    time: 'time',
  };
  return filledIcons[type];
};

const PILLARS: { type: WealthType; name: string; desc: string }[] = [
  { type: 'physical', name: 'Physical', desc: 'Body, energy & health' },
  { type: 'mental', name: 'Mental', desc: 'Mind, clarity & resilience' },
  { type: 'social', name: 'Social', desc: 'Relationships & connection' },
  { type: 'financial', name: 'Financial', desc: 'Money & security' },
  { type: 'time', name: 'Time', desc: 'Focus & priorities' },
];

const BestSelfInfoScreen: React.FC<BestSelfInfoScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Best Self</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons name="star" size={28} color="#6366F1" />
            </View>
          </View>

          {/* Description */}
          <Text style={styles.paragraph}>
            Your Best Self is the highest version of who you can become — the person you aspire to be when you're living with intention, clarity, and purpose.
          </Text>

          {/* Quote Card */}
          <View style={styles.quoteCard}>
            <View style={styles.quoteLine} />
            <View style={styles.quoteContent}>
              <Text style={styles.quoteText}>
                The person who knows their destination finds the way. The person who doesn't wanders endlessly.
              </Text>
              <Text style={styles.quoteAttribution}>— Ancient Proverb</Text>
            </View>
          </View>

          {/* Why Section */}
          <Text style={styles.subtitle}>Why Design It?</Text>
          <Text style={styles.paragraph}>
            Without a clear vision of who you want to become, daily decisions lack direction. By defining your Best Self across five key areas, you create a compass that guides every choice.
          </Text>

          {/* Pillars */}
          <Text style={styles.subtitle}>Five Pillars of Wealth</Text>
          <View style={styles.pillarList}>
            {PILLARS.map((pillar, index) => {
              const config = WEALTH_CONFIGS[pillar.type];
              const gradientColors = WEALTH_GRADIENTS[pillar.type];
              return (
                <View key={index} style={styles.pillarItem}>
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.pillarGradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.pillarIconInner}>
                      <Ionicons name={getIconName(pillar.type)} size={18} color={config.color} />
                    </View>
                  </LinearGradient>
                  <View style={styles.pillarText}>
                    <Text style={styles.pillarName}>{pillar.name}</Text>
                    <Text style={styles.pillarDesc}>{pillar.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  closeButton: {
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
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F126',
    borderWidth: 1.5,
    borderColor: '#6366F133',
  },
  paragraph: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 24,
    letterSpacing: -0.1,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  quoteCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  quoteLine: {
    width: 3.5,
    backgroundColor: '#6366F1',
  },
  quoteContent: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 20,
    paddingRight: 16,
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  quoteAttribution: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6366F1',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  pillarList: {
    gap: 8,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEDEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  pillarGradientRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  pillarIconInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarText: {
    flex: 1,
  },
  pillarName: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  pillarDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 3,
    letterSpacing: -0.1,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BestSelfInfoScreen;
