import { Avatar } from './Avatar';
import { bloqueiosService } from '../services/bloqueios';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { eventosService } from '../services/eventos';

const debug = (message: string, ...args: any[]) => {
  import.meta.env.VITE_DEBUG === 'true' && console.log(message, ...args);
};

const debugError = (message: string, ...args: any[]) => {
  import.meta.env.VITE_DEBUG === 'true' && console.error(message, ...args);
};

interface ConversaItemProps {
  id: string;
  nome: string;
  ultimaMensagem: string;
  horario: string;
  avatar: string;
  online?: boolean;
  naoLidas?: number;
  pinned?: boolean;
  selecionada?: boolean;
  onClick?: () => void;
}

export function ConversaItem({ 
  id,
  nome, 
  ultimaMensagem, 
  horario, 
  avatar, 
  naoLidas = 0,
  pinned,
  selecionada,
  onClick
}: ConversaItemProps) {
  const [estaBloqueado, setEstaBloqueado] = useState(false);
  const { usuarioAtual } = useAuth();

  useEffect(() => {
    async function verificarBloqueio() {
      if (usuarioAtual) {
        const { bloqueado, error } = await bloqueiosService.verificarBloqueio(
          usuarioAtual.id,
          id
        );
        if (error) {
          debugError('Erro ao verificar bloqueio:', error);
          return;
        }
        debug('Status de bloqueio:', { id, bloqueado });
        setEstaBloqueado(bloqueado);
      }
    }

    verificarBloqueio();
  }, [id, usuarioAtual]);

  useEffect(() => {
    let channel: any;

    async function inicializarEventos() {
      if (usuarioAtual) {
        debug('Inicializando eventos para usuário:', usuarioAtual.id);
        channel = await eventosService.inscreverBloqueios(
          usuarioAtual.id,
          async () => {
            const { bloqueado } = await bloqueiosService.verificarBloqueio(
              usuarioAtual.id,
              id
            );
            debug('Atualização de bloqueio recebida:', { id, bloqueado });
            setEstaBloqueado(bloqueado);
          }
        );
      }
    }

    inicializarEventos();

    return () => {
      if (channel) {
        debug('Removendo canal de eventos');
        supabase.removeChannel(channel);
      }
    };
  }, [id, usuarioAtual]);

  // Escuta eventos de bloqueio
  useEffect(() => {
    const handleBloqueio = (event: CustomEvent<{ usuarioId: string, bloqueadoId: string }>) => {
      const { usuarioId, bloqueadoId } = event.detail;
      debug('Evento de bloqueio recebido:', { usuarioId, bloqueadoId, conversaId: id });
      
      if (usuarioId === usuarioAtual?.id && bloqueadoId === id) {
        // Atualiza imediatamente o estado local
        setEstaBloqueado(true);
      }
    };

    const handleDesbloqueio = (event: CustomEvent<{ usuarioId: string, bloqueadoId: string }>) => {
      const { usuarioId, bloqueadoId } = event.detail;
      debug('Evento de desbloqueio recebido:', { usuarioId, bloqueadoId, conversaId: id });
      
      if (usuarioId === usuarioAtual?.id && bloqueadoId === id) {
        // Atualiza imediatamente o estado local
        setEstaBloqueado(false);
      }
    };

    window.addEventListener('usuarioBloqueado', handleBloqueio as EventListener);
    window.addEventListener('usuarioDesbloqueado', handleDesbloqueio as EventListener);

    return () => {
      window.removeEventListener('usuarioBloqueado', handleBloqueio as EventListener);
      window.removeEventListener('usuarioDesbloqueado', handleDesbloqueio as EventListener);
    };
  }, [id, usuarioAtual]);

  debug('ConversaItem - Props recebidas:', {
    id,
    nome,
    ultimaMensagem,
    horario,
    avatar,
    naoLidas,
    pinned
  });

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
        selecionada ? 'bg-blue-50' : ''
      } ${estaBloqueado ? 'opacity-50' : ''}`}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar nome={nome} url={avatar} tamanho={48} />
        {estaBloqueado && (
          <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        )}
      </div>

      {/* Informações da conversa */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 truncate">
            {nome} {estaBloqueado && '(Bloqueado)'}
          </h3>
          <span className="text-sm text-gray-500">{horario}</span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {estaBloqueado ? 'Usuário bloqueado' : ultimaMensagem}
        </p>
      </div>

      {naoLidas > 0 && !estaBloqueado && (
        <span className="bg-[#00a884] text-white text-xs px-2 py-1 rounded-full">
          {naoLidas}
        </span>
      )}

      {pinned && (
        <span className="text-[#00a884]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582a1.5 1.5 0 01.096 2.68L11 10.06V14a1 1 0 11-2 0v-3.94L4.954 8.585a1.5 1.5 0 01.096-2.68L9 4.323V3a1 1 0 011-1z" />
          </svg>
        </span>
      )}
    </div>
  );
} 