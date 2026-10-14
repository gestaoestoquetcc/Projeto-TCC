import React, { useState } from 'react';
import { 
  FiX, 
  FiSave, 
  FiUser, 
  FiBriefcase
} from 'react-icons/fi';

export default function EditarUsuarioModal({ usuario, isOpen, onClose, onSalvar }) {
  if (!isOpen || !usuario) return null;

  const [cargo, setCargo] = useState(usuario.cargo || '');
  const [role, setRole] = useState(usuario.role || 'operador');
  const [ativo, setAtivo] = useState(usuario.ativo !== false);
  const [permissoes, setPermissoes] = useState(usuario.permissoes || {
    dashboard: true,
    pecas: true,
    movimentacao: true,
    previsao: false,
    fornecedores: false,
    usuarios: false
  });

  const [salvando, setSalvando] = useState(false);

  const togglePermissao = (key) => {
    setPermissoes((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectRole = (novoRole) => {
    setRole(novoRole);
    if (novoRole === 'master') {
      setPermissoes({
        dashboard: true,
        pecas: true,
        movimentacao: true,
        previsao: true,
        fornecedores: true,
        usuarios: true
      });
    } else if (novoRole === 'gerente') {
      setPermissoes({
        dashboard: true,
        pecas: true,
        movimentacao: true,
        previsao: true,
        fornecedores: true,
        usuarios: false
      });
    } else {
      setPermissoes({
        dashboard: true,
        pecas: true,
        movimentacao: true,
        previsao: false,
        fornecedores: false,
        usuarios: false
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await onSalvar(usuario.id, {
        cargo: cargo.trim(),
        role,
        ativo,
        permissoes
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity" 
        onClick={() => !salvando && onClose()} 
      />

      <div className="relative bg-white border border-slate-200 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-98 duration-150 text-slate-800">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Editar Colaborador</h3>
            <p className="text-xs text-slate-500 mt-0.5">{usuario.nome} ({usuario.email})</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(90vh-120px)] overflow-y-auto">
          
          {/* Status Ativo / Inativo */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Status da Conta</span>
              <span className="text-[11px] text-slate-500">Contas inativas têm o acesso ao sistema suspenso.</span>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                ativo 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
              }`}
            >
              {ativo ? 'Ativo' : 'Suspenso'}
            </button>
          </div>

          {/* Seletor de Perfil (Role) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Perfil de Acesso (RBAC)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'operador', label: 'Operador' },
                { id: 'gerente', label: 'Gerente' },
                { id: 'master', label: 'Administrador' },
              ].map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                      isSelected
                        ? 'bg-amber-50/60 border-[#c8672b] text-[#9e4a1a] ring-1 ring-[#c8672b]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Função / Cargo</label>
            <div className="relative">
              <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white rounded-lg border border-slate-300 outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-colors"
              />
            </div>
          </div>

          {/* Permissões Modulares */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Módulos Habilitados
            </label>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {[
                { key: 'dashboard', label: 'Visão Geral & Indicadores' },
                { key: 'pecas', label: 'Catálogo de Peças' },
                { key: 'movimentacao', label: 'Movimentações de Estoque' },
                { key: 'previsao', label: 'Previsão de Demanda' },
                { key: 'fornecedores', label: 'Gestão de Fornecedores' },
                { key: 'usuarios', label: 'Administração & Usuários' },
              ].map((p) => {
                const isHabilitado = permissoes[p.key];
                return (
                  <div
                    key={p.key}
                    onClick={() => togglePermissao(p.key)}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-800">{p.label}</span>
                    <input
                      type="checkbox"
                      checked={isHabilitado}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-300 text-[#c8672b] focus:ring-[#c8672b] cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#c8672b] hover:bg-[#b0561e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FiSave className="w-3.5 h-3.5" />
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
