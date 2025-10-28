// src/hooks/useWidgets.js - SIMPLIFICADO
import { useEffect } from "react";
import { useWidgetStore } from "@/store/widgetStore";
import { useAuthStore } from "@/store/authStore";

export function useWidgets() {
  const user = useAuthStore((state) => state.user);
  const {
    widgets,
    loading,
    fetchWidgets,
    addWidget,
    updateWidget,
    deleteWidget,
  } = useWidgetStore();

  useEffect(() => {
    if (user?.id) {
      console.log("🔄 useWidgets: Cargando widgets...");
      fetchWidgets(user.id);
    }
  }, [user?.id]); // Solo depender de user.id

  return {
    widgets,
    loading,
    addWidget: (widget) => addWidget(user?.id, widget),
    updateWidget,
    deleteWidget,
  };
}
