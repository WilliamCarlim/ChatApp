interface IconeDocumento {
  svg: JSX.Element;
  corFundo: string;
}

export const getTipoDocumento = (extensao: string): string => {
  const tipos: { [key: string]: string } = {
    // Documentos
    'pdf': 'PDF',
    'doc': 'Word',
    'docx': 'Word',
    // Planilhas
    'xls': 'Excel',
    'xlsx': 'Excel',
    'csv': 'CSV',
    // Apresentações
    'ppt': 'PowerPoint',
    'pptx': 'PowerPoint',
    // Áudio
    'mp3': 'Áudio',
    // Compactados
    'zip': 'ZIP',
    // Texto
    'txt': 'Texto',
  };

  return tipos[extensao.toLowerCase()] || 'Documento';
};

export const getIconeDocumento = (extensao: string): IconeDocumento => {
  const tipo = extensao.toLowerCase();

  switch (tipo) {
    case 'pdf':
      return {
        corFundo: '#FDE8E8',
        svg: (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <text x="8" y="16" className="text-xs font-bold" fill="currentColor">PDF</text>
          </svg>
        )
      };

    case 'doc':
    case 'docx':
      return {
        corFundo: '#EBF5FF',
        svg: (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <text x="8" y="16" className="text-xs font-bold" fill="currentColor">DOC</text>
          </svg>
        )
      };

    case 'xls':
    case 'xlsx':
    case 'csv':
      return {
        corFundo: '#F0FDF4',
        svg: (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <text x="8" y="16" className="text-xs font-bold" fill="currentColor">XLS</text>
          </svg>
        )
      };

    case 'ppt':
    case 'pptx':
      return {
        corFundo: '#FDF2F8',
        svg: (
          <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <text x="8" y="16" className="text-xs font-bold" fill="currentColor">PPT</text>
          </svg>
        )
      };

    case 'mp3':
      return {
        corFundo: '#F5F3FF',
        svg: (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
      };

    case 'zip':
      return {
        corFundo: '#FEF3C7',
        svg: (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        )
      };

    default:
      return {
        corFundo: '#F3F4F6',
        svg: (
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      };
  }
}; 