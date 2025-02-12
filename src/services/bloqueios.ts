import { supabase } from '../lib/supabase';

export const bloqueiosService = {
  async bloquearUsuario(usuarioId: string, bloqueadoId: string) {
    try {
      // Validação dos IDs
      if (!usuarioId || !bloqueadoId) {
        throw new Error('IDs de usuário inválidos');
      }

      // Verifica se já existe um bloqueio
      const { data: bloqueioExistente } = await supabase
        .from('usuarios_bloqueados')
        .select('*')
        .match({ usuario_id: usuarioId, bloqueado_id: bloqueadoId })
        .single();

      if (bloqueioExistente) {
        return { bloqueio: bloqueioExistente, error: null };
      }

      // Insere o novo bloqueio
      const { data, error } = await supabase
        .from('usuarios_bloqueados')
        .insert({
          usuario_id: usuarioId,
          bloqueado_id: bloqueadoId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao bloquear usuário:', error);
        throw error;
      }

      return { bloqueio: data, error: null };
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      return { bloqueio: null, error };
    }
  },

  async desbloquearUsuario(usuarioId: string, bloqueadoId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios_bloqueados')
        .delete()
        .match({ usuario_id: usuarioId, bloqueado_id: bloqueadoId })
        .select()
        .single();

      if (error) throw error;
      return { sucesso: true, error: null };
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      return { sucesso: false, error };
    }
  },

  async verificarBloqueio(usuarioId: string, outroUsuarioId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios_bloqueados')
        .select('*')
        .match({ usuario_id: usuarioId, bloqueado_id: outroUsuarioId })
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { 
        bloqueado: !!data, 
        data: data,
        error: null 
      };
    } catch (error) {
      console.error('Erro ao verificar bloqueio:', error);
      return { bloqueado: false, data: null, error };
    }
  }
}; 