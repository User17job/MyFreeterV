// src/store/tabsStore.js - NUEVO ARCHIVO
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export const useTabsStore = create(
  persist(
    (set, get) => ({
      tabs: [
        { id: "mi-vida", label: "Mi Vida", emoji: "📋", isDefault: true },
        { id: "profesion", label: "Profesión", emoji: "💼", isDefault: true },
        { id: "comunidad", label: "Comunidad", emoji: "🏘️", isDefault: true },
        { id: "ministerio", label: "Ministerio", emoji: "⛪", isDefault: true },
        { id: "intimidad", label: "Intimidad", emoji: "🙏", isDefault: true },
      ],
      workspaceName: "Mi Espacio",

      // Agregar tab
      addTab: () => {
        const tabs = get().tabs;
        if (tabs.length >= 10) {
          alert("Máximo 10 dashboards permitidos");
          return false;
        }

        const newTab = {
          id: `tab-${Date.now()}`,
          label: `Dashboard ${tabs.length + 1}`,
          emoji: "📁",
          isDefault: false,
        };

        set({ tabs: [...tabs, newTab] });
        return true;
      },

      // Editar tab
      updateTab: (tabId, updates) => {
        const tabs = get().tabs.map((tab) =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        );
        set({ tabs });
      },

      // Eliminar tab (solo custom tabs)
      deleteTab: async (tabId) => {
        const tab = get().tabs.find((t) => t.id === tabId);
        if (tab?.isDefault) {
          alert("No puedes eliminar los dashboards predeterminados");
          return false;
        }

        // Eliminar widgets asociados
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("widgets")
            .delete()
            .eq("user_id", user.id)
            .eq("data->tab", tabId);
        }

        set({ tabs: get().tabs.filter((t) => t.id !== tabId) });
        return true;
      },

      // Cambiar nombre del workspace
      setWorkspaceName: (name) => {
        set({ workspaceName: name });
      },
    }),
    {
      name: "freeter-tabs-storage",
    }
  )
);
