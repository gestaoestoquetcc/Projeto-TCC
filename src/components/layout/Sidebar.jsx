import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiGrid, 
  FiLayers, 
  FiTrendingUp, 
  FiRepeat, 
  FiTruck, 
  FiSettings, 
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { RiShieldFlashFill } from 'react-icons/ri';

export default function Sidebar({ activeTab = 'pecas', isDark = false, onToggleDark }) {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid, path: '/' },
    { id: 'pecas', label: 'Peças', icon: FiLayers, path: '/pecas' },
    { id: 'previsao', label: 'Previsão IA', icon: FiTrendingUp, path: '/previsao', badge: 'LIVE' },
    { id: 'movimentacao', label: 'Entrada/Saída', icon: FiRepeat, path: '/movimentacao' },
    { id: 'fornecedores', label: 'Fornecedores', icon: FiTruck, path: '/fornecedores' },
    { id: 'configuracoes', label: 'Configurações', icon: FiSettings, path: '/configuracoes' },
  ];

  return (
    <aside className="w-64 bg-[#0d1117] text-gray-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-[#1e2430]">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1b222d]/60">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-900/30">
            <RiShieldFlashFill className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">AutoStock</h1>
            <span className="text-[10px] text-amber-500/80 font-mono tracking-widest uppercase block mt-1">
              Distribuidor Pro
            </span>
          </div>
        </div>

        {/* Modules Section */}
        <div className="px-3 pt-6">
          <span className="px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Módulos
          </span>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => item.path && navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#1e1b18] text-amber-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-200'
                    }`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {isActive && (
                    <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Area */}
      <div className="p-4 border-t border-[#1b222d] space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            {isDark ? <FiMoon className="w-4 h-4 text-amber-400" /> : <FiSun className="w-4 h-4 text-amber-500" />}
            <span className="font-medium text-gray-300">
              {isDark ? 'Tema Escuro' : 'Tema Claro'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleDark}
            aria-label="Alternar tema"
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              !isDark ? 'bg-amber-600 justify-end' : 'bg-gray-700 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-lg bg-[#161b22]/70 border border-[#21262d]/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-semibold text-xs tracking-wider shadow-sm">
            AT
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-gray-200 truncate">Arthur Teste</h4>
            <p className="text-[11px] text-gray-500 truncate">Gerente de Estoque</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
