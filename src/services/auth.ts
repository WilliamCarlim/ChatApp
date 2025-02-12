import { supabase } from '../lib/supabase';
import type { Usuario } from '../lib/supabase';
import { statusService } from './status';

export interface SignUpData {
  email: string;
  password: string;
  nome: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp({ email, password, nome }: SignUpData) {
    try {
      // Verificar se o email já existe na tabela usuarios
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Este email já está cadastrado. Por favor, faça login ou use outro email.');
      }

      // Primeiro registrar o usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome,
          }
        }
      });

      if (authError) {
        // Se o erro for de email duplicado na autenticação
        if (authError.message?.includes('duplicate')) {
          throw new Error('Este email já está cadastrado. Por favor, faça login ou use outro email.');
        }
        throw authError;
      }

      if (authData.user) {
        // Depois criar o registro na tabela de usuários
        const { data: userData, error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: authData.user.id,
            email,
            nome,
            status: 'offline',
            configuracoes: {
              notificacoes: true,
              tema: 'light',
              idioma: 'pt-BR'
            }
          })
          .select()
          .single();

        if (profileError) {
          // Se houver erro ao criar o perfil, remover o usuário da autenticação
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw profileError;
        }
      }

      return { user: authData.user, error: null };
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      return { 
        user: null, 
        error: new Error(error.message || 'Erro ao criar perfil do usuário. Por favor, tente novamente.')
      };
    }
  },

  async signIn({ email, password }: SignInData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message?.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos.');
        }
        throw authError;
      }

      if (authData.user) {
        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (userError) throw userError;

        // Se não encontrou o usuário na tabela, criar um registro básico
        if (!userData) {
          const { data: newUserData, error: createError } = await supabase
            .from('usuarios')
            .insert({
              id: authData.user.id,
              email: authData.user.email || email,
              nome: authData.user.user_metadata.nome || email.split('@')[0],
              status: 'online',
              configuracoes: {
                notificacoes: true,
                tema: 'light',
                idioma: 'pt-BR'
              }
            })
            .select()
            .single();

          if (createError) throw createError;
        } else {
          // Atualizar status e último acesso
          const { error: updateError } = await supabase
            .from('usuarios')
            .update({
              status: 'online',
              ultimo_acesso: new Date().toISOString(),
            })
            .eq('id', authData.user.id);

          if (updateError) throw updateError;
        }
      }

      return { user: authData.user, error: null };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { 
        user: null, 
        error: new Error(error.message || 'Erro ao fazer login. Por favor, tente novamente.')
      };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Usar maybeSingle ao invés de single

        if (userError) throw userError;

        // Se não encontrou o usuário na tabela, criar um registro básico
        if (!userData) {
          const { data: newUserData, error: createError } = await supabase
            .from('usuarios')
            .insert({
              id: user.id,
              email: user.email,
              nome: user.user_metadata.nome || user.email?.split('@')[0] || 'Usuário',
              status: 'online',
              configuracoes: {
                notificacoes: true,
                tema: 'light',
                idioma: 'pt-BR'
              }
            })
            .select()
            .single();

          if (createError) throw createError;
          return { user: newUserData as Usuario, error: null };
        }

        return { user: userData as Usuario, error: null };
      }

      return { user: null, error: null };
    } catch (error) {
      console.error('Erro ao obter usuário:', error);
      return { user: null, error };
    }
  },

  async signOut() {
    try {
      // Pega o ID do usuário antes de fazer logout
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id) {
        // Atualiza status para offline
        await statusService.atualizarStatus(user.id, false);
      }

      // Faz o logout
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { error };
    }
  },

  async updateAvatar(userId: string, file: File) {
    try {
      // Validar o tipo do arquivo
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        throw new Error('Apenas imagens JPG e PNG são permitidas.');
      }

      // Validar o tamanho do arquivo (1MB = 1024 * 1024 bytes)
      if (file.size > 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 1MB.');
      }

      // Primeiro, deletar avatar antigo se existir
      const { data: oldUser } = await supabase
        .from('usuarios')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (oldUser?.avatar_url) {
        try {
          // Extrair o caminho do arquivo da URL
          const urlParts = oldUser.avatar_url.split('/avatars/');
          if (urlParts.length > 1) {
            const oldFilePath = `avatars/${urlParts[1]}`;
            console.log('Deletando arquivo antigo:', oldFilePath);
            
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);

            if (deleteError) {
              console.error('Erro ao deletar arquivo antigo:', deleteError);
            }
          }
        } catch (deleteError) {
          console.error('Erro ao tentar deletar arquivo antigo:', deleteError);
          // Continua com o upload mesmo se falhar ao deletar o arquivo antigo
        }
      }

      // Gerar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${userId}/${fileName}`;

      // Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Gerar URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar a URL do avatar no perfil do usuário
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return { publicUrl, error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar avatar:', error);
      return { publicUrl: null, error };
    }
  },

  async updateUserName(userId: string, newName: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ nome: newName })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { user: data as Usuario, error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      return { 
        user: null, 
        error: new Error(error.message || 'Erro ao atualizar nome. Por favor, tente novamente.')
      };
    }
  },
}; 