import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MediaProvider } from './src/context/MediaContext';
import { BookProvider } from './src/context/BookContext';

import KnowledgeHubScreen from './src/screens/KnowledgeHubScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import InboxScreen from './src/screens/InboxScreen';
import InsightDetailScreen from './src/screens/InsightDetailScreen';
import MorningTrackingContainerScreen from './src/screens/MorningTrackingContainerScreen';
import MorningTrackingMindsetEntriesScreen from './src/screens/MorningTrackingMindsetEntriesScreen';
import MorningTrackingHigherSelfScreen from './src/screens/MorningTrackingHigherSelfScreen';
import MorningTrackingCompleteScreen from './src/screens/MorningTrackingCompleteScreen';
import EveningTrackingContainerScreen from './src/screens/EveningTrackingContainerScreen';
import EveningTrackingCompleteScreen from './src/screens/EveningTrackingCompleteScreen';
import WeeklyTrackingContainerScreen from './src/screens/WeeklyTrackingContainerScreen';
import WeeklyTrackingCompleteScreen from './src/screens/WeeklyTrackingCompleteScreen';
import MonthlyTrackingContainerScreen from './src/screens/MonthlyTrackingContainerScreen';
import MonthlyTrackingCompleteScreen from './src/screens/MonthlyTrackingCompleteScreen';
import MonthlyBodyTrackingContainerScreen from './src/screens/MonthlyBodyTrackingContainerScreen';
import HomeIcon from './src/components/HomeIcon';
import BrainIcon from './src/components/BrainIcon';
import CalendarIcon from './src/components/CalendarIcon';
import MindsetIdentityScreen from './src/screens/MindsetIdentityScreen';
import KnowledgeVaultScreen from './src/screens/KnowledgeVaultScreen';
import KnowledgeTopicScreen from './src/screens/KnowledgeTopicScreen';
import MediaVaultScreen from './src/screens/MediaVaultScreen';
import MediaVaultNewEntryScreen from './src/screens/MediaVaultNewEntryScreen';
import MediaVaultEntryScreen from './src/screens/MediaVaultEntryScreen';
import BookVaultScreen from './src/screens/BookVaultScreen';
import BookVaultNewEntryScreen from './src/screens/BookVaultNewEntryScreen';
import BookVaultEntryScreen from './src/screens/BookVaultEntryScreen';
import BookVaultNotesScreen from './src/screens/BookVaultNotesScreen';
import PeopleCRMScreen from './src/screens/PeopleCRMScreen';
import PeopleEntryScreen from './src/screens/PeopleEntryScreen';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import LoveDatingScreen from './src/screens/LoveDatingScreen';
import StoryBankScreen from './src/screens/StoryBankScreen';
import StoryDetailScreen from './src/screens/StoryDetailScreen';
import RelationshipModeSelectionScreen from './src/screens/RelationshipModeSelectionScreen';
import LoveModePlaceholderScreen from './src/screens/LoveModePlaceholderScreen';
import DatingModePlaceholderScreen from './src/screens/DatingModePlaceholderScreen';
import RelationshipSetupScreen from './src/screens/RelationshipSetupScreen';
import RelationshipHomeScreen from './src/screens/RelationshipHomeScreen';
import DateIdeasListScreen from './src/screens/DateIdeasListScreen';
import DatingHomeScreen from './src/screens/DatingHomeScreen';
import DatingCRMScreen from './src/screens/DatingCRMScreen';
import DatingEntryScreen from './src/screens/DatingEntryScreen';
import DatingDetailScreen from './src/screens/DatingDetailScreen';
import DatingAdviceDetailScreen from './src/screens/DatingAdviceDetailScreen';
import DateIdeaDetailScreen from './src/screens/DateIdeaDetailScreen';
import DateIdeaEntryScreen from './src/screens/DateIdeaEntryScreen';
import WeeklyCheckInScreen from './src/screens/WeeklyCheckInScreen';
import ConflictResolutionGuideScreen from './src/screens/ConflictResolutionGuideScreen';
import HigherSelfScreen from './src/screens/HigherSelfScreen';
import MindsetBeliefsScreen from './src/screens/MindsetBeliefsScreen';
import PhysicalWealthIntroAnimationScreen from './src/screens/PhysicalWealthIntroAnimationScreen';
import PhysicalWealthIntroScreen from './src/screens/PhysicalWealthIntroScreen';
import PhysicalWealthQuestionsContainerScreen from './src/screens/PhysicalWealthQuestionsContainerScreen';
import PhysicalWealthOverviewScreen from './src/screens/PhysicalWealthOverviewScreen';
import PhysicalWealthEditQuestionScreen from './src/screens/PhysicalWealthEditQuestionScreen';
import PhysicalWealthOptionalQuestionScreen from './src/screens/PhysicalWealthOptionalQuestionScreen';
import PhysicalWealthCustomQuestionScreen from './src/screens/PhysicalWealthCustomQuestionScreen';
import SocialWealthIntroAnimationScreen from './src/screens/SocialWealthIntroAnimationScreen';
import SocialWealthIntroScreen from './src/screens/SocialWealthIntroScreen';
import SocialWealthQuestionsContainerScreen from './src/screens/SocialWealthQuestionsContainerScreen';
import SocialWealthOverviewScreen from './src/screens/SocialWealthOverviewScreen';
import SocialWealthOptionalQuestionScreen from './src/screens/SocialWealthOptionalQuestionScreen';
import SocialWealthCustomQuestionScreen from './src/screens/SocialWealthCustomQuestionScreen';
import SocialWealthEditQuestionScreen from './src/screens/SocialWealthEditQuestionScreen';
import MentalWealthIntroAnimationScreen from './src/screens/MentalWealthIntroAnimationScreen';
import MentalWealthIntroScreen from './src/screens/MentalWealthIntroScreen';
import MentalWealthQuestionsContainerScreen from './src/screens/MentalWealthQuestionsContainerScreen';
import MentalWealthOverviewScreen from './src/screens/MentalWealthOverviewScreen';
import MentalWealthEditQuestionScreen from './src/screens/MentalWealthEditQuestionScreen';
import MentalWealthOptionalQuestionScreen from './src/screens/MentalWealthOptionalQuestionScreen';
import MentalWealthCustomQuestionScreen from './src/screens/MentalWealthCustomQuestionScreen';
import TimeWealthIntroAnimationScreen from './src/screens/TimeWealthIntroAnimationScreen';
import TimeWealthIntroScreen from './src/screens/TimeWealthIntroScreen';
import TimeWealthQuestionsContainerScreen from './src/screens/TimeWealthQuestionsContainerScreen';
import TimeWealthOverviewScreen from './src/screens/TimeWealthOverviewScreen';
import TimeWealthOptionalQuestionScreen from './src/screens/TimeWealthOptionalQuestionScreen';
import TimeWealthCustomQuestionScreen from './src/screens/TimeWealthCustomQuestionScreen';
import FinancialWealthIntroAnimationScreen from './src/screens/FinancialWealthIntroAnimationScreen';
import FinancialWealthIntroScreen from './src/screens/FinancialWealthIntroScreen';
import FinancialWealthQuestionsContainerScreen from './src/screens/FinancialWealthQuestionsContainerScreen';
import FinancialWealthOverviewScreen from './src/screens/FinancialWealthOverviewScreen';
import FinancialWealthOptionalQuestionScreen from './src/screens/FinancialWealthOptionalQuestionScreen';
import FinancialWealthCustomQuestionScreen from './src/screens/FinancialWealthCustomQuestionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dashboard Stack Navigator
const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="InsightDetail" component={InsightDetailScreen} />
      <Stack.Screen name="MorningTracking" component={MorningTrackingContainerScreen} />
      <Stack.Screen name="MorningTrackingMindsetEntries" component={MorningTrackingMindsetEntriesScreen} />
      <Stack.Screen name="MorningTrackingHigherSelf" component={MorningTrackingHigherSelfScreen} />
      <Stack.Screen name="MorningTrackingComplete" component={MorningTrackingCompleteScreen} />
      <Stack.Screen name="EveningTracking" component={EveningTrackingContainerScreen} />
      <Stack.Screen name="EveningTrackingComplete" component={EveningTrackingCompleteScreen} />
      <Stack.Screen name="WeeklyTracking" component={WeeklyTrackingContainerScreen} />
      <Stack.Screen name="WeeklyTrackingComplete" component={WeeklyTrackingCompleteScreen} />
      <Stack.Screen name="MonthlyTracking" component={MonthlyTrackingContainerScreen} />
      <Stack.Screen name="MonthlyTrackingComplete" component={MonthlyTrackingCompleteScreen} />
      <Stack.Screen name="MonthlyBodyTracking" component={MonthlyBodyTrackingContainerScreen} />
    </Stack.Navigator>
  );
};

// Knowledge Stack Navigator
const KnowledgeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="KnowledgeHubMain" component={KnowledgeHubScreen} />
      <Stack.Screen name="MindsetIdentity" component={MindsetIdentityScreen} />
      <Stack.Screen name="HigherSelf" component={HigherSelfScreen} />
      <Stack.Screen name="MindsetBeliefs" component={MindsetBeliefsScreen} />
      <Stack.Screen name="KnowledgeVault" component={KnowledgeVaultScreen} />
      <Stack.Screen name="KnowledgeTopic" component={KnowledgeTopicScreen as React.ComponentType<any>} />
      <Stack.Screen name="MediaVault" component={MediaVaultScreen} />
      <Stack.Screen
        name="MediaVaultNewEntry"
        component={MediaVaultNewEntryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="MediaVaultEntry" component={MediaVaultEntryScreen as React.ComponentType<any>} />
      <Stack.Screen name="BookVault" component={BookVaultScreen} />
      <Stack.Screen
        name="BookVaultNewEntry"
        component={BookVaultNewEntryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="BookVaultEntry" component={BookVaultEntryScreen as React.ComponentType<any>} />
      <Stack.Screen
        name="BookVaultNotes"
        component={BookVaultNotesScreen as React.ComponentType<any>}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="PeopleCRM" component={PeopleCRMScreen} />
      <Stack.Screen
        name="PeopleEntry"
        component={PeopleEntryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="ContactDetail" component={ContactDetailScreen} />
      <Stack.Screen name="LoveDating" component={RelationshipModeSelectionScreen} />
      <Stack.Screen name="LoveModePlaceholder" component={LoveModePlaceholderScreen} />
      <Stack.Screen name="DatingModePlaceholder" component={DatingModePlaceholderScreen} />
      <Stack.Screen name="RelationshipSetup" component={RelationshipSetupScreen} />
      <Stack.Screen name="RelationshipHome" component={RelationshipHomeScreen} />
      <Stack.Screen name="WeeklyCheckIn" component={WeeklyCheckInScreen} />
      <Stack.Screen name="ConflictResolutionGuide" component={ConflictResolutionGuideScreen} />
      <Stack.Screen name="DateIdeasList" component={DateIdeasListScreen} />
      <Stack.Screen name="DateIdeaDetail" component={DateIdeaDetailScreen} />
      <Stack.Screen
        name="DateIdeaEntry"
        component={DateIdeaEntryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="DatingHome" component={DatingHomeScreen} />
      <Stack.Screen name="DatingCRM" component={DatingCRMScreen} />
      <Stack.Screen
        name="DatingEntry"
        component={DatingEntryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="DatingDetail" component={DatingDetailScreen} />
      <Stack.Screen name="DatingAdviceDetail" component={DatingAdviceDetailScreen} />
      <Stack.Screen name="StoryBank" component={StoryBankScreen} />
      <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
      <Stack.Screen name="PhysicalWealthIntroAnimation" component={PhysicalWealthIntroAnimationScreen} />
      <Stack.Screen name="PhysicalWealthIntro" component={PhysicalWealthIntroScreen} />
      <Stack.Screen name="PhysicalWealthQuestions" component={PhysicalWealthQuestionsContainerScreen} />
      <Stack.Screen name="PhysicalWealthOverview" component={PhysicalWealthOverviewScreen} />
      <Stack.Screen name="PhysicalWealthEditQuestion" component={PhysicalWealthEditQuestionScreen} />
      <Stack.Screen name="PhysicalWealthOptionalQuestion" component={PhysicalWealthOptionalQuestionScreen as React.ComponentType<any>} />
      <Stack.Screen name="PhysicalWealthCustomQuestion" component={PhysicalWealthCustomQuestionScreen} />
      <Stack.Screen name="SocialWealthIntroAnimation" component={SocialWealthIntroAnimationScreen} />
      <Stack.Screen name="SocialWealthIntro" component={SocialWealthIntroScreen} />
      <Stack.Screen name="SocialWealthQuestions" component={SocialWealthQuestionsContainerScreen} />
      <Stack.Screen name="SocialWealthOverview" component={SocialWealthOverviewScreen} />
      <Stack.Screen name="SocialWealthOptionalQuestion" component={SocialWealthOptionalQuestionScreen as React.ComponentType<any>} />
      <Stack.Screen name="SocialWealthCustomQuestion" component={SocialWealthCustomQuestionScreen} />
      <Stack.Screen name="SocialWealthEditQuestion" component={SocialWealthEditQuestionScreen} />
      <Stack.Screen name="MentalWealthIntroAnimation" component={MentalWealthIntroAnimationScreen} />
      <Stack.Screen name="MentalWealthIntro" component={MentalWealthIntroScreen} />
      <Stack.Screen name="MentalWealthQuestions" component={MentalWealthQuestionsContainerScreen} />
      <Stack.Screen name="MentalWealthOverview" component={MentalWealthOverviewScreen} />
      <Stack.Screen name="MentalWealthEditQuestion" component={MentalWealthEditQuestionScreen} />
      <Stack.Screen name="MentalWealthOptionalQuestion" component={MentalWealthOptionalQuestionScreen as React.ComponentType<any>} />
      <Stack.Screen name="MentalWealthCustomQuestion" component={MentalWealthCustomQuestionScreen} />
      <Stack.Screen name="TimeWealthIntroAnimation" component={TimeWealthIntroAnimationScreen} />
      <Stack.Screen name="TimeWealthIntro" component={TimeWealthIntroScreen} />
      <Stack.Screen name="TimeWealthQuestions" component={TimeWealthQuestionsContainerScreen} />
      <Stack.Screen name="TimeWealthOverview" component={TimeWealthOverviewScreen} />
      <Stack.Screen name="TimeWealthOptionalQuestion" component={TimeWealthOptionalQuestionScreen as React.ComponentType<any>} />
      <Stack.Screen name="TimeWealthCustomQuestion" component={TimeWealthCustomQuestionScreen} />
      <Stack.Screen name="FinancialWealthIntroAnimation" component={FinancialWealthIntroAnimationScreen} />
      <Stack.Screen name="FinancialWealthIntro" component={FinancialWealthIntroScreen} />
      <Stack.Screen name="FinancialWealthQuestions" component={FinancialWealthQuestionsContainerScreen} />
      <Stack.Screen name="FinancialWealthOverview" component={FinancialWealthOverviewScreen} />
      <Stack.Screen name="FinancialWealthOptionalQuestion" component={FinancialWealthOptionalQuestionScreen as React.ComponentType<any>} />
      <Stack.Screen name="FinancialWealthCustomQuestion" component={FinancialWealthCustomQuestionScreen} />
    </Stack.Navigator>
  );
};

const App = (): React.JSX.Element => {
  return (
    <SafeAreaProvider>
      <MediaProvider>
        <BookProvider>
          <NavigationContainer>
          <StatusBar style="auto" />
          <Tab.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            tabBarActiveTintColor: '#1F2937',
            tabBarInactiveTintColor: '#9CA3AF',
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="KnowledgeHub"
            component={KnowledgeStack}
            options={{
              title: 'Second Brain',
              tabBarLabel: 'Second Brain',
              tabBarIcon: ({ color, size }) => (
                <BrainIcon size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Dashboard"
            component={DashboardStack}
            options={{
              title: 'Dashboard',
              tabBarLabel: 'Home',
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <View style={{ marginTop: -2 }}>
                  <HomeIcon size={size} color={color} />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              title: 'Calendar',
              tabBarLabel: 'Calendar',
              tabBarIcon: ({ color, size }) => (
                <CalendarIcon size={size} color={color} />
              ),
            }}
          />
          </Tab.Navigator>
          </NavigationContainer>
        </BookProvider>
      </MediaProvider>
    </SafeAreaProvider>
  );
};

export default App;
