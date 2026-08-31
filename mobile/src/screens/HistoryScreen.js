import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createApiClient } from '../api/client';
import { fetchProductInfoByBarcode } from '../api/productLookup';
import { colors, styles } from './Styles';

function valueFrom(item, fields, fallback = null) {
  const field = fields.find((name) => item?.[name] !== undefined && item?.[name] !== null);
  return field ? item[field] : fallback;
}

function normalizeMovement(item) {
  const type = valueFrom(item, ['movement_type', 'tipo_movimentacao'], 'entrada');
  const date = valueFrom(item, ['movement_date', 'data_movimentacao']);

  return {
    id: String(valueFrom(item, ['id', 'id_movimentacao'], `${date}-${valueFrom(item, ['id_produto'], '')}-${valueFrom(item, ['quantity', 'quantidade_movimentada'], 0)}`)),
    barcode: String(valueFrom(item, ['barcode', 'codigo_barras'], '')),
    name: valueFrom(item, ['product_name', 'nome_produto', 'name'], 'Produto sem nome'),
    batch: valueFrom(item, ['batch', 'numero_lote', 'lote'], 'Sem lote'),
    type,
    quantity: Number(valueFrom(item, ['quantity', 'quantidade_movimentada'], 0)),
    date
  };
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: 'Sem data', time: '--:--' };
  }

  return {
    day: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };
}

function movementMatchesFilter(movement, filter) {
  const term = filter.trim().toLowerCase();
  if (!term) return true;

  const { day, time } = formatDateTime(movement.date);
  return [
    movement.name,
    movement.batch,
    movement.type,
    movement.quantity,
    day,
    time,
    movement.barcode
  ].some((value) => String(value).toLowerCase().includes(term));
}

function MovementImage({ barcode }) {
  const [imageUri, setImageUri] = useState('');

  useEffect(() => {
    let active = true;

    async function loadImage() {
      const productInfo = await fetchProductInfoByBarcode(barcode);
      if (active) setImageUri(productInfo.imageUri || '');
    }

    loadImage();

    return () => {
      active = false;
    };
  }, [barcode]);

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={styles.historyProductImage}
        resizeMode="cover"
        accessible
        accessibilityLabel={`Imagem do produto com codigo ${barcode}`}
      />
    );
  }

  return (
    <View style={styles.historyProductImagePlaceholder}>
      <Ionicons name="image-outline" size={24} color={colors.placeholder} />
    </View>
  );
}

function MovementRow({ movement }) {
  const { day, time } = formatDateTime(movement.date);
  const isEntry = movement.type === 'entrada';

  return (
    <View style={styles.historyRow}>
      <MovementImage barcode={movement.barcode} />
      <View style={styles.historyProductInfo}>
        <Text style={styles.historyProductName} numberOfLines={2}>{movement.name}</Text>
        <Text style={styles.historyProductBatch} numberOfLines={1}>Lote: {movement.batch}</Text>
      </View>
      <View style={styles.historyMovementInfo}>
        <Text style={[
          styles.historyMovementType,
          isEntry ? styles.historyMovementEntry : styles.historyMovementExit
        ]}>
          {isEntry ? 'Entrada' : 'Saida'}
        </Text>
        <Text style={styles.historyMovementQuantity}>{movement.quantity} un.</Text>
      </View>
      <View style={styles.historyDateInfo}>
        <Text style={styles.historyDateText}>{day}</Text>
        <Text style={styles.historyTimeText}>{time}</Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [movements, setMovements] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const normalizedMovements = useMemo(() => movements.map(normalizeMovement), [movements]);
  const visibleMovements = useMemo(
    () => normalizedMovements.filter((movement) => movementMatchesFilter(movement, filter)),
    [normalizedMovements, filter]
  );

  async function loadMovements({ showRefresh = false } = {}) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const api = createApiClient();
      const data = await api.listStockMovements();
      setMovements(Array.isArray(data) ? data : []);
    } catch (movementError) {
      setMovements([]);
      setError(movementError.message || 'Nao foi possivel carregar o historico.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMovements();
  }, []);

  return (
    <View style={styles.historyScreen}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Historico</Text>
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Filtrar por produto, lote, tipo, quantidade ou data"
          placeholderTextColor={colors.placeholder}
          style={styles.historyFilterInput}
          accessibilityLabel="Filtrar historico"
          accessibilityHint="Filtra por produto, lote, tipo, quantidade ou data"
        />
      </View>

      {loading ? (
        <View style={styles.dashboardState}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando movimentacoes" />
          <Text style={styles.dashboardStateText}>Carregando movimentacoes...</Text>
        </View>
      ) : (
        <FlatList
          data={visibleMovements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyListContent}
          refreshing={refreshing}
          onRefresh={() => loadMovements({ showRefresh: true })}
          ListHeaderComponent={visibleMovements.length ? (
            <View style={styles.historyTableHeader}>
              <Text style={styles.historyTableHeaderProduct}>Produto</Text>
              <Text style={styles.historyTableHeaderText}>Mov.</Text>
              <Text style={styles.historyTableHeaderText}>Data</Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.dashboardState}>
              <Ionicons name="time-outline" size={38} color={colors.placeholder} />
              <Text style={styles.dashboardStateText}>
                {error || 'Nenhuma movimentacao encontrada.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <MovementRow movement={item} />}
        />
      )}
    </View>
  );
}
