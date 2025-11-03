// src/components/dashboard/WidgetGrid.jsx - CORREGIDO PARA MÓVIL
import { Responsive, WidthProvider } from "react-grid-layout";
import { WidgetContainer } from "@/components/widgets/WidgetContainer";
import { TodoWidget } from "@/components/widgets/TodoWidget";
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { NotesWidget } from "@/components/widgets/NotesWidget";
import { TimerWidget } from "@/components/widgets/TimerWidget";
import { LinksWidget } from "@/components/widgets/LinksWidget";
import { useWidgetStore } from "@/store/widgetStore";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGET_COMPONENTS = {
  todo: TodoWidget,
  calendar: CalendarWidget,
  notes: NotesWidget,
  timer: TimerWidget,
  links: LinksWidget,
};

// 🔥 HELPER SEGURO PARA LOCALSTORAGE
const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage not available:", e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn("localStorage not available:", e);
      return false;
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return false;
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn("localStorage not available:", e);
      return false;
    }
  },
};

export function WidgetGrid({ activeTab, sidebarCollapsed, isMobile }) {
  const { widgets, updateWidget, deleteWidget } = useWidgetStore();
  const [isClient, setIsClient] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState({});

  const isDraggingRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const gridRef = useRef(null);

  // 🔥 ESPERAR A QUE EL CLIENTE ESTÉ LISTO
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filtrar widgets por tab
  const tabWidgets = useMemo(
    () =>
      widgets.filter(
        (w) =>
          w.data?.tab === activeTab || (!w.data?.tab && activeTab === "mi-vida")
      ),
    [widgets, activeTab]
  );

  // Calcular margen izquierdo según estado del sidebar
  const getMarginLeft = () => {
    if (isMobile) return "0";
    return sidebarCollapsed ? "64px" : "256px";
  };

  // 🔥 CARGAR LAYOUTS SOLO DESPUÉS DE QUE EL CLIENTE ESTÉ LISTO
  useEffect(() => {
    if (!isClient) return;

    const loadAllLayouts = () => {
      const loaded = {};
      ["lg", "md", "sm", "xs"].forEach((breakpoint) => {
        try {
          const key = `layout-${activeTab}-${breakpoint}`;
          const saved = safeLocalStorage.getItem(key);

          if (saved) {
            const layout = JSON.parse(saved);
            const currentWidgetIds = tabWidgets.map((w) => w.id);
            loaded[breakpoint] = layout.filter((item) =>
              currentWidgetIds.includes(item.i)
            );
          }
        } catch (e) {
          console.warn(`Error loading layout ${breakpoint}:`, e);
        }
      });

      setSavedLayouts(loaded);
    };

    // Pequeño delay para asegurar que todo esté listo
    const timeoutId = setTimeout(loadAllLayouts, 100);
    return () => clearTimeout(timeoutId);
  }, [isClient, activeTab, tabWidgets]);

  // GUARDAR LAYOUTS EN LOCALSTORAGE
  const saveLayoutToStorage = useCallback(
    (layout, breakpoint) => {
      if (!isClient) return;

      try {
        const key = `layout-${activeTab}-${breakpoint}`;
        safeLocalStorage.setItem(key, JSON.stringify(layout));

        // Actualizar estado local también
        setSavedLayouts((prev) => ({
          ...prev,
          [breakpoint]: layout,
        }));
      } catch (e) {
        console.warn("Error saving layout:", e);
      }
    },
    [activeTab, isClient]
  );

  // 🔥 LAYOUTS CON FALLBACK SEGURO
  const layouts = useMemo(() => {
    const currentWidgetIds = new Set(tabWidgets.map((w) => w.id));

    const isLayoutValid = (layout) => {
      if (!layout || layout.length !== tabWidgets.length) return false;
      return layout.every((item) => currentWidgetIds.has(item.i));
    };

    // Layouts por defecto
    const defaultLgLayout = tabWidgets.map((w, index) => ({
      i: w.id,
      x: (index % 3) * 4,
      y: Math.floor(index / 3) * 3,
      w: 4,
      h: 3,
      minW: 2,
      minH: 2,
    }));

    const defaultMdLayout = tabWidgets.map((w, index) => ({
      i: w.id,
      x: (index % 2) * 3,
      y: Math.floor(index / 2) * 3,
      w: 3,
      h: 3,
      minW: 2,
      minH: 2,
    }));

    const defaultSmLayout = tabWidgets.map((w, index) => ({
      i: w.id,
      x: 0,
      y: index * 4,
      w: 1,
      h: 4,
      minW: 1,
      minH: 3,
    }));

    return {
      lg: isLayoutValid(savedLayouts.lg) ? savedLayouts.lg : defaultLgLayout,
      md: isLayoutValid(savedLayouts.md) ? savedLayouts.md : defaultMdLayout,
      sm: isLayoutValid(savedLayouts.sm) ? savedLayouts.sm : defaultSmLayout,
      xs: isLayoutValid(savedLayouts.xs) ? savedLayouts.xs : defaultSmLayout,
    };
  }, [tabWidgets, savedLayouts]);

  const handleLayoutChange = useCallback(
    (layout, allLayouts) => {
      if (!isClient) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          Object.entries(allLayouts).forEach(([breakpoint, layoutData]) => {
            saveLayoutToStorage(layoutData, breakpoint);
          });
        }
      }, 500);
    },
    [saveLayoutToStorage, isClient]
  );

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragStop = useCallback(
    (layout) => {
      isDraggingRef.current = false;
      const breakpoint = getCurrentBreakpoint();
      saveLayoutToStorage(layout, breakpoint);
    },
    [saveLayoutToStorage]
  );

  const handleResizeStop = useCallback(
    (layout) => {
      const breakpoint = getCurrentBreakpoint();
      saveLayoutToStorage(layout, breakpoint);
    },
    [saveLayoutToStorage]
  );

  const getCurrentBreakpoint = () => {
    if (typeof window === "undefined") return "lg";
    const width = window.innerWidth;
    if (width >= 1200) return "lg";
    if (width >= 996) return "md";
    if (width >= 768) return "sm";
    return "xs";
  };

  const handleDelete = useCallback(
    async (widgetId) => {
      if (!window.confirm("¿Estás seguro de eliminar este widget?")) return;

      await deleteWidget(widgetId);

      // Limpiar layouts guardados
      if (isClient) {
        ["lg", "md", "sm", "xs"].forEach((breakpoint) => {
          try {
            const key = `layout-${activeTab}-${breakpoint}`;
            const saved = safeLocalStorage.getItem(key);
            if (saved) {
              const layout = JSON.parse(saved);
              const newLayout = layout.filter((item) => item.i !== widgetId);
              safeLocalStorage.setItem(key, JSON.stringify(newLayout));
            }
          } catch (e) {
            console.warn("Error cleaning layout:", e);
          }
        });
      }
    },
    [deleteWidget, activeTab, isClient]
  );

  const handleTitleChange = useCallback(
    async (widgetId, newTitle) => {
      await updateWidget(widgetId, { title: newTitle });
    },
    [updateWidget]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // 🔥 NO RENDERIZAR HASTA QUE EL CLIENTE ESTÉ LISTO
  if (!isClient) {
    return (
      <div className="p-4 md:p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-brown border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Preparando widgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 md:p-6 min-h-full transition-all duration-300 ${
        isMobile ? "pb-24" : ""
      }`}
      style={{ marginLeft: getMarginLeft() }}
    >
      {tabWidgets.length === 0 ? (
        <div className="h-full flex items-center justify-center min-h-[60vh]">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay widgets en este dashboard
            </h3>
            <p className="text-gray-400 text-sm md:text-base">
              {isMobile
                ? "Toca el botón de menú para agregar widgets"
                : "Usa el menú lateral para agregar tu primer widget"}
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveGridLayout
          ref={gridRef}
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 6, sm: 1, xs: 1 }}
          rowHeight={isMobile ? 100 : 150}
          onLayoutChange={handleLayoutChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          onResizeStop={handleResizeStop}
          draggableHandle=".drag-handle"
          containerPadding={[0, 0]}
          margin={isMobile ? [12, 12] : [16, 16]}
          isDraggable={true}
          isResizable={!isMobile} // Deshabilitar resize en móvil
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms={true}
          transformScale={1}
        >
          {tabWidgets.map((widget) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.type];

            if (!WidgetComponent) {
              console.warn(`Widget type not found: ${widget.type}`);
              return null;
            }

            return (
              <div key={widget.id}>
                <WidgetContainer
                  title={widget.title}
                  onDelete={() => handleDelete(widget.id)}
                  onTitleChange={(newTitle) =>
                    handleTitleChange(widget.id, newTitle)
                  }
                  isMobile={isMobile}
                >
                  <WidgetComponent widget={widget} />
                </WidgetContainer>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
