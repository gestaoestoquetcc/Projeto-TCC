import React, { useState } from 'react';
import { FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { CATEGORIAS } from '../../services/financeiroService';

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hojeISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/**
 * Livro caixa: formulário para lançar entradas/saídas de dinheiro
 * e a lista do mês (as vendas aparecem resumidas numa linha só).
 */
export default function PainelCaixa({ t, lancamentos, faturamento, pecasVendidas, onSalvar, onExcluir, bloqueado }) {
  const [tipo, setTipo] = useState('saida');
  const [form, setForm] = useState({ descricao: '', valor: '', categoria: CATEGORIAS.saida[0], data: hojeISO() });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState({ tipo: '', texto: '' });
  const [apagando, setApagando] = useState(null);

  const mudar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  function trocarTipo(novo) {
    setTipo(novo);
    setForm((f) => ({ ...f, categoria: CATEGORIAS[novo][0] }));
  }

  async function enviar(e) {
    e.preventDefault();
    setMsg({ tipo: '', texto: '' });
    setSalvando(true);
    try {
      const valor = Number(String(form.valor).replace(/\./g, '').replace(',', '.'));
      await onSalvar({ tipo, ...form, valor });
      setForm((f) => ({ ...f, descricao: '', valor: '' }));
      setMsg({ tipo: 'ok', texto: tipo === 'entrada' ? 'Entrada lançada no caixa.' : 'Saída lançada no caixa.' });
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  }

  const campo = `w-full h-10 rounded-lg border px-3 text-sm outline-none focus:border-[#c8672b] focus:ring-2 focus:ring-[#c8672b]/20 bg-transparent ${t.card} ${t.textoForte}`;
  const rotulo = `text-[10px] font-mono font-bold tracking-widest uppercase block mb-1 ${t.textoSuave}`;

  return (
    <section className={`border rounded-xl shadow-xs p-6 flex flex-col gap-5 ${t.card}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={`text-sm font-bold ${t.textoForte}`}>Livro caixa</h2>
        <span className={`text-[11px] font-mono ${t.textoSuave}`}>vendas entram sozinhas</span>
      </div>

      {/* Formulário */}
      <form onSubmit={enviar} className="flex flex-col gap-3" noValidate>
        <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg border ${t.abas}`}>
          {[
            { id: 'saida', texto: 'Saída (paguei)', icone: FiMinus, cor: 'text-[#d64545]' },
            { id: 'entrada', texto: 'Entrada (recebi)', icone: FiPlus, cor: 'text-[#2f9e5b]' },
          ].map((op) => {
            const Icone = op.icone;
            const ativo = tipo === op.id;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => trocarTipo(op.id)}
                aria-pressed={ativo}
                className={`h-9 rounded-md text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  ativo ? `${t.card} border shadow-sm ${op.cor}` : t.abaInativa
                }`}
              >
                <Icone className="w-3.5 h-3.5" /> {op.texto}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="cx-desc" className={rotulo}>Descrição</label>
            <input id="cx-desc" className={campo} maxLength={80} placeholder={tipo === 'saida' ? 'Ex.: Aluguel de outubro' : 'Ex.: Saldo do caixa em 01/10'} value={form.descricao} onChange={mudar('descricao')} disabled={bloqueado} />
          </div>
          <div>
            <label htmlFor="cx-valor" className={rotulo}>Valor (R$)</label>
            <input id="cx-valor" className={`${campo} font-mono`} inputMode="decimal" placeholder="0,00" value={form.valor} onChange={mudar('valor')} disabled={bloqueado} />
          </div>
          <div>
            <label htmlFor="cx-data" className={rotulo}>Data</label>
            <input id="cx-data" type="date" className={campo} value={form.data} onChange={mudar('data')} disabled={bloqueado} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="cx-cat" className={rotulo}>Categoria</label>
            <select id="cx-cat" className={campo} value={form.categoria} onChange={mudar('categoria')} disabled={bloqueado}>
              {CATEGORIAS[tipo].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={salvando || bloqueado}
            className="h-10 px-5 rounded-lg bg-gradient-to-r from-[#e8772e] to-[#c8672b] hover:from-[#d96b25] hover:to-[#b85b20] text-white text-sm font-bold shadow-sm disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Lançar no caixa'}
          </button>
          {msg.texto && <span className={`text-xs ${msg.tipo === 'ok' ? 'text-[#2f9e5b]' : 'text-[#d64545]'}`}>{msg.texto}</span>}
        </div>
      </form>

      {/* Lista do mês */}
      <div className={`h-px ${t.linhaDivisoria}`} />
      <ul className="flex flex-col">
        <li className="flex items-center gap-3 py-2.5">
          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#2f9e5b] flex items-center justify-center shrink-0">
            <FiShoppingBag className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <span className={`block text-sm font-semibold ${t.textoForte}`}>Vendas do mês</span>
            <span className={`block text-[11px] ${t.textoSuave}`}>{pecasVendidas} peças pelas saídas de estoque</span>
          </div>
          <span className="text-sm font-mono font-bold text-[#2f9e5b] whitespace-nowrap">+ {brl(faturamento)}</span>
        </li>

        {lancamentos.length === 0 && (
          <li className={`text-xs py-4 text-center ${t.textoSuave}`}>
            Nenhum lançamento no caixa neste mês. Lance aluguel, compras de peças e outras despesas para ver o lucro real.
          </li>
        )}

        {lancamentos.map((l) => (
          <li key={l.id} className={`flex items-center gap-3 py-2.5 border-t border-dashed ${t.card}`}>
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                l.tipo === 'entrada' ? 'bg-emerald-500/10 text-[#2f9e5b]' : 'bg-red-500/10 text-[#d64545]'
              }`}
            >
              {l.tipo === 'entrada' ? <FiPlus className="w-4 h-4" /> : <FiMinus className="w-4 h-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold break-words ${t.textoForte}`}>{l.descricao}</span>
              <span className={`block text-[11px] ${t.textoSuave}`}>
                {l.categoria} · {new Date(`${l.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            <span className={`text-sm font-mono font-bold whitespace-nowrap ${l.tipo === 'entrada' ? 'text-[#2f9e5b]' : 'text-[#d64545]'}`}>
              {l.tipo === 'entrada' ? '+ ' : '− '}
              {brl(l.valor)}
            </span>
            {apagando === l.id ? (
              <span className="flex items-center gap-1 text-[11px]">
                <button type="button" onClick={() => { setApagando(null); onExcluir(l.id); }} className="px-2 py-1 rounded bg-[#d64545] text-white font-bold">
                  Apagar
                </button>
                <button type="button" onClick={() => setApagando(null)} className={`px-2 py-1 rounded border ${t.card} ${t.textoSuave}`}>
                  Não
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setApagando(l.id)}
                title="Apagar lançamento"
                aria-label={`Apagar ${l.descricao}`}
                className={`w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-500/10 hover:text-[#d64545] ${t.textoFraco}`}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
