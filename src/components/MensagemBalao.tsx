import { AudioPlayer } from './AudioPlayer';
import { Avatar } from './Avatar';
import { getIconeDocumento, getTipoDocumento } from '../utils/documentos.tsx';
import { ImagemPreview } from './ImagemPreview';
import { useState } from 'react';

interface MensagemBalaoProps {
  id: string;
  texto: string;
  created_at: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento';
  isUser: boolean;
  reacoes?: string[];
  onEditar?: (id: string) => void;
  onDeletar?: (id: string) => void;
  termoBusca?: string;
  destacar?: boolean;
  indices?: [number, number][];
  nomeRemetente?: string;
  avatarUrl?: string | null;
  deletada?: boolean;
  editada?: boolean;
  audio_url?: string;
  imagem_url?: string;
  video_url?: string;
  documento_url?: string;
}

function formatarDataHora(dataString: string): string {
  const data = new Date(dataString);
  
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  const hora = data.getHours().toString().padStart(2, '0');
  const minutos = data.getMinutes().toString().padStart(2, '0');

  return `${dia}/${mes}/${ano} às ${hora}:${minutos}`;
}

export function MensagemBalao({
  id,
  texto,
  created_at,
  tipo,
  isUser,
  reacoes,
  onEditar,
  onDeletar,
  termoBusca,
  destacar,
  indices,
  nomeRemetente,
  avatarUrl,
  deletada,
  editada,
  audio_url,
  imagem_url,
  video_url,
  documento_url,
}: MensagemBalaoProps) {
  const [mostrarPreview, setMostrarPreview] = useState(false);

  const renderizarTextoComDestaque = () => {
    if (!termoBusca || !indices || indices.length === 0) {
      return <span>{texto}</span>;
    }

    const partes: JSX.Element[] = [];
    let ultimaPosicao = 0;

    indices.forEach(([inicio, fim], index) => {
      // Adiciona o texto antes do destaque
      if (inicio > ultimaPosicao) {
        partes.push(
          <span key={`texto-${index}`}>
            {texto.slice(ultimaPosicao, inicio)}
          </span>
        );
      }

      // Adiciona o texto destacado
      partes.push(
        <span 
          key={`destaque-${index}`}
          className={`bg-yellow-200 ${destacar ? 'animate-pulse' : ''}`}
        >
          {texto.slice(inicio, fim)}
        </span>
      );

      ultimaPosicao = fim;
    });

    // Adiciona o texto restante após o último destaque
    if (ultimaPosicao < texto.length) {
      partes.push(
        <span key="texto-final">
          {texto.slice(ultimaPosicao)}
        </span>
      );
    }

    return <>{partes}</>;
  };

  const renderizarConteudo = () => {
    if (deletada) {
      let mensagemDeletada = 'Mensagem apagada';
      if (tipo === 'audio') mensagemDeletada = 'Áudio apagado';
      if (tipo === 'imagem') mensagemDeletada = 'Imagem apagada';
      if (tipo === 'video') mensagemDeletada = 'Vídeo apagado';
      if (tipo === 'documento') mensagemDeletada = 'Documento apagado';

      return (
        <span className={`italic text-sm ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {mensagemDeletada}
        </span>
      );
    }

    switch (tipo) {
      case 'documento':
        console.log('Props recebidas em MensagemBalao:', {
          tipo,
          documento_url,
          texto,
          isUser
        });

        if (!documento_url) {
          console.log('URL do documento está vazia');
          return null;
        }
        
        // Corrigir a URL se necessário
        const urlDocumento = documento_url.replace('/v_mensagens-documentos/', '/mensagens-documentos/');
        console.log('URL do documento corrigida:', urlDocumento);
        
        const extensao = urlDocumento.split('.').pop()?.toLowerCase() || '';
        console.log('Extensão do documento:', extensao);
        const tipoDocumento = getTipoDocumento(extensao);
        console.log('Tipo do documento:', tipoDocumento);
        const icone = getIconeDocumento(extensao);
        console.log('Ícone gerado:', icone);
        
        return (
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            isUser ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ backgroundColor: icone.corFundo }}>
              {icone.svg}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                isUser ? 'text-blue-900' : 'text-gray-900'
              }`} title={texto}>
                {texto}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 uppercase">
                  {extensao}
                </span>
                <a 
                  href={urlDocumento}
                  download={texto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium hover:underline flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Baixar
                </a>
              </div>
            </div>
          </div>
        );
      case 'video':
        console.log('Renderizando vídeo:', { video_url, texto });
        return video_url && (
          <div className="relative max-w-sm">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video 
                key={video_url}
                src={video_url}
                controls
                controlsList="nodownload"
                preload="metadata"
                playsInline
                className="w-full max-h-[300px] object-contain"
                style={{ backgroundColor: 'black' }}
                onError={(e) => console.error('Erro ao carregar vídeo:', e)}
                onLoadStart={() => console.log('Iniciando carregamento do vídeo')}
                onLoadedData={() => console.log('Vídeo carregado com sucesso')}
              >
                <source src={video_url} type="video/mp4" />
                <source src={video_url} type="video/webm" />
                Seu navegador não suporta a reprodução de vídeos.
              </video>
            </div>
            
            <div className={`mt-1 flex items-center justify-between text-xs ${
              isUser ? 'text-white/80' : 'text-gray-500'
            }`}>
              <span className="truncate max-w-[200px]" title={texto}>
                {texto}
              </span>
            </div>
          </div>
        );
      case 'imagem':
        return imagem_url && (
          <div className="relative">
            <img
              src={imagem_url}
              alt={texto}
              onClick={() => setMostrarPreview(true)}
              className="rounded-lg max-w-full max-h-[300px] object-contain cursor-pointer hover:opacity-95 transition-opacity"
              loading="lazy"
            />
            <span className={`text-xs ${isUser ? 'text-white/80' : 'text-gray-500'} mt-1 block`}>
              {texto}
            </span>
            {mostrarPreview && (
              <ImagemPreview
                src={imagem_url}
                alt={texto}
                onClose={() => setMostrarPreview(false)}
              />
            )}
          </div>
        );
      case 'audio':
        return audio_url && (
          <AudioPlayer 
            audioUrl={audio_url}
            duracao={texto}
            isUser={isUser}
          />
        );
      default:
        return (
          <div>
            <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-800'}`}>
              {renderizarTextoComDestaque()}
            </p>
            {editada && (
              <span className={`text-xs ${isUser ? 'text-gray-200' : 'text-gray-500'}`}>
                editada
              </span>
            )}
          </div>
        );
    }
  };

  const renderizarBotoesAcao = () => {
    if (!isUser || deletada) return null;

    return (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[calc(100%+8px)] hidden group-hover:flex items-center gap-1">
        {/* Botão de editar - apenas para mensagens de texto */}
        {tipo === 'texto' && (
          <button 
            onClick={() => onEditar?.(id)}
            className="p-1.5 rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}

        {/* Botão de deletar - para todos os tipos */}
        <button 
          onClick={() => onDeletar?.(id)}
          className="p-1.5 rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-600 hover:text-red-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div 
      id={`mensagem-${id}`}
      className={`flex group items-end ${isUser ? 'justify-end' : 'justify-start'} relative hover:z-10`}
    >
      {/* Avatar do remetente (não-usuário) */}
      {!isUser && (
        <div className="mr-2">
          <Avatar 
            nome={nomeRemetente || 'Usuário'} 
            url={avatarUrl} 
            tamanho={32} 
          />
        </div>
      )}

      {/* Container para mensagem e ações */}
      <div className="relative max-w-[85%] md:max-w-[75%] min-w-[50px]">
        {/* Ações */}
        {renderizarBotoesAcao()}

        {/* Balão da mensagem */}
        <div 
          className={`w-auto inline-block ${
            isUser ? 'bg-[#5b96f7] text-white float-right' : 'bg-white float-left'
          } rounded-2xl shadow-sm p-3 border border-gray-100`}
        >
          {/* Nome do remetente (apenas para mensagens não-usuário) */}
          {!isUser && (
            <p className="text-sm font-semibold text-[#5b96f7] mb-1">{nomeRemetente}</p>
          )}
          
          {/* Conteúdo da mensagem */}
          {renderizarConteudo()}
          
          {/* Reações e horário */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex -space-x-1">
              {reacoes?.map((reacao, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-full px-2 py-0.5 text-xs border shadow-sm flex items-center gap-1"
                >
                  <span>{reacao}</span>
                </div>
              ))}
            </div>
            <p className={`text-[10px] ${isUser ? 'text-white/80' : 'text-gray-500'} ml-3`}>
              {formatarDataHora(created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Avatar do usuário */}
      {isUser && (
        <div className="ml-2">
          <Avatar 
            nome={nomeRemetente || 'Você'} 
            url={avatarUrl} 
            tamanho={32} 
          />
        </div>
      )}
    </div>
  );
} 