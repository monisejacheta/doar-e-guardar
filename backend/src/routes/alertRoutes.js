const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  getWeeklyAlertNotifications,
  refreshAlertNotifications
} = require('../services/alertNotificationService');

const router = express.Router();

router.get('/alerts', asyncHandler(async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const alerts = await getWeeklyAlertNotifications({ forceRefresh });
  res.json(alerts);
}));

router.post('/alerts/refresh', asyncHandler(async (req, res) => {
  const alerts = await refreshAlertNotifications();
  res.json(alerts);
}));

module.exports = router;
