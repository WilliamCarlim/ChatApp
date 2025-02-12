import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import Swal from 'sweetalert2';

interface InfoUsuarioProps {
  nome: string;
  email: string;
  avatar: string | null;
  userId: string;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  onNameUpdate?: (newName: string) => void;
}

export function InfoUsuario({ 
  nome, 
  email, 
  avatar, 
  userId, 
  onAvatarUpdate,
  onNameUpdate 
}: InfoUsuarioProps) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primeiraLetra = nome.charAt(0).toUpperCase();

  const validateName = (name: string) => {
    // Remove espaços extras e normaliza espaços duplos
    const trimmedName = name.trim().replace(/\s+/g, ' ');
    
    // Verifica se está vazio após trim
    if (!trimmedName) {
      return { isValid: false, message: 'O nome não pode ficar em branco' };
    }

    // Verifica o tamanho mínimo e máximo
    if (trimmedName.length < 2) {
      return { isValid: false, message: 'O nome deve ter pelo menos 2 caracteres' };
    }
    if (trimmedName.length > 50) {
      return { isValid: false, message: 'O nome deve ter no máximo 50 caracteres' };
    }

    // Verifica se contém apenas números
    if (/^\d+$/.test(trimmedName)) {
      return { isValid: false, message: 'O nome não pode conter apenas números' };
    }

    // Verifica se contém apenas emojis
    const emojiRegex = /^[\p{Emoji}|\s]+$/u;
    if (emojiRegex.test(trimmedName)) {
      return { isValid: false, message: 'O nome não pode conter apenas emojis' };
    }

    // Verifica se contém caracteres válidos (letras, espaços, acentos e alguns caracteres especiais comuns em nomes)
    const validNameRegex = /^[\p{L}\s\-'.]+$/u;
    if (!validNameRegex.test(trimmedName)) {
      return { isValid: false, message: 'O nome contém caracteres inválidos' };
    }

    return { isValid: true, validName: trimmedName };
  };

  const handleLogout = async () => {
    try {
      const { error } = await authService.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleEditName = async () => {
    try {
      const { value: newName } = await Swal.fire({
        title: 'Editar nome',
        input: 'text',
        inputLabel: 'Novo nome',
        inputValue: nome,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#00a884',
        inputValidator: (value) => {
          const validation = validateName(value);
          if (!validation.isValid) {
            return validation.message;
          }
          return null;
        },
        customClass: {
          input: 'swal2-input text-sm',
        },
        footer: `
          <div class="text-xs text-gray-500">
            • O nome deve ter entre 2 e 50 caracteres<br>
            • Pode conter letras, espaços e caracteres como - ' .<br>
            • Não pode conter apenas números ou emojis
          </div>
        `
      });

      if (newName) {
        const validation = validateName(newName);
        if (validation.isValid && validation.validName !== nome) {
          const { user, error } = await authService.updateUserName(userId, validation.validName);
          
          if (error) throw error;

          if (user) {
            onNameUpdate?.(user.nome);
            await Swal.fire({
              icon: 'success',
              title: 'Nome atualizado!',
              timer: 2000,
              timerProgressBar: true,
              confirmButtonColor: '#00a884',
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Ops! Algo deu errado',
        text: error.message || 'Erro ao atualizar nome.',
        confirmButtonColor: '#00a884'
      });
    } finally {
      setIsDropdownOpen(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUpdatingAvatar(true);

      const { publicUrl, error } = await authService.updateAvatar(userId, file);
      
      if (error) throw error;

      if (publicUrl) {
        onAvatarUpdate?.(publicUrl);
        await Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Sua foto de perfil foi atualizada.',
          confirmButtonColor: '#00a884',
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar avatar:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Ops! Algo deu errado',
        text: error.message || 'Erro ao atualizar a foto de perfil.',
        confirmButtonColor: '#00a884'
      });
    } finally {
      setIsUpdatingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center gap-3 w-full min-w-0 relative">
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        {avatar ? (
          <img
            src={avatar}
            alt="Seu perfil"
            className={`w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 ${
              isUpdatingAvatar ? 'opacity-50' : ''
            }`}
            onClick={handleAvatarClick}
            title="Clique para alterar sua foto"
          />
        ) : (
          <div 
            className={`w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center cursor-pointer hover:opacity-80 ${
              isUpdatingAvatar ? 'opacity-50' : ''
            }`}
            onClick={handleAvatarClick}
            title="Clique para adicionar uma foto"
          >
            <span className="text-white text-xl font-semibold">{primeiraLetra}</span>
          </div>
        )}
        {isUpdatingAvatar && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Informações do usuário com dropdown */}
      <div 
        className="min-w-0 flex-1 group cursor-pointer select-none"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center gap-1">
          <h3 className="font-semibold text-gray-900 truncate max-w-full">
            {nome}
          </h3>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <p className="text-xs text-gray-500 truncate max-w-full">
          {email}
        </p>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <>
          {/* Overlay para fechar o dropdown ao clicar fora */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-white border border-gray-100 shadow-lg shadow-gray-100/50 z-20">
            <div className="py-1">
              {/* Botão Editar */}
              <button
                onClick={handleEditName}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar nome
              </button>

              {/* Botão Sair */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 