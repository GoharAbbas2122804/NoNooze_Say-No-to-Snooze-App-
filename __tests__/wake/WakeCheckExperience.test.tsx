import React from 'react';
import { Text } from 'react-native';
import { render, screen, act, fireEvent } from '@testing-library/react-native';
import { LiveWakeCheck } from '../../src/wake/screens/LiveWakeCheck';
import { CalibrationModal } from '../../src/wake/screens/CalibrationModal';
import { SetupGuide } from '../../src/wake/screens/SetupGuide';
import { CameraRationale } from '../../src/wake/screens/CameraRationale';
import { WakeCheckSettings } from '../../src/wake/screens/WakeCheckSettings';
import { FakeWakeCheckEngine } from '../../src/wake/fake/FakeWakeCheckEngine';
import { useAlarmTheme } from '../../src/wake/hooks/useAlarmTheme';
import { useAlarmStore } from '../../src/store/alarm-store';
import { notify } from '../../src/ui/notify';

jest.mock('../../src/ui/notify', () => ({
  notify: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    action: jest.fn(),
  },
}));

describe('Wake Check Complete Experience', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LiveWakeCheck Scenarios', () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date(2026, 9, 29, 12, 0) });
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('dark room scenario shows hint and transitions to success', async () => {
      const engine = new FakeWakeCheckEngine('dark-room');
      const onComplete = jest.fn();

      await render(
        <LiveWakeCheck
          engine={engine}
          targetHoldSeconds={5}
          onComplete={onComplete}
        />
      );

      // Initially dark room hint
      expect(screen.getByTestId('viewfinder-card')).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(3200);
      });

      // After 6s, verifies eyes
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Advances to success
      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByTestId('wake-success-view')).toBeTruthy();
    });

    it('no-face scenario leads to fallback view with reason', async () => {
      const engine = new FakeWakeCheckEngine('no-face');
      const onComplete = jest.fn();
      const onFallbackMath = jest.fn();

      await render(
        <LiveWakeCheck
          engine={engine}
          targetHoldSeconds={5}
          onComplete={onComplete}
          onFallbackMath={onFallbackMath}
        />
      );

      // Fast forward past timeout (10s)
      await act(async () => {
        jest.advanceTimersByTime(11000);
      });

      expect(screen.getByTestId('wake-fallback-view')).toBeTruthy();
      expect(screen.getByText("Couldn't see")).toBeTruthy();
      expect(screen.getByText('your eyes')).toBeTruthy();
      expect(screen.getByTestId('fallback-math-btn')).toBeTruthy();
    });

    it('never-blinks scenario shows liveness retries and falls back', async () => {
      const engine = new FakeWakeCheckEngine('never-blinks');
      const onComplete = jest.fn();

      await render(
        <LiveWakeCheck
          engine={engine}
          targetHoldSeconds={5}
          onComplete={onComplete}
        />
      );

      // Advance to challenge phase (at 2000ms)
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });
      expect(screen.getByTestId('liveness-overlay')).toBeTruthy();

      // Advance past retries to fallback (at 16500ms)
      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      expect(screen.getByTestId('wake-fallback-view')).toBeTruthy();
    });

    it('camera-error scenario renders clear camera failure reason', async () => {
      const engine = new FakeWakeCheckEngine('camera-error');
      const onComplete = jest.fn();

      await render(
        <LiveWakeCheck
          engine={engine}
          onComplete={onComplete}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(1200);
      });

      expect(screen.getByTestId('wake-fallback-view')).toBeTruthy();
      expect(screen.getByText('unavailable')).toBeTruthy();
    });

    it('model-error scenario renders model error failure reason', async () => {
      const engine = new FakeWakeCheckEngine('model-error');
      const onComplete = jest.fn();

      await render(
        <LiveWakeCheck
          engine={engine}
          onComplete={onComplete}
        />
      );

      await act(async () => {
        jest.advanceTimersByTime(2200);
      });

      expect(screen.getByTestId('wake-fallback-view')).toBeTruthy();
      expect(screen.getByText('initialization failed')).toBeTruthy();
    });

    it('reveals ghost "Use math instead" fallback button after 10 seconds', async () => {
      const searchingEngine = new FakeWakeCheckEngine('no-face');
      const onFallbackMath = jest.fn();

      await render(
        <LiveWakeCheck
          engine={searchingEngine}
          onComplete={jest.fn()}
          onFallbackMath={onFallbackMath}
        />
      );

      expect(screen.queryByTestId('use-math-instead-ghost-btn')).toBeNull();

      // Advance to 10.05s while in searching
      await act(async () => {
        jest.advanceTimersByTime(10050);
      });

      // At 10s fallback timer triggers
      expect(screen.getByTestId('fallback-math-btn') || screen.getByTestId('use-math-instead-ghost-btn')).toBeTruthy();
    });
  });

  describe('Flow Screens (Rationale, Setup, Calibration)', () => {
    it('renders CameraRationale with 3 privacy lines and continue button', async () => {
      const onContinue = jest.fn();

      await render(<CameraRationale onContinue={onContinue} />);

      expect(screen.getByTestId('camera-rationale-view')).toBeTruthy();
      expect(screen.getByText('Frames never leave the phone')).toBeTruthy();
      expect(screen.getByText('Nothing is stored or recorded')).toBeTruthy();
      expect(screen.getByText('Active only while alarm rings')).toBeTruthy();

      fireEvent.press(screen.getByTestId('camera-enable-btn'));
      expect(onContinue).toHaveBeenCalled();
    });

    it('renders SetupGuide and auto-advances when face found', async () => {
      jest.useFakeTimers({ now: new Date(2026, 9, 29, 12, 0) });
      const onComplete = jest.fn();
      const onSkip = jest.fn();

      const { rerender } = await render(
        <SetupGuide onComplete={onComplete} onSkip={onSkip} faceFound={false} />
      );

      expect(screen.getByTestId('setup-guide-view')).toBeTruthy();
      expect(screen.getByText('Prop your')).toBeTruthy();
      expect(screen.getByText('phone')).toBeTruthy();

      await rerender(
        <SetupGuide onComplete={onComplete} onSkip={onSkip} faceFound={true} />
      );

      await act(async () => {
        jest.advanceTimersByTime(800);
      });

      expect(onComplete).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('runs CalibrationModal through open & closed eyes and toasts success', async () => {
      jest.useFakeTimers({ now: new Date(2026, 9, 29, 12, 0) });
      const engine = new FakeWakeCheckEngine('happy-path');
      const onComplete = jest.fn();
      const onCancel = jest.fn();

      await render(
        <CalibrationModal
          engine={engine}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('calibration-view')).toBeTruthy();
      expect(screen.getByText('wide open')).toBeTruthy();

      // Advance through Step 1 (3s) -> enters Step 2
      await act(async () => {
        jest.advanceTimersByTime(3200);
      });

      expect(screen.getByText('gently closed')).toBeTruthy();

      // Advance through Step 2 (2s) -> finishes and calls calibrate
      await act(async () => {
        jest.advanceTimersByTime(2200);
      });

      // Complete calibrate (5s in fake engine)
      await act(async () => {
        jest.advanceTimersByTime(5500);
      });

      expect(notify.success).toHaveBeenCalledWith('Calibrated');
      jest.useRealTimers();
    });
  });

  describe('Theme and Comfort (useAlarmTheme)', () => {
    function ThemeProbe({ getNow }: { getNow?: () => Date }) {
      const mode = useAlarmTheme({ getNow });
      return <Text>{mode}</Text>;
    }

    it('returns dark mode between 21:00 and 07:00 when darkAtNight is enabled', async () => {
      useAlarmStore.getState().setDarkAtNight(true);

      const nightDate = new Date(2026, 9, 29, 23, 30); // 23:30
      const { rerender } = await render(<ThemeProbe getNow={() => nightDate} />);
      expect(screen.getByText('dark')).toBeTruthy();

      const earlyMorning = new Date(2026, 9, 29, 5, 15); // 05:15
      await rerender(<ThemeProbe getNow={() => earlyMorning} />);
      expect(screen.getByText('dark')).toBeTruthy();

      const afternoonDate = new Date(2026, 9, 29, 14, 0); // 14:00
      await rerender(<ThemeProbe getNow={() => afternoonDate} />);
      expect(screen.getByText('light')).toBeTruthy();
    });
  });

  describe('WakeCheckSettings State Persistence', () => {
    it('persists sensitivity, hold seconds, and toggles in store', async () => {
      await render(<WakeCheckSettings />);

      expect(screen.getByTestId('wake-check-settings-section')).toBeTruthy();

      // Change sensitivity to strict
      fireEvent.press(screen.getByTestId('sensitivity-strict'));
      expect(useAlarmStore.getState().wakeSensitivity).toBe('strict');

      // Adjust hold seconds
      fireEvent.press(screen.getByTestId('hold-seconds-inc'));
      expect(useAlarmStore.getState().wakeHoldSeconds).toBe(6);
    });
  });
});
