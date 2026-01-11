import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface RelationshipModeSelectionScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

const RelationshipModeSelectionScreen: React.FC<RelationshipModeSelectionScreenProps> = ({ navigation }) => {
  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const introOpacity = useRef(new Animated.Value(0)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card1TranslateY = useRef(new Animated.Value(30)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card2TranslateY = useRef(new Animated.Value(30)).current;

  // Scale animations for press
  const scale1 = useRef(new Animated.Value(1)).current;
  const scale2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      // Header fades in
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
      // Intro text fades in
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Cards stagger in
      Animated.stagger(120, [
        Animated.parallel([
          Animated.timing(card1Opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(card1TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(card2Opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(card2TranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

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
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </Animated.View>

        {/* Question Section - positioned at top like Evening Tracking */}
        <Animated.View style={[styles.questionSection, { opacity: introOpacity }]}>
          <Text style={styles.questionText}>What's your current situation?</Text>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          {/* Love Card - In a Relationship */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(scale1)}
            onPressOut={() => handlePressOut(scale1)}
            onPress={() => handleCardPress('RelationshipSetup')}
            style={styles.cardTouchable}
          >
            <Animated.View
              style={[
                styles.cardWrapper,
                styles.loveCardWrapper,
                {
                  opacity: card1Opacity,
                  transform: [
                    { translateY: card1TranslateY },
                    { scale: scale1 },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#FFF1F2', '#FFE4E6', '#FECDD3']}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <View style={[styles.iconCircle, styles.loveIconCircle]}>
                    <Ionicons name="heart" size={32} color="#E11D48" />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, styles.loveCardTitle]}>Love</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>In a relationship</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          {/* Dating Card */}
          <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => handlePressIn(scale2)}
            onPressOut={() => handlePressOut(scale2)}
            onPress={() => handleCardPress('DatingHome')}
            style={styles.cardTouchable}
          >
            <Animated.View
              style={[
                styles.cardWrapper,
                styles.datingCardWrapper,
                {
                  opacity: card2Opacity,
                  transform: [
                    { translateY: card2TranslateY },
                    { scale: scale2 },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#FDF4FF', '#FAE8FF', '#F5D0FE']}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <View style={[styles.iconCircle, styles.datingIconCircle]}>
                    <Ionicons name="people" size={32} color="#A855F7" />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, styles.datingCardTitle]}>Dating</Text>
                  <Text style={styles.cardDescription} numberOfLines={2}>Meeting new people</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Footer - positioned at bottom */}
        <View style={styles.footerContainer}>
          <View style={styles.footerCard}>
            <Ionicons name="sync-outline" size={18} color="#6B7280" />
            <Text style={styles.footerText}>You can always change this later</Text>
          </View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#F7F5F2',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
    lineHeight: 22,
  },
  questionSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
    marginBottom: 32,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cardTouchable: {
    flex: 1,
  },
  cardWrapper: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  loveIconCircle: {
    shadowColor: '#E11D48',
  },
  datingIconCircle: {
    shadowColor: '#A855F7',
  },
  loveCardWrapper: {
    shadowColor: '#E11D48',
  },
  datingCardWrapper: {
    shadowColor: '#A855F7',
  },
  cardContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  loveCardTitle: {
    color: '#BE123C',
  },
  datingCardTitle: {
    color: '#7C3AED',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    minHeight: 36,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    paddingTop: 8, paddingBottom: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: -0.2,
  },
});

export default RelationshipModeSelectionScreen;
