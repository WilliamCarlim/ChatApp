import { ListaConversas } from '../components/ListaConversas';
import { ChatContent } from '../components/ChatContent';
import { ChatInput } from '../components/ChatInput';
import { useState, useEffect } from 'react';
import { mensagensService } from '../services/mensagens';
import { authService } from '../services/auth';

export interface Conversa {
  id: string;
  nome: string;
  ultimaMensagem: string;
  horario: string;
  avatar: string;
  online?: boolean;
  naoLidas?: number;
  pinned?: boolean;
  deletada?: boolean;
  remetente_id?: string;
}

export function Chat() {
  const [mostrarLista, setMostrarLista] = useState(true);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<string | null>(null);

  useEffect(() => {
    async function carregarUsuario() {
      const { user } = await authService.getCurrentUser();
      if (user) {
        setUsuarioAtual(user.id);
      }
    }
    carregarUsuario();
  }, []);

  const handleEnviarMensagem = async (texto: string) => {
    if (!usuarioAtual || !conversaSelecionada) return;

    const { error } = await mensagensService.enviarMensagem(
      usuarioAtual,
      conversaSelecionada.id,
      texto
    );

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleEnviarAudio = async (audioBlob: Blob, duracao: string) => {
    if (!usuarioAtual || !conversaSelecionada) return;

    const { error } = await mensagensService.enviarMensagemAudio(
      usuarioAtual,
      conversaSelecionada.id,
      audioBlob,
      duracao
    );

    if (error) {
      console.error('Erro ao enviar áudio:', error);
    }
  };

  const handleEnviarImagem = async (arquivo: File) => {
    if (!usuarioAtual || !conversaSelecionada) return;

    const { error } = await mensagensService.enviarMensagemImagem(
      usuarioAtual,
      conversaSelecionada.id,
      arquivo
    );

    if (error) {
      console.error('Erro ao enviar imagem:', error);
    }
  };

  const handleEnviarVideo = async (arquivo: File) => {
    if (!usuarioAtual || !conversaSelecionada) {
      console.log('Usuário ou conversa não selecionada:', { usuarioAtual, conversaSelecionada });
      return;
    }

    console.log('Iniciando envio de vídeo:', {
      usuarioId: usuarioAtual,
      conversaId: conversaSelecionada.id,
      arquivo: {
        nome: arquivo.name,
        tipo: arquivo.type,
        tamanho: arquivo.size
      }
    });

    const { error } = await mensagensService.enviarMensagemVideo(
      usuarioAtual,
      conversaSelecionada.id,
      arquivo
    );

    if (error) {
      console.error('Erro ao enviar vídeo:', error);
    } else {
      console.log('Vídeo enviado com sucesso');
    }
  };

  const handleEnviarDocumento = async (arquivo: File) => {
    if (!usuarioAtual || !conversaSelecionada) return;

    const { error } = await mensagensService.enviarMensagemDocumento(
      usuarioAtual,
      conversaSelecionada.id,
      arquivo
    );

    if (error) {
      console.error('Erro ao enviar documento:', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Lista de Conversas */}
      <div className={`
        ${mostrarLista ? 'flex' : 'hidden'}
        md:flex
        w-full md:w-[380px] flex-shrink-0
        absolute md:relative
        z-10 md:z-0
        bg-white
      `}>
        <ListaConversas 
          onConversaSelect={(conversa) => {
            setConversaSelecionada(conversa);
            setMostrarLista(false);
          }} 
        />
      </div>

      {/* Área do Chat */}
      <div className={`
        ${!mostrarLista ? 'flex' : 'hidden'}
        md:flex flex-col
        flex-1
        absolute md:relative
        inset-0 md:inset-auto
      `}>
        {conversaSelecionada ? (
          <>
            <ChatContent 
              onVoltar={() => setMostrarLista(true)}
              conversaSelecionada={conversaSelecionada}
            />
            <ChatInput 
              onEnviarMensagem={handleEnviarMensagem} 
              onEnviarAudio={handleEnviarAudio}
              onEnviarImagem={handleEnviarImagem}
              onEnviarVideo={handleEnviarVideo}
              onEnviarDocumento={handleEnviarDocumento}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f7f4] p-8">
            <div className="text-center max-w-md">
              {/* Logo com letra C */}
              <div className="w-32 h-32 mx-auto mb-6 bg-[#00a884] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-7xl font-bold text-white">C</span>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Bem-vindo ao ChatApp
              </h1>
              <p className="text-gray-600 mb-6">
                Selecione uma conversa para começar a trocar mensagens ou inicie uma nova conversa clicando no botão + no menu lateral.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Criptografia ponta a ponta</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 