import React, { useState } from 'react';
import { 
  FiX, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiBriefcase, 
  FiShield, 
  FiCheck,
  FiCheckCircle,
  FiTrendingUp,
  FiPackage,
  FiGrid,
  FiLayers,
  FiRepeat,
  FiCpu,
  FiTruck,
  FiSettings,
  FiKey
} from 'react-icons/fi';

export default function NovoUsuarioModal({ isOpen, onClose, onSalvar }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Operador de Almoxarifado');
  const [role, setRole] = useState('operador'); // 'master' | 'gerente' | 'operador'
  const [senha, setSenha] = useState('AutoStock@2026');
  const [exigirTrocaSenha, setExigirTrocaSenha] = useState(true);

  // Permissões modulares
  const [permissoes, setPermissoes] = useState({
    dashboard: true,
    pecas: true,
    movimentacao: true,
    previsao: false,
    fornecedores: false,
    usuarios: false
  });

  const [errors, setErrors] = useState({});
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const handleSelectRole = (novoRole) => {
    setRole(novoRole);
    if (novoRole === 'master') {
      setCargo('Administrador de Sistemas / TI');
      setPermissoes({
        dashboard: true,
        pecas: true,
        movimentacao: true,
        previsao: true,
        fornecedores: true,
        usuarios: true
      });
    } else if (novoRole === 'gerente') {
      setCargo('Gerente de Operações & Estoque');
      setPermissoes({
        dashboard: true,
        pecas: true,
        movimentacao: true,
        previsao: true,
        fornecedores: true,
        usuarios: false
      });
    } else {
      setCargo('Operador de Almoxarifado');
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

  const togglePermissao = (key) => {
    setPermissoes((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const gerarSenhaAleatoria = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(pass);
  };

  const validate = () => {
    const errs = {};
    if (!nome.trim()) errs.nome = 'Nome completo é obrigatório';
    if (!email.trim()) {
      errs.email = 'E-mail profissional é obrigatório';
    } else if (!email.includes('@')) {
      errs.email = 'Formato de e-mail inválido';
    }
    if (!senha || senha.length < 6) errs.senha = 'A senha deve conter no mínimo 6 caracteres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSalvando(true);
      await onSalvar({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        cargo: cargo.trim(),
        role,
        senha,
        permissoes
      });
      onClose();
      // Limpeza
      setNome('');
      setEmail('');
      setCargo('Operador de Almoxarifado');
      setRole('operador');
      setSenha('AutoStock@2026');
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop neutro com blur sutil */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity" 
        onClick={() => !salvando && onClose()} 
      />

      {/* Modal Card Corporativo */}
      <div className="relative bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-98 duration-150">
        
        {/* Cabeçalho Técnico / ERP */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Novo Colaborador</h3>
            <p className="text-xs text-slate-500 mt-0.5">Cadastre o operador e defina os privilégios de acesso ao almoxarifado</p>
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

        {/* Formulário Estruturado */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto text-slate-800">
          
          {/* SEÇÃO 1: DADOS CADASTRAIS */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Identificação do Colaborador
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo Mendes"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white rounded-lg border outline-none transition-colors ${
                      errors.nome ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b]'
                    }`}
                  />
                </div>
                {errors.nome && <span className="text-[11px] text-red-500 mt-1 block">{errors.nome}</span>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail Profissional <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="carlos.mendes@autostock.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white rounded-lg border outline-none font-mono text-xs transition-colors ${
                      errors.email ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b]'
                    }`}
                  />
                </div>
                {errors.email && <span className="text-[11px] text-red-500 mt-1 block">{errors.email}</span>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Função / Departamento
                </label>
                <div className="relative">
                  <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Operador de Almoxarifado & Balcão"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white rounded-lg border border-slate-300 outline-none focus:border-[#c8672b] focus:ring-1 focus:ring-[#c8672b] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: PERFIL DE AUTORIZAÇÃO (RBAC) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              2. Perfil de Acesso & Autorização (RBAC)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { 
                  id: 'operador', 
                  title: 'Operador', 
                  desc: 'Entradas de NF-e, baixas de OS, inventário físico e bipagem.' 
                },
                { 
                  id: 'gerente', 
                  title: 'Gerência', 
                  desc: 'Planejamento de demanda, cotações, compras e catálogo de peças.' 
                },
                { 
                  id: 'master', 
                  title: 'Administrador', 
                  desc: 'Acesso total, governança de usuários, parâmetros e auditoria.' 
                },
              ].map((item) => {
                const isSelected = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectRole(item.id)}
                    className={`p-3.5 rounded-lg text-left border transition-all ${
                      isSelected
                        ? 'bg-amber-50/60 border-[#c8672b] ring-1 ring-[#c8672b]'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#9e4a1a]' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#c8672b] bg-[#c8672b]' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: CREDENCIAIS INICIAIS */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              3. Credencial Inicial de Acesso
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Senha Provisória <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs bg-white rounded-lg border outline-none font-mono transition-colors ${
                        errors.senha ? 'border-red-400' : 'border-slate-300 focus:border-[#c8672b]'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={gerarSenhaAleatoria}
                    title="Gerar senha temporária segura"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
                  >
                    <FiKey className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gerar</span>
                  </button>
                </div>
                {errors.senha && <span className="text-[11px] text-red-500 mt-1 block">{errors.senha}</span>}
              </div>

              <div className="pt-5 sm:pt-6">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={exigirTrocaSenha}
                    onChange={(e) => setExigirTrocaSenha(e.target.checked)}
                    className="rounded border-slate-300 text-[#c8672b] focus:ring-[#c8672b]"
                  />
                  <span className="text-xs text-slate-600">
                    Solicitar alteração de senha no primeiro login
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: MATRIZ DE MÓDULOS */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              4. Liberação de Módulos Operacionais
            </div>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden bg-white">
              {[
                { key: 'dashboard', label: 'Visão Geral & Indicadores', desc: 'KPIs de acurácia, rupturas e gráficos de saída' },
                { key: 'pecas', label: 'Catálogo de Peças', desc: 'Consulta, cadastro e edição de SKUs automotivos' },
                { key: 'movimentacao', label: 'Movimentações de Estoque', desc: 'Lançamento de baixas, entradas via XML e bipagem' },
                { key: 'previsao', label: 'Previsão de Demanda', desc: 'Projeções preditivas e sugestões de compra' },
                { key: 'fornecedores', label: 'Gestão de Fornecedores', desc: 'Histórico de lead time e contatos de fabricantes' },
                { key: 'usuarios', label: 'Administração & Usuários', desc: 'Gestão de acessos, auditoria e parâmetros do sistema' },
              ].map((p) => {
                const ativo = permissoes[p.key];
                return (
                  <div
                    key={p.key}
                    onClick={() => togglePermissao(p.key)}
                    className="flex items-center justify-between p-3 hover:bg-slate-50/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{p.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                    </div>

                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={() => {}} // tratado no wrapper onClick
                      className="w-4 h-4 rounded border-slate-300 text-[#c8672b] focus:ring-[#c8672b] cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações do Rodapé */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
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
              className="px-5 py-2 bg-[#c8672b] hover:bg-[#b0561e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {salvando ? 'Salvando...' : 'Confirmar Cadastro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
