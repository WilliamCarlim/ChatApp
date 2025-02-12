import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import type { Usuario } from '../lib/supabase';

export function useAuth() {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      const { user } = await authService.getCurrentUser();
      setUsuarioAtual(user);
      setLoading(false);
    }

    carregarUsuario();
  }, []);

  return {
    usuarioAtual,
    loading,
    isAuthenticated: !!usuarioAtual
  };
} 