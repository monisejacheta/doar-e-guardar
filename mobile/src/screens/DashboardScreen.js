import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createApiClient } from '../api/client';
import { fetchProductInfoByBarcode } from '../api/productLookup';
import { colors, styles } from './Styles';

const nearExpirationWindowDays = 7;
const millisecondsPerDay = 24 * 60 * 60 * 1000;
const stockSortOptions = [
  { key: 'entryDate', label: 'Data de entrada' },
  { key: 'quantity', label: 'Quantidade' },
  { key: 'expiration', label: 'Validade' }
];
const stockSortDescriptions = {
  name: 'Produtos em ordem alfabética, com vencidos primeiro.',
  entryDate: 'Produtos mais recentes primeiro, com vencidos no topo.',
  quantity: 'Produtos com menor quantidade primeiro, com vencidos no topo.',
  expiration: 'Produtos com validade mais próxima primeiro, com vencidos no topo.'
};

function valueFrom(item, fields, fallback = null) {
  const field = fields.find((name) => item?.[name] !== undefined && item?.[name] !== null);
  return field ? item[field] : fallback;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function expirationTime(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  if (typeof value === 'string') {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnly) {
      return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])).getTime();
    }
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function entryTime(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function isExpired(value) {
  return expirationTime(value) < startOfToday();
}

function isNearExpiration(value) {
  const time = expirationTime(value);
  const today = startOfToday();
  const limit = today + (nearExpirationWindowDays * millisecondsPerDay);
  return time >= today && time <= limit;
}

function formatDate(value) {
  if (!value) return 'Sem validade';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem validade';
  return date.toLocaleDateString('pt-BR');
}

function formatDailyConsumption(value) {
  const quantity = toNumber(value);
  if (quantity <= 0) return '0/dia';

  return `${quantity.toLocaleString('pt-BR', {
    maximumFractionDigits: 2
  })}/dia`;
}

function toConsumptionMap(items) {
  return (Array.isArray(items) ? items : []).reduce((map, item) => {
    const barcode = valueFrom(item, ['codigo_barras', 'barcode']);
    if (!barcode) return map;

    return {
      ...map,
      [String(barcode)]: toNumber(valueFrom(item, ['consumo_medio', 'daily_consumption', 'dailyConsumption'], 0))
    };
  }, {});
}

function hasEarlierAvailableLot(product, lot) {
  const lotExpiration = expirationTime(lot.expiresAt);

  return product.lots.some((currentLot) => (
    currentLot.id !== lot.id
    && currentLot.quantity > 0
    && expirationTime(currentLot.expiresAt) < lotExpiration
  ));
}

function normalizeEntry(item) {
  const barcode = String(valueFrom(item, ['codigo_barras', 'barcode', 'code'], 'Sem codigo'));
  const quantity = toNumber(valueFrom(item, ['quantidade', 'quantity_available', 'quantity', 'current_stock'], 0));
  const batch = valueFrom(item, ['numero_lote', 'batch', 'lote'], 'Estoque atual');
  const expiresAt = valueFrom(item, ['data_validade', 'expires_at', 'expiresAt', 'nearest_expiration']);
  const location = valueFrom(item, ['localizacao', 'location', 'location_code', 'warehouse_name'], 'Sem localizacao');
  const minimumStock = toNumber(valueFrom(item, ['estoque_minimo', 'minimum_stock', 'minimumStock'], 0));
  const id = valueFrom(item, ['id_produto', 'stock_entry_id', 'id'], `${barcode}-${batch}-${expiresAt || 'sem-validade'}`);
  const createdAt = valueFrom(item, ['criado_em', 'created_at', 'createdAt', 'entry_date', 'entryDate']);

  return {
    id: String(id),
    productId: valueFrom(item, ['id_produto', 'product_id', 'productId', 'id']),
    barcode,
    name: valueFrom(item, ['nome_produto', 'product_name', 'name'], 'Produto sem nome'),
    imageUrl: valueFrom(item, ['foto_url', 'photo_url', 'image_url', 'imageUrl']),
    batch,
    expiresAt,
    location,
    quantity,
    minimumStock,
    createdAt
  };
}

function compareProductNames(a, b) {
  return String(a.name).localeCompare(String(b.name), 'pt-BR', { sensitivity: 'base' });
}

function compareProductsForStockDisplay(a, b, sortKey = 'name') {
  if (a.hasExpiredLot !== b.hasExpiredLot) {
    return a.hasExpiredLot ? -1 : 1;
  }

  if (sortKey === 'entryDate') {
    return b.latestEntryTime - a.latestEntryTime || compareProductNames(a, b);
  }

  if (sortKey === 'quantity') {
    return a.totalQuantity - b.totalQuantity || compareProductNames(a, b);
  }

  if (sortKey === 'expiration') {
    return a.nearestExpirationTime - b.nearestExpirationTime || compareProductNames(a, b);
  }

  return compareProductNames(a, b);
}

function groupProducts(entries, sortKey = 'name') {
  const grouped = new Map();

  entries.map(normalizeEntry).forEach((entry) => {
    const current = grouped.get(entry.barcode) || {
      barcode: entry.barcode,
      name: entry.name,
      imageUrl: entry.imageUrl,
      minimumStock: 0,
      totalQuantity: 0,
      latestEntryTime: 0,
      lots: []
    };

    current.name = current.name || entry.name;
    current.imageUrl = current.imageUrl || entry.imageUrl;
    current.minimumStock = Math.max(current.minimumStock, entry.minimumStock);
    current.totalQuantity += entry.quantity;
    current.latestEntryTime = Math.max(current.latestEntryTime, entryTime(entry.createdAt));
    current.lots.push({
      id: entry.id,
      batch: entry.batch,
      expiresAt: entry.expiresAt,
      location: entry.location,
      quantity: entry.quantity,
      createdAt: entry.createdAt,
      expired: entry.quantity > 0 && isExpired(entry.expiresAt),
      nearExpiration: entry.quantity > 0 && isNearExpiration(entry.expiresAt)
    });

    grouped.set(entry.barcode, current);
  });

  return Array.from(grouped.values())
    .map((product) => ({
      ...product,
      belowMinimumStock: product.minimumStock > 0 && product.totalQuantity < product.minimumStock,
      hasExpiredLot: product.lots.some((lot) => lot.expired),
      hasNearExpirationLot: product.lots.some((lot) => lot.nearExpiration),
      nearestExpirationTime: product.lots.reduce(
        (nearest, lot) => Math.min(nearest, expirationTime(lot.expiresAt)),
        Number.MAX_SAFE_INTEGER
      ),
      lots: product.lots.sort((a, b) => expirationTime(a.expiresAt) - expirationTime(b.expiresAt))
    }))
    .sort((a, b) => compareProductsForStockDisplay(a, b, sortKey || 'name'));
}

function useOnlineProductInfo(barcode) {
  const [productInfo, setProductInfo] = useState({ name: '', imageUri: '', error: '' });

  useEffect(() => {
    let active = true;

    async function loadProductInfo() {
      const info = await fetchProductInfoByBarcode(barcode);
      if (active) setProductInfo(info);
    }

    loadProductInfo();

    return () => {
      active = false;
    };
  }, [barcode]);

  return productInfo;
}

function ProductImage({ imageUrl, large = false }) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={large ? styles.productDetailImage : styles.productCardImage}
        resizeMode="cover"
        accessible
        accessibilityLabel="Imagem do produto"
      />
    );
  }

  return (
    <View style={large ? styles.productDetailImagePlaceholder : styles.productCardImagePlaceholder}>
      <Ionicons name="image-outline" size={large ? 54 : 34} color={colors.placeholder} />
    </View>
  );
}

function ProductCard({ product, onPress, onRequestWithdrawal }) {
  const onlineProduct = useOnlineProductInfo(product.barcode);
  const productName = onlineProduct.name || product.name;
  const imageUrl = onlineProduct.imageUri || product.imageUrl;
  const firstAvailableLot = product.lots.find((lot) => lot.quantity > 0 && !lot.expired);

  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        product.belowMinimumStock ? styles.productCardLowStock : null,
        product.hasNearExpirationLot ? styles.productCardNearExpiration : null,
        product.hasExpiredLot ? styles.productCardExpired : null
      ]}
      activeOpacity={0.82}
      onPress={() => onPress({ ...product, name: productName, imageUrl })}
      accessibilityRole="button"
      accessibilityLabel={`${productName}. Codigo ${product.barcode}. Quantidade total ${product.totalQuantity} unidades`}
      accessibilityHint="Abre os detalhes do produto"
    >
      {product.hasExpiredLot ? (
        <View style={styles.productCardExpiredRibbon}>
          <Text style={styles.productCardExpiredRibbonText}>Produto vencido</Text>
        </View>
      ) : null}
      <ProductImage imageUrl={imageUrl} />

      <View style={styles.productCardBody}>
        <Text style={styles.productCardCode} numberOfLines={1}>{product.barcode}</Text>
        <Text style={styles.productCardName} numberOfLines={2}>{productName}</Text>
        {product.belowMinimumStock ? (
          <Text style={styles.productCardLowStockText} numberOfLines={2}>
            Produto abaixo do estoque minimo
          </Text>
        ) : null}
        <View style={styles.productCardFooter}>
          <Text style={styles.productCardQuantity}>{product.totalQuantity} un.</Text>
          <TouchableOpacity
            style={styles.productCardWithdrawButton}
            activeOpacity={0.75}
            disabled={!firstAvailableLot}
            accessibilityRole="button"
            accessibilityLabel={`Registrar retirada de ${productName}`}
            accessibilityState={{ disabled: !firstAvailableLot }}
            onPress={() => onRequestWithdrawal(
              { ...product, name: productName, imageUrl },
              firstAvailableLot
            )}
          >
            <Text style={styles.productCardWithdrawButtonText}>Retirada</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function WithdrawalModal({ lot, quantity, saving, onChangeQuantity, onCancel, onConfirm }) {
  if (!lot) return null;

  const parsedQuantity = toNumber(quantity);
  const canWithdraw = parsedQuantity > 0 && parsedQuantity <= lot.quantity && !saving;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel} accessibilityViewIsModal>
      <View style={styles.withdrawOverlay}>
        <View style={styles.withdrawDialog}>
          <View style={styles.withdrawHeader}>
            <Text style={styles.withdrawTitle}>Retirar itens</Text>
            <TouchableOpacity
              style={styles.withdrawCloseButton}
              onPress={onCancel}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Fechar retirada"
            >
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.withdrawLotSummary}>
            <Text style={styles.withdrawLotBatch}>{lot.batch}</Text>
            <Text style={styles.withdrawLotText}>Disponivel: {lot.quantity} un.</Text>
            <Text style={styles.withdrawLotText}>Validade: {formatDate(lot.expiresAt)}</Text>
          </View>

          <View style={styles.withdrawLocationWarning}>
            <Text style={styles.withdrawLocationLabel}>Verifique a localizacao antes de retirar</Text>
            <Text style={styles.withdrawLocationValue}>{lot.location || 'Sem localizacao'}</Text>
            <Text style={styles.withdrawLocationHelp}>
              Confirme o local do lote para evitar retirar produtos errados.
            </Text>
          </View>

          <View style={styles.withdrawQuantityRow}>
            <TouchableOpacity
              style={styles.withdrawStepButton}
              activeOpacity={0.75}
              disabled={saving || parsedQuantity <= 1}
              accessibilityRole="button"
              accessibilityLabel="Diminuir quantidade da retirada"
              accessibilityState={{ disabled: saving || parsedQuantity <= 1 }}
              onPress={() => onChangeQuantity(String(Math.max(1, parsedQuantity - 1)))}
            >
              <Ionicons name="remove" size={24} color={colors.icon} />
            </TouchableOpacity>
            <TextInput
              style={styles.withdrawInput}
              value={quantity}
              onChangeText={(value) => onChangeQuantity(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              editable={!saving}
              maxLength={6}
              placeholder="0"
              accessibilityLabel="Quantidade para retirada"
              accessibilityValue={{ text: quantity || '0' }}
            />
            <TouchableOpacity
              style={styles.withdrawStepButton}
              activeOpacity={0.75}
              disabled={saving || parsedQuantity >= lot.quantity}
              accessibilityRole="button"
              accessibilityLabel="Aumentar quantidade da retirada"
              accessibilityState={{ disabled: saving || parsedQuantity >= lot.quantity }}
              onPress={() => onChangeQuantity(String(Math.min(lot.quantity, Math.max(0, parsedQuantity) + 1)))}
            >
              <Ionicons name="add" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.withdrawConfirmButton, !canWithdraw ? styles.buttonDisabled : null]}
            activeOpacity={0.82}
            disabled={!canWithdraw}
            accessibilityRole="button"
            accessibilityLabel="Confirmar retirada"
            accessibilityState={{ disabled: !canWithdraw }}
            onPress={onConfirm}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryText} accessibilityLabel="Registrando retirada" />
            ) : (
              <Text style={styles.withdrawConfirmButtonText}>Confirmar retirada</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function DiscardModal({ lot, saving, onCancel, onConfirm }) {
  if (!lot) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel} accessibilityViewIsModal>
      <View style={styles.withdrawOverlay}>
        <View style={styles.withdrawDialog}>
          <View style={styles.withdrawHeader}>
            <Text style={styles.withdrawTitle}>Descartar produto</Text>
            <TouchableOpacity
              style={styles.withdrawCloseButton}
              onPress={onCancel}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Fechar descarte"
            >
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.withdrawLotSummary}>
            <Text style={styles.withdrawLotBatch}>{lot.batch}</Text>
            <Text style={styles.withdrawLotText}>Quantidade atual: {lot.quantity} un.</Text>
            <Text style={styles.withdrawLotText}>Validade: {formatDate(lot.expiresAt)}</Text>
          </View>

          <Text style={styles.discardWarningText}>
            Este lote vencido sera zerado no estoque.
          </Text>

          <TouchableOpacity
            style={[styles.discardConfirmButton, saving ? styles.buttonDisabled : null]}
            activeOpacity={0.82}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Confirmar descarte do produto vencido"
            accessibilityState={{ disabled: saving }}
            onPress={onConfirm}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryText} accessibilityLabel="Registrando descarte" />
            ) : (
              <Text style={styles.withdrawConfirmButtonText}>Confirmar descarte</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ProductDetail({ product, consumptionByBarcode = {}, onClose, onRequestWithdrawal, onRequestDiscard }) {
  const onlineProduct = useOnlineProductInfo(product?.barcode);
  if (!product) return null;
  const productName = onlineProduct.name || product.name;
  const imageUrl = onlineProduct.imageUri || product.imageUrl;
  const dailyConsumption = consumptionByBarcode[product.barcode];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.productDetailScreen}>
        <View style={styles.productDetailHeader}>
          <TouchableOpacity
            style={styles.productDetailClose}
            onPress={onClose}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Fechar detalhes do produto"
          >
            <Ionicons name="close" size={28} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.productDetailContent}>
          <ProductImage imageUrl={imageUrl} large />

          <View style={styles.productDetailInfo}>
            <Text style={styles.productDetailName}>{productName}</Text>
            <Text style={styles.productDetailBarcode}>Codigo de barras: {product.barcode}</Text>
            <View style={styles.productDetailQuantityBox}>
              <Text style={styles.productDetailQuantityLabel}>Quantidade total</Text>
              <Text style={styles.productDetailQuantity}>{product.totalQuantity} un.</Text>
            </View>
          </View>

          <View style={styles.productLotsSection}>
            <Text style={styles.productLotsTitle}>Lotes por validade</Text>
            {product.lots.map((lot, index) => (
              <TouchableOpacity
                key={`${lot.id}-${index}`}
                style={[
                  styles.productLotCard,
                  index === 0 ? styles.productLotCardPriority : null,
                  lot.expired ? styles.productLotCardExpired : null
                ]}
                activeOpacity={lot.expired ? 0.82 : 1}
                disabled={!lot.expired}
                accessibilityRole={lot.expired ? 'button' : 'text'}
                accessibilityLabel={`Lote ${lot.batch}. Quantidade ${lot.quantity}. Validade ${formatDate(lot.expiresAt)}`}
                accessibilityHint={lot.expired ? 'Toque para descartar o produto vencido' : undefined}
                onPress={() => onRequestDiscard(lot)}
              >
                <View style={styles.productLotHeader}>
                  <TouchableOpacity
                    style={styles.productLotBatchButton}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`${lot.expired ? 'Descartar' : 'Retirar'} lote ${lot.batch}`}
                    onPress={() => (lot.expired ? onRequestDiscard(lot) : onRequestWithdrawal(lot))}
                  >
                    <Text style={styles.productLotBatch}>{lot.batch}</Text>
                  </TouchableOpacity>
                  <Text style={styles.productLotConsumption}>
                    {formatDailyConsumption(dailyConsumption)}
                  </Text>
                  {index === 0 ? (
                    <TouchableOpacity
                      style={styles.productLotWithdrawButton}
                      activeOpacity={0.75}
                      disabled={lot.quantity <= 0}
                      accessibilityRole="button"
                      accessibilityLabel={`${lot.expired ? 'Descartar' : 'Retirar'} lote prioritario ${lot.batch}`}
                      accessibilityState={{ disabled: lot.quantity <= 0 }}
                      onPress={() => (lot.expired ? onRequestDiscard(lot) : onRequestWithdrawal(lot))}
                    >
                      <Text style={styles.productLotWithdrawButtonText}>
                        {lot.expired ? 'Descarte' : 'Retirada'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {lot.expired ? (
                  <Text style={styles.productLotExpiredText}>Produto vencido</Text>
                ) : index === 0 ? (
                  <Text style={styles.productLotPriority}>Proximo vencimento</Text>
                ) : null}
                <View style={styles.productLotMeta}>
                  <Text style={styles.productLotText}>Validade: {formatDate(lot.expiresAt)}</Text>
                  <Text style={styles.productLotQuantity}>{lot.quantity} un.</Text>
                </View>
                <Text style={styles.productLotLocation}>Localizacao: {lot.location}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState([]);
  const [consumptionByBarcode, setConsumptionByBarcode] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSort, setSelectedSort] = useState('');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [withdrawalLot, setWithdrawalLot] = useState(null);
  const [withdrawalQuantity, setWithdrawalQuantity] = useState('1');
  const [savingWithdrawal, setSavingWithdrawal] = useState(false);
  const [discardLot, setDiscardLot] = useState(null);
  const [savingDiscard, setSavingDiscard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const products = useMemo(() => groupProducts(entries, selectedSort || 'name'), [entries, selectedSort]);
  const selectedSortOption = stockSortOptions.find((option) => option.key === selectedSort);
  const dashboardSubtitle = selectedSort
    ? stockSortDescriptions[selectedSort]
    : 'Produtos em ordem alfabética';

  async function loadProducts({ showRefresh = false } = {}) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const api = createApiClient();
      const data = await api.listStockEntries();
      setEntries(Array.isArray(data) ? data : []);
      const consumptionData = await api.listDailyConsumption().catch(() => []);
      setConsumptionByBarcode(toConsumptionMap(consumptionData));
    } catch (stockEntriesError) {
      try {
        const api = createApiClient();
        const data = await api.listCurrentStock();
        setEntries(Array.isArray(data) ? data : []);
        setConsumptionByBarcode({});
      } catch (currentStockError) {
        setEntries([]);
        setConsumptionByBarcode({});
        setError(currentStockError.message || stockEntriesError.message || 'Nao foi possivel carregar os produtos.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;

    const updatedProduct = products.find((product) => product.barcode === selectedProduct.barcode);
    setSelectedProduct(updatedProduct || null);
  }, [products, selectedProduct?.barcode]);

  function openWithdrawal(product, lot) {
    if (!product || !lot) return;

    if (hasEarlierAvailableLot(product, lot)) {
      Alert.alert(
        'Priorize o vencimento',
        'Existem lotes deste produto com vencimento mais proximo. Retire esses lotes primeiro.'
      );
      return;
    }

    setWithdrawalLot(lot);
    setWithdrawalQuantity('1');
  }

  function closeWithdrawal() {
    if (savingWithdrawal) return;
    setWithdrawalLot(null);
    setWithdrawalQuantity('1');
  }

  function openDiscard(lot) {
    if (!lot) return;
    setDiscardLot(lot);
  }

  function closeDiscard() {
    if (savingDiscard) return;
    setDiscardLot(null);
  }

  function reduceLotQuantity(lotId, quantity) {
    setEntries((currentEntries) => currentEntries
      .map((entry) => {
        const entryId = String(valueFrom(entry, ['id_produto', 'stock_entry_id', 'id'], ''));
        if (entryId !== lotId) return entry;

        const currentQuantity = toNumber(valueFrom(entry, ['quantidade', 'quantity_available', 'quantity', 'current_stock'], 0));
        const nextQuantity = Math.max(0, currentQuantity - quantity);

        return {
          ...entry,
          quantidade: nextQuantity,
          quantity_available: nextQuantity,
          quantity: nextQuantity,
          current_stock: nextQuantity
        };
      })
      .filter((entry) => toNumber(valueFrom(entry, ['quantidade', 'quantity_available', 'quantity', 'current_stock'], 0)) > 0));
  }

  async function confirmWithdrawal() {
    if (!withdrawalLot) return;

    const quantity = toNumber(withdrawalQuantity);

    if (quantity <= 0) {
      Alert.alert('Quantidade invalida', 'Informe uma quantidade maior que zero para retirar.');
      return;
    }

    if (quantity > withdrawalLot.quantity) {
      Alert.alert('Estoque insuficiente', 'A retirada nao pode ser maior que a quantidade disponivel no lote.');
      return;
    }

    setSavingWithdrawal(true);

    try {
      const api = createApiClient();
      await api.createExit({
        productId: withdrawalLot.id,
        quantity
      });

      reduceLotQuantity(withdrawalLot.id, quantity);

      setWithdrawalLot(null);
      setWithdrawalQuantity('1');
      Alert.alert('Retirada registrada', 'A quantidade do lote foi reduzida no estoque.');
    } catch (withdrawalError) {
      Alert.alert('Nao foi possivel retirar', withdrawalError.message || 'Tente novamente em instantes.');
    } finally {
      setSavingWithdrawal(false);
    }
  }

  async function confirmDiscard() {
    if (!discardLot) return;

    const quantity = toNumber(discardLot.quantity);
    if (quantity <= 0) {
      setDiscardLot(null);
      return;
    }

    setSavingDiscard(true);

    try {
      const api = createApiClient();
      await api.createExit({
        productId: discardLot.id,
        quantity
      });

      reduceLotQuantity(discardLot.id, quantity);
      setDiscardLot(null);
      Alert.alert('Descarte registrado', 'O estoque do lote vencido foi zerado.');
    } catch (discardError) {
      Alert.alert('Nao foi possivel descartar', discardError.message || 'Tente novamente em instantes.');
    } finally {
      setSavingDiscard(false);
    }
  }

  return (
    <View style={styles.dashboard}>
      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardHeaderRow}>
          <Text style={styles.dashboardTitle}>Estoque</Text>
          <TouchableOpacity
            style={[styles.stockSortButton, styles.alertFilterChipActive]}
            activeOpacity={0.75}
            onPress={() => setSortMenuVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Selecionar filtro de ordenação do estoque"
          >
            <Text style={styles.stockSortButtonText} numberOfLines={2}>
              {selectedSortOption?.label || 'Selecione um filtro'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.primaryText} />
          </TouchableOpacity>
        </View>
        <Text style={styles.dashboardSubtitle}>{dashboardSubtitle}</Text>
      </View>

      <Modal visible={sortMenuVisible} transparent animationType="fade" onRequestClose={() => setSortMenuVisible(false)} accessibilityViewIsModal>
        <TouchableOpacity style={styles.selectOverlay} activeOpacity={1} onPress={() => setSortMenuVisible(false)}>
          <View style={[styles.selectMenu, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}>
            <Text style={styles.selectMenuTitle}>Ordenar estoque</Text>
            {stockSortOptions.map((option) => {
              const active = selectedSort === option.key;

              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.selectOption, active ? styles.selectOptionActive : null]}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={`Ordenar por ${option.label}`}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    setSelectedSort(option.key);
                    setSortMenuVisible(false);
                  }}
                >
                  <Text style={styles.selectOptionText}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark" size={22} color={colors.icon} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.dashboardState}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Carregando produtos" />
          <Text style={styles.dashboardStateText}>Carregando produtos...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.barcode}
          numColumns={2}
          columnWrapperStyle={styles.productGridRow}
          contentContainerStyle={styles.productGridContent}
          refreshing={refreshing}
          onRefresh={() => loadProducts({ showRefresh: true })}
          ListEmptyComponent={
            <View style={styles.dashboardState}>
              <Ionicons name="cube-outline" size={38} color={colors.placeholder} />
              <Text style={styles.dashboardStateText}>
                {error || 'Nenhum produto cadastrado.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={setSelectedProduct}
              onRequestWithdrawal={openWithdrawal}
            />
          )}
        />
      )}

      <ProductDetail
        product={selectedProduct}
        consumptionByBarcode={consumptionByBarcode}
        onClose={() => setSelectedProduct(null)}
        onRequestWithdrawal={(lot) => openWithdrawal(selectedProduct, lot)}
        onRequestDiscard={openDiscard}
      />
      <WithdrawalModal
        lot={withdrawalLot}
        quantity={withdrawalQuantity}
        saving={savingWithdrawal}
        onChangeQuantity={setWithdrawalQuantity}
        onCancel={closeWithdrawal}
        onConfirm={confirmWithdrawal}
      />
      <DiscardModal
        lot={discardLot}
        saving={savingDiscard}
        onCancel={closeDiscard}
        onConfirm={confirmDiscard}
      />
    </View>
  );
}
