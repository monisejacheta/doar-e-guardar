const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { corsOrigin, databaseSource, mlClassificationUrl } = require('./config/env');
const { pool } = require('./db/pool');
const { errorHandler } = require('./middleware/errorHandler');
const catalogRoutes = require('./routes/catalogRoutes');
const stockRoutes = require('./routes/stockRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();
const corsOptions = corsOrigin === '*' ? { origin: true } : { origin: corsOrigin };

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ong-stock-backend',
    database: { source: databaseSource }
  });
});

app.get('/api/status', async (req, res) => {
  let database = {
    source: databaseSource,
    connected: false
  };

  try {
    await pool.query('SELECT 1');
    database = { ...database, connected: true };
  } catch (error) {
    database = {
      ...database,
      error: error.message || error.code || error.name || 'Falha ao conectar ao banco.',
      code: error.code
    };
  }

  res.json({
    status: 'ok',
    service: 'ong-stock-backend',
    database,
    ml: {
      configured: Boolean(mlClassificationUrl),
      provider: 'huggingface-spaces'
    }
  });
});

app.use('/api', catalogRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api', alertRoutes);

app.use(errorHandler);

module.exports = app;
