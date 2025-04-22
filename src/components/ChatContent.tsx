import { useState, useRef, useEffect } from 'react';
import { MensagemBalao } from './MensagemBalao';
import { Avatar } from './Avatar';
import type { Conversa } from '../pages/Chat';
import Swal from 'sweetalert2';
import { mensagensService, type Mensagem } from '../services/mensagens';
import { authService } from '../services/auth';
import { supabase } from '../lib/supabase';
import { bloqueiosService } from '../services/bloqueios';
import { useAuth } from '../contexts/AuthContext';
import { eventosService } from '../services/eventos';
import { statusService } from '../services/status';
import { notificacoesService } from '../services/notificacoes';

interface ResultadoBusca {
  mensagemId: string;
  indices: [number, number][];
}

interface ChatContentProps {
  onVoltar?: () => void;
  conversaSelecionada: Conversa | null;
}

const debug = (message: string, ...args: any[]) => {
  import.meta.env.VITE_DEBUG === 'true' && console.log(message, ...args);
};

const debugError = (message: string, ...args: any[]) => {
  import.meta.env.VITE_DEBUG === 'true' && console.error(message, ...args);
};

export function ChatContent({ onVoltar, conversaSelecionada }: ChatContentProps) {
  if (!conversaSelecionada) return null;

  return <ChatContentInner onVoltar={onVoltar} conversa={conversaSelecionada} />;
}

function ChatContentInner({ onVoltar, conversa }: { onVoltar?: () => void, conversa: Conversa }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [usuarioAtual, setUsuarioAtual] = useState<string | null>(null);
  const [avatarUsuarioAtual, setAvatarUsuarioAtual] = useState<string | null>(null);
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<ResultadoBusca[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(-1);
  const mensagensContainerRef = useRef<HTMLDivElement>(null);
  const [usuarios, setUsuarios] = useState<Record<string, any>>({});
  const [estaBloqueado, setEstaBloqueado] = useState(false);
  const { usuarioAtual: authUsuarioAtual } = useAuth();
  const [contatoOnline, setContatoOnline] = useState(false);
  const [ultimoAcesso, setUltimoAcesso] = useState<string | null>(null);
  const [contatoAtivo, setContatoAtivo] = useState(false);

  // Carrega o usuário atual
  useEffect(() => {
    async function carregarUsuario() {
      const { user } = await authService.getCurrentUser();
      if (user) {
        setUsuarioAtual(user.id);
        setAvatarUsuarioAtual(user.avatar_url);
      }
    }
    carregarUsuario();
  }, []);

  // Carrega as mensagens quando a conversa é selecionada
  useEffect(() => {
    async function carregarMensagens() {
      if (!conversa || !usuarioAtual) return;

      const { mensagens, error } = await mensagensService.buscarMensagens(
        usuarioAtual,
        conversa.id
      );

      if (error) {
        debugError('Erro ao carregar mensagens:', error);
        return;
      }

      setMensagens(mensagens);
    }

    carregarMensagens();
  }, [conversa, usuarioAtual]);

  // Atualiza resultados da busca quando o termo muda
  useEffect(() => {
    if (!termoBusca.trim() || !conversa) {
      setResultadosBusca([]);
      setIndiceAtual(-1);
      return;
    }

    const termo = termoBusca.toLowerCase();
    const novosResultados: ResultadoBusca[] = [];

    mensagens.forEach((mensagem) => {
      const texto = mensagem.texto.toLowerCase();
      const indices: [number, number][] = [];
      let pos = 0;

      while (true) {
        const indice = texto.indexOf(termo, pos);
        if (indice === -1) break;
        indices.push([indice, indice + termo.length]);
        pos = indice + 1;
      }

      if (indices.length > 0) {
        novosResultados.push({
          mensagemId: mensagem.id,
          indices
        });
      }
    });

    setResultadosBusca(novosResultados);
    setIndiceAtual(novosResultados.length > 0 ? 0 : -1);
  }, [termoBusca, mensagens]);

  // Função para rolar até a mensagem destacada
  useEffect(() => {
    if (indiceAtual >= 0 && resultadosBusca.length > 0) {
      const mensagemId = resultadosBusca[indiceAtual].mensagemId;
      const elemento = document.getElementById(`mensagem-${mensagemId}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [indiceAtual, resultadosBusca]);

  // Busca os nomes dos usuários
  useEffect(() => {
    async function buscarNomesUsuarios() {
      if (mensagens.length === 0) return;

      const idsUnicos = [...new Set(mensagens.map(m => m.remetente_id))];
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, avatar_url')
        .in('id', idsUnicos);

      if (error) {
        console.error('Erro ao buscar nomes dos usuários:', error);
        return;
      }

      const nomesUsuarios = data.reduce((acc, user) => ({
        ...acc,
        [user.id]: user
      }), {});

      setUsuarios(nomesUsuarios);
    }

    buscarNomesUsuarios();
  }, [mensagens]);

  // Atualiza o useEffect do realtime para incluir UPDATE e DELETE
  useEffect(() => {
    if (!conversa || !usuarioAtual) return;

    const outroUsuarioId = conversa.id;

    const channel = supabase
      .channel(`chat-${outroUsuarioId}-${usuarioAtual}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'msg_chat'
        },
        async (payload) => {
          console.log('Evento recebido:', {
            tipo: payload.eventType,
            dados: payload.new || payload.old,
          });

          switch (payload.eventType) {
            case 'INSERT':
              const novaMensagem = payload.new as Mensagem;
              
              // Verifica se a mensagem pertence a esta conversa
              const pertenceAConversa = 
                (novaMensagem.remetente_id === usuarioAtual && novaMensagem.destinatario_id === outroUsuarioId) ||
                (novaMensagem.remetente_id === outroUsuarioId && novaMensagem.destinatario_id === usuarioAtual);

              console.log('Verificação de mensagem:', {
                pertenceAConversa,
                mensagem: novaMensagem
              });

              if (pertenceAConversa) {
                // Se a mensagem é para o usuário atual, marca como lida imediatamente
                if (novaMensagem.destinatario_id === usuarioAtual) {
                  await mensagensService.marcarComoLida(
                    outroUsuarioId,
                    usuarioAtual
                  );
                }

                // Atualiza a lista de mensagens
                setMensagens(prevMensagens => {
                  const mensagemJaExiste = prevMensagens.some(m => m.id === novaMensagem.id);
                  console.log('Atualizando mensagens:', {
                    mensagemJaExiste,
                    totalAntes: prevMensagens.length,
                    novaMensagem
                  });
                  
                  if (mensagemJaExiste) return prevMensagens;
                  return [...prevMensagens, novaMensagem];
                });

                // Rola para o final da conversa
                if (mensagensContainerRef.current) {
                  mensagensContainerRef.current.scrollTop = mensagensContainerRef.current.scrollHeight;
                }
              }
              break;

            case 'UPDATE':
              setMensagens(prevMensagens => 
                prevMensagens.map(msg => 
                  msg.id === payload.new.id 
                    ? { ...msg, ...payload.new }
                    : msg
                )
              );
              break;

            case 'DELETE':
              setMensagens(prevMensagens => 
                prevMensagens.filter(msg => msg.id !== payload.old.id)
              );
              break;
          }
        }
      );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversa, usuarioAtual]);

  // Marca mensagens como lidas quando a conversa é aberta ou quando chegam novas mensagens
  useEffect(() => {
    async function marcarMensagensComoLidas() {
      if (!conversa || !usuarioAtual) return;

      const mensagensNaoLidas = mensagens.filter(
        msg => msg.destinatario_id === usuarioAtual && !msg.lida_destinatario
      );

      if (mensagensNaoLidas.length > 0) {
        await mensagensService.marcarComoLida(
          conversa.id,
          usuarioAtual
        );
      }
    }

    marcarMensagensComoLidas();
  }, [conversa, usuarioAtual, mensagens]);

  // Rola para o final quando carrega mensagens iniciais
  useEffect(() => {
    if (mensagensContainerRef.current) {
      mensagensContainerRef.current.scrollTop = mensagensContainerRef.current.scrollHeight;
    }
  }, [mensagens]);

  useEffect(() => {
    let channel: any;

    async function verificarBloqueio() {
      if (authUsuarioAtual && conversa) {
        const { bloqueado } = await bloqueiosService.verificarBloqueio(
          authUsuarioAtual.id,
          conversa.id
        );
        setEstaBloqueado(bloqueado);
      }
    }

    async function inicializarEventos() {
      if (authUsuarioAtual && conversa) {
        channel = await eventosService.inscreverBloqueios(
          authUsuarioAtual.id,
          verificarBloqueio
        );
      }
    }

    verificarBloqueio();
    inicializarEventos();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversa, authUsuarioAtual]);

  // Efeito para verificar e inscrever no status do contato
  useEffect(() => {
    let channel: any;

    async function verificarStatus() {
      if (conversa) {
        debug('[ChatContent] Verificando status inicial do contato:', conversa.id);
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('online, last_seen')
          .eq('id', conversa.id)
          .single();

        if (usuario) {
          debug('[ChatContent] Status do contato:', usuario);
          setContatoOnline(usuario.online);
          setContatoAtivo(usuario.online);
          setUltimoAcesso(usuario.last_seen);
        }
      }
    }

    async function inicializarMonitoramento() {
      await verificarStatus();

      // Inscreve para mudanças de status do contato
      channel = await statusService.inscreverStatus(
        conversa.id,
        (online, lastSeen) => {
          console.log('[ChatContent] Atualização de status do contato:', { online, lastSeen });
          setContatoOnline(online);
          setContatoAtivo(online);
          if (!online) {
            setUltimoAcesso(lastSeen || new Date().toISOString());
          }
        }
      );
    }

    inicializarMonitoramento();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversa]);

  useEffect(() => {
    // Solicitar permissão para notificações assim que o componente montar
    notificacoesService.solicitarPermissao().then(permitido => {
      console.log('[ChatContent] Permissão para notificações:', permitido);
    });

    if (!conversa?.id || !usuarioAtual) return;

    const subscription = supabase
      .channel(`msg_chat:remetente_id=eq.${conversa.id},destinatario_id=eq.${usuarioAtual}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'msg_chat',
          filter: `remetente_id=eq.${conversa.id},destinatario_id=eq.${usuarioAtual}`
        },
        async (payload) => {
          const novaMensagem = payload.new as Mensagem;
          console.log('[ChatContent] Nova mensagem recebida:', novaMensagem);
          
          // Verificar se a janela está em foco
          const isWindowFocused = document.hasFocus();
          console.log('[ChatContent] Janela em foco:', isWindowFocused);
          
          // Se a janela não estiver em foco, mostrar notificação
          if (!isWindowFocused) {
            console.log('[ChatContent] Tentando mostrar notificação...');
            const notificacaoEnviada = await notificacoesService.notificarNovaMensagem(
              conversa.nome,
              novaMensagem.texto
            );
            console.log('[ChatContent] Notificação enviada:', notificacaoEnviada);
          }

          setMensagens(prev => [...prev, novaMensagem]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversa?.id, usuarioAtual]);

  const navegarResultado = (direcao: 'anterior' | 'proximo') => {
    if (resultadosBusca.length === 0) return;

    if (direcao === 'proximo') {
      setIndiceAtual(atual => 
        atual < resultadosBusca.length - 1 ? atual + 1 : 0
      );
    } else {
      setIndiceAtual(atual => 
        atual > 0 ? atual - 1 : resultadosBusca.length - 1
      );
    }
  };

  const handleEditarMensagem = async (id: string) => {
    const mensagem = mensagens.find(m => m.id === id);
    if (!mensagem) return;

    // Verifica se a mensagem pertence ao usuário atual
    if (mensagem.remetente_id !== usuarioAtual) {
      await Swal.fire({
        icon: 'error',
        title: 'Não permitido',
        text: 'Você só pode editar suas próprias mensagens',
        confirmButtonColor: '#00a884'
      });
      return;
    }

    const { value: novoTexto } = await Swal.fire({
      title: 'Editar mensagem',
      input: 'text',
      inputValue: mensagem.texto,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00a884',
      inputValidator: (value) => {
        if (!value.trim()) {
          return 'A mensagem não pode estar vazia';
        }
        return null;
      }
    });

    if (novoTexto && novoTexto !== mensagem.texto) {
      const { error } = await mensagensService.editarMensagem(id, novoTexto.trim());
      
      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível editar a mensagem',
          confirmButtonColor: '#00a884'
        });
      }
    }
  };

  const handleDeletarMensagem = async (id: string) => {
    const mensagem = mensagens.find(m => m.id === id);
    if (!mensagem) return;

    // Verifica se a mensagem pertence ao usuário atual
    if (mensagem.remetente_id !== usuarioAtual) {
      await Swal.fire({
        icon: 'error',
        title: 'Não permitido',
        text: 'Você só pode deletar suas próprias mensagens',
        confirmButtonColor: '#00a884'
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Deletar mensagem?',
      text: 'Esta ação não pode ser desfeita',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, deletar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (isConfirmed) {
      const { error } = await mensagensService.deletarMensagem(id);
      
      if (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível deletar a mensagem',
          confirmButtonColor: '#00a884'
        });
      }
    }
  };

  const handleBloquearContato = async () => {
    if (!usuarioAtual || !conversa) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível bloquear o contato. Tente novamente mais tarde.',
        confirmButtonColor: '#00a884'
      });
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: `Bloquear ${conversa.nome}?`,
      text: 'Você não receberá mais mensagens deste contato',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, bloquear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (isConfirmed) {
      try {
        const { error } = await bloqueiosService.bloquearUsuario(
          usuarioAtual,
          conversa.id
        );

        if (error) {
          console.error('Erro ao bloquear usuário:', error);
          await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível bloquear o contato. Tente novamente mais tarde.',
            confirmButtonColor: '#00a884'
          });
          return;
        }

        // Atualiza o estado local e emite evento
        setEstaBloqueado(true);
        setMostrarOpcoes(false);
        eventosService.emitirEventoBloqueio(usuarioAtual, conversa.id);

        await Swal.fire({
          icon: 'success',
          title: 'Contato bloqueado',
          text: 'Você não receberá mais mensagens deste contato',
          confirmButtonColor: '#00a884'
        });
      } catch (error) {
        console.error('Erro ao bloquear usuário:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível bloquear o contato. Tente novamente mais tarde.',
          confirmButtonColor: '#00a884'
        });
      }
    }
  };

  const handleDesbloquear = async () => {
    if (!usuarioAtual || !conversa) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível desbloquear o contato. Tente novamente mais tarde.',
        confirmButtonColor: '#00a884'
      });
      return;
    }

    try {
      const { sucesso, error } = await bloqueiosService.desbloquearUsuario(
        usuarioAtual,
        conversa.id
      );

      if (error) {
        debugError('Erro ao desbloquear usuário:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível desbloquear o contato. Tente novamente mais tarde.',
          confirmButtonColor: '#00a884'
        });
        return;
      }

      if (sucesso) {
        setEstaBloqueado(false);
        // Emite evento de desbloqueio para atualizar a lista
        eventosService.emitirEventoDesbloqueio(usuarioAtual, conversa.id);
        
        await Swal.fire({
          icon: 'success',
          title: 'Contato desbloqueado',
          text: 'Você voltará a receber mensagens deste contato',
          confirmButtonColor: '#00a884'
        });
      }
    } catch (error) {
      debugError('Erro ao desbloquear usuário:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível desbloquear o contato. Tente novamente mais tarde.',
        confirmButtonColor: '#00a884'
      });
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Cabeçalho fixo */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200 shrink-0 relative z-10">
        {/* Botão Voltar - Visível apenas em mobile */}
        <button
          className="md:hidden p-2 hover:bg-gray-100 rounded-full"
          onClick={onVoltar}
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Avatar e Nome */}
        <div className="flex items-center gap-3 flex-1">
          <Avatar nome={conversa.nome} url={conversa.avatar} tamanho={40} />
          <div>
            <h2 className="font-semibold text-gray-900">
              {conversa.nome}
            </h2>
            <p className="text-sm flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${contatoAtivo ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className={`${contatoAtivo ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                {contatoAtivo ? (
                  'online'
                ) : contatoOnline ? (
                  'ausente'
                ) : ultimoAcesso ? (
                  `visto por último ${formatarUltimoAcesso(ultimoAcesso)}`
                ) : (
                  'offline'
                )}
              </span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de Busca */}
          <button
            onClick={() => setMostrarBusca(!mostrarBusca)}
            className={`p-2 rounded-full transition-colors ${
              mostrarBusca ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Botão de Opções */}
          <div className="relative">
            <button 
              onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
              className="text-gray-500 hover:text-gray-700 cursor-pointer p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown de Opções */}
            {mostrarOpcoes && (
              <div className="absolute z-50 right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <button 
                  onClick={handleBloquearContato}
                  className="w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Bloquear contato
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área de busca (quando visível) */}
      {mostrarBusca && (
        <div className="bg-white border-b border-gray-200 px-4 py-[0.77rem] shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar na conversa"
              className="w-full bg-[#f5f6f6] rounded-lg px-3 py-1.5 text-sm focus:outline-none border border-gray-200"
              autoFocus
            />
            <div className="flex gap-1 text-sm text-gray-500">
              <button 
                onClick={() => navegarResultado('anterior')}
                disabled={resultadosBusca.length === 0}
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                ↑
              </button>
              <button 
                onClick={() => navegarResultado('proximo')}
                disabled={resultadosBusca.length === 0}
                className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
              >
                ↓
              </button>
              <span className="py-1">
                {resultadosBusca.length > 0 ? `${indiceAtual + 1}/${resultadosBusca.length}` : '0/0'}
              </span>
            </div>
            <button 
              onClick={() => setMostrarBusca(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Área de mensagens com rolagem */}
      <div 
        ref={mensagensContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 min-h-0 bg-[#f5f6f6]"
      >
        {estaBloqueado ? (
          <div className="flex flex-col items-center justify-center h-full bg-white/80 rounded-lg p-8">
            <div className="text-6xl mb-4">🚫</div>
            <p className="text-lg text-gray-600 text-center mb-6">
              Este usuário está bloqueado. Você não receberá mensagens dele.
            </p>
            <button
              onClick={handleDesbloquear}
              className="px-6 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Desbloquear Usuário
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {mensagens.map((mensagem, index) => {
              debug('Mensagem recebida:', {
                id: mensagem.id,
                tipo: mensagem.tipo,
                documento_url: mensagem.documento_url,
                texto: mensagem.texto
              });

              return (
                <MensagemBalao
                  key={mensagem.id}
                  id={mensagem.id}
                  texto={mensagem.texto}
                  created_at={mensagem.created_at}
                  horario={new Date(mensagem.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  remetente={mensagem.remetente_id}
                  tipo={mensagem.tipo}
                  isUser={mensagem.remetente_id === usuarioAtual}
                  audio_url={mensagem.audio_url}
                  imagem_url={mensagem.imagem_url}
                  video_url={mensagem.video_url}
                  documento_url={mensagem.documento_url}
                  nomeRemetente={usuarios[mensagem.remetente_id]?.nome || conversa.nome || ''}
                  avatarUrl={mensagem.remetente_id === usuarioAtual 
                    ? avatarUsuarioAtual 
                    : usuarios[mensagem.remetente_id]?.avatar_url || conversa.avatar
                  }
                  onEditar={handleEditarMensagem}
                  onDeletar={handleDeletarMensagem}
                  termoBusca={termoBusca}
                  destacar={resultadosBusca.some(r => 
                    r.mensagemId === mensagem.id && 
                    (indiceAtual === -1 || resultadosBusca[indiceAtual].mensagemId === mensagem.id)
                  )}
                  indices={resultadosBusca.find(r => r.mensagemId === mensagem.id)?.indices}
                  updated_at={mensagem.updated_at}
                  editada={mensagem.editada}
                  deletada={mensagem.deletada}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Função auxiliar para formatar o último acesso
function formatarUltimoAcesso(data: string): string {
  const agora = new Date();
  const ultimoAcesso = new Date(data);
  const diffMinutos = Math.floor((agora.getTime() - ultimoAcesso.getTime()) / (1000 * 60));
  
  if (diffMinutos < 1) return 'agora';
  if (diffMinutos < 60) return `há ${diffMinutos} min`;
  
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  
  if (ultimoAcesso.toDateString() === agora.toDateString()) {
    return `hoje às ${ultimoAcesso.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const ontem = new Date(agora);
  ontem.setDate(ontem.getDate() - 1);
  if (ultimoAcesso.toDateString() === ontem.toDateString()) {
    return `ontem às ${ultimoAcesso.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return ultimoAcesso.toLocaleDateString('pt-BR', { 
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
} 