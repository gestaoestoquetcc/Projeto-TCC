import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/private/dashboard";
import EstoquePage from "./pages/private/estoque";
import MovimentacoesPage from "./pages/private/movimentacoes";
import PrevisaoPage from "./pages/private/previsao";
import FornecedoresPage from "./pages/private/fornecedores";
import LoginPage from "./pages/public/Login";
import CadastroPage from "./pages/public/Cadastro";
import EsqueciSenhaPage from "./pages/public/EsqueciSenha";
import NovaSenhaPage from "./pages/public/NovaSenha";
import { RotaPrivada, RotaPublica } from "./components/auth/ProtecaoRotas";

export default function Router() {
  return (
    <Routes>
      {/* Telas abertas (sem login) */}
      <Route element={<RotaPublica />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      </Route>
      <Route path="/nova-senha" element={<NovaSenhaPage />} />

      {/* Telas do sistema (precisa estar logado) */}
      <Route element={<RotaPrivada />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pecas" element={<EstoquePage />} />
        <Route path="/estoque" element={<EstoquePage />} />
        <Route path="/previsao" element={<PrevisaoPage />} />
        <Route path="/previsao-ia" element={<PrevisaoPage />} />
        <Route path="/movimentacao" element={<MovimentacoesPage />} />
        <Route path="/entrada-saida" element={<MovimentacoesPage />} />
        <Route path="/fornecedores" element={<FornecedoresPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
