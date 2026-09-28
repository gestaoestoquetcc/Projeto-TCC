import React from 'react';
import { 
  FiChevronRight, 
  FiZap 
} from 'react-icons/fi';
import { 
  RiGasStationLine, 
  RiMotorbikeLine 
} from 'react-icons/ri';

export default function PecasTable({ pecas = [], onSelectPeca }) {
  const renderSegmentBadge = (segmento) => {
    switch (segmento?.toLowerCase()) {
      case 'eletrico':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#eef5fc] text-[#1e6fbe] border border-[#d3e5f7]">
            <FiZap className="w-3 h-3 text-[#1e6fbe]" />
            ELÉTRICO
          </span>
        );
      case 'combustao':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#fcf5ec] text-[#b36d1b] border border-[#f4e2cb]">
            <RiGasStationLine className="w-3 h-3 text-[#b36d1b]" />
            COMBUSTÃO
          </span>
        );
      case 'moto':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f2f4f6] text-[#4b5563] border border-[#e1e4e8]">
            <RiMotorbikeLine className="w-3 h-3 text-[#4b5563]" />
            MOTO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
            {segmento?.toUpperCase() || '-'}
          </span>
        );
    }
  };

  const renderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
            CRÍTICO
          </span>
        );
      case 'atencao':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
            ATENÇÃO
          </span>
        );
      case 'normal':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
            NORMAL
          </span>
        );
    }
  };

  const getRepositionBarColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critico':
        return 'bg-[#dc2626]';
      case 'atencao':
        return 'bg-[#d97706]';
      case 'normal':
      default:
        return 'bg-[#16a34a]';
    }
  };

  if (pecas.length === 0) {
    return (
      <div className="bg-white/80 rounded-xl p-12 text-center border border-[#e8e4db] shadow-xs">
        <p className="text-gray-500 font-medium text-sm">
          Nenhuma peça encontrada com os filtros informados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-transparent overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#e5e0d5] text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <th className="py-3 px-4 font-semibold">Código</th>
            <th className="py-3 px-4 font-semibold">Peça</th>
            <th className="py-3 px-4 font-semibold">Segmento</th>
            <th className="py-3 px-4 font-semibold text-center">Qtd</th>
            <th className="py-3 px-4 font-semibold">Ponto Rep.</th>
            <th className="py-3 px-4 font-semibold text-center">Giro</th>
            <th className="py-3 px-4 font-semibold text-center">Status</th>
            <th className="py-3 px-2 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#ece7dd]">
          {pecas.map((peca) => {
            const isCritico = peca.status === 'critico' || peca.quantidade <= peca.pontoReposicao;

            return (
              <tr 
                key={peca.id}
                onClick={() => onSelectPeca && onSelectPeca(peca)}
                className="group hover:bg-[#eae5da]/40 transition-colors cursor-pointer"
              >
                {/* Código */}
                <td className="py-4 px-4 align-middle">
                  <div className="font-bold text-sm text-[#b85824] tracking-tight">
                    {peca.codigo}
                  </div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                    {peca.oem}
                  </div>
                </td>

                {/* Peça & Fabricante */}
                <td className="py-4 px-4 align-middle">
                  <div className="font-semibold text-sm text-gray-900 group-hover:text-amber-900 transition-colors">
                    {peca.nome}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {peca.fabricante}
                  </div>
                </td>

                {/* Segmento */}
                <td className="py-4 px-4 align-middle whitespace-nowrap">
                  {renderSegmentBadge(peca.segmento)}
                </td>

                {/* Quantidade */}
                <td className="py-4 px-4 align-middle text-center">
                  <span className={`text-base font-extrabold ${
                    isCritico ? 'text-[#dc2626]' : 'text-gray-900'
                  }`}>
                    {peca.quantidade}
                  </span>
                </td>

                {/* Ponto de Reposição */}
                <td className="py-4 px-4 align-middle whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {/* Linha indicadora curta como no design */}
                    <div className="w-8 h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div className={`h-full w-full ${getRepositionBarColor(peca.status)}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      {peca.pontoReposicao}
                    </span>
                  </div>
                </td>

                {/* Giro */}
                <td className="py-4 px-4 align-middle text-center">
                  <span className="text-sm font-medium text-gray-600">
                    {peca.giro}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-4 align-middle text-center whitespace-nowrap">
                  {renderStatusBadge(peca.status)}
                </td>

                {/* Ação / Chevron */}
                <td className="py-4 px-2 align-middle text-right text-gray-300 group-hover:text-gray-500 transition-colors">
                  <FiChevronRight className="w-4 h-4 ml-auto" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
