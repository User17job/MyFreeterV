// src/components/ui/Select.jsx - CON SOPORTE MOBILE MEJORADO
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export function Select({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = "Seleccionar...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calcular posición del dropdown
  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Altura estimada del dropdown (número de opciones * altura aproximada)
      const estimatedHeight = Math.min(options.length * 48, 300);

      // Decidir si mostrar arriba o abajo
      const showAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

      // Calcular maxHeight para que nunca se salga de la pantalla
      let maxHeight;
      let top;

      if (showAbove) {
        // Mostrar arriba: limitado por el espacio disponible arriba
        maxHeight = Math.min(spaceAbove - 20, 300);
        top = rect.top - maxHeight - 4;
      } else {
        // Mostrar abajo: limitado por el espacio disponible abajo
        maxHeight = Math.min(spaceBelow - 20, 300);
        top = rect.bottom + 4;
      }

      setPosition({
        top,
        left: rect.left,
        width: rect.width,
        maxHeight,
        showAbove,
      });
    }
  }, [isOpen, options.length]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar al hacer scroll (pero no dentro del dropdown)
  useEffect(() => {
    const handleScroll = (e) => {
      // No cerrar si el scroll es dentro del dropdown
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  // Dropdown con portal para que se renderice fuera del modal
  const dropdown =
    isOpen &&
    createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: `${position.maxHeight}px`,
          zIndex: 99999, // Muy alto para estar sobre todo
        }}
        className={`
        bg-dark-secondary border border-dark-border rounded-lg shadow-xl
        overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150
        ${position.showAbove ? "slide-in-from-bottom-2" : "slide-in-from-top-2"}
      `}
      >
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`
            w-full px-4 py-3 text-left text-sm transition-colors
            hover:bg-dark-tertiary active:bg-dark-tertiary
            ${
              value === option.value
                ? "bg-dark-tertiary text-orange font-medium"
                : "text-white"
            }
          `}
          >
            {option.label}
          </button>
        ))}
      </div>,
      document.body
    );

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div ref={selectRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 bg-dark-secondary border border-dark-border 
            rounded-lg text-left text-white text-sm
            flex items-center justify-between
            transition-colors
            ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-orange/50 focus:border-orange focus:outline-none"
            }
            ${isOpen ? "border-orange" : ""}
          `}
        >
          <span className={selectedOption ? "text-white" : "text-gray-500"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      {dropdown}
    </div>
  );
}
