const { expiryCriticalDays } = require('../config/env');

function differenceInDays(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function classifyWithLocalFallback({ expiresAt, currentStock, averageDailyOutput }) {
  const daysUntilExpiration = differenceInDays(expiresAt);
  const dailyOutput = Number(averageDailyOutput || 0);
  const predictedDaysUntilStockOut = dailyOutput > 0 ? Math.ceil(Number(currentStock || 0) / dailyOutput) : null;

  if (daysUntilExpiration <= 0) {
    return {
      label: 'Risco de Vencimento',
      daysUntilExpiration,
      predictedDaysUntilStockOut,
      source: 'local_fallback'
    };
  }

  if (predictedDaysUntilStockOut && daysUntilExpiration <= predictedDaysUntilStockOut) {
    return {
      label: 'Risco de Vencimento',
      daysUntilExpiration,
      predictedDaysUntilStockOut,
      source: 'local_fallback'
    };
  }

  if (daysUntilExpiration <= expiryCriticalDays) {
    return {
      label: 'Consumo Imediato',
      daysUntilExpiration,
      predictedDaysUntilStockOut,
      source: 'local_fallback'
    };
  }

  return {
    label: 'Seguro',
    daysUntilExpiration,
    predictedDaysUntilStockOut,
    source: 'local_fallback'
  };
}

async function classifyBatch(input) {
  // Preparado para chamar o modelo Python quando ele estiver publicado na nuvem.
  // Por enquanto, cumpre o contrato com uma regra local transparente e auditavel.
  return classifyWithLocalFallback(input);
}

module.exports = { classifyBatch, classifyWithLocalFallback };
