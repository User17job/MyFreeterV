// src/components/dashboard/DashboardLayout.jsx - ACTUALIZADO
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({
  children,
  onAddWidget,
  activeTab,
  onTabChange,
}) {
  return (
    <div className="h-screen bg-dark-primary flex flex-col">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onAddWidget={onAddWidget}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
