import React, { useEffect, useState } from 'react';
import { Page, Store, Product } from '../types';
import { ArrowLeft, Star, Package, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { ProductCard } from '../components/ProductCard';

interface StoreDetailProps {
  store: Store;
  setPage: (page: Page) => void;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const StoreDetail: React.FC<StoreDetailProps> = ({ store, setPage, onProductClick, onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(store.rating || 0);
  const [ratingCount, setRatingCount] = useState(store.ratingCount || 0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreContent = async () => {
      try {
        const [{ data: productsData, error: productsError }, { data: ratingsData, error: ratingsError }, { data: authData }] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('store_id', store.id),
          supabase
            .from('store_ratings')
            .select('buyer_id, rating')
            .eq('store_id', store.id),
          supabase.auth.getUser(),
        ]);

        if (productsError) throw productsError;
        if (ratingsError) throw ratingsError;

        setProducts((productsData || []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image_url,
          category: p.category,
          size: p.size,
          store: store.name,
          description: p.description,
          tags: p.tags || [],
        })));

        const ratings = ratingsData || [];
        const totalRatings = ratings.reduce((sum, entry) => sum + entry.rating, 0);
        setRatingCount(ratings.length);
        setAverageRating(ratings.length > 0 ? Number((totalRatings / ratings.length).toFixed(1)) : 0);

        const currentUserId = authData.data.user?.id;
        setUserRating(currentUserId ? (ratings.find((entry) => entry.buyer_id === currentUserId)?.rating ?? null) : null);
      } catch (error) {
        console.error('Error fetching store content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreContent();
  }, [store.id, store.name]);

  const handleRateStore = async (rating: number) => {
    setSubmittingRating(true);
    setRatingError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRatingError('Please sign in as a buyer to rate this store.');
        return;
      }

      const { error } = await supabase
        .from('store_ratings')
        .upsert(
          {
            store_id: store.id,
            buyer_id: user.id,
            rating,
          },
          {
            onConflict: 'store_id,buyer_id',
          }
        );

      if (error) throw error;

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('store_ratings')
        .select('buyer_id, rating')
        .eq('store_id', store.id);

      if (ratingsError) throw ratingsError;

      const ratings = ratingsData || [];
      const totalRatings = ratings.reduce((sum, entry) => sum + entry.rating, 0);

      setUserRating(rating);
      setRatingCount(ratings.length);
      setAverageRating(ratings.length > 0 ? Number((totalRatings / ratings.length).toFixed(1)) : 0);
    } catch (error: any) {
      console.error('Error rating store:', error);
      setRatingError(error.message || 'Failed to submit your rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className={`w-full min-h-[18rem] md:h-64 ${store.color || 'bg-ink'} relative flex items-end p-5 md:p-8 border-b-4 border-ink`}>
        {store.image && (
          <img src={store.image} alt={store.name} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />
        )}

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end gap-4 md:gap-6 text-white pr-4">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-white text-ink border-4 border-ink flex items-center justify-center font-headline font-black text-2xl md:text-3xl neo-shadow">
            {store.initials}
          </div>

          <div className="mb-1 md:mb-2">
            <h1 className="font-headline font-black text-3xl sm:text-4xl md:text-5xl uppercase tracking-tighter leading-none">{store.name}</h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 font-label font-bold text-xs md:text-sm mt-2 opacity-80">
              <span className="flex items-center gap-1"><Star size={14} fill="currentColor" /> {averageRating.toFixed(1)} RATING</span>
              <span className="hidden sm:inline">•</span>
              <span>{ratingCount} RATINGS</span>
              <span className="hidden sm:inline">•</span>
              <span>{products.length} PRODUCTS</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setPage('stores')}
          className="absolute top-4 left-4 md:top-8 md:left-8 bg-white text-ink p-2.5 md:p-3 border-4 border-ink neo-shadow hover:bg-tertiary hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-6 md:space-y-8">
          <div className="bg-white p-5 sm:p-6 md:p-8 border-4 border-ink neo-shadow">
            <p className="font-label font-bold text-[11px] uppercase tracking-[0.25em] text-ink/45 mb-3">Store Description</p>
            <p className="font-body font-bold text-sm sm:text-base text-ink/70 leading-relaxed max-w-4xl">
              {store.description}
            </p>

            <div className="mt-6 pt-5 border-t-2 border-ink/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-headline font-black text-xl sm:text-2xl uppercase">Rate This Store</p>
                  <p className="font-body font-bold text-ink/55 text-sm mt-1">
                    Your rating updates the live store score shown across the marketplace.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      disabled={submittingRating}
                      onClick={() => handleRateStore(starValue)}
                      className={`p-2 border-2 border-ink transition-colors ${starValue <= (userRating || 0) ? 'bg-primary-container text-ink' : 'bg-white text-ink/45 hover:bg-secondary-container'}`}
                    >
                      <Star size={18} fill={starValue <= (userRating || 0) ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              {ratingError && (
                <p className="mt-3 font-label font-bold text-[11px] uppercase tracking-widest text-tertiary">
                  {ratingError}
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-headline font-black text-2xl md:text-3xl uppercase mb-6 md:mb-8 flex items-center gap-3">
              <Package size={28} /> LATEST DROPS
            </h2>

            {loading ? (
              <div className="flex justify-center py-20 md:py-24">
                <Loader2 className="animate-spin text-ink" size={48} />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => onProductClick(product)}
                    onAdd={() => onAddToCart(product)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 md:py-24 border-4 border-dashed border-ink/20 bg-white/50">
                <p className="font-headline font-black text-xl md:text-2xl text-ink/30 uppercase">NO PRODUCTS LISTED YET</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
