// src/store/tabsStore.js - CON SINCRONIZACIÓN SUPABASE
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

const DEFAULT_TABS = [
  {
    id: "mi-vida",
    label: "Mi Vida",
    emoji: "📋",
    isDefault: true,
    position: 0,
  },
  {
    id: "profesion",
    label: "Profesión",
    emoji: "💼",
    isDefault: true,
    position: 1,
  },
  {
    id: "comunidad",
    label: "Comunidad",
    emoji: "🏘️",
    isDefault: true,
    position: 2,
  },
  {
    id: "ministerio",
    label: "Ministerio",
    emoji: "⛪",
    isDefault: true,
    position: 3,
  },
  {
    id: "intimidad",
    label: "Intimidad",
    emoji: "🙏",
    isDefault: true,
    position: 4,
  },
];

export const useTabsStore = create((set, get) => ({
  tabs: DEFAULT_TABS,
  workspaceName: "Mi Espacio",
  isLoading: false,
  isInitialized: false,

  // Inicializar - cargar tabs desde Supabase
  initializeTabs: async (userId) => {
    if (!userId || get().isInitialized) return;

    set({ isLoading: true });

    try {
      // Cargar workspace name
      const { data: workspaceData } = await supabase
        .from("user_settings")
        .select("workspace_name")
        .eq("user_id", userId)
        .single();

      if (workspaceData?.workspace_name) {
        set({ workspaceName: workspaceData.workspace_name });
      }

      // Cargar dashboards personalizados
      const { data: customDashboards, error } = await supabase
        .from("user_dashboards")
        .select("*")
        .eq("user_id", userId)
        .order("position", { ascending: true });

      if (error) throw error;

      // Combinar tabs por defecto con personalizados
      const allTabs = [
        ...DEFAULT_TABS,
        ...(customDashboards || []).map((db) => ({
          id: db.dashboard_id,
          label: db.label,
          emoji: db.emoji,
          isDefault: db.is_default,
          position: db.position,
        })),
      ].sort((a, b) => a.position - b.position);

      set({ tabs: allTabs, isInitialized: true });
    } catch (error) {
      console.error("Error loading tabs:", error);
      set({ tabs: DEFAULT_TABS });
    } finally {
      set({ isLoading: false });
    }
  },

  // Agregar tab
  addTab: async () => {
    const { tabs } = get();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes estar autenticado");
      return false;
    }

    if (tabs.length >= 10) {
      alert("Máximo 10 dashboards permitidos");
      return false;
    }

    const newTab = {
      id: `tab-${Date.now()}`,
      label: `Dashboard ${tabs.length + 1}`,
      emoji: "📁",
      isDefault: false,
      position: tabs.length,
    };

    try {
      // Guardar en Supabase
      const { error } = await supabase.from("user_dashboards").insert([
        {
          user_id: user.id,
          dashboard_id: newTab.id,
          label: newTab.label,
          emoji: newTab.emoji,
          is_default: false,
          position: newTab.position,
        },
      ]);

      if (error) throw error;

      // Actualizar estado local
      set({ tabs: [...tabs, newTab] });
      return true;
    } catch (error) {
      console.error("Error adding tab:", error);
      alert("Error al crear dashboard");
      return false;
    }
  },

  // Editar tab
  updateTab: async (tabId, updates) => {
    const { tabs } = get();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || tab.isDefault) {
      // Los tabs por defecto solo se actualizan localmente
      const updatedTabs = tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates } : t
      );
      set({ tabs: updatedTabs });
      return;
    }

    try {
      // Actualizar en Supabase
      const { error } = await supabase
        .from("user_dashboards")
        .update({
          label: updates.label,
          emoji: updates.emoji,
        })
        .eq("user_id", user.id)
        .eq("dashboard_id", tabId);

      if (error) throw error;

      // Actualizar estado local
      const updatedTabs = tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates } : t
      );
      set({ tabs: updatedTabs });
    } catch (error) {
      console.error("Error updating tab:", error);
      alert("Error al actualizar dashboard");
    }
  },

  // Eliminar tab
  deleteTab: async (tabId) => {
    const { tabs } = get();
    const tab = tabs.find((t) => t.id === tabId);

    if (tab?.isDefault) {
      alert("No puedes eliminar los dashboards predeterminados");
      return false;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    try {
      // Eliminar widgets asociados
      await supabase
        .from("widgets")
        .delete()
        .eq("user_id", user.id)
        .eq("data->tab", tabId);

      // Eliminar dashboard
      const { error } = await supabase
        .from("user_dashboards")
        .delete()
        .eq("user_id", user.id)
        .eq("dashboard_id", tabId);

      if (error) throw error;

      // Actualizar estado local
      set({ tabs: tabs.filter((t) => t.id !== tabId) });
      return true;
    } catch (error) {
      console.error("Error deleting tab:", error);
      alert("Error al eliminar dashboard");
      return false;
    }
  },

  // Cambiar nombre del workspace
  setWorkspaceName: async (name) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      // Actualizar en Supabase (en user_settings)
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          workspace_name: name,
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) throw error;

      // Actualizar estado local
      set({ workspaceName: name });
    } catch (error) {
      console.error("Error updating workspace name:", error);
      // Actualizar solo localmente si falla
      set({ workspaceName: name });
    }
  },

  // Reset (para logout)
  reset: () => {
    set({
      tabs: DEFAULT_TABS,
      workspaceName: "Mi Espacio",
      isInitialized: false,
    });
  },
}));
