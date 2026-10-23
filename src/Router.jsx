import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/public/AuthPage";
import RedefinirSenha from "./pages/public/RedefinirSenha";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardPage from "./pages/private/dashboard";
import EstoquePage from "./pages/private/estoque";
import MovimentacoesPage from "./pages/private/movimentacoes";
import PrevisaoPage from "./pages/private/previsao";
import FornecedoresPage from "./pages/private/fornecedores";
import ConfiguracoesPage from "./pages/private/configuracoes";

export default function Router() {
  return (
    <Routes>
      {/* Rotas Públicas de Autenticação */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/cadastro" element={<AuthPage />} />
      <Route path="/recuperar-senha" element={<AuthPage />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/reset-password" element={<RedefinirSenha />} />

      {/* Rotas Principais Protegidas do Sistema AutoStock */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/pecas" element={<ProtectedRoute><EstoquePage /></ProtectedRoute>} />
      <Route path="/estoque" element={<ProtectedRoute><EstoquePage /></ProtectedRoute>} />
      <Route path="/previsao" element={<ProtectedRoute><PrevisaoPage /></ProtectedRoute>} />
      <Route path="/previsao-ia" element={<ProtectedRoute><PrevisaoPage /></ProtectedRoute>} />
      <Route path="/movimentacao" element={<ProtectedRoute><MovimentacoesPage /></ProtectedRoute>} />
      <Route path="/entrada-saida" element={<ProtectedRoute><MovimentacoesPage /></ProtectedRoute>} />
      <Route path="/fornecedores" element={<ProtectedRoute><FornecedoresPage /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
