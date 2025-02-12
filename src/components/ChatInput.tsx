import { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import RecordRTC, { RecordRTCPromisesHandler } from 'recordrtc';
import { Toast } from './Toast';

interface Emoji {
  id: string;
  native: string;
  unified: string;
}

interface ChatInputProps {
  onEnviarMensagem: (texto: string) => void;
  onEnviarAudio: (audioBlob: Blob, duracao: string) => Promise<void>;
  onEnviarImagem: (arquivo: File) => Promise<void>;
  onEnviarVideo: (arquivo: File) => Promise<void>;
  onEnviarDocumento: (arquivo: File) => Promise<void>;
}

// Converte MB para bytes
const MB_TO_BYTES = 1024 * 1024;

// Tamanhos máximos das mídias
const tamanhoMaximo = (import.meta.env.VITE_MAX_IMAGE_SIZE || 1) * MB_TO_BYTES;
const tamanhoMaximoVideo = (import.meta.env.VITE_MAX_VIDEO_SIZE || 2) * MB_TO_BYTES;
const tamanhoMaximoDocumento = (import.meta.env.VITE_MAX_DOCUMENT_SIZE || 2) * MB_TO_BYTES;

// Tipos permitidos permanecem os mesmos
const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const tiposPermitidosVideo = ['video/mp4', 'video/webm'];
const tiposPermitidosDocumento = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/octet-stream',
  'text/plain'
];

export function ChatInput({ onEnviarMensagem, onEnviarAudio, onEnviarImagem, onEnviarVideo, onEnviarDocumento }: ChatInputProps) {
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [gravando, setGravando] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputImagemRef = useRef<HTMLInputElement>(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [toast, setToast] = useState<{
    mensagem: string;
    tipo: 'sucesso' | 'erro' | 'aviso';
  } | null>(null);
  const [enviandoVideo, setEnviandoVideo] = useState(false);
  const inputVideoRef = useRef<HTMLInputElement>(null);
  const [enviandoDocumento, setEnviandoDocumento] = useState(false);
  const inputDocumentoRef = useRef<HTMLInputElement>(null);

  // Fecha os dropdowns quando clicar fora
  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMostrarDropdown(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setMostrarEmojiPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Limpa o timer e recorder quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recorderRef.current) {
        const stream = (recorderRef.current as any).stream as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
            stream.removeTrack(track);
          });
        }
        recorderRef.current = null;
      }
    };
  }, []);

  const handleEmojiSelect = (emoji: Emoji) => {
    setMensagem(mensagem + emoji.native);
    setMostrarEmojiPicker(false);
  };

  const handleEnviarMensagem = () => {
    if (mensagem.trim()) {
      onEnviarMensagem(mensagem);
      setMensagem('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleEnviarMensagem();
    }
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new RecordRTCPromisesHandler(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });

      await recorder.startRecording();
      recorderRef.current = recorder;
      setGravando(true);
      setTempoGravacao(0);

      // Inicia o timer
      timerRef.current = setInterval(() => {
        setTempoGravacao(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Não foi possível acessar o microfone');
    }
  };

  const pararGravacao = async () => {
    if (!recorderRef.current) return;

    try {
      await recorderRef.current.stopRecording();
      const blob = await recorderRef.current.getBlob();
      const duracao = formatarTempoGravacao();
      
      // Limpa a gravação antes de enviar o áudio
      if (recorderRef.current) {
        const stream = (recorderRef.current as any).stream as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
            stream.removeTrack(track);
          });
        }
        recorderRef.current = null;
      }

      // Limpa o timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Reseta os estados de gravação
      setGravando(false);
      setTempoGravacao(0);

      // Envia o áudio
      await onEnviarAudio(blob, duracao);
      
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      
      // Garante que os estados sejam resetados mesmo em caso de erro
      setGravando(false);
      setTempoGravacao(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelarGravacao = () => {
    if (!recorderRef.current) return;

    // Para o timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Para a gravação
    recorderRef.current.stopRecording();

    // Para todas as tracks de áudio e libera a stream
    const stream = (recorderRef.current as any).stream as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        stream.removeTrack(track);
      });
    }

    // Limpa a referência do recorder
    recorderRef.current = null;

    // Reseta os estados
    setGravando(false);
    setTempoGravacao(0);
  };

  const formatarTempoGravacao = () => {
    const minutos = Math.floor(tempoGravacao / 60);
    const segundos = tempoGravacao % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  const handleSelecionarImagem = () => {
    inputImagemRef.current?.click();
    setMostrarDropdown(false);
  };

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'erro' | 'aviso') => {
    setToast({ mensagem, tipo });
  };

  const handleImagemSelecionada = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Iniciando seleção de imagem');
    const arquivo = event.target.files?.[0];
    
    if (!arquivo) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    console.log('Arquivo selecionado:', {
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size
    });

    // Validar tipo do arquivo
    if (!tiposPermitidos.includes(arquivo.type)) {
      console.log('Tipo de arquivo não permitido:', arquivo.type);
      mostrarToast('Tipo de arquivo não permitido. Use apenas jpg, jpeg, png, gif ou webp.', 'erro');
      event.target.value = '';
      return;
    }

    // Validar tamanho
    if (arquivo.size > tamanhoMaximo) {
      console.log('Arquivo muito grande:', arquivo.size);
      mostrarToast('A imagem deve ter no máximo 1MB', 'aviso');
      event.target.value = '';
      return;
    }

    try {
      setEnviandoImagem(true);
      console.log('Iniciando envio da imagem');
      await onEnviarImagem(arquivo);
      console.log('Imagem enviada com sucesso');
      mostrarToast('Imagem enviada com sucesso!', 'sucesso');
      event.target.value = '';
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      mostrarToast('Erro ao enviar imagem. Tente novamente.', 'erro');
    } finally {
      setEnviandoImagem(false);
    }
  };

  const handleSelecionarVideo = () => {
    console.log('Abrindo seletor de vídeo');
    if (inputVideoRef.current) {
      // Limpa o valor anterior para garantir que o evento change seja disparado mesmo se selecionar o mesmo arquivo
      inputVideoRef.current.value = '';
      inputVideoRef.current.click();
    }
    setMostrarDropdown(false);
  };

  const handleVideoSelecionado = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Evento de seleção de vídeo disparado');
    const arquivo = event.target.files?.[0];
    
    if (!arquivo) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    console.log('Arquivo de vídeo selecionado:', {
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size
    });

    // Validar tipo do arquivo
    if (!tiposPermitidosVideo.includes(arquivo.type)) {
      console.log('Tipo de arquivo não permitido:', arquivo.type);
      mostrarToast('Tipo de arquivo não permitido. Use apenas MP4 ou WebM.', 'erro');
      event.target.value = '';
      return;
    }

    // Validar tamanho
    if (arquivo.size > tamanhoMaximoVideo) {
      console.log('Arquivo muito grande:', arquivo.size);
      mostrarToast('O vídeo deve ter no máximo 2MB', 'aviso');
      event.target.value = '';
      return;
    }

    try {
      setEnviandoVideo(true);
      console.log('Chamando onEnviarVideo');
      await onEnviarVideo(arquivo);
      console.log('Vídeo enviado com sucesso');
      mostrarToast('Vídeo enviado com sucesso!', 'sucesso');
    } catch (error) {
      console.error('Erro ao enviar vídeo:', error);
      mostrarToast('Erro ao enviar vídeo. Tente novamente.', 'erro');
    } finally {
      setEnviandoVideo(false);
      // Limpa o input após o envio ou erro
      if (inputVideoRef.current) {
        inputVideoRef.current.value = '';
      }
    }
  };

  const handleSelecionarDocumento = () => {
    console.log('Abrindo seletor de documento');
    if (inputDocumentoRef.current) {
      inputDocumentoRef.current.click();
    }
    setMostrarDropdown(false);
  };

  const handleDocumentoSelecionado = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Evento de seleção de documento disparado');
    const arquivo = event.target.files?.[0];
    
    if (!arquivo) {
      console.log('Nenhum arquivo selecionado');
      return;
    }

    console.log('Arquivo selecionado:', {
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size
    });

    // Validar tipo do arquivo
    if (!tiposPermitidosDocumento.includes(arquivo.type)) {
      console.log('Tipo de arquivo não permitido:', arquivo.type);
      mostrarToast(`Tipo de arquivo não permitido (${arquivo.type}). Formatos suportados: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, MP3, ZIP, TXT`, 'erro');
      event.target.value = '';
      return;
    }

    // Validar tamanho
    if (arquivo.size > tamanhoMaximoDocumento) {
      console.log('Arquivo muito grande:', arquivo.size);
      mostrarToast('O documento deve ter no máximo 2MB', 'aviso');
      event.target.value = '';
      return;
    }

    try {
      setEnviandoDocumento(true);
      console.log('Chamando onEnviarDocumento');
      await onEnviarDocumento(arquivo);
      console.log('Documento enviado com sucesso');
      mostrarToast('Documento enviado com sucesso!', 'sucesso');
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      mostrarToast('Erro ao enviar documento. Tente novamente.', 'erro');
    } finally {
      setEnviandoDocumento(false);
      if (inputDocumentoRef.current) {
        inputDocumentoRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2 sticky bottom-0">
      <div className="flex items-center gap-2">
        {/* Input de arquivo oculto - Movido para fora do dropdown */}
        <input
          ref={inputImagemRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleImagemSelecionada}
        />

        {/* Input de arquivo para vídeo */}
        <input
          ref={inputVideoRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={handleVideoSelecionado}
          onClick={(e) => {
            // Garante que o evento change será disparado mesmo se selecionar o mesmo arquivo
            (e.target as HTMLInputElement).value = '';
          }}
        />

        {/* Input de arquivo para documento */}
        <input
          ref={inputDocumentoRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.mp3,.zip,.txt"
          className="hidden"
          onChange={handleDocumentoSelecionado}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
        />

        {/* Container principal com largura máxima */}
        <div className="flex items-center gap-2 w-full">
          {/* Lado Esquerdo - Clips e Emoji (com largura fixa) */}
          <div className="flex gap-2 shrink-0">
            {/* Botão de Anexo com Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                className={`text-gray-500 hover:text-gray-700 p-2 cursor-pointer ${mostrarDropdown ? 'bg-gray-100 rounded-lg' : ''}`}
                onClick={() => setMostrarDropdown(!mostrarDropdown)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Dropdown de Opções */}
              {mostrarDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  {/* Botão Enviar Imagem */}
                  <button 
                    onClick={handleSelecionarImagem}
                    disabled={enviandoImagem}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      {enviandoImagem ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      {enviandoImagem ? 'Enviando...' : 'Enviar Imagem'}
                    </span>
                  </button>

                  {/* Enviar Vídeo */}
                  <button 
                    onClick={handleSelecionarVideo}
                    disabled={enviandoVideo}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      {enviandoVideo ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      {enviandoVideo ? 'Enviando...' : 'Enviar Vídeo'}
                    </span>
                  </button>

                  {/* Enviar Documento */}
                  <button 
                    onClick={handleSelecionarDocumento}
                    disabled={enviandoDocumento}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      {enviandoDocumento ? (
                        <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700">
                      {enviandoDocumento ? 'Enviando...' : 'Enviar Documento'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Botão de Emoji com Picker */}
            <div className="relative" ref={emojiPickerRef}>
              <button 
                className={`text-gray-500 hover:text-gray-700 p-2 cursor-pointer ${mostrarEmojiPicker ? 'bg-gray-100 rounded-lg' : ''}`}
                onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Emoji Picker */}
              {mostrarEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2">
                  <Picker 
                    data={data} 
                    onEmojiSelect={handleEmojiSelect}
                    theme="light"
                    locale="pt"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Campo de Input (expandível) */}
          <div className="flex-1 min-w-0">
            {gravando ? (
              <div className="w-full bg-[#f5f6f6] rounded-full px-4 py-2.5 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-gray-500">Gravando {formatarTempoGravacao()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelarGravacao}
                    className="text-red-500 hover:text-red-600 cursor-pointer transition-colors p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={pararGravacao}
                    className="bg-[#00a884] text-white cursor-pointer p-2 rounded-full hover:bg-[#008f6f] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma mensagem"
                className="w-full bg-[#f5f6f6] rounded-full px-4 py-2.5 focus:outline-none border border-gray-200"
              />
            )}
          </div>

          {/* Lado Direito - Microfone e Enviar (com largura fixa) */}
          <div className="flex gap-2 shrink-0">
            {!mensagem.trim() && !gravando && (
              <button 
                onClick={iniciarGravacao}
                className="text-gray-500 hover:text-gray-700 p-2 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
            {!gravando && (
              <button 
                onClick={handleEnviarMensagem}
                disabled={!mensagem.trim()}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  mensagem.trim() 
                    ? 'bg-[#00a884] text-white hover:bg-[#008f6f]' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          mensagem={toast.mensagem}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 