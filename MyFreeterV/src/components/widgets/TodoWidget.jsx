// src/components/widgets/TodoWidget.jsx - SEGURO PARA MÓVIL
import { useState, useEffect } from "react";
import { Plus, Check, Trash2, Circle, Pencil } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export function TodoWidget({ widget }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState(null);

  const user = useAuthStore((state) => state.user);

  // 🔥 ESPERAR A QUE EL CLIENTE ESTÉ LISTO
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && user?.id && widget?.id) {
      fetchTodos();
    }
  }, [widget?.id, isClient, user?.id]);

  const fetchTodos = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("widget_id", widget.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (err) {
      console.error("Error fetching todos:", err);
      setError("Error al cargar tareas");
      setTodos([]);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("todos")
        .insert([
          {
            user_id: user.id,
            widget_id: widget.id,
            title: newTodo.trim(),
            completed: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodos([data, ...todos]);
        setNewTodo("");
      }
    } catch (err) {
      console.error("Error adding todo:", err);
      setError("Error al agregar tarea");
    } finally {
      setLoading(false);
    }
  };

  const toggleTodo = async (todoId, completed) => {
    try {
      const { data, error } = await supabase
        .from("todos")
        .update({ completed: !completed })
        .eq("id", todoId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodos(todos.map((t) => (t.id === todoId ? data : t)));
      }
    } catch (err) {
      console.error("Error toggling todo:", err);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };

  const saveEdit = async (todoId) => {
    if (!editingText.trim()) return;

    try {
      const { data, error } = await supabase
        .from("todos")
        .update({ title: editingText.trim() })
        .eq("id", todoId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTodos(todos.map((t) => (t.id === todoId ? data : t)));
        setEditingId(null);
        setEditingText("");
      }
    } catch (err) {
      console.error("Error saving edit:", err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const deleteTodo = async (todoId) => {
    try {
      const { error } = await supabase.from("todos").delete().eq("id", todoId);

      if (error) throw error;
      setTodos(todos.filter((t) => t.id !== todoId));
    } catch (err) {
      console.error("Error deleting todo:", err);
    }
  };

  // 🔥 NO RENDERIZAR HASTA QUE EL CLIENTE ESTÉ LISTO
  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400 text-sm">Cargando tareas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={addTodo} className="flex gap-2">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Nueva tarea..."
          className="text-sm"
        />
        <Button type="submit" size="sm" disabled={loading || !newTodo.trim()}>
          <Plus size={16} />
        </Button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-dark-tertiary hover:bg-opacity-80 transition-colors group"
          >
            <button
              onClick={() => toggleTodo(todo.id, todo.completed)}
              className="flex-shrink-0"
            >
              {todo.completed ? (
                <div className="w-5 h-5 rounded bg-orange flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              ) : (
                <Circle size={18} className="text-gray-500" />
              )}
            </button>

            {editingId === todo.id ? (
              <>
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 text-sm bg-dark-primary text-white px-2 py-1 rounded border border-orange focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => saveEdit(todo.id)}
                  className="text-green-500 hover:text-green-400 text-xs"
                >
                  ✓
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-red-500 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm ${
                    todo.completed ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {todo.title}
                </span>

                <button
                  onClick={() => startEditing(todo)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-blue-500"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        ))}

        {todos.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">
            No hay tareas. ¡Agrega una!
          </p>
        )}
      </div>

      {todos.length > 0 && (
        <div className="pt-2 border-t border-gray-800 text-xs text-gray-500">
          {todos.filter((t) => t.completed).length} de {todos.length}{" "}
          completadas
        </div>
      )}
    </div>
  );
}
