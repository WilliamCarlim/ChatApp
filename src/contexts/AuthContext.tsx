import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import type { Usuario } from '../lib/supabase';

interface AuthContextType {
  usuarioAtual: Usuario | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuarioAtual: null,
  loading: true,
  isAuthenticated: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
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

  return (
    <AuthContext.Provider value={{
      usuarioAtual,
      loading,
      isAuthenticated: !!usuarioAtual
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 