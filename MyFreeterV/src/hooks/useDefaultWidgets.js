// src/hooks/useDefaultWidgets.js - MEJORADO
import { useEffect, useRef } from "react";
import { useWidgetStore } from "@/store/widgetStore";
import { useAuthStore } from "@/store/authStore";

export function useDefaultWidgets() {
  const user = useAuthStore((state) => state.user);
  const { fetchWidgets, addWidget } = useWidgetStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!user?.id || initialized.current) return;

    const initializeWidgets = async () => {
      console.log("🎯 Inicializando widgets para:", user.email);

      // Primero intentar cargar widgets existentes
      const existingWidgets = await fetchWidgets(user.id);

      if (existingWidgets && existingWidgets.length > 0) {
        console.log(`📦 ${existingWidgets.length} widgets encontrados`);
        initialized.current = true;
        return;
      }

      console.log("🆕 No hay widgets, creando defaults...");

      // Crear widgets por defecto
      const defaultWidgets = [
        {
          type: "calendar",
          title: "📅 Calendario General",
          position: { x: 0, y: 0, w: 8, h: 4 },
          data: { tab: "mi-vida", isGlobal: true },
        },
        {
          type: "todo",
          title: "✅ Tareas Pendientes",
          position: { x: 8, y: 0, w: 4, h: 4 },
          data: { tab: "mi-vida" },
        },
        {
          type: "timer",
          title: "⏱️ Pomodoro",
          position: { x: 0, y: 4, w: 4, h: 3 },
          data: { tab: "mi-vida" },
        },
        {
          type: "notes",
          title: "📝 Notas Rápidas",
          position: { x: 4, y: 4, w: 4, h: 3 },
          data: { tab: "mi-vida" },
        },
        {
          type: "links",
          title: "🔗 Enlaces Útiles",
          position: { x: 8, y: 4, w: 4, h: 3 },
          data: { tab: "mi-vida" },
        },
      ];

      // Crear widgets secuencialmente
      for (const widget of defaultWidgets) {
        await addWidget(user.id, widget);
      }

      console.log("✅ Widgets por defecto creados");
      initialized.current = true;
    };

    initializeWidgets();
  }, [user?.id]); // Solo depender del user.id
}
