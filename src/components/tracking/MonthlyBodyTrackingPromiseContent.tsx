import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Sky blue color scheme for Monthly Body Check-In
const THEME_COLORS = {
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryLighter: '#BAE6FD',
  gradient: ['#BAE6FD', '#38BDF8', '#0EA5E9'] as const,
};

export interface BodyPromiseData {
  promise: string;
}

interface MonthlyBodyTrackingPromiseContentProps {
  data: BodyPromiseData;
  onDataChange: (data: BodyPromiseData) => void;
  onContinue: () => void;
}

const MonthlyBodyTrackingPromiseContent: React.FC<MonthlyBodyTrackingPromiseContentProps> = ({
  data,
  onDataChange,
  onContinue,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTextChange = (text: string) => {
    onDataChange({ promise: text });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={THEME_COLORS.gradient}
            style={styles.headerIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerIconInner}>
              <Ionicons name="heart" size={24} color={THEME_COLORS.primary} />
            </View>
          </LinearGradient>
          <Text style={styles.headerTitle}>One Small Promise</Text>
          <Text style={styles.headerSubtitle}>
            What's one kind thing you'll do for your body next month?
          </Text>
        </View>

        {/* Text Input Card */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Drink more water, stretch daily..."
            placeholderTextColor="#9CA3AF"
            value={data.promise}
            onChangeText={handleTextChange}
            multiline
            maxLength={150}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {data.promise.length}/150
          </Text>
        </View>

        {/* Encouragement Note */}
        <View style={styles.noteContainer}>
          <Ionicons name="sparkles" size={16} color={THEME_COLORS.primary} />
          <Text style={styles.noteText}>
            Small, consistent actions create lasting change
          </Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
    paddingHorizontal: 16,
    lineHeight: 22,
  },

  // Text Input Card
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    letterSpacing: -0.2,
    minHeight: 100,
    lineHeight: 24,
  },
  characterCount: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },

  // Encouragement Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default MonthlyBodyTrackingPromiseContent;
