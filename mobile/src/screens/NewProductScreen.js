import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  findNodeHandle
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createApiClient } from '../api/client';
import { fetchProductInfoByBarcode } from '../api/productLookup';
import { colors, styles } from './Styles';

const barcodeTypes = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'code93',
  'itf14'
];

const initialNewProduct = {
  nomeProduto: '',
  numeroLote: '',
  dataValidade: '',
  quantidade: '',
  estoqueMinimo: '0',
  categoria: 'outros',
  armazenamento: 'seco',
  localizacao: 'Estoque'
};

const initialNewLot = {
  numeroLote: '',
  dataValidade: '',
  quantidade: '',
  localizacao: 'Estoque'
};

const categoryOptions = [
  { label: 'Alimentos de longa duração', value: 'alimenticios longa duracao' },
  { label: 'Alimentos de curta duração', value: 'alimenticios curta duracao' },
  { label: 'Limpeza', value: 'limpeza' },
  { label: 'Higiene pessoal', value: 'higiene pessoal' },
  { label: 'Outros', value: 'outros' }
];

const storageOptions = [
  { label: 'Seco', value: 'seco' },
  { label: 'Geladeira', value: 'geladeira' }
];

const defaultInputScrollExtra = 96;
const compactInputScrollExtra = 24;
const keyboardAwareExtraHeight = 40;
const keyboardAwareExtraScrollHeight = 16;

function formatDate(value) {
  if (!value) return 'Sem validade';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem validade';
  return date.toLocaleDateString('pt-BR');
}

function maskDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function toIsoDate(value) {
  const [day, month, year] = value.split('/');
  if (!day || !month || !year || year.length !== 4) return null;

  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== Number(year)) return null;
  if (date.getMonth() + 1 !== Number(month)) return null;
  if (date.getDate() !== Number(day)) return null;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function normalizeBarcode(value) {
  return value.replace(/[^\w-]/g, '').trim();
}

function sortByExpiration(lots) {
  return [...lots].sort((a, b) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime());
}

function showSaveSuccess(message, onConfirm) {
  Alert.alert('Pronto', message, [{ text: 'OK', onPress: onConfirm }]);
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', inputRef, onFocus }) {
  return (
    <View style={styles.newProductField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={styles.newProductInput}
        onFocus={onFocus}
        accessibilityLabel={label}
        accessibilityHint={placeholder}
      />
    </View>
  );
}

function SelectField({ label, value, options, onChange, onOpen, onClose }) {
  const insets = useSafeAreaInsets();
  const fieldRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  function openSelect() {
    Keyboard.dismiss();
    onOpen?.(fieldRef);
    setOpen(true);
  }

  function closeSelect() {
    setOpen(false);
    onClose?.(fieldRef);
  }

  return (
    <View ref={fieldRef} style={styles.newProductField}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.newProductSelect}
        onPress={openSelect}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label || 'Não selecionado' }}
        accessibilityHint="Toque para abrir as opções"
      >
        <Text style={styles.newProductSelectText}>{selected?.label || 'Selecione'}</Text>
        <Ionicons name="chevron-down" size={22} color={colors.icon} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={closeSelect} accessibilityViewIsModal>
        <TouchableOpacity style={styles.selectOverlay} activeOpacity={1} onPress={closeSelect}>
          <View style={[styles.selectMenu, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}>
            <Text style={styles.selectMenuTitle}>{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectOption,
                  option.value === value ? styles.selectOptionActive : null
                ]}
                onPress={() => {
                  onChange(option.value);
                  closeSelect();
                }}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: option.value === value }}
              >
                <Text style={styles.selectOptionText}>{option.label}</Text>
                {option.value === value ? <Ionicons name="checkmark" size={22} color={colors.icon} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function NumberStepper({ label, value, onChange, placeholder = '0', minimum = 0, onFocus }) {
  const numericValue = Number(value || 0);

  function step(delta) {
    const nextValue = Math.max(minimum, numericValue + delta);
    onChange(String(nextValue));
  }

  return (
    <View style={styles.newProductField}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => step(-1)}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label}`}
        >
          <Ionicons name="remove" size={24} color={colors.icon} />
        </TouchableOpacity>
        <TextInput
          value={value}
          onChangeText={(nextValue) => onChange(nextValue.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          style={styles.stepperInput}
          onFocus={onFocus}
          accessibilityLabel={label}
          accessibilityValue={{ text: value || '0' }}
        />
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => step(1)}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
        >
          <Ionicons name="add" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function NewProductScreen({ onProductSaved }) {
  const newProductNameInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [barcode, setBarcode] = useState('');
  const [step, setStep] = useState('barcode');
  const [lots, setLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [lotIncreaseQuantity, setLotIncreaseQuantity] = useState('');
  const [newProduct, setNewProduct] = useState(initialNewProduct);
  const [newLot, setNewLot] = useState(initialNewLot);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineProduct, setOnlineProduct] = useState({ name: '', imageUri: '', error: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const orderedLots = useMemo(() => sortByExpiration(lots), [lots]);
  const existingProduct = orderedLots[0];
  const selectedLot = orderedLots.find((lot) => lot.id_produto === selectedLotId);

  function getScrollMethod(methodName) {
    return scrollViewRef.current?.props?.[methodName] || scrollViewRef.current?.[methodName];
  }

  function scrollInputIntoView(event, extraHeight = defaultInputScrollExtra) {
    const node = typeof event?.target === 'number' ? event.target : findNodeHandle(event?.target);
    const scrollToFocusedInput = getScrollMethod('scrollToFocusedInput');

    if (!node || !scrollToFocusedInput) return;

    setTimeout(() => scrollToFocusedInput(node, extraHeight, 0), 80);
    setTimeout(() => scrollToFocusedInput(node, extraHeight, 0), 300);
  }

  function scrollCompactInputIntoView(event) {
    scrollInputIntoView(event, compactInputScrollExtra);
  }

  function scrollElementIntoView(elementRef, delay = 120) {
    const element = elementRef?.current || elementRef;
    const scrollIntoView = getScrollMethod('scrollIntoView');

    if (!element || !scrollIntoView) return;

    setTimeout(() => {
      scrollIntoView(element, {
        getScrollPosition: (parentLayout, childLayout, contentOffset) => ({
          x: 0,
          y: Math.max(0, childLayout.y - parentLayout.y + contentOffset.y - 24),
          animated: true
        })
      });
    }, delay);
  }

  useEffect(() => {
    if (step !== 'newProduct') return undefined;

    const focusTimer = setTimeout(() => {
      newProductNameInputRef.current?.focus();
    }, 250);

    return () => clearTimeout(focusTimer);
  }, [step]);

  function updateNewProduct(field, value) {
    setNewProduct((current) => ({ ...current, [field]: value }));
  }

  function updateNewLot(field, value) {
    setNewLot((current) => ({ ...current, [field]: value }));
  }

  function resetFlow(nextBarcode = '') {
    setBarcode(nextBarcode);
    setStep('barcode');
    setLots([]);
    setSelectedLotId(null);
    setLotIncreaseQuantity('');
    setNewProduct(initialNewProduct);
    setNewLot(initialNewLot);
    setOnlineProduct({ name: '', imageUri: '', error: '' });
    setMessage('');
    setError('');
  }

  async function loadOnlineProduct(cleanBarcode) {
    setOnlineLoading(true);

    try {
      const productInfo = await fetchProductInfoByBarcode(cleanBarcode);
      setOnlineProduct(productInfo);

      if (productInfo.name) {
        setNewProduct((current) => ({
          ...current,
          nomeProduto: current.nomeProduto || productInfo.name
        }));
      }

      return productInfo;
    } finally {
      setOnlineLoading(false);
    }
  }

  async function checkBarcode(value = barcode) {
    const cleanBarcode = normalizeBarcode(value);
    if (!cleanBarcode) {
      setError('Digite ou leia o código de barras.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const api = createApiClient();
      const [data, productInfo] = await Promise.all([
        api.listProductsByBarcode(cleanBarcode),
        loadOnlineProduct(cleanBarcode)
      ]);
      setBarcode(cleanBarcode);
      setLots(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || !data.length) {
        setNewProduct((current) => ({
          ...current,
          nomeProduto: productInfo.name || current.nomeProduto
        }));
      }
      setStep(Array.isArray(data) && data.length ? 'existingProduct' : 'newProduct');
    } catch (requestError) {
      setError(requestError.message || 'Não foi possível buscar este código de barras. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function openScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    setScanning(true);
    setCameraVisible(true);
  }

  function handleBarcodeScanned(result) {
    if (!scanning) return;

    const scannedBarcode = normalizeBarcode(String(result.data || ''));
    setScanning(false);
    setCameraVisible(false);
    setBarcode(scannedBarcode);
    checkBarcode(scannedBarcode);
  }

  function validateNewProduct() {
    if (!newProduct.nomeProduto.trim()) return 'Preencha o nome do produto.';
    if (!newProduct.numeroLote.trim()) return 'Preencha o número do lote.';
    if (!newProduct.dataValidade.trim()) return 'Preencha a data de validade.';
    if (!toIsoDate(newProduct.dataValidade)) return 'Digite a validade no formato dia/mês/ano.';
    if (!Number(newProduct.quantidade)) return 'Digite uma quantidade maior que zero.';
    return '';
  }

  function validateNewLot() {
    if (!newLot.numeroLote.trim()) return 'Preencha o número do lote.';
    if (!newLot.dataValidade.trim()) return 'Preencha a data de validade.';
    if (!toIsoDate(newLot.dataValidade)) return 'Digite a validade no formato dia/mês/ano.';
    if (!Number(newLot.quantidade)) return 'Digite uma quantidade maior que zero.';
    if (!newLot.localizacao.trim()) return 'Preencha o local onde o lote fica guardado.';
    return '';
  }

  async function saveNewProduct() {
    const validation = validateNewProduct();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const api = createApiClient();
      await api.createProduct({
        ...newProduct,
        codigoBarras: barcode,
        dataValidade: toIsoDate(newProduct.dataValidade),
        quantidade: Number(newProduct.quantidade),
        estoqueMinimo: Number(newProduct.estoqueMinimo || 0)
      });
      await checkBarcode(barcode);
      setMessage('Produto cadastrado com sucesso.');
      showSaveSuccess('Produto cadastrado com sucesso.', onProductSaved);
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o produto. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function saveNewLot() {
    const validation = validateNewLot();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const existingBatch = orderedLots.find((lot) => lot.numero_lote.trim().toLowerCase() === newLot.numeroLote.trim().toLowerCase());

      if (existingBatch) {
        setError('Este lote já está cadastrado no estoque.');
        setSaving(false);
        return;
      }

      const api = createApiClient();
      await api.createProduct({
        nomeProduto: existingProduct.nome_produto,
        codigoBarras: barcode,
        numeroLote: newLot.numeroLote,
        dataValidade: toIsoDate(newLot.dataValidade),
        quantidade: Number(newLot.quantidade),
        estoqueMinimo: Number(existingProduct.estoque_minimo || 0),
        categoria: existingProduct.categoria || 'outros',
        armazenamento: existingProduct.armazenamento || 'seco',
        localizacao: newLot.localizacao
      });

      setNewLot(initialNewLot);
      await checkBarcode(barcode);
      setMessage('Lote cadastrado com sucesso.');
      showSaveSuccess('Lote cadastrado com sucesso.');
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível salvar o lote. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function increaseSelectedLotQuantity() {
    if (!selectedLot) {
      setError('Escolha um lote para adicionar quantidade.');
      return;
    }

    if (!Number(lotIncreaseQuantity)) {
      setError('Digite uma quantidade maior que zero para adicionar.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const api = createApiClient();
      await api.increaseProductQuantity(selectedLot.id_produto, {
        quantidade: Number(lotIncreaseQuantity)
      });
      setLotIncreaseQuantity('');
      await checkBarcode(barcode);
      setSelectedLotId(selectedLot.id_produto);
      setMessage('Quantidade do lote atualizada com sucesso.');
      showSaveSuccess('Quantidade do lote atualizada com sucesso.');
    } catch (saveError) {
      setError(saveError.message || 'Não foi possível atualizar o lote. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.newProductScreen}>
      <View style={styles.newProductHeader}>
        <View style={styles.newProductHeaderText}>
          <Text style={styles.newProductTitle}>Cadastrar produto</Text>
          <Text style={styles.newProductSubtitle}>Leia ou digite o código de barras</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        innerRef={(ref) => {
          scrollViewRef.current = ref;
        }}
        enableOnAndroid
        enableAutomaticScroll
        enableResetScrollToCoords={false}
        extraHeight={keyboardAwareExtraHeight}
        extraScrollHeight={keyboardAwareExtraScrollHeight}
        keyboardOpeningTime={250}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.newProductScroll}
      >
        <View style={styles.newProductPanel}>
          <Field
            label="Código de barras"
            value={barcode}
            onChangeText={(value) => {
              setBarcode(normalizeBarcode(value));
              setStep('barcode');
              setLots([]);
              setMessage('');
              setError('');
            }}
            keyboardType="number-pad"
            placeholder="Digite ou leia o código"
            onFocus={scrollInputIntoView}
          />

          <View style={styles.newProductActions}>
            <TouchableOpacity
              style={styles.newProductScanButton}
              onPress={openScanner}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Ler código de barras com a câmera"
            >
              <Ionicons name="camera-outline" size={24} color={colors.primaryText} />
              <Text style={styles.newProductScanButtonText}>Ler com a câmera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newProductSecondaryButton, loading ? styles.buttonDisabled : null]}
              onPress={() => checkBarcode()}
              activeOpacity={0.82}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Buscar produto pelo código de barras"
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color={colors.primary} accessibilityLabel="Buscando código de barras" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={22} color={colors.icon} />
                  <Text style={styles.newProductSecondaryButtonText}>Buscar produto</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {permission && !permission.granted ? (
            <Text style={styles.newProductPermissionText}>
              Permita o acesso à câmera para ler o código pelo celular.
            </Text>
          ) : null}

          {(onlineLoading || onlineProduct.imageUri || onlineProduct.name || onlineProduct.error) ? (
            <View style={styles.onlineProductCard}>
              {onlineLoading ? (
                <ActivityIndicator color={colors.primary} accessibilityLabel="Buscando dados do produto na internet" />
              ) : onlineProduct.imageUri ? (
                <Image
                  source={{ uri: onlineProduct.imageUri }}
                  style={styles.onlineProductImage}
                  resizeMode="cover"
                  accessible
                  accessibilityLabel={`Imagem do produto ${onlineProduct.name || barcode}`}
                />
              ) : (
                <View style={styles.onlineProductImagePlaceholder}>
                  <Ionicons name="image-outline" size={28} color={colors.placeholder} />
                </View>
              )}
              <View style={styles.onlineProductInfo}>
                <Text style={styles.onlineProductLabel}>Dados encontrados na internet</Text>
                <Text style={styles.onlineProductName} numberOfLines={2}>
                  {onlineProduct.name || onlineProduct.error || 'Imagem do produto encontrada na internet.'}
                </Text>
              </View>
            </View>
          ) : null}

          {message ? <Text style={styles.newProductSuccessText} accessibilityLiveRegion="polite">{message}</Text> : null}
          {error ? <Text style={styles.error} accessibilityLiveRegion="assertive">{error}</Text> : null}
        </View>

        {step === 'newProduct' ? (
          <View style={styles.newProductPanel}>
            <Text style={styles.newProductSectionTitle}>Produto novo</Text>
            <Field
              label="Nome do produto"
              value={newProduct.nomeProduto}
              onChangeText={(value) => updateNewProduct('nomeProduto', value)}
              placeholder="Ex: Arroz 5kg"
              inputRef={newProductNameInputRef}
              onFocus={scrollInputIntoView}
            />
            <Field label="Número do lote" value={newProduct.numeroLote} onChangeText={(value) => updateNewProduct('numeroLote', value)} placeholder="Ex: Lote A" onFocus={scrollInputIntoView} />
            <Field label="Data de validade" value={newProduct.dataValidade} onChangeText={(value) => updateNewProduct('dataValidade', maskDate(value))} placeholder="dia/mês/ano" keyboardType="number-pad" onFocus={scrollInputIntoView} />
            <NumberStepper label="Quantidade" value={newProduct.quantidade} onChange={(value) => updateNewProduct('quantidade', value)} onFocus={scrollInputIntoView} />
            <NumberStepper label="Estoque mínimo para aviso" value={newProduct.estoqueMinimo} onChange={(value) => updateNewProduct('estoqueMinimo', value)} onFocus={scrollInputIntoView} />
            <SelectField label="Categoria" value={newProduct.categoria} options={categoryOptions} onChange={(value) => updateNewProduct('categoria', value)} onOpen={scrollElementIntoView} onClose={scrollElementIntoView} />
            <SelectField label="Tipo de armazenamento" value={newProduct.armazenamento} options={storageOptions} onChange={(value) => updateNewProduct('armazenamento', value)} onOpen={scrollElementIntoView} onClose={scrollElementIntoView} />
            <Field
              label="Localização"
              value={newProduct.localizacao}
              onChangeText={(value) => updateNewProduct('localizacao', value)}
              placeholder="Estoque"
              onFocus={scrollCompactInputIntoView}
            />

            <TouchableOpacity
              style={styles.newProductScanButton}
              onPress={saveNewProduct}
              disabled={saving}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Salvar produto"
              accessibilityState={{ disabled: saving }}
            >
              {saving ? <ActivityIndicator color={colors.primaryText} accessibilityLabel="Salvando produto" /> : <Text style={styles.newProductScanButtonText}>Salvar produto</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'existingProduct' ? (
          <View style={styles.newProductPanel}>
            <View style={styles.existingProductHeader}>
              <View>
                <Text style={styles.newProductSectionTitle}>{existingProduct?.nome_produto}</Text>
                <Text style={styles.existingProductSubtitle}>{barcode}</Text>
              </View>
            </View>

            <Text style={styles.existingProductLabel}>Lotes deste produto</Text>
            {orderedLots.map((lot) => {
              const selected = selectedLotId === lot.id_produto;

              return (
                <TouchableOpacity
                  key={lot.id_produto}
                  style={[styles.existingLotCard, selected ? styles.existingLotCardSelected : null]}
                  onPress={() => {
                    setSelectedLotId(lot.id_produto);
                    setLotIncreaseQuantity('');
                    setError('');
                    setMessage('');
                  }}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar lote ${lot.numero_lote}, quantidade ${lot.quantidade}`}
                  accessibilityState={{ selected }}
                >
                  <View>
                    <Text style={styles.productLotBatch}>{lot.numero_lote}</Text>
                    <Text style={styles.productLotText}>Validade: {formatDate(lot.data_validade)}</Text>
                  </View>
                  <Text style={styles.productLotQuantity}>{lot.quantidade} unidades</Text>
                </TouchableOpacity>
              );
            })}

            {selectedLot ? (
              <View style={styles.existingLotEditPanel}>
                <Text style={styles.existingProductLabel}>Adicionar unidades ao lote</Text>
                <Text style={styles.productLotText}>
                  {selectedLot.numero_lote} - quantidade atual: {selectedLot.quantidade} unidades
                </Text>
                <NumberStepper
                  label="Quantidade para adicionar"
                  value={lotIncreaseQuantity}
                  onChange={setLotIncreaseQuantity}
                  placeholder="0"
                  minimum={0}
                  onFocus={scrollCompactInputIntoView}
                />
                <TouchableOpacity
                  style={styles.newProductScanButton}
                  onPress={increaseSelectedLotQuantity}
                  disabled={saving}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel="Adicionar quantidade ao lote selecionado"
                  accessibilityState={{ disabled: saving }}
                >
                  {saving ? <ActivityIndicator color={colors.primaryText} accessibilityLabel="Atualizando lote" /> : <Text style={styles.newProductScanButtonText}>Adicionar ao lote</Text>}
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.newProductSectionTitle}>Cadastrar novo lote</Text>
            <Field label="Número do lote" value={newLot.numeroLote} onChangeText={(value) => updateNewLot('numeroLote', value)} placeholder="Obrigatório" onFocus={scrollInputIntoView} />
            <Field label="Data de validade" value={newLot.dataValidade} onChangeText={(value) => updateNewLot('dataValidade', maskDate(value))} placeholder="dia/mês/ano" keyboardType="number-pad" onFocus={scrollInputIntoView} />
            <NumberStepper label="Quantidade" value={newLot.quantidade} onChange={(value) => updateNewLot('quantidade', value)} placeholder="Obrigatório" minimum={0} onFocus={scrollInputIntoView} />
            <Field label="Localização do lote" value={newLot.localizacao} onChangeText={(value) => updateNewLot('localizacao', value)} placeholder="Ex: Prateleira A" onFocus={scrollCompactInputIntoView} />

            <TouchableOpacity
              style={styles.newProductScanButton}
              onPress={saveNewLot}
              disabled={saving}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Salvar novo lote"
              accessibilityState={{ disabled: saving }}
            >
              {saving ? <ActivityIndicator color={colors.primaryText} accessibilityLabel="Salvando novo lote" /> : <Text style={styles.newProductScanButtonText}>Salvar novo lote</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newProductSecondaryButton}
              onPress={() => resetFlow()}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Ler outro código de barras"
            >
              <Ionicons name="barcode-outline" size={22} color={colors.icon} />
              <Text style={styles.newProductSecondaryButtonText}>Ler outro código</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAwareScrollView>

      <Modal visible={cameraVisible} animationType="slide" onRequestClose={() => setCameraVisible(false)} accessibilityViewIsModal>
        <View style={styles.scannerScreen}>
          <CameraView
            style={styles.scannerCamera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes }}
            onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
          />

          <View style={styles.scannerTopBar}>
            <TouchableOpacity
              style={styles.scannerCloseButton}
              onPress={() => setCameraVisible(false)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Fechar leitor de código de barras"
            >
              <Ionicons name="close" size={28} color={colors.primaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.scannerFrame}>
            <View style={styles.scannerFrameBox} />
            <Text style={styles.scannerText}>Aponte a câmera para o código de barras</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
