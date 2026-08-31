const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/apiError');
const { triggerAlertRefresh } = require('../services/alertNotificationService');

const router = express.Router();

const entrySchema = z.object({
  productId: z.string().uuid().optional(),
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
  quantidade: z.number().int().positive().optional(),
  quantity: z.number().int().positive().optional(),
  estoqueMinimo: z.number().int().nonnegative().optional(),
  minimumStock: z.number().int().nonnegative().optional(),
  categoria: z.string().min(1).optional(),
  armazenamento: z.string().min(1).optional(),
  localizacao: z.string().min(1).optional()
});

const exitSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive()
});

function readFirst(source, fields, fallback = null) {
  const field = fields.find((name) => source[name] !== undefined && source[name] !== null);
  return field ? source[field] : fallback;
}

router.get('/entries', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       id_produto AS id,
       id_produto,
       nome_produto AS product_name,
       nome_produto,
       codigo_barras AS barcode,
       codigo_barras,
       numero_lote AS batch,
       numero_lote,
       data_validade AS expires_at,
       data_validade,
       quantidade AS quantity_available,
       quantidade,
       estoque_minimo,
       categoria,
       armazenamento,
       localizacao,
       criado_em,
       atualizado_em
     FROM tb_produtos
     WHERE quantidade > 0
     ORDER BY data_validade ASC, nome_produto ASC, numero_lote ASC`
  );

  res.json(rows);
}));

router.post('/entries', validate(entrySchema), asyncHandler(async (req, res) => {
  const productId = req.body.productId;
  const quantity = readFirst(req.body, ['quantidade', 'quantity'], 0);

  if (productId) {
    const { rows } = await pool.query(
      `UPDATE tb_produtos
       SET quantidade = quantidade + $1
       WHERE id_produto = $2
       RETURNING *`,
      [quantity, productId]
    );

    if (!rows[0]) throw new ApiError(404, 'Produto nao encontrado.');
    triggerAlertRefresh('entrada_estoque');
    res.status(201).json(rows[0]);
    return;
  }

  const product = {
    nomeProduto: readFirst(req.body, ['nomeProduto', 'nome_produto', 'name']),
    codigoBarras: readFirst(req.body, ['codigoBarras', 'codigo_barras', 'barcode']),
    numeroLote: readFirst(req.body, ['numeroLote', 'numero_lote', 'batch']),
    dataValidade: readFirst(req.body, ['dataValidade', 'data_validade', 'expiresAt']),
    quantidade: quantity,
    estoqueMinimo: readFirst(req.body, ['estoqueMinimo', 'minimumStock'], 0),
    categoria: readFirst(req.body, ['categoria'], 'outros'),
    armazenamento: readFirst(req.body, ['armazenamento'], 'seco'),
    localizacao: readFirst(req.body, ['localizacao'], 'Estoque')
  };

  const missing = [
    ['nomeProduto', 'nome do produto'],
    ['codigoBarras', 'codigo de barras'],
    ['numeroLote', 'numero do lote'],
    ['dataValidade', 'data de validade']
  ].filter(([field]) => !product[field]);

  if (missing.length) {
    throw new ApiError(400, `Campos obrigatorios ausentes: ${missing.map(([, label]) => label).join(', ')}.`);
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
     ON CONFLICT (codigo_barras, numero_lote, data_validade)
     DO UPDATE SET quantidade = tb_produtos.quantidade + EXCLUDED.quantidade
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

  triggerAlertRefresh('entrada_estoque');
  res.status(201).json(rows[0]);
}));

router.post('/exits', validate(exitSchema), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE tb_produtos
     SET quantidade = quantidade - $1
     WHERE id_produto = $2
       AND quantidade >= $1
     RETURNING *`,
    [req.body.quantity, req.body.productId]
  );

  if (!rows[0]) throw new ApiError(409, 'Produto nao encontrado ou estoque insuficiente.');
  triggerAlertRefresh('saida_estoque');
  res.status(201).json({ product: rows[0], currentStock: rows[0].quantidade });
}));

router.get('/movements', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       m.id_movimentacao AS id,
       m.id_movimentacao,
       m.id_produto,
       p.nome_produto AS product_name,
       p.nome_produto,
       p.codigo_barras AS barcode,
       p.codigo_barras,
       p.numero_lote AS batch,
       p.numero_lote,
       m.tipo_movimentacao AS movement_type,
       m.tipo_movimentacao,
       m.quantidade_movimentada AS quantity,
       m.quantidade_movimentada,
       m.data_movimentacao AS movement_date,
       m.data_movimentacao
     FROM tb_movimentacoes m
     INNER JOIN tb_produtos p ON p.id_produto = m.id_produto
     ORDER BY m.data_movimentacao DESC, p.nome_produto ASC`
  );

  res.json(rows);
}));

router.get('/daily-consumption', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       p.codigo_barras AS barcode,
       p.codigo_barras,
       SUM(cd.consumo_medio)::float AS daily_consumption,
       SUM(cd.consumo_medio)::float AS consumo_medio,
       MAX(cd.atualizado_em) AS atualizado_em
     FROM tb_consumo_diario cd
     INNER JOIN tb_produtos p ON p.id_produto = cd.id_produto
     GROUP BY p.codigo_barras`
  );

  res.json(rows);
}));

router.get('/current', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       codigo_barras AS barcode,
       codigo_barras,
       MIN(nome_produto) AS name,
       MIN(nome_produto) AS nome_produto,
       SUM(quantidade)::int AS current_stock,
       SUM(quantidade)::int AS quantidade,
       MIN(data_validade) FILTER (WHERE quantidade > 0) AS nearest_expiration
     FROM tb_produtos
     GROUP BY codigo_barras
     ORDER BY name`
  );

  res.json(rows);
}));

router.get('/current/:productId', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT
       id_produto,
       nome_produto,
       codigo_barras,
       numero_lote,
       data_validade,
       quantidade
     FROM tb_produtos
     WHERE id_produto = $1`,
    [req.params.productId]
  );

  if (!rows[0]) throw new ApiError(404, 'Produto nao encontrado.');
  res.json(rows[0]);
}));

module.exports = router;
