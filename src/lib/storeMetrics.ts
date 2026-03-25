import { supabase } from '../supabase';

export interface StoreMetric {
  itemCount: number;
  rating: number;
  ratingCount: number;
}

export const DEFAULT_STORE_METRICS: StoreMetric = {
  itemCount: 0,
  rating: 0,
  ratingCount: 0,
};

export const fetchStoreMetrics = async (storeIds: string[]) => {
  const uniqueStoreIds = [...new Set(storeIds.filter(Boolean))];
  const metricsMap = new Map<string, StoreMetric>();

  if (uniqueStoreIds.length === 0) {
    return metricsMap;
  }

  const [{ data: ratingsData, error: ratingsError }, { data: productsData, error: productsError }] = await Promise.all([
    supabase
      .from('store_ratings')
      .select('store_id, rating')
      .in('store_id', uniqueStoreIds),
    supabase
      .from('products')
      .select('store_id')
      .in('store_id', uniqueStoreIds),
  ]);

  if (ratingsError) throw ratingsError;
  if (productsError) throw productsError;

  uniqueStoreIds.forEach((storeId) => {
    metricsMap.set(storeId, { itemCount: 0, rating: 0, ratingCount: 0 });
  });

  (productsData || []).forEach((product) => {
    const current = metricsMap.get(product.store_id) || { ...DEFAULT_STORE_METRICS };
    current.itemCount += 1;
    metricsMap.set(product.store_id, current);
  });

  const ratingTotals = new Map<string, { total: number; count: number }>();

  (ratingsData || []).forEach((entry) => {
    const current = ratingTotals.get(entry.store_id) || { total: 0, count: 0 };
    current.total += entry.rating;
    current.count += 1;
    ratingTotals.set(entry.store_id, current);
  });

  ratingTotals.forEach((value, storeId) => {
    const current = metricsMap.get(storeId) || { ...DEFAULT_STORE_METRICS };
    current.ratingCount = value.count;
    current.rating = value.count > 0 ? Number((value.total / value.count).toFixed(1)) : 0;
    metricsMap.set(storeId, current);
  });

  return metricsMap;
};
