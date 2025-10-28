// src/components/widgets/NotesWidget.jsx - FINAL
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function NotesWidget({ widget }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchNote();
  }, [widget.id]);

  const fetchNote = async () => {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("widget_id", widget.id)
      .single();

    if (!error && data) {
      setContent(data.content || "");
      setLastSaved(new Date(data.updated_at));
    }
  };

  const saveNote = async () => {
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
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex-1 relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe tus notas aquí..."
          className="absolute inset-0 resize-none w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-gray-500">
          {lastSaved && `Guardado: ${lastSaved.toLocaleTimeString()}`}
        </span>
        <Button size="sm" onClick={saveNote} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
