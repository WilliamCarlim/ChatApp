import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';
import type { Usuario } from '../lib/supabase';

interface RotaProtegidaProps {
  children: React.ReactNode;
}

export function RotaProtegida({ children }: RotaProtegidaProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Usuario | null>(null);

  useEffect(() => {
    async function verificarAutenticacao() {
      const { user, error } = await authService.getCurrentUser();
      if (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
      setUser(user);
      setLoading(false);
    }

    verificarAutenticacao();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00a884]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
} 