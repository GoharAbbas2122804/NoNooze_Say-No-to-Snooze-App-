import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WeekdayStrip } from '../../src/components/alarm/WeekdayStrip';
import { ThemeProvider } from '../../src/theme/ThemeProvider';
import { DayOfWeek } from '../../src/domain/types';

describe('WeekdayStrip Component', () => {
  it('renders all 7 days Mon through Sun', async () => {
    const onSelectDay = jest.fn();

    await render(
      <ThemeProvider>
        <WeekdayStrip selectedDay={4} onSelectDay={onSelectDay} />
      </ThemeProvider>
    );

    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.getByText('Thu')).toBeTruthy();
    expect(screen.getByText('Fri')).toBeTruthy();
    expect(screen.getByText('Sat')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();
  });

  it('indicates selected day and triggers onSelectDay callback', async () => {
    const onSelectDay = jest.fn();

    await render(
      <ThemeProvider>
        <WeekdayStrip selectedDay={4} onSelectDay={onSelectDay} />
      </ThemeProvider>
    );

    const mondayItem = screen.getByTestId('weekday-item-1');
    fireEvent.press(mondayItem);

    expect(onSelectDay).toHaveBeenCalledWith(1 as DayOfWeek);
  });
});
