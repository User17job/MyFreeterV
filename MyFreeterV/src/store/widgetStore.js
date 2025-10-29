// src/store/widgetStore.js
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export const useWidgetStore = create((set, get) => ({
  widgets: [],
  loading: false,

  fetchWidgets: async (userId) => {
    if (!userId) {
      console.warn("⚠️ fetchWidgets: No userId provided");
      return;
    }

    console.log("🔄 Cargando widgets para usuario:", userId);
    set({ loading: true });

    try {
      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      console.log(`✅ Widgets cargados: ${data?.length || 0}`, data);
      set({ widgets: data || [], loading: false });
      return data;
    } catch (error) {
      console.error("❌ Error fetching widgets:", error);
      set({ widgets: [], loading: false });
      return [];
    }
  },

  addWidget: async (userId, widget) => {
    if (!userId) {
      console.error("❌ addWidget: No userId provided");
      return null;
    }

    console.log("➕ Agregando widget:", widget.type);

    const newWidget = {
      user_id: userId,
      type: widget.type,
      title: widget.title,
      position: widget.position || { x: 0, y: 0, w: 4, h: 3 },
      data: widget.data || {},
    };

    try {
      const { data, error } = await supabase
        .from("widgets")
        .insert([newWidget])
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Widget agregado:", data.id);
      set({ widgets: [...get().widgets, data] });
      return data;
    } catch (error) {
      console.error("❌ Error adding widget:", error);
      return null;
    }
  },

  updateWidget: async (widgetId, updates) => {
    console.log("🔄 Actualizando widget:", widgetId);

    try {
      const { data, error } = await supabase
        .from("widgets")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", widgetId)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Widget actualizado:", widgetId);
      set({
        widgets: get().widgets.map((w) => (w.id === widgetId ? data : w)),
      });
      return data;
    } catch (error) {
      console.error("❌ Error updating widget:", error);
      return null;
    }
  },

  deleteWidget: async (widgetId) => {
    console.log("🗑️ Eliminando widget:", widgetId);

    try {
      const { error } = await supabase
        .from("widgets")
        .delete()
        .eq("id", widgetId);

      if (error) throw error;

      console.log("✅ Widget eliminado:", widgetId);
      set({ widgets: get().widgets.filter((w) => w.id !== widgetId) });
      return true;
    } catch (error) {
      console.error("❌ Error deleting widget:", error);
      return false;
    }
  },

  updateWidgetPositions: async (layouts) => {
    console.log("📐 Actualizando posiciones:", layouts.length);

    const updates = layouts.map((layout) => ({
      id: layout.i,
      position: { x: layout.x, y: layout.y, w: layout.w, h: layout.h },
    }));

    const results = await Promise.all(
      updates.map((update) =>
        get().updateWidget(update.id, { position: update.position })
      )
    );

    return results;
  },
}));
