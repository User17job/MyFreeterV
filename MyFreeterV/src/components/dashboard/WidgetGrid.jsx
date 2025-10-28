// src/components/dashboard/WidgetGrid.jsx - OPTIMIZADO
import { Responsive, WidthProvider } from "react-grid-layout";
import { WidgetContainer } from "@/components/widgets/WidgetContainer";
import { TodoWidget } from "@/components/widgets/TodoWidget";
import { CalendarWidget } from "@/components/widgets/CalendarWidget";
import { NotesWidget } from "@/components/widgets/NotesWidget";
import { TimerWidget } from "@/components/widgets/TimerWidget";
import { LinksWidget } from "@/components/widgets/LinksWidget";
import { useWidgetStore } from "@/store/widgetStore";
import { useCallback, useMemo, useRef } from "react";
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

export function WidgetGrid({ activeTab }) {
  const { widgets, updateWidget, deleteWidget, updateWidgetPositions } =
    useWidgetStore();

  const isDraggingRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  // Filtrar widgets por tab actual (memoizado)
  const tabWidgets = useMemo(
    () =>
      widgets.filter(
        (w) =>
          w.data?.tab === activeTab || (!w.data?.tab && activeTab === "mi-vida")
      ),
    [widgets, activeTab]
  );

  // Layouts memoizados
  const layouts = useMemo(
    () => ({
      lg: tabWidgets.map((w) => ({
        i: w.id,
        x: w.position?.x || 0,
        y: w.position?.y || 0,
        w: w.position?.w || 4,
        h: w.position?.h || 3,
        minW: 2,
        minH: 2,
      })),
    }),
    [tabWidgets]
  );

  // Guardar posiciones con debounce
  const handleLayoutChange = useCallback(
    (layout) => {
      // Limpiar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Esperar 500ms después del último cambio para guardar
      saveTimeoutRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          updateWidgetPositions(layout);
        }
      }, 500);
    },
    [updateWidgetPositions]
  );

  // Detectar cuando empieza el drag
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Detectar cuando termina el drag y guardar
  const handleDragStop = useCallback(
    (layout) => {
      isDraggingRef.current = false;
      updateWidgetPositions(layout);
    },
    [updateWidgetPositions]
  );

  // Detectar cuando termina el resize y guardar
  const handleResizeStop = useCallback(
    (layout) => {
      updateWidgetPositions(layout);
    },
    [updateWidgetPositions]
  );

  const handleDelete = useCallback(
    async (widgetId) => {
      if (window.confirm("¿Estás seguro de eliminar este widget?")) {
        await deleteWidget(widgetId);
      }
    },
    [deleteWidget]
  );

  const handleTitleChange = useCallback(
    async (widgetId, newTitle) => {
      await updateWidget(widgetId, { title: newTitle });
    },
    [updateWidget]
  );

  return (
    <div className="p-6 h-full">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={150}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        draggableHandle=".drag-handle"
        containerPadding={[0, 0]}
        margin={[16, 16]}
        isDraggable={true}
        isResizable={true}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
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
              >
                <WidgetComponent widget={widget} />
              </WidgetContainer>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {tabWidgets.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay widgets en este dashboard
            </h3>
            <p className="text-gray-400">
              Usa el menú lateral para agregar tu primer widget
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
