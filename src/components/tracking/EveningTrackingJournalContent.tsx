import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
  Animated,
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
  const buttonBottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const keyboardTop = e.endCoordinates.height - 80;
        Animated.timing(buttonBottom, {
          toValue: keyboardTop + 8,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(buttonBottom, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 250 : 0,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleTabChange = (tab: TabType): void => {
    if (tab !== activeTab) {
      Haptics.selectionAsync();
      setActiveTab(tab);
    }
  };

  const handleFocus = (): void => {
    setIsFocused(true);
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
    <TextInput
      ref={textInputRef}
      style={styles.freeWritingInput}
      placeholder="Reflect on your day..."
      placeholderTextColor="#9CA3AF"
      multiline
      scrollEnabled={false}
      value={journalText}
      onChangeText={onJournalChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      textAlignVertical="top"
      selectionColor="#1F2937"
      cursorColor="#1F2937"
    />
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
      <Animated.View
        style={[
          styles.buttonContainer,
          isFocused && styles.buttonContainerFocused,
          { bottom: buttonBottom }
        ]}
      >
        {isFocused ? (
          <TouchableOpacity
            style={styles.roundContinueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Finish Check-in</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
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
    paddingTop: 16,
    paddingBottom: 300,
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

  // Free Writing Input (Text mode)
  freeWritingInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#1F2937',
    letterSpacing: -0.1,
    lineHeight: 30,
    paddingHorizontal: 0,
    paddingTop: 8,
    minHeight: 200,
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F7F5F2',
  },
  buttonContainerFocused: {
    alignItems: 'flex-end',
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  continueButton: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 6,
    letterSpacing: -0.2,
  },
  roundContinueButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default EveningTrackingJournalContent;
