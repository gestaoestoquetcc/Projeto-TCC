// Edge Function do Supabase: "analise-ia"
// ------------------------------------------------------------
// Ela recebe o resumo das previsões que o site manda e pergunta para a IA
// (Claude, da Anthropic) quais peças comprar primeiro e por quê.
//
// A chave da API fica guardada como "secret" no Supabase, então ela
// NUNCA aparece no código do site (quem abrir o navegador não vê a chave).
//
// Secrets usados:
//   ANTHROPIC_API_KEY  -> sua chave da API (obrigatório)
//   ANTHROPIC_MODEL    -> nome do modelo (opcional; veja os nomes atuais em
//                         https://docs.claude.com/en/docs/about-claude/models)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // O navegador manda um "OPTIONS" antes do POST (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const modelo = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-5';

    if (!apiKey) {
      return resposta({ erro: 'A chave ANTHROPIC_API_KEY não foi configurada no Supabase.' }, 500);
    }

    const { pecas } = await req.json();
    if (!Array.isArray(pecas) || pecas.length === 0) {
      return resposta({ erro: 'Nenhuma peça foi enviada para análise.' }, 400);
    }

    const prompt = `Você é um analista de estoque de uma distribuidora de autopeças (carros a combustão, elétricos e motos).
Abaixo estão as previsões de demanda calculadas pelo sistema para os próximos 30 dias, em JSON.

${JSON.stringify(pecas, null, 2)}

Escreva uma análise curta em português do Brasil, para o gerente de estoque, com:
1. As 3 peças mais urgentes para comprar, com a quantidade sugerida e o motivo.
2. Peças com tendência de alta que merecem atenção.
3. Uma recomendação geral em 1 ou 2 frases.

Regras: use apenas os dados enviados (não invente números), seja direto, sem markdown pesado (pode usar listas com "-"), no máximo 180 palavras.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const dados = await r.json();

    if (!r.ok) {
      console.error('Erro da API:', dados);
      return resposta({ erro: dados?.error?.message ?? 'Erro ao chamar a API da IA.' }, 502);
    }

    const analise = (dados.content ?? [])
      .filter((bloco: { type: string }) => bloco.type === 'text')
      .map((bloco: { text: string }) => bloco.text)
      .join('\n')
      .trim();

    return resposta({ analise });
  } catch (err) {
    console.error(err);
    return resposta({ erro: 'Erro inesperado na função analise-ia.' }, 500);
  }
});

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
