import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MediaProvider } from './src/context/MediaContext';

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
import HomeIcon from './src/components/HomeIcon';
import BrainIcon from './src/components/BrainIcon';
import CalendarIcon from './src/components/CalendarIcon';
import MindsetIdentityScreen from './src/screens/MindsetIdentityScreen';
import KnowledgeVaultScreen from './src/screens/KnowledgeVaultScreen';
import MediaVaultScreen from './src/screens/MediaVaultScreen';
import MediaVaultNewEntryScreen from './src/screens/MediaVaultNewEntryScreen';
import MediaVaultEntryScreen from './src/screens/MediaVaultEntryScreen';
import BookVaultScreen from './src/screens/BookVaultScreen';
import PeopleCRMScreen from './src/screens/PeopleCRMScreen';
import PeopleEntryScreen from './src/screens/PeopleEntryScreen';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import LoveDatingScreen from './src/screens/LoveDatingScreen';
import StoryBankScreen from './src/screens/StoryBankScreen';
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
import HigherSelfScreen from './src/screens/HigherSelfScreen';
import MindsetBeliefsScreen from './src/screens/MindsetBeliefsScreen';
import PhysicalWealthIntroAnimationScreen from './src/screens/PhysicalWealthIntroAnimationScreen';
import PhysicalWealthIntroScreen from './src/screens/PhysicalWealthIntroScreen';
import PhysicalWealthQuestionsContainerScreen from './src/screens/PhysicalWealthQuestionsContainerScreen';
import PhysicalWealthOverviewScreen from './src/screens/PhysicalWealthOverviewScreen';

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
      <Stack.Screen name="MediaVault" component={MediaVaultScreen} />
      <Stack.Screen
        name="MediaVaultNewEntry"
        component={MediaVaultNewEntryScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="MediaVaultEntry" component={MediaVaultEntryScreen} />
      <Stack.Screen name="BookVault" component={BookVaultScreen} />
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
      <Stack.Screen name="DateIdeasList" component={DateIdeasListScreen} />
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
      <Stack.Screen name="PhysicalWealthIntroAnimation" component={PhysicalWealthIntroAnimationScreen} />
      <Stack.Screen name="PhysicalWealthIntro" component={PhysicalWealthIntroScreen} />
      <Stack.Screen name="PhysicalWealthQuestions" component={PhysicalWealthQuestionsContainerScreen} />
      <Stack.Screen name="PhysicalWealthOverview" component={PhysicalWealthOverviewScreen} />
    </Stack.Navigator>
  );
};

const App = (): React.JSX.Element => {
  return (
    <SafeAreaProvider>
      <MediaProvider>
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
      </MediaProvider>
    </SafeAreaProvider>
  );
};

export default App;
