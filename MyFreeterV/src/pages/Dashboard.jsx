// src/pages/Dashboard.jsx - CON HOOKS DE WIDGETS DEFAULT
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { useWidgetStore } from "@/store/widgetStore";
import { useAuthStore } from "@/store/authStore";
import { useDefaultWidgets } from "@/hooks/useDefaultWidgets";

const WIDGET_TITLES = {
  todo: "Lista de Tareas",
  calendar: "Calendario",
  notes: "Notas Rápidas",
  timer: "Timer Pomodoro",
  links: "Enlaces Rápidos",
};

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("mi-vida");
  const user = useAuthStore((state) => state.user);
  const addWidget = useWidgetStore((state) => state.addWidget);

  // Inicializar widgets por defecto
  useDefaultWidgets();

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
    >
      <WidgetGrid activeTab={activeTab} />
    </DashboardLayout>
  );
}
