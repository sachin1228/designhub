import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";

import { getToken } from "../lib/auth";
import LoginScreen from "../screens/LoginScreen";
import CommunitiesScreen from "../screens/CommunitiesScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

export type AppTabParamList = {
  Communities: undefined;
  Profile: undefined;
};

export type CommunitiesStackParamList = {
  CommunitiesList: undefined;
  Chat: { communityId: string; communityName: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppTab = createBottomTabNavigator<AppTabParamList>();
const CommunitiesStack = createNativeStackNavigator<CommunitiesStackParamList>();

function CommunitiesStackNavigator() {
  return (
    <CommunitiesStack.Navigator>
      <CommunitiesStack.Screen
        name="CommunitiesList"
        component={CommunitiesScreen}
        options={{ title: "Communities" }}
      />
      <CommunitiesStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.communityName })}
      />
    </CommunitiesStack.Navigator>
  );
}

function AppTabs() {
  return (
    <AppTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { borderTopColor: "#e5e7eb" },
        headerShown: false,
      }}
    >
      <AppTab.Screen
        name="Communities"
        component={CommunitiesStackNavigator}
        options={{
          tabBarLabel: "Communities",
        }}
      />
      <AppTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          headerShown: true,
          title: "My Profile",
        }}
      />
    </AppTab.Navigator>
  );
}

export default function Navigation() {
  const [initialRoute, setInitialRoute] = useState<"Login" | "App" | null>(null);

  useEffect(() => {
    getToken().then((token) => {
      setInitialRoute(token ? "App" : "Login");
    });
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="App" component={AppTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
