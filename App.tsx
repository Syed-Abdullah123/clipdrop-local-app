import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import SplashScreen from './src/screens/SplashScreen';

// Prevent the native splash from auto-hiding the moment JS mounts —
// keep it visible until we explicitly call hideAsync() below.
ExpoSplashScreen.preventAutoHideAsync();
ExpoSplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // If you have fonts, assets, or async setup, await them here.
        // Even with nothing to load, this brief tick ensures navigation
        // and the first screen are fully mounted before we reveal them.
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This is called once the root view has actually laid out/painted,
      // so hiding the native splash here means your animated SplashScreen
      // component is already visible underneath — no white gap.
      await ExpoSplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <KeyboardProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0f0f0f" },
              animation: "fade",
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </KeyboardProvider>
  );
}