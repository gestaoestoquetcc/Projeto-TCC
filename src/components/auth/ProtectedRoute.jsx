import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RiShieldFlashFill } from 'react-icons/ri';
import { FiLoader } from 'react-icons/fi';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-900/40 mb-4 animate-pulse">
          <RiShieldFlashFill className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <FiLoader className="w-4 h-4 animate-spin text-amber-500" />
          <span>Autenticando sessão com o Supabase...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
