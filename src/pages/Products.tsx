import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product, ProductCollectionMode } from '../types';
import { supabase } from '../supabase';

interface ProductsProps {
  mode: ProductCollectionMode;
  onBack: () => void;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const PAGE_SIZE = 8;
const SIZE_OPTIONS = ['all', 'S', 'M', 'L', 'XL', '2XL'] as const;
const PRICE_SORT_OPTIONS = ['newest', 'low-to-high', 'high-to-low'] as const;

type SizeFilter = (typeof SIZE_OPTIONS)[number];
type PriceSort = (typeof PRICE_SORT_OPTIONS)[number];

const getStoreName = (stores: { name: string }[] | { name: string } | null | undefined) => {
  if (Array.isArray(stores)) return stores[0]?.name || 'Unknown Store';
  return stores?.name || 'Unknown Store';
};

export const Products: React.FC<ProductsProps> = ({ mode, onBack, onProductClick, onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all');
  const [priceSort, setPriceSort] = useState<PriceSort>('newest');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadProducts = useCallback(async (nextOffset: number, reset = false) => {
    const setLoadingState = reset ? setLoading : setLoadingMore;
    setLoadingState(true);

    try {
      const sortColumn = priceSort === 'newest' ? 'created_at' : 'price';
      const isAscending = priceSort === 'low-to-high';

      if (mode === 'official') {
        let query = supabase
          .from('admin_products')
          .select('*')
          .eq('active', true)
          .order(sortColumn, { ascending: priceSort === 'newest' ? false : isAscending });

        if (sizeFilter !== 'all') {
          query = query.eq('size', sizeFilter);
        }

        const { data, error } = await query.range(nextOffset, nextOffset + PAGE_SIZE - 1);

        if (error) throw error;

        const mappedProducts = (data || []).map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url,
          category: product.category,
          size: product.size,
          store: 'VIKTHRIFTS OFFICIAL',
          description: product.description,
          tags: product.tags || [],
        }));

        setProducts((currentProducts) => reset ? mappedProducts : [...currentProducts, ...mappedProducts]);
        setHasMore(mappedProducts.length === PAGE_SIZE);
        setOffset(nextOffset + mappedProducts.length);
        return;
      }

      let query = supabase
        .from('products')
        .select('id, name, price, image_url, category, size, description, tags, stores(name)')
        .order(sortColumn, { ascending: priceSort === 'newest' ? false : isAscending });

      if (sizeFilter !== 'all') {
        query = query.eq('size', sizeFilter);
      }

      const { data, error } = await query.range(nextOffset, nextOffset + PAGE_SIZE - 1);

      if (error) throw error;

      const mappedProducts = (data || []).map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        category: product.category,
        size: product.size,
        store: getStoreName(product.stores),
        description: product.description,
        tags: product.tags || [],
      }));

      setProducts((currentProducts) => reset ? mappedProducts : [...currentProducts, ...mappedProducts]);
      setHasMore(mappedProducts.length === PAGE_SIZE);
      setOffset(nextOffset + mappedProducts.length);
    } catch (error) {
      console.error(`Error fetching ${mode} products:`, error);
      setHasMore(false);
    } finally {
      setLoadingState(false);
    }
  }, [mode, priceSort, sizeFilter]);

  useEffect(() => {
    setProducts([]);
    setHasMore(true);
    setOffset(0);
    void loadProducts(0, true);
  }, [loadProducts]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadProducts(offset);
        }
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadProducts, loading, loadingMore, offset]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || products.length === 0) return;

    const pageIsScrollable = document.documentElement.scrollHeight > window.innerHeight + 40;
    if (!pageIsScrollable) {
      void loadProducts(offset);
    }
  }, [hasMore, loadProducts, loading, loadingMore, offset, products.length]);

  const isOfficial = mode === 'official';

  return (
    <div className="min-h-screen py-10 md:py-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12">
        <div>
          <p className="font-label font-bold text-xs uppercase tracking-[0.25em] text-ink/50 mb-3">
            {isOfficial ? 'Official Drops' : 'Marketplace'}
          </p>
          <h1 className="font-headline font-black text-4xl md:text-7xl tracking-tighter uppercase">
            {isOfficial ? 'VIKTHRIFTS HAUL' : 'ALL PRODUCTS'}
          </h1>
          <p className="font-body font-bold text-sm sm:text-base text-ink/60 mt-3 max-w-2xl">
            {isOfficial
              ? 'Browse every official VIKTHRIFTS product in one place.'
              : 'Browse all available products from every store, with 8 more products loading as you scroll.'}
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 border-4 border-ink bg-white px-5 py-3 font-label font-bold text-xs uppercase tracking-widest neo-shadow"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        <div className="bg-white border-4 border-ink px-4 py-3 neo-shadow">
          <label className="block font-label font-bold text-[11px] uppercase tracking-widest text-ink/50 mb-2">
            Filter By Size
          </label>
          <select
            value={sizeFilter}
            onChange={(event) => setSizeFilter(event.target.value as SizeFilter)}
            className="w-full bg-transparent font-headline font-black uppercase outline-none"
          >
            <option value="all">All Sizes</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="2XL">2XL</option>
          </select>
        </div>

        <div className="bg-white border-4 border-ink px-4 py-3 neo-shadow">
          <label className="block font-label font-bold text-[11px] uppercase tracking-widest text-ink/50 mb-2">
            Filter By Price
          </label>
          <select
            value={priceSort}
            onChange={(event) => setPriceSort(event.target.value as PriceSort)}
            className="w-full bg-transparent font-headline font-black uppercase outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="low-to-high">Low To High</option>
            <option value="high-to-low">High To Low</option>
          </select>
        </div>

        <div className="bg-secondary-container border-4 border-ink px-4 py-3 neo-shadow">
          <p className="font-label font-bold text-[11px] uppercase tracking-widest text-ink/50 mb-2">
            Loaded Products
          </p>
          <p className="font-headline font-black text-2xl uppercase">{products.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-ink" size={56} />
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={(event) => {
                  event.stopPropagation();
                  onAddToCart(product);
                }}
                onClick={() => onProductClick(product)}
              />
            ))}
          </div>

          {loadingMore && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-ink" size={32} />
            </div>
          )}

          {hasMore && <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />}
        </>
      ) : (
        <div className="text-center py-24 border-4 border-dashed border-ink/20">
          <p className="font-headline font-black text-3xl text-ink/30 uppercase">NO PRODUCTS FOUND</p>
        </div>
      )}
    </div>
  );
};
