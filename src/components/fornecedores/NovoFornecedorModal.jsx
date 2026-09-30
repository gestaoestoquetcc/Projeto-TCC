import React, { useState } from 'react';
import { FiX, FiPlus, FiTruck, FiStar } from 'react-icons/fi';

export default function NovoFornecedorModal({ isOpen, onClose, onSalvar }) {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    categoria: '',
    contato: '',
    telefone: '',
    leadTimeDias: '4',
    rating: '5.0',
    cidadeUf: ''
  });

  const [errors, setErrors] = useState({});
  const [salvando, setSalvando] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Máscara básica para CNPJ: 00.000.000/0000-00
    if (name === 'cnpj') {
      value = value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.nome.trim()) errs.nome = 'Nome do fornecedor é obrigatório';
    if (!formData.cnpj.trim()) errs.cnpj = 'CNPJ é obrigatório';
    if (!formData.categoria.trim()) errs.categoria = 'Categoria é obrigatória';
    if (!formData.contato.trim()) errs.contato = 'E-mail de contato é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSalvando(true);
      await onSalvar(formData);
      onClose();
      setFormData({
        nome: '',
        cnpj: '',
        categoria: '',
        contato: '',
        telefone: '',
        leadTimeDias: '4',
        rating: '5.0',
        cidadeUf: ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={() => !salvando && onClose()} 
      />

      {/* Modal Card */}
      <div className="relative bg-[#fcfbfa] border border-[#e5dfd5] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ece7de] bg-[#f5f1e8]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 flex items-center justify-center">
              <FiTruck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Cadastrar Novo Fornecedor</h3>
              <p className="text-xs text-gray-500">Adicione um parceiro à sua rede de suprimentos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#ece7de] transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome e CNPJ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nome / Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nome"
                placeholder="Ex: Brembo Freios Brasil"
                value={formData.nome}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.nome ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.nome && <span className="text-[11px] text-red-500 mt-1 block">{errors.nome}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cnpj"
                placeholder="00.000.000/0001-00"
                value={formData.cnpj}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none font-mono transition-all ${
                  errors.cnpj ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.cnpj && <span className="text-[11px] text-red-500 mt-1 block">{errors.cnpj}</span>}
            </div>
          </div>

          {/* Categoria e Localização */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Categoria / Linha Principal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="categoria"
                placeholder="Ex: Freios / Elétrico"
                value={formData.categoria}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.categoria ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.categoria && <span className="text-[11px] text-red-500 mt-1 block">{errors.categoria}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cidade - UF
              </label>
              <input
                type="text"
                name="cidadeUf"
                placeholder="Ex: Campinas - SP"
                value={formData.cidadeUf}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all"
              />
            </div>
          </div>

          {/* E-mail e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                E-mail de Contato <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="contato"
                placeholder="fornecedores@empresa.com.br"
                value={formData.contato}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none font-mono transition-all ${
                  errors.contato ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.contato && <span className="text-[11px] text-red-500 mt-1 block">{errors.contato}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                name="telefone"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-mono"
              />
            </div>
          </div>

          {/* Lead Time e Avaliação */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Lead Time Médio (Dias)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                name="leadTimeDias"
                value={formData.leadTimeDias}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Avaliação Inicial (1 a 5)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-mono"
                />
                <FiStar className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#ece7de]">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#c8672b] hover:bg-[#b55a22] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            >
              <FiPlus className="w-4 h-4" />
              Salvar Fornecedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
