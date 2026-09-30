import React, { useState } from 'react';
import { FiSliders, FiCheck, FiRefreshCw, FiZap } from 'react-icons/fi';

export default function SimuladorParametros({ onAplicarParametros }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modo, setModo] = useState('equilibrado'); // 'conservador', 'equilibrado', 'agressivo'
  const [bufferSeguranca, setBufferSeguranca] = useState(20);
  const [crescimentoFrotaEV, setCrescimentoFrotaEV] = useState(34);

  const handleAplicar = () => {
    if (onAplicarParametros) {
      onAplicarParametros({
        modo,
        bufferSeguranca,
        crescimentoFrotaEV
      });
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    setModo('equilibrado');
    setBufferSeguranca(20);
    setCrescimentoFrotaEV(34);
  };

  return (
    <div className="bg-gradient-to-br from-white to-[#fbf9f4] border border-[#e5dfd4] rounded-xl p-5 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0">
            <FiSliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                Simulador de Sensibilidade do Motor Preditivo
              </h3>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Parâmetros de IA
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Ajuste as variáveis de ponderação estatística e veja os impactos no cálculo de reposição.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="px-3.5 py-1.5 rounded-lg border border-[#e5dfd4] text-xs font-bold text-gray-700 hover:bg-gray-50 bg-white shadow-2xs transition-colors shrink-0"
        >
          {isOpen ? 'Recolher Simulador' : 'Ajustar Parâmetros'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-4 border-t border-[#ece7de] space-y-4 animate-in fade-in duration-150">
          {/* Seletor de Modo de Operação */}
          <div>
            <label className="block text-[11px] font-mono tracking-wider text-gray-500 uppercase font-semibold mb-2">
              Estratégia do Modelo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'conservador', label: 'Conservador', desc: 'Menor imobilização de capital financeiro' },
                { id: 'equilibrado', label: 'Equilibrado (Recomendado)', desc: 'Otimização máxima de giro e ruptura' },
                { id: 'agressivo', label: 'Agressivo / Zero Ruptura', desc: 'Prioridade máxima em disponibilidade imediata' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModo(item.id)}
                  className={`p-3 rounded-lg text-left border transition-all ${
                    modo === item.id
                      ? 'bg-[#e6f7f3] border-[#99f6e4] ring-1 ring-[#99f6e4] shadow-xs'
                      : 'bg-white border-[#e5dfd4] hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-xs font-bold block ${modo === item.id ? 'text-[#0d9488]' : 'text-gray-900'}`}>
                    {item.label}
                  </span>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Interativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="bg-white p-3.5 rounded-lg border border-[#e5dfd4]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-gray-700">Margem de Segurança (Buffer)</span>
                <span className="text-xs font-mono font-bold text-teal-800">{bufferSeguranca}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="5"
                value={bufferSeguranca}
                onChange={(e) => setBufferSeguranca(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <span className="text-[10px] text-gray-400 block mt-1">
                Adiciona cobertura extra contra atrasos na entrega dos fornecedores.
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-[#e5dfd4]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-gray-700">Índice de Adoção de Frota EV Regional</span>
                <span className="text-xs font-mono font-bold text-teal-800">+{crescimentoFrotaEV}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="2"
                value={crescimentoFrotaEV}
                onChange={(e) => setCrescimentoFrotaEV(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <span className="text-[10px] text-gray-400 block mt-1">
                Pondera o peso do segmento elétrico nas estimativas das próximas semanas.
              </span>
            </div>
          </div>

          {/* Ações do Simulador */}
          <div className="flex justify-end items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 transition-colors"
            >
              <FiRefreshCw className="w-3 h-3" />
              Restaurar Padrão v3.2
            </button>
            <button
              type="button"
              onClick={handleAplicar}
              className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FiCheck className="w-3.5 h-3.5" />
              Aplicar ao Modelo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
