export const WATCHLIST_FAVORITES_KEY = "graham-watchlist:favorites";

export function normalizeFavorites(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((ticker) => String(ticker).trim().toUpperCase()).filter(Boolean))].sort();
}

export function toggleFavorite(favorites, ticker) {
  const normalized = normalizeFavorites(favorites);
  const key = String(ticker || "").trim().toUpperCase();
  if (!key) return normalized;
  if (normalized.includes(key)) return normalized.filter((item) => item !== key);
  return normalizeFavorites([...normalized, key]);
}

export function sortFavoritesFirst(results, favorites) {
  const favoriteSet = new Set(normalizeFavorites(favorites));
  return [...results].sort((a, b) => {
    const aFav = favoriteSet.has(String(a.ticker).toUpperCase());
    const bFav = favoriteSet.has(String(b.ticker).toUpperCase());
    if (aFav !== bFav) return aFav ? -1 : 1;
    return 0;
  });
}
