import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/private/dashboard";
import EstoquePage from "./pages/private/estoque";
import MovimentacoesPage from "./pages/private/movimentacoes";
import PrevisaoPage from "./pages/private/previsao";
import FornecedoresPage from "./pages/private/fornecedores";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/pecas" element={<EstoquePage />} />
      <Route path="/estoque" element={<EstoquePage />} />
      <Route path="/previsao" element={<PrevisaoPage />} />
      <Route path="/previsao-ia" element={<PrevisaoPage />} />
      <Route path="/movimentacao" element={<MovimentacoesPage />} />
      <Route path="/entrada-saida" element={<MovimentacoesPage />} />
      <Route path="/fornecedores" element={<FornecedoresPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
