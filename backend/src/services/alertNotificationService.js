const { pool } = require('../db/pool');
const { hfToken, mlAlertRefreshDays, mlClassificationUrl } = require('../config/env');
const { ApiError } = require('../utils/apiError');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const cache = {
  updatedAt: null,
  expiresAt: null,
  alerts: [],
  metrics: null,
  ml: {
    connected: false,
    message: 'Modelo de ML ainda nao consultado.'
  },
  source: 'empty'
};
let refreshInProgress = null;

function parseJsonResponse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return {
      message: text.slice(0, 300),
      raw: text
    };
  }
}

function addDays(date, days) {
  return new Date(date.getTime() + days * ONE_DAY_MS);
}

function cacheIsFresh() {
  return cache.expiresAt && cache.expiresAt.getTime() > Date.now();
}

async function loadInventorySnapshot() {
  const { rows } = await pool.query(
    `SELECT
       p.id_produto,
       p.nome_produto,
       p.codigo_barras,
       p.numero_lote,
       p.data_validade,
       p.quantidade,
       p.estoque_minimo,
       p.categoria,
       p.armazenamento,
       p.localizacao,
       p.criado_em,
       p.atualizado_em,
       COALESCE(cd.consumo_medio, 0)::float AS consumo_medio,
       COALESCE(SUM(m.quantidade_movimentada)
         FILTER (WHERE m.tipo_movimentacao = 'entrada'), 0)::float AS total_entradas,
       COALESCE(SUM(m.quantidade_movimentada)
         FILTER (WHERE m.tipo_movimentacao = 'saida'), 0)::float AS total_saidas,
       COUNT(m.id_movimentacao)::int AS qtd_movimentacoes,
       MIN(m.data_movimentacao) AS primeira_movimentacao,
       MAX(m.data_movimentacao) AS ultima_movimentacao,
       MAX(m.data_movimentacao)
         FILTER (WHERE m.tipo_movimentacao = 'saida') AS ultima_saida
     FROM tb_produtos p
     LEFT JOIN tb_consumo_diario cd ON cd.id_produto = p.id_produto
     LEFT JOIN tb_movimentacoes m ON m.id_produto = p.id_produto
     GROUP BY p.id_produto, cd.consumo_medio
     ORDER BY p.data_validade ASC, p.nome_produto ASC, p.numero_lote ASC`
  );

  return rows;
}

async function requestCloudClassification(lotes) {
  if (!mlClassificationUrl) {
    throw new ApiError(
      503,
      'ML_CLASSIFICATION_URL nao configurada. Publique o modelo Python na nuvem e informe a URL do endpoint /predict.'
    );
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    lotes
  };

  if (mlClassificationUrl.includes('/gradio_api/call/')) {
    return requestGradioClassification(payload);
  }

  const response = await fetch(mlClassificationUrl, {
    method: 'POST',
    headers: buildCloudHeaders(),
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const data = parseJsonResponse(text);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || 'Nao foi possivel obter classificacoes do modelo em nuvem.',
      data?.details
    );
  }

  return data;
}

function buildCloudHeaders(extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    ...(hfToken ? { Authorization: `Bearer ${hfToken}` } : {}),
    ...extraHeaders
  };
}

async function requestGradioClassification(payload) {
  const response = await fetch(mlClassificationUrl, {
    method: 'POST',
    headers: buildCloudHeaders(),
    body: JSON.stringify({ data: [payload] })
  });

  const text = await response.text();
  const data = parseJsonResponse(text);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.message || 'Nao foi possivel iniciar a classificacao no Space do Hugging Face.',
      data?.details
    );
  }

  const eventId = data?.event_id;
  if (!eventId) {
    return normalizeGradioResponse(data);
  }

  const eventResponse = await fetch(`${mlClassificationUrl}/${eventId}`, {
    method: 'GET',
    headers: buildCloudHeaders({ Accept: 'text/event-stream' })
  });

  const eventText = await eventResponse.text();
  const eventError = parseJsonResponse(eventText);

  if (!eventResponse.ok) {
    throw new ApiError(
      eventResponse.status,
      'Nao foi possivel receber o resultado da classificacao no Space do Hugging Face.',
      eventError?.message || eventText
    );
  }

  return normalizeGradioResponse(parseGradioEventStream(eventText));
}

function parseGradioEventStream(eventText) {
  if (eventText.includes('event: error')) {
    const errorLine = eventText
      .split(/\r?\n/)
      .find((line) => line.startsWith('data: '));
    const errorData = parseJsonResponse(errorLine ? errorLine.slice(6).trim() : '');

    throw new ApiError(
      502,
      errorData?.error || errorData?.message || 'O Space do Hugging Face retornou erro ao processar os lotes.'
    );
  }

  const dataLines = eventText
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6).trim())
    .filter((line) => line && line !== 'null');

  if (!dataLines.length) {
    return null;
  }

  return parseJsonResponse(dataLines[dataLines.length - 1]);
}

function normalizeGradioResponse(data) {
  if (Array.isArray(data)) {
    return data[0];
  }

  if (Array.isArray(data?.data)) {
    return data.data[0];
  }

  return data;
}

function normalizeAlert(item) {
  const classification = item.classificacao_estoque || item.classificacao || item.categoria_alerta || 'Sem classificacao';
  const priorityByClassification = {
    'produto critico': 1,
    'produto atenção alta': 2,
    'produto atenção baixo': 3,
    'produto seguro': 4,
    'produto baixa rotatividade': 5,
    'Produtos Risco': 1,
    'Produto Atenção Alta': 2,
    'Produto Atenção Baixa': 3,
    'Produto Seguro': 4,
    'Produto Baixa Rotatividade': 5
  };

  return {
    id: String(item.id_produto || item.id || `${item.codigo_barras}-${item.numero_lote}`),
    productId: item.id_produto,
    nomeProduto: item.nome_produto,
    codigoBarras: item.codigo_barras,
    numeroLote: item.numero_lote,
    categoria: item.categoria_produto || item.categoria,
    armazenamento: item.armazenamento,
    localizacao: item.localizacao,
    quantidade: Number(item.quantidade_atual ?? item.quantidade ?? 0),
    estoqueMinimo: Number(item.estoque_minimo || 0),
    consumoMedio: Number(item.consumo_medio || 0),
    dataValidade: item.data_validade,
    diasAteVencimento: item.dias_para_vencer ?? item.dias_ate_vencimento,
    diasPrevistosAteZerar: item.dias_previstos_ate_zerar ?? item.dias_estoque_restante,
    dataPrevistaRuptura: item.data_prevista_ruptura,
    classificacao: classification,
    prioridade: Number(item.prioridade_classificacao || item.prioridade || priorityByClassification[classification] || 99),
    atualizadoEm: item.atualizado_em
  };
}

function extractClassifications(response) {
  if (Array.isArray(response)) return response;
  return response?.classifications || response?.classificacoes || response?.results || [];
}

async function refreshAlertNotifications() {
  const lotes = await loadInventorySnapshot();
  const now = new Date();
  let modelResponse;

  try {
    modelResponse = await requestCloudClassification(lotes);
  } catch (error) {
    cache.alerts = [];
    cache.metrics = null;
    cache.updatedAt = now;
    cache.expiresAt = addDays(now, mlAlertRefreshDays);
    cache.source = 'cloud_model_unavailable';
    cache.ml = {
      connected: false,
      message: error.message || 'Nao foi possivel conectar ao algoritmo de machine learning na nuvem.'
    };

    return getCachedAlertNotifications();
  }

  cache.alerts = extractClassifications(modelResponse)
    .map(normalizeAlert)
    .sort((a, b) => (
      a.prioridade - b.prioridade
      || Number(a.diasPrevistosAteZerar ?? 999999) - Number(b.diasPrevistosAteZerar ?? 999999)
    ));
  cache.metrics = modelResponse?.metrics || null;
  cache.updatedAt = now;
  cache.expiresAt = addDays(now, mlAlertRefreshDays);
  cache.source = 'cloud_model';
  cache.ml = {
    connected: true,
    message: 'Modelo de ML conectado.'
  };

  return getCachedAlertNotifications();
}

async function getWeeklyAlertNotifications({ forceRefresh = false } = {}) {
  if (refreshInProgress) {
    await refreshInProgress;
    return getCachedAlertNotifications();
  }

  if (!forceRefresh && cacheIsFresh()) {
    return getCachedAlertNotifications();
  }

  return refreshAlertNotifications();
}

function getCachedAlertNotifications() {
  return {
    updatedAt: cache.updatedAt,
    nextUpdateAt: cache.expiresAt,
    source: cache.source,
    metrics: cache.metrics,
    ml: cache.ml,
    alerts: cache.alerts
  };
}

function triggerAlertRefresh(reason = 'database_update') {
  if (refreshInProgress) {
    return refreshInProgress;
  }

  cache.expiresAt = null;
  cache.source = 'cloud_model_refreshing';
  cache.ml = {
    connected: false,
    message: 'Modelo de ML recalculando apos atualizacao do estoque.'
  };

  refreshInProgress = refreshAlertNotifications()
    .catch((error) => {
      console.warn(`Atualizacao dos alertas apos ${reason} falhou: ${error.message}`);
    })
    .finally(() => {
      refreshInProgress = null;
    });

  return refreshInProgress;
}

function startWeeklyAlertRefresh() {
  const intervalMs = Math.max(1, mlAlertRefreshDays) * ONE_DAY_MS;

  refreshAlertNotifications().catch((error) => {
    console.warn(`Atualizacao inicial dos alertas falhou: ${error.message}`);
  });

  return setInterval(() => {
    refreshAlertNotifications().catch((error) => {
      console.warn(`Atualizacao semanal dos alertas falhou: ${error.message}`);
    });
  }, intervalMs);
}

module.exports = {
  getWeeklyAlertNotifications,
  refreshAlertNotifications,
  triggerAlertRefresh,
  startWeeklyAlertRefresh
};
