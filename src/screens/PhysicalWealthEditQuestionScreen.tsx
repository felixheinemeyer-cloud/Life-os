import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Import content components
import PhysicalWealthQuestion1Content from '../components/physicalwealth/PhysicalWealthQuestion1Content';
import PhysicalWealthQuestion2Content from '../components/physicalwealth/PhysicalWealthQuestion2Content';
import PhysicalWealthQuestion3Content from '../components/physicalwealth/PhysicalWealthQuestion3Content';
import PhysicalWealthQuestion4Content from '../components/physicalwealth/PhysicalWealthQuestion4Content';

interface PhysicalWealthEditQuestionScreenProps {
  navigation: {
    goBack: () => void;
  };
  route: {
    params: {
      questionNumber: number;
      currentAnswer: string;
    };
  };
}

const PhysicalWealthEditQuestionScreen: React.FC<PhysicalWealthEditQuestionScreenProps> = ({
  navigation,
  route,
}) => {
  const { questionNumber, currentAnswer } = route.params;
  const [answer, setAnswer] = useState(currentAnswer || '');

  const handleBack = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleSave = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // TODO: Save the answer to storage/state
    console.log(`Saving question ${questionNumber}:`, answer);
    navigation.goBack();
  };

  const renderQuestionContent = () => {
    const props = {
      answer,
      onAnswerChange: setAnswer,
      onContinue: handleSave,
      buttonText: 'Save Changes',
    };

    switch (questionNumber) {
      case 1:
        return <PhysicalWealthQuestion1Content {...props} />;
      case 2:
        return <PhysicalWealthQuestion2Content {...props} />;
      case 3:
        return <PhysicalWealthQuestion3Content {...props} />;
      case 4:
        return <PhysicalWealthQuestion4Content {...props} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" style={{ marginLeft: -2 }} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Question Content */}
        {renderQuestionContent()}
      </View>
    </SafeAreaView>
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

  // Header - Fixed
  header: {
    backgroundColor: '#F0EEE8',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  headerSpacer: {
    width: 40,
  },
});

export default PhysicalWealthEditQuestionScreen;
