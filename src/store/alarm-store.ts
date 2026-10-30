import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../domain/types';
import { validateAlarm } from '../domain/validation';

import { getAlarmScheduler } from '../services/alarm-scheduler';

export interface AlarmStoreState {
  alarms: Alarm[];
  activeAlarmId: string | null;

  timeFormat: '12h' | '24h';
  alarmVolume: number;
  defaultSound: string;
  gentleWake: boolean;
  vibrate: boolean;
  customSounds: { id: string; name: string; description: string; uri?: string; category: string }[];

  // Wake Check Settings
  wakeSensitivity: 'relaxed' | 'standard' | 'strict';
  wakeHoldSeconds: number;
  wakeLiveness: boolean;
  wakeFillLight: boolean;
  darkAtNight: boolean;

  // Actions
  setTimeFormat: (format: '12h' | '24h') => void;
  setAlarmVolume: (volume: number) => void;
  setDefaultSound: (sound: string) => void;
  setGentleWake: (enabled: boolean) => void;
  setVibrate: (enabled: boolean) => void;
  setWakeSensitivity: (sensitivity: 'relaxed' | 'standard' | 'strict') => void;
  setWakeHoldSeconds: (seconds: number) => void;
  setWakeLiveness: (enabled: boolean) => void;
  setWakeFillLight: (enabled: boolean) => void;
  setDarkAtNight: (enabled: boolean) => void;
  addCustomSound: (sound: { id: string; name: string; description: string; uri?: string; category: string }) => void;
  removeCustomSound: (id: string) => void;
  addAlarm: (
    alarmData: Omit<Alarm, 'id'>
  ) => { success: boolean; id?: string; errors?: string[] };
  updateAlarm: (
    id: string,
    updates: Partial<Omit<Alarm, 'id'>>
  ) => { success: boolean; errors?: string[] };
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  rescheduleAll: () => Promise<void>;
  setActiveAlarmId: (id: string | null) => void;
  getAlarmById: (id: string) => Alarm | undefined;
}

export const useAlarmStore = create<AlarmStoreState>()(
  persist(
    (set, get) => ({
      alarms: [],
      activeAlarmId: null,
      timeFormat: '12h',
      alarmVolume: 80,
      defaultSound: 'Melodian',
      gentleWake: true,
      vibrate: true,
      customSounds: [],
      wakeSensitivity: 'standard',
      wakeHoldSeconds: 5,
      wakeLiveness: true,
      wakeFillLight: true,
      darkAtNight: true,

      setTimeFormat: (format) => set({ timeFormat: format }),
      setAlarmVolume: (volume) =>
        set({ alarmVolume: Math.max(0, Math.min(100, Math.round(volume))) }),
      setDefaultSound: (sound) => set({ defaultSound: sound }),
      setGentleWake: (gentleWake) => set({ gentleWake }),
      setVibrate: (vibrate) => set({ vibrate }),
      setWakeSensitivity: (wakeSensitivity) => set({ wakeSensitivity }),
      setWakeHoldSeconds: (wakeHoldSeconds) =>
        set({ wakeHoldSeconds: Math.max(3, Math.min(10, Math.round(wakeHoldSeconds))) }),
      setWakeLiveness: (wakeLiveness) => set({ wakeLiveness }),
      setWakeFillLight: (wakeFillLight) => set({ wakeFillLight }),
      setDarkAtNight: (darkAtNight) => set({ darkAtNight }),
      addCustomSound: (sound) =>
        set((state) => ({
          customSounds: [
            ...state.customSounds.filter((s) => s.id !== sound.id),
            sound,
          ],
        })),
      removeCustomSound: (id) =>
        set((state) => ({
          customSounds: state.customSounds.filter((s) => s.id !== id),
        })),

      addAlarm: (alarmData) => {
        const tempAlarm: Alarm = {
          ...alarmData,
          sound: alarmData.sound || get().defaultSound || 'Melodian',
          id: `alarm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };

        const validation = validateAlarm(tempAlarm);
        if (!validation.valid) {
          return { success: false, errors: validation.errors };
        }

        set((state) => ({
          alarms: [...state.alarms, tempAlarm],
        }));

        if (tempAlarm.enabled) {
          getAlarmScheduler().schedule(tempAlarm).catch(() => {});
        }

        return { success: true, id: tempAlarm.id };
      },

      updateAlarm: (id, updates) => {
        const existing = get().getAlarmById(id);
        if (!existing) {
          return { success: false, errors: ['Alarm not found'] };
        }

        const merged: Alarm = { ...existing, ...updates };
        const validation = validateAlarm(merged);
        if (!validation.valid) {
          return { success: false, errors: validation.errors };
        }

        set((state) => ({
          alarms: state.alarms.map((a) => (a.id === id ? merged : a)),
        }));

        if (merged.enabled) {
          getAlarmScheduler().schedule(merged).catch(() => {});
        } else {
          getAlarmScheduler().cancel(id).catch(() => {});
        }

        return { success: true };
      },

      deleteAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
          activeAlarmId: state.activeAlarmId === id ? null : state.activeAlarmId,
        }));
        getAlarmScheduler().cancel(id).catch(() => {});
      },

      toggleAlarm: (id) => {
        const target = get().getAlarmById(id);
        if (!target) return;

        const nextEnabled = !target.enabled;
        const updated = { ...target, enabled: nextEnabled };

        set((state) => ({
          alarms: state.alarms.map((a) => (a.id === id ? updated : a)),
        }));

        if (nextEnabled) {
          getAlarmScheduler().schedule(updated).catch(() => {});
        } else {
          getAlarmScheduler().cancel(id).catch(() => {});
        }
      },

      rescheduleAll: async () => {
        const enabledAlarms = get().alarms.filter((a) => a.enabled);
        await getAlarmScheduler().rescheduleAll(enabledAlarms);
      },

      setActiveAlarmId: (id) => {
        set({ activeAlarmId: id });
      },

      getAlarmById: (id) => {
        return get().alarms.find((a) => a.id === id);
      },
    }),
    {
      name: 'nonooze_alarm_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        alarms: state.alarms,
        timeFormat: state.timeFormat,
        alarmVolume: state.alarmVolume,
        defaultSound: state.defaultSound,
        gentleWake: state.gentleWake,
        vibrate: state.vibrate,
      }),
    }
  )
);
