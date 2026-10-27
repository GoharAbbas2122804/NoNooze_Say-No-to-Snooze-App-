import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '../theme/tokens';
import { useAlarmStore } from '../store/alarm-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen and reschedule enabled alarms
    SplashScreen.hideAsync().catch(() => {});
    useAlarmStore.getState().rescheduleAll().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="permissions" />
        <Stack.Screen
          name="ringing"
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen name="success" options={{ animation: 'fade' }} />
        <Stack.Screen name="gallery" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
