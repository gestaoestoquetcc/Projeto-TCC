import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/public/AuthPage";
import RedefinirSenha from "./pages/public/RedefinirSenha";
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

      {/* Rotas Principais do Sistema AutoStock */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/pecas" element={<EstoquePage />} />
      <Route path="/estoque" element={<EstoquePage />} />
      <Route path="/previsao" element={<PrevisaoPage />} />
      <Route path="/previsao-ia" element={<PrevisaoPage />} />
      <Route path="/movimentacao" element={<MovimentacoesPage />} />
      <Route path="/entrada-saida" element={<MovimentacoesPage />} />
      <Route path="/fornecedores" element={<FornecedoresPage />} />
      <Route path="/configuracoes" element={<ConfiguracoesPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
