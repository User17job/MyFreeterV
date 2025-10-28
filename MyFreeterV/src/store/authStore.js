// src/store/authStore.js
import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    set({ user: data.user, session: data.session });
    return data;
  },

  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, session: null });
  },

  initialize: async () => {
    set({ loading: true });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({
      user: session?.user ?? null,
      session,
      loading: false,
    });

    // Escuchar cambios de autenticación
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });
  },
}));
