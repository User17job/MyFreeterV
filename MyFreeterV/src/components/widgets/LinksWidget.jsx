// src/components/widgets/LinksWidget.jsx - SEGURO PARA MÓVIL
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
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState(null);

  const user = useAuthStore((state) => state.user);

  // 🔥 ESPERAR A QUE EL CLIENTE ESTÉ LISTO
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user?.id && widget?.id) {
      fetchLinks();
    }
  }, [widget?.id, isClient, user?.id]);

  const fetchLinks = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("quick_links")
        .select("*")
        .eq("widget_id", widget.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (err) {
      console.error("Error fetching links:", err);
      setError("Error al cargar enlaces");
      setLinks([]);
    }
  };

  const addLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    try {
      setError(null);
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

      if (error) throw error;

      if (data) {
        setLinks([data, ...links]);
        setShowModal(false);
        setNewLink({ title: "", url: "" });
      }
    } catch (err) {
      console.error("Error adding link:", err);
      setError("Error al agregar enlace");
    }
  };

  const deleteLink = async (linkId) => {
    try {
      const { error } = await supabase
        .from("quick_links")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
      setLinks(links.filter((l) => l.id !== linkId));
    } catch (err) {
      console.error("Error deleting link:", err);
    }
  };

  const handleLinkClick = (url) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // 🔥 NO RENDERIZAR HASTA QUE EL CLIENTE ESTÉ LISTO
  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400 text-sm">Cargando enlaces...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
          {error}
        </div>
      )}

      <Button size="sm" onClick={() => setShowModal(true)} className="w-full">
        <Plus size={16} className="mr-2" />
        Agregar Enlace
      </Button>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {links.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">
            No hay enlaces guardados
          </p>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-2 p-3 bg-dark-tertiary rounded-lg group hover:bg-dark-tertiary/80 transition-colors"
            >
              <button
                onClick={() => handleLinkClick(link.url)}
                className="flex-1 text-left flex items-center gap-2 min-w-0"
              >
                <ExternalLink size={16} className="text-orange flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {link.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{link.url}</p>
                </div>
              </button>

              <button
                onClick={() => deleteLink(link.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setNewLink({ title: "", url: "" });
        }}
        title="Nuevo Enlace"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                setNewLink({ title: "", url: "" });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={addLink}
              disabled={!newLink.title.trim() || !newLink.url.trim()}
            >
              Agregar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={newLink.title}
            onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
            placeholder="Ej: Google Drive"
          />
          <Input
            label="URL"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            placeholder="Ej: drive.google.com"
          />
        </div>
      </Modal>
    </div>
  );
}
