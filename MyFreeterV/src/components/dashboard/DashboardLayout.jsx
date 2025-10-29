// src/components/dashboard/DashboardLayout.jsx
// ============================================

import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { useState, useEffect } from "react";

export function DashboardLayout({
  children,
  onAddWidget,
  activeTab,
  onTabChange,
  sidebarCollapsed,
  onSidebarToggle,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      // Auto-colapsar en mobile
      if (width < 1024) {
        onSidebarToggle(true);
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [onSidebarToggle]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      onSidebarToggle(!sidebarCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* TopBar Fixed */}
      <TopBar onSidebarToggle={handleToggleSidebar} isMobile={isMobile} />

      {/* Sidebar Toggle Button (Desktop only) */}
      <SidebarToggleButton
        isCollapsed={sidebarCollapsed}
        onClick={handleToggleSidebar}
        isMobile={isMobile}
      />

      {/* Sidebar */}
      <Sidebar
        onAddWidget={onAddWidget}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isMobile={isMobile}
        isOpen={sidebarOpen}
      />

      {/* Main Content - Con padding top para el TopBar */}
      <main className="pt-16">{children}</main>
    </div>
  );
}
