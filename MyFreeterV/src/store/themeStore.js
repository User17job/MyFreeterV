// src/store/themeStore.js - NUEVO ARCHIVO
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDarkMode: true,

      toggleTheme: () => {
        const newMode = !get().isDarkMode;
        set({ isDarkMode: newMode });

        // Aplicar clase al document
        if (newMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },

      initTheme: () => {
        const isDark = get().isDarkMode;
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }),
    {
      name: "freeter-theme-storage",
    }
  )
);
