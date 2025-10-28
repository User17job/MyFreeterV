// src/store/timerStore.js - CON NOMBRES PERSONALIZADOS
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTimerStore = create(
  persist(
    (set, get) => ({
      timers: {},

      soundSettings: {
        selectedTone: "tone1",
        volume: 0.7,
        repeat: 3,
      },

      updateSoundSettings: (settings) => {
        set((state) => ({
          soundSettings: {
            ...state.soundSettings,
            ...settings,
          },
        }));
      },

      // ⭐ MODIFICADO: Agregar nombre por defecto
      getTimer: (widgetId) => {
        const state = get();
        if (!state.timers[widgetId]) {
          return {
            mode: "pomodoro",
            customMinutes: 25,
            isRunning: false,
            startTime: null,
            initialTime: 25 * 60,
            pausedTime: 25 * 60,
            name: "", // ⭐ NUEVO: Nombre personalizado
          };
        }
        return state.timers[widgetId];
      },

      getRemainingTime: (widgetId) => {
        const timer = get().getTimer(widgetId);

        if (!timer.isRunning) {
          return timer.pausedTime;
        }

        if (!timer.startTime) {
          return timer.initialTime;
        }

        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        const remaining = timer.initialTime - elapsed;

        return Math.max(0, remaining);
      },

      updateTimer: (widgetId, updates) => {
        set((state) => ({
          timers: {
            ...state.timers,
            [widgetId]: {
              ...state.getTimer(widgetId),
              ...updates,
            },
          },
        }));
      },

      // ⭐ NUEVO: Función para actualizar solo el nombre
      setTimerName: (widgetId, name) => {
        get().updateTimer(widgetId, { name });
      },

      start: (widgetId) => {
        const timer = get().getTimer(widgetId);
        get().updateTimer(widgetId, {
          isRunning: true,
          startTime: Date.now(),
          initialTime: timer.pausedTime,
        });
      },

      pause: (widgetId) => {
        const remaining = get().getRemainingTime(widgetId);
        get().updateTimer(widgetId, {
          isRunning: false,
          pausedTime: remaining,
          startTime: null,
        });
      },

      reset: (widgetId) => {
        const timer = get().getTimer(widgetId);
        const modes = {
          pomodoro: 25 * 60,
          short: 5 * 60,
          long: 15 * 60,
        };

        const time =
          timer.mode === "custom"
            ? timer.customMinutes * 60
            : modes[timer.mode];

        get().updateTimer(widgetId, {
          isRunning: false,
          startTime: null,
          initialTime: time,
          pausedTime: time,
        });
      },

      setMode: (widgetId, newMode) => {
        const timer = get().getTimer(widgetId);
        const modes = {
          pomodoro: 25 * 60,
          short: 5 * 60,
          long: 15 * 60,
        };

        const time =
          newMode === "custom" ? timer.customMinutes * 60 : modes[newMode];

        get().updateTimer(widgetId, {
          mode: newMode,
          isRunning: false,
          startTime: null,
          initialTime: time,
          pausedTime: time,
        });
      },

      setCustomMinutes: (widgetId, minutes) => {
        const timeInSeconds = minutes * 60;
        get().updateTimer(widgetId, {
          customMinutes: minutes,
          mode: "custom",
          isRunning: false,
          startTime: null,
          initialTime: timeInSeconds,
          pausedTime: timeInSeconds,
        });
      },

      complete: (widgetId) => {
        get().updateTimer(widgetId, {
          isRunning: false,
          startTime: null,
          pausedTime: 0,
        });
      },

      deleteTimer: (widgetId) => {
        set((state) => {
          const newTimers = { ...state.timers };
          delete newTimers[widgetId];
          return { timers: newTimers };
        });
      },

      getActiveTimers: () => {
        const state = get();
        return Object.entries(state.timers)
          .filter(([_, timer]) => timer.isRunning)
          .map(([widgetId, timer]) => ({
            widgetId,
            ...timer,
            remainingTime: state.getRemainingTime(widgetId),
          }));
      },

      getActiveTimersCount: () => {
        return get().getActiveTimers().length;
      },
    }),
    {
      name: "freeter-timers",
      partialize: (state) => ({
        soundSettings: state.soundSettings,
        timers: Object.fromEntries(
          Object.entries(state.timers).map(([id, timer]) => [
            id,
            {
              mode: timer.mode,
              customMinutes: timer.customMinutes,
              pausedTime: timer.pausedTime,
              initialTime: timer.initialTime,
              name: timer.name, // ⭐ NUEVO: Persistir nombre
            },
          ])
        ),
      }),
    }
  )
);
