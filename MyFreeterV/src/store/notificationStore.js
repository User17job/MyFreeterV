// ============================================
// 1. STORE DE NOTIFICACIONES
// src/store/notificationStore.js
// ============================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      settings: {
        calendar: true,
        timer: true,
        tasks: true,
      },
      unreadCount: 0,

      addNotification: (notification) => {
        const newNotification = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification,
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Máximo 50
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      deleteNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          const wasUnread = notification && !notification.read;

          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      updateSettings: (key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        }));
      },

      getUnreadCount: () => get().unreadCount,

      isNotificationEnabled: (type) => get().settings[type],
    }),
    {
      name: "freeter-notifications",
    }
  )
);
