import React, { useState } from 'react';
import { 
  FiX, 
  FiPlus, 
  FiPackage, 
  FiZap,
  FiLoader
} from 'react-icons/fi';
import { 
  RiGasStationLine, 
  RiMotorbikeLine 
} from 'react-icons/ri';

export default function NovaPecaModal({ isOpen, onClose, onSalvar }) {
  const [formData, setFormData] = useState({
    sku: '',
    nome: '',
    categoria: 'Combustão',
    segmento: 'combustao',
    quantidade_atual: '',
    estoque_minimo: '',
    preco_venda: ''
  });

  const [errors, setErrors] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroApi, setErroApi] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (erroApi) setErroApi('');
  };

  const handleSelectSegmento = (segmento, categoriaNome) => {
    setFormData((prev) => ({ 
      ...prev, 
      segmento,
      categoria: categoriaNome 
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sku.trim()) newErrors.sku = 'Código / SKU é obrigatório';
    if (!formData.nome.trim()) newErrors.nome = 'Nome da peça é obrigatório';
    if (formData.quantidade_atual === '' || isNaN(formData.quantidade_atual)) {
      newErrors.quantidade_atual = 'Informe a quantidade atual';
    }
    if (formData.estoque_minimo === '' || isNaN(formData.estoque_minimo)) {
      newErrors.estoque_minimo = 'Informe o estoque mínimo / reposição';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSalvando(true);
      setErroApi('');

      await onSalvar({
        sku: formData.sku.toUpperCase().trim(),
        nome: formData.nome.trim(),
        categoria: formData.categoria || 'Combustão',
        quantidade_atual: Number(formData.quantidade_atual),
        estoque_minimo: Number(formData.estoque_minimo),
        preco_venda: formData.preco_venda ? Number(formData.preco_venda) : 0
      });

      // Fechar e resetar form
      onClose();
      setFormData({
        sku: '',
        nome: '',
        categoria: 'Combustão',
        segmento: 'combustao',
        quantidade_atual: '',
        estoque_minimo: '',
        preco_venda: ''
      });
    } catch (err) {
      console.error(err);
      setErroApi(err.message || 'Erro ao salvar no Supabase. Verifique os dados.');
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#ece7de] bg-[#f5f1e8]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-700 flex items-center justify-center">
              <FiPackage className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Cadastrar Nova Peça no Supabase</h3>
              <p className="text-xs text-gray-500">O item será salvo diretamente no banco de dados</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#ece7de] transition-colors disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erroApi && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {erroApi}
            </div>
          )}

          {/* Segment Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Categoria / Segmento
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectSegmento('combustao', 'Combustão')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  formData.segmento === 'combustao'
                    ? 'bg-[#fcf5ec] text-[#b36d1b] border-[#e8cda8] shadow-xs ring-1 ring-[#e8cda8]'
                    : 'bg-white text-gray-600 border-[#e5dfd5] hover:bg-gray-50'
                }`}
              >
                <RiGasStationLine className="w-3.5 h-3.5" />
                Combustão
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegmento('eletrico', 'Eletrica')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  formData.segmento === 'eletrico'
                    ? 'bg-[#eef5fc] text-[#1e6fbe] border-[#bad7f5] shadow-xs ring-1 ring-[#bad7f5]'
                    : 'bg-white text-gray-600 border-[#e5dfd5] hover:bg-gray-50'
                }`}
              >
                <FiZap className="w-3.5 h-3.5" />
                Elétrico (EV)
              </button>

              <button
                type="button"
                onClick={() => handleSelectSegmento('moto', 'Moto')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  formData.segmento === 'moto'
                    ? 'bg-[#f2f4f6] text-[#4b5563] border-[#cfd4dc] shadow-xs ring-1 ring-[#cfd4dc]'
                    : 'bg-white text-gray-600 border-[#e5dfd5] hover:bg-gray-50'
                }`}
              >
                <RiMotorbikeLine className="w-3.5 h-3.5" />
                Moto
              </button>
            </div>
          </div>

          {/* Row 1: SKU & Nome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Código / SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                placeholder="Ex: PAST-G5-DIANT"
                value={formData.sku}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none font-mono uppercase transition-all ${
                  errors.sku ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.sku && <span className="text-[11px] text-red-500 mt-1 block">{errors.sku}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nome da Peça <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nome"
                placeholder="Ex: Pastilha de Freio Dianteira"
                value={formData.nome}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.nome ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.nome && <span className="text-[11px] text-red-500 mt-1 block">{errors.nome}</span>}
            </div>
          </div>

          {/* Row 2: Quantidade, Estoque Mínimo & Preço de Venda */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Qtd Atual <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="quantidade_atual"
                placeholder="Ex: 15"
                value={formData.quantidade_atual}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.quantidade_atual ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.quantidade_atual && <span className="text-[11px] text-red-500 mt-1 block">{errors.quantidade_atual}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Estoque Mín. <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                name="estoque_minimo"
                placeholder="Ex: 5"
                value={formData.estoque_minimo}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.estoque_minimo ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.estoque_minimo && <span className="text-[11px] text-red-500 mt-1 block">{errors.estoque_minimo}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preço Venda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="preco_venda"
                placeholder="Ex: 89.90"
                value={formData.preco_venda}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#ece7de]">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#c8672b] hover:bg-[#b55a22] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-70"
            >
              {salvando ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <FiPlus className="w-4 h-4" />
                  Salvar no Supabase
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
