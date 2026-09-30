import React from 'react';
import { 
  FiX, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiClock, 
  FiCheckCircle, 
  FiStar, 
  FiBox, 
  FiShoppingBag,
  FiArrowRight 
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function DetalheFornecedorModal({ fornecedor, onClose }) {
  const navigate = useNavigate();
  if (!fornecedor) return null;

  const initialLetter = fornecedor.nome?.charAt(0) || 'F';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative bg-[#fcfbfa] border border-[#e5dfd5] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ece7de]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#f5ebe1] border border-[#ecdac8] text-[#b36d1b] font-black text-lg flex items-center justify-center shadow-2xs">
              {initialLetter}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                {fornecedor.nome}
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {fornecedor.cnpj}
              </span>
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

        {/* Content Body */}
        <div className="py-4 space-y-4 text-xs">
          {/* Tag de Categoria e Avaliação */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#e5dfd4]">
            <div>
              <span className="text-gray-400 block font-mono text-[10px] uppercase font-bold">
                Linha / Categoria
              </span>
              <span className="font-semibold text-gray-800 text-xs">
                {fornecedor.categoria}
              </span>
            </div>

            <div className="text-right">
              <span className="text-gray-400 block font-mono text-[10px] uppercase font-bold">
                Avaliação Geral
              </span>
              <div className="flex items-center gap-1 mt-0.5 justify-end">
                <span className="font-black text-amber-800 text-sm">{fornecedor.rating}</span>
                <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </div>
            </div>
          </div>

          {/* Métricas de Logística & SLA */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-[#e5dfd4] text-center">
              <FiClock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <span className="text-gray-400 block font-mono text-[10px] uppercase">Lead Time</span>
              <span className="font-black text-gray-900 text-sm">{fornecedor.leadTimeDias} dias</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#e5dfd4] text-center">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-gray-400 block font-mono text-[10px] uppercase">Pontualidade</span>
              <span className="font-black text-emerald-700 text-sm">{fornecedor.pontualidade || '97%'}</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#e5dfd4] text-center">
              <FiBox className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <span className="text-gray-400 block font-mono text-[10px] uppercase">SKUs Ativos</span>
              <span className="font-black text-gray-900 text-sm">{fornecedor.skus} itens</span>
            </div>
          </div>

          {/* Contato & Localização */}
          <div className="p-3 bg-white rounded-xl border border-[#e5dfd4] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <FiMail className="w-3.5 h-3.5 text-gray-400" />
                E-mail:
              </span>
              <a 
                href={`mailto:${fornecedor.contato}`} 
                className="font-mono text-[#b85824] hover:underline font-semibold"
              >
                {fornecedor.contato}
              </a>
            </div>

            {fornecedor.telefone && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                  Telefone:
                </span>
                <span className="font-mono text-gray-800 font-semibold">
                  {fornecedor.telefone}
                </span>
              </div>
            )}

            {fornecedor.cidadeUf && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                  Localização:
                </span>
                <span className="text-gray-700 font-medium">
                  {fornecedor.cidadeUf}
                </span>
              </div>
            )}
          </div>

          {/* Status de Pedidos */}
          <div className="p-3 bg-[#fcf5ec] rounded-xl border border-[#f4e2cb] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiShoppingBag className="w-4 h-4 text-[#b36d1b]" />
              <div>
                <span className="font-bold text-[#b36d1b] block">Pedidos em Aberto</span>
                <span className="text-[11px] text-gray-500">Último recebimento em {fornecedor.ultimoRecebimento}</span>
              </div>
            </div>
            <span className="font-black text-[#b36d1b] text-sm">
              {fornecedor.pedidosAbertos > 0 ? `${fornecedor.pedidosAbertos} aberto` : 'Nenhum'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#ece7de] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/movimentacao');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#c8672b] hover:bg-[#b55a22] rounded-lg transition-colors shadow-xs"
          >
            <span>Registrar Entrada / Pedido</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
