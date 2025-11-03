// src/hooks/useDefaultWidgets.js - CORREGIDO RACE CONDITIONS
import { useEffect, useRef } from "react";
import { useWidgetStore } from "@/store/widgetStore";
import { useAuthStore } from "@/store/authStore";
import { useTabsStore } from "@/store/tabsStore";

export function useDefaultWidgets() {
  const user = useAuthStore((state) => state.user);
  const {
    fetchWidgets,
    addWidget,
    isInitialized: widgetsInitialized,
  } = useWidgetStore();
  const isTabsInitialized = useTabsStore((state) => state.isInitialized);
  const initialized = useRef(false);

  useEffect(() => {
    // Esperar a que todo esté listo
    if (!user?.id || initialized.current || !isTabsInitialized) {
      if (!isTabsInitialized) {
        console.log("⏳ Esperando inicialización de tabs...");
      }
      return;
    }

    const initializeWidgets = async () => {
      console.log("🎯 Inicializando widgets para:", user.email);
      initialized.current = true;

      try {
        // Primero intentar cargar widgets existentes
        const existingWidgets = await fetchWidgets(user.id);

        if (existingWidgets && existingWidgets.length > 0) {
          console.log(`📦 ${existingWidgets.length} widgets encontrados`);
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

        // Crear widgets secuencialmente con retraso
        for (const widget of defaultWidgets) {
          const result = await addWidget(user.id, widget);
          if (!result) {
            console.warn("⚠️ Error creando widget:", widget.type);
          }
          // Pequeño delay para evitar rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.log("✅ Widgets por defecto creados");
      } catch (error) {
        console.error("❌ Error en initializeWidgets:", error);
      }
    };

    // Ejecutar con un pequeño delay para asegurar que tabs esté listo
    const timeoutId = setTimeout(() => {
      initializeWidgets();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [user?.id, isTabsInitialized, fetchWidgets, addWidget]);
}
