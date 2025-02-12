import { useState, useEffect } from 'react';
import { ConversaItem } from './ConversaItem';
import { InfoUsuario } from './InfoUsuario';
import { authService } from '../services/auth';
import { conversasService } from '../services/conversas';
import type { Usuario } from '../lib/supabase';
import type { Conversa } from '../pages/Chat';
import { ModalBuscaUsuarios } from './ModalBuscaUsuarios';
import { mensagensService } from '../services/mensagens';
import { supabase } from '../lib/supabase';
import { eventosService } from '../services/eventos';
import { useAuth } from '../contexts/AuthContext';

interface ListaConversasProps {
  onConversaSelect: (conversa: Conversa) => void;
}

export function ListaConversas({ onConversaSelect }: ListaConversasProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const { usuarioAtual } = useAuth();

  useEffect(() => {
    let channelMensagens: any;
    let channelAtualizacoes: any;
    let channelMensagensEnviadas: any;
    let channelMensagensDeletadas: any;
    let channelMensagensEditadas: any;
    let channel: any;

    async function inicializarConversas() {
      const { user } = await authService.getCurrentUser();
      if (!user) return;

      setUsuario(user);

      // Carrega conversas iniciais
      const { conversas } = await conversasService.buscarConversas(user.id);
      setConversas(conversas);

      // Inscreve para novas mensagens
      channelMensagens = await conversasService.inscreverNovasConversas(
        user.id,
        (novaConversa) => {
          setConversas(prevConversas => {
            const conversaExistente = prevConversas.find(c => c.id === novaConversa.id);
            
            // Remove a conversa existente (se houver)
            const conversasAtualizadas = prevConversas.filter(c => c.id !== novaConversa.id);
            
            // Cria a conversa atualizada
            const conversaAtualizada = conversaExistente 
              ? {
                  ...conversaExistente,
                  ultimaMensagem: novaConversa.deletada 
                    ? (novaConversa.remetente_id === user.id ? 'Você apagou uma mensagem' : 'Uma mensagem foi apagada')
                    : novaConversa.ultimaMensagem,
                  horario: novaConversa.horario,
                  naoLidas: (conversaExistente.naoLidas || 0) + 1
                }
              : novaConversa;

            // Adiciona a conversa atualizada no início do array
            return [conversaAtualizada, ...conversasAtualizadas];
          });
        }
      );

      // Inscreve para mensagens enviadas pelo próprio usuário
      channelMensagensEnviadas = supabase
        .channel(`mensagens-enviadas-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'msg_chat',
            filter: `remetente_id=eq.${user.id}`
          },
          (payload) => {
            const novaMensagem = payload.new;
            
            setConversas(prevConversas => {
              const conversaExistente = prevConversas.find(c => c.id === novaMensagem.destinatario_id);
              if (!conversaExistente) return prevConversas;

              // Remove a conversa existente
              const conversasAtualizadas = prevConversas.filter(c => c.id !== novaMensagem.destinatario_id);

              // Cria a conversa atualizada
              const conversaAtualizada = {
                ...conversaExistente,
                ultimaMensagem: `Você: ${novaMensagem.texto}`,
                horario: new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              };

              // Adiciona a conversa atualizada no início
              return [conversaAtualizada, ...conversasAtualizadas];
            });
          }
        )
        .subscribe();

      // Inscreve para atualizações de mensagens
      channelAtualizacoes = await conversasService.inscreverAtualizacoesMensagens(
        user.id,
        (mensagemAtualizada) => {
          setConversas(prevConversas => 
            prevConversas.map(conversa => {
              if (conversa.id === mensagemAtualizada.remetente_id) {
                // Se todas as mensagens dessa conversa foram lidas, zera o contador
                return {
                  ...conversa,
                  naoLidas: 0
                };
              }
              return conversa;
            })
          );
        }
      );

      // Inscreve para mensagens deletadas
      channelMensagensDeletadas = supabase
        .channel(`mensagens-deletadas-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'msg_chat',
            filter: `deletada=eq.true`
          },
          async (payload) => {
            const mensagemDeletada = payload.new;
            
            // Verifica se a mensagem deletada pertence a alguma conversa do usuário
            if (mensagemDeletada.remetente_id !== user.id && mensagemDeletada.destinatario_id !== user.id) {
              return;
            }

            const outroUsuarioId = mensagemDeletada.remetente_id === user.id 
              ? mensagemDeletada.destinatario_id 
              : mensagemDeletada.remetente_id;

            setConversas(prevConversas => {
              return prevConversas.map(conversa => {
                if (conversa.id === outroUsuarioId) {
                  return {
                    ...conversa,
                    ultimaMensagem: mensagemDeletada.remetente_id === user.id 
                      ? 'Você apagou uma mensagem'
                      : 'Uma mensagem foi apagada',
                    horario: new Date(mensagemDeletada.updated_at || mensagemDeletada.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  };
                }
                return conversa;
              });
            });
          }
        )
        .subscribe();

      // Inscreve para mensagens editadas
      channelMensagensEditadas = supabase
        .channel(`mensagens-editadas-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'msg_chat',
            filter: `editada=eq.true`
          },
          async (payload) => {
            const mensagemEditada = payload.new;
            
            // Verifica se a mensagem editada pertence a alguma conversa do usuário
            if (mensagemEditada.remetente_id !== user.id && mensagemEditada.destinatario_id !== user.id) {
              return;
            }

            const outroUsuarioId = mensagemEditada.remetente_id === user.id 
              ? mensagemEditada.destinatario_id 
              : mensagemEditada.remetente_id;

            setConversas(prevConversas => {
              return prevConversas.map(conversa => {
                if (conversa.id === outroUsuarioId) {
                  return {
                    ...conversa,
                    ultimaMensagem: mensagemEditada.remetente_id === user.id 
                      ? `Você: ${mensagemEditada.texto} (editada)`
                      : `${mensagemEditada.texto} (editada)`,
                    horario: new Date(mensagemEditada.updated_at || mensagemEditada.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  };
                }
                return conversa;
              });
            });
          }
        )
        .subscribe();

      // Inscreve para mudanças em bloqueios
      channel = await eventosService.inscreverBloqueios(
        user.id,
        async () => {
          // Recarrega todas as conversas quando houver mudança em bloqueios
          const { conversas } = await conversasService.listarConversas(user.id);
          setConversas(conversas);
        }
      );
    }

    inicializarConversas();

    return () => {
      channelMensagens?.unsubscribe();
      channelAtualizacoes?.unsubscribe();
      channelMensagensEnviadas?.unsubscribe();
      channelMensagensDeletadas?.unsubscribe();
      channelMensagensEditadas?.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [usuarioAtual]);

  // Filtra conversas baseado no termo de busca
  const conversasFiltradas = conversas.filter(conversa =>
    conversa.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    conversa.ultimaMensagem.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    if (usuario) {
      setUsuario({ ...usuario, avatar_url: newAvatarUrl });
    }
  };

  const handleNameUpdate = (newName: string) => {
    if (usuario) {
      setUsuario({ ...usuario, nome: newName });
    }
  };

  const handleSelectUsuario = async (usuarioSelecionado: Usuario) => {
    if (!usuario) {
      console.error('Erro: Usuário remetente não encontrado');
      return;
    }

    // Verifica se já existe uma conversa com este usuário
    const conversaExistente = conversas.find(c => c.id === usuarioSelecionado.id);
    
    if (conversaExistente) {
      // Se já existe, apenas seleciona a conversa existente
      onConversaSelect(conversaExistente);
      setModalAberto(false);
      return;
    }

    // Se não existe, cria uma nova conversa
    const { mensagem, error } = await mensagensService.enviarMensagem(
      usuario.id,
      usuarioSelecionado.id,
      'Oi'
    );

    if (error) {
      console.error('Erro ao enviar mensagem inicial:', error);
      return;
    }

    // Cria a nova conversa com os dados atualizados
    const novaConversa: Conversa = {
      id: usuarioSelecionado.id,
      nome: usuarioSelecionado.nome,
      ultimaMensagem: "Você: Oi",
      horario: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      avatar: usuarioSelecionado.avatar_url || '',
      naoLidas: 0
    };
    
    // Atualiza o estado local das conversas
    setConversas(prevConversas => [novaConversa, ...prevConversas]);
    
    // Seleciona a nova conversa
    onConversaSelect(novaConversa);
    setModalAberto(false);
  };

  return (
    <div className="h-screen flex flex-col bg-white border-r border-gray-200 w-full">
      {/* Cabeçalho */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          {/* Informações do usuário */}
          <div className="flex-1 min-w-0">
            {usuario && (
              <InfoUsuario
                nome={usuario.nome}
                email={usuario.email}
                avatar={usuario.avatar_url}
                userId={usuario.id}
                onAvatarUpdate={handleAvatarUpdate}
                onNameUpdate={handleNameUpdate}
              />
            )}
          </div>
          
          {/* Botão de nova conversa com tooltip */}
          <div className="flex-shrink-0 relative group">
            <button 
              className="text-gray-500 hover:text-gray-700 p-2 cursor-pointer"
              onClick={() => setModalAberto(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* Tooltip */}
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
              Nova Conversa
            </div>
          </div>
        </div>

        {/* Campo de busca */}
        <div className="bg-[#f5f6f6] rounded-lg p-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar"
              className="bg-transparent w-full focus:outline-none text-sm"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

     

      {/* Lista de Conversas */}
      <div className="flex-1 overflow-y-auto">
        {conversasFiltradas.length > 0 ? (
          conversasFiltradas.map((conversa) => (            
            <div key={conversa.id} onClick={() => onConversaSelect(conversa)}>
              <ConversaItem
                id={conversa.id}
                nome={conversa.nome}
                ultimaMensagem={conversa.ultimaMensagem}
                horario={conversa.horario}
                avatar={conversa.avatar}
                naoLidas={conversa.naoLidas}
                pinned={conversa.pinned}
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center p-6 text-center text-gray-500">
            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm mb-2">Nenhuma conversa iniciada</p>
            <p className="text-xs">
              Clique no botão <span className="inline-block px-1">+</span> acima para começar uma nova conversa
            </p>
          </div>
        )}
      </div>

      <ModalBuscaUsuarios
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        usuarioAtual={usuario}
        onSelectUsuario={handleSelectUsuario}
      />
    </div>
  );
} 