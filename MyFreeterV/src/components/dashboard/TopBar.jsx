// ============================================
// TOPBAR.JSX - CON FIXED POSITION
// src/components/dashboard/TopBar.jsx
// ============================================

import { LogOut, Settings, Moon, Sun, User, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { Button } from "@/components/ui/Button";
import { BellNotifications } from "./BellNotifications";

export function TopBar({ onSidebarToggle, isMobile }) {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-dark-secondary border-b border-gray-800 px-4 md:px-6 flex items-center justify-between z-40">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-lg hover:bg-dark-tertiary text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-10 object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <h1 className="text-lg md:text-xl font-bold text-white">
            MyFreeterV
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
          <User size={18} />
          <span className="font-medium text-white">{userName}</span>
        </div>

        <BellNotifications />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-dark-tertiary text-gray-400 hover:text-white transition-colors"
          title={isDarkMode ? "Modo claro" : "Modo oscuro"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={handleSettings}
          className="hidden md:flex p-2 rounded-lg hover:bg-dark-tertiary text-gray-400 hover:text-white transition-colors"
          title="Configuración"
        >
          <Settings size={20} />
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2"
        >
          <LogOut size={18} />
          Salir
        </Button>
      </div>
    </div>
  );
}
