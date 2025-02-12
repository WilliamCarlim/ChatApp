interface AvatarProps {
  nome: string;
  url?: string | null;
  tamanho?: number;
}

export function Avatar({ nome, url, tamanho = 40 }: AvatarProps) {
  if (url && url.startsWith('http')) {
    return (
      <img
        src={url}
        alt={nome}
        className="rounded-full object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    );
  }

  const primeiraLetra = nome.charAt(0).toUpperCase();

  return (
    <div
      className="bg-[#00a884] rounded-full flex items-center justify-center text-white font-medium"
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.4 }}
    >
      {primeiraLetra}
    </div>
  );
} 