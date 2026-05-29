/**
 * Sailing Weather Checker — mobile app
 * @format
 */
import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import DashboardScreen from './src/screens/DashboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: '#030712',
    card: '#0b1220',
    text: '#e5e7eb',
    border: '#1f2937',
    primary: '#38bdf8',
  },
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {backgroundColor: '#0b1220'},
            headerTintColor: '#e5e7eb',
          }}>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={({navigation}) => ({
              title: '⛵ Sailspots',
              headerRight: () => (
                <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={8}>
                  <Text style={styles.gear}>⚙︎</Text>
                </Pressable>
              ),
            })}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{title: 'Settings'}} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gear: {color: '#e5e7eb', fontSize: 20},
});

export default App;
