import { toast } from 'sonner-native';
import * as Haptics from 'expo-haptics';

export interface ToastAction {
  label: string;
  onClick?: () => void;
  onPress?: () => void;
}

export interface NotifyOptions {
  id?: string | number;
  description?: string;
  duration?: number;
  action?: ToastAction;
}

// Rate limiting map to prevent error stacking (e.g., multiple wrong math taps)
const lastErrorTimestamps = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 1200;

export const notify = {
  success: (message: string, options?: NotifyOptions) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    return toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      id: options?.id,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onPress || options.action.onClick || (() => {}),
          }
        : undefined,
    });
  },

  error: (message: string, options?: NotifyOptions) => {
    const now = Date.now();
    const last = lastErrorTimestamps.get(message) || 0;
    if (now - last < RATE_LIMIT_WINDOW_MS) {
      return options?.id || '';
    }
    lastErrorTimestamps.set(message, now);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    return toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 3500,
      id: options?.id,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onPress || options.action.onClick || (() => {}),
          }
        : undefined,
    });
  },

  warning: (message: string, options?: NotifyOptions) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    return toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      id: options?.id,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onPress || options.action.onClick || (() => {}),
          }
        : undefined,
    });
  },

  info: (message: string, options?: NotifyOptions) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    return toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 3000,
      id: options?.id,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onPress || options.action.onClick || (() => {}),
          }
        : undefined,
    });
  },

  action: (message: string, action: ToastAction, options?: Omit<NotifyOptions, 'action'>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    return toast(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      id: options?.id,
      action: {
        label: action.label,
        onClick: action.onPress || action.onClick || (() => {}),
      },
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    return toast.promise(promise, {
      loading: messages.loading,
      success:
        typeof messages.success === 'function'
          ? messages.success
          : () => messages.success as string,
      error:
        typeof messages.error === 'function'
          ? messages.error
          : () => messages.error as string,
    });
  },

  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  },
};
