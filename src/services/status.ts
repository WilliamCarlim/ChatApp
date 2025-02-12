import { supabase } from '../lib/supabase';

const debug = (message: string, ...args: any[]) => {
  import.meta.env.VITE_DEBUG === 'true' && console.log(message, ...args);
};

const debugError = (message: string, ...args: any[]) => {
  import.meta.env.VITE_DEBUG === 'true' && console.error(message, ...args);
};

export const statusService = {
  async atualizarStatus(usuarioId: string, online: boolean) {
    try {
      debug('[StatusService] Atualizando status do usuário', { usuarioId, online });
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          online,
          last_seen: new Date().toISOString()
        })
        .eq('id', usuarioId)
        .select()
        .single();

      if (error) throw error;
      debug('[StatusService] Status atualizado com sucesso:', data);
      return { data, error: null };
    } catch (error) {
      debugError('[StatusService] Erro ao atualizar status:', error);
      return { data: null, error };
    }
  },

  async inscreverStatus(usuarioId: string, callback: (online: boolean, lastSeen?: string) => void) {
    debug('[StatusService] Inscrevendo para atualizações de status do usuário', usuarioId);
    return supabase
      .channel(`status:${usuarioId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'usuarios',
          filter: `id=eq.${usuarioId}`
        },
        (payload) => {
          debug('[StatusService] Recebida atualização de status:', payload.new);
          callback(payload.new.online, payload.new.last_seen);
        }
      )
      .subscribe();
  }
}; 