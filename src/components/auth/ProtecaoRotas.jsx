import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RiShieldFlashFill } from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';

// Tela rápida enquanto o sistema confere se você está logado
function Carregando() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f7f5f0]">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md animate-pulse">
        <RiShieldFlashFill className="w-6 h-6 text-white" />
      </div>
      <span className="text-xs font-mono tracking-widest uppercase text-gray-500">Carregando...</span>
    </div>
  );
}

/** Telas do sistema: só entra quem está logado */
export function RotaPrivada() {
  const { usuario, carregando, recuperandoSenha } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregando />;
  if (recuperandoSenha) return <Navigate to="/nova-senha" replace />;
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return <Outlet />;
}

/** Login, cadastro e esqueci a senha: quem já está logado vai direto para o sistema */
export function RotaPublica() {
  const { usuario, carregando, recuperandoSenha } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregando />;
  if (recuperandoSenha) return <Navigate to="/nova-senha" replace />;
  if (usuario) return <Navigate to={location.state?.de || '/'} replace />;
  return <Outlet />;
}
