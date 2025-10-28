// src/components/dashboard/Sidebar.jsx - ACTUALIZADO CON TABS EDITABLES
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  StickyNote,
  Link,
  Timer,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { useState } from "react";
import { useTabsStore } from "@/store/tabsStore";
import { Button } from "@/components/ui/Button";

const WIDGET_TYPES = [
  { id: "todo", label: "Tareas", icon: CheckSquare },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "notes", label: "Notas", icon: StickyNote },
  { id: "links", label: "Enlaces", icon: Link },
  { id: "timer", label: "Timer", icon: Timer },
];

export function Sidebar({ onAddWidget, activeTab, onTabChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(false);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const {
    tabs,
    workspaceName,
    addTab,
    updateTab,
    deleteTab,
    setWorkspaceName,
  } = useTabsStore();

  const handleAddTab = () => {
    addTab();
  };

  const startEditingTab = (tab) => {
    setEditingTabId(tab.id);
    setEditValue(tab.label);
  };

  const saveTabEdit = (tabId) => {
    if (editValue.trim()) {
      updateTab(tabId, { label: editValue.trim() });
    }
    setEditingTabId(null);
  };

  const handleDeleteTab = async (tabId) => {
    if (confirm("¿Eliminar este dashboard? Se perderán todos sus widgets.")) {
      const success = await deleteTab(tabId);
      if (success && activeTab === tabId) {
        onTabChange("mi-vida");
      }
    }
  };

  const saveWorkspaceName = () => {
    if (editValue.trim()) {
      setWorkspaceName(editValue.trim());
    }
    setEditingWorkspace(false);
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-dark-secondary border-r border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-dark-tertiary rounded-lg text-gray-400 hover:text-white transition-colors mb-4"
          title="Expandir sidebar"
        >
          <ChevronRight size={20} />
        </button>

        <div className="space-y-2">
          {WIDGET_TYPES.map((widget) => {
            const Icon = widget.icon;
            return (
              <button
                key={widget.id}
                onClick={() => onAddWidget(widget.id)}
                className="p-2 hover:bg-dark-tertiary rounded-lg text-gray-400 hover:text-orange transition-colors"
                title={widget.label}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800 space-y-2 flex-1 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-orange text-white"
                  : "hover:bg-dark-tertiary text-gray-400 hover:text-white"
              }`}
              title={tab.label}
            >
              {tab.emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-dark-secondary border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {editingWorkspace ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveWorkspaceName();
                if (e.key === "Escape") setEditingWorkspace(false);
              }}
              className="flex-1 text-lg font-semibold bg-dark-primary text-white px-2 py-1 rounded border border-orange focus:outline-none"
              autoFocus
            />
            <button onClick={saveWorkspaceName} className="text-green-500">
              <Check size={18} />
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <LayoutDashboard size={20} />
              {workspaceName}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditValue(workspaceName);
                  setEditingWorkspace(true);
                }}
                className="p-1 hover:bg-dark-tertiary rounded text-gray-400 hover:text-white transition-colors"
                title="Editar nombre"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-dark-tertiary rounded text-gray-400 hover:text-white transition-colors"
                title="Colapsar sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
            Widgets Disponibles
          </h3>
          <div className="space-y-1">
            {WIDGET_TYPES.map((widget) => {
              const Icon = widget.icon;
              return (
                <button
                  key={widget.id}
                  onClick={() => onAddWidget(widget.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-tertiary hover:text-white transition-colors group"
                >
                  <Icon size={18} className="text-orange" />
                  <span>{widget.label}</span>
                  <Plus
                    size={16}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Dashboards ({tabs.length}/10)
            </h3>
            {tabs.length < 10 && (
              <button
                onClick={handleAddTab}
                className="p-1 hover:bg-dark-tertiary rounded text-gray-400 hover:text-orange transition-colors"
                title="Agregar dashboard"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`rounded-lg transition-colors ${
                  activeTab === tab.id ? "bg-orange" : ""
                }`}
              >
                {editingTabId === tab.id ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span>{tab.emoji}</span>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTabEdit(tab.id);
                        if (e.key === "Escape") setEditingTabId(null);
                      }}
                      className="flex-1 text-sm bg-dark-primary text-white px-2 py-1 rounded border border-orange focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => saveTabEdit(tab.id)}
                      className="text-green-500"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-2 group ${
                      activeTab === tab.id
                        ? "text-white"
                        : "text-gray-300 hover:bg-dark-tertiary hover:text-white"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span className="flex-1">{tab.label}</span>
                    {!tab.isDefault && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingTab(tab);
                          }}
                          className="p-1 hover:bg-dark-primary rounded text-gray-400 hover:text-white"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTab(tab.id);
                          }}
                          className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
