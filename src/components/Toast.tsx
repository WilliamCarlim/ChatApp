import { useEffect } from 'react';

interface ToastProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'aviso';
  onClose: () => void;
}

export function Toast({ mensagem, tipo, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Fecha automaticamente após 3 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  const cores = {
    sucesso: 'bg-green-50 text-green-600 border-green-200',
    erro: 'bg-red-50 text-red-600 border-red-200',
    aviso: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  const icones = {
    sucesso: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    erro: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    aviso: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${cores[tipo]}`}>
        <div className="flex-shrink-0">
          {icones[tipo]}
        </div>
        <p className="text-sm font-medium">{mensagem}</p>
        <button 
          onClick={onClose}
          className="ml-auto flex-shrink-0 hover:opacity-75"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 