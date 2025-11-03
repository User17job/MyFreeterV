// src/store/tabsStore.js - MEJORADO
import { create } from "zustand";
import { supabase, handleSupabaseError } from "@/lib/supabase";

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
  error: null,

  initializeTabs: async (userId) => {
    // Evitar reinicialización
    if (!userId || get().isInitialized) {
      console.log("⚠️ Tabs ya inicializados o sin userId");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      console.log("📑 Inicializando tabs para:", userId);

      // Cargar workspace name (con manejo de error 406)
      try {
        const { data: workspaceData, error: wsError } = await supabase
          .from("user_settings")
          .select("workspace_name")
          .eq("user_id", userId)
          .maybeSingle(); // Usar maybeSingle() en lugar de single()

        if (wsError && wsError.code !== "PGRST116") {
          // PGRST116 = no rows found (es normal)
          console.warn("⚠️ Error cargando workspace:", wsError);
        }

        if (workspaceData?.workspace_name) {
          set({ workspaceName: workspaceData.workspace_name });
        }
      } catch (wsError) {
        console.warn("⚠️ Workspace no disponible, usando default");
      }

      // Cargar dashboards personalizados
      const { data: customDashboards, error: dbError } = await supabase
        .from("user_dashboards")
        .select("*")
        .eq("user_id", userId)
        .order("position", { ascending: true });

      if (dbError) {
        console.error("❌ Error cargando dashboards:", dbError);
        // Continuar con tabs por defecto
        set({
          tabs: DEFAULT_TABS,
          isInitialized: true,
          isLoading: false,
          error: handleSupabaseError(dbError, "initializeTabs"),
        });
        return;
      }

      // Combinar tabs
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

      console.log(`✅ Tabs inicializados: ${allTabs.length}`);
      set({
        tabs: allTabs,
        isInitialized: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("❌ Error fatal en initializeTabs:", error);
      const errorMsg = handleSupabaseError(error, "initializeTabs");
      set({
        tabs: DEFAULT_TABS,
        isInitialized: true,
        isLoading: false,
        error: errorMsg,
      });
    }
  },

  addTab: async () => {
    const { tabs } = get();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

      set({ tabs: [...tabs, newTab] });
      return true;
    } catch (error) {
      console.error("❌ Error adding tab:", error);
      alert(handleSupabaseError(error, "addTab"));
      return false;
    }
  },

  updateTab: async (tabId, updates) => {
    const { tabs } = get();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const tab = tabs.find((t) => t.id === tabId);
    if (!tab || tab.isDefault) {
      const updatedTabs = tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates } : t
      );
      set({ tabs: updatedTabs });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_dashboards")
        .update({
          label: updates.label,
          emoji: updates.emoji,
        })
        .eq("user_id", user.id)
        .eq("dashboard_id", tabId);

      if (error) throw error;

      const updatedTabs = tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates } : t
      );
      set({ tabs: updatedTabs });
    } catch (error) {
      console.error("❌ Error updating tab:", error);
      alert(handleSupabaseError(error, "updateTab"));
    }
  },

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
      await supabase
        .from("widgets")
        .delete()
        .eq("user_id", user.id)
        .eq("data->tab", tabId);

      const { error } = await supabase
        .from("user_dashboards")
        .delete()
        .eq("user_id", user.id)
        .eq("dashboard_id", tabId);

      if (error) throw error;

      set({ tabs: tabs.filter((t) => t.id !== tabId) });
      return true;
    } catch (error) {
      console.error("❌ Error deleting tab:", error);
      alert(handleSupabaseError(error, "deleteTab"));
      return false;
    }
  },

  setWorkspaceName: async (name) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
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
      set({ workspaceName: name });
    } catch (error) {
      console.error("❌ Error updating workspace name:", error);
      set({ workspaceName: name }); // Actualizar localmente de todos modos
    }
  },

  reset: () => {
    set({
      tabs: DEFAULT_TABS,
      workspaceName: "Mi Espacio",
      isInitialized: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
