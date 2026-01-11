import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface LoveModePlaceholderScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const LoveModePlaceholderScreen: React.FC<LoveModePlaceholderScreenProps> = ({ navigation }) => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleIn, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeIn }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Love Mode</Text>
            <Text style={styles.subtitle}>Relationship tools & insights</Text>
          </View>
        </Animated.View>

        {/* Placeholder Content */}
        <View style={styles.contentContainer}>
          <Animated.View
            style={[
              styles.placeholderCard,
              {
                opacity: fadeIn,
                transform: [{ scale: scaleIn }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
              style={styles.gradientCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="heart" size={48} color="#E11D48" />
              </View>
              <Text style={styles.placeholderTitle}>Coming Soon</Text>
              <Text style={styles.placeholderText}>
                Your relationship journey starts here. Track meaningful moments, set couple goals, and grow together.
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>
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
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  placeholderCard: {
    width: '100%',
    borderRadius: 24,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#BE123C',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    letterSpacing: -0.2,
  },
});

export default LoveModePlaceholderScreen;
