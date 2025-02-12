import { supabase } from '../lib/supabase';
import { bloqueiosService } from './bloqueios';

export interface Mensagem {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  texto: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento';
  audio_url?: string;
  imagem_url?: string;
  video_url?: string;
  documento_url?: string;
  lida_remetente: boolean;
  lida_destinatario: boolean;
  created_at: string;
  updated_at?: string;
  deletada?: boolean;
  editada?: boolean;
}

export const mensagensService = {
  async enviarMensagem(remetenteId: string, destinatarioId: string, texto: string) {
    try {
      const { data, error } = await supabase
        .from('msg_chat')
        .insert({
          remetente_id: remetenteId,
          destinatario_id: destinatarioId,
          texto,
          tipo: 'texto',
          lida_remetente: true,
          lida_destinatario: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { mensagem: data, error: null };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return { mensagem: null, error };
    }
  },

  async buscarMensagens(usuarioAtualId: string, outroUsuarioId: string) {
    try {
      // Primeiro verifica se o usuário está bloqueado
      const { bloqueado } = await bloqueiosService.verificarBloqueio(
        usuarioAtualId,
        outroUsuarioId
      );

      const { data, error } = await supabase
        .from('msg_chat')
        .select('*')
        .or(`and(remetente_id.eq.${usuarioAtualId},destinatario_id.eq.${outroUsuarioId}),and(remetente_id.eq.${outroUsuarioId},destinatario_id.eq.${usuarioAtualId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Se estiver bloqueado, filtra as mensagens
      const mensagensFiltradas = bloqueado 
        ? data.filter(msg => msg.remetente_id === usuarioAtualId)
        : data;

      return { mensagens: mensagensFiltradas as Mensagem[], error: null };
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return { mensagens: [], error };
    }
  },

  async marcarComoLida(conversaId: string, usuarioId: string) {
    try {
      const { error } = await supabase
        .from('msg_chat')
        .update({ lida_destinatario: true })
        .eq('destinatario_id', usuarioId)
        .eq('remetente_id', conversaId)
        .eq('lida_destinatario', false);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      return { error };
    }
  },

  async contarMensagensNaoLidas(usuarioId: string) {
    try {
      const { data, error } = await supabase
        .from('msg_chat')
        .select('remetente_id', { count: 'exact' })
        .eq('destinatario_id', usuarioId)
        .eq('lida_destinatario', false);

      if (error) throw error;
      return { quantidade: data.length, error: null };
    } catch (error) {
      console.error('Erro ao contar mensagens não lidas:', error);
      return { quantidade: 0, error };
    }
  },

  async editarMensagem(mensagemId: string, novoTexto: string) {
    try {
      const { data, error } = await supabase
        .from('msg_chat')
        .update({
          texto: novoTexto,
          editada: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', mensagemId)
        .select()
        .single();

      if (error) throw error;
      return { mensagem: data as Mensagem, error: null };
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      return { mensagem: null, error };
    }
  },

  async deletarMensagem(mensagemId: string) {
    try {
      // 1. Busca a mensagem para saber o tipo e URL do arquivo
      const { data: mensagem, error: fetchError } = await supabase
        .from('msg_chat')
        .select('*')
        .eq('id', mensagemId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Se for áudio, imagem, vídeo ou documento, deleta o arquivo do bucket correspondente
      if (mensagem.tipo === 'audio' || mensagem.tipo === 'imagem' || 
          mensagem.tipo === 'video' || mensagem.tipo === 'documento') {
        let url, bucket;
        
        switch (mensagem.tipo) {
          case 'audio':
            url = mensagem.audio_url;
            bucket = 'mensagens-audio';
            break;
          case 'imagem':
            url = mensagem.imagem_url;
            bucket = 'mensagens-imagens';
            break;
          case 'video':
            url = mensagem.video_url;
            bucket = 'mensagens-videos';
            break;
          case 'documento':
            url = mensagem.documento_url;
            bucket = 'mensagens-documentos';
            break;
        }
        
        // Extrai o nome do arquivo da URL do Supabase
        const fileName = url.split('/').slice(-1)[0];
        console.log('Tentando deletar arquivo:', fileName, 'do bucket:', bucket);
        
        if (fileName) {
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([fileName]);

          if (deleteError) {
            console.error(`Erro ao deletar arquivo do bucket ${bucket}:`, deleteError);
            console.error('Detalhes do erro:', deleteError);
          } else {
            console.log('Arquivo deletado com sucesso:', fileName);
          }
        }
      }

      // 3. Marca a mensagem como deletada no banco
      const { data, error } = await supabase
        .from('msg_chat')
        .update({
          deletada: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', mensagemId)
        .select()
        .single();

      if (error) throw error;
      return { mensagem: data as Mensagem, error: null };
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      return { mensagem: null, error };
    }
  },

  async enviarMensagemAudio(remetenteId: string, destinatarioId: string, audioBlob: Blob, duracao: string) {
    try {
      // 1. Fazer upload do arquivo de áudio para o bucket
      const audioFileName = `audio-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mensagens-audio')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // 2. Gerar URL pública do áudio
      const { data: { publicUrl } } = supabase.storage
        .from('mensagens-audio')
        .getPublicUrl(audioFileName);

      // 3. Salvar a mensagem no banco de dados
      const { data, error } = await supabase
        .from('msg_chat')
        .insert({
          remetente_id: remetenteId,
          destinatario_id: destinatarioId,
          texto: duracao, // Salvamos a duração no campo texto
          tipo: 'audio',
          audio_url: publicUrl,
          lida_remetente: true,
          lida_destinatario: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { mensagem: data, error: null };
    } catch (error) {
      console.error('Erro ao enviar mensagem de áudio:', error);
      return { mensagem: null, error };
    }
  },

  async enviarMensagemImagem(remetenteId: string, destinatarioId: string, arquivo: File) {
    try {
      console.log('Iniciando upload de imagem:', {
        remetenteId,
        destinatarioId,
        arquivo: {
          nome: arquivo.name,
          tipo: arquivo.type,
          tamanho: arquivo.size
        }
      });

      // 1. Fazer upload da imagem para o bucket
      const nomeArquivo = `imagem-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const extensao = arquivo.name.split('.').pop();
      const caminhoCompleto = `${nomeArquivo}.${extensao}`;

      console.log('Fazendo upload para:', caminhoCompleto);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mensagens-imagens')
        .upload(caminhoCompleto, arquivo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído:', uploadData);

      // 2. Gerar URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('mensagens-imagens')
        .getPublicUrl(caminhoCompleto);

      console.log('URL pública gerada:', publicUrl);

      // 3. Salvar a mensagem no banco de dados
      const { data, error } = await supabase
        .from('msg_chat')
        .insert({
          remetente_id: remetenteId,
          destinatario_id: destinatarioId,
          texto: arquivo.name,
          tipo: 'imagem',
          imagem_url: publicUrl,
          lida_remetente: true,
          lida_destinatario: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
        throw error;
      }

      console.log('Mensagem salva com sucesso:', data);
      return { mensagem: data, error: null };
    } catch (error) {
      console.error('Erro ao enviar mensagem com imagem:', error);
      return { mensagem: null, error };
    }
  },

  async enviarMensagemVideo(remetenteId: string, destinatarioId: string, arquivo: File) {
    try {
      console.log('Iniciando upload de vídeo:', {
        remetenteId,
        destinatarioId,
        arquivo: {
          nome: arquivo.name,
          tipo: arquivo.type,
          tamanho: arquivo.size
        }
      });

      // 1. Fazer upload do vídeo para o bucket
      const nomeArquivo = `video-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const extensao = arquivo.name.split('.').pop();
      const caminhoCompleto = `${nomeArquivo}.${extensao}`;

      console.log('Fazendo upload para:', caminhoCompleto);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mensagens-videos')
        .upload(caminhoCompleto, arquivo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído:', uploadData);

      // 2. Gerar URL pública do vídeo
      const { data: { publicUrl } } = supabase.storage
        .from('mensagens-videos')
        .getPublicUrl(caminhoCompleto);

      console.log('URL pública gerada:', publicUrl);

      // 3. Salvar a mensagem no banco de dados
      const { data, error } = await supabase
        .from('msg_chat')
        .insert({
          remetente_id: remetenteId,
          destinatario_id: destinatarioId,
          texto: arquivo.name,
          tipo: 'video',
          video_url: publicUrl,
          lida_remetente: true,
          lida_destinatario: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
        throw error;
      }

      console.log('Mensagem salva com sucesso:', data);
      return { mensagem: data, error: null };
    } catch (error) {
      console.error('Erro ao enviar mensagem com vídeo:', error);
      return { mensagem: null, error };
    }
  },

  async enviarMensagemDocumento(remetenteId: string, destinatarioId: string, arquivo: File) {
    try {
      console.log('Iniciando envio de documento:', {
        remetenteId,
        destinatarioId,
        arquivo: {
          nome: arquivo.name,
          tipo: arquivo.type,
          tamanho: arquivo.size
        }
      });

      // 1. Fazer upload do documento para o bucket
      const nomeArquivo = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const extensao = arquivo.name.split('.').pop();
      const caminhoCompleto = `${nomeArquivo}.${extensao}`;

      console.log('Fazendo upload para:', caminhoCompleto);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mensagens-documentos')
        .upload(caminhoCompleto, arquivo, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      console.log('Upload concluído:', uploadData);

      // 2. Gerar URL pública do documento
      const { data: { publicUrl } } = supabase.storage
        .from('mensagens-documentos')
        .getPublicUrl(caminhoCompleto);

      // Ajustar a URL para usar o caminho correto
      const urlCorrigida = publicUrl.replace('/v_mensagens-documentos/', '/mensagens-documentos/');

      console.log('URL pública gerada:', urlCorrigida);

      // 3. Salvar a mensagem no banco de dados
      const { data, error } = await supabase
        .from('msg_chat')
        .insert({
          remetente_id: remetenteId,
          destinatario_id: destinatarioId,
          texto: arquivo.name,
          tipo: 'documento',
          documento_url: urlCorrigida, // Usar a URL corrigida
          lida_remetente: true,
          lida_destinatario: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
        throw error;
      }

      console.log('Mensagem salva:', {
        tipo: 'documento',
        documento_url: urlCorrigida,
        texto: arquivo.name
      });

      return { mensagem: data, error: null };
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      return { mensagem: null, error };
    }
  }
}; 