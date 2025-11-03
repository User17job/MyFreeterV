// src/pages/Dashboard.jsx - MEJORADO CON ERROR HANDLING
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { useWidgetStore } from "@/store/widgetStore";
import { useAuthStore } from "@/store/authStore";
import { useDefaultWidgets } from "@/hooks/useDefaultWidgets";
import { useTabsStore } from "@/store/tabsStore";

const WIDGET_TITLES = {
  todo: "Lista de Tareas",
  calendar: "Calendario",
  notes: "Notas Rápidas",
  timer: "Timer Pomodoro",
  links: "Enlaces Rápidos",
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("mi-vida");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? saved === "true" : window.innerWidth < 1024;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const user = useAuthStore((state) => state.user);
  const addWidget = useWidgetStore((state) => state.addWidget);
  const widgetError = useWidgetStore((state) => state.error);
  const widgetLoading = useWidgetStore((state) => state.loading);

  const {
    initializeTabs,
    isLoading: tabsLoading,
    error: tabsError,
  } = useTabsStore();

  // Inicializar tabs cuando el usuario esté disponible
  useEffect(() => {
    if (user?.id) {
      console.log("🚀 Dashboard: Inicializando tabs para", user.email);
      initializeTabs(user.id);
    }
  }, [user?.id, initializeTabs]);

  // Hook de widgets por defecto (se ejecuta después de tabs)
  useDefaultWidgets();

  // Detectar cambios de viewport
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setIsMobile(newWidth < 768);

      // Auto-colapsar en móvil
      if (newWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Guardar estado del sidebar (solo desktop)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebar-collapsed", sidebarCollapsed);
    }
  }, [sidebarCollapsed, isMobile]);

  const handleAddWidget = async (type) => {
    if (!user) {
      alert("Debes estar autenticado para agregar widgets");
      return;
    }

    const result = await addWidget(user.id, {
      type,
      title: WIDGET_TITLES[type],
      position: { x: 0, y: 0, w: 4, h: 3 },
      data: { tab: activeTab },
    });

    if (!result) {
      alert("Error al agregar widget. Intenta nuevamente.");
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Mostrar loading mientras se cargan tabs y widgets
  if (tabsLoading || widgetLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-brown border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {tabsLoading
              ? "Cargando espacios de trabajo..."
              : "Cargando widgets..."}
          </p>
        </div>
      </div>
    );
  }

  // Mostrar errores si los hay (pero continuar mostrando la UI)
  const hasError = widgetError || tabsError;

  return (
    <>
      {/* Error Banner */}
      {hasError && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-red-500/90 text-white px-4 py-3 text-center">
          <p className="text-sm">⚠️ {widgetError || tabsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-1 bg-white text-red-500 rounded text-sm hover:bg-gray-100"
          >
            Recargar página
          </button>
        </div>
      )}

      <DashboardLayout
        onAddWidget={handleAddWidget}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={setSidebarCollapsed}
      >
        <WidgetGrid
          activeTab={activeTab}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
        />
      </DashboardLayout>
    </>
  );
}
