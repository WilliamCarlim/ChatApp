import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioPlayerProps {
  audioUrl: string;
  duracao?: string;
  isUser?: boolean;
}

type PlaybackSpeed = 1 | 1.5 | 2;

export function AudioPlayer({ audioUrl, duracao, isUser = false }: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inicializa o WaveSurfer com cores diferentes baseado em isUser
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isUser ? '#ffffff' : '#9ca3af',
      progressColor: isUser ? '#cce1ff' : '#5b96f7',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 3,
      height: 30,
      barRadius: 3,
      normalize: true,
      backend: 'MediaElement',
      mediaControls: false,
      // Desabilita o processamento de áudio nativo do WaveSurfer
      // para usar o controle de velocidade nativo do elemento de áudio
      audioRate: 1
    });

    // Carrega o áudio
    wavesurfer.load(audioUrl);

    // Eventos
    wavesurfer.on('ready', () => {
      setTotalDuration(Math.floor(wavesurfer.getDuration()));
      
      // Configura para preservar o pitch usando o elemento de áudio nativo
      const mediaElement = wavesurfer.getMediaElement();
      if (mediaElement) {
        // @ts-ignore - A propriedade existe mas não está no tipo
        mediaElement.preservesPitch = true;
        // Para Safari
        // @ts-ignore - A propriedade existe mas não está no tipo
        mediaElement.webkitPreservesPitch = true;
        // Define a velocidade diretamente no elemento de áudio
        mediaElement.playbackRate = playbackSpeed;
      }
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime(formatTime(totalDuration));
      wavesurfer.seekTo(0);
    });

    wavesurfer.on('audioprocess', () => {
      const time = Math.floor(wavesurfer.getCurrentTime());
      
      // Verifica se o tempo atual excedeu a duração total com uma margem de tolerância
      if (time > totalDuration + 0.5) {
        wavesurfer.pause();
        setIsPlaying(false);
        setCurrentTime(formatTime(totalDuration));
        wavesurfer.seekTo(0);
        return;
      }

      // Atualiza o tempo atual, mas não ultrapassa a duração total
      setCurrentTime(formatTime(Math.min(time, totalDuration)));
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl, isUser, totalDuration]);

  // Atualiza a velocidade de reprodução quando ela mudar
  useEffect(() => {
    if (wavesurferRef.current) {
      const mediaElement = wavesurferRef.current.getMediaElement();
      if (mediaElement) {
        mediaElement.playbackRate = playbackSpeed;
      }
    }
  }, [playbackSpeed]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
    }
  };

  const togglePlaybackSpeed = () => {
    setPlaybackSpeed(current => {
      if (current === 1) return 1.5;
      if (current === 1.5) return 2;
      return 1;
    });
  };

  return (
    <div className="flex items-center gap-2 min-w-[250px] md:min-w-[350px]">
      <button
        onClick={togglePlayPause}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isUser 
            ? 'bg-white text-[#5b96f7] hover:bg-gray-100' 
            : 'bg-[#5b96f7] text-white hover:bg-[#4a85e6]'
        }`}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      <div className="flex-1">
        <div ref={containerRef} className="w-full" />
      </div>

      <span className={`text-xs ${isUser ? 'text-white/80' : 'text-gray-500'} flex-shrink-0`}>
        {isPlaying ? currentTime : duracao || '0:00'}
      </span>

      <button
        onClick={togglePlaybackSpeed}
        className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
          isUser
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${playbackSpeed !== 1 ? 'font-bold' : ''}`}
      >
        {playbackSpeed}x
      </button>
    </div>
  );
} 