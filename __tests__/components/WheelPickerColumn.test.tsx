import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { WheelPickerColumn } from '../../src/components/alarm/WheelPicker';

describe('WheelPickerColumn', () => {
  const items = ['00', '01', '02', '03', '04', '05'];

  it('renders items and selected item clearly', async () => {
    const onSelect = jest.fn();
    await render(
      <WheelPickerColumn
        testID="test-wheel"
        items={items}
        selectedIndex={2}
        onSelectIndex={onSelect}
      />
    );

    expect(screen.getByTestId('test-wheel')).toBeTruthy();
    expect(screen.getByText('02')).toBeTruthy();
  });

  it('steps up and down when nudge buttons are tapped', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    await render(
      <WheelPickerColumn
        items={items}
        selectedIndex={2}
        onSelectIndex={onSelect}
      />
    );

    // Tap step down / next value
    const downBtn = screen.getByLabelText('Next value');
    await user.press(downBtn);
    expect(onSelect).toHaveBeenCalledWith(3);

    // Tap step up / previous value (from 3 back to 2)
    const upBtn = screen.getByLabelText('Previous value');
    await user.press(upBtn);
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('triggers onSelectIndex when an individual number is pressed', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    await render(
      <WheelPickerColumn
        items={items}
        selectedIndex={0}
        onSelectIndex={onSelect}
      />
    );

    const targetItem = screen.getByText('04');
    await user.press(targetItem);
    expect(onSelect).toHaveBeenCalledWith(4);
  });

  it('renders column label when provided', async () => {
    await render(
      <WheelPickerColumn
        items={items}
        selectedIndex={0}
        onSelectIndex={jest.fn()}
        label="HOURS"
      />
    );

    expect(screen.getByText('HOURS')).toBeTruthy();
  });
});

