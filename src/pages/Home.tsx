import React, { useEffect, useState } from 'react';
import { Page, Product, Store, AdminProduct } from '../types';
import { StoreCard } from '../components/StoreCard';
import { ProductCard } from '../components/ProductCard';
import { Marquee } from '../components/Marquee';
import { ArrowRight, Search, Zap, Shield, Globe, Loader2, Star } from 'lucide-react';
import { supabase } from '../supabase';
import { fetchStoreMetrics } from '../lib/storeMetrics';
import bg1 from '../../images/bg3.jpeg';

interface HomeProps {
  setPage: (page: Page) => void;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSearch: (query: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setPage, onProductClick, onAddToCart, onSearch }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Stores
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('*')
          .limit(4);
        
        if (storesError) throw storesError;

        // Fetch Products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, stores(name)')
          .limit(8);

        if (productsError) throw productsError;

        // Fetch Admin Products
        const { data: adminData, error: adminError } = await supabase
          .from('admin_products')
          .select('*')
          .eq('active', true)
          .limit(4);

        if (adminError && adminError.code !== '42P01') throw adminError; // Ignore if table missing

        const storeMetrics = await fetchStoreMetrics((storesData || []).map(store => store.id));

        setStores(storesData.map(s => ({
          id: s.id,
          name: s.name,
          initials: s.initials,
          color: s.color,
          category: s.category || 'clothing',
          tags: s.tags || [],
          description: s.description,
          itemCount: storeMetrics.get(s.id)?.itemCount || 0,
          rating: storeMetrics.get(s.id)?.rating || 0,
          ratingCount: storeMetrics.get(s.id)?.ratingCount || 0,
          image: s.image_url
        })));

        setProducts(productsData.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image_url,
          category: p.category,
          size: p.size,
          store: p.stores?.name || 'Unknown Store',
          description: p.description,
          tags: p.tags || []
        })));

        if (adminData) {
          setAdminProducts(adminData.map(p => ({
            ...p,
            store: 'VIKTHRIFTS OFFICIAL',
            image: p.image_url,
            size: p.size
          })));
        }

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] md:min-h-screen bg-ink text-white overflow-hidden border-b-4 border-ink">
        <div className="absolute inset-0 z-0">
          <img 
            src={bg1} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="absolute inset-x-0 bottom-20 md:bottom-[25%] z-10 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            {/* <div className="bg-primary-container text-ink font-label font-bold text-xs px-3 py-1 mb-8 neo-shadow-sm rotate-[-2deg] inline-block">
              CURATED ARCHIVAL STREETWEAR
            </div> */}
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full sm:w-auto">
              {/* <button 
                onClick={() => setPage('auth-choice')}
                className="bg-primary-container text-ink font-headline font-black text-xl px-12 py-6 border-4 border-ink neo-shadow hover:neo-shadow-lg active-press flex items-center gap-3 transition-all"
              >
                JOIN THE COLLECTIVE <ArrowRight size={24} />
              </button> */}
              
              <button 
                onClick={() => setPage('stores')}
                className="w-full sm:w-auto justify-center bg-transparent uppercase text-white font-headline font-black text-base sm:text-xl px-6 sm:px-12 py-4 sm:py-6 border border-white neo-shadow hover:neo-shadow-lg active-press flex items-center gap-3 transition-all"
              >
                SHOP COLLECTIOnS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* VIKTHRIFTS Haul Section (Admin Products) */}
      {adminProducts.length > 0 && (
        <section className="py-10 sm:py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full border-b-4 border-ink">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-12 gap-4 sm:gap-6">
            <div className="max-w-2xl">
              <span className="font-label font-bold text-[11px] sm:text-sm text-tertiary mb-2 block uppercase tracking-[0.25em]">OFFICIAL DROPS</span>
              <h2 className="font-headline font-black text-3xl sm:text-5xl md:text-6xl tracking-tighter uppercase leading-none">VIKTHRIFTS HAUL</h2>
              <p className="font-body font-bold text-sm sm:text-base text-ink/55 mt-3 sm:mt-4 max-w-xl">
                Fresh official pieces from the in-house archive, styled to feel cleaner and easier to browse on mobile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {adminProducts.map(product => (
              <div key={product.id} className="w-full">
                <ProductCard 
                  product={product} 
                  onAdd={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  onClick={() => onProductClick(product)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Marquee */}
      {/* <Marquee text="NEW DROPS EVERY FRIDAY • WORLDWIDE SHIPPING • AUTHENTICITY GUARANTEED • ARCHIVAL PIECES" /> */}

      {/* Featured Stores */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 gap-4 md:gap-6">
          <div>
            <span className="font-label font-bold text-sm text-tertiary mb-2 block uppercase tracking-widest">TOP RATED</span>
            <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tighter uppercase">FEATURED STORES</h2>
          </div>
          <button 
            onClick={() => setPage('stores')}
            className="font-label font-bold text-sm border-b-4 border-ink hover:text-tertiary transition-colors pb-1"
          >
            VIEW ALL STORES
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="animate-spin text-ink" size={48} />
            </div>
          ) : stores.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white border-4 border-ink neo-shadow">
              <p className="font-headline font-black text-xl uppercase text-ink/30">NO STORES YET</p>
            </div>
          ) : (
            stores.map(store => (
              <StoreCard key={store.id} store={store} onClick={() => setPage('stores')} />
            ))
          )}
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-secondary-container border-y-4 border-ink py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-headline font-black text-3xl md:text-6xl tracking-tighter mb-8 uppercase">FIND YOUR NEXT GRAIL</h2>
          <div className="relative flex items-center bg-white border-4 border-ink p-3 md:p-4 neo-shadow-lg">
            <Search size={24} className="text-ink/30 ml-2 md:ml-4 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="SEARCH BY BRAND, CATEGORY, OR STORE..." 
              className="w-full bg-transparent border-none outline-none px-3 md:px-6 font-headline font-bold text-base sm:text-xl md:text-2xl placeholder:text-ink/20"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch(searchVal);
              }}
            />
            <button 
              onClick={() => onSearch(searchVal)}
              className="bg-ink text-white font-headline font-black px-8 py-3 hover:bg-tertiary transition-colors hidden md:block"
            >
              SEARCH
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {['#VINTAGE', '#TECHWEAR', '#DENIM', '#ACCESSORIES', '#FOOTWEAR'].map(tag => (
              <span 
                key={tag} 
                onClick={() => onSearch(tag)}
                className="bg-white border-2 border-ink px-4 py-2 font-label font-bold text-sm neo-shadow-sm hover:bg-primary-container cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 gap-4 md:gap-6">
          <div>
            <span className="font-label font-bold text-sm text-tertiary mb-2 block uppercase tracking-widest">CURATED SELECTION</span>
            <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tighter uppercase">HOT DROPS</h2>
          </div>
          <button className="font-label font-bold text-sm border-b-4 border-ink hover:text-tertiary transition-colors pb-1">
            VIEW ALL PRODUCTS
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="animate-spin text-ink" size={48} />
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white border-4 border-ink neo-shadow">
              <p className="font-headline font-black text-xl uppercase text-ink/30">NO PRODUCTS YET</p>
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="w-full">
                <ProductCard 
                  product={product} 
                  onAdd={(e) => {
                    e.stopPropagation();
                    onAddToCart(product);
                  }}
                  onClick={() => onProductClick(product)}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-20 md:mt-32 bg-primary-container border-4 border-ink p-8 md:p-20 neo-shadow-lg text-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-headline font-black text-3xl md:text-6xl tracking-tighter mb-4 md:mb-6 uppercase">WANT TO OPEN A STORE?</h2>
          <p className="font-body text-base md:text-xl text-ink/70 max-w-2xl mx-auto mb-8 md:mb-10">
            Join 500+ independent creators and archival collectors selling their pieces on VIKTHRIFTS.
          </p>
          <button 
            onClick={() => setPage('auth-seller')}
            className="w-full sm:w-auto bg-ink text-white font-headline font-black text-base md:text-xl px-6 md:px-12 py-4 md:py-5 border-4 border-ink neo-shadow hover:bg-tertiary transition-all active-press"
          >
            BECOME A SELLER
          </button>
        </div>
        
        {/* Decorative background text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-headline font-black text-[20vw] opacity-[0.03] pointer-events-none whitespace-nowrap">
          SELL SELL SELL SELL
        </div>
      </div>
    </div>
  );
};
