const app = require('./app');
const { port } = require('./config/env');
const { startWeeklyAlertRefresh } = require('./services/alertNotificationService');

app.listen(port, '0.0.0.0', () => {
  console.log(`API de estoque ouvindo na porta ${port}`);
  startWeeklyAlertRefresh();
});
