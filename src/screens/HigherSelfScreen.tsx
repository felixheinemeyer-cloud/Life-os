import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface HigherSelfScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const HigherSelfScreen: React.FC<HigherSelfScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Higher Self</Text>
            <Text style={styles.subtitle}>Your ideal self vision</Text>
          </View>
        </View>

        {/* Content Placeholder */}
        <View style={styles.content}>
          <LinearGradient
            colors={['#EDE9FE', '#DDD6FE', '#C4B5FD']}
            style={styles.placeholderCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="star" size={48} color="#7C3AED" />
            </View>
            <Text style={styles.placeholderTitle}>Coming Soon</Text>
            <Text style={styles.placeholderText}>
              Define your aspirations and visualize your ideal self
            </Text>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
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
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  placeholderCard: {
    width: '100%',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});

export default HigherSelfScreen;
