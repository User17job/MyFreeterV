// ========================================
// src/components/widgets/LinksWidget.jsx
// ========================================
import { useState, useEffect } from "react";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function LinksWidget({ widget }) {
  const [links, setLinks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchLinks();
  }, [widget.id]);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("quick_links")
      .select("*")
      .eq("widget_id", widget.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLinks(data);
    }
  };

  const addLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    let url = newLink.url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const { data, error } = await supabase
      .from("quick_links")
      .insert([
        {
          user_id: user.id,
          widget_id: widget.id,
          title: newLink.title,
          url: url,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setLinks([data, ...links]);
      setShowModal(false);
      setNewLink({ title: "", url: "" });
    }
  };

  const deleteLink = async (linkId) => {
    const { error } = await supabase
      .from("quick_links")
      .delete()
      .eq("id", linkId);

    if (!error) {
      setLinks(links.filter((l) => l.id !== linkId));
    }
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setShowModal(true)} className="w-full">
        <Plus size={16} className="mr-2" />
        Agregar enlace
      </Button>

      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <div key={link.id} className="relative group">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-dark-tertiary hover:bg-opacity-80 rounded-lg transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-white font-medium truncate flex-1">
                  {link.title}
                </span>
                <ExternalLink
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
              </div>
              <span className="text-xs text-gray-500 truncate block mt-1">
                {new URL(link.url).hostname}
              </span>
            </a>
            <button
              onClick={() => deleteLink(link.id)}
              className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} className="text-white" />
            </button>
          </div>
        ))}
      </div>

      {links.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-8">
          No hay enlaces guardados
        </p>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo Enlace"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={addLink}>Agregar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={newLink.title}
            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
            placeholder="Mi enlace"
          />
          <Input
            label="URL"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            placeholder="https://ejemplo.com"
          />
        </div>
      </Modal>
    </div>
  );
}
