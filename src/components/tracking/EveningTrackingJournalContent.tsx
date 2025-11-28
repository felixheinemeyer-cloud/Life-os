import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

type TabType = 'text' | 'voice' | 'video';

interface EveningTrackingJournalContentProps {
  journalText: string;
  onJournalChange: (value: string) => void;
  onContinue: () => void;
}

const EveningTrackingJournalContent: React.FC<EveningTrackingJournalContentProps> = ({
  journalText,
  onJournalChange,
  onContinue,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleTabChange = (tab: TabType): void => {
    if (tab !== activeTab) {
      Haptics.selectionAsync();
      setActiveTab(tab);
    }
  };

  const handleFocus = (): void => {
    setIsFocused(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 120, animated: true });
    }, 100);
  };

  const handleBlur = (): void => {
    setIsFocused(false);
  };

  const tabs: { key: TabType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'text', icon: 'document-text', label: 'Text' },
    { key: 'voice', icon: 'mic', label: 'Voice' },
    { key: 'video', icon: 'videocam', label: 'Video' },
  ];

  const renderTextInput = () => (
    <View style={[styles.inputCard, isFocused && styles.inputCardFocused]}>
      <TextInput
        ref={textInputRef}
        style={styles.textInput}
        placeholder="Reflect on your day..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={8}
        value={journalText}
        onChangeText={onJournalChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        textAlignVertical="top"
      />
    </View>
  );

  const renderVoicePlaceholder = () => (
    <View style={styles.placeholderCard}>
      <LinearGradient
        colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
        style={styles.placeholderGradientRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.placeholderInnerCircle}>
          <Ionicons name="mic" size={28} color="#7C3AED" />
        </View>
      </LinearGradient>
      <Text style={styles.placeholderTitle}>Voice Recording</Text>
      <View style={styles.comingSoonBadge}>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
      </View>
      <Text style={styles.placeholderSubtext}>
        Record your thoughts hands-free
      </Text>
    </View>
  );

  const renderVideoPlaceholder = () => (
    <View style={styles.placeholderCard}>
      <LinearGradient
        colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
        style={styles.placeholderGradientRing}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.placeholderInnerCircle}>
          <Ionicons name="videocam" size={28} color="#7C3AED" />
        </View>
      </LinearGradient>
      <Text style={styles.placeholderTitle}>Video Journal</Text>
      <View style={styles.comingSoonBadge}>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
      </View>
      <Text style={styles.placeholderSubtext}>
        Capture moments with video
      </Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'text':
        return renderTextInput();
      case 'voice':
        return renderVoicePlaceholder();
      case 'video':
        return renderVideoPlaceholder();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={100}
    >
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Question Section */}
          <View style={styles.questionSection}>
            <LinearGradient
              colors={['#A78BFA', '#8B5CF6', '#7C3AED']}
              style={styles.iconGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconInnerCircle}>
                <Ionicons name="book" size={28} color="#7C3AED" />
              </View>
            </LinearGradient>
            <Text style={styles.questionText}>Journal Entry</Text>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentButton,
                  activeTab === tab.key && styles.segmentButtonActive,
                ]}
                onPress={() => handleTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.key ? '#6366F1' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.segmentText,
                    activeTab === tab.key && styles.segmentTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content Area */}
          <View style={styles.contentArea}>
            {renderContent()}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Finish Check-in</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F7F5F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Question Section
  questionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 3,
  },
  iconInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 28,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // Content Area
  contentArea: {
    flex: 1,
  },

  // Input Card (Text mode)
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputCardFocused: {
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    minHeight: 180,
    letterSpacing: -0.2,
    lineHeight: 24,
  },

  // Placeholder Card (Voice/Video modes)
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  placeholderGradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 3,
  },
  placeholderInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  comingSoonBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  placeholderSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Button Container
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F5F2',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    paddingVertical: 18,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    letterSpacing: -0.2,
  },
});

export default EveningTrackingJournalContent;
