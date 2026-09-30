// Dados de demonstração (espelham o layout do Figma).
// Usados como fallback quando o Supabase não responde ou não tem peças cadastradas.

export const dashboardMock = {
  kpis: {
    volume: { valor: 285, delta: 3.2 },
    giroMedio: { valor: 6.3, delta: 0.8 },
    rupturas: { valor: 2, delta: 2 },
    atencao: { valor: 2, delta: 0 },
  },
  alertas: [
    {
      id: 'mock-ruptura',
      tipo: 'ruptura',
      codigo: 'FRE-0142',
      titulo: 'Pastilha de Freio Traseira EV',
      descricao: 'Apenas 8 unidades. Risco de desabastecimento em 5 dias com demanda atual.',
      confianca: 97,
    },
    {
      id: 'mock-atencao',
      tipo: 'atencao',
      codigo: 'AMA-0089',
      titulo: 'Amortecedor Dianteiro EV',
      descricao: 'Alta de 34% detectada — frota EV crescendo em SP/RJ. Recomenda reforço.',
      confianca: 89,
    },
    {
      id: 'mock-previsao',
      tipo: 'previsao',
      codigo: 'INJ-0921',
      titulo: 'Bico Injetor GDI 4ª Geração',
      descricao: 'Padrão histórico: +28% no 4º trimestre. Janela de compra preventiva em 12 dias.',
      confianca: 94,
    },
  ],
  serie: {
    meses: ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'],
    combustao: [318, 298, 345, 378, 360, 415],
    eletrico: [88, 115, 150, 200, 228, 275],
    moto: [98, 92, 104, 122, 118, 140],
  },
  criticos: [
    { id: 1, nome: 'Pastilha de Freio Traseira EV', codigo: 'FRE-0142', quantidade: 8, pontoReposicao: 20, status: 'critico' },
    { id: 2, nome: 'Amortecedor Dianteiro EV', codigo: 'AMA-0089', quantidade: 4, pontoReposicao: 12, status: 'critico' },
    { id: 3, nome: 'Sensor ABS Roda Dianteira', codigo: 'VEL-1122', quantidade: 27, pontoReposicao: 30, status: 'atencao' },
    { id: 4, nome: 'Caixa de Direção Hidráulica', codigo: 'TRQ-0077', quantidade: 9, pontoReposicao: 10, status: 'atencao' },
  ],
  maiorGiro: [
    { id: 1, nome: 'Pastilha de Freio Traseira EV', giro: 12.4 },
    { id: 2, nome: 'Filtro de Óleo Sintético', giro: 8.7 },
    { id: 3, nome: 'Bico Injetor GDI 4ª Geração', giro: 7.2 },
    { id: 4, nome: 'Bateria Selada Moto 9Ah', giro: 6.2 },
  ],
};
