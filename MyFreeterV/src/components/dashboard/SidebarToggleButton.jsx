// ============================================
// SIDEBAR TOGGLE BUTTON
// src/components/dashboard/SidebarToggleButton.jsx
// ============================================

import { ChevronLeft, ChevronRight } from "lucide-react";

export function SidebarToggleButton({ isCollapsed, onClick, isMobile }) {
  if (isMobile) return null;

  return (
    <button
      onClick={onClick}
      className="fixed left-0 top-20 z-40 bg-dark-secondary border border-gray-800 rounded-r-lg p-2 hover:bg-dark-tertiary text-gray-400 hover:text-white transition-all shadow-lg"
      style={{
        transform: isCollapsed ? "translateX(0)" : "translateX(256px)",
      }}
      title={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
    >
      {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
    </button>
  );
}
