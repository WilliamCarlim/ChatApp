import { useState } from 'react';

interface ImagemPreviewProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImagemPreview({ src, alt, onClose }: ImagemPreviewProps) {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3)); // Máximo zoom de 3x
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5)); // Mínimo zoom de 0.5x
  };

  const handleReset = () => {
    setScale(1);
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/70 flex items-center justify-center">
      {/* Overlay com controles */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent z-[60]">
        {/* Controles de Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="text-white/80 hover:text-white p-2 rounded-full transition-colors bg-black/20 hover:bg-black/30"
            title="Diminuir zoom"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          <button
            onClick={handleReset}
            className="text-white/80 hover:text-white px-3 py-1 rounded-full transition-colors bg-black/20 hover:bg-black/30 text-sm"
            title="Resetar zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            className="text-white/80 hover:text-white p-2 rounded-full transition-colors bg-black/20 hover:bg-black/30"
            title="Aumentar zoom"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white p-2 rounded-full transition-colors bg-black/20 hover:bg-black/30"
          title="Fechar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Container da imagem com zoom */}
      <div 
        className="w-full h-full flex items-center justify-center overflow-auto z-[55]"
        onClick={(e) => {
          // Fecha o preview apenas se clicar no container, não na imagem
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{ 
            transform: `scale(${scale})`,
            transition: 'transform 0.2s ease-out'
          }}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
} 