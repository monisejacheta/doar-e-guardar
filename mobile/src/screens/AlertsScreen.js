import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createApiClient } from '../api/client';
import { colors, styles } from './Styles';

const alertFilters = [
  { key: 'urgent', label: 'Acaba em até 14 dias' },
  { key: 'estoque zerado', label: 'Sem estoque' },
  { key: 'estoque critico', label: 'Crítico' },
  { key: 'estoque atencao alta', label: 'Atenção alta' },
  { key: 'estoque atencao baixa', label: 'Atenção baixa' },
  { key: 'estoque estavel', label: 'Estável' },
  { key: 'produto baixa rotatividade', label: 'Pouco movimento' },
  { key: 'all', label: 'Todos' }
];

function normalizeClassification(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function daysUntilStockout(alert) {
  if (Number(alert.quantidade) <= 0) return 0;
  const days = Number(alert.diasPrevistosAteZerar);
  return Number.isFinite(days) ? days : Number.MAX_SAFE_INTEGER;
}

function daysUntilExpiration(alert) {
  const days = Number(alert.diasAteVencimento);
  return Number.isFinite(days) ? days : Number.MAX_SAFE_INTEGER;
}

function isUrgentAlert(alert) {
  return Number(alert.quantidade) > 0 && daysUntilStockout(alert) <= 14;
}

function compareAlertsByStockout(a, b) {
  return (
    daysUntilStockout(a) - daysUntilStockout(b)
    || Number(a.quantidade || 0) - Number(b.quantidade || 0)
    || daysUntilExpiration(a) - daysUntilExpiration(b)
    || String(a.nomeProduto || '').localeCompare(String(b.nomeProduto || ''), 'pt-BR', { sensitivity: 'base' })
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem data';
  return date.toLocaleDateString('pt-BR');
}

function formatNumber(value, fallback = '-') {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return String(Math.round(number));
}

function getClassificationLabel(classification) {
  if (!classification) return 'Sem classificação';

  const normalized = normalizeClassification(classification);
  const labels = {
    'estoque zerado': 'Sem estoque',
    'estoque critico': 'Estoque crítico',
    'estoque atencao alta': 'Atenção alta',
    'estoque atencao baixa': 'Atenção baixa',
    'estoque estavel': 'Estoque estável',
    'produto baixa rotatividade': 'Pouco movimento'
  };

  return labels[normalized] || 'Situação do estoque';
}

function getStockoutClassification(alert) {
  const normalized = normalizeClassification(alert.classificacao);

  if (normalized === 'produto baixa rotatividade') {
    return 'produto baixa rotatividade';
  }

  const days = daysUntilStockout(alert);

  if (days <= 0) return 'estoque zerado';
  if (days < 7) return 'estoque critico';
  if (days <= 14) return 'estoque atencao alta';
  if (days <= 30) return 'estoque atencao baixa';
  return 'estoque estavel';
}

function getStockoutDescription(alert) {
  const days = daysUntilStockout(alert);

  if (normalizeClassification(alert.classificacao) === 'produto baixa rotatividade') {
    return 'Sem média de uso';
  }

  if (days === Number.MAX_SAFE_INTEGER) {
    return 'Sem previsão';
  }

  if (days <= 0) {
    return 'Sem unidades no estoque';
  }

  return `Acaba em ${formatNumber(days)} dias`;
}

function getClassificationHelp(classification) {
  const normalized = normalizeClassification(classification);
  const descriptions = {
    'estoque zerado': 'Não há unidades disponíveis neste lote. Reponha assim que possível.',
    'estoque critico': 'Este lote ainda tem unidades, mas pode acabar em menos de 7 dias.',
    'estoque atencao alta': 'Este lote pode acabar entre 7 e 14 dias. Planeje a reposição ou use com prioridade.',
    'estoque atencao baixa': 'Este lote pode acabar entre 15 e 30 dias. Acompanhe, mas sem urgência imediata.',
    'estoque estavel': 'Este lote deve durar mais de 30 dias.',
    'produto baixa rotatividade': 'Ainda não há uma média de uso confiável para prever quando este lote pode acabar.'
  };

  return descriptions[normalized] || 'Situação calculada a partir da quantidade atual e da média de uso por dia.';
}

function showClassificationHelp(classification) {
  Alert.alert(getClassificationLabel(classification), getClassificationHelp(classification));
}

function showStorageLocation(alert) {
  Alert.alert(
    'Local de armazenamento',
    alert.localizacao || 'Local não informado.'
  );
}

function showExpirationDate(alert) {
  Alert.alert(
    'Data de validade',
    `Vence em ${formatDate(alert.dataValidade)}`
  );
}

function getAlertTone(alert) {
  const normalized = normalizeClassification(getStockoutClassification(alert));
  if (normalized === 'estoque zerado') return styles.alertCardEmpty;
  if (normalized === 'estoque critico') return styles.alertCardRisk;
  if (normalized === 'estoque atencao alta') return styles.alertCardHigh;
  if (normalized === 'estoque atencao baixa') return styles.alertCardLow;
  if (normalized === 'produto baixa rotatividade') return styles.alertCardSlow;
  return styles.alertCardSafe;
}

function AlertRow({ alert }) {
  const stockoutClassification = getStockoutClassification(alert);

  return (
    <View style={[styles.alertCard, getAlertTone(alert)]}>
      <View style={styles.alertCardHeader}>
        <View style={styles.alertTitleGroup}>
          <Text style={styles.alertProductName} numberOfLines={2}>
            {alert.nomeProduto || 'Produto sem nome'}
          </Text>
          <Text style={styles.alertBatchText} numberOfLines={1}>
            Lote: {alert.numeroLote || 'Sem lote'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.alertBadge}
          activeOpacity={0.75}
          onPress={() => showClassificationHelp(stockoutClassification)}
          accessibilityRole="button"
          accessibilityLabel={`Explicar situação: ${getClassificationLabel(stockoutClassification)}`}
        >
          <Text style={styles.alertBadgeText} numberOfLines={2}>
            {getClassificationLabel(stockoutClassification)}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.alertStockoutPanel}
        activeOpacity={0.75}
        onPress={() => showClassificationHelp(stockoutClassification)}
        accessibilityRole="button"
        accessibilityLabel="Explicar previsão de falta no estoque"
      >
        <Text style={styles.alertStockoutLabel}>Previsão de falta no estoque</Text>
        <Text style={styles.alertStockoutValue}>
          {getStockoutDescription(alert)}
        </Text>
      </TouchableOpacity>

      <View style={styles.alertMetricsRow}>
        <TouchableOpacity
          style={styles.alertMetric}
          activeOpacity={0.75}
          onPress={() => showStorageLocation(alert)}
          accessibilityRole="button"
          accessibilityLabel="Mostrar local de armazenamento"
        >
          <Text style={styles.alertMetricLabel}>Estoque</Text>
          <Text style={styles.alertMetricValue}>{formatNumber(alert.quantidade)} unidades</Text>
        </TouchableOpacity>
        <View style={styles.alertMetric}>
          <Text style={styles.alertMetricLabel}>Média de uso</Text>
          <Text style={styles.alertMetricValue}>
            {Number(alert.consumoMedio || 0).toFixed(2)} por dia
          </Text>
        </View>
        <TouchableOpacity
          style={styles.alertMetric}
          activeOpacity={0.75}
          onPress={() => showExpirationDate(alert)}
          accessibilityRole="button"
          accessibilityLabel="Mostrar data de validade"
        >
          <Text style={styles.alertMetricLabel}>Validade</Text>
          <Text style={styles.alertMetricValue}>
            {formatNumber(alert.diasAteVencimento)} dias
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertFooter}>
        <Text style={styles.alertFooterText} numberOfLines={1}>
          Análise automática original: {getClassificationLabel(alert.classificacao)}
        </Text>
        <Text style={styles.alertFooterText} numberOfLines={1}>
          Vence em {formatDate(alert.dataValidade)}
        </Text>
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('urgent');

  const alerts = useMemo(() => data?.alerts || [], [data]);
  const visibleAlerts = useMemo(() => {
    const filtered = alerts.filter((alert) => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'urgent') return isUrgentAlert(alert);
      return normalizeClassification(getStockoutClassification(alert)) === normalizeClassification(selectedFilter);
    });

    return [...filtered].sort(compareAlertsByStockout);
  }, [alerts, selectedFilter]);

  async function loadAlerts({ showRefresh = false, forceRefresh = false } = {}) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const api = createApiClient();
      const response = forceRefresh ? await api.refreshAlerts() : await api.listAlerts();
      setData(response);
    } catch (alertError) {
      setData(null);
      setError(alertError.message || 'Não foi possível carregar os alertas. Tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <View style={styles.alertScreen}>
      <View style={styles.alertHeader}>
        <View style={styles.alertHeaderText}>
          <Text style={styles.alertTitle}>Alertas</Text>
          <Text style={styles.alertSubtitle}>
            Veja quais lotes podem acabar primeiro
          </Text>
          {data?.updatedAt ? (
            <Text style={styles.alertUpdatedText}>
              Última análise: {formatDate(data.updatedAt)}
            </Text>
          ) : null}
          {data?.ml && !data.ml.connected ? (
            <Text style={styles.alertMlWarning}>
              Análise automática indisponível: {data.ml.message}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.alertRefreshButton}
          activeOpacity={0.75}
          onPress={() => loadAlerts({ showRefresh: true, forceRefresh: true })}
          accessibilityRole="button"
          accessibilityLabel="Atualizar alertas"
        >
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.alertFilterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.alertFilterContent}
        >
          {alertFilters.map((filter) => {
            const active = selectedFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.alertFilterChip, active ? styles.alertFilterChipActive : null]}
                activeOpacity={0.75}
                onPress={() => setSelectedFilter(filter.key)}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar alertas por ${filter.label}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.alertFilterChipText, active ? styles.alertFilterChipTextActive : null]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.dashboardState}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando alertas" />
          <Text style={styles.dashboardStateText}>Carregando alertas...</Text>
        </View>
      ) : (
        <FlatList
          data={visibleAlerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.alertListContent}
          refreshing={refreshing}
          onRefresh={() => loadAlerts({ showRefresh: true })}
          ListEmptyComponent={
            <View style={styles.dashboardState}>
              <Ionicons name="notifications-outline" size={38} color={colors.placeholder} />
              <Text style={styles.dashboardStateText}>
                {error || 'Nenhum alerta encontrado para este filtro.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <AlertRow alert={item} />}
        />
      )}
    </View>
  );
}
