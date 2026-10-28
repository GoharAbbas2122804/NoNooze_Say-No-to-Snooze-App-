import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '../../src/theme/ThemeProvider';

function TestConsumer() {
  const { themeMode, resolvedTheme, isDark, toggleTheme, setThemeMode } = useTheme();
  return (
    <>
      <Text testID="theme-mode">{themeMode}</Text>
      <Text testID="resolved-theme">{resolvedTheme}</Text>
      <Text testID="is-dark">{isDark ? 'true' : 'false'}</Text>
      <TouchableOpacity testID="toggle-btn" onPress={toggleTheme}>
        <Text>Toggle</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="set-light-btn" onPress={() => setThemeMode('light')}>
        <Text>Set Light</Text>
      </TouchableOpacity>
    </>
  );
}

describe('ThemeProvider & useTheme', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('renders default system theme and resolves to light or dark', async () => {
    await render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-mode').props.children).toBe('system');
  });

  it('persists and updates theme mode when explicitly changed', async () => {
    await render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByTestId('set-light-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('theme-mode').props.children).toBe('light');
      expect(screen.getByTestId('resolved-theme').props.children).toBe('light');
      expect(screen.getByTestId('is-dark').props.children).toBe('false');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
  });

  it('toggles theme between dark and light', async () => {
    await render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    fireEvent.press(screen.getByTestId('set-light-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme').props.children).toBe('light');
    });

    fireEvent.press(screen.getByTestId('toggle-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('resolved-theme').props.children).toBe('dark');
    });
  });
});
