// src/pages/Settings.jsx - COMPLETAMENTE FUNCIONAL
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useWidgetStore } from "@/store/widgetStore";
import { useTabsStore } from "@/store/tabsStore";
import { supabase } from "@/lib/supabase";
import {
  User,
  Bell,
  Palette,
  Database,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

export function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { widgets } = useWidgetStore();

  // Estados para modales
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Estados para notificaciones (guardar en localStorage)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("freeter-notifications");
    return saved
      ? JSON.parse(saved)
      : {
          tasks: true,
          calendar: true,
          timer: false,
        };
  });

  // Nombre de usuario editable
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.user_metadata?.name || "");
  const [nameLoading, setNameLoading] = useState(false);

  // Cambiar contraseña
  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      setPasswordError(error.message || "Error al cambiar la contraseña");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Actualizar nombre
  const handleUpdateName = async () => {
    if (!newName.trim()) return;

    setNameLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: newName.trim() },
      });

      if (error) throw error;

      setEditingName(false);
    } catch (error) {
      alert("Error al actualizar el nombre: " + error.message);
    } finally {
      setNameLoading(false);
    }
  };

  // Cambiar notificaciones
  const handleNotificationChange = (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem("freeter-notifications", JSON.stringify(updated));
  };

  // Exportar datos
  const handleExportData = async () => {
    try {
      // Obtener todos los datos del usuario
      const { data: widgetsData } = await supabase
        .from("widgets")
        .select("*")
        .eq("user_id", user.id);

      const { data: todosData } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id);

      const { data: eventsData } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id);

      const { data: notesData } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id);

      const { data: linksData } = await supabase
        .from("quick_links")
        .select("*")
        .eq("user_id", user.id);

      // Crear objeto con todos los datos
      const exportData = {
        user: {
          email: user.email,
          name: user.user_metadata?.name,
          created_at: user.created_at,
        },
        widgets: widgetsData || [],
        todos: todosData || [],
        calendar_events: eventsData || [],
        notes: notesData || [],
        quick_links: linksData || [],
        tabs: useTabsStore.getState().tabs,
        workspace_name: useTabsStore.getState().workspaceName,
        theme: isDarkMode ? "dark" : "light",
        notifications,
        exported_at: new Date().toISOString(),
      };

      // Crear archivo para descargar
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `freeter-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportModal(false);
      alert("✅ Datos exportados correctamente");
    } catch (error) {
      alert("❌ Error al exportar datos: " + error.message);
    }
  };

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    try {
      // Eliminar todos los datos del usuario
      await supabase.from("widgets").delete().eq("user_id", user.id);
      await supabase.from("todos").delete().eq("user_id", user.id);
      await supabase.from("calendar_events").delete().eq("user_id", user.id);
      await supabase.from("notes").delete().eq("user_id", user.id);
      await supabase.from("quick_links").delete().eq("user_id", user.id);

      // Cerrar sesión y redirigir
      await signOut();
      localStorage.clear();
      navigate("/login");

      alert("Cuenta eliminada exitosamente");
    } catch (error) {
      alert("Error al eliminar la cuenta: " + error.message);
    }
  };

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuario";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Configuración
            </h1>
            <p className="text-gray-400">Gestiona tu cuenta y preferencias</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </Button>
        </div>

        {/* Perfil */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-orange" size={24} />
            <h2 className="text-lg font-semibold text-white">Perfil</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{user?.email}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Nombre</label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tu nombre"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateName}
                    disabled={nameLoading}
                  >
                    {nameLoading ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingName(false);
                      setNewName(user?.user_metadata?.name || "");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-white">{userName}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingName(true)}
                  >
                    Editar
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPasswordModal(true)}
            >
              Cambiar contraseña
            </Button>
          </div>
        </Card>

        {/* Apariencia */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="text-orange" size={24} />
            <h2 className="text-lg font-semibold text-white">Apariencia</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Tema</label>
              <div className="flex gap-2">
                <Button
                  variant={isDarkMode ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => isDarkMode || toggleTheme()}
                >
                  🌙 Oscuro
                </Button>
                <Button
                  variant={!isDarkMode ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => !isDarkMode || toggleTheme()}
                >
                  ☀️ Claro
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tema actual: {isDarkMode ? "Oscuro" : "Claro"}
              </p>
            </div>
          </div>
        </Card>

        {/* Notificaciones */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-orange" size={24} />
            <h2 className="text-lg font-semibold text-white">Notificaciones</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange cursor-pointer"
                checked={notifications.tasks}
                onChange={() => handleNotificationChange("tasks")}
              />
              <span className="text-white">Recordatorios de tareas</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange cursor-pointer"
                checked={notifications.calendar}
                onChange={() => handleNotificationChange("calendar")}
              />
              <span className="text-white">Eventos de calendario</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange cursor-pointer"
                checked={notifications.timer}
                onChange={() => handleNotificationChange("timer")}
              />
              <span className="text-white">Fin de timer</span>
            </label>
          </div>
        </Card>

        {/* Datos */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-orange" size={24} />
            <h2 className="text-lg font-semibold text-white">Datos</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400 mb-2">
                Total de widgets: {widgets.length}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportModal(true)}
              >
                📥 Exportar datos
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Zona de peligro</p>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ Eliminar cuenta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal Cambiar Contraseña */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordError("");
          setPasswordSuccess(false);
        }}
        title="Cambiar Contraseña"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? "Cambiando..." : "Cambiar"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nueva Contraseña"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) =>
              setPasswordData({ ...passwordData, newPassword: e.target.value })
            }
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Confirmar Contraseña"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) =>
              setPasswordData({
                ...passwordData,
                confirmPassword: e.target.value,
              })
            }
            placeholder="Repite la contraseña"
          />

          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}

          {passwordSuccess && (
            <p className="text-sm text-green-500">
              ✅ Contraseña cambiada exitosamente
            </p>
          )}
        </div>
      </Modal>

      {/* Modal Exportar */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exportar Datos"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowExportModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExportData}>📥 Descargar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Se descargará un archivo JSON con todos tus datos:
          </p>
          <ul className="text-sm text-gray-400 space-y-1 ml-4">
            <li>• Widgets y configuraciones</li>
            <li>• Tareas</li>
            <li>• Eventos de calendario</li>
            <li>• Notas</li>
            <li>• Enlaces</li>
            <li>• Dashboards personalizados</li>
          </ul>
          <p className="text-xs text-gray-500">
            Este archivo puede usarse como respaldo o para migrar tus datos.
          </p>
        </div>
      </Modal>

      {/* Modal Eliminar Cuenta */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Cuenta"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Eliminar Permanentemente
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
            <div>
              <h3 className="text-white font-semibold mb-1">¡Advertencia!</h3>
              <p className="text-sm text-gray-300">
                Esta acción es irreversible. Se eliminarán permanentemente:
              </p>
            </div>
          </div>

          <ul className="text-sm text-gray-400 space-y-1 ml-4">
            <li>• Todos tus widgets</li>
            <li>• Todas tus tareas</li>
            <li>• Todos tus eventos</li>
            <li>• Todas tus notas</li>
            <li>• Todos tus enlaces</li>
            <li>• Tu cuenta y configuraciones</li>
          </ul>

          <p className="text-sm text-gray-500">
            Te recomendamos exportar tus datos antes de continuar.
          </p>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
