const { ZodError } = require('zod');
const { ApiError } = require('../utils/apiError');

function errorHandler(error, req, res, next) {
  console.error(error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({ message: error.message, details: error.details });
  }

  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

module.exports = { errorHandler };
