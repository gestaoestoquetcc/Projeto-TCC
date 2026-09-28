import React, { useState } from 'react';
import { 
  FiX, 
  FiPlus, 
  FiPackage, 
  FiZap 
} from 'react-icons/fi';
import { 
  RiGasStationLine, 
  RiMotorbikeLine 
} from 'react-icons/ri';

export default function NovaPecaModal({ isOpen, onClose, onSalvar }) {
  const [formData, setFormData] = useState({
    codigo: '',
    oem: '',
    nome: '',
    fabricante: '',
    segmento: 'combustao',
    quantidade: '',
    pontoReposicao: '',
    giro: '4.5x'
  });

  const [errors, setErrors] = useState({});

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
  };

  const handleSelectSegmento = (segmento) => {
    setFormData((prev) => ({ ...prev, segmento }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.codigo.trim()) newErrors.codigo = 'Código é obrigatório';
    if (!formData.nome.trim()) newErrors.nome = 'Nome da peça é obrigatório';
    if (!formData.fabricante.trim()) newErrors.fabricante = 'Fabricante é obrigatório';
    if (formData.quantidade === '' || isNaN(formData.quantidade)) {
      newErrors.quantidade = 'Informe a quantidade';
    }
    if (formData.pontoReposicao === '' || isNaN(formData.pontoReposicao)) {
      newErrors.pontoReposicao = 'Informe o ponto de reposição';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const qtd = Number(formData.quantidade);
    const pontoRep = Number(formData.pontoReposicao);

    // Calcular status dinâmico
    let status = 'normal';
    if (qtd <= pontoRep) {
      status = 'critico';
    } else if (qtd <= pontoRep * 1.25) {
      status = 'atencao';
    }

    const newPeca = {
      id: Date.now().toString(),
      codigo: formData.codigo.toUpperCase().trim(),
      oem: formData.oem.trim() || 'N/A',
      nome: formData.nome.trim(),
      fabricante: formData.fabricante.trim(),
      segmento: formData.segmento,
      quantidade: qtd,
      pontoReposicao: pontoRep,
      giro: formData.giro.includes('x') ? formData.giro : `${formData.giro}x`,
      status
    };

    onSalvar(newPeca);
    onClose();
    // Reset form
    setFormData({
      codigo: '',
      oem: '',
      nome: '',
      fabricante: '',
      segmento: 'combustao',
      quantidade: '',
      pontoReposicao: '',
      giro: '4.5x'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
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
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Cadastrar Nova Peça</h3>
              <p className="text-xs text-gray-500">Adicione um novo item ao inventário do AutoStock</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#ece7de] transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Segment Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Segmento da Peça
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectSegmento('combustao')}
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
                onClick={() => handleSelectSegmento('eletrico')}
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
                onClick={() => handleSelectSegmento('moto')}
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

          {/* Row 1: Códigos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Código Interno (SKU) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="codigo"
                placeholder="Ex: FRE-0142"
                value={formData.codigo}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.codigo ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.codigo && <span className="text-[11px] text-red-500 mt-1 block">{errors.codigo}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Código OEM
              </label>
              <input
                type="text"
                name="oem"
                placeholder="Ex: 04466-0K063"
                value={formData.oem}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-mono"
              />
            </div>
          </div>

          {/* Row 2: Nome da Peça */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nome da Peça <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nome"
              placeholder="Ex: Pastilha de Freio Traseira EV"
              value={formData.nome}
              onChange={handleChange}
              className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                errors.nome ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
              }`}
            />
            {errors.nome && <span className="text-[11px] text-red-500 mt-1 block">{errors.nome}</span>}
          </div>

          {/* Row 3: Fabricante & Giro */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Fabricante / Marca <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fabricante"
                placeholder="Ex: Bosch Auto Parts"
                value={formData.fabricante}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.fabricante ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.fabricante && <span className="text-[11px] text-red-500 mt-1 block">{errors.fabricante}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Giro Estimado
              </label>
              <input
                type="text"
                name="giro"
                placeholder="Ex: 5.4x"
                value={formData.giro}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm bg-white rounded-lg border border-[#dcd6ca] outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all"
              />
            </div>
          </div>

          {/* Row 4: Quantidade & Ponto Reposição */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Qtd em Estoque <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="quantidade"
                placeholder="Ex: 25"
                value={formData.quantidade}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.quantidade ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.quantidade && <span className="text-[11px] text-red-500 mt-1 block">{errors.quantidade}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ponto de Reposição <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                name="pontoReposicao"
                placeholder="Ex: 15"
                value={formData.pontoReposicao}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border outline-none transition-all ${
                  errors.pontoReposicao ? 'border-red-400 focus:ring-1 focus:ring-red-400' : 'border-[#dcd6ca] focus:border-amber-600 focus:ring-1 focus:ring-amber-600'
                }`}
              />
              {errors.pontoReposicao && <span className="text-[11px] text-red-500 mt-1 block">{errors.pontoReposicao}</span>}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#ece7de]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#c8672b] hover:bg-[#b55a22] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <FiPlus className="w-4 h-4" />
              Salvar Peça
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
