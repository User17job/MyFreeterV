// src/components/widgets/WidgetContainer.jsx - MOBILE CON DRAG HANDLE
import { X, GripVertical, Pencil, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useState } from "react";

export function WidgetContainer({
  title,
  children,
  onDelete,
  onTitleChange,
  isMobile,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== title) {
      onTitleChange?.(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <Card
      className="h-full flex flex-col relative group"
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* 🔥 DRAG HANDLE - SIEMPRE VISIBLE EN MOBILE */}
          <div
            className={`
              drag-handle cursor-move transition-colors shrink-0
              ${
                isMobile
                  ? "text-gray-500 hover:text-orange active:text-orange"
                  : "text-gray-600 hover:text-gray-400"
              }
            `}
            title={isMobile ? "Mantén presionado para mover" : "Arrastrar"}
          >
            <GripVertical size={isMobile ? 20 : 18} />
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditTitle(title);
                    setIsEditingTitle(false);
                  }
                }}
                className="flex-1 text-sm font-semibold bg-dark-primary text-white px-2 py-1 rounded border border-orange focus:outline-none focus:border-orange min-w-0"
                autoFocus
                onBlur={handleSaveTitle}
              />
              <button
                onClick={handleSaveTitle}
                className="text-green-500 hover:text-green-400 transition-colors shrink-0"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-white truncate flex-1 min-w-0">
                {title}
              </h3>
              {onTitleChange && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className={`
                    text-gray-600 hover:text-gray-400 transition-all shrink-0
                    ${
                      isMobile
                        ? "opacity-100"
                        : isHovered
                        ? "opacity-100"
                        : "opacity-0"
                    }
                  `}
                  aria-label="Editar título"
                >
                  <Pencil size={14} />
                </button>
              )}
            </>
          )}
        </div>

        <div
          className={`
            flex items-center gap-1 transition-all shrink-0
            ${
              isMobile ? "opacity-100" : isHovered ? "opacity-100" : "opacity-0"
            }
          `}
        >
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
              title="Eliminar widget"
              aria-label="Eliminar widget"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content con mejor scroll */}
      <div
        className={`
        flex-1 overflow-y-auto custom-scrollbar
        ${isMobile ? "overscroll-contain" : ""}
      `}
      >
        {children}
      </div>

      {/* 🔥 INDICADOR VISUAL EN MOBILE */}
      {isMobile && (
        <div className="absolute bottom-2 right-2 pointer-events-none opacity-30">
          <GripVertical size={16} className="text-gray-500" />
        </div>
      )}
    </Card>
  );
}
