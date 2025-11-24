import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import KnowledgeHubScreen from './src/screens/KnowledgeHubScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import InboxScreen from './src/screens/InboxScreen';
import InsightDetailScreen from './src/screens/InsightDetailScreen';
import MorningTrackingScreen from './src/screens/MorningTrackingScreen';
import HomeIcon from './src/components/HomeIcon';
import MindsetIdentityScreen from './src/screens/MindsetIdentityScreen';
import KnowledgeVaultScreen from './src/screens/KnowledgeVaultScreen';
import MediaVaultScreen from './src/screens/MediaVaultScreen';
import BookVaultScreen from './src/screens/BookVaultScreen';
import PeopleCRMScreen from './src/screens/PeopleCRMScreen';
import LoveDatingScreen from './src/screens/LoveDatingScreen';
import StoryBankScreen from './src/screens/StoryBankScreen';

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
      <Stack.Screen name="MorningTracking" component={MorningTrackingScreen} />
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
      <Stack.Screen name="KnowledgeVault" component={KnowledgeVaultScreen} />
      <Stack.Screen name="MediaVault" component={MediaVaultScreen} />
      <Stack.Screen name="BookVault" component={BookVaultScreen} />
      <Stack.Screen name="PeopleCRM" component={PeopleCRMScreen} />
      <Stack.Screen name="LoveDating" component={LoveDatingScreen} />
      <Stack.Screen name="StoryBank" component={StoryBankScreen} />
    </Stack.Navigator>
  );
};

const App = (): React.JSX.Element => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            headerShown: false,
          }}
        >
          <Tab.Screen
            name="KnowledgeHub"
            component={KnowledgeStack}
            options={{
              title: 'Knowledge Hub',
              tabBarLabel: 'Knowledge',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="library-outline" size={size} color={color} />
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
                <HomeIcon size={size} color={color} />
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
                <Ionicons name="calendar-outline" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
