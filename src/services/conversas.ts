import { supabase } from '../lib/supabase';
import type { Conversa } from '../pages/Chat';
import type { Mensagem } from './mensagens';

export const conversasService = {
  async buscarConversas(usuarioId: string) {
    try {
      // Busca todas as mensagens onde o usuário é remetente ou destinatário
      const { data: mensagens, error } = await supabase
        .from('msg_chat')
        .select(`
          *,
          remetente:remetente_id(id, nome, avatar_url),
          destinatario:destinatario_id(id, nome, avatar_url)
        `)
        .or(`remetente_id.eq.${usuarioId},destinatario_id.eq.${usuarioId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupa mensagens por conversa
      const conversasMap = new Map<string, Conversa>();
      
      mensagens.forEach((msg: any) => {
        const outroUsuario = msg.remetente_id === usuarioId ? msg.destinatario : msg.remetente;
        const conversaId = outroUsuario.id;

        if (!conversasMap.has(conversaId)) {
          let ultimaMensagem;
          if (msg.deletada) {
            ultimaMensagem = msg.remetente_id === usuarioId 
              ? 'Você apagou uma mensagem' 
              : 'Uma mensagem foi apagada';
          } else if (msg.tipo === 'audio') {
            ultimaMensagem = msg.remetente_id === usuarioId 
              ? 'Você: Mensagem de áudio' 
              : 'Mensagem de áudio';
          } else {
            ultimaMensagem = msg.remetente_id === usuarioId 
              ? `Você: ${msg.texto}${msg.editada ? ' (editada)' : ''}` 
              : `${msg.texto}${msg.editada ? ' (editada)' : ''}`;
          }

          conversasMap.set(conversaId, {
            id: conversaId,
            nome: outroUsuario.nome,
            ultimaMensagem,
            horario: new Date(msg.updated_at || msg.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            avatar: outroUsuario.avatar_url || '',
            naoLidas: msg.remetente_id !== usuarioId && !msg.lida_destinatario ? 1 : 0
          });
        }
      });

      return { conversas: Array.from(conversasMap.values()), error: null };
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      return { conversas: [], error };
    }
  },

  async inscreverNovasConversas(usuarioId: string, callback: (conversa: Conversa) => void) {
    const channel = supabase
      .channel('novas-mensagens')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'msg_chat',
          filter: `destinatario_id=eq.${usuarioId}`
        },
        async (payload: any) => {
          const { data: remetente } = await supabase
            .from('usuarios')
            .select('nome, avatar_url')
            .eq('id', payload.new.remetente_id)
            .single();

          if (remetente) {
            const ultimaMensagem = payload.new.tipo === 'audio' 
              ? 'Mensagem de áudio'
              : payload.new.texto;

            const novaConversa: Conversa = {
              id: payload.new.remetente_id,
              nome: remetente.nome,
              ultimaMensagem,
              horario: new Date(payload.new.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              }),
              avatar: remetente.avatar_url || '',
              naoLidas: 1
            };
            callback(novaConversa);
          }
        }
      );

    await channel.subscribe();
    return channel;
  },

  async inscreverAtualizacoesMensagens(usuarioId: string, callback: (mensagemAtualizada: any) => void) {
    const channel = supabase
      .channel('atualizacoes-mensagens')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'msg_chat',
          filter: `destinatario_id=eq.${usuarioId}`
        },
        (payload) => {
          callback(payload.new);
        }
      );

    await channel.subscribe();
    return channel;
  }
}; 