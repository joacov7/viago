import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import PinScreen from './src/screens/PinScreen';
import HomeScreen from './src/screens/HomeScreen';
import OrderScreen from './src/screens/OrderScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0f2142" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Pin" component={PinScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Order" component={OrderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
