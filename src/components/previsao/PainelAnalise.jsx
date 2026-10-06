import React from 'react';
import {
  FiCpu,
  FiZap,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiTarget,
  FiInfo,
  FiRefreshCw,
  FiShoppingCart,
  FiAlertCircle,
} from 'react-icons/fi';

// Cor de cada posição do ranking, conforme o risco
const COR_RISCO = {
  alto: { numero: 'bg-[#d64545] text-white', barra: 'bg-[#d64545]', borda: 'border-l-[#d64545]' },
  medio: { numero: 'bg-[#c9900c] text-white', barra: 'bg-[#c9900c]', borda: 'border-l-[#c9900c]' },
  baixo: { numero: 'bg-[#2f9e5b] text-white', barra: 'bg-[#2f9e5b]', borda: 'border-l-[#2f9e5b]' },
};

/**
 * Painel "Análise da IA" da tela de Previsão.
 * Recebe a análise pronta (vinda do previsaoService) e só desenha.
 */
export default function PainelAnalise({ t, analise, carregando, erro, onGerar, desabilitado, onComprar }) {
  return (
    <section className={`border rounded-xl shadow-xs flex flex-col overflow-hidden ${t.card}`}>
      {/* Cabeçalho */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e8772e] to-[#b85b20] flex items-center justify-center shadow-sm">
              <FiCpu className="w-4 h-4 text-white" />
            </span>
            <span className={`text-sm font-bold ${t.textoForte}`}>Análise da IA</span>
            {analise && <BadgeOrigem origem={analise.origem} />}
          </div>
          <p className={`text-xs mt-1.5 ${t.textoSuave}`}>O que comprar primeiro e por quê, com base nas previsões.</p>
        </div>
        {analise && (
          <span className={`text-[10px] font-mono shrink-0 mt-1 ${t.textoFraco}`}>
            {analise.geradoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="px-6 flex-1 overflow-y-auto max-h-[440px]">
        {carregando ? (
          <Esqueleto />
        ) : analise ? (
          <Conteudo t={t} analise={analise} onComprar={onComprar} />
        ) : (
          <Vazio t={t} />
        )}

        {erro && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded-lg flex gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{erro}</span>
          </div>
        )}
      </div>

      {/* Botão */}
      <div className="px-6 pb-5 pt-3">
        {analise ? (
          <button
            type="button"
            onClick={onGerar}
            disabled={carregando || desabilitado}
            className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-60 ${t.card} ${t.textoSuave} hover:text-[#c8672b] hover:border-[#c8672b]/50`}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            {carregando ? 'Analisando...' : 'Gerar novamente'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onGerar}
            disabled={carregando || desabilitado}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#e8772e] to-[#c8672b] hover:from-[#d96b25] hover:to-[#b85b20] text-white text-sm font-bold shadow-sm transition-all disabled:opacity-60"
          >
            <FiZap className={`w-4 h-4 ${carregando ? 'animate-pulse' : ''}`} />
            {carregando ? 'A IA está analisando...' : 'Pedir análise à IA'}
          </button>
        )}
      </div>
    </section>
  );
}

// ---------- Partes do painel ----------

function BadgeOrigem({ origem }) {
  if (origem === 'ia') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-[#2f9e5b] border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2f9e5b] animate-pulse" /> IA online
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-[#b36d1b] border border-amber-500/30"
      title="IA externa não configurada: análise feita pelo próprio sistema"
    >
      <FiZap className="w-3 h-3" /> Automática
    </span>
  );
}

function Titulo({ t, icone, children, extra }) {
  const Icone = icone;
  return (
    <div className="flex items-center justify-between mb-2.5">
      <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase ${t.textoSuave}`}>
        <Icone className="w-3.5 h-3.5" />
        {children}
      </span>
      {extra}
    </div>
  );
}

function Conteudo({ t, analise, onComprar }) {
  const { dados, texto, origem } = analise;

  return (
    <div className="space-y-5 pb-2">
      {/* Texto escrito pela IA externa (quando ela estiver configurada) */}
      {origem === 'ia' && texto && (
        <div className={`text-sm leading-relaxed whitespace-pre-line rounded-lg p-3.5 border border-emerald-500/20 bg-emerald-500/[0.04] ${t.textoForte}`}>
          {texto}
        </div>
      )}

      {/* 1. Prioridade de compra */}
      <div>
        <Titulo
          t={t}
          icone={FiShoppingCart}
          extra={
            dados.totalCompra > 0 && (
              <span className="text-[11px] font-mono font-bold text-[#1e6fbe]">total +{dados.totalCompra} un.</span>
            )
          }
        >
          Prioridade de compra
        </Titulo>

        {dados.urgentes.length === 0 ? (
          <p className={`text-xs py-2 ${t.textoSuave}`}>Nenhuma compra urgente no momento. ✓</p>
        ) : (
          <ol className="space-y-2">
            {dados.urgentes.map((p, i) => {
              const cor = COR_RISCO[p.risco] || COR_RISCO.medio;
              const nivel = Math.min(100, Math.round((p.quantidade / (p.minimo || 1)) * 100));
              return (
                <li
                  key={p.id}
                  className={`group flex items-center gap-3 p-3 rounded-lg border border-l-4 ${cor.borda} ${t.card} hover:shadow-sm transition-shadow`}
                >
                  <span className={`w-6 h-6 shrink-0 rounded-full text-xs font-black flex items-center justify-center ${cor.numero}`}>
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-semibold truncate ${t.textoForte}`}>{p.nome}</span>
                      <span className="text-[10px] font-mono text-[#b85824] shrink-0">{p.codigo}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          p.tipoMotivo === 'critico' ? 'text-[#d64545]' : 'text-[#c9900c]'
                        }`}
                      >
                        {p.tipoMotivo === 'critico' ? <FiAlertTriangle className="w-3 h-3" /> : <FiClock className="w-3 h-3" />}
                        {p.motivo}
                      </span>
                      <span className="flex-1 max-w-[90px] h-1 rounded-full bg-gray-500/15 overflow-hidden" title={`${p.quantidade} de ${p.minimo} un.`}>
                        <span className={`block h-full ${cor.barra}`} style={{ width: `${Math.max(4, nivel)}%` }} />
                      </span>
                      <span className={`text-[10px] font-mono ${t.textoFraco}`}>
                        {p.quantidade}/{p.minimo}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onComprar}
                    title="Registrar recebimento"
                    className="shrink-0 px-2.5 py-1 rounded-md bg-[#1e6fbe]/10 text-[#1e6fbe] text-xs font-mono font-bold hover:bg-[#1e6fbe] hover:text-white transition-colors"
                  >
                    +{p.compra}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* 2. Em alta */}
      {dados.emAlta.length > 0 && (
        <div>
          <Titulo t={t} icone={FiTrendingUp}>
            Demanda em alta
          </Titulo>
          <div className="flex flex-wrap gap-2">
            {dados.emAlta.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border text-xs ${t.card} ${t.textoForte}`}
              >
                {p.nome}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#d64545]/10 text-[#d64545] text-[10px] font-mono font-bold">
                  <FiTrendingUp className="w-2.5 h-2.5" /> {p.variacao}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Recomendação */}
      <div className="rounded-lg p-3.5 bg-gradient-to-br from-[#e8772e]/10 to-[#e8772e]/[0.03] border border-[#e8772e]/25">
        <div className="flex gap-2.5">
          <FiTarget className="w-4 h-4 text-[#c8672b] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#c8672b] block mb-1">Recomendação</span>
            <p className={`text-sm leading-snug ${t.textoForte}`}>{dados.recomendacao}</p>
          </div>
        </div>
      </div>

      {dados.observacao && (
        <p className={`text-[11px] flex items-start gap-1.5 ${t.textoFraco}`}>
          <FiInfo className="w-3.5 h-3.5 shrink-0 mt-px" />
          {dados.observacao}
        </p>
      )}
    </div>
  );
}

// Enquanto carrega: "esqueleto" piscando
function Esqueleto() {
  return (
    <div className="space-y-3 pb-4 animate-pulse">
      <div className="h-3 w-32 rounded bg-gray-500/20" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-500/15">
          <div className="w-6 h-6 rounded-full bg-gray-500/20" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-gray-500/20" />
            <div className="h-2 w-1/2 rounded bg-gray-500/15" />
          </div>
          <div className="w-10 h-6 rounded bg-gray-500/20" />
        </div>
      ))}
      <div className="h-16 rounded-lg bg-gray-500/10" />
    </div>
  );
}

// Antes de pedir a análise
function Vazio({ t }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 ${t.textoFraco}`}>
      <div className="relative mb-3">
        <span className="absolute inset-0 rounded-2xl bg-[#e8772e]/20 blur-md" />
        <span className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e8772e]/15 to-[#e8772e]/5 border border-[#e8772e]/25 flex items-center justify-center">
          <FiCpu className="w-6 h-6 text-[#c8672b]" />
        </span>
      </div>
      <p className={`text-sm font-semibold ${t.textoForte}`}>Pronto para analisar</p>
      <p className="text-xs mt-1 max-w-[240px]">
        Clique no botão abaixo para ver o ranking de compras, as peças em alta e a recomendação da semana.
      </p>
    </div>
  );
}
