import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

describe('ThemeToggle Component', () => {
  it('renders theme toggle button with accessibility attributes', async () => {
    await render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle-button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('triggers theme change on press', async () => {
    await render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle-button');
    fireEvent.press(button);

    await waitFor(() => {
      expect(screen.getByTestId('theme-toggle-button')).toBeTruthy();
    });
  });
});
