// ============================================
// DASHBOARD.JSX - ARREGLADO
// src/pages/Dashboard.jsx
// ============================================

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
  const initializeTabs = useTabsStore((state) => state.initializeTabs);
  const user = useAuthStore((state) => state.user);
  const addWidget = useWidgetStore((state) => state.addWidget);

  // Inicializar widgets por defecto
  useDefaultWidgets();

  // Detectar cambios de viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
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

  useEffect(() => {
    if (user) {
      initializeTabs(user.id);
    }
  }, [user, initializeTabs]);

  const handleAddWidget = async (type) => {
    if (!user) return;

    await addWidget(user.id, {
      type,
      title: WIDGET_TITLES[type],
      position: { x: 0, y: 0, w: 4, h: 3 },
      data: { tab: activeTab },
    });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
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
  );
}
