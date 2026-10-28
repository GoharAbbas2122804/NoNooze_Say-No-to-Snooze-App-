import { notify } from '../../src/ui/notify';
import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';

describe('notify facade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers haptics and delegates success to toast.success', () => {
    notify.success('Alarm saved');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(toast.success).toHaveBeenCalledWith(
      'Alarm saved',
      expect.objectContaining({ duration: 3000 })
    );
  });

  it('triggers error notification and rate-limits rapid duplicate errors', () => {
    notify.error('Wrong answer');
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');

    // Immediate repeat with same message within rate limit window
    notify.error('Wrong answer');
    expect(toast.error).toHaveBeenCalledTimes(1); // Not called second time
  });

  it('triggers warning notification with action callback', () => {
    const onActionPress = jest.fn();
    notify.warning('Permission required', {
      action: { label: 'Settings', onPress: onActionPress },
    });

    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
    expect(toast.warning).toHaveBeenCalledWith(
      'Permission required',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Settings' }),
      })
    );
  });

  it('delegates action toast with Undo callback', () => {
    const onUndo = jest.fn();
    notify.action('Alarm deleted', { label: 'Undo', onPress: onUndo });

    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      'Alarm deleted',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Undo' }),
      })
    );
  });
});
