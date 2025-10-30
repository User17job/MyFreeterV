// src/components/widgets/NotesWidget.jsx - CON AUTOGUARDADO
import { useState, useEffect, useRef } from "react";
import { Save, Check } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function NotesWidget({ widget }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const user = useAuthStore((state) => state.user);
  const autoSaveTimerRef = useRef(null);
  const hasChangesRef = useRef(false);

  useEffect(() => {
    fetchNote();
  }, [widget.id]);

  // Autoguardado cada 3 segundos después de escribir
  useEffect(() => {
    if (hasChangesRef.current) {
      // Limpiar timer anterior
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Configurar nuevo timer
      autoSaveTimerRef.current = setTimeout(() => {
        saveNote(true); // true = autoguardado silencioso
      }, 3000); // 3 segundos de inactividad
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content]);

  const fetchNote = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("widget_id", widget.id)
      .single();

    if (!error && data) {
      setContent(data.content || "");
      setLastSaved(new Date(data.updated_at));
      hasChangesRef.current = false;
    }
  };

  const saveNote = async (isAutoSave = false) => {
    if (!hasChangesRef.current && isAutoSave) return;

    setSaving(true);

    const { data: existing } = await supabase
      .from("notes")
      .select("id")
      .eq("widget_id", widget.id)
      .single();

    if (existing) {
      await supabase
        .from("notes")
        .update({ content })
        .eq("widget_id", widget.id);
    } else {
      await supabase.from("notes").insert([
        {
          user_id: user.id,
          widget_id: widget.id,
          content,
        },
      ]);
    }

    setLastSaved(new Date());
    setSaving(false);
    hasChangesRef.current = false;

    // Mostrar indicador de guardado
    if (isAutoSave) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    hasChangesRef.current = true;
  };

  const handleManualSave = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    saveNote(false);
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex-1 relative">
        <Textarea
          value={content}
          onChange={handleContentChange}
          placeholder="Escribe tus notas aquí..."
          className="absolute inset-0 resize-none w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {lastSaved && `Guardado: ${lastSaved.toLocaleTimeString()}`}
          </span>
          {showSaved && (
            <span className="text-xs text-green-500 flex items-center gap-1 animate-in fade-in duration-200">
              <Check size={14} />
              Autoguardado
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleManualSave}
          disabled={saving || !hasChangesRef.current}
        >
          <Save size={16} className="mr-2" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
