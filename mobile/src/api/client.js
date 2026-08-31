const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
const localApiUrl = process.env.EXPO_PUBLIC_LOCAL_API_URL || 'http://192.168.0.104:3333';
const cloudApiUrl = process.env.EXPO_PUBLIC_CLOUD_API_URL || '';
const placeholderHosts = ['seu-backend', 'example.com'];
let activeBaseUrl = null;

function isUsableUrl(url) {
  return Boolean(url) && !placeholderHosts.some((host) => url.includes(host));
}

function getCandidateBaseUrls(preferredBaseUrl) {
  const urls = [preferredBaseUrl, apiUrl, cloudApiUrl, localApiUrl].filter(isUsableUrl);
  return [...new Set(urls)];
}

function shouldFallback(response) {
  return response.status >= 500;
}

export function createApiClient({ baseUrl = activeBaseUrl } = {}) {
  async function request(path, options = {}) {
    const candidates = getCandidateBaseUrls(baseUrl);
    const errors = [];

    for (const candidateBaseUrl of candidates) {
      const url = `${candidateBaseUrl}${path}`;

      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
          }
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
          if (shouldFallback(response)) {
            errors.push(data?.message || `API indisponivel em ${candidateBaseUrl}`);
            continue;
          }

          const error = new Error(data?.message || 'Erro na comunicacao com a API.');
          error.details = data?.details || data?.issues;
          error.noFallback = true;
          throw error;
        }

        activeBaseUrl = candidateBaseUrl;
        return data;
      } catch (error) {
        if (error.noFallback) throw error;
        errors.push(error.message);
      }
    }

    throw new Error(`Nao foi possivel acessar a API na nuvem nem localmente. Verifique Render, backend local, banco Neon/local e rede. Detalhes: ${errors.join(' | ')}`);
  }

  return {
    getStatus: () => request('/api/status'),
    listCurrentStock: () => request('/api/stock/current'),
    listStockEntries: () => request('/api/stock/entries'),
    listStockMovements: () => request('/api/stock/movements'),
    listDailyConsumption: () => request('/api/stock/daily-consumption'),
    listAlerts: () => request('/api/alerts'),
    refreshAlerts: () => request('/api/alerts/refresh', { method: 'POST' }),
    listProducts: () => request('/api/products'),
    listProductsByBarcode: (barcode) => request(`/api/products/barcode/${encodeURIComponent(barcode)}`),
    lookupProductOnline: (barcode) => request(`/api/product-lookup/${encodeURIComponent(barcode)}`),
    createProduct: (payload) => request('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    increaseProductQuantity: (productId, payload) => request(`/api/products/${encodeURIComponent(productId)}/increase-quantity`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    listUnits: () => request('/api/units'),
    listCategories: () => request('/api/categories'),
    listDonors: () => request('/api/donors'),
    createDonor: (payload) => request('/api/donors', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    listWarehouses: () => request('/api/warehouses'),
    createWarehouse: (payload) => request('/api/warehouses', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    listLocations: () => request('/api/locations'),
    createLocation: (payload) => request('/api/locations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    createEntry: (payload) => request('/api/stock/entries', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    createExit: (payload) => request('/api/stock/exits', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  };
}
