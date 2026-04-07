export function readStorageValue(key) {
  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return rawValue;
  }
}

export function writeStorageValue(key, value) {
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearStorage(key) {
  window.localStorage.removeItem(key);
}
