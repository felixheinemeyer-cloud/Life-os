import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface MindsetIdentityScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

const MindsetIdentityScreen: React.FC<MindsetIdentityScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  // Scale animations for press (no entrance animations - content shows immediately)
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;

  const handlePressIn = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = (scaleAnim: Animated.Value) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handleCardPress = (route: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(route);
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
      >
        {/* Scrollable Title */}
        <View style={styles.scrollableTitle}>
          <Text style={styles.title}>Mindset & Identity</Text>
          <Text style={styles.subtitle}>Shape who you want to become</Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* Higher Self Card */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(scale1)}
            onPressOut={() => handlePressOut(scale1)}
            onPress={() => handleCardPress('HigherSelf')}
          >
            <Animated.View
              style={[
                styles.featureCardWrapper,
                {
                  transform: [{ scale: scale1 }],
                },
              ]}
            >
              <LinearGradient
                colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
                style={styles.featureCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="star" size={36} color="#6366F1" />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Your Best Version</Text>
                  <Text style={styles.cardDescription}>
                    Define your ideal self, set aspirations, and visualize who you want to become
                  </Text>
                </View>

                {/* Arrow indicator */}
                <View style={styles.arrowContainer}>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                  </View>
                </View>

                {/* Decorative elements */}
                <View style={[styles.decorDot, styles.dot1]} />
                <View style={[styles.decorDot, styles.dot2]} />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Mindset Card */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(scale2)}
            onPressOut={() => handlePressOut(scale2)}
            onPress={() => handleCardPress('MindsetBeliefs')}
          >
            <Animated.View
              style={[
                styles.featureCardWrapper,
                {
                  transform: [{ scale: scale2 }],
                },
              ]}
            >
              <LinearGradient
                colors={['#E0E7FF', '#C7D2FE', '#A5B4FC']}
                style={styles.featureCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="diamond" size={36} color="#6366F1" />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Mindset</Text>
                  <Text style={styles.cardDescription}>
                    Track beliefs, affirmations, and mental frameworks that empower your growth
                  </Text>
                </View>

                {/* Arrow indicator */}
                <View style={styles.arrowContainer}>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                  </View>
                </View>

                {/* Decorative elements */}
                <View style={[styles.decorDot, styles.dot1]} />
                <View style={[styles.decorDot, styles.dot2]} />
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  scrollableTitle: {
    marginBottom: 16,
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
  cardsContainer: {
    gap: 16,
  },
  featureCardWrapper: {
    borderRadius: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  featureCard: {
    borderRadius: 24,
    padding: 24,
    minHeight: 220,
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircleBlue: {
    shadowColor: '#4F46E5',
  },
  cardContent: {
    flex: 1,
    paddingRight: 60,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4338CA',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cardTitleBlue: {
    color: '#3730A3',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  arrowCircleBlue: {
    shadowColor: '#4F46E5',
  },
  decorDot: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dot1: {
    width: 80,
    height: 80,
    top: -20,
    right: -20,
  },
  dot2: {
    width: 40,
    height: 40,
    top: 60,
    right: 80,
  },
  dot1Blue: {
    width: 80,
    height: 80,
    top: -20,
    right: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dot2Blue: {
    width: 40,
    height: 40,
    top: 60,
    right: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default MindsetIdentityScreen;
