import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Usuario } from '../lib/supabase';
import { Portal } from './Portal';
import { Avatar } from './Avatar';

interface ModalBuscaUsuariosProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioAtual: Usuario | null;
  onSelectUsuario: (usuario: Usuario) => void;
}

export function ModalBuscaUsuarios({ 
  isOpen, 
  onClose, 
  usuarioAtual,
  onSelectUsuario 
}: ModalBuscaUsuariosProps) {
  const [termoBusca, setTermoBusca] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    setTermoBusca('');
    setUsuarios([]);
    setCarregando(false);
  }, [isOpen]);

  const handleClose = () => {
    setTermoBusca('');
    setUsuarios([]);
    setCarregando(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen && termoBusca.length >= 3) {
      buscarUsuarios();
    } else {
      setUsuarios([]);
    }
  }, [termoBusca, isOpen]);

  async function buscarUsuarios() {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`nome.ilike.%${termoBusca}%,email.ilike.%${termoBusca}%`)
        .neq('id', usuarioAtual?.id)
        .limit(10);

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setCarregando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999]">
        {/* Fundo com efeito glass */}
        <div 
          className="absolute inset-0 bg-black/10"
          onClick={handleClose}
        />
        
        {/* Container do modal com backdrop-blur */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-sm" />
          
          {/* Conteúdo do modal */}
          <div className="relative bg-white rounded-lg w-full max-w-md p-4 shadow-lg border border-gray-200 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Nova Conversa</h2>
              <button 
                onClick={handleClose} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nome ou email"
                className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              {carregando ? (
                <div className="text-center py-4">Carregando...</div>
              ) : usuarios.length > 0 ? (
                usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => {
                      onSelectUsuario(usuario);
                      onClose();
                    }}
                  >
                    <Avatar 
                      nome={usuario.nome}
                      url={usuario.avatar_url}
                      tamanho={40}
                    />
                    <div>
                      <div className="font-medium text-gray-800">{usuario.nome}</div>
                      <div className="text-sm text-gray-500">{usuario.email}</div>
                    </div>
                  </div>
                ))
              ) : termoBusca.length >= 3 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum usuário encontrado
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Digite pelo menos 3 caracteres para buscar
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
} 