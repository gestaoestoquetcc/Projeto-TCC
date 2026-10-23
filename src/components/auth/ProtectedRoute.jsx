import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiLoader, FiShield } from 'react-icons/fi';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center text-gray-800">
        <div className="w-12 h-12 rounded-xl bg-[#c8672b] flex items-center justify-center text-white shadow-xs mb-4 animate-pulse">
          <FiShield className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          <FiLoader className="w-4 h-4 animate-spin text-[#c8672b]" />
          <span>Validando sessão segura...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
