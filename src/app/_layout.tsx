import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import notifee, { EventType } from 'react-native-notify-kit';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import {
  useFonts,
  InterTight_300Light,
  InterTight_500Medium,
  InterTight_700Bold,
} from '@expo-google-fonts/inter-tight';
import { Doto_700Bold } from '@expo-google-fonts/doto';

import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { useAlarmStore } from '../store/alarm-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
      <Toaster
        theme={isDark ? 'light' : 'dark'}
        position="top-center"
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InterTight_300Light,
    InterTight_500Medium,
    InterTight_700Bold,
    Doto_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
    useAlarmStore.getState().rescheduleAll().catch(() => {});

    // Route to ringing screen if launched by alarm notification
    notifee
      .getInitialNotification()
      .then((initial) => {
        const alarmId = initial?.notification?.data?.alarmId;
        if (alarmId) {
          useAlarmStore.getState().setActiveAlarmId(String(alarmId));
          router.replace({ pathname: '/ringing', params: { id: String(alarmId) } });
        }
      })
      .catch(() => {});

    // Listen to live / foreground notification events
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      const alarmId = detail.notification?.data?.alarmId;
      if (
        alarmId &&
        (type === EventType.PRESS ||
          type === EventType.ACTION_PRESS ||
          type === EventType.DELIVERED)
      ) {
        useAlarmStore.getState().setActiveAlarmId(String(alarmId));
        router.replace({ pathname: '/ringing', params: { id: String(alarmId) } });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigation />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
