import { supabase } from '../lib/supabase';

interface EventosService {
  inscreverBloqueios: (usuarioId: string, callback: () => void) => Promise<any>;
  emitirEventoBloqueio: (usuarioId: string, bloqueadoId: string) => void;
  emitirEventoDesbloqueio: (usuarioId: string, bloqueadoId: string) => void;
}

export const eventosService: EventosService = {
  async inscreverBloqueios(usuarioId: string, callback: () => void) {
    return supabase
      .channel('bloqueios')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usuarios_bloqueados',
          filter: `usuario_id=eq.${usuarioId}`
        },
        () => {
          callback();
        }
      )
      .subscribe();
  },

  emitirEventoBloqueio: (usuarioId: string, bloqueadoId: string) => {
    const evento = new CustomEvent('usuarioBloqueado', {
      detail: { usuarioId, bloqueadoId }
    });
    window.dispatchEvent(evento);
  },

  emitirEventoDesbloqueio: (usuarioId: string, bloqueadoId: string) => {
    const evento = new CustomEvent('usuarioDesbloqueado', {
      detail: { usuarioId, bloqueadoId }
    });
    window.dispatchEvent(evento);
  }
}; 