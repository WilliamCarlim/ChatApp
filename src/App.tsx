import { useState, FormEvent, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Chat } from './pages/Chat'
import { authService } from './services/auth'
import { RotaProtegida } from './components/RotaProtegida'
import Swal from 'sweetalert2'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { statusService } from './services/status'

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validações
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    setError(null);

    if (!validateEmail(email)) {
      setError('Email inválido');
      return false;
    }

    if (!validatePassword(password)) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (!isLogin) {
      if (!nome.trim()) {
        setError('Nome é obrigatório');
        return false;
      }

      if (password !== confirmPassword) {
        setError('As senhas não coincidem');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { user, error } = await authService.signIn({ email, password });
        if (error) throw error;
        if (user) {
          navigate('/chat');
        }
      } else {
        const { user, error } = await authService.signUp({ email, password, nome });
        if (error) throw error;
        if (user) {
          // Limpar formulário
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setNome('');
          setConfirmPassword('');

          // Mostrar modal de sucesso
          await Swal.fire({
            icon: 'success',
            title: 'Cadastro realizado com sucesso!',
            html: `
              <p>Enviamos um email de confirmação para <strong>${email}</strong></p>
              <p class="mt-2">Por favor, verifique sua caixa de entrada e confirme seu email para ativar sua conta.</p>
              <p class="mt-2 text-sm text-gray-500">Caso não encontre o email, verifique também sua caixa de spam.</p>
            `,
            confirmButtonText: 'Entendi',
            confirmButtonColor: '#00a884',
            allowOutsideClick: false
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
      
      // Mostrar modal de erro
      await Swal.fire({
        icon: 'error',
        title: 'Ops! Algo deu errado',
        text: err.message || 'Ocorreu um erro. Tente novamente.',
        confirmButtonColor: '#00a884'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Login/Cadastro */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="w-12 h-12 bg-[#00a884] rounded-lg flex items-center justify-center mb-2">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <h1 className="mt-6 text-4xl font-bold text-gray-900">Simples. Seguro.</h1>
              <h1 className="text-4xl font-bold text-gray-900">Mensagens Confiáveis.</h1>
              <p className="mt-4 text-gray-600">
                Com o ChatApp, você terá mensagens rápidas, simples e seguras, disponível para todos.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {isLogin ? 'Faça seu login' : 'Crie sua conta'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#00a884] text-sm"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#00a884] text-sm"
                  placeholder="Digite seu email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#00a884] text-sm"
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#00a884] text-sm"
                    placeholder="Digite sua senha novamente"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#00a884] text-white py-2.5 rounded font-medium hover:bg-[#008f6f] transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-sm text-[#00a884] hover:underline"
              >
                {isLogin ? 'Criar uma nova conta' : 'Já tenho uma conta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Imagem */}
      <div className="hidden lg:block w-1/2 bg-[#00a884] relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[80%] max-w-md">
            <img 
              src="https://img.freepik.com/free-vector/chat-app-concept-illustration_114360-1012.jpg"
              alt="Chat Interface"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { usuarioAtual } = useAuth();

  useEffect(() => {
    if (usuarioAtual) {
      console.log('[App] Iniciando monitoramento de status');
      
      let timeoutId: NodeJS.Timeout;
      let lastUpdate = Date.now();
      const MIN_INTERVAL = 10000; // Mínimo de 10 segundos entre atualizações

      // Função para atualizar status com debounce
      const atualizarStatus = (online: boolean) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdate;

        // Cancela timeout anterior se existir
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Se passou tempo suficiente desde a última atualização, atualiza imediatamente
        if (timeSinceLastUpdate >= MIN_INTERVAL) {
          console.log(`[App] Atualizando status para: ${online ? 'online' : 'offline'}`);
          statusService.atualizarStatus(usuarioAtual.id, online);
          lastUpdate = now;
        } else {
          // Caso contrário, agenda atualização
          timeoutId = setTimeout(() => {
            console.log(`[App] Atualizando status para: ${online ? 'online' : 'offline'}`);
            statusService.atualizarStatus(usuarioAtual.id, online);
            lastUpdate = Date.now();
          }, MIN_INTERVAL - timeSinceLastUpdate);
        }
      };

      // Define status inicial
      atualizarStatus(true);

      // Monitora atividade do usuário com throttle
      let isHandlingActivity = false;
      const handleAtividade = () => {
        if (!document.hidden && !isHandlingActivity) {
          isHandlingActivity = true;
          atualizarStatus(true);
          setTimeout(() => {
            isHandlingActivity = false;
          }, MIN_INTERVAL);
        }
      };

      // Monitora visibilidade da página
      const handleVisibilityChange = () => {
        const online = !document.hidden;
        console.log(`[App] Visibilidade mudou. Online: ${online}`);
        atualizarStatus(online);
      };

      // Monitora fechamento da página - este precisa ser imediato
      const handleBeforeUnload = () => {
        console.log('[App] Fechando página - definindo como offline');
        statusService.atualizarStatus(usuarioAtual.id, false);
      };

      window.addEventListener('mousemove', handleAtividade);
      window.addEventListener('keydown', handleAtividade);
      window.addEventListener('click', handleAtividade);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Heartbeat menos frequente
      const interval = setInterval(() => {
        if (!document.hidden) {
          atualizarStatus(true);
        }
      }, 30000); // A cada 30 segundos

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        window.removeEventListener('mousemove', handleAtividade);
        window.removeEventListener('keydown', handleAtividade);
        window.removeEventListener('click', handleAtividade);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        clearInterval(interval);
        statusService.atualizarStatus(usuarioAtual.id, false);
      };
    }
  }, [usuarioAtual]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={
          <RotaProtegida>
            <Chat />
          </RotaProtegida>
        } />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
