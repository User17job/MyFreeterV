// ============================================
// 4. WIDGET GRID - CON MARGEN DINÁMICO
// src/components/dashboard/WidgetGrid.jsx
// ============================================

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

export function WidgetGrid({ activeTab, sidebarCollapsed, isMobile }) {
  const { widgets, updateWidget, deleteWidget } = useWidgetStore();

  const isDraggingRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const gridRef = useRef(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

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

  // CARGAR LAYOUTS DESDE LOCALSTORAGE
  const loadLayoutFromStorage = useCallback(
    (breakpoint) => {
      try {
        const key = `layout-${activeTab}-${breakpoint}`;
        const saved = localStorage.getItem(key);

        if (saved) {
          const layout = JSON.parse(saved);
          const currentWidgetIds = tabWidgets.map((w) => w.id);
          return layout.filter((item) => currentWidgetIds.includes(item.i));
        }
      } catch (e) {
        console.error("Error loading layout:", e);
      }
      return null;
    },
    [activeTab, tabWidgets]
  );

  // GUARDAR LAYOUTS EN LOCALSTORAGE
  const saveLayoutToStorage = useCallback(
    (layout, breakpoint) => {
      try {
        const key = `layout-${activeTab}-${breakpoint}`;
        localStorage.setItem(key, JSON.stringify(layout));
      } catch (e) {
        console.error("Error saving layout:", e);
      }
    },
    [activeTab]
  );

  // LAYOUTS CON LOCALSTORAGE Y FALLBACK
  const layouts = useMemo(() => {
    const savedLg = loadLayoutFromStorage("lg");
    const savedMd = loadLayoutFromStorage("md");
    const savedSm = loadLayoutFromStorage("sm");

    const currentWidgetIds = new Set(tabWidgets.map((w) => w.id));

    const isLayoutValid = (layout) => {
      if (!layout || layout.length !== tabWidgets.length) return false;
      return layout.every((item) => currentWidgetIds.has(item.i));
    };

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
      lg: isLayoutValid(savedLg) ? savedLg : defaultLgLayout,
      md: isLayoutValid(savedMd) ? savedMd : defaultMdLayout,
      sm: isLayoutValid(savedSm) ? savedSm : defaultSmLayout,
      xs: isLayoutValid(savedSm) ? savedSm : defaultSmLayout,
    };
  }, [tabWidgets, loadLayoutFromStorage]);

  const handleLayoutChange = useCallback(
    (layout, allLayouts) => {
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
    [saveLayoutToStorage]
  );

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragStop = useCallback(
    (layout, oldItem, newItem) => {
      isDraggingRef.current = false;
      const breakpoint = getCurrentBreakpoint();
      saveLayoutToStorage(layout, breakpoint);
    },
    [saveLayoutToStorage]
  );

  const handleResizeStop = useCallback(
    (layout, oldItem, newItem) => {
      const breakpoint = getCurrentBreakpoint();
      saveLayoutToStorage(layout, breakpoint);
    },
    [saveLayoutToStorage]
  );

  const getCurrentBreakpoint = () => {
    const width = window.innerWidth;
    if (width >= 1200) return "lg";
    if (width >= 996) return "md";
    if (width >= 768) return "sm";
    return "xs";
  };

  const handleDelete = useCallback(
    async (widgetId) => {
      if (window.confirm("¿Estás seguro de eliminar este widget?")) {
        await deleteWidget(widgetId);

        ["lg", "md", "sm", "xs"].forEach((breakpoint) => {
          try {
            const key = `layout-${activeTab}-${breakpoint}`;
            const saved = localStorage.getItem(key);
            if (saved) {
              const layout = JSON.parse(saved);
              const newLayout = layout.filter((item) => item.i !== widgetId);
              localStorage.setItem(key, JSON.stringify(newLayout));
            }
          } catch (e) {
            console.error("Error cleaning layout:", e);
          }
        });
      }
    },
    [deleteWidget, activeTab]
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

  return (
    <div
      ref={containerRef}
      className={`p-4 md:p-6 min-h-full transition-all duration-300 ${
        isMobile ? "pb-24" : ""
      }`}
      style={{ marginLeft: getMarginLeft() }}
    >
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
        isResizable={true}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
        transformScale={1}
      >
        {tabWidgets.map((widget) => {
          const WidgetComponent = WIDGET_COMPONENTS[widget.type];

          if (!WidgetComponent) return null;

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

      {tabWidgets.length === 0 && (
        <div className="h-full flex items-center justify-center">
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
      )}
    </div>
  );
}
