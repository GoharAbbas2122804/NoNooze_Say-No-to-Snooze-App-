import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../domain/types';
import { validateAlarm } from '../domain/validation';

export interface AlarmStoreState {
  alarms: Alarm[];
  activeAlarmId: string | null;

  // Actions
  addAlarm: (
    alarmData: Omit<Alarm, 'id'>
  ) => { success: boolean; id?: string; errors?: string[] };
  updateAlarm: (
    id: string,
    updates: Partial<Omit<Alarm, 'id'>>
  ) => { success: boolean; errors?: string[] };
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setActiveAlarmId: (id: string | null) => void;
  getAlarmById: (id: string) => Alarm | undefined;
}

export const useAlarmStore = create<AlarmStoreState>()(
  persist(
    (set, get) => ({
      alarms: [],
      activeAlarmId: null,

      addAlarm: (alarmData) => {
        const tempAlarm: Alarm = {
          ...alarmData,
          id: `alarm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };

        const validation = validateAlarm(tempAlarm);
        if (!validation.valid) {
          return { success: false, errors: validation.errors };
        }

        set((state) => ({
          alarms: [...state.alarms, tempAlarm],
        }));

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

        return { success: true };
      },

      deleteAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.filter((a) => a.id !== id),
          activeAlarmId: state.activeAlarmId === id ? null : state.activeAlarmId,
        }));
      },

      toggleAlarm: (id) => {
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        }));
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
      partialize: (state) => ({ alarms: state.alarms }),
    }
  )
);
