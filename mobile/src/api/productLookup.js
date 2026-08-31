import { createApiClient } from './client';

const cache = new Map();

function readFirst(source, fields) {
  const field = fields.find((name) => source?.[name] !== undefined && source?.[name] !== null);
  return field ? source[field] : null;
}

function normalizeProductApiResponse(data) {
  const mimeType = data?.mime_type || data?.mimeType || 'image/jpeg';
  const imageBase64 = data?.imagem_base64 || data?.image_base64 || data?.base64;
  const imageUri = data?.imageUri || data?.image_uri || (imageBase64 ? `data:${mimeType};base64,${imageBase64}` : '');
  const name = readFirst(data, [
    'nome',
    'nome_produto',
    'produto',
    'name',
    'descricao',
    'description',
    'title'
  ]);
  const rawError = String(data?.error || '').trim();
  const normalizedError = rawError
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const productNotFound = normalizedError.includes('404')
    || normalizedError.includes('not found')
    || normalizedError.includes('nao encontrado');

  return {
    name: name ? String(name) : '',
    imageUri,
    error: productNotFound ? 'Produto não encontrado. Digite os dados.' : rawError
  };
}

export async function fetchProductInfoByBarcode(barcode) {
  const cleanBarcode = String(barcode || '').trim();
  if (!cleanBarcode) return { name: '', imageUri: '', error: '' };

  if (cache.has(cleanBarcode)) {
    return cache.get(cleanBarcode);
  }

  try {
    const api = createApiClient();
    const data = await api.lookupProductOnline(cleanBarcode);
    const productInfo = normalizeProductApiResponse(data);
    cache.set(cleanBarcode, productInfo);
    return productInfo;
  } catch (error) {
    return {
      name: '',
      imageUri: '',
      error: 'Não foi possível buscar os dados do produto na internet. Preencha os dados manualmente.'
    };
  }
}
