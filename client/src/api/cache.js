const memoryCache = new Map();
const inFlightRequests = new Map();

const buildCacheId = (storage, key) => `${storage}:${key}`;

const getStorage = (storage = 'session') => {
  try {
    return storage === 'local' ? window.localStorage : window.sessionStorage;
  } catch (error) {
    return null;
  }
};

const readStoredRecord = (cacheId, storage) => {
  const storageApi = getStorage(storage);

  if (!storageApi) {
    return null;
  }

  try {
    const rawValue = storageApi.getItem(cacheId);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
};

const writeStoredRecord = (cacheId, storage, record) => {
  const storageApi = getStorage(storage);

  if (!storageApi) {
    return;
  }

  try {
    storageApi.setItem(cacheId, JSON.stringify(record));
  } catch (error) {
    // Ignore storage write failures and keep the in-memory cache.
  }
};

const deleteStoredRecord = (cacheId, storage) => {
  const storageApi = getStorage(storage);

  if (!storageApi) {
    return;
  }

  try {
    storageApi.removeItem(cacheId);
  } catch (error) {
    // Ignore storage cleanup failures.
  }
};

const getCacheRecord = (key, storage = 'session') => {
  const cacheId = buildCacheId(storage, key);
  const cachedRecord = memoryCache.get(cacheId);

  if (cachedRecord) {
    return cachedRecord;
  }

  const storedRecord = readStoredRecord(cacheId, storage);

  if (storedRecord) {
    memoryCache.set(cacheId, storedRecord);
  }

  return storedRecord;
};

export const getCachedResource = (
  key,
  { storage = 'session', maxAgeMs = Infinity, allowStale = true } = {},
) => {
  const record = getCacheRecord(key, storage);

  if (!record) {
    return null;
  }

  const ageMs = Math.max(0, Date.now() - Number(record.updatedAt || 0));
  const isStale = Number.isFinite(maxAgeMs) ? ageMs > maxAgeMs : false;

  if (isStale && !allowStale) {
    return null;
  }

  return {
    data: record.data,
    updatedAt: record.updatedAt,
    ageMs,
    isStale,
  };
};

export const setCachedResource = (key, data, { storage = 'session' } = {}) => {
  const cacheId = buildCacheId(storage, key);
  const record = {
    data,
    updatedAt: Date.now(),
  };

  memoryCache.set(cacheId, record);
  writeStoredRecord(cacheId, storage, record);
  return data;
};

export const fetchCachedResource = async (key, fetcher, { storage = 'session' } = {}) => {
  const cacheId = buildCacheId(storage, key);

  if (inFlightRequests.has(cacheId)) {
    return inFlightRequests.get(cacheId);
  }

  const request = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      setCachedResource(key, data, { storage });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheId);
    });

  inFlightRequests.set(cacheId, request);
  return request;
};

export const invalidateCachedResource = (key, { storage = 'session' } = {}) => {
  const cacheId = buildCacheId(storage, key);
  memoryCache.delete(cacheId);
  inFlightRequests.delete(cacheId);
  deleteStoredRecord(cacheId, storage);
};

export const invalidateCachedResourcePrefix = (prefix, { storage = 'session' } = {}) => {
  const cachePrefix = buildCacheId(storage, prefix);
  const cacheKeys = Array.from(memoryCache.keys()).filter((cacheId) => cacheId.startsWith(cachePrefix));

  cacheKeys.forEach((cacheId) => {
    memoryCache.delete(cacheId);
    inFlightRequests.delete(cacheId);
    deleteStoredRecord(cacheId, storage);
  });

  const storageApi = getStorage(storage);

  if (!storageApi) {
    return;
  }

  try {
    for (let index = storageApi.length - 1; index >= 0; index -= 1) {
      const key = storageApi.key(index);

      if (key && key.startsWith(cachePrefix)) {
        storageApi.removeItem(key);
      }
    }
  } catch (error) {
    // Ignore storage iteration failures.
  }
};
