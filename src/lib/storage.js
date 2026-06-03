export const STORAGE_KEY = "graham-analyzer:companies";

async function readClaudeStorage(key) {
  if (typeof window === "undefined" || !window.storage?.get) return null;
  const result = await window.storage.get(key);
  if (result?.value !== undefined) return JSON.parse(result.value);
  if (typeof result === "string") return JSON.parse(result);
  return result ?? null;
}

async function writeClaudeStorage(key, value) {
  if (typeof window === "undefined" || !window.storage?.set) return false;
  await window.storage.set(key, JSON.stringify(value));
  return true;
}

export async function loadCompanies(key = STORAGE_KEY) {
  try {
    const cloudValue = await readClaudeStorage(key);
    if (cloudValue) return cloudValue;
  } catch {
    // Fall through to localStorage.
  }

  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCompanies(companies, key = STORAGE_KEY) {
  try {
    if (await writeClaudeStorage(key, companies)) return true;
  } catch {
    // Fall through to localStorage.
  }

  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.setItem(key, JSON.stringify(companies));
    return true;
  } catch {
    return false;
  }
}
