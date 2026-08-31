const express = require('express');
const https = require('https');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { triggerAlertRefresh } = require('../services/alertNotificationService');

const router = express.Router();
const externalProductApiHost = 'api-produtos.seunegocionanuvem.com.br';

const productSchema = z.object({
  nomeProduto: z.string().min(2).optional(),
  nome_produto: z.string().min(2).optional(),
  name: z.string().min(2).optional(),
  codigoBarras: z.string().min(3).optional(),
  codigo_barras: z.string().min(3).optional(),
  barcode: z.string().min(3).optional(),
  numeroLote: z.string().min(1).optional(),
  numero_lote: z.string().min(1).optional(),
  batch: z.string().min(1).optional(),
  dataValidade: z.string().date().optional(),
  data_validade: z.string().date().optional(),
  expiresAt: z.string().date().optional(),
  quantidade: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  estoqueMinimo: z.number().int().nonnegative().optional(),
  estoque_minimo: z.number().int().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
  categoria: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  armazenamento: z.string().min(1).optional(),
  storage: z.string().min(1).optional(),
  localizacao: z.string().min(1).optional(),
  location: z.string().min(1).optional()
});

const quantityIncreaseSchema = z.object({
  quantidade: z.number().int().positive().optional(),
  quantity: z.number().int().positive().optional()
});

function readFirst(source, fields, fallback = null) {
  const field = fields.find((name) => source[name] !== undefined && source[name] !== null);
  return field ? source[field] : fallback;
}

function toProductPayload(body) {
  return {
    nomeProduto: readFirst(body, ['nomeProduto', 'nome_produto', 'name']),
    codigoBarras: readFirst(body, ['codigoBarras', 'codigo_barras', 'barcode']),
    numeroLote: readFirst(body, ['numeroLote', 'numero_lote', 'batch']),
    dataValidade: readFirst(body, ['dataValidade', 'data_validade', 'expiresAt']),
    quantidade: readFirst(body, ['quantidade', 'quantity'], 0),
    estoqueMinimo: readFirst(body, ['estoqueMinimo', 'estoque_minimo', 'minimumStock'], 0),
    categoria: readFirst(body, ['categoria', 'category'], 'outros'),
    armazenamento: readFirst(body, ['armazenamento', 'storage'], 'seco'),
    localizacao: readFirst(body, ['localizacao', 'location'], 'Estoque')
  };
}

function requireFields(product) {
  const missing = [
    ['nomeProduto', 'nome do produto'],
    ['codigoBarras', 'codigo de barras'],
    ['numeroLote', 'numero do lote'],
    ['dataValidade', 'data de validade']
  ].filter(([field]) => !product[field]);

  if (missing.length) {
    throw new ApiError(400, `Campos obrigatorios ausentes: ${missing.map(([, label]) => label).join(', ')}.`);
  }
}

function fetchExternalJson(path) {
  return new Promise((resolve, reject) => {
    const request = https.get({
      hostname: externalProductApiHost,
      path,
      method: 'GET',
      headers: { Accept: 'application/json' },
      rejectUnauthorized: false,
      timeout: 10000
    }, (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new ApiError(502, 'Resposta invalida da API online de produtos.'));
        }
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('Timeout na API online de produtos.'));
    });

    request.on('error', reject);
  });
}

router.get('/products', asyncHandler(async (req, res) => {
  const search = req.query.search ? `%${req.query.search}%` : null;
  const { rows } = await pool.query(
    `SELECT
       id_produto,
       nome_produto,
       codigo_barras,
       numero_lote,
       data_validade,
       quantidade,
       estoque_minimo,
       categoria,
       armazenamento,
       localizacao,
       criado_em,
       atualizado_em
     FROM tb_produtos
     WHERE $1::text IS NULL
        OR nome_produto ILIKE $1
        OR codigo_barras ILIKE $1
        OR numero_lote ILIKE $1
     ORDER BY nome_produto, data_validade, numero_lote`,
    [search]
  );

  res.json(rows);
}));

router.get('/products/barcode/:barcode', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       id_produto,
       nome_produto,
       codigo_barras,
       numero_lote,
       data_validade,
       quantidade,
       estoque_minimo,
       categoria,
       armazenamento,
       localizacao,
       criado_em,
       atualizado_em
     FROM tb_produtos
     WHERE codigo_barras = $1
     ORDER BY data_validade ASC, numero_lote ASC`,
    [req.params.barcode]
  );

  res.json(rows);
}));

router.get('/product-lookup/:barcode', asyncHandler(async (req, res) => {
  const barcode = req.params.barcode;
  const [details, imageData] = await Promise.all([
    fetchExternalJson(`/?codigo_barras=${encodeURIComponent(barcode)}&detalhes=1`).catch(() => ({})),
    fetchExternalJson(`/api/${encodeURIComponent(barcode)}`).catch(() => ({}))
  ]);

  const mimeType = imageData.mime_type || imageData.mimeType || (imageData.formato ? `image/${imageData.formato}` : 'image/jpeg');
  const imageBase64 = imageData.imagem_base64 || imageData.image_base64 || imageData.base64 || '';
  const name = details.descricao
    || details.nome
    || details.nome_produto
    || details.produto
    || details.name
    || details.description
    || imageData.descricao
    || imageData.nome
    || imageData.nome_produto
    || imageData.produto
    || imageData.name
    || imageData.description
    || imageData.title
    || '';

  res.json({
    name,
    imageUri: imageBase64 ? `data:${mimeType};base64,${imageBase64}` : '',
    mimeType,
    details: {
      barcode: details.codigo_barras || barcode,
      unit: details.medida || '',
      ncm: details.ncm || '',
      cest: details.cest || ''
    },
    error: details.error || imageData.error || ''
  });
}));

router.post('/products', validate(productSchema), asyncHandler(async (req, res) => {
  const product = toProductPayload(req.body);
  requireFields(product);

  const existingBatch = await pool.query(
    `SELECT id_produto, data_validade
     FROM tb_produtos
     WHERE codigo_barras = $1
       AND numero_lote = $2
     LIMIT 1`,
    [product.codigoBarras, product.numeroLote]
  );

  if (existingBatch.rows[0]) {
    const rawExpiration = existingBatch.rows[0].data_validade;
    const existingExpiration = rawExpiration instanceof Date
      ? rawExpiration.toISOString().slice(0, 10)
      : String(rawExpiration).slice(0, 10);

    if (existingExpiration !== product.dataValidade) {
      throw new ApiError(409, 'Lotes iguais de produtos iguais nao aceitam data de validade divergente.');
    }

    throw new ApiError(409, 'lote ja disponivel no estoque');
  }

  const { rows } = await pool.query(
    `INSERT INTO tb_produtos (
       nome_produto,
       codigo_barras,
       numero_lote,
       data_validade,
       quantidade,
       estoque_minimo,
       categoria,
       armazenamento,
       localizacao
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::categoria_produto, $8::armazenamento_produto, $9)
     RETURNING *`,
    [
      product.nomeProduto,
      product.codigoBarras,
      product.numeroLote,
      product.dataValidade,
      product.quantidade,
      product.estoqueMinimo,
      product.categoria,
      product.armazenamento,
      product.localizacao
    ]
  );

  triggerAlertRefresh('cadastro_produto');
  res.status(201).json(rows[0]);
}));

router.patch('/products/:id/increase-quantity', validate(quantityIncreaseSchema), asyncHandler(async (req, res) => {
  const quantity = readFirst(req.body, ['quantidade', 'quantity'], 0);

  const { rows } = await pool.query(
    `UPDATE tb_produtos
     SET quantidade = quantidade + $1
     WHERE id_produto = $2
     RETURNING *`,
    [quantity, req.params.id]
  );

  if (!rows[0]) throw new ApiError(404, 'Produto nao encontrado.');
  triggerAlertRefresh('aumento_quantidade_produto');
  res.json(rows[0]);
}));

router.put('/products/:id', validate(productSchema), asyncHandler(async (req, res) => {
  const product = toProductPayload(req.body);
  requireFields(product);

  const { rows } = await pool.query(
    `UPDATE tb_produtos
     SET
       nome_produto = $1,
       codigo_barras = $2,
       numero_lote = $3,
       data_validade = $4,
       quantidade = $5,
       estoque_minimo = $6,
       categoria = $7::categoria_produto,
       armazenamento = $8::armazenamento_produto,
       localizacao = $9
     WHERE id_produto = $10
     RETURNING *`,
    [
      product.nomeProduto,
      product.codigoBarras,
      product.numeroLote,
      product.dataValidade,
      product.quantidade,
      product.estoqueMinimo,
      product.categoria,
      product.armazenamento,
      product.localizacao,
      req.params.id
    ]
  );

  if (!rows[0]) throw new ApiError(404, 'Produto nao encontrado.');
  triggerAlertRefresh('edicao_produto');
  res.json(rows[0]);
}));

router.get('/categories', (req, res) => {
  res.json([
    { id: 'alimenticios longa duracao', name: 'alimenticios longa duracao' },
    { id: 'alimenticios curta duracao', name: 'alimenticios curta duracao' },
    { id: 'limpeza', name: 'limpeza' },
    { id: 'higiene pessoal', name: 'higiene pessoal' },
    { id: 'outros', name: 'outros' }
  ]);
});

router.get('/units', (req, res) => {
  res.json([{ id: 'un', name: 'Unidade', abbreviation: 'un' }]);
});

module.exports = router;
